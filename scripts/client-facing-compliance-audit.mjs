#!/usr/bin/env node
/**
 * Client-facing LIVE audit: GETs actual published URLs, checks source links,
 * copy-risk indicators, PDFs and image metadata; records per-URL SHA-256
 * snapshots and changes from the prior run. Never submits a form or reads PII.
 * Assessment: triage evidence only; not legal or carrier approval.
 */
import { createHash } from 'node:crypto'
import { readFile, writeFile, mkdir } from 'node:fs/promises'
import { spawnSync } from 'node:child_process'
import { URL } from 'node:url'

const BASE = new URL(process.env.AUDIT_BASE_URL || 'https://www.latimorelifelegacy.com')
const MAX = Math.min(1400, Math.max(20, Number(process.env.AUDIT_MAX_PAGES || 600)))
const TIMEOUT = 16000
const outFile = process.env.AUDIT_OUTPUT || 'audit-run.json'
const oldFile = process.env.AUDIT_PREVIOUS || ''
const now = new Date().toISOString()
const allowHost = host => host === BASE.hostname || host === 'latimorelifelegacy.com'
const categories = { webpage:[],pdf:[],image:[] }
const findings = []
const failures = []
const backlog = []
const queued = []
const queuedSet = new Set()
const visited = new Set()
const statuses = {}
let previous = {}
try { if(oldFile) previous = JSON.parse(await readFile(oldFile,'utf8')) } catch {}
const oldHashes = previous.hashes || {}
const hashes = {}
const contentChanges = []
let discoveryOk = false
let sitemapCount = 0
let contentPages = 0
let pdfScanned = 0
let checkedImageAssets = 0

