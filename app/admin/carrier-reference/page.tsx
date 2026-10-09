import Link from 'next/link'

export const metadata = { title: 'Carrier Verification | Latimore Hub' }

const carriers = [
 {name:'Ethos',source:'S7 S27',note:'Distributor, not necessarily policy issuer. Issuing carrier varies by quote.',products:['Level Term Life','Simplified Issue Term','Simplified Issue Whole Life','Guaranteed Acceptance Whole Life','Ethos IUL (reverify)']},
 {name:'North American',source:'S8',note:'Builder Plus IUL 4 supersedes Builder Plus IUL 2; post-freeze term rates excluded.',products:['ADDvantage Term','Builder Plus IUL 4','Smart Builder IUL 3 (reverify)','Custom Guarantee UL','IncomeChoice 10 / PrimePath Pro']},
 {name:'American Equity',source:'S9',note:'FIA income and accumulation lanes. Bonuses, rider costs and indexed-crediting terms require dated approval.',products:['IncomeShield (incl. BONUS 10)','EstateShield','AssetShield']},
 {name:'Foresters',source:'S10 S26',note:'Live Well Plus is U.S. participating whole life, NOT term. Dividends not guaranteed.',products:['Strong Foundation Term','Your Term','Live Well Plus — participating whole life','Advantage Plus II','PlanRight','BrightFuture']},
 {name:'F&G',source:'S11',note:'Check the F&G Pennsylvania state-availability report and GFI contracting. Everlast/Dynamic Accumulator excluded.',products:['Pathsetter IUL','Safe Income Advantage','F&G 1-2-3','Flex Accumulator','Prosperity Elite 10','Guarantee-Platinum MYGA 3/5/7']},
 {name:'Corebridge',source:'S12 S28',note:'Select-a-Term (pure protection) and QoL Flex Term (living benefits) are distinct. Securities excluded.',products:['Select-a-Term','QoL Flex Term','Value+ Protector III / Max Accumulator+ III','Secure Lifetime GUL 3','Pathway Choice / Assured Edge Income Builder']},
]
const fourTrainingProducts=['Level Term Life','ADDvantage Term','Strong Foundation Term','QoL Flex Term']
const legacy=[
 ['North American','Builder Plus IUL 2','Superseded by version 4'],
 ['F&G','Everlast','Not current in September 2026 official product research'],
 ['F&G','Dynamic Accumulator','Older documentation, not verified current'],
 ['Corebridge','MarketLock RILA / Polaris / VUL','Securities licensing; historical VULs may no longer be sold'],
]
const links=[
 ['S7','Ethos','https://www.ethos.com/agents/faq/what-life-insurance-product-does-ethos-offer/'],
 ['S8','North American','https://www.northamericancompany.com/'],
 ['S9','American Equity','https://www.american-equity.com/IncomeShield'],
 ['S10','Foresters Live Well Plus','https://www.foresters.com/en/life-insurance/whole-life-insurance/foresters-live-well-plus'],
 ['S11','F&G','https://success.fglife.com/annuities'],
 ['S12','Corebridge','https://www.corebridgefinancial.com/'],
]
export default function CarrierReferencePage() {
 const total=carriers.reduce((n,c)=>n+c.products.length,0)+legacy.length
 return <main className="mx-auto max-w-7xl space-y-6 px-4 py-8 text-slate-100">
  <Link href="/admin" className="text-sm text-[#C49A6C] underline">← Admin</Link>
  <h1 className="text-3xl font-bold">Carrier verification register</h1>
  <p className="max-w-5xl text-sm text-slate-300">
   Internal research register, updated October 9, 2026. Sources: 53-page September 28 carrier manuscript
   (original evidence freeze September 26), carrier-issued materials, and earlier reference sheets.
   {total} product/reference entries. No product here is certified fully cleared for current Pennsylvania sale.
  </p>
  <p className="rounded-lg border border-amber-500 bg-amber-900/20 p-4 text-sm text-amber-100">
   RELEASE GATE: verify current PA-approved form, individual appointment, product-level GFI access,
   issuing company, state-specific features, and current approved quote/illustration before marketing or selling.
   Historical "Active" lists and GFI contractor affiliation alone do not establish product authorization.
  </p>
  {carriers.map(group=><section key={group.name} className="rounded-xl border border-slate-700 bg-slate-900 p-5">
   <h2 className="text-xl font-bold text-[#C49A6C]">{group.name} <span className="text-sm text-slate-400">({group.source})</span></h2>
   <p className="my-3 text-sm text-slate-300">{group.note}</p>
   <div className="overflow-x-auto"><table className="w-full min-w-[700px] text-left text-sm">
    <thead><tr className="border-b border-slate-700 text-slate-400">
     <th className="py-2">Product/reference</th><th>Review status</th><th>PA approval</th><th>GFI evidence</th>
    </tr></thead>
    <tbody>{group.products.map(product=><tr key={product} className="border-b border-slate-800">
     <td className="py-2 pr-3">{product}</td>
     <td className="py-2 pr-3 text-amber-300">{product.includes('reverify')?'REVERIFY':fourTrainingProducts.includes(product)||product==='Select-a-Term'?'CONDITIONAL':'GATED'}</td>
     <td className="py-2 pr-3">Current PA form not verified</td>
     <td className="py-2 pr-3">{fourTrainingProducts.includes(product)?'Term-training reference; appointment pending':'Product-level access not verified'}</td>
    </tr>)}</tbody>
   </table></div>
  </section>)}
  <section className="rounded-xl border border-slate-700 bg-slate-900 p-5">
   <h2 className="text-xl font-bold">Excluded / archive only</h2>
   <ul className="mt-3 space-y-2 text-sm">{legacy.map(([carrier,name,reason])=><li key={name}><b>{carrier}: {name}</b> — {reason}</li>)}</ul>
   <p className="mt-4 text-sm text-amber-300">Conflict: the manuscript calls the primary lane four term products while naming five distinct offerings. Corebridge Select-a-Term has a product page, but that does not verify GFI-specific access.</p>
  </section>
  <section className="rounded-xl border border-slate-700 bg-slate-900 p-5">
   <h2 className="text-xl font-bold">Public source URLs</h2>
   <ul className="mt-3 space-y-2 text-sm">{links.map(([id,label,url])=><li key={id}>{id} — <a className="text-[#C49A6C] underline" href={url} target="_blank" rel="noopener noreferrer">{label}</a></li>)}</ul>
   <p className="mt-4 text-xs text-slate-400">S6, S24 and S26–S28 are internal GFI/carrier research references, not proof of individual current PA contracting. Do not extrapolate historical rates, guarantee returns, or claim tax-free policy income without conditions.</p>
  </section>
 </main>
}
