import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadEngine } from '../scripts/load-engine.mjs';
import { mkdtempSync, writeFileSync, unlinkSync, rmdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

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

test('learned naming corrections apply only to the configured repository and preserve line numbers', () => {
  const namingRules = [{ repo: ' ME/BLUE-HALL ', from: 'Blue World', to: 'Blue Hall' }];
  const fs = run([
    repo('blue-hall', { description: 'Visit BLUE WORLD.', files: { 'README.md': '# Blue Hall\n\nWelcome to Blue World.\n' } }),
    repo('other', { description: 'Visit Blue World.' }),
  ], { namingRules, profile: { bio: 'Blue World' } });
  const learned = fs.filter((f) => /Learned naming correction/.test(f.msg));
  assert.equal(learned.length, 2);
  assert.ok(learned.every((f) => f.repo === 'blue-hall' && f.sev === 'warn' && f.fix.includes('Blue Hall')));
  assert.equal(learned.find((f) => f.where === 'README.md').line, 3);
  assert.equal(run([repo('blue-hall', { description: 'Blue World' })], { user: 'another', namingRules }).filter((f) => /Learned naming correction/.test(f.msg)).length, 0);
});

test('learned names ignore correct names, code, URLs, placeholders, and longer words', () => {
  const files = { 'README.md': '# Blue Hall\n\nBlue Hall. Blue Worlds. MyBlue World. Blue World_extra.\n\n```\nBlue World\n```\n\n`Blue World` [link](https://example.test/Blue%20World) <Blue World>\n' };
  const namingRules = [{ repo: 'me/blue-hall', from: 'Blue World', to: 'Blue Hall' }];
  assert.ok(!has(run([repo('blue-hall', { files, description: '<Blue World> https://example.test/BlueWorld' })], { namingRules }), /Learned naming correction/));
  assert.ok(!has(run([repo('blue-hall', { description: 'Blue World' })]), /Learned naming correction/));
  assert.ok(!has(run([repo('blue-hall', { description: 'Blue Hall', files: { 'README.md': '# Blue Hall\n' } })], { namingRules: [{ repo: 'me/blue-hall', from: 'Blue', to: 'Blue Hall' }] }), /Learned naming correction/));
});

test('learned names are literal text and can correct capitalization without flagging the preferred spelling', () => {
  const namingRules = [
    { repo: 'me/blue-hall', from: 'Blue (Old)+', to: 'Blue Hall' },
    { repo: 'me/blue-hall', from: 'bluehall', to: 'BlueHall' },
  ];
  const fs = run([repo('blue-hall', { description: 'Blue (Old)+ Blue Old BlueHall bluehall BLUEHALL' })], { namingRules });
  assert.equal(fs.filter((f) => /Learned naming correction/.test(f.msg)).length, 3);
});

test('naming rule validation rejects ambiguous or malformed input before auditing', () => {
  const rule = { repo: 'me/blue-hall', from: 'Blue World', to: 'Blue Hall' };
  assert.equal(G.normalizeNamingRules([rule, rule]).length, 1);
  for (const rules of [null, {}, [null], [{ ...rule, repo: 'blue-hall' }], [{ ...rule, from: '' }], [{ ...rule, to: 'Blue\nHall' }], [{ ...rule, to: rule.from }], [rule, { ...rule, to: 'Other Hall' }]]) {
    assert.throws(() => run([], { namingRules: rules }), /Naming correction/);
  }
});

test('CLI applies private naming rules to an offline snapshot', () => {
  const dir = mkdtempSync(join(tmpdir(), 'goldfish-test-'));
  const day = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Denver', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date()).replace(/-/g, '');
  const snapshot = join(dir, `audit-snapshot-${day}.json`);
  const rules = join(dir, `naming-rules-${day}.json`);
  try {
    writeFileSync(snapshot, JSON.stringify({ user: 'me', profile: { bio: 'Hello.' }, repos: [repo('blue-hall', { description: 'Blue World' }), repo('me')], notes: [] }));
    writeFileSync(rules, '\uFEFF' + JSON.stringify([{ repo: 'me/blue-hall', from: 'Blue World', to: 'Blue Hall' }]));
    const result = spawnSync(process.execPath, [fileURLToPath(new URL('../scripts/goldfish-cli.mjs', import.meta.url)), '--snapshot', snapshot, '--naming-rules', rules], { encoding: 'utf8' });
    assert.equal(result.status, 0, result.stderr);
    assert.match(result.stdout, /Learned naming correction: use "Blue Hall" instead of "Blue World"/);
  } finally {
    for (const file of [snapshot, rules]) { try { unlinkSync(file); } catch (e) { if (e.code !== 'ENOENT') throw e; } }
    rmdirSync(dir);
  }
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

/* ---------- private repos ---------- */
const mkRes = (status, body, hdrs = {}) => ({
  status, ok: status >= 200 && status < 300, headers: { get: (k) => (k.toLowerCase() in hdrs ? hdrs[k.toLowerCase()] : null) },
  json: async () => body, text: async () => (typeof body === 'string' ? body : ''),
});
const ghRepo = (name, over = {}) => ({ name, description: 'd', topics: ['x'], license: { spdx_id: 'MIT' }, default_branch: 'main', html_url: `https://github.com/me/${name}`, private: false, ...over });
// A fake GitHub: records every request so tests can see which endpoints were used and where the token went.
function fakeGitHub({ login = 'me', scopes = null } = {}) {
  const calls = [];
  const fetchFn = async (url, init = {}) => {
    const auth = init.headers && init.headers.Authorization;
    calls.push({ url, auth, accept: init.headers && init.headers.Accept });
    if (url.endsWith('/users/me')) return mkRes(200, { name: 'Me', bio: 'hi' });
    if (url === 'https://api.github.com/user') return auth ? mkRes(200, { login }, scopes == null ? {} : { 'x-oauth-scopes': scopes }) : mkRes(401, {});
    if (url.includes('/user/repos')) return mkRes(200, [ghRepo('open'), ghRepo('secret-lab', { private: true, visibility: 'private' })]);
    if (url.includes('/users/me/repos')) return mkRes(200, [ghRepo('open')]);
    if (url.includes('/git/trees/')) return mkRes(200, { tree: [{ type: 'blob', path: 'README.md', size: 9 }] });
    if (url.startsWith('https://raw.githubusercontent.com/me/open/') && url.endsWith('README.md')) return mkRes(200, '# open\n');
    if (url.startsWith('https://api.github.com/repos/me/secret-lab/contents/README.md?ref=main')) return auth ? mkRes(200, '# secret lab\n') : mkRes(404, {});
    return mkRes(404, '');
  };
  return { calls, fetchFn };
}

test('collect: a token for the account lists private repos and reads them only through api.github.com', async () => {
  const gh = fakeGitHub();
  const data = await G.collect('me', { token: 'tok', fetchFn: gh.fetchFn });
  assert.equal(data.scope, 'all');
  assert.equal(data.repos.map((r) => `${r.name}:${r.private}`).join(' '), 'open:false secret-lab:true');
  assert.equal(data.repos[1].files['README.md'], '# secret lab\n');
  assert.ok(gh.calls.some((c) => c.url.includes('/user/repos') && /visibility=all/.test(c.url) && /affiliation=owner/.test(c.url)));
  assert.ok(gh.calls.some((c) => c.url.includes('/contents/README.md') && c.accept === 'application/vnd.github.raw'));
  assert.ok(gh.calls.filter((c) => !c.url.startsWith('https://api.github.com/')).every((c) => !c.auth), 'token must never leave api.github.com');
  assert.ok(!gh.calls.some((c) => c.url.includes('raw.githubusercontent.com/me/secret-lab')));
  assert.ok(!data.notes.some((n) => /Private repos were not read/.test(n)));
});

test('collect: without a token, with another account\'s token, or with --public-only, only public repos are read', async () => {
  for (const [opts, note] of [[{}, /Private repos were not read/], [{ token: 'tok', login: 'someone' }, /belongs to someone, not me/], [{ token: 'tok', publicOnly: true }, /left out on request/]]) {
    const gh = fakeGitHub({ login: opts.login || 'me' });
    const data = await G.collect('me', { token: opts.token, publicOnly: opts.publicOnly, fetchFn: gh.fetchFn });
    assert.equal(data.scope, 'public');
    assert.equal(data.repos.map((r) => r.name).join(' '), 'open');
    assert.ok(!gh.calls.some((c) => c.url.includes('/user/repos')));
    assert.ok(data.notes.some((n) => note.test(n)), JSON.stringify(data.notes));
  }
});

test('collect: a rejected token says so, and a classic token without the repo scope is flagged', async () => {
  const bad = async (url) => (url.endsWith('/users/me') ? mkRes(200, { name: 'Me' }) : mkRes(401, {}));
  await assert.rejects(G.collect('me', { token: 'nope', fetchFn: bad }), /rejected the token/);
  const noRepo = await G.collect('me', { token: 'tok', fetchFn: fakeGitHub({ scopes: 'read:user, gist' }).fetchFn });
  assert.ok(noRepo.notes.some((n) => /no "repo" scope/.test(n)));
  const withRepo = await G.collect('me', { token: 'tok', fetchFn: fakeGitHub({ scopes: 'repo, gist' }).fetchFn });
  assert.ok(!withRepo.notes.some((n) => /scope/.test(n)));
});

test('public text linking to a private repo is an error; private-to-private links and plain mentions are not', () => {
  const link = 'See [lab](https://github.com/me/secret-lab).';
  const fs = run([
    repo('open', { files: { 'README.md': `# open\n\n${link}\n` } }),
    repo('secret-lab', { private: true }),
    repo('other-private', { private: true, files: { 'README.md': `# other private\n\n${link} Also \`https://github.com/me/secret-lab\` in code.\n` } }),
  ]);
  const f = fs.filter((x) => /Link to a private repo/.test(x.msg));
  assert.equal(f.length, 1);
  assert.equal(f[0].repo, 'open');
  assert.equal(f[0].sev, 'error');
  assert.ok(!has(fs, /does not exist publicly/));
});

test('private repos are not nagged about public-only things: license is a note, no topics and profile listing are quiet', () => {
  const fs = run([
    repo('lab', { private: true, license: null, topics: [] }),
    repo('me', { files: { 'README.md': '# me\n\nHello.\n' } }),
  ]);
  const lic = fs.find((x) => x.repo === 'lab' && x.where === 'LICENSE');
  assert.equal(lic.sev, 'note');
  assert.ok(!has(fs, /No topics/, 'lab'));
  assert.ok(!has(fs, /does not list lab/));
  assert.ok(!fs.some((x) => x.repo === '(whole account)' && /license|topics/.test(x.where)));
  // the same repo, public, still warns
  const pubFs = run([repo('lab', { license: null, topics: [] })]);
  assert.equal(pubFs.find((x) => x.repo === 'lab' && x.where === 'LICENSE').sev, 'warn');
  assert.ok(has(pubFs, /No topics/, 'lab'));
});

test('text checks still run on private repos, with wording that does not claim the text is public', () => {
  const md = '# lab\n\nMail bob@real.org. TODO. teh end. {{name}}\n';
  const fs = run([repo('lab', { private: true, files: { 'README.md': md } })]);
  assert.ok(has(fs, /email address is in this private repo/, 'lab'));
  assert.ok(!has(fs, /email address is public/, 'lab'));
  assert.ok(has(fs, /Unfinished text/, 'lab'));
  assert.ok(has(fs, /typo: "teh"/, 'lab'));
  assert.ok(has(fs, /placeholder left in the text/, 'lab'));
  assert.ok(has(run([repo('lab', { files: { 'README.md': md } })]), /email address is public/, 'lab'));
});

test('Cage registry: a published entry that is private is an error; published:false is not', () => {
  const reg = (published) => ({ pets: [{ repo: 'hidden-pet', ...(published === undefined ? {} : { published }) }] });
  const repos = [repo('hidden-pet', { private: true })];
  assert.ok(has(run(repos, { registry: reg() }), /is private, so visitors get a 404/));
  assert.ok(!has(run(repos, { registry: reg(false) }), /is private/));
  assert.ok(!has(run([repo('hidden-pet')], { registry: reg() }), /is private/));
});

test('markdown report says how many repos are private and labels them', () => {
  const repos = [repo('open', { description: '' }), repo('lab', { private: true, description: '' })];
  const fs = run(repos);
  const md = G.toMarkdown(fs, { user: 'me', when: '2026-10-09', scope: 'all', repoCount: 2, repos, notes: [] });
  assert.match(md, /2 repos \(1 private\)/);
  assert.match(md, /## lab \(private\)/);
  assert.match(md, /names private repos/);
  const pubMd = G.toMarkdown(fs, { user: 'me', when: '2026-10-09', repoCount: 2, notes: [] });
  assert.match(pubMd, /2 public repos/);
  assert.doesNotMatch(pubMd, /private/);
});

test('CLI --public-only is accepted and snapshots without a scope read as public', () => {
  const dir = mkdtempSync(join(tmpdir(), 'goldfish-test-'));
  const snapshot = join(dir, 'audit-snapshot-20261009.json');
  try {
    writeFileSync(snapshot, JSON.stringify({ user: 'me', profile: { bio: 'Hello.' }, repos: [repo('a'), repo('me')], notes: [] }));
    const cli = fileURLToPath(new URL('../scripts/goldfish-cli.mjs', import.meta.url));
    const result = spawnSync(process.execPath, [cli, '--snapshot', snapshot, '--public-only'], { encoding: 'utf8' });
    assert.equal(result.status, 0, result.stderr);
    assert.match(result.stdout, /across 2 public repos/);
  } finally {
    try { unlinkSync(snapshot); } catch (e) { if (e.code !== 'ENOENT') throw e; }
    rmdirSync(dir);
  }
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

test('dated browser entry keeps the canonical engine and UI synchronized', async () => {
  const { readFileSync } = await import('node:fs');
  const canonical = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
  const dated = readFileSync(new URL('../github-goldfish-20261008.html', import.meta.url), 'utf8');
  assert.equal(dated, canonical);
});
