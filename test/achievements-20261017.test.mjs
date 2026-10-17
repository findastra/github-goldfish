// Achievement-tracker tool: lifts <script id="achievements"> out of index.html and tests the real code.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const src = /<script id="achievements">([\s\S]*?)<\/script>/.exec(html)[1];
const sandbox = { URL, console };
vm.createContext(sandbox);
vm.runInContext(src + '\n;this.A = GoldfishAchievements;', sandbox);
const A = sandbox.A;

test('index.html and the dated copy stay identical', () => {
  assert.equal(readFileSync(new URL('../github-goldfish-20261008.html', import.meta.url), 'utf8'), html);
});

test('the tool is registered as an Aquarium bubble with a Start Project button', () => {
  assert.match(html, /\['achievement-tracker','[^']+','achievements'\]/);
  assert.match(html, /textContent: 'Start Project'/);
});

test('tiers count up from thresholds and ignore missing data', () => {
  const shark = A.ACHIEVEMENTS.find((a) => a.id === 'pull-shark');
  assert.equal(A.tierFrom(shark, undefined), 0);
  assert.equal(A.tierFrom(shark, 1), 0);
  assert.equal(A.tierFrom(shark, 2), 1);
  assert.equal(A.tierFrom(shark, 200), 3);
});

test('easiest next starts with the quick free ones and skips retired and earned', () => {
  const ranked = A.rankNext({}, {});
  assert.deepEqual([...ranked.slice(0, 2).map((s) => s.def.id)], ['quickdraw', 'yolo']);
  assert.ok(!ranked.some((s) => s.def.retired));
  const after = A.rankNext({ quickdraw: 1 }, { yolo: 1 });
  assert.ok(!after.some((s) => ['quickdraw', 'yolo'].includes(s.def.id)));
  assert.equal(after[0].def.id, 'pair-extraordinaire');
});

test('a tiered achievement shows its next tier, and costly or social ones rank late', () => {
  const s = A.status(A.ACHIEVEMENTS.find((a) => a.id === 'pull-shark'), { mergedPRs: 5 }, {});
  assert.equal(s.tier, 1);
  assert.equal(s.next, 16);
  const order = A.rankNext({}, {}).map((x) => x.def.id);
  assert.ok(order.indexOf('public-sponsor') > order.indexOf('pull-shark'));
  assert.equal(order.at(-1), 'starstruck');
});

test('what the owner says the profile shows wins, even below the estimate, within range', () => {
  const shark = A.ACHIEVEMENTS.find((a) => a.id === 'pull-shark');
  assert.equal(A.status(shark, { mergedPRs: 39 }, { 'pull-shark': 0 }).tier, 0);
  assert.equal(A.status(shark, { mergedPRs: 39 }, {}).tier, 2);
  const pair = A.ACHIEVEMENTS.find((a) => a.id === 'pair-extraordinaire');
  assert.equal(A.status(pair, { coauthored: 0 }, { 'pair-extraordinaire': 2 }).tier, 2);
  assert.equal(A.status(pair, {}, { 'pair-extraordinaire': 99 }).tier, 4);
  assert.equal(A.status(pair, {}, { 'pair-extraordinaire': 'x' }).tier, 0);
});

test('projects go easiest first, filter by track and drop done ones', () => {
  const all = A.projectQueue([], 'all');
  const sizes = [...all.map((p) => p.size)];
  assert.deepEqual(sizes, [...sizes].sort((a, b) => ['small', 'medium', 'large'].indexOf(a) - ['small', 'medium', 'large'].indexOf(b)));
  assert.ok(A.projectQueue([], 'cyber').every((p) => p.tracks.includes('cyber')));
  assert.ok(!A.projectQueue([all[0].id], 'all').some((p) => p.id === all[0].id));
  for (const t of Object.keys(A.TRACKS)) assert.ok(A.projectQueue([], t).length >= 3, t + ' has ideas');
});

test('every project names an existing achievement and does not coin a pet name', () => {
  const ids = new Set(A.ACHIEVEMENTS.map((a) => a.id));
  for (const p of A.PROJECTS) {
    for (const e of p.earns) assert.ok(ids.has(e), p.id + ' earns ' + e);
    assert.match(p.repo, /^[a-z0-9.-]+$/);
    if (p.repo === 'astras-pet-os') assert.match(p.title, /^New pet \(you name it\)/);
  }
});

test('issue links go to github.com with the text encoded, and refuse bad account names', () => {
  const p = A.PROJECTS[0];
  const url = new URL(A.issueUrl('findastra', p));
  assert.equal(url.origin, 'https://github.com');
  assert.equal(url.pathname, '/findastra/' + p.repo + '/issues/new');
  assert.equal(url.searchParams.get('title'), p.title);
  assert.match(url.searchParams.get('body'), /- \[ \] Make a branch/);
  assert.throws(() => A.issueUrl('evil.com/x', p));
  assert.throws(() => A.issueUrl('-bad', p));
});

function fakeFetch(routes, seen = []) {
  return async (url, opts) => {
    seen.push({ url, opts });
    const hit = routes.find(([re]) => re.test(url));
    if (!hit) return { ok: false, status: 404, json: async () => ({}) };
    return { ok: true, status: 200, json: async () => hit[1] };
  };
}

test('detect reads api.github.com only and turns answers into estimates', async () => {
  const seen = [];
  const now = Date.parse('2026-10-17T00:00:00Z');
  const routes = [
    [/review%3Anone/, { total_count: 3 }],
    [/is%3Amerged/, { total_count: 5, items: [
      { repository_url: 'https://api.github.com/repos/findastra/a' },
      { repository_url: 'https://api.github.com/repos/someone/tool' },
      { repository_url: 'https://api.github.com/repos/someone/tool' }] }],
    [/is%3Aclosed/, { total_count: 1, items: [{ created_at: new Date(now).toISOString(), closed_at: new Date(now + 120000).toISOString() }] }],
    [/search\/commits/, { total_count: 12 }],
    [/\/users\/findastra\/repos/, [{ stargazers_count: 3 }, { stargazers_count: 9 }]]
  ];
  const { metrics, errors } = await A.detect('findastra', { token: 't0k', fetchImpl: fakeFetch(routes, seen) });
  assert.equal(errors.length, 0);
  assert.deepEqual({ ...metrics }, { mergedPRs: 5, otherRepos: 1, yolo: 1, quickdraw: 1, coauthored: 12, maxStars: 9 });
  assert.ok(seen.every((s) => s.url.startsWith('https://api.github.com/')));
  assert.ok(seen.every((s) => s.opts.headers.Authorization === 'Bearer t0k'));
});

test('detect reports failures instead of guessing, and a slow close is not Quickdraw', async () => {
  const routes = [[/is%3Aclosed/, { items: [{ created_at: '2026-10-01T00:00:00Z', closed_at: '2026-10-01T00:06:00Z' }] }]];
  const { metrics, errors } = await A.detect('findastra', { fetchImpl: fakeFetch(routes) });
  assert.equal(metrics.quickdraw, 0);
  assert.equal(metrics.mergedPRs, undefined);
  assert.equal(errors.length, 4);
  await assert.rejects(A.detect('../x', { fetchImpl: fakeFetch([]) }));
});

test('co-author lines are only a hint: they never mark Pair Extraordinaire earned on their own', () => {
  const pair = A.ACHIEVEMENTS.find((a) => a.id === 'pair-extraordinaire');
  assert.equal(A.status(pair, { coauthored: 275 }, {}).tier, 0);
  assert.equal(A.status(pair, { coauthored: 275 }, { 'pair-extraordinaire': 4 }).done, true);
});

test('a quickly merged pull request is not Quickdraw; a quickly closed issue is', async () => {
  const fast = { created_at: '2026-10-01T00:00:00Z', closed_at: '2026-10-01T00:01:00Z' };
  const run = (item) => A.detect('findastra', { fetchImpl: fakeFetch([[/is%3Aclosed/, { items: [item] }]]) });
  assert.equal((await run({ ...fast, pull_request: { merged_at: fast.closed_at } })).metrics.quickdraw, 0);
  assert.equal((await run(fast)).metrics.quickdraw, 1);
});
