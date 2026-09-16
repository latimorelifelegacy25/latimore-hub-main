'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { BookOpenCheck, RotateCcw, CheckCircle2, XCircle } from 'lucide-react'
import { COLORS } from '@/lib/brand'
import { trackLatimoreEvent } from '@/lib/tracking/client-events'

type Question = {
  id: number
  category: string
  prompt: string
  options: string[]
  answer: number
  explanation: string
}

const QUESTIONS: Question[] = [
  { id: 1, category: 'Life Protection', prompt: 'What is the primary planning purpose of life protection?', options: ['Create an immediate pool of money for beneficiaries when an insured dies', 'Guarantee investment returns', 'Replace health insurance', 'Eliminate all taxes'], answer: 0, explanation: 'The core purpose is to create liquidity for beneficiaries to address income loss, debts, housing, education, final expenses, or other stated needs.' },
  { id: 2, category: 'Life Protection', prompt: 'Which factor is most important when sizing an income-replacement need?', options: ['The client’s favorite coverage amount', 'Income to replace, years needed, obligations, and existing resources', 'The agent’s sales goal', 'Only the mortgage balance'], answer: 1, explanation: 'A needs analysis should connect coverage to income, time horizon, obligations, goals, and resources already available.' },
  { id: 3, category: 'Life Protection', prompt: 'Why should employer-provided coverage be reviewed separately from individually owned coverage?', options: ['It is always more expensive', 'It may be tied to employment and may not be enough for the full need', 'It never pays a death benefit', 'It is illegal to own both'], answer: 1, explanation: 'Group coverage can be valuable, but portability, amount, exclusions, and continued eligibility should be confirmed.' },

  { id: 4, category: 'Living Benefits', prompt: 'What does a living-benefit feature generally do?', options: ['Allows qualifying access to part of a benefit while the insured is living', 'Guarantees long-term-care reimbursement in every policy', 'Removes underwriting', 'Converts all premiums to cash'], answer: 0, explanation: 'Living-benefit provisions can allow accelerated access under qualifying conditions. Definitions, triggers, charges, and availability vary.' },
  { id: 5, category: 'Living Benefits', prompt: 'What is the correct way to discuss qualifying illness triggers?', options: ['Promise the benefit will be paid', 'Explain that triggers and definitions are contract-specific and must be reviewed', 'Use the same definition for every policy', 'Avoid discussing limitations'], answer: 1, explanation: 'Contract terms control. Advisors should explain the concept without implying every condition or policy qualifies.' },
  { id: 6, category: 'Living Benefits', prompt: 'Why are living benefits relevant in an income-protection discussion?', options: ['They can help address financial strain from certain qualifying health events', 'They replace disability insurance in all cases', 'They are always free cash', 'They eliminate medical bills'], answer: 0, explanation: 'A qualifying event can create lost-income and care-cost pressure. Living-benefit features may provide liquidity, subject to contract terms.' },

  { id: 7, category: 'Mortgage Protection', prompt: 'A mortgage-protection need is best sized by reviewing:', options: ['Only the original loan amount', 'Remaining balance, term, household income, and survivor plan', 'The property tax bill only', 'A fixed number for every household'], answer: 1, explanation: 'The planning objective is housing stability, so the remaining obligation and survivor cash flow matter.' },
  { id: 8, category: 'Mortgage Protection', prompt: 'Why can term-based protection align with a mortgage need?', options: ['The obligation usually declines over a defined period', 'It builds the highest cash value', 'It has no underwriting', 'It pays the lender automatically in every design'], answer: 0, explanation: 'A temporary obligation can often be matched to a defined protection period. Ownership and beneficiary structure still matter.' },
  { id: 9, category: 'Mortgage Protection', prompt: 'What should be clarified before calling a strategy “mortgage protection”?', options: ['Who owns the coverage, who receives benefits, and what the family wants protected', 'Nothing—every policy is the same', 'Only the property address', 'Only the interest rate'], answer: 0, explanation: 'The phrase describes a planning objective. The actual contract, ownership, beneficiary, amount, and term determine how the need is addressed.' },

  { id: 10, category: 'Retirement Income', prompt: 'Why is monthly income often a better retirement conversation starter than account balance?', options: ['Retirement expenses are generally paid from ongoing cash flow', 'Balances never matter', 'Monthly income is always guaranteed', 'It avoids discussing risk'], answer: 0, explanation: 'Clients live on monthly cash flow. Converting assets and income sources into an income picture makes the planning gap visible.' },
  { id: 11, category: 'Retirement Income', prompt: 'Which sources are commonly reviewed as predictable retirement income?', options: ['Social Security, pensions, and contractual income sources', 'Only stock dividends', 'Credit cards', 'Home appreciation'], answer: 0, explanation: 'Predictable sources form the income floor. Other assets can then be evaluated for the remaining need and risks.' },
  { id: 12, category: 'Retirement Income', prompt: 'What risk describes the possibility of outliving retirement assets?', options: ['Longevity risk', 'Property risk', 'Title risk', 'Exchange risk'], answer: 0, explanation: 'Longevity risk is the risk that retirement lasts longer than the assets supporting it.' },
  { id: 13, category: 'Retirement Income', prompt: 'What should be reviewed when one spouse depends on the other spouse’s income sources?', options: ['Survivor continuation and beneficiary provisions', 'Only the current joint income total', 'Only the retirement date', 'Nothing until death occurs'], answer: 0, explanation: 'Income can change after the first death. Survivor benefits and continuation rules are central to retirement-income planning.' },

  { id: 14, category: 'Annuity Concepts', prompt: 'What is the basic insurance purpose of an annuity?', options: ['Convert or accumulate assets for income, including options that can address longevity risk', 'Insure a house against fire', 'Provide health insurance', 'Guarantee equity-market ownership'], answer: 0, explanation: 'Annuities are insurance contracts designed for accumulation and/or income. Guarantees depend on the claims-paying ability of the issuing insurer.' },
  { id: 15, category: 'Annuity Concepts', prompt: 'What should an advisor explain before discussing an annuity as an income solution?', options: ['Liquidity, surrender terms, guarantees, income options, fees/charges where applicable, and suitability', 'Only the illustrated income number', 'Only the index name', 'Nothing if the client is retired'], answer: 0, explanation: 'The client needs the tradeoffs, not just the benefit. Liquidity and contract terms are especially important.' },
  { id: 16, category: 'Annuity Concepts', prompt: 'What does “guaranteed” mean in an insurance-contract discussion?', options: ['Subject to the terms of the contract and claims-paying ability of the insurer', 'Backed by the stock market', 'Guaranteed by the advisor', 'A promise of investment performance'], answer: 0, explanation: 'Contract guarantees are obligations of the issuing insurer and must be described within the contract terms.' },

  { id: 17, category: 'Permanent Protection', prompt: 'How does permanent life protection generally differ from term protection?', options: ['It is designed to remain in force beyond a fixed term when required premiums and policy conditions are met', 'It has no costs', 'It never requires underwriting', 'It is always the cheapest option'], answer: 0, explanation: 'Permanent coverage is designed for long-duration needs and may include cash value. Terms, guarantees, and funding requirements vary.' },
  { id: 18, category: 'Permanent Protection', prompt: 'What is the correct way to discuss cash value?', options: ['Explain how it works under the specific contract, including access methods and potential policy impact', 'Call it a savings account with no conditions', 'Guarantee a future value not in the contract', 'Ignore loans and withdrawals'], answer: 0, explanation: 'Loans and withdrawals can reduce values and benefits and may have tax or lapse consequences. Contract-specific explanation matters.' },
  { id: 19, category: 'Permanent Protection', prompt: 'When is permanent protection most naturally tied to a planning need?', options: ['When the need is expected to continue for life or long duration', 'Only when a mortgage is exactly 30 years', 'Only for clients over 80', 'Never'], answer: 0, explanation: 'Permanent designs are often considered for lifelong legacy, final-expense, estate-liquidity, or other long-duration needs.' },

  { id: 20, category: 'Final Expense', prompt: 'What is the planning objective of final-expense coverage?', options: ['Create funds for immediate end-of-life and related obligations', 'Fund speculative trading', 'Replace homeowners insurance', 'Eliminate probate'], answer: 0, explanation: 'The goal is immediate liquidity for final arrangements and other near-term obligations the family identifies.' },
  { id: 21, category: 'Final Expense', prompt: 'Why should an advisor ask about savings already earmarked for final costs?', options: ['To avoid overstating the remaining funding gap', 'To disqualify the client', 'Because savings cannot be used for anything else', 'To determine a stock allocation'], answer: 0, explanation: 'Existing resources reduce the amount that must be funded elsewhere and help keep the recommendation tied to the actual need.' },
  { id: 22, category: 'Final Expense', prompt: 'What is a key disclosure when discussing simplified underwriting?', options: ['Eligibility and underwriting still apply, and acceptance is not guaranteed', 'Everyone is automatically approved', 'Health questions are irrelevant', 'Pricing is identical for everyone'], answer: 0, explanation: 'Simplified underwriting can reduce friction, but eligibility, questions, classifications, and availability still matter.' },

  { id: 23, category: 'Business Protection', prompt: 'What does key-person protection address?', options: ['Financial disruption if a person critical to the business dies or experiences a covered event', 'Only employee health claims', 'Office equipment replacement', 'Payroll taxes'], answer: 0, explanation: 'The business may depend heavily on an owner, executive, rainmaker, or specialist. Protection can provide liquidity during transition.' },
  { id: 24, category: 'Business Protection', prompt: 'A buy-sell funding discussion should start with:', options: ['Ownership structure, trigger events, valuation approach, and the agreement itself', 'A random coverage amount', 'The company logo', 'Only employee count'], answer: 0, explanation: 'Funding should follow the agreement and valuation, not replace them. Legal and tax professionals should be involved where appropriate.' },
  { id: 25, category: 'Business Protection', prompt: 'Why is business-owned coverage different from personal coverage?', options: ['Ownership, beneficiary, purpose, consent, accounting, tax, and documentation can differ', 'There is no difference', 'Businesses cannot own coverage', 'It never requires underwriting'], answer: 0, explanation: 'Business cases require careful structure and documentation. Coordination with legal and tax professionals may be necessary.' },

  { id: 26, category: 'Compliance', prompt: 'Which statement is appropriate in a client-facing educational conversation?', options: ['Benefits and availability depend on the specific contract, underwriting, and state', 'This will definitely make you money', 'You cannot lose under any circumstances', 'Every carrier works the same way'], answer: 0, explanation: 'Accurate, qualified language protects the client and keeps the discussion tied to the actual contract.' },
  { id: 27, category: 'Compliance', prompt: 'When discussing taxes, an insurance professional should:', options: ['Provide general education and recommend tax-professional review for individual tax advice', 'Prepare a legal tax opinion', 'Guarantee tax treatment forever', 'Ignore tax considerations'], answer: 0, explanation: 'Tax treatment depends on facts and law. Avoid individualized tax advice outside your professional scope.' },
  { id: 28, category: 'Compliance', prompt: 'What is the safest way to discuss an illustration?', options: ['Distinguish guaranteed and non-guaranteed elements and explain that an illustration is not a promise of future performance', 'Treat all illustrated values as guaranteed', 'Show only the highest value', 'Hide assumptions'], answer: 0, explanation: 'Clients should understand assumptions, guarantees, and non-guaranteed elements before relying on illustrated values.' },
  { id: 29, category: 'Compliance', prompt: 'Why should a recommendation document the client’s stated need?', options: ['It creates a clear link between the client objective and the strategy discussed', 'It is only useful for marketing', 'It replaces suitability analysis', 'It makes disclosures unnecessary'], answer: 0, explanation: 'Good documentation shows how the recommendation connects to the client’s situation and objectives.' },
  { id: 30, category: 'Compliance', prompt: 'What should happen if a client’s need cannot be supported by the information available?', options: ['Gather the missing information before making a recommendation', 'Guess', 'Use the same recommendation as the last client', 'Skip documentation'], answer: 0, explanation: 'A defensible recommendation depends on sufficient facts. Missing information should be resolved before moving forward.' },
]

