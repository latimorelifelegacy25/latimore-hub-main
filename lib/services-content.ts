/**
 * Content for the dedicated, SEO-optimized service landing pages at
 * /services/[slug]. These pages exist primarily to give Google Business
 * Profile listings (and other local-SEO links) a specific landing page per
 * product/service instead of routing everyone to the general /services page.
 *
 * Heading strings support a simple `*emphasis*` marker (rendered as <em> in
 * gold). Body paragraphs support `**strong**` (rendered as <strong>).
 */

export interface ServiceStat {
  value: string
  label: string
  desc: string
}

export interface ServiceBenefit {
  icon: string
  title: string
  desc: string
}

export interface ServiceStep {
  num: string
  title: string
  desc: string
}

export interface ServiceFaq {
  q: string
  a: string
}

export interface ServicePageContent {
  slug: string
  serviceNumber: string
  serviceLabel: string
  metaTitle: string
  metaDescription: string
  keywords: string[]

  heroPrefix: string
  heroEm: string
  heroTagline: string
  heroCtaLabel: string

  problemLabel: string
  problemHeading: string
  problemParagraphs: string[]
  pullQuote: string
  stats: ServiceStat[]

  benefitsLabel: string
  benefitsHeading: string
  benefits: ServiceBenefit[]

  stepsLabel?: string
  stepsHeading?: string
  steps?: ServiceStep[]

  faqLabel: string
  faqHeading: string
  faqs: ServiceFaq[]
  keywordTags: string[]

  ctaHeading: string
  ctaSubtext: string
}

