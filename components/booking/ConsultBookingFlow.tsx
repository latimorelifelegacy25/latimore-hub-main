'use client'

import Image from 'next/image'
import type { ReactNode } from 'react'
import { useEffect, useMemo, useState } from 'react'
import { buildFilloutParams } from '@/lib/lead'
import { BRAND } from '@/lib/brand'

type AvailabilityResponse = {
  ok: boolean
  timezone: string
  errorCode?: 'CALENDAR_DISCONNECTED' | 'CALENDAR_ERROR'
  days: Array<{ date: string; slots: string[] }>
  error?: string
}

type BookingResponse = {
  ok: boolean
  error?: string
  appointmentId?: string
  inquiryId?: string
  contactId?: string
  scheduledFor?: string
  meetingUrl?: string | null
}

type IntakeRequestResponse = {
  ok: boolean
  error?: string
  inquiryId?: string
  contactId?: string
}

type FormState = {
  firstName: string
  lastName: string
  email: string
  phone: string
  mailingAddress: string
  city: string
  state: string
  zip: string
  dateOfBirth: string
  jobTitle: string
  height: string
  weight: string
  maritalStatus: '' | 'Single' | 'Married' | 'Separated' | 'Widowed'
  childrenCount: string
  healthConditions: string
  tobaccoUse: '' | 'Yes' | 'No'
  familyCriticalIllness: '' | 'Yes' | 'No' | 'Unsure'
  monthlyBudget: string
  hasExistingInsurance: '' | 'Yes' | 'No'
  existingInsuranceTypes: string[]
  county: string
  productInterest: string
  notes: string
  leadSessionId: string
  pageUrl: string
  referrer: string
  source: string
  medium: string
  campaign: string
  term: string
  content: string
}

type CompletionState =
  | { kind: 'booked'; response: BookingResponse }
  | { kind: 'requested'; response: IntakeRequestResponse }

const NAVY = '#000835'
const GOLD = '#E1B54B'

const initialState: FormState = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  mailingAddress: '',
  city: '',
  state: 'PA',
  zip: '',
  dateOfBirth: '',
  jobTitle: '',
  height: '',
  weight: '',
  maritalStatus: '',
  childrenCount: '',
  healthConditions: '',
  tobaccoUse: '',
  familyCriticalIllness: '',
  monthlyBudget: '',
  hasExistingInsurance: '',
  existingInsuranceTypes: [],
  county: '',
  productInterest: 'General',
  notes: '',
  leadSessionId: '',
  pageUrl: '',
  referrer: '',
  source: '',
  medium: '',
  campaign: '',
  term: '',
  content: '',
}

const productOptions = [
  { value: 'General', label: 'General protection review' },
  { value: 'Mortgage_Protection', label: 'Mortgage protection' },
  { value: 'Final_Expense', label: 'Final expense' },
  { value: 'Term_Life', label: 'Term life with living benefits' },
  { value: 'Whole_Life', label: 'Whole life' },
  { value: 'Child_Whole_Life', label: 'Juvenile / child coverage' },
  { value: 'Accident', label: 'Accident protection' },
  { value: 'Critical_Illness', label: 'Critical illness protection' },
  { value: 'IUL', label: 'Indexed universal life (IUL)' },
  { value: 'Annuity', label: 'Annuities' },
  { value: 'Retirement', label: 'Retirement income planning' },
  { value: 'Business', label: 'Business protection / key person' },
]

const insuranceOptions = [
  'Term Life',
  'Whole Life',
  'Indexed Universal Life (IUL)',
  'Final Expense',
  'Mortgage Protection',
  'Juvenile Coverage',
  'Accident / Critical Illness',
  'Annuity / Retirement Income',
  'Business / Key-Person Coverage',
  'Other',
]

function classNames(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(' ')
}

function formatSlot(iso: string, timezone: string) {
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    timeZone: timezone,
  }).format(new Date(iso))
}

function formatDayLabel(date: string) {
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  }).format(new Date(`${date}T12:00:00`))
}

