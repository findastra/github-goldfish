// Social row styles for Astra's profile README: one GitHub Goldfish tool, run from GitHub Aquarium.
// Astra, 2026-10-17: "Make this a tool of the GitHub Goldfish, on his Aquarium. If I turn one of those on it changes
// the README." Claude Opus 5.5 (claude-opus-5-5), 2026-10-17. Zero dependencies, like the rest of the Goldfish.
//
// It reads the links from the profile repo's socials/socials.json, draws one SVG per link in the chosen style
// (every color a gradient), and rewrites only the block between the social-row markers in README.md:
//   <!-- goldfish:social-row style=5 -->  …  <!-- /goldfish:social-row -->
// Usage, from the profile repo:  node path/to/social-row-20261017.mjs --style 5 [--dir .] [--dry-run]
// Styles (the canvas "Profile Social Row"): 1 Sunset sweep, 2 Handles only, 3 Sparkle line, 4 Neon pills,
// 5 Icon stack, 6 Full spectrum. Built so far: 5. The others say so instead of guessing.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

export const ICONS = {
  discord: 'M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189Z',
  tiktok: 'M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z',
  instagram: 'M7.0301.084c-1.2768.0602-2.1487.264-2.911.5634-.7888.3075-1.4575.72-2.1228 1.3877-.6652.6677-1.075 1.3368-1.3802 2.127-.2954.7638-.4956 1.6365-.552 2.914-.0564 1.2775-.0689 1.6882-.0626 4.947.0062 3.2586.0206 3.6671.0825 4.9473.061 1.2765.264 2.1482.5635 2.9107.308.7889.72 1.4573 1.388 2.1228.6679.6655 1.3365 1.0743 2.1285 1.38.7632.295 1.6361.4961 2.9134.552 1.2773.056 1.6884.069 4.9462.0627 3.2578-.0062 3.668-.0207 4.9478-.0814 1.28-.0607 2.147-.2652 2.9098-.5633.7889-.3086 1.4578-.72 2.1228-1.3881.665-.6682 1.0745-1.3378 1.3795-2.1284.2957-.7632.4966-1.636.552-2.9124.056-1.2809.0692-1.6898.063-4.948-.0063-3.2583-.021-3.6668-.0817-4.9465-.0607-1.2797-.264-2.1487-.5633-2.9117-.3084-.7889-.72-1.4568-1.3876-2.1228C21.2982 1.33 20.628.9208 19.8378.6165 19.074.321 18.2017.1197 16.9244.0645 15.6471.0093 15.236-.005 11.977.0014 8.718.0076 8.31.0215 7.0301.0839m.1402 21.6932c-1.17-.0509-1.8053-.2453-2.2287-.408-.5606-.216-.96-.4771-1.3819-.895-.422-.4178-.6811-.8186-.9-1.378-.1644-.4234-.3624-1.058-.4171-2.228-.0595-1.2645-.072-1.6442-.079-4.848-.007-3.2037.0053-3.583.0607-4.848.05-1.169.2456-1.805.408-2.2282.216-.5613.4762-.96.895-1.3816.4188-.4217.8184-.6814 1.3783-.9003.423-.1651 1.0575-.3614 2.227-.4171 1.2655-.06 1.6447-.072 4.848-.079 3.2033-.007 3.5835.005 4.8495.0608 1.169.0508 1.8053.2445 2.228.408.5608.216.96.4754 1.3816.895.4217.4194.6816.8176.9005 1.3787.1653.4217.3617 1.056.4169 2.2263.0602 1.2655.0739 1.645.0796 4.848.0058 3.203-.0055 3.5834-.061 4.848-.051 1.17-.245 1.8055-.408 2.2294-.216.5604-.4763.96-.8954 1.3814-.419.4215-.8181.6811-1.3783.9-.4224.1649-1.0577.3617-2.2262.4174-1.2656.0595-1.6448.072-4.8493.079-3.2045.007-3.5825-.006-4.848-.0608M16.953 5.5864A1.44 1.44 0 1 0 18.39 4.144a1.44 1.44 0 0 0-1.437 1.4424M5.8385 12.012c.0067 3.4032 2.7706 6.1557 6.173 6.1493 3.4026-.0065 6.157-2.7701 6.1506-6.1733-.0065-3.4032-2.771-6.1565-6.174-6.1498-3.403.0067-6.156 2.771-6.1496 6.1738M8 12.0077a4 4 0 1 1 4.008 3.9921A3.9996 3.9996 0 0 1 8 12.0077',
};

