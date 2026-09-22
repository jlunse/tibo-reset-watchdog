import { z } from 'zod';
const text=z.string().trim().min(1).max(1800);
const stamp=z.string().datetime({offset:true});
const source=z.object({id:z.string().regex(/^[a-z0-9-]+$/),title:text,url:z.string().url().refine(s=>new URL(s).protocol==='https:'),tier:z.enum(['OFFICIAL','STAFF','COMMUNITY']),access:z.enum(['read','unavailable','search-only']),checkedAt:stamp,note:text,provenance:z.enum(['direct','imported-research']).optional(),importNote:text.optional()}).strict();
const claim=z.object({status:z.enum(['confirmed','reported','unknown','imported']),detail:text,sourceIds:z.array(z.string()).max(12)}).strict();
const event=z.object({id:z.string().regex(/^[a-z0-9-]+$/),kind:z.enum(['reset','banked']),title:text,date:z.string().regex(/^\d{4}-\d{2}-\d{2}$/),announcement:claim,scope:claim,timing:claim,rollout:claim}).strict();
const guess=z.object({kind:z.enum(['reset','banked']),hours:z.union([z.literal(24),z.literal(168)]),percent:z.number().int().min(0).max(100).nullable(),reason:text,sourceIds:z.array(z.string()).max(20),confidence:z.enum(['low','medium','high']).optional(),method:text.optional()}).strict();