const CATEGORY_ORDER = ['All', 'Life Protection', 'Living Benefits', 'Mortgage Protection', 'Retirement Income', 'Annuity Concepts', 'Permanent Protection', 'Final Expense', 'Business Protection', 'Compliance']

export default function KnowledgeCenterPage() {
  const [category, setCategory] = useState('All')
  const [index, setIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<number, number>>({})
  const [showExplanation, setShowExplanation] = useState(false)
  const started = useRef(false)

  const filtered = useMemo(() => category === 'All' ? QUESTIONS : QUESTIONS.filter((question) => question.category === category), [category])
  const current = filtered[index] ?? filtered[0]
  const answered = Object.keys(answers).length
  const correct = QUESTIONS.filter((question) => answers[question.id] === question.answer).length
  const score = answered ? Math.round((correct / answered) * 100) : 0

  useEffect(() => {
    if (started.current) return
    started.current = true
    void trackLatimoreEvent({ action: 'tool_started', tool: 'advisor_knowledge_center', category: 'Advisor Education' })
  }, [])

  function choose(answerIndex: number) {
    if (!current) return
    setAnswers((existing) => ({ ...existing, [current.id]: answerIndex }))
    setShowExplanation(true)
    void trackLatimoreEvent({
      action: 'quiz_answered',
      tool: 'advisor_knowledge_center',
      category: current.category,
      metadata: { questionId: current.id, correct: answerIndex === current.answer },
    })
  }

  function next() {
    if (index < filtered.length - 1) {
      setIndex(index + 1)
      setShowExplanation(false)
      return
    }
    const band = score >= 90 ? 'mastery' : score >= 80 ? 'proficient' : score >= 70 ? 'developing' : 'review_needed'
    void trackLatimoreEvent({ action: 'tool_completed', tool: 'advisor_knowledge_center', category: category === 'All' ? 'Advisor Education' : category, resultBand: band, metadata: { answered, score } })
  }

  function selectCategory(value: string) {
    setCategory(value)
    setIndex(0)
    setShowExplanation(false)
    void trackLatimoreEvent({ action: 'tool_step_completed', tool: 'advisor_knowledge_center', category: value, step: 'category_selected' })
  }

  function reset() {
    setAnswers({})
    setIndex(0)
    setShowExplanation(false)
  }

  return (
    <div className="mx-auto max-w-6xl p-5 md:p-8">
      <div className="flex flex-col gap-2">
        <p className="text-xs font-black uppercase tracking-[0.26em]" style={{ color: COLORS.gold }}>Latimore Advisor OS</p>
        <h1 className="text-3xl font-black text-white md:text-4xl">Knowledge Center</h1>
        <p className="max-w-3xl text-sm leading-6" style={{ color: COLORS.inkMuted }}>
          Carrier-neutral advisor training organized around the planning concepts clients actually hear from Latimore Life & Legacy.
        </p>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        {[
          ['Answered', answered],
          ['Correct', correct],
          ['Current Score', `${score}%`],
        ].map(([label, value]) => (
          <div key={label} className="rounded-2xl border border-white/10 bg-white/[0.035] p-5">
            <p className="text-xs font-bold uppercase tracking-wider" style={{ color: COLORS.inkMuted }}>{label}</p>
            <p className="mt-2 text-3xl font-black" style={{ color: COLORS.goldLight }}>{value}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        {CATEGORY_ORDER.map((item) => (
          <button key={item} onClick={() => selectCategory(item)} className="rounded-full border px-3 py-2 text-xs font-bold" style={{ borderColor: category === item ? COLORS.gold : 'rgba(255,255,255,.12)', background: category === item ? 'rgba(201,162,95,.12)' : 'transparent', color: category === item ? COLORS.goldLight : COLORS.inkMuted }}>
            {item}
          </button>
        ))}
      </div>

      {current ? (
        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_.34fr]">
          <section className="rounded-2xl border border-white/10 bg-white/[0.035] p-5 md:p-7">
            <div className="flex items-center justify-between gap-3">
              <span className="rounded-full px-3 py-1.5 text-xs font-black" style={{ background: 'rgba(201,162,95,.12)', color: COLORS.goldLight }}>{current.category}</span>
              <span className="text-xs" style={{ color: COLORS.inkMuted }}>{index + 1} / {filtered.length}</span>
            </div>
            <h2 className="mt-5 text-2xl font-black leading-9 text-white">{current.prompt}</h2>

            <div className="mt-6 grid gap-3">
              {current.options.map((option, optionIndex) => {
                const selected = answers[current.id] === optionIndex
                const isCorrect = optionIndex === current.answer
                const reveal = showExplanation && (selected || isCorrect)
                return (
                  <button key={option} disabled={showExplanation} onClick={() => choose(optionIndex)} className="flex items-start gap-3 rounded-xl border p-4 text-left text-sm leading-6 disabled:cursor-default" style={{ borderColor: reveal ? (isCorrect ? 'rgba(34,197,94,.55)' : 'rgba(239,68,68,.55)') : selected ? COLORS.gold : 'rgba(255,255,255,.1)', background: reveal ? (isCorrect ? 'rgba(34,197,94,.08)' : 'rgba(239,68,68,.08)') : 'rgba(0,0,0,.15)', color: 'rgba(255,255,255,.84)' }}>
                    <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-xs font-black" style={{ borderColor: 'rgba(255,255,255,.18)', color: COLORS.goldLight }}>{String.fromCharCode(65 + optionIndex)}</span>
                    <span>{option}</span>
                  </button>
                )
              })}
            </div>

            {showExplanation ? (
              <div className="mt-5 rounded-xl border p-4" style={{ borderColor: 'rgba(201,162,95,.24)', background: 'rgba(201,162,95,.06)' }}>
                <div className="flex items-center gap-2 text-sm font-black" style={{ color: answers[current.id] === current.answer ? '#86efac' : '#fca5a5' }}>
                  {answers[current.id] === current.answer ? <CheckCircle2 size={17} /> : <XCircle size={17} />}
                  {answers[current.id] === current.answer ? 'Correct' : 'Review this concept'}
                </div>
                <p className="mt-2 text-sm leading-6 text-white/75">{current.explanation}</p>
              </div>
            ) : null}

            <div className="mt-6 flex items-center justify-between gap-3">
              <button onClick={() => { if (index > 0) { setIndex(index - 1); setShowExplanation(false) } }} disabled={index === 0} className="rounded-xl border border-white/10 px-4 py-2.5 text-sm font-bold text-white/70 disabled:opacity-30">Previous</button>
              <button onClick={next} disabled={!showExplanation} className="rounded-xl px-5 py-2.5 text-sm font-black disabled:opacity-40" style={{ background: COLORS.gold, color: COLORS.navyDeep }}>{index === filtered.length - 1 ? 'Finish Track' : 'Next Question'}</button>
            </div>
          </section>

          <aside className="rounded-2xl border border-white/10 bg-white/[0.035] p-5">
            <div className="flex items-center gap-2"><BookOpenCheck size={19} style={{ color: COLORS.gold }} /><h2 className="font-black text-white">Progress</h2></div>
            <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full" style={{ width: `${Math.round(((index + 1) / filtered.length) * 100)}%`, background: COLORS.gold }} /></div>
            <p className="mt-3 text-xs leading-5" style={{ color: COLORS.inkMuted }}>Every answer is tracked by concept so weak areas can be surfaced in the Tracking Command Center without exposing carrier or proprietary product data.</p>
            <button onClick={reset} className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 px-4 py-3 text-sm font-bold text-white/75"><RotateCcw size={15} /> Reset Session</button>
          </aside>
        </div>
      ) : null}
    </div>
  )
}
