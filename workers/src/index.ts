import { Worker } from "@notionhq/workers";
import * as Builder from "@notionhq/workers/builder";
import * as Schema from "@notionhq/workers/schema";

const worker = new Worker();
export default worker;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const BASE_URL = process.env.APP_BASE_URL ?? "";
const SECRET = process.env.INTERNAL_API_SECRET ?? "";

type Inquiry = { stage: string; productInterest: string | null } | null;

interface ContactRow {
	id: string;
	firstName: string | null;
	lastName: string | null;
	email: string | null;
	phone: string | null;
	county: string | null;
	primarySourceType: string;
	nextFollowUpAt: string | null;
	updatedAt: string;
	inquiry: Inquiry;
}

interface ContactsResponse {
	contacts: ContactRow[];
	hasMore: boolean;
	page: number;
}

async function fetchContacts(
	page: number,
	updatedSince?: string,
): Promise<ContactsResponse> {
	const url = new URL(`${BASE_URL}/api/internal/contacts`);
	url.searchParams.set("page", String(page));
	if (updatedSince) url.searchParams.set("updatedSince", updatedSince);

	const res = await fetch(url.toString(), {
		headers: { "x-internal-secret": SECRET },
	});

	if (!res.ok) {
		throw new Error(`Contacts API error: ${res.status} ${await res.text()}`);
	}

	return res.json() as Promise<ContactsResponse>;
}

function stageToStatus(stage: string): string {
	const map: Record<string, string> = {
		New: "Lead",
		Attempted_Contact: "Lead",
		Qualified: "Negotiating",
		Booked: "Negotiating",
		Sold: "Active",
		Follow_Up: "Active",
		Lost: "Lost",
	};
	return map[stage] ?? "Lead";
}

function sourceToLabel(source: string): string | null {
	const map: Record<string, string> = {
		WEBSITE_DIRECT: "🌐 Website Form",
		GOOGLE_ADS: "🎯 Google Ad",
		QR_CAMPAIGN: "🌐 Website Form",
		EMAIL_CAMPAIGN: "📧 Email Campaign",
		EMAIL_INBOUND: "📧 Email Campaign",
		REFERRAL: "🤝 Referral",
		PARTNER_ORG: "🤝 Referral",
		PHONE_INBOUND: "📞 Cold Outreach",
		EVENT: "👥 Community Event",
		WORKSHOP: "🏢 Networking Event",
		FILLOUT: "🌐 Website Form",
	};
	return map[source] ?? null;
}

function interestToLabel(interest: string | null): string | null {
	if (!interest) return null;
	const map: Record<string, string> = {
		Mortgage_Protection: "Mortgage Protection",
		Final_Expense: "Final Expense",
		Term_Life: "Income Replacement",
		Whole_Life: "Income Replacement",
		Child_Whole_Life: "College Funding",
		IUL: "Tax-Advantaged Wealth Building",
		Annuity: "Retirement Income",
		Retirement: "Retirement Income",
		Business: "Business Succession",
	};
	return map[interest] ?? null;
}

function toUpsert(c: ContactRow) {
	const displayName =
		[c.firstName, c.lastName].filter(Boolean).join(" ") ||
		c.email ||
		c.phone ||
		"Unknown";

	const props: Record<string, unknown> = {
		Name: Builder.title(displayName),
		"CRM ID": Builder.richText(c.id),
		Status: Builder.select(
			c.inquiry ? stageToStatus(c.inquiry.stage) : "Lead",
		),
	};

	if (c.email) props["Email Address"] = Builder.email(c.email);
	if (c.phone) props["Phone Number"] = Builder.phoneNumber(c.phone);

	const source = sourceToLabel(c.primarySourceType);
	if (source) props["Lead Source"] = Builder.select(source);

	const need = interestToLabel(c.inquiry?.productInterest ?? null);
	if (need) props["Primary Need"] = Builder.select(need);

	if (c.county) props["Notes"] = Builder.richText(`County: ${c.county}`);

	if (c.nextFollowUpAt)
		props["Next Follow-up"] = Builder.date(c.nextFollowUpAt.split("T")[0]);

	return { type: "upsert" as const, key: c.id, properties: props };
}

