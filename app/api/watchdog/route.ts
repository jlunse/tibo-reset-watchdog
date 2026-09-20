import { env } from 'cloudflare:workers';
import { researchSchema } from '@/lib/research';
const headers={'Cache-Control':'no-store'};
export async function GET(){
 try{
  if(!env.DB)throw new Error();
  const row=await env.DB.prepare('SELECT body FROM snapshots WHERE id=?').bind('research-v2-latest').first<{body:string}>();
  if(!row)return Response.json({research:null,state:'unavailable',message:'The first research report has not been published yet.'},{headers});
  const research=researchSchema.parse(JSON.parse(row.body));
  return Response.json({research,state:Date.now()>Date.parse(research.validUntil)?'stale':'fresh'},{headers});
 }catch{return Response.json({research:null,state:'unavailable',message:'The saved research is temporarily unavailable. Please try again.'},{status:503,headers});}
}
export async function POST(request:Request){
 const expected=env.WATCHDOG_INGEST_TOKEN;
 const provided=request.headers.get('Authorization')?.replace(/^Bearer /,'')??'';
 const hash=async(s:string)=>new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(s)));
 const [a,b]=await Promise.all([hash(expected??''),hash(provided)]);let diff=0;for(let i=0;i<a.length;i++)diff|=a[i]^b[i];
 if(!expected||!provided||diff)return Response.json({error:'Unauthorized'},{status:401,headers});
 if(!env.DB)return Response.json({error:'Storage unavailable'},{status:503,headers});
 const reader=request.body?.getReader();if(!reader)return Response.json({error:'Body required'},{status:400});
 let size=0;const chunks:Uint8Array[]=[];while(true){const {value,done}=await reader.read();if(done)break;size+=value.length;if(size>250000){await reader.cancel();return Response.json({error:'Report too large'},{status:413});}chunks.push(value);}
 const bytes=new Uint8Array(size);let offset=0;for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.length;}
 let result;try{result=researchSchema.safeParse(JSON.parse(new TextDecoder().decode(bytes)));}catch{return Response.json({error:'Invalid JSON'},{status:400});}
 if(!result.success)return Response.json({error:'Invalid report',details:result.error.issues.map(i=>i.message)},{status:400,headers});
 const r=result.data, body=JSON.stringify(r),db=env.DB;
 if(Date.now()>Date.parse(r.validUntil))return Response.json({error:'Report already expired'},{status:400,headers});
 try{
  await db.batch([
   db.prepare('INSERT INTO snapshots (id,body,checked_at) VALUES (?,?,?) ON CONFLICT(id) DO NOTHING').bind('research-v2-run-'+r.runId,body,r.checkedAt),
   db.prepare("INSERT INTO snapshots (id,body,checked_at) SELECT ?,body,checked_at FROM snapshots WHERE id=? ON CONFLICT(id) DO UPDATE SET body=excluded.body,checked_at=excluded.checked_at WHERE julianday(excluded.checked_at)>julianday(snapshots.checked_at)").bind('research-v2-latest','research-v2-run-'+r.runId)
  ]);
  const saved=await db.prepare('SELECT body FROM snapshots WHERE id=?').bind('research-v2-latest').first<{body:string}>();
  if(saved?.body!==body)return Response.json({error:'A newer report or a different report with this run ID is already saved'},{status:409,headers});
  return Response.json({ok:true,runId:r.runId},{headers});
 }catch{return Response.json({error:'Could not save report; previous report retained'},{status:503,headers});}
}
