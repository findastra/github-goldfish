import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadEngine } from '../scripts/load-engine.mjs';

const G = loadEngine();
const repo = (name, over = {}) => ({
  name, description: 'A plain sentence.', homepage: '', topics: ['x'], license: 'MIT', archived: false, fork: false,
  default_branch: 'main', html_url: `https://github.com/me/${name}`, files: { 'README.md': `# ${name}\n\nHello.\n` }, tree: null, ...over,
});
const run = (repos, extra = {}) => G.audit({ user: 'me', profile: { bio: 'hi' }, repos, ...extra });
const has = (fs, re, repoName) => fs.some((f) => re.test(f.msg) && (!repoName || f.repo === repoName));

test('clean repo yields no errors or warnings', () => {
  const fs = run([repo('good-one'), repo('me')]);
  assert.equal(G.summarize(fs).by.error, 0);
  assert.equal(G.summarize(fs).by.warn, 0);
});

test('literal HTML entity in a description is an error', () => {
  const fs = run([repo('a', { description: 'Show what you&#39;re using.' })]);
  assert.ok(has(fs, /HTML entity/, 'a'));
});

test('doubled word, typo and mojibake', () => {
  const fs = run([repo('a', { files: { 'README.md': '# a\n\nThis is is a test. We recieve data. Itâ€™s odd.\n' } })]);
  assert.ok(has(fs, /Doubled word: "is is"/));
  assert.ok(has(fs, /typo: "recieve"/));
  assert.ok(has(fs, /mojibake/));
});

test('code blocks do not trigger prose checks', () => {
  const fs = run([repo('a', { files: { 'README.md': '# a\n\n```\nthe the TODO github\n```\n\nUse `github` here.\n' } })]);
  assert.equal(fs.filter((f) => f.cat === 'Blatant').length, 0);
});

test('brand spellings, but not in URLs or repo names', () => {
  const fs = run([repo('a', { files: { 'README.md': '# a\n\nPush to github and Github. See https://github.com/x/y and vrchat-ai-astra.\n' } })]);
  const brand = fs.filter((f) => /Brand spelled/.test(f.msg));
  assert.equal(brand.length, 2);
});

test('secrets are errors and are redacted', () => {
  const tok = 'ghp_' + 'a'.repeat(36);
  const fs = run([repo('a', { files: { 'README.md': `# a\n\n\`\`\`\n${tok}\n\`\`\`\n` } })]);
  const f = fs.find((x) => /secret/.test(x.msg));
  assert.ok(f);
  assert.equal(f.sev, 'error');
  assert.ok(!f.evidence.includes('aaaaaa'));
});

test('personal paths and emails are flagged, placeholders and URLs are not', () => {
  const fs = run([repo('a', { files: { 'README.md': '# a\n\nSee C:\\Users\\jane\\x and C:\\Users\\<you>\\x, https://vrchat.com/home/world/wrld_1 and bob@real.org, t@sites.test.\n' } })]);
  assert.equal(fs.filter((f) => /Windows user folder/.test(f.msg)).length, 1);
  assert.equal(fs.filter((f) => /home folder/.test(f.msg)).length, 0);
  assert.equal(fs.filter((f) => /email/.test(f.msg)).length, 1);
});

test('never-say words are errors, case-insensitive and whole-word; blanks are ignored', () => {
  const fs = run([repo('a', { files: { 'README.md': '# a\n\nBuilt at ACME Corp by Jane Doe, not Janet Doeman.\n' } })], { neverSay: ['Acme Corp', 'Jane Doe', ' '] });
  assert.equal(fs.filter((f) => /never to find/.test(f.msg)).length, 2);
});

test('link to a repo that does not exist, with reorder hint', () => {
  const fs = run([repo('vrchat-ai-astra'), repo('me', { files: { 'README.md': '# me\n\n- [`ai-astra-vrchat`](https://github.com/me/ai-astra-vrchat) -- bridge\n' } })]);
  const f = fs.find((x) => /does not exist publicly/.test(x.msg));
  assert.ok(f);
  assert.match(f.fix, /vrchat-ai-astra/);
});