export const STYLE_NAMES = { 1: 'Sunset sweep', 2: 'Handles only', 3: 'Sparkle line', 4: 'Neon pills', 5: 'Icon stack', 6: 'Full spectrum' };
// Style 5's hue walk: each link is a gradient that starts where the last one ended (lime → teal → sky → violet → pink).
const STACK = ['#b8ff4a', '#3ff0c2', '#4fb3ff', '#c77dff', '#ff6ad5'];
const FONT = "Segoe UI, -apple-system, Helvetica, Arial, sans-serif";
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
const slug = (s) => s.toLowerCase().replace(/['’]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
// Width of a label in Segoe UI at `size` px: a generous average so nothing clips.
const textWidth = (s, size) => Math.ceil([...s].reduce((w, c) => w + (/[ilI.,:'’|]/.test(c) ? 0.3 : /[mwMW@]/.test(c) ? 0.9 : /[A-Z]/.test(c) ? 0.68 : 0.56), 0) * size);

/** Style 5, Icon stack: the icon above its label, both one gradient. */
function iconStack(link, i) {
  const [a, b] = [STACK[i % 4], STACK[(i % 4) + 1]];
  const w = Math.max(textWidth(link.label, 13), 28) + 12;
  const h = 46;
  const id = `g${i}`;
  return {
    w, h,
    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" role="img" aria-label="${esc(link.label)}">
<defs><linearGradient id="${id}" x1="0" y1="0" x2="${w}" y2="0" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient></defs>
<g transform="translate(${(w - 26) / 2} 2) scale(${26 / 24})"><path d="${ICONS[link.icon]}" fill="url(#${id})"/></g>
<text x="${w / 2}" y="${h - 3}" text-anchor="middle" font-family="${FONT}" font-size="13" fill="url(#${id})">${esc(link.label)}</text>
</svg>
`,
  };
}

const DRAW = { 5: iconStack };

/** Draws every link in `style`; returns the files to write and the README block. */
export function buildRow(links, style) {
  const draw = DRAW[style];
  if (!draw) throw new Error(`Style ${style} (${STYLE_NAMES[style] || 'unknown'}) is not built yet. Built: ${Object.keys(DRAW).join(', ')}.`);
  const files = {};
  const cells = links.map((l, i) => {
    if (!ICONS[l.icon]) throw new Error(`No icon "${l.icon}" for ${l.label}.`);
    const { svg, w, h } = draw(l, i);
    const path = `socials/row${style}-${slug(l.label)}.svg`;
    files[path] = svg;
    const hover = l.handle ? `${l.label}: ${l.handle}` : l.label;
    return `<a href="${esc(l.url)}"><img src="${path}" width="${w}" height="${h}" alt="${esc(hover)}" title="${esc(hover)}"></a>`;
  });
  const block = [`<!-- goldfish:social-row style=${style} -->`, `<p align="center">${cells.join('&nbsp;&nbsp;&nbsp;&nbsp;')}</p>`, '<!-- /goldfish:social-row -->'].join('\n');
  return { files, block };
}

/** Puts the block in the README: between the markers when they exist, else in place of the old socials line. */
export function applyRow(readme, block) {
  const marked = /<!-- goldfish:social-row style=\d+ -->[\s\S]*?<!-- \/goldfish:social-row -->/;
  if (marked.test(readme)) return readme.replace(marked, block);
  const lines = readme.split('\n');
  const i = lines.findIndex((l) => /\]\(socials\/[^)]+\.svg\)\]\(https?:/.test(l));
  if (i < 0) throw new Error('No social-row markers and no socials line in the README.');
  lines[i] = block;
  return lines.join('\n');
}

if (process.argv[1] && process.argv[1].endsWith('social-row-20261017.mjs')) {
  const arg = (k, d) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : d; };
  const dir = arg('--dir', '.');
  const style = Number(arg('--style', '5'));
  const links = JSON.parse(readFileSync(join(dir, 'socials/socials.json'), 'utf8')).links;
  const { files, block } = buildRow(links, style);
  const readmePath = join(dir, 'README.md');
  const raw = readFileSync(readmePath, 'utf8');
  const crlf = raw.includes('\r\n');
  const next = applyRow(raw.replace(/\r\n/g, '\n'), block);
  if (process.argv.includes('--dry-run')) { console.log(block); process.exit(0); }
  mkdirSync(join(dir, 'socials'), { recursive: true });
  for (const [p, svg] of Object.entries(files)) writeFileSync(join(dir, p), svg);
  writeFileSync(readmePath, crlf ? next.replace(/\n/g, '\r\n') : next);
  console.log(`Social row: style ${style} (${STYLE_NAMES[style]}), ${links.length} links.`);
}