export const SERVICE_PAGES: ServicePageContent[] = [
  {
    slug: 'life-insurance',
    serviceNumber: '01',
    serviceLabel: 'Life Insurance',
    metaTitle: 'Term & Permanent Life Insurance with Living Benefits | Latimore Life & Legacy LLC — Pottsville, PA',
    metaDescription:
      'Affordable term and permanent life insurance for Pennsylvania families. Living benefits included. Serving Schuylkill, Luzerne & Northumberland Counties. Free consultation.',
    keywords: [
      'term life insurance Pennsylvania',
      'permanent life insurance Pottsville',
      'life insurance Schuylkill County',
      'living benefits insurance PA',
      'affordable life insurance near me',
    ],
    heroPrefix: 'Term & Permanent',
    heroEm: 'Life Insurance',
    heroTagline: "Protection That Works While You're Living — Not Just When You're Gone",
    heroCtaLabel: 'Get My Free Life Insurance Review',
    problemLabel: 'The Problem',
    problemHeading: 'Most Families Are *One Event Away* From Financial Crisis',
    problemParagraphs: [
      "Your income is your family's most valuable asset. If something happened to you tomorrow, how long could your household stay financially stable? For most families in Central Pennsylvania, the honest answer is: not long.",
      'Whether you need affordable term coverage to protect your mortgage and income, or permanent life insurance that builds tax-advantaged cash value, Latimore Life & Legacy LLC helps you find the right solution — from top-rated carriers including North American, Foresters, Mutual of Omaha, and Transamerica.',
      "We specialize in policies with **Living Benefits** — meaning if you're diagnosed with a critical, chronic, or terminal illness, you may be able to access your death benefit early. Over 76% of Americans experience one of these events. Your policy should be ready for it.",
    ],
    pullQuote:
      '"The best time to protect your family was yesterday. The second best time is today." — Jackson M. Latimore Sr.',
    stats: [
      { value: '76%', label: 'Americans Face Critical Illness', desc: 'Over 76% of Americans experience a critical, chronic, or terminal illness in their lifetime.' },
      { value: '$0', label: 'Cost for Your Free Review', desc: 'No obligation. No pressure. Just clarity on what your family needs and what it costs.' },
      { value: '5+', label: 'Top-Rated Carrier Partners', desc: 'North American, Foresters, Mutual of Omaha, Transamerica, and more — we find the best fit for you.' },
      { value: '3', label: 'Counties Served', desc: 'Schuylkill, Luzerne, and Northumberland Counties — plus virtual consultations statewide.' },
    ],
    benefitsLabel: 'Why It Matters',
    benefitsHeading: 'Two Types of Coverage. *One Right Answer* for Your Family.',
    benefits: [
      { icon: '⏱️', title: 'Term Life Insurance', desc: 'Maximum coverage at the lowest cost. Ideal for income replacement, mortgage protection, and young families. Coverage periods from 10–30 years. Fast approval — some carriers offer no medical exam options.' },
      { icon: '♾️', title: 'Permanent Life Insurance', desc: 'Lifelong protection with guaranteed premiums and cash value growth. Whole life and IUL options available. Build tax-advantaged savings you can access during your lifetime.' },
      { icon: '💚', title: 'Living Benefits Riders', desc: "Access your death benefit early if diagnosed with a qualifying critical, chronic, or terminal illness. Protect your family's finances during the hardest moments — not just after." },
      { icon: '🏠', title: 'Mortgage Protection', desc: "Ensure your family can stay in the home you've worked so hard to build. Term life structured to match your mortgage balance and payoff timeline." },
      { icon: '💰', title: 'Tax-Free Death Benefit', desc: 'Life insurance proceeds pass to your beneficiaries 100% income-tax-free. No probate. No delays. Your family gets the money when they need it most.' },
      { icon: '🔄', title: 'Convertibility Options', desc: 'Many term policies can be converted to permanent coverage without a new medical exam — giving you flexibility as your needs change over time.' },
    ],
    stepsLabel: 'How It Works',
    stepsHeading: 'Your Free Review — *3 Simple Steps*',
    steps: [
      { num: '01', title: 'Book Your Review', desc: 'Schedule a free 30-minute call with Jackson Latimore Sr. — no paperwork, no pressure.' },
      { num: '02', title: 'We Analyze Your Needs', desc: "We use the DIME method to calculate your family's true coverage need and compare options across carriers." },
      { num: '03', title: 'You Choose Your Plan', desc: 'We present your best options clearly. You decide. No obligation. Application takes minutes.' },
    ],
    faqLabel: 'Common Questions',
    faqHeading: 'Life Insurance *FAQs*',
    faqs: [
      { q: 'Do I need a medical exam?', a: 'Many of our carriers offer simplified-issue and no-exam options. Depending on your age and coverage amount, you may qualify for same-day approval.' },
      { q: 'How much life insurance do I need?', a: "We use the DIME method: Debt + Income × 10 + Mortgage + Education. In your free review, we'll calculate your exact number together." },
      { q: 'What are Living Benefits?', a: "Living Benefits allow you to access a portion of your death benefit while still alive if you're diagnosed with a qualifying critical, chronic, or terminal illness. Not all policies include them — we make sure yours does." },
    ],
    keywordTags: ['term life insurance Pennsylvania', 'permanent life insurance Pottsville', 'living benefits insurance PA', 'life insurance Schuylkill County', 'affordable life insurance near me'],
    ctaHeading: 'Your Family Deserves a Plan',
    ctaSubtext: 'Free 30-Minute Life Insurance Review · No Obligation · No Pressure',
  },

  {
    slug: 'mortgage-protection',
    serviceNumber: '02',
    serviceLabel: 'Mortgage Protection',
    metaTitle: 'Mortgage Protection Insurance | Latimore Life & Legacy LLC — Pottsville, PA',
    metaDescription:
      'Protect your home and family with mortgage protection insurance in Pennsylvania. Serving Schuylkill, Luzerne & Northumberland Counties. Free review with Jackson Latimore Sr.',
    keywords: [
      'mortgage protection insurance Pennsylvania',
      'mortgage life insurance Pottsville',
      'home protection life insurance PA',
      'mortgage protection Schuylkill County',
      'life insurance for mortgage PA',
    ],
    heroPrefix: 'Mortgage',
    heroEm: 'Protection Insurance',
    heroTagline: 'Keep Your Family in the Home You Built — No Matter What Happens',
    heroCtaLabel: 'Protect My Home — Free Review',
    problemLabel: 'The Problem',
    problemHeading: '76% of Schuylkill County *Homeowners* Have No Mortgage Protection',
    problemParagraphs: [
      "Your home is your family's most important asset. But most homeowners in Central Pennsylvania have no plan for what happens to their mortgage if they pass away, become seriously ill, or are unable to work.",
      "Mortgage Protection Insurance ensures your family can stay in the home you've worked so hard to build — without the burden of mortgage payments during the worst possible time. It's not just life insurance. It's a promise to your family that their home is safe.",
      'With 76.1% homeownership in Schuylkill County — one of the highest rates in Pennsylvania — mortgage protection is one of the most critical and underserved needs in our community.',
    ],
    pullQuote:
      '"Your mortgage doesn\'t stop when your income does. Your protection plan should be ready before that day comes."',
    stats: [
      { value: '76.1%', label: 'Homeownership Rate', desc: 'Schuylkill County has one of the highest homeownership rates in Pennsylvania — and most homes are unprotected.' },
      { value: '$0', label: 'Cost for Your Free Review', desc: 'No obligation. We analyze your mortgage balance and recommend the right coverage amount.' },
      { value: '30', label: 'Days to Coverage', desc: 'Many mortgage protection policies can be approved and in force within 30 days of application.' },
      { value: '3', label: 'Counties Served', desc: 'Schuylkill, Luzerne, and Northumberland Counties — plus virtual consultations statewide.' },
    ],
    benefitsLabel: "What's Covered",
    benefitsHeading: 'More Than a Death Benefit — *Complete Home Protection*',
    benefits: [
      { icon: '💀', title: 'Death Benefit', desc: 'If you pass away, the policy pays off your mortgage balance — your family keeps the home, free and clear.' },
      { icon: '🏥', title: 'Critical Illness Protection', desc: 'Living Benefits allow you to access your benefit early if diagnosed with a qualifying critical illness — keeping mortgage payments covered during recovery.' },
      { icon: '📉', title: 'Decreasing Term Options', desc: 'Coverage that decreases alongside your mortgage balance — keeping premiums affordable while maintaining full protection.' },
      { icon: '🔒', title: 'Level Term Options', desc: 'Fixed coverage amount for the full term — ideal if you want flexibility beyond just the mortgage payoff.' },
      { icon: '👨‍👩‍👧', title: 'Family Income Replacement', desc: "Combine mortgage protection with income replacement coverage to ensure your family's full financial stability." },
      { icon: '⚡', title: 'Fast Approval', desc: 'Many carriers offer simplified underwriting with no medical exam required — coverage decisions in days, not weeks.' },
    ],
    stepsLabel: 'How It Works',
    stepsHeading: 'Protect Your Home in *3 Steps*',
    steps: [
      { num: '01', title: 'Free Mortgage Review', desc: 'We review your current mortgage balance, remaining term, and monthly payment to determine the right coverage amount.' },
      { num: '02', title: 'Compare Carrier Options', desc: 'As an independent broker, we shop multiple carriers to find the best rate and coverage for your specific situation.' },
      { num: '03', title: 'Apply & Get Covered', desc: 'Application takes minutes. Many policies are approved same-day or within a few business days.' },
    ],
    faqLabel: 'How It Works',
    faqHeading: 'Mortgage Protection *FAQs*',
    faqs: [
      { q: 'Is mortgage protection the same as PMI?', a: 'No. PMI (Private Mortgage Insurance) protects the lender. Mortgage Protection Insurance protects your family — it pays off your mortgage so your family keeps the home.' },
      { q: 'Do I need a medical exam?', a: "Many mortgage protection policies offer simplified underwriting with no medical exam. We'll find the best option for your health profile and budget." },
      { q: 'What if I already have life insurance through work?', a: 'Employer-provided life insurance typically ends when you leave your job. A dedicated mortgage protection policy stays with you regardless of employment status.' },
    ],
    keywordTags: ['mortgage protection insurance Pennsylvania', 'mortgage life insurance Pottsville', 'home protection life insurance PA', 'mortgage protection Schuylkill County'],
    ctaHeading: "Don't Leave Your Home Unprotected",
    ctaSubtext: 'Free 30-Minute Mortgage Protection Review · No Obligation',
  },

  {
    slug: 'retirement-income',
    serviceNumber: '03',
    serviceLabel: 'Retirement Income',
    metaTitle: 'Retirement Income Planning | Latimore Life & Legacy LLC — Pottsville, PA',
    metaDescription:
      'Build guaranteed retirement income you cannot outlive. Serving Schuylkill, Luzerne & Northumberland Counties, PA. Free retirement income review with Jackson Latimore Sr.',
    keywords: [
      'retirement income planning Pennsylvania',
      'retirement planning Pottsville PA',
      'retirement income advisor Schuylkill County',
      'guaranteed retirement income PA',
      'annuity income Pennsylvania',
    ],
    heroPrefix: 'Retirement',
    heroEm: 'Income Planning',
    heroTagline: 'Replace Your Paycheck With Income You Cannot Outlive',
    heroCtaLabel: 'Start My Retirement Review',
    problemLabel: 'The Problem',
    problemHeading: 'A Retirement Account Is Not a *Retirement Income Plan*',
    problemParagraphs: [
      'Most people spend decades saving for retirement — but very few have a plan for how to turn those savings into reliable, tax-efficient income that lasts as long as they do. Accumulation is one phase. Distribution is another. And the rules are completely different.',
      "The #1 fear of retirees is running out of money. With 20%+ of Schuylkill County's population over age 65 — and that number growing — guaranteed income planning has never been more critical for Central Pennsylvania families.",
      'We help pre-retirees and retirees build a guaranteed income floor using Fixed Indexed Annuities, IUL distributions, and Social Security optimization — so you never have to worry about outliving your money.',
    ],
    pullQuote:
      '"The sequence of returns matters more than the average return. One bad year at the wrong time can permanently reduce your retirement income."',
    stats: [
      { value: '20%+', label: 'Population 65+ in Service Area', desc: "Schuylkill County's senior population is growing rapidly — all needing guaranteed income strategies." },
      { value: '$0', label: 'Market Loss Guarantee', desc: 'Fixed Indexed Annuities contractually guarantee your principal — you never lose to market downturns.' },
      { value: 'Life', label: 'Guaranteed Income Duration', desc: 'A properly structured annuity pays guaranteed income for as long as you live — you cannot outlive it.' },
      { value: '10%+', label: 'Annual Income Potential', desc: 'Some clients generate 10%+ annually in guaranteed lifetime income vs. the traditional 4% rule.' },
    ],
    benefitsLabel: 'Our Approach',
    benefitsHeading: 'The Three Pillars of *Retirement Income*',
    benefits: [
      { icon: '🔒', title: 'Principal Protection', desc: 'Fixed Indexed Annuities guarantee your principal is never reduced by market downturns. Your savings floor is contractually protected.' },
      { icon: '📈', title: 'Market-Linked Growth', desc: 'Earn interest linked to a market index — capturing upside growth without direct market exposure. Gains are locked in annually.' },
      { icon: '💵', title: 'Guaranteed Lifetime Income', desc: 'Income riders provide a guaranteed withdrawal benefit you cannot outlive — regardless of account value or market performance.' },
      { icon: '🏛️', title: 'Social Security Optimization', desc: 'We help you determine the optimal Social Security claiming strategy to maximize your lifetime benefit.' },
      { icon: '🎉', title: 'Tax-Free Income Streams', desc: 'IUL distributions and Roth-alternative strategies create tax-free income in retirement — keeping you in the lowest possible tax bracket.' },
      { icon: '👨‍👩‍👧', title: 'Legacy & Death Benefit', desc: 'Many annuities include a death benefit that passes remaining account value to your beneficiaries — tax-efficiently.' },
    ],
    faqLabel: 'Common Questions',
    faqHeading: 'Retirement Income *FAQs*',
    faqs: [
      { q: 'What is a Fixed Indexed Annuity (FIA)?', a: "An FIA is a contract with an insurance company that guarantees your principal while crediting interest based on a market index. When the index goes up, you earn. When it goes down, you don't lose. It's the foundation of our retirement income strategy." },
      { q: 'Can I roll over my 401(k) or IRA into an annuity?', a: 'Yes. We help clients roll over old 401(k)s and IRAs into Fixed Indexed Annuities with no taxes, no penalties, and no fees on the transfer. Your money keeps working — with better protection.' },
      { q: 'When should I start retirement income planning?', a: "The earlier the better — but it's never too late. Whether you're 10 years from retirement or already retired, we can build a strategy that fits your current situation and goals." },
      { q: "What's the difference between accumulation and distribution?", a: 'Accumulation is the saving phase — growing your nest egg. Distribution is the spending phase — turning savings into income. Most financial products are designed for accumulation. We specialize in distribution strategies that make your money last.' },
    ],
    keywordTags: ['retirement income planning Pennsylvania', 'retirement planning Pottsville PA', 'guaranteed retirement income PA', 'annuity income Schuylkill County'],
    ctaHeading: 'Build Income You Cannot Outlive',
    ctaSubtext: 'Free 30-Minute Retirement Income Review · No Obligation',
  },

  {
    slug: '401k-rollover',
    serviceNumber: '04',
    serviceLabel: '401(k) Rollover',
    metaTitle: '401(k) Rollover Consultation | Latimore Life & Legacy LLC — Pottsville, PA',
    metaDescription:
      'Roll over your old 401(k) or IRA with no taxes, no penalties, and no fees. Serving Central Pennsylvania. Free rollover consultation with Jackson Latimore Sr.',
    keywords: [
      '401k rollover Pennsylvania',
      'IRA rollover Pottsville PA',
      '401k rollover annuity PA',
      'guaranteed retirement income Pennsylvania',
      'old 401k rollover Schuylkill County',
    ],
    heroPrefix: '401(k) & IRA',
    heroEm: 'Rollover Consultation',
    heroTagline: 'No Taxes. No Penalties. No Fees. More Control Over Your Retirement.',
    heroCtaLabel: 'Review My Rollover Options',
    problemLabel: 'The Problem',
    problemHeading: 'Your Old 401(k) Is *Working Against You*',
    problemParagraphs: [
      "When you change jobs or retire, your old 401(k) doesn't have to stay where it is — collecting hidden fees, exposed to market volatility, and tied to a company you no longer work for. Most people leave old retirement accounts behind simply because they don't know their options.",
      "The most common advice is to roll it into a new 401(k) or IRA. But the issue is there's still no guarantee. You still don't have full access to it, and if that company goes bankrupt, your money could go with it.",
      'We help clients move old retirement accounts into Fixed Indexed Annuities — with no taxes, no penalties, and no fees on the transfer — giving you principal protection, market-linked growth, and guaranteed lifetime income.',
    ],
    pullQuote:
      '"I had a client who had over $100K in his old 401(k). He got laid off. Two months later, the company went bankrupt. He lost all but $12 of his retirement. That is not a good place to be." — Jackson M. Latimore Sr.',
    stats: [
      { value: '$0', label: 'Taxes on a Proper Rollover', desc: 'A direct rollover from a 401(k) or IRA to an annuity triggers no taxes and no penalties when done correctly.' },
      { value: '$0', label: 'Maximum Market Loss', desc: 'Fixed Indexed Annuities contractually guarantee your principal — you never lose to market downturns.' },
      { value: '10%', label: 'Average Annual Growth Potential', desc: 'Some FIA strategies have averaged 9–10% annually over 30 years — vs. 5–7% for most 401(k) accounts.' },
      { value: 'Life', label: 'Guaranteed Income Duration', desc: 'Income riders provide guaranteed withdrawals for as long as you live — you cannot outlive your income.' },
    ],
    benefitsLabel: 'The GRIPP Advantage',
    benefitsHeading: 'Get a *GRIPP* on Your Retirement Money',
    benefits: [
      { icon: '🛡️', title: 'G — Guarantees', desc: 'Your principal is contractually guaranteed. You will never lose another dollar to market downturns — ever.' },
      { icon: '📈', title: 'R — Rate of Return', desc: 'A guaranteed minimum rate of return ensures your money grows — even in flat or down markets.' },
      { icon: '🔒', title: 'I — Indexing Strategy', desc: 'Your account is credited based on market index performance — capturing upside while locking in gains annually.' },
      { icon: '💵', title: 'P — Pension-Like Income', desc: 'Take income for as long as you live — a personal pension that replaces your paycheck in retirement.' },
      { icon: '🎁', title: 'P — Potential Bonuses', desc: "Some carriers offer premium bonuses on rollover amounts — potentially boosting your account value on day one." },
      { icon: '🔄', title: 'No Taxes or Penalties', desc: 'A properly executed direct rollover triggers no taxes, no penalties, and no fees — your full balance transfers.' },
    ],
    faqLabel: 'Common Questions',
    faqHeading: 'Rollover *FAQs*',
    faqs: [
      { q: 'Can I roll over my 401(k) without paying taxes?', a: 'Yes — with a direct rollover. The money moves directly from your old plan to the new account without passing through your hands, so no taxes or penalties are triggered.' },
      { q: "What's the difference between a rollover and a transfer?", a: 'A direct rollover moves funds directly between institutions — no tax withholding. An indirect rollover sends you a check, and you have 60 days to deposit it. We always recommend direct rollovers to avoid complications.' },
      { q: 'Can I roll over a 403(b), 457, or TSP?', a: "Yes. We work with 401(k), 403(b), 457, TSP, IRA, and Roth IRA accounts. Each has specific rules — we'll walk you through the right process for your account type." },
    ],
    keywordTags: ['401k rollover Pennsylvania', 'IRA rollover Pottsville PA', '401k rollover annuity PA', 'guaranteed retirement income Pennsylvania'],
    ctaHeading: 'Take Control of Your Retirement',
    ctaSubtext: 'Free 30-Minute Rollover Consultation · No Taxes · No Penalties · No Fees',
  },

  {
    slug: 'final-expense',
    serviceNumber: '05',
    serviceLabel: 'Final Expense',
    metaTitle: 'Final Expense Life Insurance | Latimore Life & Legacy LLC — Pottsville, PA',
    metaDescription:
      'Affordable final expense and burial insurance for Pennsylvania seniors. No medical exam required. Serving Schuylkill, Luzerne & Northumberland Counties. Free quote.',
    keywords: [
      'final expense insurance Pennsylvania',
      'burial insurance Pottsville PA',
      'final expense insurance Schuylkill County',
      'no exam life insurance seniors PA',
      'affordable burial insurance near me',
    ],
    heroPrefix: 'Final Expense',
    heroEm: 'Life Insurance',
    heroTagline: 'Give Your Family the Gift of Peace — Not a Financial Burden',
    heroCtaLabel: 'Get My Free Final Expense Quote',
    problemLabel: 'The Problem',
    problemHeading: 'The Average Funeral Costs *$9,000–$12,000* — Most Families Aren\'t Ready',
    problemParagraphs: [
      "When a loved one passes away, the last thing a grieving family should face is a financial crisis. But without a final expense plan, that's exactly what happens. Funeral costs, medical bills, and outstanding debts can quickly overwhelm a family that's already dealing with loss.",
      "Final Expense Insurance provides a tax-free benefit that gives your family the time and resources to grieve — without financial stress. With 20%+ of Schuylkill County's population over age 65, this is one of the most urgent and underserved needs in our community.",
      'We offer simplified-issue final expense coverage for Pennsylvania seniors ages 50–85. No medical exam required. Affordable monthly premiums. Guaranteed acceptance options available.',
    ],
    pullQuote:
      '"The greatest gift you can give your family is a plan. Final expense insurance is one of the simplest, most affordable ways to do that."',
    stats: [
      { value: '$9K+', label: 'Average Funeral Cost', desc: 'The average funeral in Pennsylvania costs $9,000–$12,000 — most families have no plan to cover it.' },
      { value: '20%+', label: 'Population 65+ in Service Area', desc: "Schuylkill County's senior population is growing — and most have no final expense coverage in place." },
      { value: 'No', label: 'Medical Exam Required', desc: 'Simplified-issue and guaranteed acceptance options available — no doctor, no blood test, no waiting.' },
      { value: '50–85', label: 'Eligible Age Range', desc: 'Final expense coverage available for Pennsylvania residents ages 50–85 — regardless of health history.' },
    ],
    benefitsLabel: "What's Covered",
    benefitsHeading: 'Everything Your Family *Needs to Move Forward*',
    benefits: [
      { icon: '⚰️', title: 'Funeral & Burial Costs', desc: "Cover funeral home fees, burial or cremation costs, casket, flowers, and service expenses — so your family isn't left with the bill." },
      { icon: '🏥', title: 'Medical Bills', desc: 'End-of-life medical expenses can be significant. Final expense coverage helps your family settle outstanding medical debt.' },
      { icon: '💳', title: 'Outstanding Debts', desc: "Credit cards, personal loans, and other debts don't disappear when you do. Final expense coverage helps your family close these accounts." },
      { icon: '✅', title: 'No Medical Exam', desc: 'Simplified-issue underwriting means most applicants are approved based on a few health questions — no doctor visit required.' },
      { icon: '💰', title: 'Affordable Premiums', desc: 'Final expense policies are designed to be affordable on a fixed income. Coverage amounts from $5,000–$25,000 with premiums starting under $30/month.' },
      { icon: '🔒', title: 'Guaranteed Acceptance', desc: "For those who don't qualify for simplified-issue, guaranteed acceptance options are available — no health questions asked." },
    ],
    faqLabel: 'Common Questions',
    faqHeading: 'Final Expense *FAQs*',
    faqs: [
      { q: 'How much final expense coverage do I need?', a: "Most families choose between $10,000–$25,000 in coverage. We'll help you calculate the right amount based on your funeral preferences, outstanding debts, and budget." },
      { q: 'Can I get coverage if I have health issues?', a: 'Yes. We offer simplified-issue policies that require only a few health questions, and guaranteed acceptance policies with no health questions at all. Most applicants qualify for some level of coverage.' },
      { q: 'How quickly does the benefit pay out?', a: 'Most final expense policies pay the death benefit within 24–48 hours of a valid claim — giving your family immediate access to funds when they need them most.' },
    ],
    keywordTags: ['final expense insurance Pennsylvania', 'burial insurance Pottsville PA', 'no exam life insurance seniors PA', 'affordable burial insurance near me'],
    ctaHeading: 'Give Your Family Peace of Mind',
    ctaSubtext: 'Free Final Expense Quote · No Medical Exam · No Obligation',
  },

  {
    slug: 'college-funding',
    serviceNumber: '06',
    serviceLabel: 'College Funding',
    metaTitle: 'College Funding Protection Plan | Latimore Life & Legacy LLC — Pottsville, PA',
    metaDescription:
      "Tax-advantaged college funding strategies for Pennsylvania families. Doesn't count against financial aid. Free consultation with Jackson Latimore Sr.",
    keywords: [
      'college funding Pennsylvania',
      'education savings plan Pottsville PA',
      'college funding life insurance PA',
      '529 alternative Pennsylvania',
      'college savings Schuylkill County',
    ],
    heroPrefix: 'College Funding',
    heroEm: 'Protection Plan',
    heroTagline: "Protect Your Child's Future — Tax-Advantaged, Flexible, and Financial-Aid Friendly",
    heroCtaLabel: "Plan for My Child's Future",
    problemLabel: 'The Problem',
    problemHeading: '31 School Districts. *Thousands of Families* With No College Plan.',
    problemParagraphs: [
      "Across Schuylkill, Luzerne, and Northumberland Counties, there are 31 school districts — and thousands of families who want to give their children a head start but don't know where to begin. Traditional college savings plans like 529s have limitations: they count against financial aid, can only be used for education, and offer no protection if something happens to the parent.",
      "Our College Funding Protection Plan uses life insurance-based savings vehicles that grow tax-advantaged, don't count against financial aid, and can be used for anything — not just tuition. And if something happens to you, your child's future is still protected.",
    ],
    pullQuote:
      '"The best college savings plan is one that protects your child\'s future even if you\'re not here to fund it."',
    stats: [
      { value: '31', label: 'School Districts in Service Area', desc: 'Schuylkill (14), Luzerne (11), and Northumberland (6) Counties — thousands of families planning for college.' },
      { value: '$0', label: 'Impact on Financial Aid', desc: "Life insurance-based savings vehicles don't count against FAFSA financial aid calculations — unlike 529 plans." },
      { value: 'Any', label: 'Use for Any Purpose', desc: 'Unlike 529 plans, funds can be used for anything — college, trade school, starting a business, or a down payment.' },
      { value: 'Tax-Free', label: 'Growth & Withdrawals', desc: 'Cash value grows tax-deferred and can be accessed tax-free — maximizing every dollar saved.' },
    ],
    benefitsLabel: 'Why It Works',
    benefitsHeading: 'Better Than a 529 — *Here\'s Why*',
    benefits: [
      { icon: '🎓', title: 'Financial Aid Friendly', desc: "Life insurance cash value is not counted as an asset on the FAFSA — preserving your child's eligibility for grants and scholarships." },
      { icon: '🔓', title: 'No Restrictions on Use', desc: 'Funds can be used for college, trade school, starting a business, buying a car, or anything else — no penalties for non-education use.' },
      { icon: '🛡️', title: 'Built-In Protection', desc: "If something happens to you, the life insurance component ensures your child's future is still funded — even if you're not here to contribute." },
      { icon: '📈', title: 'Tax-Advantaged Growth', desc: 'Cash value grows tax-deferred inside the policy and can be accessed tax-free — maximizing the value of every dollar you save.' },
      { icon: '⏰', title: 'Start Early, Win Big', desc: 'The earlier you start, the more time compound growth works in your favor. A policy started at birth can accumulate significant value by college age.' },
      { icon: '💚', title: 'Living Benefits Included', desc: "Many policies include living benefits — if you're diagnosed with a qualifying illness, you can access funds to keep the family financially stable." },
    ],
    faqLabel: 'Common Questions',
    faqHeading: 'College Funding *FAQs*',
    faqs: [
      { q: 'How is this different from a 529 plan?', a: "A 529 plan is limited to education expenses and counts against financial aid. Our life insurance-based strategy has no use restrictions, doesn't affect financial aid, includes life insurance protection, and offers tax-free access to funds." },
      { q: 'When should I start saving for college?', a: 'The earlier the better. A policy started when your child is young has more time to accumulate cash value. But it\'s never too late — even starting in middle school can make a meaningful difference.' },
      { q: "What if my child doesn't go to college?", a: "No problem. Unlike a 529, the funds can be used for anything — trade school, starting a business, a down payment on a home, or simply kept as a financial foundation for your child's future." },
    ],
    keywordTags: ['college funding Pennsylvania', 'education savings plan Pottsville PA', 'college funding life insurance PA', '529 alternative Pennsylvania'],
    ctaHeading: "Invest in Your Child's Future Today",
    ctaSubtext: 'Free 30-Minute College Funding Review · No Obligation',
  },

  {
    slug: 'business-protection',
    serviceNumber: '07',
    serviceLabel: 'Business Protection',
    metaTitle: 'Business Protection & Continuity Planning | Latimore Life & Legacy LLC — Pottsville, PA',
    metaDescription:
      'Key person insurance, business continuity planning, and executive benefit strategies for Pennsylvania business owners. Free consultation with Jackson Latimore Sr.',
    keywords: [
      'business continuity planning Pennsylvania',
      'key person insurance Pennsylvania',
      'business owner insurance Pottsville PA',
      'executive bonus plan Pennsylvania',
      'business protection insurance PA',
    ],
    heroPrefix: 'Business Protection &',
    heroEm: 'Continuity Planning',
    heroTagline: 'Protect Your Business, Your Key People, and Your Legacy',
    heroCtaLabel: 'Protect My Business — Free Review',
    problemLabel: 'The Problem',
    problemHeading: 'Most Small Businesses Have *No Continuity Plan*',
    problemParagraphs: [
      'What happens to your business if you — or your most valuable employee — suddenly cannot work? For most small business owners in Central Pennsylvania, the honest answer is: everything stops. Revenue drops. Clients leave. Employees worry. And the business you\'ve spent years building is at risk.',
      'Business Continuity Planning uses life insurance and financial tools to create a resilient framework that keeps your operations running through any transition — illness, death, disability, or ownership change.',
      'We help Pennsylvania business owners with Key Person Insurance, Executive Bonus Plans, Endorsement Split Dollar Arrangements, and buy-sell agreement funding — all designed to protect your business, reward your key people, and secure your legacy.',
    ],
    pullQuote:
      '"Your business is your legacy. A continuity plan ensures that legacy survives — no matter what happens to you."',
    stats: [
      { value: '70%', label: 'Small Businesses Fail After Owner Loss', desc: '70% of small businesses fail within 2 years of losing a key owner or employee without a continuity plan.' },
      { value: '$0', label: 'Cost for Your Free Review', desc: 'No obligation. We analyze your business vulnerabilities and recommend the right protection strategy.' },
      { value: '4', label: 'Business Protection Strategies', desc: 'Key Person Insurance, Executive Bonus Plans, Split Dollar Arrangements, and Buy-Sell Agreement Funding.' },
      { value: 'Tax', label: 'Deductible Premiums Available', desc: 'Executive Bonus Plans (Section 162) allow businesses to deduct premium payments as a business expense.' },
    ],
    benefitsLabel: 'Our Business Strategies',
    benefitsHeading: 'Four Ways We *Protect Your Business*',
    benefits: [
      { icon: '🔑', title: 'Key Person Insurance', desc: 'Pays a tax-free benefit to your company if a key employee or partner cannot work — covering lost revenue, recruitment costs, and lender reassurance.' },
      { icon: '🎁', title: 'Executive Bonus Plans (Sec. 162)', desc: 'Attract and retain top talent with a tax-deductible bonus that funds a life insurance policy the executive owns outright. Simple. Powerful. Flexible.' },
      { icon: '🤝', title: 'Endorsement Split Dollar', desc: 'Employer and executive share the cost of a life insurance policy — employer retains cash value interest while executive receives the death benefit. Ideal for closely held businesses.' },
      { icon: '📋', title: 'Buy-Sell Agreement Funding', desc: 'Life insurance funds a buy-sell agreement — ensuring a smooth ownership transition if a partner passes away or becomes disabled, without forcing a fire sale.' },
      { icon: '🏢', title: 'Business Continuity Framework', desc: 'A comprehensive analysis of your business vulnerabilities with a customized protection strategy that keeps operations running through any transition.' },
      { icon: '📊', title: 'Tax-Efficient Strategies', desc: 'We design business protection strategies that minimize your tax burden while maximizing the value delivered to you, your key people, and your family.' },
    ],
    faqLabel: 'Common Questions',
    faqHeading: 'Business Protection *FAQs*',
    faqs: [
      { q: 'What is Key Person Insurance?', a: 'Key Person Insurance is a life insurance policy owned by the business on a key employee or owner. If that person passes away or becomes disabled, the business receives a tax-free benefit to cover lost revenue, recruit a replacement, and reassure lenders and investors.' },
      { q: 'What is an Executive Bonus Plan?', a: 'Under a Section 162 Executive Bonus Plan, the employer pays the life insurance premium as a bonus to the executive. The premium is tax-deductible for the business, and the executive owns the policy outright — including the cash value.' },
      { q: 'Do I need a buy-sell agreement?', a: "If you have a business partner, a buy-sell agreement funded by life insurance is essential. It ensures that if one partner passes away, the surviving partner can buy out the deceased partner's share — without forcing a sale to an outside party." },
    ],
    keywordTags: ['business continuity planning Pennsylvania', 'key person insurance Pennsylvania', 'executive bonus plan Pennsylvania', 'business owner insurance Pottsville PA'],
    ctaHeading: "Protect the Business You've Built",
    ctaSubtext: 'Free 30-Minute Business Protection Review · No Obligation',
  },

  {
    slug: 'legacy-checkup',
    serviceNumber: '08',
    serviceLabel: 'Legacy Checkup',
    metaTitle: 'Free Legacy Protection Checkup | Latimore Life & Legacy LLC — Pottsville, PA',
    metaDescription:
      "Free 30-minute Legacy Protection Checkup with Jackson Latimore Sr. Identify your family's protection gaps and build a plan. Serving Central Pennsylvania.",
    keywords: [
      'free financial checkup Pennsylvania',
      'legacy protection review Pottsville PA',
      'financial home makeover analysis',
      'family financial security planning PA',
      'financial checkup near me',
    ],
    heroPrefix: 'Free Legacy',
    heroEm: 'Protection Checkup',
    heroTagline: "30 Minutes. No Pressure. Complete Clarity on Your Family's Financial Protection.",
    heroCtaLabel: 'Start My Free Checkup',
    problemLabel: 'What It Is',
    problemHeading: 'A Financial Audit *Designed for Your Family*',
    problemParagraphs: [
      'Most families know they need a plan. The problem is knowing where to start. Our Free Legacy Protection Checkup is a comprehensive 30-minute review of your current financial situation — identifying gaps, redundancies, and opportunities across life insurance, retirement income, estate planning, and debt management.',
      "Think of it as a Financial Home Makeover Analysis — an honest, no-pressure audit designed to maximize every dollar you're already spending and identify what's missing before it becomes a crisis.",
      "Jackson Latimore Sr. will walk you through your results, answer your questions, and help you understand which strategies may make the most sense for your family's specific situation. No sales pitch. Just clarity.",
    ],
    pullQuote:
      '"Most people don\'t know what they don\'t know. The checkup is designed to change that — in 30 minutes, with no obligation."',
    stats: [
      { value: '30', label: "Minutes — That's All It Takes", desc: 'A focused 30-minute conversation can reveal gaps that could cost your family thousands — or everything.' },
      { value: '$0', label: 'Cost — Completely Free', desc: 'No consultation fee. No obligation. No pressure. Just an honest review of where your family stands.' },
      { value: '5', label: 'Areas Reviewed', desc: 'Life insurance, retirement income, estate planning, debt management, and college funding — all in one session.' },
      { value: '1', label: 'Next Step — A Clear Plan', desc: 'You leave with a clear understanding of your gaps and a prioritized action plan — no confusion, no overwhelm.' },
    ],
    benefitsLabel: 'What We Review',
    benefitsHeading: 'Five Areas of *Your Financial Life*',
    benefits: [
      { icon: '❤️', title: 'Life Insurance Coverage', desc: 'Do you have the right type and amount of coverage? Does it include Living Benefits? We use the DIME method to calculate your true insurable need.' },
      { icon: '🌅', title: 'Retirement Income Strategy', desc: 'Are you on track to replace your income in retirement? Do you have a plan for guaranteed income you cannot outlive?' },
      { icon: '📜', title: 'Estate Planning Gaps', desc: 'Do you have a will, trust, power of attorney, and healthcare directive? Are your beneficiary designations up to date?' },
      { icon: '💳', title: 'Debt Management', desc: 'Is high-interest debt preventing you from building wealth? We identify strategies to eliminate toxic debt and redirect cash flow toward protection and savings.' },
      { icon: '🎓', title: 'College Funding', desc: "If you have children, are you saving for their future in a tax-advantaged, financial-aid-friendly way?" },
      { icon: '📊', title: 'Tax Efficiency', desc: 'Are you paying more taxes than necessary? We identify tax-advantaged strategies that keep more of your money working for you.' },
    ],
    stepsLabel: 'How It Works',
    stepsHeading: 'Your Checkup — *3 Simple Steps*',
    steps: [
      { num: '01', title: 'Book Your 30-Minute Call', desc: 'Schedule online in seconds. No paperwork required before your call.' },
      { num: '02', title: 'We Review Your Situation', desc: 'Jackson walks through your current coverage, savings, and goals — identifying gaps and opportunities.' },
      { num: '03', title: 'You Get a Clear Plan', desc: 'You leave with a prioritized action plan. No obligation to move forward — just clarity on where you stand.' },
    ],
    faqLabel: 'How It Works',
    faqHeading: 'Legacy Checkup *Details*',
    faqs: [],
    keywordTags: ['free financial checkup Pennsylvania', 'legacy protection review Pottsville PA', 'financial home makeover analysis', 'family financial security planning PA'],
    ctaHeading: 'Your Legacy Starts With a Plan',
    ctaSubtext: 'Free 30-Minute Legacy Protection Checkup · No Obligation · No Pressure',
  },

  {
    slug: 'estate-planning',
    serviceNumber: '09',
    serviceLabel: 'Estate Planning',
    metaTitle: 'Estate Planning & Generational Wealth | Latimore Life & Legacy LLC — Pottsville, PA',
    metaDescription:
      'Estate planning and generational wealth strategies for Pennsylvania families. Wills, trusts, life insurance integration. Serving Schuylkill, Luzerne & Northumberland Counties.',
    keywords: [
      'estate planning Pennsylvania',
      'estate planning Pottsville PA',
      'generational wealth planning Pennsylvania',
      'legacy planning life insurance',
      'avoid probate Pennsylvania',
    ],
    heroPrefix: 'Estate Planning &',
    heroEm: 'Generational Wealth',
    heroTagline: 'A Policy Protects the Money. Estate Planning Protects the Instructions.',
    heroCtaLabel: 'Protect My Legacy — Free Review',
    problemLabel: 'The Problem',
    problemHeading: 'Without a Plan, *Courts Decide* What Happens to Your Family',
    problemParagraphs: [
      'Most people assume their assets will automatically pass to their family when they die. But without proper estate planning, courts and state laws decide what happens to your assets, your children, and your healthcare decisions — not you.',
      'The $124 trillion Great Wealth Transfer is underway. Over the next 20 years, more wealth will change hands between generations than at any point in history. Without a plan, taxes, probate, and poor structuring can erode a significant portion of what you\'ve worked a lifetime to build.',
      'Latimore Life & Legacy LLC helps Central Pennsylvania families connect protection planning with wills, trusts, powers of attorney, and healthcare directives — ensuring your wishes are followed and your legacy is preserved.',
    ],
    pullQuote:
      '"Building wealth is one achievement. Passing it on is another. Generational Wealth Planning ensures your legacy survives — on your terms."',
    stats: [
      { value: '$124T', label: 'Great Wealth Transfer Underway', desc: 'The largest intergenerational wealth transfer in history is happening now — most families have no plan for it.' },
      { value: '60%', label: 'Americans Have No Will', desc: "Over 60% of Americans have no will or estate plan — leaving their family's future to state law and probate courts." },
      { value: 'Tax-Free', label: 'Life Insurance Death Benefit', desc: 'Life insurance proceeds pass to beneficiaries 100% income-tax-free — bypassing probate entirely.' },
      { value: '3', label: 'Counties Served', desc: 'Schuylkill, Luzerne, and Northumberland Counties — plus virtual consultations statewide.' },
    ],
    benefitsLabel: 'What We Cover',
    benefitsHeading: 'Complete Estate & *Legacy Protection*',
    benefits: [
      { icon: '📄', title: 'Will & Trust Integration', desc: 'We work alongside your attorney to integrate life insurance into your overall estate plan — ensuring your policy aligns with your will and trust structure.' },
      { icon: '✍️', title: 'Power of Attorney', desc: 'Ensure someone you trust can manage your financial affairs if you become incapacitated — without court intervention.' },
      { icon: '🏥', title: 'Healthcare Directive', desc: "Document your healthcare wishes so your family doesn't have to make impossible decisions during a crisis." },
      { icon: '👥', title: 'Beneficiary Review', desc: 'Outdated beneficiary designations are one of the most common estate planning mistakes. We review and update all designations across your policies and accounts.' },
      { icon: '🏛️', title: 'Probate Avoidance', desc: 'Life insurance and properly structured trusts bypass probate entirely — giving your family immediate access to funds without court delays.' },
      { icon: '💰', title: 'Tax-Efficient Wealth Transfer', desc: 'Strategic use of life insurance minimizes estate taxes and maximizes the after-tax value of what you pass on to the next generation.' },
    ],
    faqLabel: 'Common Questions',
    faqHeading: 'Estate Planning *FAQs*',
    faqs: [
      { q: 'Do I need an attorney for estate planning?', a: "For wills and trusts, yes — you'll need a licensed estate planning attorney. We work alongside your attorney to ensure your life insurance and financial products are properly integrated into your overall estate plan." },
      { q: 'How does life insurance help with estate planning?', a: 'Life insurance provides an immediate, tax-free death benefit that bypasses probate — giving your family liquidity to pay estate taxes, settle debts, and equalize inheritances without forcing a sale of assets.' },
      { q: 'What is generational wealth planning?', a: "Generational wealth planning goes beyond a will — it's a comprehensive strategy to protect, preserve, and pass on your assets to the next generation in the most tax-efficient way possible, using life insurance, trusts, and strategic beneficiary designations." },
    ],
    keywordTags: ['estate planning Pennsylvania', 'estate planning Pottsville PA', 'generational wealth planning Pennsylvania', 'avoid probate Pennsylvania'],
    ctaHeading: 'Protect Your Legacy — On Your Terms',
    ctaSubtext: 'Free 30-Minute Estate Planning Review · No Obligation',
  },

  {
    slug: 'iul-strategy',
    serviceNumber: '10',
    serviceLabel: 'IUL Strategy',
    metaTitle: 'Indexed Universal Life Insurance (IUL) Strategy | Latimore Life & Legacy LLC — Pottsville, PA',
    metaDescription:
      'IUL insurance for tax-free retirement income, college funding, and wealth accumulation in Pennsylvania. Serving Schuylkill, Luzerne & Northumberland Counties. Free consultation.',
    keywords: [
      'indexed universal life insurance Pennsylvania',
      'IUL insurance Pottsville',
      'tax-free retirement IUL PA',
      'indexed universal life Schuylkill County',
      'IUL college funding PA',
    ],
    heroPrefix: 'Indexed Universal Life',
    heroEm: 'Insurance (IUL)',
    heroTagline: 'Grow Tax-Free. Access Tax-Free. Pass On Tax-Free. The Triple Threat.',
    heroCtaLabel: 'Discover My IUL Strategy',
    problemLabel: 'What Is an IUL?',
    problemHeading: 'The Most Powerful *Tax-Advantaged Tool* Most People Have Never Heard Of',
    problemParagraphs: [
      'An Indexed Universal Life (IUL) policy combines permanent life insurance protection with tax-deferred cash value growth linked to a market index — with a guaranteed floor of zero, so you never lose money due to market downturns.',
      'Unlike a 401(k) or IRA, an IUL has no contribution limits, no age restrictions on access, no required minimum distributions, and no market loss. Your money grows indexed to the market — capturing upside gains while being protected from downside risk.',
      'The IUL is the cornerstone of our tax-free retirement strategy — and one of the most powerful tools available to Pennsylvania families and business owners who want to build wealth without the tax burden of traditional retirement accounts.',
    ],
    pullQuote:
      '"If you wrote us a check for $420,000 and we wrote you back a check for $3.3 million tax-free — would that be a good deal or a great deal?" — Jackson M. Latimore Sr.',
    stats: [
      { value: '$0', label: 'Maximum Annual Market Loss', desc: 'A guaranteed floor of zero means your cash value never decreases due to market downturns — ever.' },
      { value: '9%', label: 'Average Annual Growth (30 Years)', desc: 'IUL accounts have averaged approximately 9% annually over the last 30 years — vs. 5–7% for most 401(k)s.' },
      { value: '3x', label: 'Tax-Free Advantage', desc: 'Grow tax-free. Access tax-free. Pass on tax-free. The IUL is a triple tax advantage no other product matches.' },
      { value: 'No', label: 'Contribution Limits or RMDs', desc: 'Unlike 401(k)s and IRAs, IULs have no IRS contribution limits and no required minimum distributions at age 73.' },
    ],
    benefitsLabel: 'The PERCS Advantage',
    benefitsHeading: 'Five Reasons IUL *Outperforms* Traditional Retirement Accounts',
    benefits: [
      { icon: '🛡️', title: 'P — Protection', desc: "The life insurance component protects your family with a tax-free death benefit — and Living Benefits if you're diagnosed with a qualifying illness." },
      { icon: '🚨', title: 'E — Emergency Access', desc: 'Access your cash value at any age without the 10% early withdrawal penalty that applies to 401(k)s before age 59½.' },
      { icon: '🌅', title: 'R — Retirement Income', desc: 'Take tax-free distributions in retirement — keeping you in the lowest possible tax bracket and maximizing your Social Security benefit.' },
      { icon: '🎓', title: 'C — Children & College', desc: "One of the most popular ways to save for your child's future — doesn't count against financial aid and can be used for anything." },
      { icon: '💰', title: 'S — Savings Growth', desc: 'Average 9% annual growth over 30 years — with zero market loss. Your money compounds faster and more safely than in a traditional savings account.' },
      { icon: '📊', title: 'IUL vs. 401(k) Comparison', desc: "$420K contributed → $3.3M+ tax-free in an IUL vs. $1M+ taxable in a 401(k). The difference is the tax treatment — and it's enormous." },
    ],
    faqLabel: 'Common Questions',
    faqHeading: 'IUL Strategy *FAQs*',
    faqs: [
      { q: 'Is an IUL too good to be true?', a: "It's not — because there is a catch. Insurance companies impose a cap on the maximum interest you can earn in a given year (typically 10–15%). This is how they can guarantee you won't lose money. You give up some upside in exchange for downside protection. Most clients find this trade-off very favorable." },
      { q: 'Who qualifies for an IUL?', a: "IULs require a medical and financial qualification process because of the life insurance component. Not everyone qualifies — but most healthy adults do. The earlier you apply, the better your rates. We'll help you determine if you qualify in your free review." },
      { q: 'How is an IUL different from a 401(k)?', a: 'A 401(k) is pre-tax (you pay taxes later, when rates may be higher), has contribution limits, has age restrictions on access, and has required minimum distributions at 73. An IUL is post-tax (you pay taxes now, then grow and access tax-free), has no contribution limits, no age restrictions, and no RMDs.' },
      { q: 'What carriers do you use for IUL?', a: 'We work with top-rated carriers including North American and others — shopping the market to find the best IUL design for your specific goals, age, and health profile.' },
    ],
    keywordTags: ['indexed universal life insurance Pennsylvania', 'IUL insurance Pottsville', 'tax-free retirement IUL PA', 'IUL college funding PA', 'indexed universal life Schuylkill County'],
    ctaHeading: 'Grow Tax-Free. Retire Tax-Free.',
    ctaSubtext: 'Free 30-Minute IUL Strategy Review · No Obligation',
  },
]

export function getServicePage(slug: string): ServicePageContent | undefined {
  return SERVICE_PAGES.find((p) => p.slug === slug)
}
