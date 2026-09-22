import fs from 'node:fs';
import {researchSchema} from '../lib/research.ts';
const report=researchSchema.parse(JSON.parse(fs.readFileSync(process.argv[2],'utf8')));
if(report.schemaVersion<4)for(const kind of ['reset','banked']){const a=report.forecasts.find(f=>f.kind===kind&&f.hours===24).percent,b=report.forecasts.find(f=>f.kind===kind&&f.hours===168).percent;if(a!==null&&b!==null&&b<a)throw Error('7-day estimate below 24-hour estimate');}
console.log(`Valid public research: ${report.runId}; ${report.sources.length} sources; ${report.events.length} events`);
