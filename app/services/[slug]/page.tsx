import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Fragment } from 'react'
import { BRAND } from '@/lib/brand'
import { SiteHeader, SiteFooter, DEFAULT_NAV_LINKS } from '@/app/_components/site-shell'
import { SERVICE_PAGES, getServicePage, type ServicePageContent } from '@/lib/services-content'

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://latimorelifelegacy.com'
const NAVY = '#0E1A2B'
const GOLD = '#C9A24D'
const GOLD_LIGHT = '#E5C882'
const CRIMSON = '#7A2331'

/**
 * Public-site compliance normalization.
 *
 * The source catalog contains legacy campaign copy that sometimes states tax,
 * index-crediting, rollover, FAFSA, probate, or benefit outcomes too
 * categorically. Keep those source records intact for now, but normalize every
 * public service page (including metadata) through this layer so visitors see
 * conditional, contract-specific language.
 */
const SAFE_COPY: Record<string, string> = {
  'Affordable term and permanent life insurance for Pennsylvania families. Living benefits included. Serving Schuylkill, Luzerne & Northumberland Counties. Free consultation.':
    'Term and permanent life insurance options for Pennsylvania families. Living-benefit riders may be available subject to policy terms and eligibility. Serving Schuylkill, Luzerne & Northumberland Counties.',
  "We specialize in policies with **Living Benefits** — meaning if you're diagnosed with a critical, chronic, or terminal illness, you may be able to access your death benefit early. Over 76% of Americans experience one of these events. Your policy should be ready for it.":
    "We specialize in policies that may offer **Living Benefits**. If you're diagnosed with a qualifying critical, chronic, or terminal illness, an eligible rider may allow access to a portion of the death benefit early, subject to policy terms and carrier requirements.",
  'Over 76% of Americans experience a critical, chronic, or terminal illness in their lifetime.':
    'Living-benefit eligibility depends on the policy, rider definitions, diagnosis, and carrier requirements.',
  'Lifelong protection with guaranteed premiums and cash value growth. Whole life and IUL options available. Build tax-advantaged savings you can access during your lifetime.':
    'Permanent life insurance may provide lifelong coverage when required premiums and policy conditions are met. Guarantees, cash-value growth, charges, and access rules vary by product and carrier.',
  "Access your death benefit early if diagnosed with a qualifying critical, chronic, or terminal illness. Protect your family's finances during the hardest moments — not just after.":
    'Eligible living-benefit riders may allow early access to a portion of the death benefit after a qualifying diagnosis. Rider availability, eligibility, benefit amounts, and charges vary by policy.',
  "Ensure your family can stay in the home you've worked so hard to build. Term life structured to match your mortgage balance and payoff timeline.":
    'Coverage can be structured around a mortgage balance and payoff timeline to provide beneficiaries with funds that may help protect the household after a covered death.',
  'Life insurance proceeds pass to your beneficiaries 100% income-tax-free. No probate. No delays. Your family gets the money when they need it most.':
    'Life-insurance death benefits are generally income-tax-free under current federal law. Proper beneficiary designations may allow proceeds to pass outside probate, but tax and estate treatment depend on ownership, beneficiary, and individual circumstances.',
  "We use the DIME method: Debt + Income × 10 + Mortgage + Education. In your free review, we'll calculate your exact number together.":
    "We may use the DIME method—Debt, Income, Mortgage, and Education—as one starting point for estimating a family's protection need. The appropriate amount depends on your circumstances and budget.",
  "Living Benefits allow you to access a portion of your death benefit while still alive if you're diagnosed with a qualifying critical, chronic, or terminal illness. Not all policies include them — we make sure yours does.":
    'Living-benefit riders may allow access to a portion of the death benefit after a qualifying critical, chronic, or terminal illness. Not every policy includes the same riders, so we compare available options and explain their terms.',

  'Keep Your Family in the Home You Built — No Matter What Happens':
    'Help Protect the Home Your Family Depends On',
  '76% of Schuylkill County *Homeowners* Have No Mortgage Protection':
    'A Mortgage Needs a *Protection Plan* Too',
  "Your home is your family's most important asset. But most homeowners in Central Pennsylvania have no plan for what happens to their mortgage if they pass away, become seriously ill, or are unable to work.":
    "For many households, the mortgage is one of the largest monthly obligations. A protection review can help identify how the household would handle that payment after a covered death or, where an eligible rider applies, a qualifying illness.",
  "Mortgage Protection Insurance ensures your family can stay in the home you've worked so hard to build — without the burden of mortgage payments during the worst possible time. It's not just life insurance. It's a promise to your family that their home is safe.":
    'Mortgage-protection life insurance can provide a death benefit to your chosen beneficiary. Those funds may be used for mortgage payments, payoff, income replacement, or other household needs; the policy does not itself guarantee that a home will be retained.',
  'With 76.1% homeownership in Schuylkill County — one of the highest rates in Pennsylvania — mortgage protection is one of the most critical and underserved needs in our community.':
    'For homeowners, matching life-insurance coverage to the mortgage and broader income-replacement need can be one component of a household protection strategy.',
  'Schuylkill County has one of the highest homeownership rates in Pennsylvania — and most homes are unprotected.':
    'A mortgage review can help determine whether existing life-insurance coverage is sufficient for housing and income-replacement needs.',
  'If you pass away, the policy pays off your mortgage balance — your family keeps the home, free and clear.':
    'If a covered insured dies while the policy is in force, the named beneficiary receives the death benefit and may choose to use those proceeds toward the mortgage or other needs.',
  'Living Benefits allow you to access your benefit early if diagnosed with a qualifying critical illness — keeping mortgage payments covered during recovery.':
    'If the policy includes an eligible living-benefit rider, a qualifying illness may permit early access to a portion of the death benefit, which could help with housing or other expenses during recovery.',
  "Combine mortgage protection with income replacement coverage to ensure your family's full financial stability.":
    'Mortgage-focused coverage can be coordinated with broader income-replacement needs as part of a household protection plan.',
  'Many carriers offer simplified underwriting with no medical exam required — coverage decisions in days, not weeks.':
    'Some carriers offer simplified-underwriting or no-exam pathways for eligible applicants. Approval method and timing vary by carrier, age, health, and coverage amount.',
  'No. PMI (Private Mortgage Insurance) protects the lender. Mortgage Protection Insurance protects your family — it pays off your mortgage so your family keeps the home.':
    'No. PMI generally protects the lender. Mortgage-protection life insurance pays a death benefit to the named beneficiary, who may use the proceeds toward the mortgage or other household needs.',

  'Build guaranteed retirement income you cannot outlive. Serving Schuylkill, Luzerne & Northumberland Counties, PA. Free retirement income review with Jackson Latimore Sr.':
    'Explore contract-based retirement-income options, including fixed and fixed indexed annuities, for Pennsylvania residents. Guarantees depend on contract terms and the claims-paying ability of the issuing insurer.',
  'Replace Your Paycheck With Income You Cannot Outlive':
    'Explore Contract-Based Lifetime Income Options',
  "The #1 fear of retirees is running out of money. With 20%+ of Schuylkill County's population over age 65 — and that number growing — guaranteed income planning has never been more critical for Central Pennsylvania families.":
    'Running out of money is a significant retirement concern. A retirement-income review can help evaluate how guaranteed and non-guaranteed income sources may work together.',
  'We help pre-retirees and retirees build a guaranteed income floor using Fixed Indexed Annuities, IUL distributions, and Social Security optimization — so you never have to worry about outliving your money.':
    'We help pre-retirees and retirees evaluate fixed and fixed indexed annuities, life-insurance cash-value strategies, and the role of Social Security in an overall income plan. Lifetime-income guarantees, when available, depend on contract provisions and insurer claims-paying ability.',
  'Fixed Indexed Annuities contractually guarantee your principal — you never lose to market downturns.':
    'Fixed indexed annuities do not directly participate in the stock market. Contract value is not reduced solely because an external index declines, but surrender charges, withdrawals, rider charges, and other contract terms can affect value.',
  'A properly structured annuity pays guaranteed income for as long as you live — you cannot outlive it.':
    'Certain annuity contracts or optional riders can provide lifetime income when contract requirements are met. Terms, costs, payout factors, and guarantees vary by product and carrier.',
  'Some clients generate 10%+ annually in guaranteed lifetime income vs. the traditional 4% rule.':
    'Income percentages are contract-specific and are not equivalent to investment returns. Payout rates, rider bases, age, product terms, and withdrawals all affect the amount available.',
  'Fixed Indexed Annuities guarantee your principal is never reduced by market downturns. Your savings floor is contractually protected.':
    'Fixed indexed annuities can protect contract value from direct index losses, subject to contract terms. Withdrawals, surrender charges, rider charges, and other adjustments may still reduce value.',
  'Earn interest linked to a market index — capturing upside growth without direct market exposure. Gains are locked in annually.':
    'Interest may be credited using formulas linked to an external market index without direct ownership of the index. Caps, participation rates, spreads, crediting periods, and other contract terms determine credited interest.',
  'Income riders provide a guaranteed withdrawal benefit you cannot outlive — regardless of account value or market performance.':
    'Optional income riders may provide contract-based lifetime withdrawals when rider and contract conditions are met. Rider charges, payout factors, and restrictions vary.',
  'We help you determine the optimal Social Security claiming strategy to maximize your lifetime benefit.':
    'We can discuss how Social Security fits into an insurance-based retirement-income review. Claiming decisions should also be evaluated using SSA information and, when appropriate, qualified tax or financial professionals.',
  'IUL distributions and Roth-alternative strategies create tax-free income in retirement — keeping you in the lowest possible tax bracket.':
    'Properly structured non-MEC life-insurance policies may permit tax-advantaged access through withdrawals and policy loans under current tax rules. Loans and withdrawals reduce cash value and death benefit, and lapse or surrender can create tax consequences.',
  'Many annuities include a death benefit that passes remaining account value to your beneficiaries — tax-efficiently.':
    'Many annuities provide a beneficiary or death-benefit provision. Beneficiaries may owe income tax on taxable gain, and contract-specific payout rules apply.',
  "An FIA is a contract with an insurance company that guarantees your principal while crediting interest based on a market index. When the index goes up, you earn. When it goes down, you don't lose. It's the foundation of our retirement income strategy.":
    'A fixed indexed annuity is an insurance contract that may credit interest using an external index formula. It does not directly invest in the index. A negative index period generally does not create a negative index credit, but contract charges, withdrawals, and surrender provisions can reduce value.',
  'Yes. We help clients roll over old 401(k)s and IRAs into Fixed Indexed Annuities with no taxes, no penalties, and no fees on the transfer. Your money keeps working — with better protection.':
    'Eligible retirement assets may be moved through a properly executed direct rollover or trustee-to-trustee transfer while preserving tax-deferred status under applicable IRS rules. Product suitability, surrender schedules, contract charges, and account-specific tax rules must be reviewed first.',
  'Build Income You Cannot Outlive':
    'Build a Retirement Income Strategy',

  'Roll over your old 401(k) or IRA with no taxes, no penalties, and no fees. Serving Central Pennsylvania. Free rollover consultation with Jackson Latimore Sr.':
    'Review options for an old 401(k), 403(b), IRA, or other eligible retirement account. Direct-rollover tax treatment and annuity terms depend on account type, IRS rules, product suitability, and contract provisions.',
  'No Taxes. No Penalties. No Fees. More Control Over Your Retirement.':
    'Understand Your Rollover Options, Tax Rules, and Contract Terms',
  "When you change jobs or retire, your old 401(k) doesn't have to stay where it is — collecting hidden fees, exposed to market volatility, and tied to a company you no longer work for. Most people leave old retirement accounts behind simply because they don't know their options.":
    'When you change jobs or retire, an old employer plan may be left in place, rolled into a new employer plan if permitted, rolled to an IRA, converted where eligible, or distributed. Each option has different fees, investment choices, creditor protections, tax consequences, and access rules.',
  "The most common advice is to roll it into a new 401(k) or IRA. But the issue is there's still no guarantee. You still don't have full access to it, and if that company goes bankrupt, your money could go with it.":
    'Employer-plan assets are generally held separately from an employer’s business assets, but plan rules, fees, investment menus, and portability still matter. A rollover decision should compare the protections and tradeoffs of the existing plan, a new employer plan, an IRA, and any suitable insurance product.',
  'We help clients move old retirement accounts into Fixed Indexed Annuities — with no taxes, no penalties, and no fees on the transfer — giving you principal protection, market-linked growth, and guaranteed lifetime income.':
    'When a fixed or fixed indexed annuity is suitable, eligible retirement assets may be transferred through a properly executed rollover while maintaining tax-deferred status. Annuity surrender schedules, charges, index-crediting terms, liquidity limits, and optional rider costs must be considered.',
  '"I had a client who had over $100K in his old 401(k). He got laid off. Two months later, the company went bankrupt. He lost all but $12 of his retirement. That is not a good place to be." — Jackson M. Latimore Sr.':
    '"A rollover is not automatically better. The right decision starts with comparing the old plan, your alternatives, the tax rules, liquidity, fees, and the guarantees you actually need." — Jackson M. Latimore Sr.',
  'A direct rollover from a 401(k) or IRA to an annuity triggers no taxes and no penalties when done correctly.':
    'A properly executed direct rollover of eligible pre-tax retirement assets generally preserves tax-deferred status. Roth, after-tax, distribution, and account-specific rules can differ.',
  'Some FIA strategies have averaged 9–10% annually over 30 years — vs. 5–7% for most 401(k) accounts.':
    'Indexed-annuity crediting varies by index strategy, cap, participation rate, spread, crediting period, and carrier. Past index performance does not guarantee future credited interest.',
  'Income riders provide guaranteed withdrawals for as long as you live — you cannot outlive your income.':
    'Eligible contracts or optional income riders may provide lifetime withdrawals when contract conditions are met. Rider charges and payout terms vary.',
  'Your principal is contractually guaranteed. You will never lose another dollar to market downturns — ever.':
    'Fixed and fixed indexed annuities provide contract guarantees subject to their terms and the insurer’s claims-paying ability. Index declines do not directly reduce indexed interest credits, but charges and withdrawals can reduce contract value.',
  'A guaranteed minimum rate of return ensures your money grows — even in flat or down markets.':
    'Crediting terms vary by annuity and allocation option. Some contracts include guaranteed minimum values; indexed strategies can receive a 0% index credit for a crediting period.',
  'Your account is credited based on market index performance — capturing upside while locking in gains annually.':
    'Interest may be credited using an external market index formula. Caps, participation rates, spreads, and crediting periods determine the amount credited, if any.',
  'Take income for as long as you live — a personal pension that replaces your paycheck in retirement.':
    'Certain annuity contracts or optional riders can provide contract-based lifetime income, subject to payout factors, rider terms, and insurer claims-paying ability.',
  "Some carriers offer premium bonuses on rollover amounts — potentially boosting your account value on day one.":
    'Some annuity contracts offer premium bonuses. Bonus amounts may be subject to vesting schedules, surrender charges, withdrawal restrictions, and other contract terms.',
  'A properly executed direct rollover triggers no taxes, no penalties, and no fees — your full balance transfers.':
    'A properly executed direct rollover of eligible assets can generally preserve tax-deferred status. Plan fees, product charges, surrender schedules, and tax treatment vary and should be reviewed before moving funds.',
  'Yes — with a direct rollover. The money moves directly from your old plan to the new account without passing through your hands, so no taxes or penalties are triggered.':
    'A direct rollover of eligible pre-tax retirement assets generally preserves tax-deferred status and avoids mandatory withholding. Tax treatment differs for Roth, after-tax, ineligible, or improperly handled distributions.',
  'A direct rollover moves funds directly between institutions — no tax withholding. An indirect rollover sends you a check, and you have 60 days to deposit it. We always recommend direct rollovers to avoid complications.':
    'A direct rollover generally moves eligible retirement funds without payment to you and can avoid mandatory withholding. An indirect rollover is subject to additional withholding and timing rules. The appropriate method depends on the account and transaction.',
  "Yes. We work with 401(k), 403(b), 457, TSP, IRA, and Roth IRA accounts. Each has specific rules — we'll walk you through the right process for your account type.":
    'Many 401(k), 403(b), governmental 457(b), TSP, and IRA assets may be eligible for rollover or transfer, but account type, plan rules, Roth status, age, and distribution eligibility matter. We review the insurance-product options while tax questions should be confirmed with the plan administrator or a qualified tax professional.',
  'Free 30-Minute Rollover Consultation · No Taxes · No Penalties · No Fees':
    'Free 30-Minute Rollover Options Review · No Obligation',

  "Tax-advantaged college funding strategies for Pennsylvania families. Doesn't count against financial aid. Free consultation with Jackson Latimore Sr.":
    'Explore life-insurance-based college and family-funding strategies for Pennsylvania families. FAFSA treatment, tax treatment, policy access, and costs depend on current rules and individual circumstances.',
  "Protect Your Child's Future — Tax-Advantaged, Flexible, and Financial-Aid Friendly":
    "Protect Your Child's Future With Flexible, Protection-Focused Options",
  "Across Schuylkill, Luzerne, and Northumberland Counties, there are 31 school districts — and thousands of families who want to give their children a head start but don't know where to begin. Traditional college savings plans like 529s have limitations: they count against financial aid, can only be used for education, and offer no protection if something happens to the parent.":
    'Families can choose among 529 plans, taxable savings, custodial accounts, and life-insurance-based strategies. Each has different tax rules, eligible uses, financial-aid treatment, fees, liquidity, and protection features; no single option is best for every family.',
  "Our College Funding Protection Plan uses life insurance-based savings vehicles that grow tax-advantaged, don't count against financial aid, and can be used for anything — not just tuition. And if something happens to you, your child's future is still protected.":
    'Permanent life insurance may build tax-deferred cash value while also providing a death benefit. Under current FAFSA rules, life-insurance cash value generally is not reported as an investment asset, but financial-aid rules can change and other aid methodologies may treat assets differently.',
  "Life insurance-based savings vehicles don't count against FAFSA financial aid calculations — unlike 529 plans.":
    'Under current FAFSA rules, life-insurance cash value generally is not reported as an investment asset. 529 plans have different reporting rules, and FAFSA or institutional-aid rules can change.',
  'Cash value grows tax-deferred and can be accessed tax-free — maximizing every dollar saved.':
    'Cash value generally grows tax-deferred. Access through withdrawals or policy loans may receive favorable income-tax treatment when policy and tax-law requirements are met; loans and withdrawals reduce policy values and benefits.',
  "Life insurance cash value is not counted as an asset on the FAFSA — preserving your child's eligibility for grants and scholarships.":
    'Under current FAFSA rules, life-insurance cash value generally is not reported as an investment asset. That does not guarantee aid eligibility, and other financial-aid methodologies may differ.',
  'Funds can be used for college, trade school, starting a business, buying a car, or anything else — no penalties for non-education use.':
    'Policy loans or withdrawals are not restricted to qualified education expenses, but they reduce cash value and death benefit and may create tax consequences if the policy lapses, is surrendered, or is a MEC.',
  "If something happens to you, the life insurance component ensures your child's future is still funded — even if you're not here to contribute.":
    'If the insured dies while eligible coverage is in force, the death benefit can provide resources for the beneficiary. The amount available depends on the policy, outstanding loans, and other contract terms.',
  'Cash value grows tax-deferred inside the policy and can be accessed tax-free — maximizing the value of every dollar you save.':
    'Cash value generally grows tax-deferred. Properly structured access may receive favorable income-tax treatment under current law, subject to policy status, MEC rules, loans, withdrawals, and other conditions.',
  "A 529 plan is limited to education expenses and counts against financial aid. Our life insurance-based strategy has no use restrictions, doesn't affect financial aid, includes life insurance protection, and offers tax-free access to funds.":
    'A 529 plan and permanent life insurance serve different primary purposes. 529 plans offer education-focused tax benefits; permanent life insurance provides death-benefit protection and may build cash value. FAFSA treatment, taxes, costs, access, and suitability differ, so both should be compared on their actual rules.',
  'Better Than a 529 — *Here\'s Why*':
    'How It Differs From a 529 — *Key Tradeoffs*',

  'Life insurance proceeds pass to beneficiaries 100% income-tax-free — bypassing probate entirely.':
    'Life-insurance death benefits are generally income-tax-free under current federal law. Proper beneficiary designations may allow proceeds to pass outside probate; ownership, beneficiary, estate, and tax circumstances matter.',
  'Life insurance and properly structured trusts bypass probate entirely — giving your family immediate access to funds without court delays.':
    'Proper beneficiary designations and attorney-drafted trust structures may allow certain assets to pass outside probate. Probate treatment and access timing depend on the asset, ownership, beneficiary designation, and applicable law.',
  'Strategic use of life insurance minimizes estate taxes and maximizes the after-tax value of what you pass on to the next generation.':
    'Life insurance may provide estate liquidity or support wealth-transfer goals. Estate-tax treatment depends on ownership, beneficiary structure, estate size, and applicable law; coordinate with qualified legal and tax professionals.',
  'Life insurance provides an immediate, tax-free death benefit that bypasses probate — giving your family liquidity to pay estate taxes, settle debts, and equalize inheritances without forcing a sale of assets.':
    'Life insurance generally provides an income-tax-free death benefit under current federal law. Proper beneficiary designations may provide liquidity outside probate, but estate inclusion, tax treatment, timing, and ownership structure require individual legal and tax review.',
  "Generational wealth planning goes beyond a will — it's a comprehensive strategy to protect, preserve, and pass on your assets to the next generation in the most tax-efficient way possible, using life insurance, trusts, and strategic beneficiary designations.":
    'Generational wealth planning coordinates protection, beneficiary designations, and attorney-prepared estate documents. Life insurance can support liquidity and transfer goals, while legal and tax professionals should address wills, trusts, estate taxes, and legal ownership structures.',
  'Latimore Life & Legacy LLC helps Central Pennsylvania families connect protection planning with wills, trusts, powers of attorney, and healthcare directives — ensuring your wishes are followed and your legacy is preserved.':
    'Latimore Life & Legacy LLC helps Central Pennsylvania families coordinate insurance protection and beneficiary planning with estate documents prepared by qualified attorneys. We do not draft wills or trusts or provide legal advice.',

  'IUL insurance for tax-free retirement income, college funding, and wealth accumulation in Pennsylvania. Serving Schuylkill, Luzerne & Northumberland Counties. Free consultation.':
    'Indexed universal life insurance education for Pennsylvania families, including death-benefit protection, cash-value accumulation, policy access, charges, and tax considerations.',
  'Grow Tax-Free. Access Tax-Free. Pass On Tax-Free. The Triple Threat.':
    'Permanent Protection With Tax-Deferred Cash-Value Potential and Index-Linked Crediting',
  'The Most Powerful *Tax-Advantaged Tool* Most People Have Never Heard Of':
    'A Flexible *Life Insurance Tool* With Important Tradeoffs',
  'An Indexed Universal Life (IUL) policy combines permanent life insurance protection with tax-deferred cash value growth linked to a market index — with a guaranteed floor of zero, so you never lose money due to market downturns.':
    'An Indexed Universal Life (IUL) policy combines permanent life-insurance protection with cash value that may receive interest credits through an external index formula. A 0% index-crediting floor can prevent a negative credit solely from index performance, but policy charges, loans, withdrawals, and other factors can reduce cash value.',
  'Unlike a 401(k) or IRA, an IUL has no contribution limits, no age restrictions on access, no required minimum distributions, and no market loss. Your money grows indexed to the market — capturing upside gains while being protected from downside risk.':
    'IUL is life insurance, not a retirement plan or direct market investment. Premium funding is constrained by underwriting, policy design, and tax-law limits. Cash value may be accessible through withdrawals or loans, while charges, lapse risk, MEC rules, caps, participation rates, and spreads materially affect outcomes.',
  'The IUL is the cornerstone of our tax-free retirement strategy — and one of the most powerful tools available to Pennsylvania families and business owners who want to build wealth without the tax burden of traditional retirement accounts.':
    'For suitable clients who need permanent life insurance, IUL can be evaluated alongside qualified retirement plans and other savings vehicles. It should not be presented as a universal replacement for a 401(k), IRA, or other retirement account.',
  '"If you wrote us a check for $420,000 and we wrote you back a check for $3.3 million tax-free — would that be a good deal or a great deal?" — Jackson M. Latimore Sr.':
    '"An IUL should be judged by the protection need, policy design, costs, assumptions, and long-term funding discipline — not by a headline illustration." — Jackson M. Latimore Sr.',
  'A guaranteed floor of zero means your cash value never decreases due to market downturns — ever.':
    'A 0% index-crediting floor can prevent a negative index credit, but policy charges, loans, withdrawals, and other contract activity can still reduce cash value.',
  'IUL accounts have averaged approximately 9% annually over the last 30 years — vs. 5–7% for most 401(k)s.':
    'IUL credited interest varies by policy, index strategy, caps, participation rates, spreads, crediting periods, charges, and funding. Illustrations are not guarantees of future performance.',
  'Grow tax-free. Access tax-free. Pass on tax-free. The IUL is a triple tax advantage no other product matches.':
    'Cash value generally grows tax-deferred. Death benefits are generally income-tax-free under current federal law, and policy access may receive favorable tax treatment when requirements are met. Loans, withdrawals, MEC status, lapse, and surrender can change tax results.',
  'Unlike 401(k)s and IRAs, IULs have no IRS contribution limits and no required minimum distributions at age 73.':
    'IUL policies do not use the same annual contribution framework or RMD rules as qualified retirement accounts, but premium funding is limited by underwriting, policy design, and tax-law requirements.',
  'Five Reasons IUL *Outperforms* Traditional Retirement Accounts':
    'Five IUL Features and *Tradeoffs to Understand*',
  "The life insurance component protects your family with a tax-free death benefit — and Living Benefits if you're diagnosed with a qualifying illness.":
    'The life-insurance component provides a death benefit while coverage remains in force. Death benefits are generally income-tax-free under current federal law; eligible living-benefit riders may be available subject to policy terms.',
  'Access your cash value at any age without the 10% early withdrawal penalty that applies to 401(k)s before age 59½.':
    'Policy cash value may be available through loans or withdrawals without the qualified-plan early-distribution framework. Access reduces policy values and may have tax consequences, particularly for MECs or policies that lapse or are surrendered.',
  'Take tax-free distributions in retirement — keeping you in the lowest possible tax bracket and maximizing your Social Security benefit.':
    'Properly structured withdrawals and policy loans may receive favorable income-tax treatment under current law. They reduce cash value and death benefit, and tax consequences can arise if policy requirements are not maintained.',
  "One of the most popular ways to save for your child's future — doesn't count against financial aid and can be used for anything.":
    'Cash value may provide flexible access for family goals. Under current FAFSA rules, life-insurance cash value generally is not reported as an investment asset, but aid methodologies and rules can change.',
  'Average 9% annual growth over 30 years — with zero market loss. Your money compounds faster and more safely than in a traditional savings account.':
    'Credited interest is not guaranteed at a historical average and depends on the policy’s crediting formula and charges. A 0% index-crediting floor does not prevent cash value from declining because of policy costs, loans, or withdrawals.',
  "$420K contributed → $3.3M+ tax-free in an IUL vs. $1M+ taxable in a 401(k). The difference is the tax treatment — and it's enormous.":
    'Illustrated IUL values depend on non-guaranteed assumptions, policy design, charges, funding, and crediting terms. Compare guaranteed and non-guaranteed values with qualified-plan alternatives rather than relying on a single hypothetical projection.',
  "It's not — because there is a catch. Insurance companies impose a cap on the maximum interest you can earn in a given year (typically 10–15%). This is how they can guarantee you won't lose money. You give up some upside in exchange for downside protection. Most clients find this trade-off very favorable.":
    'IUL has material tradeoffs. Index credits may be limited by caps, participation rates, spreads, and crediting methods; policy charges and lapse risk also matter. A 0% index-crediting floor does not mean the policy cannot lose cash value. Review both guaranteed and non-guaranteed illustration values before deciding.',
  'A 401(k) is pre-tax (you pay taxes later, when rates may be higher), has contribution limits, has age restrictions on access, and has required minimum distributions at 73. An IUL is post-tax (you pay taxes now, then grow and access tax-free), has no contribution limits, no age restrictions, and no RMDs.':
    'A 401(k) and an IUL serve different primary purposes. A 401(k) is a qualified retirement plan with contribution, distribution, tax, and RMD rules; an IUL is life insurance with underwriting, premium, cash-value, loan, charge, and lapse considerations. Compare them based on protection need, costs, taxes, liquidity, and guarantees.',
  'Grow Tax-Free. Retire Tax-Free.':
    'Review Whether IUL Fits Your Protection Strategy',
}

