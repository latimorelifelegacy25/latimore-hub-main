import type { Contact, Inquiry } from '@prisma/client'
import { getNotionClient } from './client'
import { mapLeadSource, mapPipelineStage, mapProductInterest } from './mappers'

// ---------------------------------------------------------------------------
// Real-time single-contact upsert (fire-and-forget from hub service layer).
// Full batch sync is handled by the Notion Worker in workers/src/index.ts.
// The Notion database schema must match the property shapes built here.
// ---------------------------------------------------------------------------

export async function syncContactToNotion(
  contact: Contact,
  inquiry: Inquiry | null = null,
): Promise<void> {
  const notion = getNotionClient()
  const dbId = process.env.NOTION_CONTACT_DB_ID
  if (!notion || !dbId) return

  const properties = buildProperties(contact, inquiry)

  // Look up existing page by CRM ID (stable key — survives email changes)
  const { results } = await notion.databases.query({
    database_id: dbId,
    filter: { property: 'CRM ID', rich_text: { equals: contact.id } },
    page_size: 1,
  })

  const existingPageId = results[0]?.id ?? null

  if (existingPageId) {
    await notion.pages.update({ page_id: existingPageId, properties } as never)
  } else {
    await notion.pages.create({
      parent: { database_id: dbId },
      properties,
    } as never)
  }
}

// ---------------------------------------------------------------------------
// Build Notion property API shapes from a Contact + Inquiry pair.
// Keep in sync with the schema declared in workers/src/index.ts.
// ---------------------------------------------------------------------------

function buildProperties(contact: Contact, inquiry: Inquiry | null): Record<string, unknown> {
  const displayName =
    [contact.firstName, contact.lastName].filter(Boolean).join(' ') ||
    contact.email ||
    contact.phone ||
    'Unknown'

  const props: Record<string, unknown> = {
    Name: { title: [{ text: { content: displayName } }] },
    'CRM ID': { rich_text: [{ text: { content: contact.id } }] },
    Status: { status: { name: inquiry ? mapPipelineStage(inquiry.stage) : 'Lead' } },
  }

  if (contact.email) props['Email Address'] = { email: contact.email }
  if (contact.phone) props['Phone Number'] = { phone_number: contact.phone }

  const leadSource = mapLeadSource(contact.primarySourceType)
  if (leadSource) props['Lead Source'] = { select: { name: leadSource } }

  const primaryNeed = inquiry ? mapProductInterest(inquiry.productInterest) : null
  if (primaryNeed) props['Primary Need'] = { select: { name: primaryNeed } }

  if (contact.county) props['Notes'] = { rich_text: [{ text: { content: `County: ${contact.county}` } }] }

  if (contact.nextFollowUpAt) {
    props['Next Follow-up'] = {
      date: { start: contact.nextFollowUpAt.toISOString().split('T')[0] },
    }
  }

  return props
}
