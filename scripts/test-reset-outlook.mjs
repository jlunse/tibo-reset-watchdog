import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
import React from 'react';
import * as jsx from 'react/jsx-runtime';
import {renderToStaticMarkup} from 'react-dom/server';
function component(file){
 const code=ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,target:ts.ScriptTarget.ES2022}}).outputText;
 const context={exports:{},require(name){if(name==='react')return React;if(name==='react/jsx-runtime')return jsx;if(name==='./update-explanation')return component('app/update-explanation.tsx');throw Error(name);},Date,Intl};
 vm.runInNewContext(code,context);return context.exports;
}
const {AnalysisPanel}=component('app/analysis-panel.tsx');
const legacy=JSON.parse(fs.readFileSync('research/latest.json'));
for(const version of [4,5]){
 const report=structuredClone(legacy);report.schemaVersion=version;
 const combined=report.analysis.outlooks.find(o=>o.kind==='any');
 combined.level='HIGH';combined.position='upper';combined.positionReason='Direct staff promise.';
 if(version===5)report.analysis.outlooks=[combined];
 const html=renderToStaticMarkup(React.createElement(AnalysisPanel,{report,fresh:false}));
 assert.equal((html.match(/class="outlook-card /g)||[]).length,1);
 assert(html.includes('RESET OUTLOOK'));assert(html.includes('HIGH'));
 assert(html.includes('upper part'));assert(html.includes('Saved outlook'));
 assert(!html.includes('AUTOMATIC RESET'));assert(!html.includes('BANKED RESET'));
 assert(html.includes('Why this outlook?'));assert(html.includes('Direct staff promise.'));
}
console.log('Passed: actual renderer shows one combined meter for legacy and new reports, with stale state and evidence.');
