export async function POST(req: NextRequest) {
  const limited = await rateLimit(req, 'lead');
  if (limited) return limited;

  try {
    const body = (await req.json()) as LeadBody;

    const lead: Required<LeadBody> = {
      name: clean(body.name, 150),
      phone: clean(body.phone, 50),
      email: clean(body.email, 150),
      promo: clean(body.promo, 100),
      interest: clean(body.interest, 150),
      source: clean(body.source || 'PAHS Sponsorship Page', 100),
      page: clean(body.page || 'pahs.latimorelifelegacy.com', 200),
    };

    if (!lead.name || !lead.phone || !lead.interest) {
      return NextResponse.json(
        { ok: false, error: 'Name, phone, and interest are required.' },
        { status: 400 }
      );
    }

    const target = process.env.PAHS_LEAD_TARGET ?? 'crm';

    // Run save + email in parallel
    const [saveResult, emailResult] = await Promise.allSettled([
      target === 'crm' ? saveToCRM(lead) : saveToSupabase(lead),
      sendNotification(lead),
    ]);

    const response: Record<string, unknown> = { ok: true, target };

    // CRM/Supabase result
    if (saveResult.status === 'fulfilled') {
      response.save = saveResult.value;
    } else {
      logger.error(
        { err: saveResult.reason },
        '[pahs-lead] CRM/Supabase save failed'
      );
      response.save = { ok: false, error: String(saveResult.reason) };
    }

    // Email result
    if (emailResult.status === 'fulfilled') {
      response.email = emailResult.value;
    } else {
      logger.error(
        { err: emailResult.reason },
        '[pahs-lead] Email notification failed'
      );
      response.email = { ok: false, error: String(emailResult.reason) };
    }

    return NextResponse.json(response);
  } catch (error) {
    logger.error(
      { err: error instanceof Error ? error.message : String(error) },
      '[pahs-lead] submission error'
    );

    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : 'Lead submission failed.',
      },
      { status: 500 }
    );
  }
}