test('relative links and anchors are checked against the file tree and headings', () => {
  const fs = run([repo('a', { tree: ['README.md', 'docs/a.md'], files: { 'README.md': '# a\n\n[ok](docs/a.md) [bad](docs/zzz.md) [case](Docs/a.md) [go](#nope) [here](#a)\n' } })]);
  assert.equal(fs.filter((f) => /missing from the repo/.test(f.msg)).length, 1);
  assert.equal(fs.filter((f) => /letter case/.test(f.msg)).length, 1);
  assert.equal(fs.filter((f) => /Anchor link #nope/.test(f.msg)).length, 1);
});

test('document control: missing README, unclosed fence, junk and secret files', () => {
  const fs = run([repo('a', { files: {}, tree: ['.env', 'notes (1).txt', '.DS_Store'] }), repo('b', { files: { 'README.md': '# b\n\n```\nopen\n' } })]);
  assert.ok(has(fs, /No README/, 'a'));
  assert.ok(has(fs, /secrets-type file/, 'a'));
  assert.ok(has(fs, /uncontrolled copy/, 'a'));
  assert.ok(has(fs, /System junk/, 'a'));
  assert.ok(has(fs, /never closed/, 'b'));
});

test('license: missing and unrecognized both warn', () => {
  const fs = run([repo('a', { license: null }), repo('b', { license: 'NOASSERTION' })]);
  assert.ok(has(fs, /No LICENSE/, 'a'));
  assert.ok(has(fs, /cannot identify/, 'b'));
});

test('pet app rules', () => {
  const petJson = JSON.stringify({ pet: 'Fish', kind: 'thing', owner: 'Someone', sprite: 'sprite.json', job: 'j', runs_on: 'browser', entry: 'index.html', status: 'swimming', cage: { topic: 'pet-app', home: 'README.md' } });
  const fs = run([repo('fishy', { topics: [], files: { 'README.md': '# Fishy\n\nNo credit here.\n', 'pet.json': petJson }, tree: ['README.md', 'pet.json', 'index.html'] })]);
  assert.ok(has(fs, /not the GitHub topic/, 'fishy'));
  assert.ok(has(fs, /"kind" should be/, 'fishy'));
  assert.ok(has(fs, /"owner" should be "Astra"/, 'fishy'));
  assert.ok(has(fs, /"status" should be/, 'fishy'));
  assert.ok(has(fs, /sprite.*not in the repo/, 'fishy'));
  assert.ok(has(fs, /A pet app by Astra/, 'fishy'));
  assert.ok(has(fs, /No AGENTS.md/, 'fishy'));
  assert.ok(has(fs, /No model name and version/, 'fishy'));
});

test('a well-formed pet app passes the pet checks', () => {
  const petJson = JSON.stringify({ pet: 'Fish', kind: 'pet-app', owner: 'Astra', sprite: 'sprite.json', job: 'j', runs_on: 'browser', entry: 'index.html', status: 'hatching', cage: { topic: 'pet-app', home: 'README.md' }, built_with: 'Claude Sonnet 5.5' });
  const md = '# Fishy\n\n*A pet app by Astra.*\n\n## Run it\n\nOpen it.\n\n## Limits\n\nNone.\n';
  const fs = run([repo('fishy', { topics: ['pet-app'], files: { 'README.md': md, 'pet.json': petJson, 'AGENTS.md': '# A\nBuilt with Claude Sonnet 5.5.\n', 'CLAUDE.md': '# C\n' }, tree: ['README.md', 'pet.json', 'index.html', 'sprite.json', 'AGENTS.md', 'CLAUDE.md'] })]);
  assert.equal(fs.filter((f) => f.repo === 'fishy' && f.sev !== 'note').length, 0, JSON.stringify(fs, null, 1));
});

test('organizational: stub not archived, branch, naming, profile blurb mismatch', () => {
  const fs = run([
    repo('Old_Name', { description: 'Moved: lives elsewhere.', default_branch: 'dev' }),
    repo('role-fairy', { description: 'A cute single-choice Discord role picker for new members.' }),
    repo('me', { files: { 'README.md': '## hi\n\n- [`role-fairy`](https://github.com/me/role-fairy) -- a bot for managing server roles\n' } }),
  ]);
  assert.ok(has(fs, /"Moved:" stub/, 'Old_Name'));
  assert.ok(has(fs, /not "main"/, 'Old_Name'));
  assert.ok(has(fs, /lowercase words/, 'Old_Name'));
  assert.ok(has(fs, /say different things/, 'me'));
});

test('systemic: Cage registry both directions', () => {
  const petJson = JSON.stringify({ pet: 'F', kind: 'pet-app', owner: 'Astra', sprite: 's', job: 'j', runs_on: 'r', entry: 'e', status: 'grown', cage: { topic: 'pet-app', home: 'README.md' } });
  const fs = run([repo('fishy', { topics: ['pet-app'], files: { 'README.md': '# Fishy\n', 'pet.json': petJson } })], { registry: { pets: [{ repo: 'ghost-pet' }] } });
  assert.ok(has(fs, /not listed in the Cage registry/, 'fishy'));
  assert.ok(has(fs, /"ghost-pet", which does not exist/));
});

test('registry entries marked published:false are not errors; the Cage repo itself is audited as a pet', () => {
  const reg = { pets: [{ repo: 'not-yet', published: false }, { repo: 'findastra-pet-apps' }] };
  const fs = run([repo('findastra-pet-apps', { topics: [], files: { 'README.md': '# Findastra Pet Apps\n', 'pet.json': '{"pet":"Friendly Farmer"}' } })], { registry: reg });
  assert.ok(!has(fs, /"not-yet", which does not exist/));
  assert.ok(has(fs, /not the GitHub topic/, 'findastra-pet-apps'));
});

test('systemic: mixed apostrophes and dashes are reported once for the account', () => {
  const mk = (n, t) => repo(n, { files: { 'README.md': `# ${n}\n\n${t}\n` } });
  const fs = run([mk('a', "It's Astra's and Mommy's."), mk('b', 'Don’t panic.'), mk('c', "That's it — done — ok."), mk('d', 'x -- y')]);
  assert.equal(fs.filter((f) => f.repo === '(whole account)' && /apostrophes/.test(f.where)).length, 1);
  assert.equal(fs.filter((f) => f.repo === '(whole account)' && /dashes/.test(f.where)).length, 1);
});

test('forks are skipped and findings are sorted errors first', () => {
  const fs = run([repo('fork-of-x', { fork: true, files: { 'README.md': 'TODO\n' } }), repo('z', { description: '', license: null })]);
  assert.ok(!fs.some((f) => f.repo === 'fork-of-x'));
  assert.equal(fs[0].sev, 'error');
});

test('markdown report lists every finding', () => {
  const fs = run([repo('a', { description: '' })]);
  const md = G.toMarkdown(fs, { user: 'me', when: '2026-10-07', repoCount: 1, notes: ['x'] });
  assert.match(md, /# GitHub Goldfish report for me/);
  assert.match(md, /no description/i);
  assert.match(md, /Not covered this run/);
});

test('collect: paging, rate limit message, missing user', async () => {
  const mkRes = (status, body) => ({ status, ok: status < 300, json: async () => body, text: async () => (typeof body === 'string' ? body : '') });
  await assert.rejects(G.collect('nobody-here', { fetchFn: async () => mkRes(404, {}) }), /No GitHub account/);
  await assert.rejects(G.collect('x', { fetchFn: async () => mkRes(403, {}) }), /rate-limiting/);
  await assert.rejects(G.collect('bad name!', { fetchFn: async () => mkRes(200, {}) }), /username/);
  const fetchFn = async (url) => {
    if (url.endsWith('/users/me')) return mkRes(200, { name: 'Me', bio: null });
    if (url.includes('/users/me/repos')) return mkRes(200, [{ name: 'r', description: 'd', topics: [], license: null, default_branch: 'main', html_url: 'u' }]);
    if (url.includes('/git/trees/')) return mkRes(200, { tree: [{ type: 'blob', path: 'README.md', size: 5 }] });
    if (url.includes('raw.githubusercontent.com') && url.endsWith('README.md')) return mkRes(200, '# r\n');
    return mkRes(404, '');
  };
  const data = await G.collect('me', { fetchFn });
  assert.equal(data.repos.length, 1);
  assert.equal(data.repos[0].files['README.md'], '# r\n');
  assert.ok(data.notes.some((n) => /No findastra-pet-apps/.test(n)));
});

test('the sprite embedded in index.html matches sprite.json (run scripts/sync-sprite.mjs if not)', async () => {
  const { readFileSync } = await import('node:fs');
  const { fileURLToPath } = await import('node:url');
  const read = (f) => readFileSync(fileURLToPath(new URL(`../${f}`, import.meta.url)), 'utf8');
  const sprite = JSON.parse(read('sprite.json'));
  const m = /\/\*sprite:start\*\/([\s\S]*?)\/\*sprite:end\*\//.exec(read('index.html'));
  assert.deepEqual(JSON.parse(m[1]), sprite);
  const moods = ['idle', 'blink', 'happy', 'curious', 'worried', 'sad', 'sick', 'alarmed', 'sleep'];
  assert.deepEqual(Object.keys(sprite.frames), moods);
  for (const mood of moods) {
    const f = sprite.frames[mood];
    assert.equal(f.rows.length, 32, mood);
    assert.ok(f.rows.every((r) => r.length === 32), `${mood} is 32 wide`);
  }
});
