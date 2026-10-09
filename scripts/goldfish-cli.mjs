// Usage: node scripts/goldfish-cli.mjs [user] [--md] [--public-only] [--never "word,word"] [--save audit-snapshot-20261008.json] [--snapshot audit-snapshot-20261008.json] [--naming-rules naming-rules-20261008.json]
// Same checks as the app, printed in the terminal. Set GITHUB_TOKEN to raise the rate limit; when the token
// belongs to the audited account it also opens private repos (use --public-only to leave them out).
// Exit code is 1 when any error-level finding exists, so it can gate a CI job.
import { readFileSync, writeFileSync } from 'node:fs';
import { parseArgs } from 'node:util';
import { loadEngine } from './load-engine.mjs';

const { values, positionals } = parseArgs({
  allowPositionals: true,
  options: { md: { type: 'boolean' }, 'public-only': { type: 'boolean' }, never: { type: 'string' }, save: { type: 'string' }, snapshot: { type: 'string' }, 'naming-rules': { type: 'string' } },
});
const user = positionals[0] || 'findastra';
const G = loadEngine();
const namingRules = values['naming-rules']
  ? G.normalizeNamingRules(JSON.parse(readFileSync(values['naming-rules'], 'utf8').replace(/^﻿/, '')))
  : undefined;

const data = values.snapshot
  ? JSON.parse(readFileSync(values.snapshot, 'utf8'))
  : await G.collect(user, {
      token: process.env.GITHUB_TOKEN,
      publicOnly: !!values['public-only'],
      onProgress: (p) => p.phase === 'done' && process.stderr.write(`  ${p.repo} (${p.done}/${p.total})\n`),
    });
if (values.save) writeFileSync(values.save, JSON.stringify(data));

const findings = G.audit({ ...data, neverSay: (values.never || '').split(',').filter(Boolean), namingRules: namingRules ?? data.namingRules });
const meta = { user: data.user, scope: data.scope, repos: data.repos, repoCount: data.repos.filter((r) => !r.fork).length, notes: data.notes || [], when: new Date().toISOString().slice(0, 10) };
const privateNames = new Set(data.repos.filter((r) => r.private).map((r) => r.name));

if (values.md) console.log(G.toMarkdown(findings, meta));
else {
  const s = G.summarize(findings);
  for (const f of findings) {
    const repo = privateNames.has(f.repo) ? `${f.repo} (private)` : f.repo;
    console.log(`${f.sev.toUpperCase().padEnd(5)} ${f.cat.padEnd(16)} ${repo} :: ${f.where}${f.line ? ':' + f.line : ''} :: ${f.msg}${f.evidence ? '  [' + f.evidence + ']' : ''}`);
  }
  console.log(`\n${s.by.error} errors, ${s.by.warn} warnings, ${s.by.note} notes across ${G.describeScope(meta)}. Mood: ${s.mood}.`);
  for (const n of meta.notes) console.log('NOT COVERED:', n);
}
process.exit(findings.some((f) => f.sev === 'error') ? 1 : 0);