const outlook=z.object({kind:z.enum(['reset','banked','any']),level:z.enum(['LOW','ELEVATED','HIGH','VERY HIGH']),position:z.enum(['lower','middle','upper']).optional(),positionReason:text.optional(),trend:z.enum(['strengthening','unchanged','weakening']),confidence:z.enum(['low','medium','high']),asOf:stamp,provenance:z.enum(['imported','reviewed']),reason:text,support:z.array(text).min(1).max(6),against:z.array(text).min(1).max(6),missing:text,sourceIds:z.array(z.string()).max(20)}).strict();
const incident=z.object({id:text,title:text,category:text,cluster:text,reporter:text,environment:text,reportedAt:stamp,checkedAt:stamp,sourceId:z.string(),review:z.enum(['reviewed','imported','excluded']),status:text,evidence:text,limitation:text}).strict();
const review=z.object({at:stamp,status:z.enum(['complete','incomplete']),considered:z.array(text).min(1).max(8),reason:text}).strict();
const analysis=z.object({review:review.optional(),outlooks:z.array(outlook).min(1).max(3),incidents:z.array(incident).max(200),importedLedger:z.object({asOf:stamp,total:z.number().int().nonnegative(),staffFixes:z.number().int().nonnegative(),officialIncidents:z.number().int().nonnegative(),categories:z.array(z.object({name:text,count:z.number().int().nonnegative()}).strict()),snapshots:z.array(z.object({at:stamp,total:z.number().int().nonnegative()}).strict()),note:text}).strict(),history:z.object({asOf:stamp,ageDays:z.number().nonnegative(),remainingIntervals:z.array(z.number().positive()).max(30),comparisons:z.array(z.object({hours:z.number().positive(),hits:z.number().int().nonnegative(),sample:z.number().int().positive()}).strict()),note:text}).strict(),changes:z.array(z.object({at:stamp,title:text,detail:text}).strict()).max(30)}).strict();
export const researchSchema=z.object({schemaVersion:z.union([z.literal(2),z.literal(3),z.literal(4),z.literal(5)]),runId:z.string().regex(/^[a-z0-9-]{5,90}$/),checkedAt:stamp,validUntil:stamp,summary:text,historyNote:text.optional(),baselines:z.array(z.object({kind:z.enum(['reset','banked']),date:z.string(),label:text,detail:text}).strict()).max(2).optional(),coverage:z.array(z.object({channel:text,status:z.enum(['checked','partial','unavailable']),detail:text}).strict()).min(3).max(12),sources:z.array(source).min(1).max(150),events:z.array(event).max(150),forecasts:z.array(guess).max(4),analysis:analysis.optional()}).strict().superRefine((r,c)=>{
 const issue=(message:string)=>c.addIssue({code:'custom',message});
 if(r.schemaVersion>=4&&!r.analysis)issue('Version 4 and later require analysis');
 if(r.schemaVersion===5&&r.forecasts.length)issue('Qualitative reports cannot include numeric forecasts');
 const ids=new Set(r.sources.map(s=>s.id));
 if(ids.size!==r.sources.length||new Set(r.events.map(e=>e.id)).size!==r.events.length)issue('Duplicate IDs');
 if(Date.parse(r.checkedAt)>Date.now()+300000||Date.parse(r.validUntil)<=Date.parse(r.checkedAt)||Date.parse(r.validUntil)-Date.parse(r.checkedAt)>48*3600000)issue('Invalid research validity window');
 for(const s of r.sources){const u=new URL(s.url);if(s.tier==='OFFICIAL'&&!['openai.com','www.openai.com','help.openai.com','status.openai.com','developers.openai.com','learn.chatgpt.com'].includes(u.hostname))issue('Official source must use an approved official host');if(s.tier==='STAFF'&&(!['x.com','twitter.com'].includes(u.hostname)||!/^\/(thsottiaux|reach_vb)\/status\/\d+$/.test(u.pathname)))issue('Staff sources require an original post from the verified account registry');}
 for(const e of r.events)for(const key of ['announcement','scope','timing','rollout'] as const){const claim=e[key];if(claim.sourceIds.some(id=>!ids.has(id)))issue('Unknown claim source');if(claim.status!=='unknown'&&!claim.sourceIds.length)issue('Evidence required');if(claim.status==='imported'&&!claim.sourceIds.some(id=>r.sources.some(s=>s.id===id&&s.provenance==='imported-research'&&s.importNote)))issue('Imported claims require documented research provenance');if(claim.status==='confirmed'&&!claim.sourceIds.some(id=>r.sources.some(s=>s.id===id&&s.access==='read'&&s.tier!=='COMMUNITY')))issue('Confirmation requires a directly read official or staff source');}
 if(r.schemaVersion<4&&new Set(r.forecasts.map(f=>`${f.kind}-${f.hours}`)).size!==4)issue('Four unique forecast horizons required');
 for(const kind of ['reset','banked']){const a=r.forecasts.find(f=>f.kind===kind&&f.hours===24)?.percent,b=r.forecasts.find(f=>f.kind===kind&&f.hours===168)?.percent;if(a!=null&&b!=null&&b<a)issue('7-day estimate must not be below 24-hour estimate');}
 if(r.analysis){const a=r.analysis;
 if(a.review){if(Date.parse(a.review.at)>Date.parse(r.checkedAt))issue('Review cannot postdate publication');if(a.review.status==='complete'&&a.outlooks.some(o=>o.asOf!==a.review!.at||o.provenance!=='reviewed'))issue('Completed review requires newly assessed outlooks');}
 if(r.schemaVersion===5){if(a.outlooks.length!==1||a.outlooks[0].kind!=='any')issue('Version 5 requires one combined reset outlook');}
 else if(a.outlooks.length!==3||new Set(a.outlooks.map(o=>o.kind)).size!==3)issue('Legacy reports require three distinct outlooks');
 if(new Set(a.incidents.map(i=>i.id)).size!==a.incidents.length||new Set(a.incidents.map(i=>i.sourceId)).size!==a.incidents.length)issue('Duplicate incident');
 if(a.importedLedger.categories.reduce((n,c)=>n+c.count,0)!==a.importedLedger.total)issue('Imported category totals do not reconcile');
 for(const i of a.incidents){if(!ids.has(i.sourceId))issue('Unknown incident source');if(i.review==='reviewed'&&!r.sources.some(s=>s.id===i.sourceId&&s.access==='read'))issue('Reviewed incident requires a read original');}
 for(const o of a.outlooks){if(o.sourceIds.some(id=>!ids.has(id)))issue('Unknown outlook source');if(Boolean(o.position)!==Boolean(o.positionReason))issue('Outlook position requires a reason');}
 for(const h of a.history.comparisons)if(h.hits>h.sample||h.sample!==a.history.remainingIntervals.length)issue('Invalid historical comparison');
 }
 for(const f of r.forecasts)if(f.sourceIds.some(id=>!ids.has(id)))issue('Unknown forecast source');
});
export type Research=z.infer<typeof researchSchema>;
export type ResearchView={research:Research|null,state:'fresh'|'stale'|'unavailable',message?:string};
