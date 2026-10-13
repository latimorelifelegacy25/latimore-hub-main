# Blog and tracking audit — October 10, 2026

Base: `0d2b19d37447c95caf5d133177a7d302f341f0d4`. Branch: `claude/audit-fix-20261010-2013`. Source changes only; not deployed or live-verified.

## Changes

- Rewrote 20 long descriptions to at most 160 characters. Excerpts are preserved. The canonical page already truncated metadata; this fixes source copy as well.
- Kept `does-your-family-have-protection` published and marked `family-protection-bilingual` draft. Its body is preserved.
- Qualified the seven identified whole life, final expense, guaranteed issue, juvenile IUL, and retirement IUL claims. Added primary references for policy terms. Additional unreviewed claims are not cleared by this change.
- Corrected income figures and labels in eight articles using inspected Census QuickFacts: 2020–2024 household median $68,313; per-capita income $34,954 (2024 dollars). Prior $69,320/$36,166 values and median-individual labels were inconsistent with the linked QuickFacts measure. Replaced age-65+ shares in two articles with current QuickFacts shares of 23.0% county and 21.4% Pennsylvania.
- Replaced generic NFDA media-center links with the specific 2023 price-study release and secondary annuity-sales links with LIMRA's March 23, 2026 release.
- Corrected legacy component analytics to `/blog/<slug>`; legacy pages reuse the canonical renderer/metadata. Blog redirects explicitly use HTTP 301. RSS remains intentionally at `/education/blog/rss.xml` with a matching self-link and canonical `/blog` article links.
- GBP/Facebook/Instagram/LinkedIn explicit linkUrl publishing uses platform-specific `/t/<slug>` links in direct and stored-post flows, including the legacy Facebook asset path. Caption copies of linkUrl are replaced. Instagram caption links are not clickable in the feed. Twitter and arbitrary URLs embedded only in caption text remain outside this change. No messages or social posts were published.

## Verification

- npm ci: passed; postinstall generated Prisma. Separate npx prisma generate: passed.
- npx tsc --noEmit: passed after correcting a legacy page re-export (final rerun recorded before commit).
- npm run lint: 0 errors, 62 existing warnings. Final touched-file lint rerun recorded before commit.
- Tracking/OneUp tests: 19 passed using node --import tsx --test (tsx CLI itself cannot create an IPC socket in this environment).
- EVENT_MAP: every mapped value exists in Prisma EventType, and every EventType normalizes to itself. EventIngestSchema accepts valid events and rejects invalid event names/unknown fields; route uses safeParse, rateLimit, and getExcludedTrafficReason.
- Existing GA4 gtag event calls and internal/webdriver exclusions retained.
- Live /blog: 200. Live college-funding article: 200 with canonical https://www.latimorelifelegacy.com/blog/college-funding-iul-million-dollar-baby. Legacy term article: 308 to /blog/term-vs-whole-life-vs-iul before deployment. Local config now specifies 301.
- No database ingestion test, full production build, exhaustive live canonical crawl, or post-deployment redirect check performed.

## Verified public source crosswalk

