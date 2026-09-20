import {z} from 'zod';
export const runSchema=z.object({runId:z.string().regex(/^[a-z0-9-]{5,90}$/),startedAt:z.string().datetime(),updatedAt:z.string().datetime(),mode:z.enum(['full','light','recovery']),status:z.enum(['running','published','unchanged','failed']),detail:z.string().min(1).max(1200),reportId:z.string().max(90).optional(),channels:z.array(z.object({name:z.string().max(100),status:z.enum(['checked','partial','unavailable']),detail:z.string().max(600)}).strict()).max(12)}).strict().superRefine((r,c)=>{if(Date.parse(r.updatedAt)<Date.parse(r.startedAt)||Date.parse(r.updatedAt)>Date.now()+300000)c.addIssue({code:'custom',message:'Invalid run times'});if(r.status==='published'&&!r.reportId)c.addIssue({code:'custom',message:'Published run needs report ID'});});
export type MonitorRun=z.infer<typeof runSchema>;
export function scheduleWindow(now:number){
 const hour=Math.floor(now/3600000)*3600000;
 return {previous:hour,next:hour+3600000};
}
export function monitoringState(runs:MonitorRun[],now=Date.now()){
 const sorted=[...runs].sort((a,b)=>Date.parse(b.startedAt)-Date.parse(a.startedAt));const latest=sorted[0];const {previous,next}=scheduleWindow(now);
 const lastSuccess=sorted.find(r=>r.status==='published'||r.status==='unchanged');
 const missed=now>previous+45*60000&&(!latest||Date.parse(latest.startedAt)<previous);
 const stalled=latest?.status==='running'&&now-Date.parse(latest.updatedAt)>45*60000;
 return {latest:latest??null,lastSuccess:lastSuccess??null,nextCheck:new Date(next).toISOString(),state:missed?'missed':stalled?'interrupted':latest?.status??'unknown'};
}
