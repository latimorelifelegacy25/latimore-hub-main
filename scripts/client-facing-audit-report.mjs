#!/usr/bin/env node
import {readFileSync,writeFileSync} from 'node:fs'
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
