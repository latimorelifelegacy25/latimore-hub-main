import { BRAND } from '@/lib/brand'

const DEFAULT_BOOKING_FORM_URL = 'https://latimorelifelegacy.fillout.com/latimorelifelegacy'
const bookingFormUrl = process.env.NEXT_PUBLIC_BOOKING_FORM_URL?.trim() || DEFAULT_BOOKING_FORM_URL

export default function BookPage() {
  return (
    <main className="min-h-screen bg-[#0B0F17] px-4 py-10 text-white sm:py-14">
      <section className="mx-auto max-w-5xl text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#C9A25F]">
          Complimentary Consultation
        </p>
        <h1 className="mt-4 text-3xl font-bold tracking-tight sm:text-5xl">
          Secure Your Legacy
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-[#D7DCE5] sm:text-base">
          Book a Latimore Life & Legacy consultation to talk through protection,
          retirement, and legacy planning options.
        </p>
      </section>

      <section className="mx-auto mt-8 max-w-5xl">
        <iframe
          src={bookingFormUrl}
          title="Book a Latimore Life & Legacy consultation"
          className="min-h-[900px] w-full rounded-xl border-0 bg-white shadow-2xl"
          loading="eager"
          allow="camera; microphone; fullscreen"
        />
      </section>

      <p className="mx-auto mt-6 max-w-5xl text-center text-sm text-[#A9B1BE]">
        Prefer to call or text?{' '}
        <a href={BRAND.phoneHref} className="font-semibold text-[#C9A25F] underline-offset-4 hover:underline">
          {BRAND.phone}
        </a>{' '}
        ·{' '}
        <a href={`mailto:${BRAND.email}`} className="font-semibold text-[#C9A25F] underline-offset-4 hover:underline">
          {BRAND.email}
        </a>
      </p>
    </main>
  )
}
