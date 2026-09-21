import {env} from 'cloudflare:workers';
import {researchSchema} from '@/lib/research';
import {runSchema,monitoringState,usageSchema,usageUpdateSchema} from '@/lib/monitor';
const headers={'Cache-Control':'no-store'};
export async function GET(request?:Request){try{
 const runId=request?new URL(request.url).searchParams.get('runId'):null;
 if(runId&&!/^[a-z0-9-]{5,90}$/.test(runId))return Response.json({error:'Invalid run ID'},{status:400,headers});
 const result=runId?await env.DB.prepare("SELECT body FROM snapshots WHERE id=?").bind('monitor-run-'+runId).all<{body:string}>():await env.DB.prepare("SELECT body FROM snapshots WHERE id GLOB 'monitor-run-*' ORDER BY checked_at DESC,id DESC LIMIT 30").all<{body:string}>();
 const runs=result.results.map(r=>runSchema.parse(JSON.parse(r.body)));
 let usage=null;try{if(!env.DB)throw Error('Storage unavailable');const row=await env.DB.prepare('SELECT body FROM snapshots WHERE id=?').bind('watchdog-usage-total').first<{body:string}>();if(row)usage=usageSchema.parse(JSON.parse(row.body));}catch{/* Usage is optional; monitoring remains available. */}
 return Response.json({...monitoringState(runs),runs,usage},{headers});
 }catch{return Response.json({state:'unavailable'},{status:503,headers});}}
export async function POST(request:Request){
 const token=request.headers.get('Authorization')?.replace(/^Bearer /,'');
 const hash=async(s:string)=>new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(s)));
 const [a,b]=await Promise.all([hash(token??''),hash(env.WATCHDOG_INGEST_TOKEN??'')]);let diff=0;for(let i=0;i<a.length;i++)diff|=a[i]^b[i];
 if(!token||!env.WATCHDOG_INGEST_TOKEN||diff)return Response.json({error:'Unauthorized'},{status:401});
 const reader=request.body?.getReader();if(!reader)return Response.json({error:'Body required'},{status:400});let body='',size=0;const decoder=new TextDecoder();while(true){const v=await reader.read();if(v.done)break;size+=v.value.length;if(size>20000){await reader.cancel();return Response.json({error:'Too large'},{status:413});}body+=decoder.decode(v.value,{stream:true});}body+=decoder.decode();
 try{const parsed=JSON.parse(body);
 if(parsed.kind==='usage'){
 if(!env.DB)return Response.json({error:'Usage storage unavailable'},{status:503,headers});
 const {usage:u,baselineUpdatedAt}=usageUpdateSchema.parse(parsed);const key='watchdog-usage-total';
 const oldRow=await env.DB.prepare('SELECT body FROM snapshots WHERE id=?').bind(key).first<{body:string}>();
 const old=oldRow?usageSchema.parse(JSON.parse(oldRow.body)):null;
 if(oldRow?.body===JSON.stringify(u))return Response.json({ok:true},{headers});
 if((old?.updatedAt??null)!==baselineUpdatedAt||old&&(old.since!==u.since||Date.parse(u.through)<=Date.parse(old.through)||Date.parse(u.updatedAt)<=Date.parse(old.updatedAt)||(['measuredRuns','unmeasuredRuns','inputTokens','cachedInputTokens','outputTokens','totalTokens'] as const).some(k=>u[k]<old[k])))return Response.json({error:'Conflicting usage baseline'},{status:409,headers});
 await env.DB.prepare("INSERT INTO snapshots (id,body,checked_at) SELECT ?,?,? WHERE (? IS NULL AND NOT EXISTS(SELECT 1 FROM snapshots WHERE id='watchdog-usage-total')) OR EXISTS(SELECT 1 FROM snapshots WHERE id='watchdog-usage-total' AND json_extract(body,'$.updatedAt')=?) ON CONFLICT(id) DO UPDATE SET body=excluded.body,checked_at=excluded.checked_at WHERE json_extract(snapshots.body,'$.updatedAt')=?").bind(key,JSON.stringify(u),u.updatedAt,baselineUpdatedAt,baselineUpdatedAt,baselineUpdatedAt).run();
 const saved=await env.DB.prepare('SELECT body FROM snapshots WHERE id=?').bind(key).first<{body:string}>();
 return saved?.body===JSON.stringify(u)?Response.json({ok:true},{headers}):Response.json({error:'Conflicting usage baseline'},{status:409,headers});
 }
 const r=runSchema.parse(parsed);const key='monitor-run-'+r.runId;
 if(r.mode==='full'&&r.status==='unchanged')return Response.json({error:'Full runs must publish an explicit complete or incomplete assessment'},{status:409,headers});
 if(r.status==='published'){const saved=await env.DB.prepare('SELECT body FROM snapshots WHERE id=?').bind('research-v2-run-'+r.reportId).first<{body:string}>();if(!saved)return Response.json({error:'Report must be published first'},{status:409});
 if(r.mode==='full'){const report=researchSchema.parse(JSON.parse(saved.body));const review=report.analysis?.review;if(!review||Date.parse(review.at)<Date.parse(r.startedAt)||Date.parse(report.checkedAt)>Date.parse(r.updatedAt))return Response.json({error:'Full run requires an assessment recorded during this run'},{status:409,headers});}}
 await env.DB.prepare("INSERT INTO snapshots (id,body,checked_at) VALUES (?,?,?) ON CONFLICT(id) DO UPDATE SET body=excluded.body WHERE json_extract(snapshots.body,'$.startedAt')=json_extract(excluded.body,'$.startedAt') AND julianday(json_extract(excluded.body,'$.updatedAt'))>julianday(json_extract(snapshots.body,'$.updatedAt')) AND json_extract(snapshots.body,'$.status')='running'").bind(key,JSON.stringify(r),r.startedAt).run();
 const saved=await env.DB.prepare('SELECT body FROM snapshots WHERE id=?').bind(key).first<{body:string}>();if(saved?.body!==JSON.stringify(r))return Response.json({error:'Conflicting or completed run'},{status:409});await env.DB.prepare("DELETE FROM snapshots WHERE id GLOB 'monitor-run-*' AND id NOT IN (SELECT id FROM snapshots WHERE id GLOB 'monitor-run-*' ORDER BY checked_at DESC,id DESC LIMIT 720)").run();return Response.json({ok:true,runId:r.runId},{headers});
 }catch{return Response.json({error:'Invalid run or unavailable storage'},{status:400});}
}
