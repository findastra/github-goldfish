import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { loadEngine } from '../scripts/load-engine.mjs';
const G = loadEngine();
function auditPet(pet, registry) {
 const files={'README.md':'# Sample\n\n*A pet app by Astra.*\n\n## How to run\nPlanned.\n## Limits\nNot implemented.','pet.json':JSON.stringify(pet),'AGENTS.md':'Built with GPT-6','CLAUDE.md':'Read AGENTS.md'};
 return G.audit({user:'owner',profile:{},registry,repos:[{name:'sample',description:'Sample program.',homepage:'',topics:['pet-app'],license:'MIT',default_branch:'master',files,tree:Object.keys(files)}]});
}
const base={pet:'Sample',kind:'pet-app',owner:'Astra',job:'A planned sample.',status:'seed',cage:{topic:'pet-app',home:'https://github.com/findastra/astras-pet-os'}};
test('cancellation interrupts public and private file reads',async()=>{
 for(const privateRepo of [false,true]) {
  const controller=new AbortController();let fileRead=false;
  const response=data=>({status:200,ok:true,headers:{get:()=>null},json:async()=>data,text:async()=>String(data)});
  const fetchFn=async(url,options={})=>{
   if(url.includes('raw.githubusercontent.com')||url.includes('/contents/')) {
    fileRead=true;assert.equal(options.signal,controller.signal);
    controller.abort(); options.signal.throwIfAborted();
   }
   if(url.endsWith('/user')) return response({login:'owner'});
   if(url.includes('/repos?')) return response([{name:'sample',private:privateRepo,default_branch:'main',topics:[]}]);
   if(url.includes('/git/trees/')) return response({tree:[{path:'README.md',type:'blob',size:10}]});
   return response({name:'Owner'});
  };
  await assert.rejects(G.collect('owner',{token:privateRepo?'test-only':undefined,signal:controller.signal,fetchFn}),e=>e.name==='AbortError');
  assert.ok(fileRead);
 }
});
test('planned stages do not produce runtime-field or external-home false errors',()=>{
 for(const status of ['seed','roadmap']) {
  const findings=auditPet({...base,status});
  assert.equal(findings.filter(f=>f.sev==='error'&&/sprite|runs_on|entry|status|cage.home/.test(f.msg)).length,0);
  assert.equal(findings.filter(f=>f.where==='default branch').length,0);
 }
});
test('implemented pet still needs runtime fields and valid local home path',()=>{
 const findings=auditPet({...base,status:'growing',cage:{topic:'pet-app',home:'missing.md'}});
 for(const field of ['sprite','runs_on','entry','cage.home']) assert.ok(findings.some(f=>f.msg.includes(field)));
});
test('pipeline admission is not incorrectly reported as absent',()=>{
 assert.equal(auditPet(base,{pets:[],pipeline:[{repo:'sample'}]}).filter(f=>/no entry in the inspected/.test(f.msg)).length,0);
 assert.ok(auditPet(base,{pets:[],pipeline:[]}).some(f=>/no entry in the inspected/.test(f.msg)));
});
test('all embedded scripts parse and browser entries match',()=>{
 const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
 for(const [,attrs,script] of html.matchAll(/<script([^>]*)>([\s\S]*?)<\/script>/g)){if(/type=["']application\/json["']/.test(attrs))JSON.parse(script);else new vm.Script(script);}
 assert.equal(html,readFileSync(new URL('../github-goldfish-20261008.html',import.meta.url),'utf8'));
});
