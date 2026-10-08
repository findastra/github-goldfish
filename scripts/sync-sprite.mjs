// sprite.json is the source of truth. Run this after editing it to copy it into index.html.
// (The art itself is drawn in the Cage repo, findastra-pet-apps/scripts/pets-art.mjs; copy its goldfish frames here.)
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const dir = (f) => fileURLToPath(new URL(`../${f}`, import.meta.url));
const sprite = JSON.parse(readFileSync(dir('sprite.json'), 'utf8'));
const html = readFileSync(dir('index.html'), 'utf8');
const next = html.replace(/\/\*sprite:start\*\/[\s\S]*?\/\*sprite:end\*\//, () => `/*sprite:start*/${JSON.stringify(sprite)}/*sprite:end*/`);
if (next === html) console.log('index.html already matches sprite.json');
else { writeFileSync(dir('index.html'), next); console.log('index.html updated from sprite.json'); }
