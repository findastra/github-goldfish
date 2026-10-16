import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync,rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Auditor,validateDraft,publishDraft,createAuditorServer } from '../scripts/readme-auditor-server-20261015.mjs';
const prefix='<h2 align="center">Astra</h2>\n\n';
const evidence={base:'base-sha',branch:'main',blob:'blob-sha',readme:prefix+'### Projects\n'+'Original profile. '.repeat(20),repos:[{name:'astras-pet-os'}]};
const draft=prefix+'<!-- findastra-readme-auditor: managed -->\n### Projects\n'+('Astra builds creative projects. '.repeat(10))+'\n[The Farm](https://github.com/findastra/astras-pet-os)\n';
const until=async check=>{for(let i=0;i<200;i++){if(check())return;await new Promise(r=>setTimeout(r,5));}throw Error('Timed out');};
function setup(t,overrides={}){const data=mkdtempSync(join(tmpdir(),'goldfish-readme-20261015-'));t.after(()=>rmSync(data,{recursive:true,force:true}));return new Auditor({data},{collect:async()=>structuredClone(evidence),agent:async({role})=>role==='maker'?{readme:draft,findings:['Shorten the stale catalog.']}:{approved:true,findings:[]},publish:async()=>({url:'https://github.com/findastra/findastra/pull/1',commit:'verified'}),...overrides});}
test('valid draft passes; header changes, unknown repos, private paths and new external URLs fail',()=>{
 assert.match(validateDraft(draft,evidence),/^[a-f0-9]{64}$/);
 assert.throws(()=>validateDraft(draft.replace('<!-- findastra-readme-auditor: managed -->',''),evidence),/marker/);
 assert.match(validateDraft(draft+'https://findastra.github.io/pets/',{...evidence,repos:[{name:'astras-pet-os',homepage:'https://findastra.github.io/pets/'}]}),/^[a-f0-9]{64}$/);
 for(const text of [draft.replace('Astra</h2>','Other</h2>'),draft+'https://github.com/findastra/unknown',draft+'C:\\Users\\someone\\x',draft+'https://example.com/new'])assert.throws(()=>validateDraft(text,evidence));
});
test('maker and separate checker finish before approval; feedback calls both again',async t=>{
 const calls=[];const a=setup(t,{agent:async args=>{calls.push(args);return args.role==='maker'?{readme:draft,findings:[]}:{approved:true,findings:[]};}});
 a.start();assert.throws(()=>a.start(),/already/);await until(()=>!a.busy);assert.equal(a.state.status,'awaiting-review');assert.deepEqual(calls.map(x=>x.role),['maker','checker']);assert.equal(a.state.publication,null);
 a.start('Make the projects concise.');await until(()=>!a.busy);assert.equal(calls.length,4);assert.match(calls[2].prompt,/Make the projects concise/);
 await assert.rejects(a.push('wrong'),/Approval/);await a.push(a.state.draft.hash);assert.equal(a.state.status,'pushed');
});
test('checker rejection cannot be approved; automatic revisions stop after two rounds',async t=>{
 let calls=0;const a=setup(t,{agent:async({role})=>{calls++;return role==='maker'?{readme:draft,findings:[]}:{approved:false,findings:['Unsupported claim.']};}});
 a.start();await until(()=>!a.busy);assert.equal(calls,4);assert.equal(a.state.status,'changes-needed');await assert.rejects(a.push(a.state.draft.hash),/Approval/);
});
test('OFF blocks every entry, cancels an in-flight model and survives restart',async t=>{
 const a=setup(t,{agent:async({signal})=>new Promise((resolve,reject)=>signal.addEventListener('abort',()=>reject(Error('cancelled')),{once:true}))});
 a.start();await until(()=>a.state.status==='drafting');a.controls({enabled:false,maintenance:true});await until(()=>!a.busy);assert.equal(a.state.status,'cancelled');assert.throws(()=>a.start(),/OFF/);await assert.rejects(a.push('x'),/OFF/);
 const restored=new Auditor(a.config);assert.equal(restored.state.enabled,false);assert.equal(restored.state.maintenance,true);
});
test('publisher refuses a stale base without writes, then verifies the exact pushed content',async()=>{
 const state={evidence,draft:{readme:draft,findings:['Fixed content.'],hash:validateDraft(draft,evidence)}};let calls=[];
 const api=async(path,opts)=>{calls.push([path,opts]);if(path==='/user')return {login:'findastra'};if(path.includes('/git/ref/'))return {object:{sha:'changed'}};throw Error('Unexpected write');};
 await assert.rejects(publishDraft(state,undefined,api,'test-credential'),/changed/);assert.equal(calls.length,2);
 calls=[];const good=async(path,opts)=>{calls.push([path,opts]);if(path==='/user')return {login:'findastra'};if(path.includes('/git/ref/'))return {object:{sha:'base-sha'}};if(path.endsWith('/git/refs'))return {};if(opts.method==='PUT')return {commit:{sha:'new-sha'}};if(path.includes('/contents/'))return {content:Buffer.from(draft).toString('base64')};if(path.endsWith('/pulls'))return {html_url:'https://github.com/findastra/findastra/pull/7',number:7};throw Error('unexpected');};
 const result=await publishDraft(state,undefined,good,'test-credential');assert.equal(result.commit,'new-sha');assert.equal(calls.filter(x=>x[1].method==='PUT').length,1);assert.ok(calls.filter(x=>x[1].method).every(x=>x[0].startsWith('/repos/findastra/findastra/')));assert.ok(!calls.some(x=>/merge/.test(x[0])));
});
test('local service rejects missing auth, cross-origin writes and unknown actions',async t=>{
 const a=setup(t);const {server,token}=createAuditorServer(a);await new Promise(r=>server.listen(0,'127.0.0.1',r));t.after(()=>new Promise(r=>server.close(r)));const origin='http://127.0.0.1:'+server.address().port;
 assert.equal((await fetch(origin+'/api/status')).status,401);
 assert.equal((await fetch(origin+'/api/status',{headers:{Authorization:'Bearer '+'é'.repeat(64)}})).status,401);
 assert.equal((await fetch(origin+'/api/status',{headers:{Authorization:'Bearer '+token}})).status,200);
 const headers={Authorization:'Bearer '+token,'Content-Type':'application/json',Origin:'https://untrusted.example'};
 assert.equal((await fetch(origin+'/api/run',{method:'POST',headers,body:'{}'})).status,403);
 headers.Origin=origin;assert.equal((await fetch(origin+'/api/unknown',{method:'POST',headers,body:'{}'})).status,404);
 assert.equal((await fetch(origin+'/api/controls',{method:'POST',headers,body:'{"enabled":false}'})).status,200);
 assert.equal((await fetch(origin+'/api/run',{method:'POST',headers,body:'{}'})).status,409);
});
test('a failed PR request retains the confirmed branch and commit',async()=>{
 const state={evidence,draft:{readme:draft,findings:[],hash:validateDraft(draft,evidence)}};const saved=[];
 const api=async(path,opts)=>{if(path==='/user')return {login:'findastra'};if(path.includes('/git/ref/'))return {object:{sha:evidence.base}};if(path.endsWith('/git/refs'))return {};if(opts.method==='PUT')return {commit:{sha:'new-commit'}};if(path.includes('/contents/'))return {content:Buffer.from(draft).toString('base64')};throw Error('PR creation unavailable');};
 await assert.rejects(publishDraft(state,undefined,api,'test',()=>saved.push(structuredClone(state.publication))),/unavailable/);
 assert.equal(state.publication.stage,'content-verified');assert.equal(state.publication.commit,'new-commit');assert.match(state.publication.branchUrl,/findastra\/findastra\/tree\//);assert.equal(saved.length,4);
});
