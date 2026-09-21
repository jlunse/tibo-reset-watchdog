import {env} from 'cloudflare:workers';
const headers={'Cache-Control':'no-store'};
export async function GET(request:Request){
 try{
  const url=new URL(request.url),id=url.searchParams.get('report'),before=url.searchParams.get('before');
  if([id,before].some(v=>v!==null&&!/^[a-z0-9-]{5,90}$/.test(v)))return Response.json({error:'Invalid report ID'},{status:400,headers});
  if(id){const row=await env.DB.prepare('SELECT body FROM snapshots WHERE id=?').bind('research-v2-run-'+id).first<{body:string}>();return row?Response.json({research:JSON.parse(row.body)},{headers}):Response.json({error:'Report is no longer retained'},{status:404,headers});}
  let at='9999',key='';
  if(before){const row=await env.DB.prepare('SELECT checked_at FROM snapshots WHERE id=?').bind('research-v2-run-'+before).first<{checked_at:string}>();if(!row)return Response.json({error:'History changed; reload the first page'},{status:409,headers});at=row.checked_at;key='research-v2-run-'+before;}
  const result=await env.DB.prepare("SELECT id,checked_at,json_extract(body,'$.summary') AS summary FROM snapshots WHERE id GLOB 'research-v2-run-*' AND (checked_at < ? OR (checked_at = ? AND id < ?)) ORDER BY checked_at DESC,id DESC LIMIT 11").bind(at,at,key).all<{id:string,checked_at:string,summary:string}>();
  const reports=result.results.slice(0,10).map(r=>({runId:r.id.slice('research-v2-run-'.length),checkedAt:r.checked_at,summary:r.summary}));
  return Response.json({reports,next:result.results.length>10?reports[reports.length-1].runId:null},{headers});
 }catch{return Response.json({error:'Report history is temporarily unavailable'},{status:503,headers});}
}
