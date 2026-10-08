// Pulls the engine out of index.html so the app stays one file and tests run the real code.
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

export function loadEngine() {
  const html = readFileSync(fileURLToPath(new URL('../index.html', import.meta.url)), 'utf8');
  const m = /<script id="engine">([\s\S]*?)<\/script>/.exec(html);
  if (!m) throw new Error('engine script not found in index.html');
  const sandbox = { fetch, console, URL, TextDecoder, setTimeout };
  vm.createContext(sandbox);
  vm.runInContext(m[1] + '\n;this.Goldfish = Goldfish;', sandbox);
  return sandbox.Goldfish;
}
