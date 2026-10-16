import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,writeFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {inspectSnapshot,inspectFolder} from '../scripts/flash-audit-local-20261015.mjs';
const files=['pet.json','README.md','AGENTS.md','CLAUDE.md','LICENSE','app.html','sprite.json'];
const metadata={pet:'Sample',kind:'pet-app',owner:'Astra',job:'Sample job',runs_on:'Browser',status:'hatching',entry:'app.html',sprite:'sprite.json',framework:'1',audit:{cadence:'manual'},tools:[{name:'sample'}]};
test('complete metadata avoids missing-file alarms without claiming runtime success',()=>{
 const rows=inspectSnapshot({files,metadata,entry:'Clicker Training data-astra-phone-baseline data-astra-paper-data'});
 assert.equal(rows.find(r=>r.check==='A14').status,'Pass');assert.equal(rows.find(r=>r.check==='A16').status,'Pass');
 assert.equal(rows.find(r=>r.check==='A41').status,'Not verified');assert.equal(rows.find(r=>r.check==='A21').status,'Not verified');
});
test('missing and invalid metadata are explicit, not successful empty audits',()=>{
 assert.equal(inspectSnapshot({files:[],metadata:null}).find(r=>r.check==='A16').status,'Incorrect');
 const rows=inspectSnapshot({files:[],metadata});assert.equal(rows[0].status,'Missing');assert.match(rows[1].detail,/entry target/);
});
test('A52 flags a missing activity bubble and never certifies source as live L3',()=>{
 const row=entry=>inspectSnapshot({files,metadata,entry}).find(r=>r.check==='A52');
 assert.equal(row('Clicker Training').status,'Missing');
 assert.equal(row('data-astra-l3-config data-astra-l3-script').status,'Missing');
 assert.equal(row('data-astra-l3-config data-astra-l3-script data-astra-l3-style').status,'Not verified');
 assert.match(row('data-astra-l3-config data-astra-l3-script data-astra-l3-style').detail,/real task/);
});
test('entry path traversal is not read or reported as an existing target',()=>{
 const dir=mkdtempSync(join(tmpdir(),'flash-audit-'));try{
  writeFileSync(join(dir,'pet.json'),JSON.stringify({...metadata,entry:'../outside.html'}));
  const result=inspectFolder(dir);assert.match(result.results.find(r=>r.check==='A16').detail,/entry target/);
  assert.equal(result.results.find(r=>r.check==='A41').status,'Missing');
 }finally{rmSync(dir,{recursive:true,force:true});}
});
