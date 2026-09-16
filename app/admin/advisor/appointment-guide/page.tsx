'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { ChevronLeft, ChevronRight, ClipboardList, Lightbulb, ListChecks } from 'lucide-react'
import { COLORS } from '@/lib/brand'
import { trackLatimoreEvent } from '@/lib/tracking/client-events'

type Step = {
  title: string
  subtitle: string
  phase: string
  script: (client: string, trainee: string) => string
  coach: string[]
}

const STEPS: Step[] = [
  {
    title: 'TTHT — The Tie That Holds',
    subtitle: 'Set the frame. Establish credibility. Get permission.',
    phase: 'INTRO',
    script: (client, trainee) => `“Hey ${client}, thank you so much for taking the time to meet with me today — I really appreciate it.

Real quick before we get started — I like to be upfront with everyone I meet with. I’m here to do a Personal Financial Review with you. What that means is I’m going to ask you a few questions, we’re going to see what you currently have in place, and I’m going to show you a few things that could help you and your family make more informed decisions.

At the end of the day, the only question I’ll ask is this: if what I show you makes sense for you, does it make sense to take the next appropriate step?

Sound fair?”${trainee ? `

“And by the way, thank you for helping ${trainee} today. I appreciate you giving us the opportunity to work through the review together.”` : ''}`,
    coach: ['Get a verbal agreement before moving forward.', 'Do not rush the frame. Pause after “Sound fair?”', 'If another advisor or trainee is present, introduce them naturally without making the client feel like a training exercise.'],
  },
  {
    title: 'F.O.R.M. — Build Rapport',
    subtitle: 'Family · Occupation · Recreation · Message',
    phase: 'F.O.R.M.',
    script: () => `FAMILY
“Tell me about your family.”
“How did you two meet?” / “Do you come from a large family?”
“Are you originally from this area? What brought you here?”

OCCUPATION
“What do you do for work?”
“How long have you been there?”
“What do you like most about what you do?”

RECREATION
“How do you spend your time when you’re not working?”
“What hobbies do you have? What are your kids into?”
“What is a place you would love to visit again — or for the first time?”

MESSAGE
“Before we get into the numbers, let me tell you briefly why I do this work.”

[Use your authentic two-minute story. Keep it relevant to protection, preparation, family, and legacy.]

“Now that you know a little more about me, let me ask a few questions so I can tailor this review to you.”`,
    coach: ['Go deeper than surface facts, but keep the conversation natural.', 'Family comes first because it gives context to the planning goals.', 'Your personal story should explain why the work matters—not create fear or pressure.'],
  },
  {
    title: 'Q1 — Employer Retirement Plan',
    subtitle: 'Discover workplace retirement contributions.',
    phase: 'DISCOVERY',
    script: (client) => `“${client}, are you currently contributing to any employer retirement plan?”

IF YES
“Great. What type of plan is it?”
“How long have you been contributing?”
“Does the employer match any part of your contribution?”
“Do you know approximately what is in the account today?”

IF NO
“Okay. Is that because your employer does not offer one, you are self-employed, or you have simply not started contributing yet?”

[Record the plan type, contribution, balance, match, and any old employer plans in the PFR.]`,
    coach: ['The goal is the retirement picture—not a product pitch.', 'An old employer plan is a planning fact to document and review for options, fees, risk, and tax consequences.', 'Never imply a rollover or transfer is automatically better.'],
  },
  {
    title: 'Q2 — Outside Retirement Plans',
    subtitle: 'Discover IRAs and other personal retirement assets.',
    phase: 'DISCOVERY',
    script: () => `“Do you have any retirement plans outside of work — such as an IRA, an old employer plan, or another retirement account?”

IF YES
“What type of account is it?”
“How long have you had it?”
“About how much is there today?”
“Are you currently contributing?”
“How do you feel about the way it is positioned?”

IF NO
“Okay. That helps me understand how much of your retirement strategy is currently tied to your workplace plan or future savings.”`,
    coach: ['Document every account separately.', 'Do not describe any repositioning as guaranteed to be better.', 'The correct next question is what role the account should play in the client’s retirement income plan.'],
  },
  {
    title: 'Q3 — Life Protection & Living Benefits',
    subtitle: 'Discover existing coverage and protection gaps.',
    phase: 'DISCOVERY',
    script: () => `“Do you currently have any life insurance or other life protection?”

IF YES
“Is it through work, something you own individually, or both?”
“Do you know whether it is term protection, permanent protection, or a combination?”
“About how much total coverage do you have?”
“Do you know whether any of it includes living-benefit provisions?”
“Do you have any long-term-care coverage or provisions?”
“When was the last time you reviewed it?”

IF NO
“Okay. Then family protection is one of the areas we should quantify before we finish today.”`,
    coach: ['Review portability, amount, duration, ownership, beneficiaries, and living-benefit provisions separately.', 'Do not assume employer coverage is inadequate; verify the facts.', 'If the client does not know the contract details, mark them for document review instead of guessing.'],
  },
  {
    title: 'Q4 — Children & Savings',
    subtitle: 'Discover dependent protection and education goals.',
    phase: 'DISCOVERY',
    script: () => `“Do you have children or anyone financially dependent on you?”

IF YES
“How many, and what are their ages?”
“Have you started saving specifically for education or another future goal for them?”
“If something happened to you, who would be responsible for their day-to-day care and financial needs?”
“Are there any specific education, housing, or legacy goals you want included in the plan?”

IF NO
“Okay. Then we can focus the review on your own income, obligations, retirement, and legacy priorities.”`,
    coach: ['Use the client’s stated goals; do not impose a college-funding assumption.', 'Separate guardianship/legal questions from the financial-funding question and refer legal issues to the appropriate professional.', 'Document the time horizon for each dependent-related goal.'],
  },
  {
    title: 'Q5 — Additional Income',
    subtitle: 'Identify whether additional-income education is relevant.',
    phase: 'DISCOVERY',
    script: () => `“One last lifestyle question: are you interested in learning about ways to create additional income, or is that not a priority for you right now?”

IF OPEN
“Good to know. I’ll note it, but I want to finish your financial review first so we keep this meeting focused.”

IF NOT A PRIORITY
“Perfect. We’ll leave it out and stay focused on the goals you identified.”`,
    coach: ['Do not turn the PFR into a recruiting conversation.', 'A “no” is a complete answer—move on.', 'If the client asks for details, schedule a separate conversation after the financial review.'],
  },
  {
    title: 'Client Priorities — The Priority Wheel',
    subtitle: 'Identify the areas the client wants to address first.',
    phase: 'PRIORITIES',
    script: (client) => `“${client}, I’m going to show you several areas families commonly work on. Tell me which ones are most important to YOU right now.”

• Life Protection
• Living Benefits
• Mortgage Protection
• Retirement Income
• Debt Management
• Emergency Reserves
• College Funding
• Estate & Legacy Planning
• Business Protection
• Tax-Efficient Planning Education

“Which three would you put at the top today — and why?”`,
    coach: ['Use the client’s own ranking to determine the presentation order.', 'Ask why the top priority matters now.', 'Do not translate priorities into a carrier or proprietary product selection in front of the client.'],
  },
  {
    title: 'Closing Q1 — Retirement Age',
    subtitle: 'Anchor the retirement timeline.',
    phase: 'RETIREMENT',
    script: (client) => `“Based on everything you’ve shared, let me ask a few more targeted questions.

${client}, what age would you like to retire?”

IF UNSURE
“That’s okay. If you had the choice, what age would feel right?”

[Record the target age and the number of years remaining.]`,
    coach: ['A target retirement age creates a planning time horizon.', 'Do not manufacture urgency; simply show how time changes the savings and income math.', 'Reference the stated age consistently later in the review.'],
  },
  {
    title: 'Closing Q2 — Monthly Income Goal',
    subtitle: 'Quantify the retirement income target.',
    phase: 'RETIREMENT',
    script: () => `“How much income per month would you like to live on in retirement?”

IF THEY HESITATE
“Think about what your life costs today and what you expect to change in retirement. What monthly number would make you feel comfortable?”

“Now, what predictable monthly income do you currently expect from sources such as Social Security or a pension?”

[Calculate the monthly gap between desired income and predictable income.]`,
    coach: ['The gap is a planning number, not a sales number.', 'Confirm whether income estimates are gross or net and whether survivor benefits differ.', 'Avoid guaranteeing any future income that is not contractually guaranteed.'],
  },
  {
    title: 'Closing Q3 — Goals & Dreams',
    subtitle: 'Connect the numbers to the client’s retirement vision.',
    phase: 'RETIREMENT',
    script: () => `“What are some of your goals and dreams for retirement? What does your ideal retirement actually look like?”

[Give them space. Listen and write down their words.]

“What would you want to be able to do without worrying about whether the monthly income is there?”`,
    coach: ['Take notes in the client’s own words.', 'Silence is useful; do not fill every pause.', 'Use the answer later to explain why the income target matters—not to manipulate emotion.'],
  },
  {
    title: 'Commitment Question',
    subtitle: 'Confirm whether the client wants to review possible approaches.',
    phase: 'TRANSITION',
    script: () => `“If we can identify an approach that fits the goals, budget, and priorities you just gave me, would you like me to walk you through it today?”

IF YES
“Great. Let’s finish the numbers and then I’ll show you the planning approaches that fit what you told me.”

IF NO OR UNSURE
“No problem. What would you need to understand before deciding whether you want to review the options?”`,
    coach: ['Keep the question permission-based and low pressure.', 'A hesitation is a cue to clarify—not to overcome the client.', 'Do not treat an earlier “yes” as a commitment to purchase anything.'],
  },
  {
    title: 'Monthly Numbers',
    subtitle: 'Document income, expenses, and comfortable savings capacity.',
    phase: 'NUMBERS',
    script: () => `“Just a few more details so I do not recommend something that does not fit your real budget.

About how much household income comes in each month?”

“What are your normal monthly expenses?”

“After bills, debt payments, saving, and normal life expenses, what amount could you comfortably direct toward your priorities without feeling stretched?”

[Record income, expenses, and the client’s comfortable range.]`,
    coach: ['The client defines what is comfortable.', 'If expenses exceed income, solving cash-flow or debt pressure may come before new commitments.', 'Never use a client’s maximum disposable income as an automatic premium target.'],
  },
  {
    title: 'Assets Discovery',
    subtitle: 'Complete the picture of existing assets and savings.',
    phase: 'ASSETS',
    script: () => `“Let’s finish the picture of what you already have in place.

1. What do you have set aside for emergencies?
2. What retirement accounts do you have, and approximately what are the balances?
3. Are there old employer accounts still sitting elsewhere?
4. What other savings or investment accounts should be part of the picture?
5. Are any of these assets specifically earmarked for a goal?”

[Document account type, purpose, approximate value, liquidity, and any restrictions the client knows about.]`,
    coach: ['Discovery comes before recommendation.', 'Do not promise that moving an asset improves return, safety, taxes, or income.', 'If details are unknown, request statements and review the actual documents.'],
  },
  {
    title: 'Presentation Framework',
    subtitle: 'Tie the discovery to the planning approach.',
    phase: 'PRESENT',
    script: (client) => `“${client}, thank you for sharing all of that with me. Based on what you told me, here is what I’m seeing.”

1. Restate the client’s top priorities in their own words.
2. Show the quantified protection or retirement-income gap.
3. Identify the planning categories that may address the gap.
4. Explain the tradeoffs: duration, liquidity, guarantees, non-guaranteed elements, cost, access, and underwriting where applicable.
5. Confirm what the client wants to explore further.

“Before we go deeper, does that accurately reflect what you told me matters most?”`,
    coach: ['Lead with the client need, not a product.', 'Use carrier-neutral solution categories in the presentation layer.', 'If a specific recommendation is later made, support it with the actual contract/illustration and required disclosures.'],
  },
  {
    title: 'The Close',
    subtitle: 'Ask for the next appropriate action clearly.',
    phase: 'CLOSE',
    script: (client) => `“So ${client}, based on everything we reviewed today, do you feel this approach addresses the priorities you gave me?”

IF YES
“What would you like the next step to be — review the specific coverage details, begin an application, or schedule a follow-up so you can consider it?”

IF UNSURE
“Which part do you want to spend more time on?”

IF NO
“Thank you for telling me. What does not fit so I can make sure I understand your concern?”

[Document the outcome and specific follow-up date/action.]`,
    coach: ['The client chooses the next step.', 'Do not imply that declining or delaying is a mistake.', 'End with a specific follow-up action only when the client wants one.'],
  },
]

