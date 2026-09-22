import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
import {DatabaseSync} from 'node:sqlite';
import {researchSchema} from '../lib/research.ts';
import {runSchema,monitoringState,usageSchema,usageUpdateSchema} from '../lib/monitor.ts';
const sql=new DatabaseSync(':memory:');
sql.exec('CREATE TABLE snapshots (id TEXT PRIMARY KEY, body TEXT NOT NULL, checked_at TEXT NOT NULL)');
const db={prepare(query){const make=(args=[])=>({query,args,bind(...values){return make(values)},async first(){return sql.prepare(query).get(...args)??null},async all(){return{results:sql.prepare(query).all(...args)}},async run(){return sql.prepare(query).run(...args)}});return make()},async batch(statements){sql.exec('BEGIN');try{const results=[];for(const s of statements)results.push(await s.run());sql.exec('COMMIT');return results}catch(e){sql.exec('ROLLBACK');throw e}}};
function route(path){const code=ts.transpileModule(fs.readFileSync(path,'utf8').replace(/^import .*;$/gm,''),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;const c={exports:{},env:{DB:db,WATCHDOG_INGEST_TOKEN:'test-only'},researchSchema,runSchema,monitoringState,usageSchema,usageUpdateSchema,Response,Request,URL,crypto,TextEncoder,TextDecoder,Uint8Array,Date};vm.runInNewContext(code,c);return c.exports;}
const reports=route('app/api/watchdog/route.ts'),status=route('app/api/watchdog/status/route.ts'),history=route('app/api/watchdog/history/route.ts');
const now=Date.now(),stamp=(delta)=>new Date(now+delta).toISOString();
const report=JSON.parse(fs.readFileSync('research/latest.json'));Object.assign(report,{runId:'test-report-current',checkedAt:stamp(-1000),validUntil:stamp(86400000)});
const request=(body,baseline)=>new Request('https://test/api/watchdog',{method:'POST',headers:{Authorization:'Bearer test-only',...(baseline?{'If-Match':baseline}:{})},body:JSON.stringify(body)});
assert.equal((await reports.POST(request(report))).status,200);
const changed=structuredClone(report);changed.runId='test-report-next';changed.checkedAt=stamp(0);
assert.equal((await reports.POST(request(changed,'wrong-baseline'))).status,409);
assert.equal((await reports.GET()).status,200);
assert.equal(sql.prepare('SELECT body FROM snapshots WHERE id=?').get('research-v2-run-'+changed.runId),undefined,'Rejected candidate must not appear in public archive');
assert.equal((await (await reports.GET()).json()).research.runId,report.runId);
assert.equal((await reports.POST(request(changed,report.runId))).status,200);
const start={runId:'test-full-run',mode:'full',status:'running',startedAt:stamp(-20000),updatedAt:stamp(-20000),detail:'Checking',channels:[]};
assert.equal((await status.POST(request(start))).status,200);
assert.equal((await status.POST(request({...start,status:'unchanged',updatedAt:stamp(1000)}))).status,409);
assert.equal((await status.POST(request({...start,status:'published',updatedAt:stamp(1000),reportId:changed.runId}))).status,409);
const reviewed=structuredClone(changed);reviewed.runId='test-reviewed';reviewed.checkedAt=stamp(1000);reviewed.analysis.review={status:'complete',at:stamp(500),considered:['New community evidence weighed against missing staff confirmation.'],reason:'Levels unchanged after reassessment.'};
assert.equal(researchSchema.safeParse(reviewed).success,false,'Cannot freshen review without reassessing outlooks');
for(const o of reviewed.analysis.outlooks){o.asOf=reviewed.analysis.review.at;o.provenance='reviewed';}
assert.equal((await reports.POST(request(reviewed,changed.runId))).status,200);
const terminal={...start,status:'published',updatedAt:stamp(2000),reportId:reviewed.runId};
assert.equal((await status.POST(request(terminal))).status,200);
assert.equal((await status.POST(request(terminal))).status,200,'Lost response replay is idempotent');
assert.equal((await (await status.GET(new Request('https://test/api/watchdog/status?runId='+start.runId))).json()).runs[0].status,'published');
assert.equal((await status.POST(request({...start,updatedAt:stamp(3000)}))).status,409,'Terminal status cannot reopen');
// Retention executes real production SQL, including reference and unrelated-key protection.
const insert=sql.prepare('INSERT INTO snapshots VALUES (?,?,?)');
for(let i=0;i<730;i++){const id='retained-'+String(i).padStart(4,'0');insert.run('research-v2-run-'+id,JSON.stringify({...report,runId:id}),stamp(-100000-i));insert.run('monitor-run-'+id,JSON.stringify({...start,runId:id,status:'failed'}),stamp(-100000-i));}
insert.run('monitor-run-protected-old',JSON.stringify({...start,runId:'protected-old',status:'published',reportId:'retained-0729'}),stamp(-50000));
insert.run('unrelated-report','{}',stamp(-999999));insert.run('researchXv2XrunXunrelated','{}',stamp(-999999));
const fresh={...reviewed,runId:'test-retention',checkedAt:stamp(3000)};
assert.equal((await reports.POST(request(fresh,reviewed.runId))).status,200);
assert.equal(sql.prepare("SELECT COUNT(*) AS n FROM snapshots WHERE id GLOB 'monitor-run-*'").get().n,720);
assert(sql.prepare("SELECT COUNT(*) AS n FROM snapshots WHERE id GLOB 'research-v2-run-*'").get().n<=1441);
assert(sql.prepare('SELECT 1 FROM snapshots WHERE id=?').get('unrelated-report'));
assert(sql.prepare('SELECT 1 FROM snapshots WHERE id=?').get('researchXv2XrunXunrelated'));
assert(sql.prepare('SELECT 1 FROM snapshots WHERE id=?').get('research-v2-run-'+reviewed.runId));
assert(sql.prepare('SELECT 1 FROM snapshots WHERE id=?').get('research-v2-run-retained-0729'),'Old report referenced by retained run survives pruning');
const page=await (await history.GET(new Request('https://test/api/watchdog/history'))).json();
assert.equal(page.reports.length,10);assert(page.next);
const next=await (await history.GET(new Request('https://test/api/watchdog/history?before='+page.next))).json();
assert(!next.reports.some(r=>page.reports.some(p=>p.runId===r.runId)));
const archived=await history.GET(new Request('https://test/api/watchdog/history?report='+reviewed.runId));assert.equal(archived.status,200);
assert.equal((await history.GET(new Request('https://test/api/watchdog/history?report=unrelated-report'))).status,404);
assert.equal((await history.GET(new Request('https://test/api/watchdog/history?before=missing-cursor'))).status,409);
const unfinished=structuredClone(fresh);unfinished.runId='test-incomplete';unfinished.checkedAt=stamp(5000);unfinished.analysis.review={at:stamp(4000),status:'incomplete',considered:['New reports read; staff originals unavailable.'],reason:'Assessment could not be completed; prior outlook dates retained.'};
const unfinishedStart={...start,runId:'test-incomplete-run',startedAt:stamp(3000),updatedAt:stamp(3000)};
assert.equal((await status.POST(request(unfinishedStart))).status,200);
assert.equal((await reports.POST(request(unfinished,fresh.runId))).status,200);
assert.equal((await status.POST(request({...unfinishedStart,status:'published',reportId:unfinished.runId,updatedAt:stamp(6000)}))).status,200,'Explicit incomplete assessment is publishable without freshening old outlooks');
console.log('Passed: actual SQLite publication, baseline conflict, full review gate, terminal replay, retention and archive pagination.');

// Accounting uses the authenticated status owner and one durable aggregate.
const usage={since:stamp(-50000),through:stamp(-30000),updatedAt:stamp(-20000),measuredRuns:1,unmeasuredRuns:0,inputTokens:100,cachedInputTokens:60,outputTokens:10,totalTokens:110};
const update={kind:'usage',baselineUpdatedAt:null,usage};
assert.equal((await status.POST(new Request('https://test/status',{method:'POST',body:JSON.stringify(update)}))).status,401);
assert.equal((await status.POST(request({...update,usage:{...usage,totalTokens:170}}))).status,400,'Cached tokens cannot be counted twice');
assert.equal((await status.POST(request(update))).status,200);
assert.equal((await status.POST(request(update))).status,200,'Identical replay is safe');
assert.deepEqual((await (await status.GET()).json()).usage,usage);
const nextUsage={...usage,through:stamp(-10000),updatedAt:stamp(0),measuredRuns:2,inputTokens:200,cachedInputTokens:120,outputTokens:20,totalTokens:220};
assert.equal((await status.POST(request({kind:'usage',baselineUpdatedAt:null,usage:nextUsage}))).status,409);
assert.equal((await status.POST(request({kind:'usage',baselineUpdatedAt:usage.updatedAt,usage:nextUsage}))).status,200);
assert.equal((await status.POST(request({kind:'usage',baselineUpdatedAt:nextUsage.updatedAt,usage:{...nextUsage,through:stamp(1000),updatedAt:stamp(2000),measuredRuns:1}}))).status,409,'Totals cannot regress');
assert.equal((await reports.POST(request({...fresh,runId:'test-usage-retention',checkedAt:stamp(8000)},unfinished.runId))).status,200);
assert.deepEqual((await (await status.GET()).json()).usage,nextUsage,'Report retention preserves the usage singleton');
assert.equal(sql.prepare("SELECT COUNT(*) AS n FROM snapshots WHERE id='watchdog-usage-total'").get().n,1);
console.log('Passed: usage authentication, strict totals, baseline conflicts, replay and retention.');

// The real report/status/archive handlers accept one combined outlook without
// invalidating the retained three-outlook reports.
const single=structuredClone(fresh);
single.schemaVersion=5;single.runId='test-single-reset';single.checkedAt=stamp(9000);
single.analysis.outlooks=single.analysis.outlooks.filter(o=>o.kind==='any');
single.analysis.review={at:stamp(8500),status:'complete',considered:['Verified staff promise.'],reason:'One combined reset assessment.'};
single.analysis.outlooks[0].asOf=single.analysis.review.at;
single.analysis.outlooks[0].provenance='reviewed';
assert.equal((await reports.POST(request(single,'test-usage-retention'))).status,200);
assert.deepEqual((await (await reports.GET()).json()).research,single);
const singleStart={...start,runId:'test-single-full',startedAt:stamp(8000),updatedAt:stamp(8000)};
assert.equal((await status.POST(request(singleStart))).status,200);
assert.equal((await status.POST(request({...singleStart,status:'published',reportId:single.runId,updatedAt:stamp(10000)}))).status,200);
const legacy=await (await history.GET(new Request('https://test/api/watchdog/history?report='+reviewed.runId))).json();
assert.equal(legacy.research.analysis.outlooks.length,3);
assert(researchSchema.safeParse(legacy.research).success);
for(const invalidKinds of [[],['reset'],['banked'],['any','any'],['reset','banked','any']]){
 const invalid=structuredClone(single);invalid.analysis.outlooks=invalidKinds.map(kind=>({...single.analysis.outlooks[0],kind}));
 assert.equal((await reports.POST(request(invalid,single.runId))).status,400);
}
const wrongLegacy=structuredClone(single);wrongLegacy.schemaVersion=4;
assert(!researchSchema.safeParse(wrongLegacy).success,'Legacy contract remains unchanged');
console.log('Passed: single-outlook publication, full-run completion, strict cardinality and legacy archive readback.');
