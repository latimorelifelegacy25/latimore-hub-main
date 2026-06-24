import { BRAND } from '@/lib/brand'

function withGoogleCalendarEmbedParam(url: string) {
  try {
    const schedulerUrl = new URL(url)
    if (!schedulerUrl.searchParams.has('gv')) {
      schedulerUrl.searchParams.set('gv', 'true')
    }
    return schedulerUrl.toString()
  } catch {
    return url
  }
}

export default function BookPage() {
  const appointmentUrl = withGoogleCalendarEmbedParam(BRAND.googleAppointmentScheduleUrl)

  return (
    <main className="min-h-screen bg-[#0E1A2B] px-4 py-12 text-white">
      <section className="mx-auto max-w-5xl rounded-3xl border border-white/10 bg-white/[0.04] p-6 shadow-2xl md:p-10">
        <div className="mb-8 max-w-3xl">
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.24em] text-[#C9A25F]">
            Latimore Life & Legacy
          </p>
          <h1 className="text-3xl font-bold tracking-tight md:text-5xl">
            Book your consultation
          </h1>
          <p className="mt-4 text-base leading-7 text-white/75 md:text-lg">
            Choose a time for a focused protection, retirement, or legacy planning conversation. If the scheduler does not load, call or text {BRAND.phone}.
          </p>
        </div>

        <div className="overflow-hidden rounded-2xl border border-white/10 bg-white">
          <iframe
            src={appointmentUrl}
            title="Latimore Life & Legacy appointment scheduling"
            className="h-[760px] w-full border-0"
            loading="lazy"
          />
        </div>

        <div className="mt-6 flex flex-col gap-3 text-sm text-white/75 sm:flex-row sm:items-center sm:justify-between">
          <p>
            Need help? Call or text{' '}
            <a className="font-semibold text-[#C9A25F]" href={`tel:+1${BRAND.phoneRaw}`}>
              {BRAND.phone}
            </a>
            {' '}or email{' '}
            <a className="font-semibold text-[#C9A25F]" href={`mailto:${BRAND.email}`}>
              {BRAND.email}
            </a>
            .
          </p>
          <a className="font-semibold text-[#C9A25F]" href={BRAND.filloutUrl}>
            Backup form
          </a>
        </div>
      </section>
    </main>
  )
}