export default function AppointmentGuidePage() {
  const [step, setStep] = useState(0)
  const [clientName, setClientName] = useState('Client')
  const [traineeName, setTraineeName] = useState('')
  const [showCoach, setShowCoach] = useState(true)
  const [showAll, setShowAll] = useState(false)
  const started = useRef(false)
  const current = STEPS[step]

  useEffect(() => {
    if (started.current) return
    started.current = true
    void trackLatimoreEvent({ action: 'tool_started', tool: 'appointment_guide', category: 'Advisor Workflow' })
  }, [])

  function go(nextStep: number) {
    void trackLatimoreEvent({ action: 'tool_step_completed', tool: 'appointment_guide', category: 'Advisor Workflow', step: `${step + 1}:${current.title}` })
    const bounded = Math.max(0, Math.min(STEPS.length - 1, nextStep))
    setStep(bounded)
    if (bounded === STEPS.length - 1 && nextStep >= STEPS.length) {
      void trackLatimoreEvent({ action: 'tool_completed', tool: 'appointment_guide', category: 'Advisor Workflow', resultBand: 'all_steps_reviewed' })
    }
  }

  const progress = ((step + 1) / STEPS.length) * 100

  return (
    <div className="mx-auto max-w-6xl p-5 md:p-8">
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.26em]" style={{ color: COLORS.gold }}>Latimore Advisor OS</p>
          <h1 className="mt-2 text-3xl font-black text-white md:text-4xl">Appointment Guide</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6" style={{ color: COLORS.inkMuted }}>The 16-step PFR appointment framework, rebuilt as a Latimore-only, carrier-neutral workflow with step tracking.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/admin/advisor/pfr" className="flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2.5 text-sm font-bold text-white/75 no-underline"><ClipboardList size={15} /> Open PFR</Link>
          <Link href="/admin/advisor/conversation-coach" className="rounded-xl border border-white/10 px-4 py-2.5 text-sm font-bold text-white/75 no-underline">Conversation Coach</Link>
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.035] p-5">
        <div className="grid gap-3 sm:grid-cols-2">
          <input value={clientName === 'Client' ? '' : clientName} onChange={(e) => setClientName(e.target.value || 'Client')} placeholder="Client name (optional)" className="rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none focus:border-[#C9A25F]" />
          <input value={traineeName} onChange={(e) => setTraineeName(e.target.value)} placeholder="Trainee / second advisor (optional)" className="rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none focus:border-[#C9A25F]" />
        </div>
        <div className="mt-5 flex items-center justify-between text-xs" style={{ color: COLORS.inkMuted }}><span>Step {step + 1} of {STEPS.length}</span><span className="font-black" style={{ color: COLORS.goldLight }}>{current.phase}</span></div>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full transition-all" style={{ width: `${progress}%`, background: COLORS.gold }} /></div>
      </div>

      <section className="mt-5 rounded-2xl border border-white/10 bg-white/[0.035] p-5 md:p-7">
        <div className="flex items-start gap-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-black" style={{ background: 'rgba(201,162,95,.12)', border: `2px solid ${COLORS.gold}`, color: COLORS.goldLight }}>{step + 1}</div>
          <div><h2 className="text-2xl font-black text-white">{current.title}</h2><p className="mt-1 text-sm" style={{ color: COLORS.inkMuted }}>{current.subtitle}</p></div>
        </div>

        <div className="mt-6 whitespace-pre-wrap rounded-2xl border border-white/10 bg-black/20 p-5 text-[15px] leading-8 text-white/85">{current.script(clientName || 'Client', traineeName)}</div>

        <button onClick={() => setShowCoach(!showCoach)} className="mt-5 flex w-full items-center justify-between rounded-xl border p-4 text-left" style={{ borderColor: 'rgba(201,162,95,.26)', background: 'rgba(201,162,95,.06)' }}>
          <span className="flex items-center gap-2 text-sm font-black" style={{ color: COLORS.goldLight }}><Lightbulb size={16} /> Coaching Notes</span><span style={{ color: COLORS.goldLight }}>{showCoach ? '−' : '+'}</span>
        </button>
        {showCoach ? <ul className="mt-3 space-y-2 rounded-xl border border-white/10 bg-black/15 p-4 text-sm leading-6 text-white/70">{current.coach.map((item) => <li key={item}>• {item}</li>)}</ul> : null}

        <div className="mt-6 flex items-center justify-between gap-3">
          <button onClick={() => go(step - 1)} disabled={step === 0} className="flex items-center gap-2 rounded-xl border border-white/10 px-4 py-3 text-sm font-bold text-white/70 disabled:opacity-30"><ChevronLeft size={16} /> Previous</button>
          <button onClick={() => step === STEPS.length - 1 ? go(STEPS.length) : go(step + 1)} className="flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-black" style={{ background: COLORS.gold, color: COLORS.navyDeep }}>{step === STEPS.length - 1 ? 'Complete Guide' : 'Next Step'} <ChevronRight size={16} /></button>
        </div>
      </section>

      <button onClick={() => setShowAll(!showAll)} className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 px-4 py-3 text-sm font-bold text-white/70"><ListChecks size={16} /> {showAll ? 'Hide Quick Navigation' : 'View All 16 Steps'}</button>
      {showAll ? (
        <div className="mt-4 grid gap-2 md:grid-cols-2">
          {STEPS.map((item, index) => <button key={item.title} onClick={() => { setStep(index); setShowAll(false) }} className="rounded-xl border p-4 text-left" style={{ borderColor: index === step ? COLORS.gold : 'rgba(255,255,255,.1)', background: index === step ? 'rgba(201,162,95,.08)' : 'rgba(255,255,255,.025)' }}><span className="text-xs font-black" style={{ color: COLORS.goldLight }}>{index + 1}. {item.phase}</span><div className="mt-1 text-sm font-bold text-white/80">{item.title}</div></button>)}
        </div>
      ) : null}
    </div>
  )
}
