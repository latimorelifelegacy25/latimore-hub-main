'use client'

import React, { useState } from 'react'
import Link from 'next/link'

// ─── Brand tokens matching blog.html ──────────────────────────────────────────
const C = {
  navy: '#2C3E50',
  navyDeep: '#1a2530',
  navyMid: '#354d63',
  gold: '#C49A6C',
  goldLight: '#d4b48a',
  goldPale: '#fdf6ee',
  goldBorder: '#e8d5b8',
  cream: '#f9f6f0',
  ink: '#1a1a1a',
  muted: '#6b6460',
  rule: '#e2dcd4',
  white: '#ffffff',
  trackA: '#2d5f8a',
  trackB: '#4a7c59',
  trackC: '#7a4f2e',
} as const

type Track = 'A' | 'B' | 'C'
type Filter = 'all' | Track

type Article = {
  id: string
  track: Track
  trackLabel: string
  num: string
  title: string
  excerpt: string
  format: string
  kpi: string
  cta: string
  bilingual?: boolean
  body: string
}

// ─── Article data ──────────────────────────────────────────────────────────────
const ARTICLES: Article[] = [
  {
    id: 'a1', track: 'A', trackLabel: 'Young Families', num: 'A1',
    title: 'What Happens to Your Family If You Die Before Your Mortgage Is Paid Off?',
    excerpt: 'The question I ask myself every day since a cardiac arrest stopped my heart at 21. For millions of Coal Region families, it\'s one missed heartbeat from becoming very real.',
    format: '2,000 words · Checklist', kpi: 'Applications',
    cta: 'Book a no-cost 20-minute protection review',
    body: `<h2>The Morning Everything Changes</h2>
<p>On a cold December morning in 2010, a 21-year-old college athlete at East Stroudsburg University collapsed on the basketball court at Koehler Fieldhouse. His heart stopped. No warning. No dramatic buildup. One moment he was running drills — the next, he was gone.</p>
<p>An AED funded by the Gregory W. Moyer Defibrillator Fund brought him back. That young man was me, Jackson Latimore. And the question I have asked myself every day since is not "why did I survive?" It is "what would have happened to the people who depended on me if I had not?"</p>
<h2>The Mortgage Problem Nobody Talks About</h2>
<p>According to LIMRA's 2023 Insurance Barometer Study, 41 percent of Americans say they do not have enough life insurance, and 50 percent of households with children under 18 say they would face financial hardship within six months if a primary wage earner died. Six months. Not six years. Six months.</p>
<p>In Schuylkill, Luzerne, and Northumberland Counties — where median household incomes run well below the national average and where many families carry both a mortgage and a vehicle payment into their 40s and 50s — that six-month window is optimistic.</p>
<h2>What Actually Happens When There Is No Plan</h2>
<p><strong>Week one:</strong> The surviving spouse must notify the bank, the insurance company, the vehicle lender, and the utility companies. Grief and logistics collide in the worst possible way.</p>
<p><strong>Month two:</strong> The mortgage payment comes due. With one income gone and no death benefit, the surviving parent faces an immediate cash-flow crisis.</p>
<p><strong>Month six:</strong> Savings are depleted. The surviving spouse faces a choice between keeping the house and keeping the kids in their school, or selling everything and starting over. Children lose not just a parent but their home, their neighborhood, and their stability in the same year.</p>
<h2>What Life Insurance Actually Does</h2>
<p>A properly structured life insurance policy does one thing above everything else: it buys your family time. Time to grieve without financial panic. Time for the surviving parent to make rational decisions. Time for your children to stay in the same school, the same neighborhood, the same life they knew.</p>
<p>A 35-year-old non-smoker in good health can typically secure $500,000 in coverage for less than $30 per month. That is less than a tank of gas — and a guarantee that your family keeps the house if the worst happens.</p>
<h2>Decision Checklist — Is Your Family Protected?</h2>
<ul>
<li>Do you have a life insurance policy currently in force?</li>
<li>Does your death benefit cover at least 10× your annual income?</li>
<li>Does your policy term extend until your youngest child is 25 or your mortgage is paid off?</li>
<li>Does your surviving spouse know where the policy is and how to file a claim?</li>
<li>Have you reviewed your beneficiary designations in the last three years?</li>
<li>Do you have coverage for childcare costs in addition to income replacement?</li>
<li>If self-employed, is your business debt also covered?</li>
</ul>`,
  },
  {
    id: 'a2', track: 'A', trackLabel: 'Young Families', num: 'A2',
    title: 'Term vs. Whole Life vs. IUL — A Plain-English Guide for Coal Region Families',
    excerpt: 'Three products, plain English, no hidden agenda. By the end, you\'ll know which one fits your life — or whether you need a combination.',
    format: '1,500 words · Comparison Table', kpi: 'Referral',
    cta: 'Download the free product comparison one-pager',
    body: `<h2>The Insurance Aisle Is Confusing on Purpose</h2>
<p>If you've ever tried to figure out what kind of life insurance you actually need, you know the feeling: too many products, too many acronyms, and too many salespeople who seem more interested in their commission than your family's situation. This guide cuts through all of it. Three products. Plain English. No hidden agenda.</p>
<h2>Option 1: Term Life Insurance</h2>
<p>Term life is the simplest product in insurance. You pay a monthly premium. If you die within the policy term — typically 10, 20, or 30 years — your family receives the death benefit. If the term expires and you're still alive, coverage ends.</p>
<p><strong>Best for:</strong> Families who need the most coverage for the lowest monthly cost. A 35-year-old in good health can get $500,000 in coverage for under $30 per month. If your primary goal is making sure your mortgage gets paid and your kids get through school if you die early, term is almost always the right starting point.</p>
<h2>Option 2: Whole Life Insurance</h2>
<p>Whole life covers you for your entire life. A portion of your monthly premium goes into a cash value account that grows at a guaranteed rate. You can borrow against that cash value or surrender the policy for its value.</p>
<p><strong>Best for:</strong> People who want permanent coverage that will never expire — to guarantee a death benefit for final expenses or to leave an inheritance. Whole life premiums are significantly higher than term for the same death benefit.</p>
<h2>Option 3: Indexed Universal Life (IUL)</h2>
<p>IUL is permanent life insurance that combines a death benefit with a cash value account linked to a stock market index — typically the S&P 500. You don't invest directly in the market, but your account earns interest based on index performance, subject to a cap and a floor of zero (meaning you can't lose money when the market drops).</p>
<p><strong>Best for:</strong> People who want permanent coverage and want their cash value to grow faster than traditional whole life. IUL is increasingly popular for supplemental retirement income.</p>
<h2>A Rough Framework for Most Coal Region Families</h2>
<ul>
<li><strong>In your 20s–30s with young children and a mortgage:</strong> Start with term. Get the maximum coverage you can afford. Layer in permanent coverage later as income grows.</li>
<li><strong>In your 40s with growing income and kids approaching college:</strong> Consider a combination — term for the heavy lifting, IUL to start building tax-advantaged retirement income.</li>
<li><strong>In your 50s approaching retirement:</strong> Whole life or IUL for legacy and supplemental income.</li>
</ul>
<p>The best product is the one that actually gets purchased and kept in force — because the most expensive life insurance in the world is the policy you meant to get but never did.</p>`,
  },
  {
    id: 'a3', track: 'A', trackLabel: 'Young Families', num: 'A3',
    title: 'The 5 Financial Moves Schuylkill County Parents Keep Putting Off (and What They Cost)',
    excerpt: 'Procrastination is a financial decision. Every week you wait to get your house in order, that decision compounds. Here\'s the real price of delay.',
    format: '1,200 words · Checklist Download', kpi: 'Applications',
    cta: 'Get the free Legacy Readiness Checklist',
    body: `<h2>Procrastination Is a Financial Decision</h2>
<p>Every week you wait to get your financial house in order is a decision — just not a conscious one. Procrastination has a price, and in financial planning, that price compounds. Here are the five moves Coal Region parents keep delaying, and what each one costs.</p>
<h2>1. Getting Life Insurance — or Reviewing What You Have</h2>
<p>Most people either have no coverage or have a policy they bought years ago and haven't looked at since. Life changes: marriages, divorces, new children, new mortgages, promotions. Your coverage needs to keep up.</p>
<p><strong>The cost of waiting:</strong> Every year you age, premiums increase. A 35-year-old and a 42-year-old applying for the same $500,000 term policy can see a difference of hundreds of dollars per year. The window of low-cost, easy qualification closes faster than most people expect.</p>
<h2>2. Naming — and Updating — Beneficiaries</h2>
<p>Failing to update a beneficiary designation is one of the most common and most devastating financial mistakes families make. Divorce, remarriage, the death of a previously named beneficiary — any of these can make your existing designation wrong in ways courts cannot easily fix.</p>
<p><strong>The cost of waiting:</strong> Death benefits paid to the wrong person, or tied up in probate for years. This is entirely preventable and costs nothing to fix.</p>
<h2>3. Building a 3-to-6-Month Emergency Fund</h2>
<p>Without a cushion, a single unexpected event — a medical bill, a job loss, a car repair — forces families into high-interest debt that takes years to escape.</p>
<h2>4. Starting a Retirement Account — Even a Small One</h2>
<p><strong>The cost of waiting:</strong> Compound interest is ruthless in both directions. $200/month started at 35 grows to a fundamentally different number than $200/month started at 45. Delaying five years of retirement saving in your 30s can cost six figures by the time you reach 65.</p>
<h2>5. Having the Conversation with Your Family</h2>
<p>Where are the insurance documents? Where is the will? What are the account numbers? Most families never have this conversation — not because they don't love each other, but because it's uncomfortable to talk about death and money in the same sentence.</p>
<p><strong>The cost of waiting:</strong> Families left in crisis mode — grief layered on top of logistical chaos — because no one knew where anything was or what the deceased would have wanted.</p>
<p>None of these moves require wealth. They require a decision. Start with one. The rest follows.</p>`,
  },
  {
    id: 'a4', track: 'A', trackLabel: 'Young Families', num: 'A4',
    bilingual: true,
    title: '¿Tiene su familia protección? / Does Your Family Have Protection If Something Happens to You?',
    excerpt: 'Para familias en Hazleton y el condado de Luzerne. For Latino families: honest guidance in the language you prefer.',
    format: '1,200 words · Bilingual', kpi: 'Applications',
    cta: 'Hable con nosotros hoy — call in Spanish or English',
    body: `<div style="background:#f0f6fb;border-left:3px solid #2d5f8a;padding:1.5rem;margin:1.5rem 0;border-radius:0 3px 3px 0">
<div style="font-family:monospace;font-size:11px;letter-spacing:0.16em;text-transform:uppercase;color:#2d5f8a;margin-bottom:0.75rem;font-weight:500">Español / Spanish</div>
<h2 style="border:none;padding:0;margin:0 0 1rem">¿Qué hace un seguro de vida?</h2>
<p>Nadie quiere pensar en lo que le pasaría a su familia si usted faltara. Pero precisamente por eso es tan importante hacerlo — antes de que sea demasiado tarde para actuar.</p>
<p>En comunidades como Hazleton, donde más del 63 por ciento de la población es de origen hispano, muchas familias trabajan duro, construyen sus vidas, pagan sus cuentas, y aún así no tienen ninguna protección de seguro de vida. No porque no se preocupen. Sino porque nadie les ha explicado cómo funciona, en su idioma, sin presiones.</p>
<p>Un seguro de vida es una promesa simple: si usted muere, su familia recibe un pago que les ayuda a cubrir gastos inmediatos, la hipoteca o el alquiler, y tiempo para reorganizarse sin crisis económica.</p>
<p><strong>¿Es caro?</strong> Una persona de 35 años en buena salud puede obtener $500,000 dólares en cobertura por menos de $30 al mes. Eso es menos que el plan de su celular.</p>
<p><strong>Llámenos:</strong> (717) 615-2613 | jackson1989@latimorelegacy.com</p>
</div>
<h2>What Does Life Insurance Do?</h2>
<p>No one wants to think about what would happen to their family if they were gone. But that's exactly why it matters to think about it now — before it's too late to act.</p>
<p>In communities like Hazleton, where more than 63 percent of the population is of Hispanic origin, many families work hard, build their lives, pay their bills, and still have no life insurance protection. Not because they don't care. But because no one has explained how it works — in their language, without pressure.</p>
<p>Life insurance is a simple promise: if you die, your family receives a payment that helps cover immediate expenses, the mortgage or rent, and time to reorganize without financial crisis.</p>
<p><strong>Is it expensive?</strong> A 35-year-old in good health can get $500,000 in coverage for under $30 per month. Less than a cell phone plan. The biggest mistake families make is not buying too much — it's waiting too long.</p>
<p>Latimore Life &amp; Legacy is a licensed independent broker in Pennsylvania. We don't work for one company — we work for you. No pressure. No quotas. Just honesty and clarity, in the language you prefer.</p>`,
  },
  {
    id: 'b1', track: 'B', trackLabel: 'Pre-Retirees 50–65', num: 'B1',
    title: 'One Hospital Stay Wiped Out 20 Years of Savings — How to Make Sure It Doesn\'t Happen to You',
    excerpt: 'The gap between "I\'m alive but incapacitated" and "my money is protected" is exactly what living benefits are designed to close. Here\'s how they work.',
    format: '1,800 words · Living Benefits Explainer', kpi: 'Applications',
    cta: 'Find out if your current policy has living benefits — free policy review',
    body: `<h2>A Story That Happens More Than Anyone Admits</h2>
<p>Robert and Linda had done everything right. Thirty-two years of work between them, a paid-off car, a mortgage with eight years left, and $280,000 in a 401(k) that had taken decades to build. Then Robert had a stroke at 61. He spent 11 days in the hospital, followed by six weeks of inpatient rehabilitation. Out-of-pocket costs, lost wages, and in-home care totaled more than $140,000 over 18 months. The retirement they'd spent 30 years building was cut in half before either of them had collected a single Social Security check.</p>
<h2>The Gap in Most Pre-Retirement Plans</h2>
<p>Traditional life insurance pays a death benefit when you die. It does not pay when you have a stroke. It does not pay when you're diagnosed with cancer. It does not pay when you need a heart bypass that takes you out of work for four months.</p>
<p>That gap — the space between "I am alive but incapacitated" and "my money is protected" — is exactly what <strong>living benefits</strong> are designed to close.</p>
<h2>What Are Living Benefits?</h2>
<p>Living benefits are riders built into or added to a life insurance policy that allow you to access a portion of your death benefit while you're still alive, under qualifying conditions. The three most common triggers are:</p>
<ul>
<li><strong>Terminal illness:</strong> typically triggered when a physician certifies a life expectancy of 12–24 months or less</li>
<li><strong>Chronic illness:</strong> triggered when the insured is unable to perform a specified number of Activities of Daily Living (ADLs) without assistance</li>
<li><strong>Critical illness:</strong> triggered by a specific diagnosis — heart attack, stroke, certain cancers, organ failure</li>
</ul>
<p>If you trigger a living benefit, you receive a lump sum — typically a percentage of your death benefit — that you can use for any purpose. Medical bills. Lost income. Home modifications. No receipts required. No justification. The money is yours to use as your situation demands.</p>
<h2>Why Most People Don't Know This Exists</h2>
<p>Living benefits have been part of the insurance market for years. But they're almost never explained to the people who need them most. Carriers like Corebridge Financial, North American Company, and Foresters Financial offer policies with robust living benefit provisions that most employer-provided or online-purchased policies simply don't include.</p>
<h2>Your Retirement Deserves a Safety Net</h2>
<p>A free policy review through Latimore Life &amp; Legacy takes about 30 minutes. We look at what policies you currently have in force, whether your existing coverage includes living benefits, and what it would cost to add or upgrade coverage now. We don't push a specific product. We start with your situation and work from there.</p>`,
  },
  {
    id: 'b2', track: 'B', trackLabel: 'Pre-Retirees 50–65', num: 'B2',
    title: 'Will You Outlive Your Money? The Honest Retirement Income Math for Pennsylvania Workers',
    excerpt: 'A 65-year-old Pennsylvania couple faces a meaningful chance one of them lives past 90. Most retirement plans aren\'t built for 27 years of withdrawals.',
    format: '2,000 words · Income Worksheet', kpi: 'Applications',
    cta: 'Book a free Retirement Income Snapshot session',
    body: `<h2>The Question Retirement Plans Rarely Answer Honestly</h2>
<p>How long are you going to live? It's an uncomfortable question, but your retirement plan depends entirely on the answer. A 65-year-old Pennsylvania man today has a life expectancy of approximately 83 years. A 65-year-old Pennsylvania woman: approximately 86. If you're a couple both retiring at 63, there is a meaningful probability that one of you will live past 90. Most retirement income plans are not built for 27 years of withdrawals.</p>
<h2>The Math Most People Are Not Running</h2>
<p>Consider a realistic Coal Region pre-retiree retiring at 63 with $320,000 in a 401(k), $1,400/month in estimated Social Security, no pension, a mortgage with 5 years remaining, and estimated monthly living expenses of $3,800. Monthly income gap: $2,400/month from savings. At that withdrawal rate — assuming 5% annual growth — that account runs out in approximately <strong>14 years</strong>. You'd be 77 years old with no savings. Add one health crisis costing $80,000–$140,000, and the math collapses years earlier.</p>
<h2>The Four Retirement Income Risks Nobody Warned You About</h2>
<ul>
<li><strong>Longevity risk:</strong> Simply living longer than your money lasts. The solution is income sources that cannot be outlived.</li>
<li><strong>Sequence of returns risk:</strong> A bad market year early in retirement is far more damaging than the same loss later, because you're withdrawing during the downturn.</li>
<li><strong>Inflation risk:</strong> Over a 25-year retirement, inflation quietly erodes purchasing power in ways that fixed income streams can't keep up with.</li>
<li><strong>Health and long-term care risk:</strong> About 70% of people turning 65 will need some form of long-term care. Medicaid covers nursing home care only after you've spent down your assets.</li>
</ul>
<h2>What Guaranteed Income Looks Like</h2>
<p>Fixed indexed annuities from carriers like American Equity, F&G, and Corebridge Financial take a lump sum and guarantee a stream of income you cannot outlive — regardless of how long you live or what the market does. Your principal is protected from market loss. Interest credits are linked to a market index with a floor of zero, meaning you never lose money when the market drops.</p>`,
  },
  {
    id: 'b3', track: 'B', trackLabel: 'Pre-Retirees 50–65', num: 'B3',
    title: 'Fixed Annuities vs. IULs for Retirement Income — What Actually Makes Sense After 55',
    excerpt: 'Two products. Both legitimate. Only one is right for your situation. A direct comparison — no sales pitch, just the mechanics.',
    format: '1,500 words · Comparison + Carrier Guide', kpi: 'Referral',
    cta: 'See which option fits your situation — free 15-minute call',
    body: `<h2>Two Products. Both Legitimate. Only One Is Right for Your Situation.</h2>
<p>Both fixed indexed annuities (FIAs) and indexed universal life insurance (IUL) link returns to a market index. Both protect against market loss. Both are tools used by serious retirement planners. They are not the same product, and they don't serve the same purpose.</p>
<h2>Fixed Indexed Annuities (FIA)</h2>
<p>A fixed indexed annuity is a contract with an insurance company. You deposit a lump sum, and the carrier guarantees your principal against market loss. Interest is credited based on the performance of a market index (usually the S&P 500), subject to a cap, spread, or participation rate.</p>
<ul>
<li><strong>Core purpose:</strong> Guaranteed income you cannot outlive</li>
<li><strong>Best for:</strong> Retirees or near-retirees who need guaranteed income to cover fixed expenses with principal protection</li>
<li><strong>Tax treatment:</strong> Grows tax-deferred; income is taxed as ordinary income when withdrawn</li>
<li><strong>Carriers we work with:</strong> American Equity, F&G, Corebridge Financial</li>
</ul>
<h2>Indexed Universal Life (IUL)</h2>
<p>An IUL is a permanent life insurance policy with a cash value component linked to a market index. Unlike a FIA, an IUL's primary purpose is the death benefit. The cash value can be accessed through policy loans, which are generally income-tax-free.</p>
<ul>
<li><strong>Core purpose:</strong> Death benefit + tax-advantaged cash value accumulation</li>
<li><strong>Best for:</strong> People who want permanent insurance AND a tax-advantaged accumulation vehicle; supplemental retirement income in higher tax brackets</li>
<li><strong>Risk:</strong> Must be properly funded and monitored; underfunded IULs can collapse</li>
</ul>
<h2>The Direct Answer</h2>
<p>If your primary question is "How do I make sure I have income I cannot outlive?" — the answer is a <strong>FIA with an income rider</strong>. Simpler, more predictable, purpose-built for that goal.</p>
<p>If your primary question is "How do I supplement retirement income in a tax-efficient way while also leaving a death benefit?" — the answer leans toward <strong>IUL</strong>, assuming you have the time horizon and premium capacity to fund it properly.</p>
<p>Many pre-retirees benefit from both: a FIA to cover essential income needs, and an IUL started earlier to build tax-advantaged supplemental income over time.</p>`,
  },
  {
    id: 'b4', track: 'B', trackLabel: 'Pre-Retirees 50–65', num: 'B4',
    title: 'How to Leave Something Behind — Legacy Planning for People Who Didn\'t Start Early',
    excerpt: 'The best day to plant a tree was 20 years ago. The second best day is today. No judgment, no pressure — just a realistic plan from where you are. #TheBeatGoesOn',
    format: '1,600 words · Legacy Letter Template', kpi: 'Brand',
    cta: 'Start your legacy plan today — no judgment, no pressure',
    body: `<h2>It Is Not Too Late</h2>
<p>The story that you missed your window, that it's too late, that legacy planning is for people who had it all figured out in their 30s — that story is not just wrong. It's actively harmful. The best day to plant a tree was 20 years ago. The second best day is today.</p>
<h2>What Legacy Actually Means</h2>
<p>Legacy is not a word reserved for the wealthy. In the Coal Region, I've seen legacy built by miners, nurses, teachers, truck drivers, and small business owners. Legacy is not about the size of what you leave. It is about the intentionality of it.</p>
<p>A legacy plan does three things: it protects the people who depend on you today, it provides for the people you love after you're gone, and it communicates — through action, not just words — what mattered to you.</p>
<h2>The Letter</h2>
<p>Of all the things I've seen families receive after a loss, the ones that are remembered longest are not the financial instruments. They are the letters. A legacy letter — sometimes called an ethical will — is not a legal document. It's a personal one. It's you, in your own words, telling the people who mattered to you what you want them to know.</p>
<p>These letters cost nothing to write. They require no lawyer, no financial advisor, no policy number. And they are among the most powerful things a parent, grandparent, or spouse can leave behind.</p>
<h2>The Financial Side of Legacy — Starting in Your 50s</h2>
<ul>
<li><strong>Final expense coverage:</strong> A smaller whole life policy ($10,000–$25,000) that covers funeral costs and gives your family a buffer. Accessible to most people even with health challenges.</li>
<li><strong>Debt elimination:</strong> A term or whole life policy sized to cover your mortgage, car loan, or credit card debt.</li>
<li><strong>Income replacement:</strong> Even in your late 50s, a surviving spouse may be 10–15 years from full Social Security eligibility. A death benefit bridges that gap.</li>
<li><strong>Inheritance:</strong> A whole life policy with a guaranteed death benefit is one of the most reliable ways to leave something for children or grandchildren.</li>
</ul>
<h2>The Weight You Don't Have to Carry</h2>
<p>The cardiac arrest that restarted my own life taught me one thing above everything else: preparedness is an act of love. You prepare not because you're afraid of dying, but because you love the people who would be left behind. It's not too late to love your family in that way.</p>
<p><strong>#TheBeatGoesOn</strong></p>`,
  },
  {
    id: 'c1', track: 'C', trackLabel: 'School Districts', num: 'C1',
    title: 'What Happens to Your School District If the Superintendent Dies on Monday?',
    excerpt: 'It happens. And when it does, districts that haven\'t prepared face a convergence of operational, financial, and reputational crises they\'re never equipped to handle.',
    format: '2,000 words · District Checklist', kpi: 'District Pipeline',
    cta: 'Request the School District Risk & Continuity Briefing — no cost',
    body: `<h2>A Question Boards Rarely Ask Until They Have To</h2>
<p>Most school boards spend significant time managing the operational present: budget cycles, curriculum reviews, personnel matters, facilities planning. What they almost never address — until it's too late — is a simple contingency question: what happens to this district if our superintendent, our business manager, or another key administrator dies or becomes permanently incapacitated without warning?</p>
<p>This is not a hypothetical exercise. It happens. And when it does, districts that haven't prepared face a convergence of crises — operational, financial, and reputational — that they're almost never equipped to handle.</p>
<h2>The Three-Front Crisis</h2>
<p><strong>1. Operational disruption:</strong> A superintendent is the institutional knowledge center of a district. Budget negotiations, vendor relationships, personnel decisions in progress, union contract dynamics, grant applications, state compliance — all of these exist in the superintendent's head. An interim brought in from outside has no context.</p>
<p><strong>2. Financial instability:</strong> An unplanned leadership transition is expensive. Emergency administrative searches cost money. Interim contracts cost money. Consulting fees to reconstruct institutional knowledge cost money. Districts absorb these costs through reserve funds, program cuts, or both.</p>
<p><strong>3. Community and parent trust:</strong> Parents notice. When leadership instability is handled reactively, the perception of instability extends to the classroom. The district's reputation takes damage that is slow and difficult to repair.</p>
<h2>What Key Person Insurance Does</h2>
<p>Key person insurance is a life insurance policy owned by the school district, on the life of a designated key administrator. The district pays the premiums and is the named beneficiary. If the insured administrator dies, the district receives the death benefit — a lump sum that can be used to cover emergency administrative searches, consulting fees, and budget stabilization.</p>
<h2>District Risk &amp; Continuity Checklist</h2>
<ul>
<li>Has the board formally identified key person risk positions in the district?</li>
<li>Does the district have key person life insurance on the superintendent?</li>
<li>Does the district have key person coverage on the business manager / director of finance?</li>
<li>Is there a written succession plan or emergency leadership protocol?</li>
<li>Is there a budget reserve designated for unplanned leadership transition costs?</li>
<li>Has the district reviewed its key person coverage in the last three years?</li>
<li>Are board members aware of what an emergency superintendent search typically costs?</li>
</ul>`,
  },
  {
    id: 'c2', track: 'C', trackLabel: 'School Districts', num: 'C2',
    title: 'Key Person Insurance for Pennsylvania School Districts — A Board Member\'s Plain-Language Guide',
    excerpt: 'It remains dramatically underutilized — not because it\'s less important, but because it\'s less discussed. This guide explains exactly how it works and what it costs.',
    format: '1,800 words · FAQ Sidebar', kpi: 'District Pipeline',
    cta: 'Schedule a board-level briefing — no cost, no obligation',
    body: `<h2>What Is Key Person Insurance?</h2>
<p>Key person insurance is a life insurance policy purchased by an organization on the life of an individual whose death or permanent disability would cause significant financial or operational harm to that organization. The organization owns the policy, pays the premiums, and receives the death benefit. In a corporate context, it's been standard practice for decades. In educational institutions, it remains dramatically underutilized — not because it's less important, but because it's less discussed.</p>
<h2>How a Policy Is Structured</h2>
<ul>
<li><strong>Owner:</strong> The school district</li>
<li><strong>Insured:</strong> The designated key administrator</li>
<li><strong>Beneficiary:</strong> The school district</li>
<li><strong>Death benefit:</strong> Paid to the district upon the insured's death</li>
</ul>
<p>The insured administrator must consent to and cooperate with the application process, including underwriting. The policy does not require the administrator's participation in day-to-day management — it is a financial instrument held by the district, not the individual.</p>
<h2>How the Benefit Amount Is Determined</h2>
<p>A reasonable starting point is the estimated cost of a two-year transition. That estimate typically includes emergency administrative search fees ($25,000–$60,000+ for superintendent searches), interim administrator costs, consulting and knowledge reconstruction, and a reserve buffer. For most small to mid-sized Pennsylvania districts, a policy of $250,000–$750,000 per key position provides meaningful protection.</p>
<h2>What It Costs</h2>
<p>For a district insuring a 50-year-old superintendent with $500,000 in coverage, annual premiums are typically in the range of $3,000–$8,000. Against a district operating budget of several million dollars, that's a small line item for meaningful protection.</p>
<h2>Frequently Asked Questions</h2>
<p><strong>Does the administrator have to agree?</strong> Yes. The insured individual must provide written consent and cooperate with underwriting.</p>
<p><strong>What if the administrator leaves before they die?</strong> The policy lapses or can be surrendered. Some policies have cash value the district receives on surrender.</p>
<p><strong>Can the administrator take the policy with them?</strong> No. The district owns the policy. It cannot be transferred to the individual without the district's consent.</p>
<p><strong>Is this taxable to the district?</strong> Death benefits received are generally income-tax-free. Districts should consult their solicitor for guidance specific to their situation.</p>`,
  },
  {
    id: 'c3', track: 'C', trackLabel: 'School Districts', num: 'C3',
    title: 'The Gregory W. Moyer Story — Why Preparedness Is Never Optional',
    excerpt: 'He didn\'t know me. I didn\'t know him. He funded a defibrillator for a campus he probably walked through once. His decision saved my life. #TheBeatGoesOn',
    format: '1,400 words · Brand Narrative', kpi: 'Brand',
    cta: 'See how Latimore Life & Legacy protects the people your community depends on',
    body: `<h2>A Name on a Fund That Saved a Life</h2>
<p>In December 2010, I collapsed on the basketball court at East Stroudsburg University's Koehler Fieldhouse. My heart stopped. I did not know, until much later, the name of the man whose generosity had placed the AED on that wall — the device that restarted my heart and gave me back my life.</p>
<p>Gregory W. Moyer. I did not know him. He did not know me. He had contributed to a defibrillator fund because he believed, simply, that a campus should be prepared for a cardiac emergency. He could not have known which student, on which court, on which day, would need it. He just knew that preparedness was not optional.</p>
<h2>Preparedness Is Institutional, Not Personal</h2>
<p>When we talk about preparedness in schools, we usually mean fire drills, lockdown protocols, first aid kits, and AEDs on gymnasium walls. These are physical preparedness measures. What most schools and districts have not built is <strong>institutional preparedness</strong> — the financial and operational infrastructure that protects the school community when a key leader is suddenly gone.</p>
<p>The AED on the wall at ESU existed because someone decided before the emergency that it should be there. Key person insurance works the same way. You don't put it in place after the superintendent dies. You put it in place years before, precisely because you don't know when — or whether — you will ever need it.</p>
<h2>The Parallel Is Not Metaphorical</h2>
<p>Consider what an AED does: it sits unused for years, maybe decades. Most institutions that have one will never need it. And yet the logic of having it is airtight — because when the moment comes, the cost of not having it is unrecoverable. Key person insurance sits in the same category. A district that carries a $500,000 policy on its superintendent for 15 years and never files a claim has not wasted its money. It has purchased 15 years of institutional security.</p>
<h2>The Beat Goes On</h2>
<p>Latimore Life &amp; Legacy exists because a community invested in preparedness before a crisis arrived. My business is built on the conviction that the communities of Pennsylvania's Coal Region deserve the same protection — for their families, for their institutions, and for the leaders who serve them.</p>
<p>If you lead a school district in Schuylkill, Luzerne, or Northumberland County, I would like to talk with you about institutional preparedness. Not to sell you something in a first conversation. To help you ask the right questions about what your district has — and what it is missing. Because preparedness, as Gregory Moyer understood, is never optional.</p>
<p><strong>#TheBeatGoesOn</strong></p>`,
  },
  {
    id: 'c4', track: 'C', trackLabel: 'School Districts', num: 'C4',
    title: 'Succession Planning for School Business Managers — Protecting More Than the Budget',
    excerpt: 'The business manager\'s knowledge is embedded in systems, relationships, and institutional history that a replacement cannot access without months of orientation.',
    format: '1,600 words · Succession Template', kpi: 'District Pipeline',
    cta: 'Talk to an independent broker who understands educational institutions',
    body: `<h2>The Role Nobody Plans to Lose</h2>
<p>When a school board thinks about leadership succession, the superintendent comes to mind first. But there's another role that carries enormous institutional risk: the school business manager. They know where every dollar is, where it's going, and what the district is legally obligated to do with it. They manage relationships with auditors, banks, payroll vendors, employee benefits administrators, and state oversight agencies.</p>
<p>When that person is gone — suddenly, without transition — the financial operations of the district do not pause. The payroll still runs. The auditors still come. The state still expects its reports.</p>
<h2>What the Risk Actually Looks Like — The First 90 Days</h2>
<ul>
<li><strong>Payroll:</strong> If the business manager handled payroll processing directly, the first pay cycle after their departure is a potential disaster. Errors, delays, or system access problems create legal exposure and staff crisis simultaneously.</li>
<li><strong>Audit compliance:</strong> If the loss happens near a fiscal year-end or during audit season, the district may be unable to produce requested documentation in the timeline required.</li>
<li><strong>Budget development:</strong> Without the business manager, the next year's budget process either stalls or is handed to someone who lacks the institutional knowledge to do it accurately.</li>
<li><strong>Vendor and banking relationships:</strong> Certain financial relationships are personally managed by the business manager. Access credentials, relationship context, and contractual details may not be documented anywhere accessible to a successor.</li>
</ul>
<h2>The Succession Planning Document Every District Should Have</h2>
<p>A basic succession planning document for a school business manager should include:</p>
<ul>
<li>An inventory of all financial systems, platforms, and access credentials (stored securely and updated annually)</li>
<li>A calendar of recurring financial obligations — payroll cycles, tax filings, state report due dates, audit timelines</li>
<li>A contact directory for all key vendor, banking, and regulatory relationships</li>
<li>A summary of current budget status, including any items in progress</li>
<li>A one-page operational overview sufficient for an interim to manage the first 30 days</li>
</ul>
<p>Latimore Life &amp; Legacy works specifically with educational institutions in Schuylkill, Luzerne, and Northumberland Counties. We understand the context — the regulatory environment, the community trust obligations, the board governance structure, and the particular risk profile of a district that operates on public funds.</p>`,
  },
]