// ---------------------------------------------------------------------------
// Database — schema must match property shapes used in sync-contact.ts
// ---------------------------------------------------------------------------

const contacts = worker.database("contacts", {
	type: "managed",
	initialTitle: "CRM Contacts",
	primaryKeyProperty: "CRM ID",
	schema: {
		properties: {
			Name: Schema.title(),
			"CRM ID": Schema.richText(),
			"Email Address": Schema.email(),
			"Phone Number": Schema.phoneNumber(),
			Status: Schema.select([
				{ name: "Lead" },
				{ name: "Negotiating" },
				{ name: "Active" },
				{ name: "Lost" },
			]),
			"Lead Source": Schema.select([
				{ name: "🌐 Website Form" },
				{ name: "🎯 Google Ad" },
				{ name: "📧 Email Campaign" },
				{ name: "🤝 Referral" },
				{ name: "📞 Cold Outreach" },
				{ name: "👥 Community Event" },
				{ name: "🏢 Networking Event" },
			]),
			"Primary Need": Schema.select([
				{ name: "Mortgage Protection" },
				{ name: "Final Expense" },
				{ name: "Income Replacement" },
				{ name: "College Funding" },
				{ name: "Tax-Advantaged Wealth Building" },
				{ name: "Retirement Income" },
				{ name: "Business Succession" },
			]),
			"Next Follow-up": Schema.date(),
			Notes: Schema.richText(),
		},
	},
});

// ---------------------------------------------------------------------------
// Rate limiter
// ---------------------------------------------------------------------------

const crmApi = worker.pacer("crmApi", {
	allowedRequests: 10,
	intervalMs: 1000,
});

// ---------------------------------------------------------------------------
// Backfill sync — full replace, run manually or to catch deletes
// ntn workers sync state reset contactsBackfill && ntn workers sync trigger contactsBackfill
// ---------------------------------------------------------------------------

type BackfillState = { page: number };

worker.sync("contactsBackfill", {
	database: contacts,
	mode: "replace",
	schedule: "manual",
	execute: async (state: BackfillState | undefined) => {
		const page = state?.page ?? 1;
		await crmApi.wait();
		const { contacts: rows, hasMore } = await fetchContacts(page);

		return {
			changes: rows.map(toUpsert) as any,
			hasMore,
			nextState: hasMore ? { page: page + 1 } : undefined,
		};
	},
});

// ---------------------------------------------------------------------------
// Delta sync — incremental, picks up contacts updated since last cursor
// ---------------------------------------------------------------------------

type DeltaState = { cursor: string; page: number };

worker.sync("contactsDelta", {
	database: contacts,
	mode: "incremental",
	schedule: "5m",
	execute: async (state: DeltaState | undefined) => {
		const cursor = state?.cursor ?? new Date(0).toISOString();
		const page = state?.page ?? 1;
		// 15-second consistency buffer — never advance the cursor past
		// records the API may not have finished indexing yet.
		const maxCursor = new Date(Date.now() - 15_000).toISOString();

		await crmApi.wait();
		const { contacts: rows, hasMore } = await fetchContacts(page, cursor);

		if (hasMore) {
			// More pages remain within this cursor window — advance the page,
			// not the cursor, so the next execute() call doesn't refetch page 1.
			return {
				changes: rows.map(toUpsert) as any,
				hasMore: true,
				nextState: { cursor, page: page + 1 },
			};
		}

		const lastUpdatedAt = rows[rows.length - 1]?.updatedAt;
		const nextCursor = lastUpdatedAt
			? lastUpdatedAt < maxCursor ? lastUpdatedAt : maxCursor
			: cursor;

		return {
			changes: rows.map(toUpsert) as any,
			hasMore: false,
			nextState: { cursor: nextCursor, page: 1 },
		};
	},
});