function finding(url,code,severity,message,evidence='',source='') {
  findings.push({url,code,severity,message,evidence: String(evidence).slice(0,450),standard:source})
}
const ruleRefs = {
  false_claim:'https://www.pacodeandbulletin.gov/secure/pacode/data/031/chapter51/s51.21.html',
  misleading:'https://www.pacodeandbulletin.gov/secure/pacode/data/031/chapter51/s51.22.html',
  disclosure:'https://www.pacodeandbulletin.gov/secure/pacode/data/031/chapter83/subchapAtoc.html'
}
const sha = bytes => createHash('sha256').update(bytes).digest('hex')
const textOnly = html => html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,' ').replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi,' ').replace(/<svg\b[^>]*>[\s\S]*?<\/svg>/gi,' ').replace(/<[^>]+>/g,' ').replace(/&(?:amp|nbsp|quot|apos|#39);/gi,' ').replace(/\s+/g,' ').trim()
function normalize(url,from=BASE.href) {
 try {
  const u=new URL(url,from)
  if (!['https:','http:'].includes(u.protocol) || !allowHost(u.hostname)) return null
  u.hash='';u.search=''
  if (/^\/(admin|api|_next|login|auth|thank-you)(\/|$)/.test(u.pathname)) return null
  if (/\/(?:feed|rss|robots\.txt)$/.test(u.pathname)) return null
  return u.href
 }catch{return null}
}
function queue(raw,from) {
 const u=normalize(raw,from)
 if(!u||queuedSet.has(u)||queuedSet.size>=MAX) return
 if(/\.(png|jpe?g|webp|gif|svg|ico|avif|css|js|zip|woff2?|mp4)$/i.test(new URL(u).pathname))return
 queued.push(u);queuedSet.add(u)
}
function attrs(tag) {
 const o={}
 for(const m of tag.matchAll(/([\w:-]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/g))o[m[1].toLowerCase()]=m[2]??m[3]??m[4]??''
 return o
}
async function fetchPublic(url) {
 const ctrl=new AbortController();const timer=setTimeout(()=>ctrl.abort(),TIMEOUT)
 try {
  const res=await fetch(url,{signal:ctrl.signal,redirect:'follow',headers:{'user-agent':'LatimoreClientFacingAudit/1.0 (owner-operated compliance monitoring)','accept':'text/html,application/pdf,text/xml,*/*'}})
  if(!allowHost(new URL(res.url).hostname))throw new Error('unexpected_redirect_offsite')
  const buff=Buffer.from(await res.arrayBuffer())
  if(buff.length>12_000_000)throw new Error('asset_over_12mb')
  return {status:res.status,type:res.headers.get('content-type')||'',body:buff,final:res.url}
 }finally{clearTimeout(timer)}
}
const sitemapUrls=[new URL('/sitemap.xml',BASE).href]
for (let i=0;i<sitemapUrls.length && i<12;i++) {
 const u=sitemapUrls[i]
 try {
  const r=await fetchPublic(u)
  if (r.status!==200) { failures.push({url:u,error:'sitemap HTTP '+r.status});continue }
  const xml=r.body.toString('utf8')
  const locs=[...xml.matchAll(/<loc>\s*([^<]+)\s*<\/loc>/gi)].map(m=>m[1].replace(/&amp;/g,'&'))
  if(!locs.length){failures.push({url:u,error:'sitemap contained no URLs'});continue}
  discoveryOk=true
  for(const loc of locs) {if(/\.xml(?:$|\?)/i.test(loc))sitemapUrls.push(loc);else{queue(loc);sitemapCount++}}
 }catch(e){failures.push({url:u,error:String(e).slice(0,200)})}
}
if(!discoveryOk)finding(BASE.href,'SITEMAP_UNAVAILABLE','HIGH','Website sitemap could not be verified; audit coverage is incomplete.','Sitemap discovery failed.')
queue(BASE.href);for(const route of ['/products','/services','/about','/contact','/book','/pahs','/blog','/education','/schuylkill','/faq','/legacy-checkup'])queue(route,BASE.href)
const pages=[]
const pdfUrls=new Set(), imageUrls=new Map(), sourceLinks=new Set()
for(let i=0;i<queued.length && i<MAX;i++) {
 const url=queued[i];if(visited.has(url))continue
 visited.add(url)
 try {
  const response=await fetchPublic(url);statuses[url]={status:response.status,contentType:response.type}
  if(response.status!==200){finding(url,'HTTP_ERROR','HIGH','Published page could not be loaded','HTTP '+response.status);continue}
  if(/\.pdf$/i.test(new URL(url).pathname)||/application\/pdf/.test(response.type)){pdfUrls.add(url);continue}
  if(!/html/i.test(response.type)){finding(url,'UNEXPECTED_CONTENT_TYPE','MEDIUM','Page response not HTML or PDF',response.type);continue}
  contentPages++;const html=response.body.toString('utf8')
  const plain=textOnly(html)
  // Fingerprint what a visitor reads and can click, not volatile Next.js
  // hydration/build scripts and transient server-rendered attributes.
  const hrefs=[...html.matchAll(/<a\b[^>]*\bhref\s*=\s*["']([^"']+)["']/gi)].map(m=>m[1].replace(/&amp;/g,'&')).sort()
  const h=sha(Buffer.from(plain+'\nLINKS:'+hrefs.join('|')))
  hashes[url]=h
  if(previous.fingerprintMode==='VISIBLE_TEXT_AND_LINKS_V2'&&oldHashes[url]&&oldHashes[url]!==h)contentChanges.push({url,previous:oldHashes[url],current:h})
  const hasSourceLink=/href\s*=\s*["'][^"']*(?:census\.gov|bls\.gov|fred\.stlouisfed\.org|pa\.gov|pacodeandbulletin\.gov|limra\.com|naic\.org|doi\.pa\.gov)[^"']*["']/i.test(html)
  const claims=(plain.match(/\b\d[\d,]*(?:\.\d+)?\s*(?:%|percent|residents|households|employees|per\s+100,000|million)\b/gi)||[]).slice(0,10)
  if(claims.length&&!hasSourceLink)finding(url,'NUMERIC_CLAIMS_UNSOURCED','HIGH','Numeric claims are displayed without an authoritative public source link on the page.',claims.join(' | '),ruleRefs.false_claim)
  if(!/\b(Schuylkill|Pottsville|Coal Region|Frackville|Shenandoah|Hazleton|Luzerne|Northumberland|Pennsylvania)\b/i.test(plain))finding(url,'LOCALIZATION_NOT_EVIDENT','MEDIUM','No clear local Pennsylvania/Schuylkill context detected in published text.','',ruleRefs.false_claim)
  const risks=[
   [/\b(?:guaranteed approval|guaranteed acceptance|100% approval|zero downside risk|never lose money|risk[- ]free)\b/i,'ABSOLUTE_PRODUCT_CLAIM','HIGH'],
   [/\b(?:maximum protection[.! ]+minimum cost|best rates|lowest cost|no cost for any rider)\b/i,'UNQUALIFIED_SUPERLATIVE','HIGH'],
   [/\b(?:tax[- ]free retirement|tax[- ]free income|completely tax[- ]free|tax[- ]free growth)\b/i,'TAX_TREATMENT_REVIEW','HIGH'],
   [/\b(?:coming soon|lorem ipsum|your (?:company|name) here|insert (?:text|link|source)|placeholder|TBD|TODO|ID#2777749)\b/i,'PUBLIC_PLACEHOLDER','HIGH'],
   [/\b(?:no medical exam|instant approval|approved in minutes|same[- ]day coverage)\b/i,'UNDERWRITING_CLAIM_REVIEW','MEDIUM'],
   [/\b(?:no surrender charges|no fees|zero fees|never expires)\b/i,'CONTRACT_LIMITATIONS_REVIEW','MEDIUM'],
  ]
  for(const [regex,code,severity] of risks) {const m=plain.match(regex);if(m)finding(url,code,severity,'Published wording requires insurer-approved context and material qualifications.',plain.slice(Math.max(0,(m.index||0)-90),(m.index||0)+150),ruleRefs.misleading)}
  const imgTags=[...html.matchAll(/<img\b[^>]*>/gi)]
  for(const tag of imgTags){
   const a=attrs(tag[0]); const asset=a.src||a['data-src']||''
   if(!a.alt||!a.alt.trim())finding(url,'IMAGE_ALT_MISSING','LOW','Rendered image missing descriptive alt text.',asset)
   if(asset && !/^data:/.test(asset)){
    // Image endpoints often use Next.js /_next/image?url=..., which page normalization intentionally excludes.
    // Audit the actual rendered endpoint and preserve its sizing query.
    let full=null
    try {
      const u=new URL(asset.replace(/&amp;/g,'&'),url)
      if(allowHost(u.hostname) && ['http:','https:'].includes(u.protocol))full=u.href
    }catch{}
    if(full)imageUrls.set(full,{page:url,alt:a.alt||''})
   }
  }
  let outboundPublicSourceLinks=0
  for(const link of html.matchAll(/<a\b[^>]*>/gi)){
   const a=attrs(link[0]);const raw=a.href||''
   if(raw.startsWith('mailto:')||raw.startsWith('tel:')||raw.startsWith('#'))continue
   try{
    const target=new URL(raw,url);if(/\.pdf(?:$|\?)/i.test(target.pathname)){if(allowHost(target.hostname))pdfUrls.add(target.href)}
    else if(allowHost(target.hostname)&&target.origin===BASE.origin)queue(target.href)
    else if(/(?:gov|edu)$/.test(target.hostname.split('.').slice(-1)[0])||/(fred.stlouisfed.org|limra.com|naic.org)/.test(target.hostname)){outboundPublicSourceLinks++;sourceLinks.add(target.href)}
   }catch{}
  }
  pages.push({url,hash:h,bytes:response.body.length,title:(html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)||[])[1]?.replace(/\s+/g,' ').trim()||'',textLength:plain.length,numericClaims:claims,publicSourceLinks:outboundPublicSourceLinks,images:imgTags.length})
 }catch(e){const err=String(e).slice(0,230);failures.push({url,error:err});finding(url,'FETCH_FAILED','HIGH','Cannot establish published content from live website.',err)}
}
// Check public evidence LINKS themselves, not just the presence of something that looks like a citation.
const checkedSources=[]
for(const u of [...sourceLinks].slice(0,120)){
 const ctrl=new AbortController();const t=setTimeout(()=>ctrl.abort(),12000)
 try {
  const response=await fetch(u,{method:'HEAD',redirect:'follow',signal:ctrl.signal,headers:{'user-agent':'LatimoreOwnerContentComplianceAudit/1.0'}})
  checkedSources.push({url:u,status:response.status})
  if(response.status===404||response.status===410)finding(u,'SOURCE_LINK_BROKEN','HIGH','Authoritative public source link returns a missing-page status.','HTTP '+response.status)
  else if(response.status>=400)finding(u,'SOURCE_LINK_UNVERIFIED','MEDIUM','Source did not respond successfully to HEAD; may require manual browser validation.','HTTP '+response.status)
 }catch(e){checkedSources.push({url:u,status:'unverified'});finding(u,'SOURCE_LINK_UNVERIFIED','MEDIUM','Could not independently confirm the public source URL.',String(e).slice(0,130))}
 finally {clearTimeout(t)}
}
if(sourceLinks.size>120)finding(BASE.href,'SOURCE_LINK_CHECK_LIMIT','MEDIUM','Public source URLs exceeded the per-run check limit.',String(sourceLinks.size))
for(const url of [...pdfUrls].slice(0,200)){
 if(hashes[url])continue
 try{
  const r=await fetchPublic(url);statuses[url]={status:r.status,contentType:r.type}
  if(r.status!==200) {finding(url,'PDF_UNAVAILABLE','HIGH','Linked client-facing PDF could not be retrieved','HTTP '+r.status);continue}
  const h=sha(r.body);hashes[url]=h;pdfScanned++
  if(oldHashes[url]&&oldHashes[url]!==h)contentChanges.push({url,previous:oldHashes[url],current:h})
  const p=spawnSync('pdftotext',['-','-'],{input:r.body,encoding:'utf8',timeout:8000,maxBuffer:10*1024*1024})
  if(p.error||p.status!==0||!p.stdout?.trim()){
   finding(url,'PDF_TEXT_NOT_REVIEWED','HIGH','Live client-facing PDF needs manual/full-content review; extraction unavailable.',String(p.stderr||p.error||'').slice(0,120))
  }else {
   const tx=p.stdout.replace(/\s+/g,' ')
   if(/\b(lorem ipsum|coming soon|placeholder|TBD|ID#2777749)\b/i.test(tx))finding(url,'PDF_PUBLIC_PLACEHOLDER','HIGH','Public PDF contains unresolved draft copy.',tx.match(/\b(lorem ipsum|coming soon|placeholder|TBD|ID#2777749)\b/i)?.[0])
   if(/\b(tax[- ]free retirement|never lose money|guaranteed approval|no risk)\b/i.test(tx))finding(url,'PDF_PRODUCT_CLAIM_REVIEW','HIGH','Public PDF contains an absolute or tax claim requiring approval.')
   if(!/\b(Schuylkill|Pottsville|Coal Region|Pennsylvania)\b/i.test(tx))finding(url,'PDF_LOCALIZATION_REVIEW','MEDIUM','Public PDF lacks detectable local service-area context.')
  }
  categories.pdf.push({url,hash:h,bytes:r.body.length,extractable:Boolean(p.stdout?.trim())})
 }catch(e){finding(url,'PDF_FETCH_FAILED','HIGH','PDF retrieval or inspection failed.',String(e).slice(0,120))}
}
for(const [url,info] of [...imageUrls].slice(0,500)){
 try{
  const r=await fetchPublic(url)
  if(r.status!==200){finding(info.page,'IMAGE_UNAVAILABLE','HIGH','Image displayed by page is not retrievable',url+' HTTP '+r.status);continue}
  const h=sha(r.body);hashes[url]=h;checkedImageAssets++
  if(oldHashes[url]!==h){contentChanges.push({url,previous:oldHashes[url]||null,current:h});finding(info.page,'IMAGE_VISUAL_REVIEW_REQUIRED','MEDIUM','New or changed client-facing graphic requires human visual/content review.',url)}
 }catch(e){finding(info.page,'IMAGE_FETCH_FAILED','MEDIUM','Image inspection could not verify asset availability.',url)}
}
const covered=['Live website: sitemap + discovered HTML','On-domain downloadable PDFs','On-domain images: reachability + SHA + alt (visual verification pending)']
const missing=[
 'Facebook Page posts and attached graphics: authenticated content export/connector not configured',
 'Instagram @latimorelifelegacy25 posts/reels/stories: authenticated export/connector not configured',
 'Google Business Profile posts, products, photos: authenticated API/export not configured',
 'LinkedIn posts: authenticated API/export not configured',
 'OneUp/other scheduled social queue: no authenticated feed',
 'Outbound email/SMS/WhatsApp marketing templates: no complete client-facing inventory',
 'Printed PAHS signage, flyers, stadium displays and handed-out materials: no verified distribution/evidence register',
 'Third-party carrier-hosted/co-branded quote/booking screens: require approved integration or manual review'
]
const counts={};for(const f of findings)counts[f.code]=(counts[f.code]||0)+1
const high=findings.filter(f=>f.severity==='HIGH')
const newHigh=high.filter(f=>!((previous.findings||[]).some(p=>p.url===f.url&&p.code===f.code&&p.evidence===f.evidence)))
const resolved=(previous.findings||[]).filter(p=>p.severity==='HIGH'&&!high.some(f=>f.url===p.url&&f.code===p.code))
const result={
 schema:2,fingerprintMode:'VISIBLE_TEXT_AND_LINKS_V2',at:now,base:BASE.href,sitemapDiscovered:sitemapCount,discoveryOk,
 observed:{webPages:contentPages,pdfs:pdfScanned,images:checkedImageAssets,sourceLinksChecked:checkedSources.length,urlsWithHash:Object.keys(hashes).length,failedRequests:failures.length,highFindings:high.length,newHighFindings:newHigh.length,changes:contentChanges.length},
 coverage:{covered,notCovered:missing,status: missing.length||!discoveryOk?'INCOMPLETE':'COMPLETE'},
 findings,failures,changes:contentChanges,newHigh,resolved,hashes,pages,pdfs:categories.pdf,sourceLinks:checkedSources,standards:ruleRefs
}
await mkdir(new URL('.', 'file://'+process.cwd()+'/'+outFile).pathname,{recursive:true}).catch(()=>{})
await writeFile(outFile,JSON.stringify(result,null,2))
const summary={
 generatedAt:now,base:BASE.href,coverage:result.coverage.status,
 observed:result.observed,topHigh:newHigh.slice(0,15),uncoveredChannels:missing
}
await writeFile(outFile.replace(/\.json$/,'-summary.json'),JSON.stringify(summary,null,2))
console.log(JSON.stringify(summary,null,2))
process.exitCode=(!discoveryOk || failures.length>0 || high.length>0)?1:0