function productLabel(value: string) {
  return productOptions.find((option) => option.value === value)?.label ?? value.replaceAll('_', ' ')
}

export default function ConsultBookingFlow() {
  const [step, setStep] = useState(1)
  const [form, setForm] = useState<FormState>(initialState)
  const [consentToContact, setConsentToContact] = useState(false)
  const [availability, setAvailability] = useState<AvailabilityResponse | null>(null)
  const [availabilityLoading, setAvailabilityLoading] = useState(true)
  const [availabilityError, setAvailabilityError] = useState('')
  const [calendarDisconnected, setCalendarDisconnected] = useState(false)
  const [selectedDate, setSelectedDate] = useState('')
  const [selectedSlot, setSelectedSlot] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [completion, setCompletion] = useState<CompletionState | null>(null)

  useEffect(() => {
    if (typeof window === 'undefined') return

    const params = new URLSearchParams(buildFilloutParams())
    setForm((previous) => ({
      ...previous,
      leadSessionId: params.get('lead_session_id') || '',
      pageUrl: params.get('page_url') || window.location.pathname,
      referrer: params.get('referrer') || '',
      source: params.get('utm_source') || 'website',
      medium: params.get('utm_medium') || 'native_booking',
      campaign: params.get('utm_campaign') || 'native_consultation',
      term: params.get('utm_term') || '',
      content: params.get('utm_content') || '',
    }))
  }, [])

  useEffect(() => {
    let ignore = false

    async function loadAvailability() {
      setAvailabilityLoading(true)
      setAvailabilityError('')

      try {
        const response = await fetch('/api/availability', { cache: 'no-store' })
        const data: AvailabilityResponse = await response.json()

        if (!response.ok || !data.ok) {
          if (data.errorCode === 'CALENDAR_DISCONNECTED') {
            if (!ignore) setCalendarDisconnected(true)
            return
          }
          throw new Error(data.error || 'Available times could not be loaded.')
        }

        if (!ignore) {
          setAvailability(data)
          const firstAvailableDay = data.days.find((day) => day.slots.length > 0)
          if (firstAvailableDay) setSelectedDate(firstAvailableDay.date)
        }
      } catch (error) {
        if (!ignore) {
          setAvailabilityError(error instanceof Error ? error.message : 'Available times could not be loaded.')
        }
      } finally {
        if (!ignore) setAvailabilityLoading(false)
      }
    }

    void loadAvailability()
    return () => {
      ignore = true
    }
  }, [])

  const selectedDay = useMemo(
    () => availability?.days.find((day) => day.date === selectedDate) ?? null,
    [availability, selectedDate],
  )

  const hasAnyAvailableSlots = Boolean(availability?.days.some((day) => day.slots.length > 0))
  const schedulingUnavailable = calendarDisconnected || Boolean(availabilityError) || (!availabilityLoading && !hasAnyAvailableSlots)

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((previous) => ({ ...previous, [key]: value }))
  }

  function toggleInsuranceType(value: string) {
    setForm((previous) => ({
      ...previous,
      existingInsuranceTypes: previous.existingInsuranceTypes.includes(value)
        ? previous.existingInsuranceTypes.filter((item) => item !== value)
        : [...previous.existingInsuranceTypes, value],
    }))
  }

  function validateCurrentStep() {
    if (step === 1) {
      if (!form.firstName.trim() || !form.lastName.trim() || !form.email.trim() || !form.phone.trim()) {
        return 'Please complete your name, email address, and phone number.'
      }
      if (!form.state.trim()) return 'Please select your state.'
    }

    if (step === 2) {
      if (!form.dateOfBirth || !form.height.trim() || !form.weight.trim() || !form.tobaccoUse) {
        return 'Please complete date of birth, height, weight, and tobacco or nicotine use.'
      }
      if (form.childrenCount === '') return 'Please enter the number of children or dependents, including 0.'
    }

    if (step === 3) {
      if (!form.hasExistingInsurance) return 'Please indicate whether you currently have insurance coverage.'
      if (!consentToContact) return 'Please confirm that Latimore Life & Legacy may contact you about this request.'
    }

    return ''
  }

  function nextStep() {
    const error = validateCurrentStep()
    if (error) {
      setSubmitError(error)
      return
    }

    setSubmitError('')
    setStep((current) => Math.min(4, current + 1))
  }

  function previousStep() {
    setSubmitError('')
    setStep((current) => Math.max(1, current - 1))
  }

  function normalizedBody() {
    return {
      ...form,
      mailingAddress: form.mailingAddress || null,
      city: form.city || null,
      zip: form.zip || null,
      dateOfBirth: form.dateOfBirth || null,
      jobTitle: form.jobTitle || null,
      height: form.height || null,
      weight: form.weight || null,
      maritalStatus: form.maritalStatus || null,
      childrenCount: form.childrenCount === '' ? null : Number(form.childrenCount),
      healthConditions: form.healthConditions || null,
      tobaccoUse: form.tobaccoUse || null,
      familyCriticalIllness: form.familyCriticalIllness || null,
      monthlyBudget: form.monthlyBudget || null,
      hasExistingInsurance: form.hasExistingInsurance || null,
      county: form.county || null,
      notes: form.notes || null,
    }
  }

  async function submitBooking() {
    if (!selectedSlot) {
      setSubmitError('Please select an available consultation time.')
      return
    }

    setSubmitting(true)
    setSubmitError('')

    try {
      const response = await fetch('/api/appointments/book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...normalizedBody(), slotStart: selectedSlot }),
      })
      const data: BookingResponse = await response.json()

      if (!response.ok || !data.ok) throw new Error(data.error || 'Your consultation could not be booked.')
      setCompletion({ kind: 'booked', response: data })
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Your consultation could not be booked.')
    } finally {
      setSubmitting(false)
    }
  }

  async function requestConsultation() {
    if (!consentToContact) {
      setSubmitError('Please confirm that Latimore Life & Legacy may contact you about this request.')
      return
    }

    setSubmitting(true)
    setSubmitError('')

    try {
      const response = await fetch('/api/intake/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...normalizedBody(), consentToContact: true }),
      })
      const data: IntakeRequestResponse = await response.json()

      if (!response.ok || !data.ok) throw new Error(data.error || 'Your request could not be saved.')
      setCompletion({ kind: 'requested', response: data })
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Your request could not be saved.')
    } finally {
      setSubmitting(false)
    }
  }

  if (completion) {
    const booked = completion.kind === 'booked'
    const bookedResponse = booked ? completion.response : null

    return (
      <main className="min-h-screen bg-[#000835] px-4 py-8 text-white sm:py-12">
        <section className="mx-auto max-w-3xl overflow-hidden rounded-[30px] border border-[#E1B54B]/30 bg-white shadow-2xl">
          <div className="border-b border-slate-200 bg-white px-6 py-6 text-center sm:px-10">
            <Image
              src="/logo.jpg"
              alt="Latimore Life & Legacy LLC"
              width={280}
              height={316}
              priority
              className="mx-auto h-auto w-full max-w-[260px] object-contain"
            />
          </div>
          <div className="bg-[#000835] px-6 py-10 text-center sm:px-10">
            <p className="text-xs font-bold uppercase tracking-[0.28em] text-[#E1B54B]">
              {booked ? 'Consultation Booked' : 'Consultation Request Received'}
            </p>
            <h1 className="mt-4 text-3xl font-bold sm:text-4xl">
              {booked ? 'Your time is reserved.' : 'Your intake is safely in Latimore OS.'}
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-white/75 sm:text-base">
              {booked
                ? 'Your information was added directly to the Latimore CRM and your consultation was placed on the calendar.'
                : 'Your information was added directly to the Latimore CRM. We will contact you to finalize a consultation time.'}
            </p>

            {bookedResponse?.scheduledFor ? (
              <div className="mx-auto mt-7 max-w-xl rounded-2xl border border-[#E1B54B]/25 bg-white/5 p-5">
                <p className="text-xs uppercase tracking-[0.2em] text-white/55">Scheduled time</p>
                <p className="mt-2 text-lg font-semibold text-white">
                  {formatSlot(bookedResponse.scheduledFor, availability?.timezone || 'America/New_York')}
                </p>
              </div>
            ) : null}

            <div className="mt-7 flex flex-wrap justify-center gap-3">
              {bookedResponse?.meetingUrl ? (
                <a
                  href={bookedResponse.meetingUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-xl bg-[#E1B54B] px-5 py-3 text-sm font-bold text-[#000835] transition hover:brightness-105"
                >
                  Open meeting details
                </a>
              ) : null}
              <a
                href="/"
                className="rounded-xl border border-white/20 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/5"
              >
                Return home
              </a>
            </div>
          </div>
        </section>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,#10235a_0%,#000835_42%,#00041f_100%)] px-4 py-6 text-white sm:px-6 sm:py-10">
      <div className="mx-auto max-w-6xl">
        <header className="mb-7 overflow-hidden rounded-[28px] border border-[#E1B54B]/30 bg-white shadow-2xl">
          <div className="grid items-center lg:grid-cols-[340px_1fr]">
            <div className="bg-white px-6 py-6 text-center sm:px-10">
              <Image
                src="/logo.jpg"
                alt="Latimore Life & Legacy LLC"
                width={320}
                height={362}
                priority
                className="mx-auto h-auto w-full max-w-[290px] object-contain"
              />
            </div>
            <div className="bg-[#000835] px-6 py-8 sm:px-10 sm:py-10">
              <p className="text-xs font-bold uppercase tracking-[0.28em] text-[#E1B54B]">
                Free 30-Minute Consultation
              </p>
              <h1 className="mt-4 text-3xl font-bold leading-tight sm:text-5xl">
                Protect today. Secure tomorrow.
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-white/75 sm:text-base">
                Complete this private consultation intake and select a time with Jackson. Your submission goes directly into Latimore OS—no external form webhook required.
              </p>
              <p className="mt-4 text-sm font-semibold text-[#E1B54B]">#TheBeatGoesOn</p>
            </div>
          </div>
        </header>

        <section className="mb-6 rounded-[24px] border border-[#E1B54B]/25 bg-white/5 p-5 backdrop-blur">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#E1B54B]">Progress</p>
              <p className="mt-1 text-sm text-white/70">
                {step === 1 && 'Contact and planning interest'}
                {step === 2 && 'Personal and health details'}
                {step === 3 && 'Existing coverage and goals'}
                {step === 4 && 'Choose a consultation time'}
              </p>
            </div>
            <p className="shrink-0 text-sm font-bold text-[#E1B54B]">Step {step} of 4</p>
          </div>
          <div className="mt-4 grid grid-cols-4 gap-2" aria-label={`Step ${step} of 4`}>
            {[1, 2, 3, 4].map((item) => (
              <div
                key={item}
                className={classNames('h-2 rounded-full transition', item <= step ? 'bg-[#E1B54B]' : 'bg-white/15')}
              />
            ))}
          </div>
        </section>

        <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
          <section className="rounded-[28px] border border-white/15 bg-white/[0.07] p-5 shadow-2xl backdrop-blur sm:p-8">
            {step === 1 ? (
              <div className="space-y-6">
                <SectionTitle
                  title="Contact Information"
                  description="Tell us how to reach you and what you want to discuss."
                />
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="First name" required>
                    <Input name="firstName" autoComplete="given-name" value={form.firstName} onChange={(value) => update('firstName', value)} />
                  </Field>
                  <Field label="Last name" required>
                    <Input name="lastName" autoComplete="family-name" value={form.lastName} onChange={(value) => update('lastName', value)} />
                  </Field>
                  <Field label="Email address" required>
                    <Input name="email" type="email" autoComplete="email" value={form.email} onChange={(value) => update('email', value)} />
                  </Field>
                  <Field label="Phone number" required>
                    <Input name="phone" type="tel" autoComplete="tel" inputMode="tel" value={form.phone} onChange={(value) => update('phone', value)} />
                  </Field>
                </div>
                <Field label="Mailing address">
                  <Input name="mailingAddress" autoComplete="street-address" value={form.mailingAddress} onChange={(value) => update('mailingAddress', value)} />
                </Field>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <Field label="City">
                    <Input name="city" autoComplete="address-level2" value={form.city} onChange={(value) => update('city', value)} />
                  </Field>
                  <Field label="State" required>
                    <Select name="state" value={form.state} onChange={(value) => update('state', value)}>
                      <option value="PA">Pennsylvania</option>
                    </Select>
                  </Field>
                  <Field label="ZIP code">
                    <Input name="zip" autoComplete="postal-code" inputMode="numeric" value={form.zip} onChange={(value) => update('zip', value)} />
                  </Field>
                  <Field label="County">
                    <Select name="county" value={form.county} onChange={(value) => update('county', value)}>
                      <option value="">Select county</option>
                      <option value="Schuylkill">Schuylkill</option>
                      <option value="Luzerne">Luzerne</option>
                      <option value="Northumberland">Northumberland</option>
                      <option value="Other Pennsylvania County">Other PA county</option>
                    </Select>
                  </Field>
                </div>
                <Field label="What would you like to discuss?" required>
                  <Select name="productInterest" value={form.productInterest} onChange={(value) => update('productInterest', value)}>
                    {productOptions.map((option) => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </Select>
                </Field>
              </div>
            ) : null}

            {step === 2 ? (
              <div className="space-y-6">
                <SectionTitle
                  title="Personal & Health Details"
                  description="These preliminary details help Jackson prepare. They are not an application or underwriting decision."
                />
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  <Field label="Date of birth" required>
                    <Input name="dateOfBirth" type="date" autoComplete="bday" value={form.dateOfBirth} onChange={(value) => update('dateOfBirth', value)} />
                  </Field>
                  <Field label="Industry or job title">
                    <Input name="jobTitle" autoComplete="organization-title" value={form.jobTitle} onChange={(value) => update('jobTitle', value)} />
                  </Field>
                  <Field label="Marital status">
                    <Select name="maritalStatus" value={form.maritalStatus} onChange={(value) => update('maritalStatus', value as FormState['maritalStatus'])}>
                      <option value="">Select</option>
                      <option value="Single">Single</option>
                      <option value="Married">Married</option>
                      <option value="Separated">Separated</option>
                      <option value="Widowed">Widowed</option>
                    </Select>
                  </Field>
                  <Field label="Height" required hint="Example: 5 ft 10 in">
                    <Input name="height" placeholder="5 ft 10 in" value={form.height} onChange={(value) => update('height', value)} />
                  </Field>
                  <Field label="Weight" required hint="Enter pounds">
                    <Input name="weight" inputMode="numeric" placeholder="185 lbs" value={form.weight} onChange={(value) => update('weight', value)} />
                  </Field>
                  <Field label="Children or dependents" required hint="Enter 0 if none">
                    <Input name="childrenCount" type="number" inputMode="numeric" min="0" max="20" placeholder="0" value={form.childrenCount} onChange={(value) => update('childrenCount', value)} />
                  </Field>
                </div>
                <Field label="Do you currently use tobacco or nicotine?" required>
                  <ChoiceGroup
                    value={form.tobaccoUse}
                    options={['No', 'Yes']}
                    onChange={(value) => update('tobaccoUse', value as FormState['tobaccoUse'])}
                  />
                </Field>
                <Field label="Current health conditions" hint="Do not enter Social Security numbers, banking information, or full medical records.">
                  <Textarea name="healthConditions" rows={4} value={form.healthConditions} onChange={(value) => update('healthConditions', value)} />
                </Field>
                <Field label="Family history of critical illness">
                  <ChoiceGroup
                    value={form.familyCriticalIllness}
                    options={['No', 'Yes', 'Unsure']}
                    onChange={(value) => update('familyCriticalIllness', value as FormState['familyCriticalIllness'])}
                  />
                </Field>
              </div>
            ) : null}

            {step === 3 ? (
              <div className="space-y-6">
                <SectionTitle
                  title="Coverage & Planning Details"
                  description="Help us understand your current protection and the range you are comfortable reviewing."
                />
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Monthly protection budget" hint="A range is fine">
                    <Input name="monthlyBudget" inputMode="decimal" placeholder="$100–$200" value={form.monthlyBudget} onChange={(value) => update('monthlyBudget', value)} />
                  </Field>
                  <Field label="Do you currently have insurance coverage?" required>
                    <ChoiceGroup
                      value={form.hasExistingInsurance}
                      options={['Yes', 'No']}
                      onChange={(value) => update('hasExistingInsurance', value as FormState['hasExistingInsurance'])}
                    />
                  </Field>
                </div>

                {form.hasExistingInsurance === 'Yes' ? (
                  <Field label="Existing coverage types">
                    <div className="grid gap-3 sm:grid-cols-2">
                      {insuranceOptions.map((option) => (
                        <label key={option} className="flex cursor-pointer items-center gap-3 rounded-2xl border border-white/15 bg-black/20 px-4 py-3 text-sm text-white/85 transition hover:border-[#E1B54B]/40">
                          <input
                            type="checkbox"
                            checked={form.existingInsuranceTypes.includes(option)}
                            onChange={() => toggleInsuranceType(option)}
                            className="h-4 w-4 accent-[#E1B54B]"
                          />
                          <span>{option}</span>
                        </label>
                      ))}
                    </div>
                  </Field>
                ) : null}

                <Field label="Goals, questions, or anything Jackson should know">
                  <Textarea name="notes" rows={5} value={form.notes} onChange={(value) => update('notes', value)} />
                </Field>

                <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-[#E1B54B]/25 bg-[#E1B54B]/10 p-4 text-sm leading-6 text-white/85">
                  <input
                    type="checkbox"
                    checked={consentToContact}
                    onChange={(event) => setConsentToContact(event.target.checked)}
                    className="mt-1 h-4 w-4 shrink-0 accent-[#E1B54B]"
                  />
                  <span>
                    I authorize Latimore Life & Legacy LLC to contact me by phone, text, or email about this consultation request. Consent is not a condition of purchasing insurance.
                  </span>
                </label>
              </div>
            ) : null}

            {step === 4 ? (
              <div className="space-y-6">
                <SectionTitle
                  title="Choose Your Consultation Time"
                  description="Availability is checked directly against the Latimore calendar."
                />

                {availabilityLoading ? (
                  <StatusPanel title="Loading available times" body="Checking Jackson’s calendar now…" />
                ) : schedulingUnavailable ? (
                  <div className="space-y-5">
                    <StatusPanel
                      title="Live scheduling is temporarily unavailable"
                      body="Your intake can still be saved directly into Latimore OS. Submit a consultation request and Jackson will contact you to finalize a time."
                    />
                    <button
                      type="button"
                      onClick={requestConsultation}
                      disabled={submitting}
                      className="w-full rounded-xl bg-[#E1B54B] px-5 py-3.5 text-sm font-bold text-[#000835] transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
                    >
                      {submitting ? 'Saving request…' : 'Submit Consultation Request'}
                    </button>
                  </div>
                ) : (
                  <div className="grid gap-6 lg:grid-cols-[230px_1fr]">
                    <div className="space-y-3">
                      {availability?.days.map((day) => (
                        <button
                          key={day.date}
                          type="button"
                          disabled={day.slots.length === 0}
                          onClick={() => {
                            setSelectedDate(day.date)
                            setSelectedSlot('')
                          }}
                          className={classNames(
                            'w-full rounded-2xl border px-4 py-3 text-left transition disabled:cursor-not-allowed disabled:opacity-45',
                            selectedDate === day.date
                              ? 'border-[#E1B54B] bg-[#E1B54B]/15'
                              : 'border-white/15 bg-black/20 hover:border-[#E1B54B]/40',
                          )}
                        >
                          <div className="text-sm font-semibold text-white">{formatDayLabel(day.date)}</div>
                          <div className="mt-1 text-xs text-white/50">
                            {day.slots.length ? `${day.slots.length} available` : 'Unavailable'}
                          </div>
                        </button>
                      ))}
                    </div>
                    <div>
                      <div className="mb-3 flex items-center justify-between gap-3">
                        <p className="text-sm font-semibold text-white">
                          {selectedDate ? formatDayLabel(selectedDate) : 'Select a date'}
                        </p>
                        <p className="text-xs uppercase tracking-[0.16em] text-white/50">
                          Eastern Time
                        </p>
                      </div>
                      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                        {selectedDay?.slots.length ? selectedDay.slots.map((slot) => (
                          <button
                            key={slot}
                            type="button"
                            onClick={() => setSelectedSlot(slot)}
                            className={classNames(
                              'rounded-2xl border px-4 py-3 text-sm font-semibold transition',
                              selectedSlot === slot
                                ? 'border-[#E1B54B] bg-[#E1B54B] text-[#000835]'
                                : 'border-white/15 bg-black/20 text-white hover:border-[#E1B54B]/40',
                            )}
                          >
                            {formatSlot(slot, availability?.timezone || 'America/New_York')}
                          </button>
                        )) : (
                          <div className="rounded-2xl border border-white/15 bg-black/20 p-4 text-sm text-white/70 sm:col-span-2 xl:col-span-3">
                            Choose another date to see available times.
                          </div>
                        )}
                      </div>
                      <div className="mt-6 flex flex-wrap gap-3">
                        <button
                          type="button"
                          onClick={submitBooking}
                          disabled={submitting || !selectedSlot}
                          className="rounded-xl bg-[#E1B54B] px-5 py-3.5 text-sm font-bold text-[#000835] transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-55"
                        >
                          {submitting ? 'Booking…' : 'Complete Booking'}
                        </button>
                        <button
                          type="button"
                          onClick={requestConsultation}
                          disabled={submitting}
                          className="rounded-xl border border-white/20 px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-white/5 disabled:opacity-55"
                        >
                          Request a Call Instead
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : null}

            {submitError ? (
              <div role="alert" className="mt-6 rounded-2xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-100">
                {submitError}
              </div>
            ) : null}

            <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-6">
              <div>
                {step > 1 ? (
                  <button
                    type="button"
                    onClick={previousStep}
                    className="rounded-xl border border-white/20 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/5"
                  >
                    Back
                  </button>
                ) : null}
              </div>
              {step < 4 ? (
                <button
                  type="button"
                  onClick={nextStep}
                  className="rounded-xl bg-[#E1B54B] px-6 py-3 text-sm font-bold text-[#000835] transition hover:brightness-105"
                >
                  Continue
                </button>
              ) : null}
            </div>
          </section>

          <aside className="h-fit rounded-[28px] border border-[#E1B54B]/25 bg-white/[0.07] p-6 shadow-2xl backdrop-blur lg:sticky lg:top-6">
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#E1B54B]">Your Consultation</p>
            <div className="mt-4 space-y-3">
              <InfoRow label="Length" value="30 minutes" />
              <InfoRow label="Applicant" value={[form.firstName, form.lastName].filter(Boolean).join(' ') || 'Not provided'} />
              <InfoRow label="Phone" value={form.phone || 'Not provided'} />
              <InfoRow label="Planning interest" value={productLabel(form.productInterest)} />
              <InfoRow
                label="Selected time"
                value={selectedSlot ? formatSlot(selectedSlot, availability?.timezone || 'America/New_York') : 'Not selected'}
              />
            </div>
            <div className="mt-5 rounded-2xl border border-[#E1B54B]/25 bg-[#E1B54B]/10 p-4 text-sm leading-6 text-white/80">
              This intake is for consultation preparation and education. It is not an insurance application, coverage approval, legal advice, tax advice, or investment advice.
            </div>
            <div className="mt-5 text-sm leading-6 text-white/65">
              <p className="font-semibold text-white">Need assistance?</p>
              <a href={BRAND.phoneHref} className="mt-1 block text-[#E1B54B] hover:underline">{BRAND.phone}</a>
              <a href={`mailto:${BRAND.email}`} className="block break-all text-[#E1B54B] hover:underline">{BRAND.email}</a>
            </div>
          </aside>
        </div>
      </div>
    </main>
  )
}

function SectionTitle({ title, description }: { title: string; description: string }) {
  return (
    <div>
      <h2 className="text-2xl font-bold text-white sm:text-3xl">{title}</h2>
      <p className="mt-2 max-w-3xl text-sm leading-7 text-white/70">{description}</p>
    </div>
  )
}

function Field({
  label,
  required,
  hint,
  children,
}: {
  label: string
  required?: boolean
  hint?: string
  children: ReactNode
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-semibold text-white/90">
        {label} {required ? <span className="text-[#E1B54B]">*</span> : null}
      </span>
      {children}
      {hint ? <span className="mt-2 block text-xs leading-5 text-white/50">{hint}</span> : null}
    </label>
  )
}

function Input({
  name,
  value,
  onChange,
  type = 'text',
  placeholder,
  autoComplete,
  inputMode,
  min,
  max,
}: {
  name: string
  value: string
  onChange: (value: string) => void
  type?: string
  placeholder?: string
  autoComplete?: string
  inputMode?: 'none' | 'text' | 'tel' | 'url' | 'email' | 'numeric' | 'decimal' | 'search'
  min?: string
  max?: string
}) {
  return (
    <input
      name={name}
      type={type}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder={placeholder}
      autoComplete={autoComplete}
      inputMode={inputMode}
      min={min}
      max={max}
      className="w-full rounded-2xl border border-white/15 bg-black/25 px-4 py-3.5 text-sm text-white outline-none placeholder:text-white/35 focus:border-[#E1B54B] focus:ring-2 focus:ring-[#E1B54B]/15"
    />
  )
}

function Textarea({
  name,
  value,
  onChange,
  rows = 4,
}: {
  name: string
  value: string
  onChange: (value: string) => void
  rows?: number
}) {
  return (
    <textarea
      name={name}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      rows={rows}
      className="w-full resize-y rounded-2xl border border-white/15 bg-black/25 px-4 py-3.5 text-sm text-white outline-none placeholder:text-white/35 focus:border-[#E1B54B] focus:ring-2 focus:ring-[#E1B54B]/15"
    />
  )
}

function Select({
  name,
  value,
  onChange,
  children,
}: {
  name: string
  value: string
  onChange: (value: string) => void
  children: ReactNode
}) {
  return (
    <select
      name={name}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="w-full rounded-2xl border border-white/15 bg-[#050b2c] px-4 py-3.5 text-sm text-white outline-none focus:border-[#E1B54B] focus:ring-2 focus:ring-[#E1B54B]/15"
    >
      {children}
    </select>
  )
}

function ChoiceGroup({
  value,
  options,
  onChange,
}: {
  value: string
  options: string[]
  onChange: (value: string) => void
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-3">
      {options.map((option) => (
        <button
          key={option}
          type="button"
          onClick={() => onChange(option)}
          className={classNames(
            'rounded-2xl border px-4 py-3 text-sm font-semibold transition',
            value === option
              ? 'border-[#E1B54B] bg-[#E1B54B] text-[#000835]'
              : 'border-white/15 bg-black/20 text-white hover:border-[#E1B54B]/40',
          )}
        >
          {option}
        </button>
      ))}
    </div>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/15 bg-black/20 p-4">
      <p className="text-xs uppercase tracking-[0.16em] text-white/45">{label}</p>
      <p className="mt-2 text-sm font-semibold text-white">{value}</p>
    </div>
  )
}

function StatusPanel({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-2xl border border-[#E1B54B]/25 bg-[#E1B54B]/10 p-5">
      <p className="text-sm font-bold text-[#E1B54B]">{title}</p>
      <p className="mt-2 text-sm leading-6 text-white/75">{body}</p>
    </div>
  )
}
