#!/usr/bin/env node
import {readFileSync,writeFileSync,existsSync} from 'node:fs'
const r=JSON.parse(readFileSync(process.argv[2]||'audit-output/current.json','utf8'))
const m=r.observed||{}
let s='# Hourly client-facing audit — '+(r.at||new Date().toISOString())+'\n\n'
s+='**Coverage: '+(r.coverage?.status||'INCOMPLETE')+' — not a legal or insurer clearance.**\n\n'
s+='Actually fetched: '+(m.webPages||0)+' web pages, '+(m.pdfs||0)+' PDFs, '+(m.images||0)+' images. '+(m.failedRequests||0)+' request failures; '+(m.highFindings||0)+' HIGH findings; '+(m.changes||0)+' changed assets.\n\n'
s+='**Evidence:** https://github.com/'+process.env.GITHUB_REPOSITORY+'/actions/runs/'+process.env.GITHUB_RUN_ID+'\n\n'
s+='### HIGH findings (top 50)\n'
for(const f of (r.findings||[]).filter(x=>x.severity==='HIGH').slice(0,50))s+='- **'+f.code+'** '+f.url+' — '+f.message+'; evidence: '+String(f.evidence||'').slice(0,120).replaceAll('\n',' ')+'\n'
s+='\n### Changed published asset fingerprints (top 40)\n'
for(const c of (r.changes||[]).slice(0,40))s+='- '+c.url+' SHA256 '+c.current+'\n'
s+='\n### Channels NOT audited\n'
for(const x of (r.coverage?.notCovered||[]))s+='- '+x+'\n'
writeFileSync(process.argv[3]||'audit-output/comment.md',s)

if(existsSync('audit-output/corrections.json')){
 const m=JSON.parse(readFileSync('audit-output/corrections.json','utf8'))
 s+='\n### CORRECTIVE ACTIONS (not merely flags)\n'
 s+='Source files actually patched: '+(m.sourceFilesChanged?.length||0)+'; exact safe text replacements: '+(m.patched||0)+'; claims with proposed replacement/review: '+(m.proposed?.length||0)+'; open live correction obligations: '+(m.liveFindingsNeedingAction?.length||0)+'\n'
 for(const p of (m.patches||[]).slice(0,25))s+='- PATCHED SOURCE — '+p.path+' — before: "'+p.before+'" → after: "'+p.after+'" — **NOT LIVE-VERIFIED**\n'
 for(const q of (m.proposed||[]).slice(0,20))s+='- REVIEW REQUIRED — '+q.path+':'+q.line+' — '+q.rule+' — '+q.correction+'\n'
 if(existsSync('audit-output/correction-pr-url.txt')) s+='Prepared code change / PR: '+readFileSync('audit-output/correction-pr-url.txt','utf8')+'\n'
 s+='**Closure rule:** Count FIXED only when a subsequent live crawl proves the flagged published text is gone and the replacement is reachable. PR creation alone is NOT a completed correction.\n'
}
writeFileSync(process.argv[3]||'audit-output/comment.md',s)
