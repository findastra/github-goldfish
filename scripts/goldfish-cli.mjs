// Usage: node scripts/goldfish-cli.mjs [user] [--md] [--never "word,word"] [--save audit-snapshot-20261008.json] [--snapshot audit-snapshot-20261008.json] [--naming-rules naming-rules-20261008.json]
// Same checks as the app, printed in the terminal. Set GITHUB_TOKEN to raise the rate limit.
// Exit code is 1 when any error-level finding exists, so it can gate a CI job.
import { readFileSync, writeFileSync } from 'node:fs';
import { parseArgs } from 'node:util';
import { loadEngine } from './load-engine.mjs';

const { values, positionals } = parseArgs({
  allowPositionals: true,
  options: { md: { type: 'boolean' }, never: { type: 'string' }, save: { type: 'string' }, snapshot: { type: 'string' }, 'naming-rules': { type: 'string' } },
});
const user = positionals[0] || 'findastra';
const G = loadEngine();
const namingRules = values['naming-rules']
  ? G.normalizeNamingRules(JSON.parse(readFileSync(values['naming-rules'], 'utf8').replace(/^\uFEFF/, '')))
  : undefined;

const data = values.snapshot
  ? JSON.parse(readFileSync(values.snapshot, 'utf8'))
  : await G.collect(user, {
      token: process.env.GITHUB_TOKEN,
      onProgress: (p) => p.phase === 'done' && process.stderr.write(`  ${p.repo} (${p.done}/${p.total})\n`),
    });
if (values.save) writeFileSync(values.save, JSON.stringify(data));

const findings = G.audit({ ...data, neverSay: (values.never || '').split(',').filter(Boolean), namingRules: namingRules ?? data.namingRules });
const meta = { user: data.user, repoCount: data.repos.filter((r) => !r.fork).length, notes: data.notes, when: new Date().toISOString().slice(0, 10) };

if (values.md) console.log(G.toMarkdown(findings, meta));
else {
  const s = G.summarize(findings);
  for (const f of findings) {
    console.log(`${f.sev.toUpperCase().padEnd(5)} ${f.cat.padEnd(16)} ${f.repo} :: ${f.where}${f.line ? ':' + f.line : ''} :: ${f.msg}${f.evidence ? '  [' + f.evidence + ']' : ''}`);
  }
  console.log(`\n${s.by.error} errors, ${s.by.warn} warnings, ${s.by.note} notes. Mood: ${s.mood}.`);
  for (const n of data.notes) console.log('NOT COVERED:', n);
}
process.exit(findings.some((f) => f.sev === 'error') ? 1 : 0);