function safeCopy(value: string): string {
  return SAFE_COPY[value] ?? value
}

function safeStatValue(slug: string, label: string, value: string): string {
  if (slug === 'life-insurance' && label === 'Americans Face Critical Illness') return 'Rider'
  if (slug === 'mortgage-protection' && label === 'Homeownership Rate') return 'Review'
  if (slug === 'retirement-income' && label === 'Market Loss Guarantee') return '0%*'
  if (slug === 'retirement-income' && label === 'Annual Income Potential') return 'Varies'
  if (slug === '401k-rollover' && label === 'Maximum Market Loss') return '0%*'
  if (slug === '401k-rollover' && label === 'Average Annual Growth Potential') return 'Varies'
  if (slug === 'college-funding' && label === 'Impact on Financial Aid') return 'FAFSA*'
  if (slug === 'college-funding' && label === 'Growth & Withdrawals') return 'Tax-Advantaged'
  if (slug === 'estate-planning' && label === 'Life Insurance Death Benefit') return 'Generally*'
  if (slug === 'iul-strategy' && label === 'Maximum Annual Market Loss') return '0%*'
  if (slug === 'iul-strategy' && label === 'Average Annual Growth (30 Years)') return 'Varies'
  if (slug === 'iul-strategy' && label === 'Tax-Free Advantage') return '3'
  if (slug === 'iul-strategy' && label === 'Contribution Limits or RMDs') return 'Policy'
  return value
}

