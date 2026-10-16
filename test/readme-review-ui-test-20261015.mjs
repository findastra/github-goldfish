import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';

test('failed push refreshes authoritative state and displays the partial publication',async()=>{
  const nodes=new Map();
  const element=()=>({textContent:'',value:'',children:[],classList:{toggle(){}},setAttribute(){},append(...items){this.children.push(...items);},replaceChildren(){this.children=[];}});
  const document={getElementById(id){if(!nodes.has(id))nodes.set(id,element());return nodes.get(id);},createElement:element};
  const initial={enabled:true,status:'awaiting-review',busy:false,events:[],validationVersion:2,draft:{readme:'draft',hash:'approved'},review:{approved:true,findings:[]},draftAudit:{ok:true,expected:80,matched:80,missing:[],duplicates:[],wrongIds:[],tailFindings:[],errors:[],throughLine:100}};
  const failed={...initial,status:'publish-failed',publication:{stage:'content-pushed',commit:'commit',branchUrl:'https://github.com/findastra/findastra/tree/review'}};
  let reads=0;
  const fetch=async(path)=>path==='/api/push'?{ok:false,json:async()=>({error:'PR unavailable'})}:{ok:true,json:async()=>++reads===1?initial:failed};
  const html=readFileSync(new URL('../readme-auditor-20261015.html',import.meta.url),'utf8');
  const script=html.match(/<script>([\s\S]*?)<\/script>/)[1];
  runInNewContext(script,{document,fetch,URLSearchParams,location:{hash:'',pathname:'/'},sessionStorage:{getItem(){return 'test';}},history:{},setTimeout,clearTimeout,Date});
  await new Promise(r=>setTimeout(r,10));
  assert.equal(nodes.get('push').disabled,false);
  assert.match(nodes.get('draft-coverage').textContent,/80\/80 catalog entries/);
  await nodes.get('push').onclick();
  assert.equal(reads,2);assert.equal(nodes.get('push').disabled,true);
  assert.equal(nodes.get('result').children[1].href,failed.publication.branchUrl);
  assert.match(nodes.get('status').textContent,/publish failed/);
});
