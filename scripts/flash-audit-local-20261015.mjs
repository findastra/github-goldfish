// Read-only local Flash Audit preflight. By Astra; OpenAI Codex GPT-6, 2026-10-15.
// Reads declared metadata and entry files only. Does not execute target repository code.
import {readFileSync,existsSync,realpathSync} from 'node:fs';
import {resolve,relative,isAbsolute,basename} from 'node:path';
import {fileURLToPath} from 'node:url';

export function inspectSnapshot({files,metadata,entry=''}){
  const rows=[];
  const add=(check,status,detail)=>rows.push({check,status,detail});
  const required=['pet.json','README.md','AGENTS.md','CLAUDE.md','LICENSE'];
  const absent=required.filter(name=>!files.includes(name));
  add('A14',absent.length?'Missing':'Pass',absent.length?'Required files: '+absent.join(', '):'Required repository files exist (content and topic not certified).');
  if(!metadata||typeof metadata!=='object'||Array.isArray(metadata)){
    add('A16','Incorrect','pet.json is not a JSON object.');return rows;
  }
  const gaps=['pet','kind','owner','job','runs_on','status'].filter(k=>typeof metadata[k]!=='string'||!metadata[k].trim());
  for(const key of ['entry','sprite'])if(typeof metadata[key]!=='string'||!files.includes(metadata[key]))gaps.push(key+' target');
  if(!metadata.audit||typeof metadata.audit.cadence!=='string')gaps.push('audit cadence');
  if(!metadata.framework)gaps.push('framework declaration');
  add('A16',gaps.length?'Missing':'Pass',gaps.length?'Metadata: '+gaps.join(', '):'Basic metadata and declared local targets exist; maturity remains unverified.');
  const tools=metadata.tools;
  add('A18',Array.isArray(tools)&&tools.length?'Not verified':'Missing',Array.isArray(tools)&&tools.length?'Declared tool inventory exists; compare each declaration with real behavior.':'No declared tool inventory.');
  add('A41',entry.includes('Clicker Training')?'Not verified':'Missing',entry.includes('Clicker Training')?'Training source exists; desktop click timing and actions need live verification.':'No Clicker Training section found in the inspected entry source.');
  add('A44',entry.includes('data-astra-phone-baseline')?'Not verified':'Missing',entry.includes('data-astra-phone-baseline')?'Shared phone source exists; inspect rendered chat and host behavior.':'Shared phone baseline not found.');
  add('A45',entry.includes('data-astra-paper-data')?'Not verified':'Missing',entry.includes('data-astra-paper-data')?'Paper/zoom source exists; browser viewport acceptance is separate.':'Shared stationery source not found.');
  for(const check of ['A19','A20','A21','A22','A25','A26','A27','A28','A29','A30','A32','A39','A43','A46','A47','A48','A49','A50','A51'])add(check,'Not verified','Needs runtime, provenance or visual evidence; this preflight never certifies it.');
  return rows;
}

export function inspectFolder(folder){
  const root=realpathSync(folder),files=[];
  const safeRead=name=>{
    if(typeof name!=='string'||isAbsolute(name)||name.includes('\\'))return null;
    const path=resolve(root,name),rel=relative(root,path);
    if(rel.startsWith('..')||isAbsolute(rel)||!existsSync(path))return null;
    const actual=relative(root,realpathSync(path));
    if(actual.startsWith('..')||isAbsolute(actual))return null;
    try{const text=readFileSync(path,'utf8');files.push(name);return text;}catch{return null;}
  };
  let metadata=null;
  const raw=safeRead('pet.json');try{metadata=JSON.parse(raw);}catch{}
  for(const name of ['README.md','AGENTS.md','CLAUDE.md','LICENSE'])safeRead(name);
  const entry=safeRead(metadata?.entry)||'';safeRead(metadata?.sprite);
  return {repo:basename(root),scope:'Local metadata/source preflight only; no code execution or network access',results:inspectSnapshot({files,metadata,entry})};
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  if(!process.argv[2]){console.error('Usage: node scripts/flash-audit-local-20261015.mjs <repository-folder>');process.exitCode=2;}
  else {try{console.log(JSON.stringify(inspectFolder(process.argv[2]),null,2));}catch{console.error('Unable to inspect the selected repository.');process.exitCode=1;}}
}