function safeStatLabel(slug: string, label: string): string {
  if (slug === 'life-insurance' && label === 'Americans Face Critical Illness') return 'Living Benefits Eligibility'
  if (slug === 'mortgage-protection' && label === 'Homeownership Rate') return 'Home Protection Review'
  if (slug === 'retirement-income' && label === 'Market Loss Guarantee') return 'Index-Crediting Floor*'
  if (slug === 'retirement-income' && label === 'Annual Income Potential') return 'Income Terms Vary'
  if (slug === '401k-rollover' && label === 'Maximum Market Loss') return 'Index-Crediting Floor*'
  if (slug === '401k-rollover' && label === 'Average Annual Growth Potential') return 'Crediting Varies'
  if (slug === 'college-funding' && label === 'Impact on Financial Aid') return 'Current FAFSA Treatment*'
  if (slug === 'college-funding' && label === 'Growth & Withdrawals') return 'Policy Tax Treatment'
  if (slug === 'iul-strategy' && label === 'Maximum Annual Market Loss') return 'Index-Crediting Floor*'
  if (slug === 'iul-strategy' && label === 'Average Annual Growth (30 Years)') return 'Crediting Depends on Policy Terms'
  if (slug === 'iul-strategy' && label === 'Tax-Free Advantage') return 'Tax Considerations'
  if (slug === 'iul-strategy' && label === 'Contribution Limits or RMDs') return 'Different Rules Than Qualified Plans'
  return safeCopy(label)
}

