import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {auditCoverage,reconcileCatalog} from '../scripts/readme-coverage-20261015.mjs';
import {collectEvidence} from '../scripts/readme-auditor-server-20261015.mjs';
const fixture=JSON.parse(readFileSync(new URL('./fixtures/readme-roster-regression-20261015.json',import.meta.url),'utf8'));
const snapshot={...fixture,ref:'main',commit:'public-main',label:'Public main catalog'};
const evidence=reconcileCatalog([snapshot],fixture.repos);
const row=p=>p.repo?`${p.number}. [${p.repo}](https://github.com/findastra/${p.repo}) -- **${p.icon}** · ${p.description}`:`${p.number}. **${p.icon}** -- planned: ${p.description}`;
const complete=evidence.programs.map(row).join('\n');

test('the actual missed paragraph and missing Closet Cat fixture cannot pass',()=>{
 const report=auditCoverage(fixture.brokenReadme,evidence);
 assert.equal(report.expected,80);assert.equal(report.matched,79);assert.deepEqual(report.missing,[{number:45,icon:'Closet Cat'}]);
 assert.equal(report.wrongIds.length,35);assert.equal(report.wrongIds[0].number,46);
 assert.ok(report.tailFindings.some(x=>/Separate seed roster/.test(x.message)));
 assert.ok(report.tailFindings.some(x=>/Skill Scout/.test(x.message)));
 assert.equal(report.lastContentLine,fixture.brokenReadme.split('\n').length);assert.equal(report.ok,false);
});
test('all 80 public catalog animals including unlinked Closet Cat pass with stable IDs',()=>{
 const report=auditCoverage(complete,evidence);assert.deepEqual(report.errors,[]);assert.equal(report.matched,80);
 assert.equal(evidence.programs.find(p=>p.number===45).repo,null);assert.equal(evidence.registryCoverage.expected,46);
 assert.ok(auditCoverage(complete+'\n\nA cross-reference to Skill Scout and Pole Puff is useful.',evidence).ok);
 assert.ok(auditCoverage(complete+'\n\n- Read [the Farm](https://github.com/findastra/astras-pet-os) for more.',evidence).ok);
 assert.ok(auditCoverage(complete+'\n\n### How to use\n1. Open the app.\n2. Read the instructions.',evidence).ok);
});
test('complete lists cannot hide a stale seed paragraph at the very end',()=>{
 const bad=complete+'\n\n### More\nOrdinary prose.\n\nSeeds, named and waiting to hatch: Pole Puff; Skill Scout · jobs to be decided';
 assert.equal(auditCoverage(bad,evidence).tailFindings.length,2);
 assert.equal(auditCoverage(complete+'\n\n```text\nSeeds, named and waiting to hatch: example\n```',evidence).tailFindings.length,0);
 assert.equal(auditCoverage(complete+'\n<details>\n<summary>Notes</summary>\nSeeds, named and waiting to hatch: Pole Puff; Skill Scout · jobs to be decided\n</details>',evidence).tailFindings.length,2);
});
test('duplicate identities, missing rows, shifted numbers and fake repo links fail',()=>{
 assert.equal(auditCoverage(complete+'\n'+row(evidence.programs[0]),evidence).duplicates.length,1);
 assert.ok(!auditCoverage(complete.replace(/^45\..*\n/m,''),evidence).ok);
 assert.equal(auditCoverage(complete.replace(/^46\./m,'45.'),evidence).wrongIds.length,1);
 assert.ok(!auditCoverage(complete.replace(/^45\..*$/m,'45. [pet-program-45](https://github.com/findastra/pet-program-45) -- **Closet Cat** · planned'),evidence).ok);
 assert.ok(!auditCoverage(complete.replace('**Friendly Farmer**','**Unknown Name**'),evidence).ok);
 assert.ok(!auditCoverage(complete+'\n999. **Unknown animal** -- planned',evidence).ok);
});
test('animal rows only in comments, blockquotes or code cannot satisfy coverage',()=>{
 for(const hidden of ['<!--\n'+complete+'\n-->','```md\n'+complete+'\n```','````md\n```\n'+complete+'\n````','<pre>\n'+complete+'\n</pre>','<code>\n'+complete+'\n</code>',complete.split('\n').map(x=>'> '+x).join('\n'),'<details>\n<summary>Catalog</summary>\n'+complete+'\n</details>']){
   assert.equal(auditCoverage(hidden,evidence).matched,0);
 }
 assert.equal(auditCoverage(complete,{}).ok,false);
 const duplicate=auditCoverage(complete+'\n<details>\n<summary>Duplicate</summary>\n'+complete+'\n</details>',evidence);
 assert.equal(duplicate.matched,80);assert.equal(duplicate.duplicates.length,80);assert.equal(duplicate.ok,false);
});
test('older installed metadata cannot replace current main jobs or stages silently',()=>{
 const older=structuredClone(snapshot);older.ref='old-installed';older.catalog.programs.find(p=>p.icon==='Skill Scout').mini_descriptor.text='Job undecided.';
 const result=reconcileCatalog([snapshot,older],fixture.repos);
 assert.equal(result.programs.find(p=>p.icon==='Skill Scout').description,evidence.programs.find(p=>p.icon==='Skill Scout').description);
 assert.match(result.sourceWarnings.join(' '),/public main description and stage take precedence/);
 assert.ok(auditCoverage(complete+'\nSkill Scout: job undecided.',result).tailFindings.length);
});
test('renamed repositories require matching animal name and stable ID in public metadata',()=>{
 const repos=[...fixture.repos.filter(p=>p.name!=='the-cats-closet'),{name:'the-cats-closet',description:"Closet Cat's pet program (#45, seed): closet organization"}];
 const mapped=reconcileCatalog([snapshot],repos);assert.equal(mapped.programs[44].repo,'the-cats-closet');assert.match(mapped.sourceWarnings.join(' '),/catalog repository pet-program-45 is stale/);
 assert.ok(auditCoverage(mapped.programs.map(row).join('\n')+'\n- [startup-star](https://github.com/findastra/startup-star) -- the Friendly Farmer\'s tray tool',mapped).ok);
 assert.equal(reconcileCatalog([snapshot],repos.map(p=>p.name==='the-cats-closet'?{...p,description:'Closet Cat'}:p)).programs[44].repo,null);
 assert.throws(()=>reconcileCatalog([snapshot],[...repos,{name:'ambiguous-copy',description:'Closet Cat #45'}]),/Several public repositories/);
});
test('published branch additions are explicit and registry omissions/conflicts block',()=>{
 const next=structuredClone(snapshot);next.ref='published-branch';next.commit='branch-sha';
 next.catalog.programs.push({number:81,icon:'Intel Owl',repo:'pet-program-81',stage:'seed',mini_descriptor:{text:'Researches emerging cyber threats.'}});
 next.registry.seeds.pets.push({pet:'Intel Owl',repo:null});
 const merged=reconcileCatalog([snapshot,next],fixture.repos);
 assert.equal(merged.programs.length,81);assert.equal(merged.programs.at(-1).repo,null);
 assert.deepEqual(merged.sources[1].additions,[{number:81,icon:'Intel Owl'}]);assert.equal(merged.registryCoverage.expected,47);
 assert.deepEqual(auditCoverage(complete,merged).missing,[{number:81,icon:'Intel Owl'}]);
 const conflict=structuredClone(next);conflict.catalog.programs[0].icon='Changed animal';
 assert.throws(()=>reconcileCatalog([snapshot,conflict],fixture.repos),/identity conflict/);
 const missing=structuredClone(next);missing.catalog.programs.pop();
 assert.throws(()=>reconcileCatalog([missing],fixture.repos),/Registry animal is absent/);
 assert.throws(()=>reconcileCatalog([{...snapshot,registry:{}}],fixture.repos),/Incomplete/);
});
test('public repo verification controls links and surfaces stale registry visibility',()=>{
 const changed=structuredClone(snapshot);changed.registry.pets[0].visibility='private';
 const e=reconcileCatalog([changed],fixture.repos);assert.ok(e.sourceWarnings.some(w=>w.includes('Friendly Farmer')));
 assert.equal(e.programs[0].repo,'astras-pet-os');
 const hidden=reconcileCatalog([snapshot],fixture.repos.filter(p=>p.name!=='astras-pet-os'));
 assert.equal(hidden.programs[0].repo,null);assert.equal(hidden.programs.length,80);
});
test('collector pins both public hub files and never filters out a no-repository animal',async()=>{
 const calls=[];const encoded=content=>({sha:'blob',content:Buffer.from(JSON.stringify(content)).toString('base64')});
 const api=async path=>{calls.push(path);if(path==='/user')return {login:'findastra'};
   if(path==='/repos/findastra/findastra')return {default_branch:'main',permissions:{push:true}};
   if(path.includes('/git/ref/'))return {object:{sha:path.includes('astras-pet-os')?'pinned-core':'profile-base'}};
   if(path.includes('/contents/README.md'))return {sha:'readme-blob',content:Buffer.from('Profile').toString('base64')};
   if(path.includes('/users/findastra/repos'))return fixture.repos.map(p=>({...p,private:false}));
   if(path.endsWith('/contents/pet-programs.json?ref=pinned-core'))return encoded(fixture.catalog);
   if(path.endsWith('/contents/pets.json?ref=pinned-core'))return encoded(fixture.registry);
   throw Error('Unexpected API request: '+path);
 };
 const collected=await collectEvidence(api,'fake');assert.equal(collected.programs.length,80);assert.equal(collected.programs[44].repo,null);
 assert.equal(collected.sources[0].commit,'pinned-core');assert.equal(collected.registryCoverage.matched,46);
 assert.ok(!calls.some(path=>/\/contents\/.+\?ref=main$/.test(path)));
});
