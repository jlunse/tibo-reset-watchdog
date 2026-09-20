import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
import {researchSchema} from '../lib/research.ts';
const report=JSON.parse(fs.readFileSync('research/latest.json','utf8'));
// Keep publication tests independent of the age of the bundled research snapshot.
report.checkedAt=new Date().toISOString();
report.validUntil=new Date(Date.now()+24*60*60*1000).toISOString();
assert(researchSchema.safeParse(report).success);
const invalid=structuredClone(report);invalid.sources[0].tier='COMMUNITY';invalid.events[0].announcement.sourceIds=[invalid.sources[0].id];assert(!researchSchema.safeParse(invalid).success,'Community evidence cannot confirm a claim');
const missing=structuredClone(report);missing.events[0].scope.sourceIds=['not-a-source'];assert(!researchSchema.safeParse(missing).success,'Dangling references rejected');
const fake=structuredClone(report);fake.sources[0].url='https://openai.com.example.org/fake';assert(!researchSchema.safeParse(fake).success,'Spoofed official hostname rejected');
const privateData=structuredClone(report);privateData.personalObservation='private';assert(!researchSchema.safeParse(privateData).success,'Unknown fields rejected');
const code=ts.transpileModule(fs.readFileSync('app/api/watchdog/route.ts','utf8').replace(/^import .*;$/gm,''),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
const records=new Map();
const db={prepare(sql){return {bind(...args){return {async first(){const body=records.get(args[0]);return body?{body}:null},sql,args}}}},async batch(statements){const [archive,latest]=statements;const [id,body]=archive.args;if(!records.has(id))records.set(id,body);const next=records.get(latest.args[1]);const prev=records.get(latest.args[0]);if(!prev||Date.parse(JSON.parse(next).checkedAt)>Date.parse(JSON.parse(prev).checkedAt))records.set(latest.args[0],next);}};
const context={exports:{},env:{DB:db,WATCHDOG_INGEST_TOKEN:'test-token'},researchSchema,Response,Request,crypto,TextEncoder,TextDecoder,Uint8Array,Date};vm.runInNewContext(code,context);
const req=(r,auth='Bearer test-token')=>new Request('http://localhost/api/watchdog',{method:'POST',headers:{Authorization:auth},body:JSON.stringify(r)});
assert.equal((await context.exports.POST(req(report,'wrong'))).status,401);
assert.equal((await context.exports.POST(req(missing))).status,400);
assert.equal((await context.exports.POST(req(report))).status,200);
assert.equal((await context.exports.POST(req(report))).status,200,'Identical retry is idempotent');
assert.equal((await context.exports.GET()).status,200);
assert.deepEqual((await (await context.exports.GET()).json()).research,report);
const older=structuredClone(report);older.runId+='-old';older.checkedAt=new Date(Date.parse(report.checkedAt)-1000).toISOString();assert.equal((await context.exports.POST(req(older))).status,409,'Older run cannot replace latest');
const changed=structuredClone(report);changed.summary='Different contents, same ID';assert.equal((await context.exports.POST(req(changed))).status,409,'Run ID immutable');
assert.deepEqual((await (await context.exports.GET()).json()).research,report,'Rejected writes preserve current report');
console.log('Passed: source provenance, strict payload, authentication, publishing, readback, idempotency and stale-write protection');
if(report.analysis){
 const badTotal=structuredClone(report);badTotal.analysis.importedLedger.total++;assert(!researchSchema.safeParse(badTotal).success,'Imported totals must reconcile');
 const duplicate=structuredClone(report);duplicate.analysis.incidents.push(duplicate.analysis.incidents[0]);assert(!researchSchema.safeParse(duplicate).success,'Duplicate issues rejected');
 const badHistory=structuredClone(report);badHistory.analysis.history.comparisons[0].hits=99;assert(!researchSchema.safeParse(badHistory).success,'Invalid historical ratio rejected');
 const noSource=structuredClone(report);noSource.analysis.incidents[0].sourceId='missing';assert(!researchSchema.safeParse(noSource).success,'Reviewed records need valid sources');
 console.log('Passed: version 4 ledger reconciliation, unique issues, history ratios and incident provenance');
}
