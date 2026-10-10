#!/usr/bin/env node
/**
 * Proposes actual textual corrections and applies a small allowlisted set of
 * evidence-independent, legally conservative copy edits to the checked-out
 * website source. No invented sources, product approval or auto-publication.
 *
 * Outputs JSON manifest: patches with before/after and proof, plus open items.
 */
import { readFile, writeFile, readdir, stat, mkdir } from 'node:fs/promises'
import { join, relative, dirname } from 'node:path'
const auditPath=process.argv[2]||'audit-output/current.json'
const manifestPath=process.argv[3]||'audit-output/corrections.json'
const audit=JSON.parse(await readFile(auditPath,'utf8'))
const root=process.cwd()
const files=[]
const ignore=new Set(['.git','.next','node_modules','dist','build','coverage','.vercel','.turbo','public','admin','api','_components','_lib','__tests__'])
async function walk(base){
 let entries;try{entries=await readdir(join(root,base),{withFileTypes:true})}catch{return}
 for(const e of entries){
  const path=join(base,e.name)
  if(e.isDirectory()) {
   // Content in public pages/blog can be fixed; no internal/admin/API mutations.
   if(!ignore.has(e.name))await walk(path)
  }else if(/\.(?:mdx|md|tsx|jsx)$/i.test(e.name)&&!/\.(test|spec)\./.test(e.name)){
   if(base.startsWith('content')||base.startsWith('app')||base.startsWith('lib/products'))files.push(path)
  }
 }
}
await walk('app');await walk('content');await walk('lib/products')
const exactRules=[
 {id:'UNQUALIFIED_LOWEST_COST',search:'Maximum protection. Minimum cost.',replace:'Term coverage to help protect your family’s income.',explanation:'Replaces unverified comparative price claim with plain-language use.'},
 {id:'ABSOLUTE_WHOLE_LIFE',search:'Coverage that never expires.',replace:'Lifetime coverage if premiums are paid and the policy stays in force.',explanation:'Conditions permanence on the contract remaining in force.'},
 {id:'UNSUPPORTED_SERVICE_POPULATION',search:'560K+ Residents in Our Service Area',replace:'Serving Schuylkill, Luzerne & Northumberland Counties',explanation:'Removes population figure without a linked source.'},
 {id:'UNSUPPORTED_SERVICE_POPULATION',search:'Serving a three-county Central Pennsylvania region of more than 560,000 residents.',replace:'Serving families and businesses throughout Schuylkill, Luzerne and Northumberland Counties.',explanation:'Removes unsourced aggregate count.'},
 {id:'UNSUPPORTED_COUNTY_POPULATION',search:"population: '140K'",replace:"population: 'Coal Region'",explanation:'Removes unsourced rounded county statistic.'},
 {id:'UNSUPPORTED_COUNTY_POPULATION',search:"population: '325K'",replace:"population: 'Northeastern PA'",explanation:'Removes unsourced rounded county statistic.'},
 {id:'UNSUPPORTED_COUNTY_POPULATION',search:"population: '91K'",replace:"population: 'Central PA'",explanation:'Removes unsourced rounded county statistic.'},
 {id:'EDUCATIONAL_CREDENTIAL',search:"'MBA · MS'",replace:"'MBA · MPA'",explanation:'Corrects degree abbreviation to MBA/MPA.'},
 {id:'PUBLIC_PROMO_PLACEHOLDER',search:'placeholder="ID#2777749"',replace:'placeholder="Only if you received a code"',explanation:'Removes unexplained promotional code displayed to customers.'},
]
const patches=[],proposals=[],unmatched=[],changedPaths=[]
for(const path of files){
 let txt=await readFile(join(root,path),'utf8')
 let next=txt
 for(const rule of exactRules){
  const count=next.split(rule.search).length-1
  if(count>0){
   next=next.replaceAll(rule.search,rule.replace)
   patches.push({path,rule:rule.id,before:rule.search,after:rule.replace,count,reason:rule.explanation,status:'PATCHED_SOURCE_PENDING_REVIEW_DEPLOYMENT'})
  }
 }
 if(next!==txt){await writeFile(join(root,path),next);changedPaths.push(path)}
 // Do not modify complex, carrier-specific contractual copy automatically.
 const unsafe=[
  [/\b(?:tax[- ]free retirement|tax[- ]free income|tax[- ]free growth)\b/gi,'TAX_TREATMENT_REVIEW','Replace with conditional, contract-specific wording supported by a carrier-approved brochure; display loan/MEC/lapse tax risks.'],
  [/\b(?:guaranteed approval|no downside risk|risk[- ]free|never lose money|never expires|100% approval)\b/gi,'ABSOLUTE_CLAIM_REVIEW','Remove unconditional promise; use only verified carrier-approved contract qualification.'],
  [/\b(?:TBD|lorem ipsum|INSERT (?:TEXT|SOURCE)|COMING SOON|placeholder)\b/gi,'PLACEHOLDER_REVIEW','Replace with verified final copy or withhold the unfinished public asset.'],
 ]
 for(const [rx,rule,fix] of unsafe){
  let m;while((m=rx.exec(next))&&proposals.length<500){
   const line=next.slice(0,m.index).split('\n').length
   if (/^\s*(?:\/\/|\/\*|\*|<!--|#)/.test((next.split('\n')[line-1]||'').trim()))continue
   proposals.push({path,line,rule,excerpt:next.slice(Math.max(0,m.index-75),m.index+130).replace(/\s+/g,' ').slice(0,220),correction:fix,status:'DRAFT_CORRECTION_PENDING_EVIDENCE_AND_APPROVAL'})
  }
 }
}
const seen=new Set()
for(const f of audit.findings||[]){
 if(f.severity!=='HIGH')continue
 const key=f.url+'|'+f.code
 if(seen.has(key))continue;seen.add(key)
 const action=f.code==='NUMERIC_CLAIMS_UNSOURCED'
   ?'Remove unsupported numeric claim, or add a dated direct public source URL that explicitly confirms the number and year. Verify before approval.'
   : f.code==='HTTP_ERROR'||f.code==='FETCH_FAILED'
   ?'Repair the live route or remove stale internal links to the unreachable route, then verify HTTP 200 from production.'
   : f.code==='PUBLIC_PLACEHOLDER'
   ?'Replace public-facing placeholder with finalized verifiable wording; hide unfinished asset if it cannot be completed.'
   : f.code.startsWith('PDF_')
   ?'Replace the served PDF with a compliant revised version; check logos, citations, policy claims and version before approval.'
   :'Rewrite the risky phrase in plain Schuylkill County language using the current applicable carrier-approved source, or remove unsupported promise.'
 unmatched.push({url:f.url,code:f.code,excerpt:f.evidence,correction:action,status:'OPEN_CORRECTION_REQUIRED'})
}
const manifest={generatedAt:new Date().toISOString(),baseline:audit.at||null,stage:'SOURCE_CORRECTION_GENERATION',patched:patches.length,sourceFilesChanged:changedPaths,patches,proposed:proposals,liveFindingsNeedingAction:unmatched,publicationStatus:'NOT_PUBLISHED_OR_VERIFIED',note:'A GitHub PR is a prepared correction, not proof of live correction. Legal/carrier review required for financial, tax, contract and underwriting claims.'}
await mkdir(dirname(join(root,manifestPath)),{recursive:true})
await writeFile(join(root,manifestPath),JSON.stringify(manifest,null,2))
console.log(JSON.stringify({changedPaths,patched:patches.length,reviewDrafts:proposals.length,liveFixBacklog:unmatched.length}))
