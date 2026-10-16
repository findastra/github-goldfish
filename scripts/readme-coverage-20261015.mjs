// Deterministic whole-profile coverage. Public catalog identity is independent of repository visibility.
const normalize = value => String(value || '').toLowerCase().replace(/[’‘]/g, "'").replace(/[*_`]/g, '').replace(/\s+/g, ' ').trim();
const escape = value => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const named = (text, name) => new RegExp('(?:^|[^a-z0-9])' + escape(normalize(name)) + '(?=$|[^a-z0-9])', 'i').test(normalize(text));

export function reconcileCatalog(snapshots, repos) {
  const publicRepos = new Set(repos.map(r => r.name.toLowerCase()));
  const byNumber = new Map(), sourceIssues = [], registryEntries = [], warnings = [];
  for (const snapshot of snapshots) {
    if (!Array.isArray(snapshot.catalog?.programs) || !snapshot.catalog.programs.length ||
        !Array.isArray(snapshot.registry?.pets) || !Array.isArray(snapshot.registry?.pipeline) || !Array.isArray(snapshot.registry?.seeds?.pets)) {
      throw Error('Incomplete public catalog or registry snapshot: ' + snapshot.ref);
    }
    const seen = new Set();
    for (const p of snapshot.catalog.programs) {
      if (!Number.isInteger(p.number) || p.number < 1 || typeof p.icon !== 'string' || !p.icon.trim() || seen.has(p.number)) {
        throw Error('Invalid or duplicate catalog identity in ' + snapshot.ref);
      }
      seen.add(p.number);
      const prior = byNumber.get(p.number);
      if (prior && (normalize(prior.icon) !== normalize(p.icon) || prior.catalogRepo !== p.repo)) {
        sourceIssues.push('Catalog identity conflict for #' + p.number + ' between published sources.');
        continue;
      }
      if(prior){
        if(prior.stage!==p.stage || prior.description!==(p.mini_descriptor?.text||'') || prior.program!==p.program || prior.assigned!==p.assigned){
          warnings.push('#'+p.number+' '+p.icon+': installed branch metadata differs; public main description and stage take precedence.');
        }
        continue;
      }
      // A name already published in the public catalog remains visible without a public repository link.
      byNumber.set(p.number, {number:p.number, icon:p.icon, catalogRepo:p.repo || null,
        repo:typeof p.repo === 'string' && publicRepos.has(p.repo.toLowerCase()) ? p.repo : null,
        program:p.program, assigned:p.assigned, stage:p.stage, description:p.mini_descriptor?.text || prior?.description || '', source:snapshot.ref});
    }
    for (const [kind, entries] of [['registered', snapshot.registry.pets], ['pipeline', snapshot.registry.pipeline], ['seed', snapshot.registry.seeds.pets]]) {
      for (const p of entries) {
        registryEntries.push({name:p.pet, repo:p.repo, kind, source:snapshot.ref});
        if (p.repo && p.visibility === 'private' && publicRepos.has(p.repo.toLowerCase())) {
          warnings.push(p.pet + ': registry visibility says private; the current GitHub listing is public.');
        }
      }
    }
  }
  const programs = [...byNumber.values()].sort((a,b) => a.number-b.number);
  const names = new Set(), identities = new Set();
  for (const p of programs) {
    if (names.has(normalize(p.icon)) || (p.catalogRepo && identities.has(p.catalogRepo))) sourceIssues.push('Duplicate animal or repository identity in catalog: #' + p.number + '.');
    names.add(normalize(p.icon)); if (p.catalogRepo) identities.add(p.catalogRepo);
  }
  const registry = [...new Map(registryEntries.map(p => [normalize(p.name), p])).values()];
  for (const p of registry) {
    if (!programs.some(q => normalize(q.icon) === normalize(p.name))) sourceIssues.push('Registry animal is absent from the catalog: ' + p.name + '.');
  }
  for(const p of programs.filter(p=>!p.repo)){
    const aliases=repos.filter(r=>named(r.description,p.icon)&&new RegExp('#'+p.number+'\\b').test(r.description||''));
    if(aliases.length>1)sourceIssues.push('Several public repositories claim catalog #'+p.number+' '+p.icon+'.');
    if(aliases.length===1){p.repo=aliases[0].name;warnings.push('#'+p.number+' '+p.icon+': public repository metadata explicitly identifies '+p.repo+'; catalog repository '+(p.catalogRepo||'(none)')+' is stale.');}
  }
  const linked=new Set();for(const p of programs.filter(p=>p.repo)){if(linked.has(p.repo))sourceIssues.push('Several catalog animals map to public repository '+p.repo+'.');linked.add(p.repo);}
  if (sourceIssues.length) throw Error(sourceIssues.join(' '));
  return {programs, registryCoverage:{expected:registry.length, matched:registry.length}, sourceWarnings:[...new Set(warnings)],
    sources:snapshots.map((s,i) => ({ref:s.ref,commit:s.commit,url:s.url,label:s.label,count:s.catalog.programs.length,
      additions:i ? s.catalog.programs.filter(p => !snapshots[0].catalog.programs.some(q => q.number === p.number)).map(p => ({number:p.number,icon:p.icon})) : []}))};
}

function visibleLines(text, includeDetails=false) {
  // Preserve line numbers while excluding material that GitHub will not render as prose.
  const clean = text.replace(/<!--[\s\S]*?-->/g, block => block.replace(/[^\n]/g, ' '));
  let fence = null, details = 0, htmlCode = 0;
  return clean.split(/\r?\n/).map((line,index) => {
    const match = line.match(/^ {0,3}(`{3,}|~{3,})(.*)$/);
    if(fence){if(match && match[1][0]===fence.char && match[1].length>=fence.length && !match[2].trim())fence=null;return {line:index+1,text:''};}
    if(match){fence={char:match[1][0],length:match[1].length};return {line:index+1,text:''};}
    const wasCode=htmlCode>0;
    for(const tag of line.matchAll(/<\s*(\/?)\s*(?:pre|code)\b[^>]*>/gi))htmlCode=tag[1]?Math.max(0,htmlCode-1):htmlCode+1;
    if(wasCode||htmlCode||/<\/?(?:pre|code)\b/i.test(line)||/^(?: {4}|\t|\s*>)/.test(line))return {line:index+1,text:''};
    if(/<details\b/i.test(line))details++;
    if(details){if(/<\/details>/i.test(line))details--;if(!includeDetails||/<\/?details\b|<\/?summary\b/i.test(line))return {line:index+1,text:''};}
    return {line:index+1,text:line};
  });
}

