// Social row tool (Astra, 2026-10-17). Claude Opus 5.5.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildRow, applyRow } from '../scripts/social-row-20261017.mjs';

const links = [
  { label: "Mommy's Discord", handle: 'Join MMY', icon: 'discord', url: 'https://discord.gg/x' },
  { label: 'VR TikTok', handle: '@findastra', icon: 'tiktok', url: 'https://www.tiktok.com/@findastra' },
];

test('style 5 draws one gradient SVG per link and one centered row', () => {
  const { files, block } = buildRow(links, 5);
  assert.deepEqual(Object.keys(files), ['socials/row5-mommys-discord.svg', 'socials/row5-vr-tiktok.svg']);
  for (const svg of Object.values(files)) assert.match(svg, /linearGradient[\s\S]*fill="url\(#g\d\)"[\s\S]*<text[^>]*fill="url\(#g\d\)"/, 'icon and label are both gradients');
  assert.match(block, /^<!-- goldfish:social-row style=5 -->\n<p align="center">(<a href="[^"]+"><img [^>]+><\/a>(&nbsp;)*){2}<\/p>\n<!-- \/goldfish:social-row -->$/);
  assert.match(block, /title="Mommy&#39;s Discord: Join MMY"/, 'the handle stays in the hover text');
});

test('the README block is replaced in place, and the old socials line is converted once', () => {
  const old = '# Hi\n\n[![a](socials/a.svg)](https://x.test)<br>[![b](socials/b.svg)](https://y.test)\n\n### More\n';
  const { block } = buildRow(links, 5);
  const once = applyRow(old, block);
  assert.ok(once.includes(block) && !once.includes('socials/a.svg'));
  assert.equal(applyRow(once, block), once, 'running it again changes nothing');
  assert.throws(() => buildRow(links, 2), /not built yet/);
  assert.throws(() => applyRow('# Nothing here\n', block), /No social-row markers/);
});
