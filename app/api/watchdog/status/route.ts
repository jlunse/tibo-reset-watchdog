import {env} from 'cloudflare:workers';
import {runSchema,monitoringState} from '@/lib/monitor';
const headers={'Cache-Control':'no-store'};
export async function GET(){try{const result=await env.DB.prepare("SELECT body FROM snapshots WHERE id LIKE 'monitor-run-%' ORDER BY checked_at DESC LIMIT 30").all<{body:string}>();const runs=result.results.map(r=>runSchema.parse(JSON.parse(r.body)));return Response.json({...monitoringState(runs),runs},{headers});}catch{return Response.json({state:'unavailable'},{status:503,headers});}}
export async function POST(request:Request){
 const token=request.headers.get('Authorization')?.replace(/^Bearer /,'');
 const hash=async(s:string)=>new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(s)));
 const [a,b]=await Promise.all([hash(token??''),hash(env.WATCHDOG_INGEST_TOKEN??'')]);let diff=0;for(let i=0;i<a.length;i++)diff|=a[i]^b[i];
 if(!token||!env.WATCHDOG_INGEST_TOKEN||diff)return Response.json({error:'Unauthorized'},{status:401});
 const reader=request.body?.getReader();if(!reader)return Response.json({error:'Body required'},{status:400});let body='',size=0;const decoder=new TextDecoder();while(true){const v=await reader.read();if(v.done)break;size+=v.value.length;if(size>20000){await reader.cancel();return Response.json({error:'Too large'},{status:413});}body+=decoder.decode(v.value,{stream:true});}body+=decoder.decode();
 try{const r=runSchema.parse(JSON.parse(body));const key='monitor-run-'+r.runId;
 if(r.status==='published'){const saved=await env.DB.prepare('SELECT body FROM snapshots WHERE id=?').bind('research-v2-run-'+r.reportId).first<{body:string}>();if(!saved)return Response.json({error:'Report must be published first'},{status:409});}
 await env.DB.prepare("INSERT INTO snapshots (id,body,checked_at) VALUES (?,?,?) ON CONFLICT(id) DO UPDATE SET body=excluded.body WHERE json_extract(snapshots.body,'$.startedAt')=json_extract(excluded.body,'$.startedAt') AND julianday(json_extract(excluded.body,'$.updatedAt'))>julianday(json_extract(snapshots.body,'$.updatedAt')) AND json_extract(snapshots.body,'$.status')='running'").bind(key,JSON.stringify(r),r.startedAt).run();
 const saved=await env.DB.prepare('SELECT body FROM snapshots WHERE id=?').bind(key).first<{body:string}>();if(saved?.body!==JSON.stringify(r))return Response.json({error:'Conflicting or completed run'},{status:409});return Response.json({ok:true,runId:r.runId},{headers});
 }catch{return Response.json({error:'Invalid run or unavailable storage'},{status:400});}
}
