import { test } from 'node:test';
import assert from 'node:assert/strict';
import { scoreImage, readmeImages, pickImages, a55, isCreative, siteOf, allowedPage } from '../scripts/project-image-generator-20261017.mjs';

const blob = (p, size = 50000) => ({ type: 'blob', path: p, size });

test('README pictures and docs/images rank above mood frames and icons', () => {
  const tree = [blob('art/frames/goldfish/idle.png'), blob('art/icons/goldfish-20261012.png'), blob('docs/images/page-20261017.png'), blob('shot.png'), blob('src/a.js')];
  const picked = pickImages(tree, '![page](shot.png)', 6).map((i) => i.path);
  assert.deepEqual(picked.slice(0, 2), ['docs/images/page-20261017.png', 'shot.png']);
  assert.ok(!picked.includes('src/a.js'));
  assert.ok(!picked.includes('art/frames/goldfish/idle.png'), 'mood frames are not project pictures');
});

test('tiny images and test fixtures are left out', () => {
  const picked = pickImages([blob('banner.png', 1000), blob('test/fixtures/world.png')], '', 6);
  assert.equal(picked.length, 0);
});

test('readmeImages reads markdown, html and absolute raw links', () => {
  const refs = readmeImages('![a](./docs/a.png) <img src="b.png" width=4> ![c](https://raw.githubusercontent.com/findastra/x/main/art/c.png) ![d](https://example.com/d.png)');
  assert.deepEqual([...refs].sort(), ['art/c.png', 'b.png', 'docs/a.png']);
});

test('A55 counts only pictures committed in the repo', () => {
  const world = { name: 'piranesi-house', description: 'A VRChat world' };
  const tool = { name: 'file-master', description: 'Keeps a PC organized' };
  assert.equal(a55(tool, [], 0).status, 'missing');
  assert.equal(a55(tool, [], 3).status, 'missing', 'screenshots the tool took are not committed pictures');
  assert.match(a55(tool, [], 3).note, /3 screenshot\(s\) ready to add/);
  assert.equal(a55(world, [{ score: 50 }, { score: 20 }], 1).status, 'too-few');
  assert.equal(a55(world, [{ score: 50 }, { score: 20 }, { score: 9 }]).status, 'pass');
  assert.equal(a55(tool, [{ score: 10 }]).status, 'pass');
  assert.equal(a55(tool, [{ score: -5 }]).status, 'missing', 'only negative-score art does not count');
  assert.ok(isCreative(world) && !isCreative(tool));
});

test('pages: only the owner github.io site or an existing local html file', () => {
  assert.equal(allowedPage('findastra', 'https://findastra.github.io/astras-pet-os/system-map-20261012.html'), true);
  assert.equal(allowedPage('findastra', 'https://claude.ai/artifact/x'), false);
  assert.equal(allowedPage('findastra', 'http://findastra.github.io/'), false);
  assert.equal(allowedPage('findastra', 'https://findastra.github.io.evil.example/'), false);
  assert.equal(allowedPage('findastra', 'C:/nope/missing-app.html'), false);
  assert.equal(allowedPage('findastra', 'relative/app.html'), false);
});

test('game texture names are matched with a real word boundary', () => {
  assert.deepEqual(pickImages([{ type: 'blob', path: 'art/stone_ao.png', size: 90000 }, { type: 'blob', path: 'art/aorta-world.png', size: 90000 }], '', 6).map((i) => i.path), ['art/aorta-world.png']);
});

test('screenshots only for https homepages or GitHub Pages', () => {
  assert.equal(siteOf('findastra', { name: 'a', homepage: 'http://insecure.example' }), null);
  assert.equal(siteOf('findastra', { name: 'a', homepage: 'https://x.example/' }), 'https://x.example/');
  assert.equal(siteOf('findastra', { name: 'fuzzbois', has_pages: true }), 'https://findastra.github.io/fuzzbois/');
  assert.equal(siteOf('findastra', { name: 'x', homepage: 'https://github.com/findastra/x#start-it' }), null, 'a github.com repo page is not a site');
  assert.equal(siteOf('findastra', { name: 'x', homepage: 'https://github.com/findastra/x', has_pages: true }), 'https://findastra.github.io/x/');
});

test('scoreImage explains itself', () => {
  const s = scoreImage('docs/images/world-render.png', 200000, new Set());
  assert.ok(s.score > 50 && s.why.includes('docs/images'));
});

test('pet art, logos and game textures are never project pictures', () => {
  const tree = ['draft-art/rgbee/sheet-20261011.png', 'art/idle-20261009.png', 'bug-curious-20261008.png', 'ai_astra_logo.png',
    'Assets/Piranesi/IvyMat_Albedo.png', 'Assets/Piranesi/IvyMat_Normal.png', 'art/roster.png'].map((p) => blob(p, 400000));
  assert.deepEqual(pickImages(tree, '![me](art/idle-20261009.png)', 6), [], 'even when the README shows pet art');
  assert.deepEqual(pickImages([blob('voicemeeter-bug-preview-20261008.png'), blob('docs/system-map/system-map-20261013.png')], '', 6).map((i) => i.path).sort(),
    ['docs/system-map/system-map-20261013.png', 'voicemeeter-bug-preview-20261008.png']);
});