export function auditCoverage(text, evidence) {
  const programs = evidence.programs;
  if (!Array.isArray(programs) || !programs.length) return {ok:false,expected:0,matched:0,missing:[],duplicates:[],wrongIds:[],tailFindings:[],errors:['The full catalog is unavailable. Run a fresh audit.'],rows:[]};
  const lines = visibleLines(text), allLines=visibleLines(text,true), rows = [], errors = [], duplicates = [], wrongIds = [], tailFindings = [];
  for (const item of allLines) {
    const ordered = item.text.match(/^\s*(\d+)[.)]\s+(.+)/);
    const bullet = item.text.match(/^\s*[-*+]\s+(.+)/);
    if (!ordered && !bullet) continue;
    const body = ordered?.[2] || bullet[1];
    const id = ordered ? Number(ordered[1]) : Number(body.match(/^\*{0,2}#(\d+)\b/)?.[1]) || null;
    if (!ordered && !id && !body.includes(' -- ')) continue; // A prose cross-reference is not a roster row.
    const links = [...body.matchAll(/\]\(https:\/\/github\.com\/findastra\/([\w.-]+)\/?\)/g)].map(m=>m[1].toLowerCase());
    // Descriptions may refer to another animal. Identity is the name at the start of the row's description.
    const identity = normalize(body.includes(' -- ') ? body.split(' -- ')[0]+' '+body.split(' -- ')[1].split(/\s[·:]\s|\s*[(:]/)[0] : body);
    const matches = programs.filter(p => (p.repo && links[0] === p.repo.toLowerCase()) || ((!links.length||id) && named(identity,p.icon)));
    if (!matches.length) { if (id && body.includes(' -- ')) errors.push('Unknown roster ID #' + id + ' at line ' + item.line + '.'); continue; }
    if (matches.length !== 1) { errors.push('Ambiguous roster identity at line '+item.line+'.'); continue; }
    const p = matches[0];
    const visible=!!lines[item.line-1].text;
    rows.push({number:p.number,icon:p.icon,id,line:item.line,visible});
    if(!visible)errors.push('Row #'+p.number+' is hidden in a collapsed section. Keep the animal roster visible.');
    if (id !== p.number) wrongIds.push({number:p.number,icon:p.icon,actual:id,line:item.line});
    if (!named(body,p.icon)) errors.push('Row #' + p.number + ' is missing its animal name '+p.icon+'.');
    if (p.repo && links[0] !== p.repo.toLowerCase()) errors.push('Row #' + p.number + ' is missing its verified public repository link.');
    if (!p.repo && links.length) errors.push('Row #' + p.number + ' must have no repository link; none is verified public.');
  }
  const missing = programs.filter(p => !rows.some(r=>r.number===p.number&&r.visible)).map(p=>({number:p.number,icon:p.icon}));
  for (const p of programs) { const found=rows.filter(r=>r.number===p.number); if(found.length>1)duplicates.push({number:p.number,icon:p.icon,lines:found.map(r=>r.line)}); }
  const ids = rows.map(r=>r.id).filter(Number.isInteger);
  if (new Set(ids).size !== ids.length) errors.push('The roster repeats a displayed catalog ID.');
  for (let i=1;i<rows.length;i++) if(rows[i].number<rows[i-1].number) { errors.push('The roster is not in stable catalog order.'); break; }
  for (const item of allLines) {
    const prose=normalize(item.text);
    if (/^seeds\s*[,—:–-].*(?:named|waiting|hatch)/i.test(prose) ||
        (!rows.some(r=>r.line===item.line) && /\b(?:seeds|waiting to hatch)\b/.test(prose) && prose.includes(';') && programs.filter(p=>named(prose,p.icon)).length>1)) {
      tailFindings.push({line:item.line,message:'Separate seed roster repeats or contradicts the canonical animal list; consolidate it into the numbered rows.'});
    }
    const scout=programs.find(p=>p.icon==='Skill Scout');
    if (scout?.description && !/undecided|not decided/.test(scout.description.toLowerCase()) && named(prose,'Skill Scout') && /\b(?:undecided|not decided|to be decided)\b/.test(prose)) {
      tailFindings.push({line:item.line,message:'Skill Scout already has a defined job in the catalog; this text says it is undecided.'});
    }
  }
  errors.push(...missing.map(p=>'Missing #'+p.number+' '+p.icon+'.'),...duplicates.map(p=>'Duplicate #'+p.number+' '+p.icon+'.'),
    ...wrongIds.map(p=>'Wrong ID for '+p.icon+': expected #'+p.number+', found '+(p.actual===null?'no ID':'#'+p.actual)+'.'),...tailFindings.map(p=>'Line '+p.line+': '+p.message));
  const last=lines.filter(p=>p.text.trim()).at(-1);
  return {ok:errors.length===0,expected:programs.length,matched:programs.length-missing.length,missing,duplicates,wrongIds,tailFindings,errors,
    throughLine:lines.length,lastContentLine:last?.line||0,lastContentText:last?.text.slice(0,240)||'',rows};
}