function hardenServicePage(page: ServicePageContent): ServicePageContent {
  return {
    ...page,
    metaTitle: safeCopy(page.metaTitle),
    metaDescription: safeCopy(page.metaDescription),
    heroPrefix: safeCopy(page.heroPrefix),
    heroEm: safeCopy(page.heroEm),
    heroTagline: safeCopy(page.heroTagline),
    heroCtaLabel: safeCopy(page.heroCtaLabel),
    problemLabel: safeCopy(page.problemLabel),
    problemHeading: safeCopy(page.problemHeading),
    problemParagraphs: page.problemParagraphs.map(safeCopy),
    pullQuote: safeCopy(page.pullQuote),
    stats: page.stats.map((stat) => ({
      value: safeStatValue(page.slug, stat.label, stat.value),
      label: safeStatLabel(page.slug, stat.label),
      desc: safeCopy(stat.desc),
    })),
    benefitsLabel: safeCopy(page.benefitsLabel),
    benefitsHeading: safeCopy(page.benefitsHeading),
    benefits: page.benefits.map((benefit) => ({
      ...benefit,
      title: safeCopy(benefit.title),
      desc: safeCopy(benefit.desc),
    })),
    stepsLabel: page.stepsLabel ? safeCopy(page.stepsLabel) : undefined,
    stepsHeading: page.stepsHeading ? safeCopy(page.stepsHeading) : undefined,
    steps: page.steps?.map((step) => ({ ...step, title: safeCopy(step.title), desc: safeCopy(step.desc) })),
    faqLabel: safeCopy(page.faqLabel),
    faqHeading: safeCopy(page.faqHeading),
    faqs: page.faqs.map((faq) => ({ q: safeCopy(faq.q), a: safeCopy(faq.a) })),
    keywordTags: page.keywordTags,
    ctaHeading: safeCopy(page.ctaHeading),
    ctaSubtext: safeCopy(page.ctaSubtext),
  }
}