const TRACK_COLOR: Record<Track, string> = {
  A: C.trackA,
  B: C.trackB,
  C: C.trackC,
}
const TRACK_BG: Record<Track, string> = {
  A: '#e8f1f8',
  B: '#e8f2ec',
  C: '#f2ebe5',
}

export default function BlogPage() {
  const [filter, setFilter] = useState<Filter>('all')
  const [modal, setModal] = useState<Article | null>(null)

  const visible = filter === 'all' ? ARTICLES : ARTICLES.filter(a => a.track === filter)

  const closeModal = () => setModal(null)

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;0,900;1,700&family=Source+Serif+4:ital,wght@0,300;0,400;0,600;1,300;1,400&family=DM+Mono:wght@400;500&display=swap');

        .blog-root { font-family:'Source Serif 4',Georgia,serif; background:${C.cream}; color:${C.ink}; font-size:17px; line-height:1.7; -webkit-font-smoothing:antialiased; min-height:100vh; }
        .blog-root *, .blog-root *::before, .blog-root *::after { box-sizing:border-box; margin:0; padding:0; }

        /* card animation */
        @keyframes fadeUp { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
        .blog-card { animation:fadeUp 0.4s ease forwards; opacity:0; }

        /* modal animation */
        @keyframes modalIn { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
        .blog-modal { animation:modalIn 0.25s ease; }

        /* modal body styles */
        .modal-prose h2 { font-family:'Playfair Display',serif; font-size:1.3rem; font-weight:700; color:${C.navy}; margin:2rem 0 0.875rem; border-left:3px solid ${C.gold}; padding-left:1rem; }
        .modal-prose h2:first-child { margin-top:0; }
        .modal-prose p { margin-bottom:1.25rem; color:${C.ink}; font-size:16px; line-height:1.8; }
        .modal-prose ul { margin:0.5rem 0 1.25rem 1.5rem; }
        .modal-prose li { margin-bottom:0.5rem; color:${C.ink}; font-size:16px; line-height:1.7; }
        .modal-prose strong { color:${C.navy}; }
      `}</style>

      <div className="blog-root">
        {/* ── Header ── */}
        <header style={{ background: C.navyDeep, borderBottom: `2px solid ${C.gold}`, padding: '0 2rem', position: 'sticky', top: 0, zIndex: 100 }}>
          <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 64, gap: '2rem' }}>
            <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 12, textDecoration: 'none' }}>
              <div style={{ width: 36, height: 36, background: C.gold, clipPath: 'polygon(50% 0%,100% 20%,100% 70%,50% 100%,0% 70%,0% 20%)', flexShrink: 0 }} />
              <div>
                <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 16, fontWeight: 700, color: C.white, lineHeight: 1.1 }}>Latimore Life &amp; Legacy</div>
                <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 9, color: C.gold, letterSpacing: '0.12em', textTransform: 'uppercase' }}>Protecting Today. Securing Tomorrow.</div>
              </div>
            </Link>
            <nav style={{ display: 'flex', gap: '1.75rem' }}>
              {[['/', 'Home'], ['/about', 'About'], ['/products', 'Products'], ['/contact', 'Contact']].map(([href, label]) => (
                <Link key={href} href={href} style={{ color: 'rgba(255,255,255,0.75)', textDecoration: 'none', fontSize: 13, fontFamily: "'DM Mono',monospace", letterSpacing: '0.06em', textTransform: 'uppercase' }}>{label}</Link>
              ))}
              <Link href="/blog" style={{ color: C.gold, textDecoration: 'none', fontSize: 13, fontFamily: "'DM Mono',monospace", letterSpacing: '0.06em', textTransform: 'uppercase' }}>Blog</Link>
            </nav>
            <a href="tel:7176152613" style={{ background: C.gold, color: C.navyDeep, fontFamily: "'DM Mono',monospace", fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 500, padding: '8px 16px', borderRadius: 2, textDecoration: 'none', whiteSpace: 'nowrap' }}>(717) 615-2613</a>
          </div>
        </header>

        {/* ── Hero ── */}
        <section style={{ background: C.navy, backgroundImage: `radial-gradient(ellipse at 80% 20%,rgba(196,154,108,0.12) 0%,transparent 60%),radial-gradient(ellipse at 10% 90%,rgba(196,154,108,0.08) 0%,transparent 50%)`, padding: '5rem 2rem 4rem', borderBottom: `1px solid rgba(196,154,108,0.25)`, overflow: 'hidden' }}>
          <div style={{ maxWidth: 1200, margin: '0 auto' }}>
            <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 11, letterSpacing: '0.18em', textTransform: 'uppercase', color: C.gold, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ display: 'block', width: 32, height: 1, background: C.gold }} />
              Financial Education · Coal Region PA
            </div>
            <h1 style={{ fontFamily: "'Playfair Display',serif", fontSize: 'clamp(2.5rem,5vw,4rem)', fontWeight: 900, color: C.white, lineHeight: 1.1, maxWidth: 680, marginBottom: '1.5rem' }}>
              Real talk on life insurance,<br />retirement, and <em style={{ color: C.gold, fontStyle: 'italic' }}>leaving something behind</em>.
            </h1>
            <p style={{ color: 'rgba(255,255,255,0.65)', maxWidth: 540, fontSize: 17, fontWeight: 300, marginBottom: '2.5rem', lineHeight: 1.8 }}>
              Plain-language guides written by Jackson Latimore — an independent broker and cardiac arrest survivor who understands exactly what's at stake when there's no plan in place.
            </p>
            <div style={{ display: 'flex', gap: '2.5rem', flexWrap: 'wrap', borderTop: `1px solid rgba(196,154,108,0.2)`, paddingTop: '2rem' }}>
              {[['12', 'Articles Published'], ['3', 'Audience Tracks'], ['3', 'Counties Served']].map(([n, l]) => (
                <div key={l}>
                  <div style={{ fontFamily: "'Playfair Display',serif", fontSize: '2.25rem', fontWeight: 700, color: C.gold, lineHeight: 1 }}>{n}</div>
                  <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.5)', marginTop: 4 }}>{l}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Main ── */}
        <main style={{ maxWidth: 1200, margin: '0 auto', padding: '3.5rem 2rem' }}>

          {/* Filter bar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: '3rem', paddingBottom: '1.5rem', borderBottom: `1px solid ${C.rule}` }}>
            <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', color: C.muted, marginRight: 4 }}>Filter by:</span>
            {([['all', 'All Articles'], ['A', 'Track A — Young Families'], ['B', 'Track B — Pre-Retirees'], ['C', 'Track C — School Districts']] as [Filter, string][]).map(([val, label]) => (
              <button key={val} onClick={() => setFilter(val)}
                style={{
                  fontFamily: "'DM Mono',monospace", fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase',
                  padding: '7px 16px', border: `1px solid ${filter === val ? (val === 'all' ? C.navy : TRACK_COLOR[val as Track]) : C.rule}`,
                  borderRadius: 2, cursor: 'pointer', transition: 'all 0.18s',
                  background: filter === val ? (val === 'all' ? C.navy : TRACK_COLOR[val as Track]) : C.white,
                  color: filter === val ? C.white : C.muted,
                }}
              >{label}</button>
            ))}
          </div>

          {/* Article grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(340px,1fr))', gap: '1.75rem' }}>
            {visible.map((a, i) => (
              <div key={a.id} className="blog-card" onClick={() => setModal(a)}
                style={{ background: C.white, border: `1px solid ${C.rule}`, borderRadius: 3, overflow: 'hidden', cursor: 'pointer', display: 'flex', flexDirection: 'column', animationDelay: `${i * 0.05}s` }}>
                <div style={{ height: 3, background: TRACK_COLOR[a.track] }} />
                <div style={{ padding: '1.5rem', flex: 1, display: 'flex', flexDirection: 'column' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: '0.875rem' }}>
                    <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 9, letterSpacing: '0.14em', textTransform: 'uppercase', padding: '3px 9px', borderRadius: 2, fontWeight: 500, background: TRACK_BG[a.track], color: TRACK_COLOR[a.track] }}>{a.trackLabel}</span>
                    <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 10, color: C.muted, letterSpacing: '0.06em' }}>{a.num}</span>
                    <span style={{ marginLeft: 'auto', fontFamily: "'DM Mono',monospace", fontSize: 8, letterSpacing: '0.1em', textTransform: 'uppercase', color: C.gold, background: C.goldPale, padding: '2px 7px', borderRadius: 20 }}>{a.kpi}</span>
                    {a.bilingual && <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase', background: '#e8f1f8', color: C.trackA, border: `1px solid #bdd4e8`, padding: '2px 8px', borderRadius: 20 }}>ES/EN</span>}
                  </div>
                  <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: '1.15rem', fontWeight: 700, color: C.navy, lineHeight: 1.35, marginBottom: '0.875rem', flex: 1 }}>{a.title}</h2>
                  <p style={{ fontSize: 14, color: C.muted, lineHeight: 1.65, marginBottom: '1.25rem' }}>{a.excerpt}</p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem 1.5rem', borderTop: `1px solid ${C.rule}`, background: C.cream }}>
                  <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 10, color: C.muted }}>{a.format}</span>
                  <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: C.navy, border: `1px solid ${C.navy}`, padding: '5px 12px', borderRadius: 2 }}>Read →</span>
                </div>
              </div>
            ))}
          </div>
        </main>

        {/* ── Author strip ── */}
        <div style={{ background: C.navyDeep, borderTop: `1px solid rgba(196,154,108,0.2)`, borderBottom: `1px solid rgba(196,154,108,0.2)`, padding: '3rem 2rem', margin: '2rem 0' }}>
          <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', alignItems: 'center', gap: '2.5rem', flexWrap: 'wrap' }}>
            <div style={{ width: 72, height: 72, borderRadius: '50%', background: C.gold, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontFamily: "'Playfair Display',serif", fontSize: '1.75rem', color: C.navyDeep, fontWeight: 900 }}>JL</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: "'Playfair Display',serif", fontSize: '1.25rem', fontWeight: 700, color: C.white }}>Jackson M. Latimore Sr.</div>
              <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: C.gold, margin: '4px 0 10px' }}>Founder &amp; CEO — Latimore Life &amp; Legacy LLC · Independent Insurance Broker · PA DOI #1268820</div>
              <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: 15, fontWeight: 300, lineHeight: 1.7, maxWidth: 600 }}>In December 2010, I collapsed on the basketball court at East Stroudsburg University's Koehler Fieldhouse. My heart stopped. An AED funded by the Gregory W. Moyer Defibrillator Fund brought me back. That question — what would have happened to the people who depended on me if I had not survived — drives everything I do.</p>
              <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 12, color: C.gold, marginTop: 8, display: 'block', letterSpacing: '0.08em' }}>#TheBeatGoesOn · Affiliated with Global Financial Impact (GFI)</span>
            </div>
          </div>
        </div>

        {/* ── Footer CTA ── */}
        <div style={{ background: C.goldPale, border: `1px solid ${C.goldBorder}`, borderRadius: 3, padding: '3rem', maxWidth: 1200, margin: '0 auto 3rem', textAlign: 'center' }}>
          <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 10, letterSpacing: '0.16em', textTransform: 'uppercase', color: C.gold, marginBottom: '0.875rem' }}>No cost. No pressure. Just clarity.</div>
          <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: '2rem', fontWeight: 700, color: C.navy, marginBottom: '1rem' }}>Ready to close the gap?</h2>
          <p style={{ color: C.muted, maxWidth: 500, margin: '0 auto 2rem', fontSize: 16 }}>Schedule a free 20-minute protection review. We look at what you have, what you owe, and what your family would actually need.</p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <a href="tel:7176152613" style={{ background: C.navy, color: C.white, fontFamily: "'DM Mono',monospace", fontSize: 12, letterSpacing: '0.1em', textTransform: 'uppercase', padding: '14px 28px', borderRadius: 2, textDecoration: 'none' }}>(717) 615-2613 — Call Now</a>
            <a href="mailto:jackson1989@latimorelegacy.com" style={{ background: 'transparent', color: C.navy, fontFamily: "'DM Mono',monospace", fontSize: 12, letterSpacing: '0.1em', textTransform: 'uppercase', padding: '13px 28px', borderRadius: 2, textDecoration: 'none', border: `1px solid ${C.navy}` }}>Email Jackson</a>
          </div>
        </div>

        {/* ── Site footer ── */}
        <footer style={{ background: C.navyDeep, borderTop: `2px solid ${C.gold}`, padding: '2rem', textAlign: 'center' }}>
          <div style={{ maxWidth: 1200, margin: '0 auto' }}>
            <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 12, color: C.gold, marginBottom: '0.75rem', letterSpacing: '0.08em' }}>#TheBeatGoesOn</div>
            <div style={{ display: 'flex', gap: '1.5rem', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '1rem' }}>
              {[['/', 'Home'], ['/blog', 'Blog'], ['tel:7176152613', '(717) 615-2613'], ['mailto:jackson1989@latimorelegacy.com', 'Email']].map(([href, label]) => (
                <a key={href} href={href} style={{ color: 'rgba(255,255,255,0.5)', fontFamily: "'DM Mono',monospace", fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', textDecoration: 'none' }}>{label}</a>
              ))}
            </div>
            <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', lineHeight: 1.6 }}>
              Latimore Life &amp; Legacy LLC · 1544 Route 61 Highway S, Suite 6104, Pottsville, PA 17901<br />
              PA DOI License #1268820 · NIPR #21638507 · Affiliated with Global Financial Impact<br />
              Content is for educational purposes only and does not constitute personalized financial or insurance advice.
            </p>
          </div>
        </footer>
      </div>

      {/* ── Article Modal ── */}
      {modal && (
        <div onClick={(e) => { if (e.target === e.currentTarget) closeModal() }}
          style={{ position: 'fixed', inset: 0, background: 'rgba(26,37,48,0.88)', zIndex: 200, overflowY: 'auto', padding: '2rem', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center' }}>
          <div className="blog-modal" style={{ background: C.white, maxWidth: 780, width: '100%', borderRadius: 3, overflow: 'hidden', position: 'relative', margin: 'auto' }}>
            {/* Modal header */}
            <div style={{ padding: '2.5rem 3rem 2rem', borderBottom: `1px solid ${C.rule}`, background: C.cream, position: 'relative' }}>
              <button onClick={closeModal} style={{ position: 'absolute', top: '1.25rem', right: '1.5rem', background: 'none', border: 'none', cursor: 'pointer', color: C.muted, fontSize: '1.5rem', lineHeight: 1, fontFamily: 'monospace' }}>✕</button>
              <div style={{ height: 2, width: 40, background: TRACK_COLOR[modal.track], marginBottom: '1rem' }} />
              <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', color: C.muted, marginBottom: '0.875rem' }}>
                Track {modal.track} — {modal.trackLabel} &nbsp;·&nbsp; Article {modal.num}
              </div>
              <h1 style={{ fontFamily: "'Playfair Display',serif", fontSize: '1.75rem', fontWeight: 700, color: C.navy, lineHeight: 1.25, marginBottom: '1rem' }}>{modal.title}</h1>
              <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
                <div style={{ fontSize: 13, color: C.muted, display: 'flex', gap: 5 }}>
                  <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 10, color: C.gold, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Format</span>
                  {modal.format}
                </div>
                <div style={{ fontSize: 13, color: C.muted, display: 'flex', gap: 5 }}>
                  <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 10, color: C.gold, textTransform: 'uppercase', letterSpacing: '0.1em' }}>KPI</span>
                  {modal.kpi}
                </div>
              </div>
            </div>
            {/* Modal body */}
            <div style={{ padding: '2.5rem 3rem' }}>
              <div className="modal-prose" dangerouslySetInnerHTML={{ __html: modal.body }} />
              {/* CTA box */}
              <div style={{ background: C.navy, color: C.white, padding: '2rem 2.5rem', borderRadius: 3, marginTop: '2.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1.5rem', flexWrap: 'wrap' }}>
                <div style={{ fontSize: 17, fontWeight: 300, flex: 1 }}>
                  <strong style={{ display: 'block', fontSize: '1.1rem', fontWeight: 600, marginBottom: 4, color: C.white }}>{modal.cta}</strong>
                  No cost. No pressure. Just clarity.
                </div>
                <a href="tel:7176152613" style={{ background: C.gold, color: C.navyDeep, fontFamily: "'DM Mono',monospace", fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', padding: '12px 24px', borderRadius: 2, textDecoration: 'none', fontWeight: 500, whiteSpace: 'nowrap' }}>(717) 615-2613</a>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