| Source | Verified scope |
| --- | --- |
| [Census county QuickFacts](https://www.census.gov/quickfacts/schuylkillcountypennsylvania) | Household median, per-capita income, 76.1% owner-occupied housing rate (2020–2024), population/age shares shown on page |
| [Census Pennsylvania QuickFacts](https://www.census.gov/quickfacts/fact/table/PA/SBO001223) | $77,971 household median; county income gap calculation rounds to 12.4%; age-65+ share |
| [College Board 2025 highlights](https://research.collegeboard.org/trends/college-pricing/highlights) | 2025–26 annual tuition/fees: $11,950 public in-state and $45,000 private nonprofit; not total four-year cost |
| [NFDA 2023 release](https://content.nfda.org/news/media-center/nfda-news-releases/id/8134/2023-nfda-general-price-list-study-shows-inflation-increasing-faster-than-the-cost-of-a-funeral) | National medians $8,300 burial and $6,280 cremation; cemetery and other exclusions |
| [LIMRA final 2025 sales](https://www.limra.com/en/newsroom/news-releases/2026/limra-final-u.s.-retail-annuity-sales-set-new-sales-high-totaling-%24464.1-billion-in-2025/) | $464.1 billion total annuity sales and 7% annual growth; not 4.8% household ownership |
| [NAIC buyer's guide](https://content.naic.org/sites/default/files/publication-lig-lp-consumer-life.pdf) | Whole/universal life funding conditions and guaranteed versus non-guaranteed features |
| [Gerber guaranteed issue](https://www.gerberlife.com/learn/what-is-guaranteed-life-insurance) | Example eligibility, payment requirements, and graded benefits; not a guarantee for every carrier |
| [North American IUL explanation](https://www.northamericancompany.com/videos-life-iul-life-insurance-more-than-you-expect) | Index-linked interest rather than direct market participation; actual policy terms still govern |
| [26 U.S.C. §72](https://www.govinfo.gov/content/pkg/USCODE-2024-title26/html/USCODE-2024-title26-subtitleA-chap1-subchapB-partII-sec72.htm) | Distribution and MEC rules; not individualized tax advice |

## Author expansion queue

The baseline had 16 non-draft files below 600 words using the repository reading-time tokenizer (including aliases redirected by configuration). The initial note counted 14; both counts are retained here because publication/redirect filtering differs. Below are the 14 remaining non-draft source files below 600 after these edits. References/disclosures are included in this count and do not substitute for substantive expansion. No article was padded to reach a length threshold.

| File | Words |
| --- | --- |
| does-your-family-have-protection.mdx | 429 |
| financial-literacy-101-foundation.mdx | 421 |
| five-financial-moves-putting-off.mdx | 429 |
| gregory-w-moyer-story.mdx | 484 |
| how-to-leave-something-behind.mdx | 482 |
| protecting-skook-families-living-benefits-schuylkill.mdx | 553 |
| school-district-superintendent-dies.mdx | 403 |
| schuylkill-county-final-expense-burden.mdx | 512 |
| securing-coal-region-term-living-benefits-schuylkill.mdx | 542 |
| succession-planning-school-business-managers.mdx | 393 |
| term-vs-whole-life-vs-iul.mdx | 516 |
| what-happens-family-mortgage.mdx | 526 |
| why-living-benefits-matter-schuylkill-county.mdx | 511 |
| will-you-outlive-your-money.mdx | 419 |

### Baseline short-file counts

- does-your-family-have-protection.mdx: 429
- family-protection-bilingual.mdx: 399
- financial-literacy-101-foundation.mdx: 421
- five-financial-moves-putting-off.mdx: 429
- gregory-w-moyer-story.mdx: 484
- how-to-leave-something-behind.mdx: 436
- living-benefits-insurance-schuylkill-county.mdx: 580
- protecting-skook-families-living-benefits-schuylkill.mdx: 553
- school-district-superintendent-dies.mdx: 403
- schuylkill-county-final-expense-burden.mdx: 512
- securing-coal-region-term-living-benefits-schuylkill.mdx: 542
- succession-planning-school-business-managers.mdx: 393
- term-vs-whole-life-vs-iul.mdx: 516
- what-happens-family-mortgage.mdx: 526
- why-living-benefits-matter-schuylkill-county.mdx: 511
- will-you-outlive-your-money.mdx: 419

### Baseline long-description counts

- 401k-retirement-risk-asset-protection.mdx: 196
- annuities-game-changer-schuylkill-retirees.mdx: 194
- beyond-death-benefit-modern-life-insurance-schuylkill.mdx: 215
- building-generational-bridges-juvenile-iul-schuylkill.mdx: 162
- business-insurance-gaps-three-risks.mdx: 204
- college-funding-iul-million-dollar-baby.mdx: 223
- final-expense-insurance-senior-planning.mdx: 210
- infinite-banking-concept-whole-life.mdx: 189
- iul-market-volatility-schuylkill-county.mdx: 163
- latimore-content-repository-operating-system.mdx: 162
- living-benefits-insurance-schuylkill-county.mdx: 175
- mortgage-protection-home-security.mdx: 203
- protecting-skook-families-living-benefits-schuylkill.mdx: 171
- protecting-the-skook-juvenile-iul-financial-fortress.mdx: 167
- protecting-what-matters-most-schuylkill.mdx: 183
- securing-coal-region-retirements-iul-schuylkill.mdx: 187
- securing-coal-region-term-living-benefits-schuylkill.mdx: 178
- serious-health-issues-living-benefits-schuylkill-county.mdx: 187
- term-life-living-benefits-schuylkill.mdx: 210
- why-schuylkill-county-families-need-life-insurance-now.mdx: 194

## Remaining source review

Check 5 is PARTIAL. The companion JSON inventories every numeric candidate line in non-draft content, with inline source links when present. Candidate detection includes policy limits, examples, and figures; it is not a list of proven errors. Only the source crosswalk above is verified. Still review the 43.7 median-age source/year, mortality/health figures including 977.4/820.6, 4.8% annuity ownership, 529 comparisons, policy-specific benefit claims, and any numerical examples without matching evidence. A link alone does not validate a claim. Existing authored narrative and figures outside the verified edits are retained for review.