export async function generateStaticParams() {
  return SERVICE_PAGES.map((page) => ({ slug: page.slug }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const rawPage = getServicePage(slug)
  if (!rawPage) return {}
  const page = hardenServicePage(rawPage)

  return {
    title: page.metaTitle,
    description: page.metaDescription,
    keywords: page.keywords,
    alternates: { canonical: `/services/${slug}` },
    openGraph: {
      title: page.metaTitle,
      description: page.metaDescription,
      url: `${BASE_URL}/services/${slug}`,
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: page.metaTitle,
      description: page.metaDescription,
    },
  }
}

function renderHeading(text: string) {
  const parts = text.split(/\*(.+?)\*/g)
  return parts.map((part, i) =>
    i % 2 === 1 ? (
      <em key={i} style={{ color: GOLD_LIGHT, fontStyle: 'normal' }}>{part}</em>
    ) : (
      <Fragment key={i}>{part}</Fragment>
    )
  )
}

function renderBody(text: string) {
  const parts = text.split(/\*\*(.+?)\*\*/g)
  return parts.map((part, i) =>
    i % 2 === 1 ? <strong key={i}>{part}</strong> : <Fragment key={i}>{part}</Fragment>
  )
}

function serviceEducationUrl(serviceLabel: string) {
  const params = new URLSearchParams({
    utm_source: 'google_business_profile',
    utm_medium: 'service_page',
    utm_campaign: 'latimore_services',
    source: 'GBP_SERVICE_PAGE',
    service: serviceLabel,
  })
  return `/education/checkup?${params.toString()}`
}

function CtaButtons({ centered = false, large = false, label, serviceLabel }: { centered?: boolean; large?: boolean; label: string; serviceLabel: string }) {
  const paddingClass = large ? 'px-8 py-3' : 'px-4 py-2'
  const textClass = large ? 'text-base' : 'text-sm'

  return (
    <div className={`flex flex-wrap gap-4 ${centered ? 'justify-center' : ''}`}>
      <Link
        href={serviceEducationUrl(serviceLabel)}
        className={`rounded-md font-bold no-underline transition-all hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#C9A24D] focus-visible:ring-offset-[#0E1A2B] bg-[#C9A24D] text-[#0E1A2B] ${paddingClass} ${textClass}`}
      >
        {label}
      </Link>
      <a
        href={`tel:+1${BRAND.phoneRaw}`}
        className={`rounded-md font-bold no-underline transition-all hover:bg-[#C9A24D]/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#C9A24D] focus-visible:ring-offset-[#0E1A2B] bg-transparent text-white border-2 border-[#C9A24D] ${paddingClass} ${textClass}`}
      >
        Call {BRAND.phone}
      </a>
    </div>
  )
}

export default async function ServiceDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const rawPage = getServicePage(slug)
  if (!rawPage) notFound()
  const page = hardenServicePage(rawPage)

  return (
    <>
      <SiteHeader currentPath="/services" navLinks={DEFAULT_NAV_LINKS} />
      <main className="font-sans">
        <section className="text-center text-white py-16" style={{ background: `linear-gradient(135deg, ${NAVY} 0%, #1a2942 100%)` }}>
          <div className="max-w-3xl mx-auto px-5">
            <p className="text-sm font-semibold tracking-widest uppercase mb-4" style={{ color: GOLD_LIGHT }}>
              Service {page.serviceNumber} · {page.serviceLabel}
            </p>
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-5 leading-tight">
              {page.heroPrefix}<br /><span style={{ color: GOLD_LIGHT }}>{page.heroEm}</span>
            </h1>
            <p className="text-white/85 text-lg leading-relaxed mb-8">{page.heroTagline}</p>
            <CtaButtons centered large label={page.heroCtaLabel} serviceLabel={page.serviceLabel} />
          </div>
        </section>

        <section className="py-16 bg-gray-100">
          <div className="max-w-6xl mx-auto px-5">
            <div className="grid md:grid-cols-2 gap-12">
              <div>
                <p className="text-sm font-semibold tracking-widest uppercase mb-3" style={{ color: '#9C7B2E' }}>{page.problemLabel}</p>
                <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-5 leading-tight">{renderHeading(page.problemHeading)}</h2>
                {page.problemParagraphs.map((paragraph, i) => (
                  <p key={i} className="text-gray-700 leading-relaxed mb-4">{renderBody(paragraph)}</p>
                ))}
                <blockquote className="border-l-4 pl-4 italic text-gray-600 my-6" style={{ borderColor: GOLD }}>{page.pullQuote}</blockquote>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {page.stats.map((stat) => (
                  <div key={stat.label} className="bg-white rounded-xl shadow-md border border-black/5 p-6">
                    <div className="font-extrabold text-3xl mb-2" style={{ color: GOLD }}>{stat.value}</div>
                    <div className="font-semibold text-gray-900 mb-1">{stat.label}</div>
                    <div className="text-sm text-gray-600 leading-relaxed">{stat.desc}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="py-16" style={{ background: NAVY }}>
          <div className="max-w-6xl mx-auto px-5">
            <div className="text-center mb-10">
              <p className="text-sm font-semibold tracking-widest uppercase mb-3" style={{ color: GOLD_LIGHT }}>{page.benefitsLabel}</p>
              <h2 className="text-3xl md:text-4xl font-bold text-white leading-tight">{renderHeading(page.benefitsHeading)}</h2>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {page.benefits.map((benefit) => (
                <article key={benefit.title} className="rounded-xl p-6 border border-white/10 hover:border-[#C9A24D]/50 transition-all" style={{ background: 'rgba(255,255,255,0.05)' }}>
                  <div className="text-2xl mb-4" aria-hidden="true">{benefit.icon}</div>
                  <h3 className="text-white font-semibold text-lg mb-2">{benefit.title}</h3>
                  <p className="text-white/65 text-sm leading-relaxed">{benefit.desc}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {page.steps && page.steps.length > 0 && (
          <section className="py-16 bg-gray-100">
            <div className="max-w-6xl mx-auto px-5">
              <div className="text-center mb-10">
                <p className="text-sm font-semibold tracking-widest uppercase mb-3" style={{ color: '#9C7B2E' }}>{page.stepsLabel}</p>
                <h2 className="text-3xl md:text-4xl font-bold text-gray-900 leading-tight">{renderHeading(page.stepsHeading ?? '')}</h2>
              </div>
              <div className="grid sm:grid-cols-3 gap-6">
                {page.steps.map((step) => (
                  <div key={step.num} className="bg-white rounded-xl shadow-md border border-black/5 p-6 text-center">
                    <div className="font-extrabold text-2xl mb-3" style={{ color: GOLD }}>{step.num}</div>
                    <h3 className="font-semibold text-gray-900 text-lg mb-2">{step.title}</h3>
                    <p className="text-sm text-gray-600 leading-relaxed">{step.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        <section className="py-16" style={{ background: NAVY }}>
          <div className="max-w-3xl mx-auto px-5">
            <div className="text-center mb-10">
              <p className="text-sm font-semibold tracking-widest uppercase mb-3" style={{ color: GOLD_LIGHT }}>{page.faqLabel}</p>
              <h2 className="text-3xl md:text-4xl font-bold text-white leading-tight">{renderHeading(page.faqHeading)}</h2>
            </div>
            {page.faqs.length > 0 && (
              <div className="space-y-4 mb-10">
                {page.faqs.map((faq) => (
                  <div key={faq.q} className="rounded-xl p-6 border border-white/10" style={{ background: 'rgba(255,255,255,0.05)' }}>
                    <h3 className="text-white font-semibold mb-2">{faq.q}</h3>
                    <p className="text-white/65 text-sm leading-relaxed">{faq.a}</p>
                  </div>
                ))}
              </div>
            )}
            <div className="flex flex-wrap gap-2 justify-center">
              {page.keywordTags.map((tag) => (
                <span key={tag} className="text-xs rounded-full px-3 py-1 border border-white/15 text-white/60">{tag}</span>
              ))}
            </div>
          </div>
        </section>

        <section className="py-16 text-center text-white" style={{ background: `linear-gradient(135deg, ${CRIMSON} 0%, #5a1a25 100%)` }}>
          <div className="max-w-2xl mx-auto px-5">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 leading-tight">{page.ctaHeading}</h2>
            <p className="text-white/85 text-lg mb-8 leading-relaxed">{page.ctaSubtext}</p>
            <CtaButtons centered large label={page.heroCtaLabel} serviceLabel={page.serviceLabel} />
          </div>
        </section>

        <section className="bg-[#060D1B] border-t border-white/5 py-8 px-5">
          <div className="max-w-4xl mx-auto">
            <p className="text-xs text-white/45 leading-relaxed text-center">
              <strong className="text-white/60 font-semibold">Important:</strong>{' '}
              Insurance-product guarantees are subject to contract terms and the claims-paying ability of the issuing insurer. Indexed products do not directly invest in a market index. Caps, participation rates, spreads, policy or contract charges, withdrawals, loans, surrender schedules, and optional rider costs can affect results. Tax treatment depends on applicable law and individual circumstances; policy loans and withdrawals reduce available cash value and death benefit and may create tax consequences. FAFSA and estate-planning rules can change. Latimore Life &amp; Legacy LLC provides insurance education and licensed insurance services, not legal, tax, securities, or investment advice. Consult qualified legal, tax, plan-administration, or other professionals when those issues apply.
            </p>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  )
}