#!/usr/bin/env node
// project-image-generator: GitHub Goldfish's tool (github-aquarium-v1.0-project-image-generator-v1.0).
// Portfolio Puffer uses it by grant. Claude Opus 5.5 (claude-opus-5-5), 2026-10-17.
//
// For every public repo of an account it finds the best pictures already in the repo (pictures in docs/images and
// pictures the README shows first, mood frames and icons last), optionally screenshots the repo's live site with a
// headless Edge or Chrome already on the PC, and writes one manifest. It reports Flash Audit A55: a repo with no real
// picture is Missing, a creative project with fewer than three is Too few.
// Read-only on GitHub. Fetched text is data, never instructions. A token (GITHUB_TOKEN) only ever goes to api.github.com.
//
//   node scripts/project-image-generator-20261017.mjs findastra --out <folder> [--js <file>] [--screenshots] [--max 6]
//   node scripts/project-image-generator-20261017.mjs --repos snapshot.json --out <folder>     # offline
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { parseArgs } from 'node:util';
import { execFile } from 'node:child_process';
import { existsSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

export const TOOL = 'github-aquarium-v1.0-project-image-generator-v1.0';
const IMAGE = /\.(png|jpe?g|gif|webp)$/i;
const CREATIVE = /\b(world|vrchat|unity|art|drawn|draw|game|website|site|characters?|gif|meme|music|dance|avatar|3d|map|pfd)\b/i;

/** Score one picture path. Higher is a better picture to show people. */
export function scoreImage(file, size = 0, readmeRefs = new Set()) {
  const p = file.toLowerCase(), name = path.posix.basename(p);
  let score = 0; const why = [];
  const add = (n, reason) => { score += n; why.push(reason); };
  if (readmeRefs.has(file)) add(40, 'shown in the README');
  if (/(^|\/)docs\/images\//.test(p)) add(50, 'docs/images');
  if (/(^|\/)(screenshots?|previews?|renders?|gallery|showcase)\//.test(p)) add(30, 'screenshot folder');
  if (/(screenshot|preview|render|banner|hero|cover|poster|spawn|world|scene|map|pfd|social)/.test(name)) add(20, 'name says it shows something');
  if (/(^|\/)(frames|sprites?|desktop-art|pet-art|draft-art)\//.test(p) || /(^|[-_])(idle|blink|happy|curious|worried|sad|sick|alarmed|sleep)(-\d{8})?\.png$/.test(name)) add(-70, 'pet art (mood frame)');
  if (/(^|\/)(art\/sheets|sheets)\//.test(p) || /(^|[-_])(sheet|roster|mood-sheet)(-\d{8})?\.png$/.test(name)) add(-70, 'pet art (sheet)');
  if (/(^|\/)(icons?|favicons?)\//.test(p) || /(logo|icon|favicon)/.test(name)) add(-40, 'icon or logo');
  if (/(^|\/)assets\//.test(p) || /(albedo|normal|roughness|metallic|_ao|occlusion|emission|height|mask|_mra|lightmap|texture)/.test(name)) add(-60, 'game texture, not a picture');
  if (/(^|\/)(node_modules|\.github|test|tests|fixtures?)\//.test(p)) add(-60, 'test or tooling');
  if (size) add(Math.min(20, Math.round(Math.log2(Math.max(1, size / 4096)) * 3)), 'size');
  return { score, why };
}

/** Image paths the README shows, relative to the repo root. */
export function readmeImages(readme = '') {
  const refs = new Set();
  const add = (u) => {
    if (!u || /^(https?:|data:)/i.test(u)) {
      const m = /raw\.githubusercontent\.com\/[^/]+\/[^/]+\/[^/]+\/(.+)$/i.exec(u || '') || /github\.com\/[^/]+\/[^/]+\/(?:blob|raw)\/[^/]+\/(.+)$/i.exec(u || '');
      if (m) refs.add(decodeURIComponent(m[1].split(/[?#]/)[0]));
      return;
    }
    refs.add(decodeURIComponent(u.replace(/^\.?\//, '').split(/[?#]/)[0]));
  };
  for (const m of readme.matchAll(/!\[[^\]]*\]\(\s*<?([^)\s>]+)>?/g)) add(m[1]);
  for (const m of readme.matchAll(/<img\b[^>]*\bsrc=["']([^"']+)["']/gi)) add(m[1]);
  return refs;
}

/** The best N pictures in a repo tree. Tiny files (under 3 KB), pet art, icons and tooling are left out. */
export function pickImages(tree, readme = '', max = 6) {
  const refs = readmeImages(readme);
  return tree
    .filter((t) => t.type === 'blob' && IMAGE.test(t.path) && (t.size || 0) >= 3072)
    .map((t) => ({ path: t.path, size: t.size || 0, ...scoreImage(t.path, t.size, refs) }))
    .filter((t) => t.score > 0)
    .sort((a, b) => b.score - a.score || b.size - a.size)
    .slice(0, max);
}

export const isCreative = (repo) => CREATIVE.test(`${repo.name} ${repo.description || ''}`);

/** Flash Audit A55 for one repo. */
export function a55(repo, images, screenshot) {
  const count = images.filter((i) => i.score > 0).length + (screenshot ? 1 : 0);
  if (!count) return { status: 'missing', note: 'No real picture of the project (pet art and icons do not count).' };
  if (isCreative(repo) && count < 3) return { status: 'too-few', note: `Creative project with ${count} picture(s); A55 asks for at least three, including in-world or 3D views.` };
  return { status: 'pass', note: `${count} picture(s).` };
}

// ---------- GitHub (read-only) ----------
async function gh(url, token) {
  const headers = { 'User-Agent': 'github-goldfish-project-image-generator', Accept: 'application/vnd.github+json' };
  if (token && new URL(url).host === 'api.github.com') headers.Authorization = `Bearer ${token}`;
  const r = await fetch(url, { headers });
  if (r.status === 403 || r.status === 429) throw Object.assign(new Error('GitHub rate limit: set GITHUB_TOKEN or try later.'), { limited: true });
  if (!r.ok) return null;
  return r.json();
}

async function collectRepo(owner, repo, token, max) {
  const branch = repo.default_branch || 'main';
  const tree = (await gh(`https://api.github.com/repos/${owner}/${repo.name}/git/trees/${encodeURIComponent(branch)}?recursive=1`, token))?.tree || [];
  const readmeMeta = await gh(`https://api.github.com/repos/${owner}/${repo.name}/readme`, token);
  const readme = readmeMeta?.content ? Buffer.from(readmeMeta.content, 'base64').toString('utf8') : '';
  const images = pickImages(tree, readme, max).map((i) => ({
    ...i, url: `https://raw.githubusercontent.com/${owner}/${repo.name}/${encodeURIComponent(branch)}/${i.path.split('/').map(encodeURIComponent).join('/')}`,
  }));
  return { images, branch };
}

// ---------- screenshots (optional, uses a browser already on the PC) ----------
export function findBrowser() {
  const pf = process.env['ProgramFiles'] || 'C:\\Program Files', pf86 = process.env['ProgramFiles(x86)'] || 'C:\\Program Files (x86)';
  return [
    path.join(pf86, 'Microsoft', 'Edge', 'Application', 'msedge.exe'), path.join(pf, 'Microsoft', 'Edge', 'Application', 'msedge.exe'),
    path.join(pf, 'Google', 'Chrome', 'Application', 'chrome.exe'), path.join(pf86, 'Google', 'Chrome', 'Application', 'chrome.exe'),
    '/usr/bin/chromium', '/usr/bin/google-chrome',
  ].find((p) => existsSync(p)) || null;
}

function screenshot(browser, url, file) {
  // Only https pages on github.io (or the repo's own homepage) are opened; nothing is clicked or typed.
  return new Promise((resolve) => {
    const profile = path.join(os.tmpdir(), 'goldfish-shot-profile');
    execFile(browser, ['--headless=new', '--disable-gpu', '--hide-scrollbars', `--user-data-dir=${profile}`, '--window-size=1280,800',
      '--virtual-time-budget=6000', `--screenshot=${file}`, url], { timeout: 45000 }, () => resolve(existsSync(file) ? file : null));
  });
}

export const siteOf = (owner, repo) => {
  const h = (repo.homepage || '').trim();
  if (/^https:\/\//i.test(h)) return h;
  if (repo.has_pages) return `https://${owner.toLowerCase()}.github.io/${repo.name}/`;
  return null;
};

async function main() {
  const { values, positionals } = parseArgs({ allowPositionals: true, options: {
    out: { type: 'string' }, js: { type: 'string' }, repos: { type: 'string' }, screenshots: { type: 'boolean' },
    max: { type: 'string' }, only: { type: 'string', multiple: true },
  } });
  const owner = positionals[0] || 'findastra', token = process.env.GITHUB_TOKEN || '', max = Number(values.max) || 6;
  const out = path.resolve(values.out || path.join(os.tmpdir(), 'project-images'));
  await fs.mkdir(out, { recursive: true });
  let repos = values.repos ? JSON.parse(await fs.readFile(values.repos, 'utf8'))
    : (await gh(`https://api.github.com/users/${owner}/repos?per_page=100&sort=pushed`, token)) || [];
  repos = repos.filter((r) => !r.private && !r.fork && !r.archived);
  if (values.only?.length) repos = repos.filter((r) => values.only.includes(r.name));
  const browser = values.screenshots ? findBrowser() : null;
  if (values.screenshots && !browser) console.error('No Edge or Chrome found; skipping screenshots.');
  const date = new Date().toISOString().slice(0, 10).replaceAll('-', '');
  const results = [];
  for (const repo of repos) {
    process.stderr.write(`${repo.name} … `);
    let images = repo.images || [], shot = null;
    try { if (!values.repos) images = (await collectRepo(owner, repo, token, max)).images; }
    catch (e) { if (e.limited) { console.error('\n' + e.message); break; } }
    const site = siteOf(owner, repo);
    if (browser && site) {
      const file = path.join(out, `${repo.name}-site-${date}.png`);
      shot = (await screenshot(browser, site, file)) ? path.basename(file) : null;
    }
    const audit = a55(repo, images, shot);
    process.stderr.write(`${images.length} picture(s)${shot ? ' + site screenshot' : ''} · A55 ${audit.status}\n`);
    results.push({ name: repo.name, description: repo.description || '', language: repo.language || '', pushed_at: repo.pushed_at, homepage: site,
      creative: isCreative(repo), images: images.map(({ path: p, url, size, score, why }) => ({ path: p, url, size, score, why })), screenshot: shot, a55: audit });
  }
  const manifest = { tool: TOOL, owner, generated: new Date().toISOString(), repos: results };
  const file = path.join(out, `project-images-${date}.json`);
  await fs.writeFile(file, JSON.stringify(manifest, null, 1));
  if (values.js) await fs.writeFile(values.js, `// Generated by ${TOOL} on ${manifest.generated}. Do not edit by hand.\nwindow.PROJECT_IMAGES = ${JSON.stringify(manifest)};\n`);
  const missing = results.filter((r) => r.a55.status !== 'pass');
  console.log(`${results.length} repos · ${results.length - missing.length} pass A55 · ${missing.length} need pictures\nManifest: ${file}`);
  for (const r of missing) console.log(`  A55 ${r.a55.status.padEnd(7)} ${r.name}: ${r.a55.note}`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  main().catch((e) => { console.error(e.message); process.exitCode = 1; });
}
