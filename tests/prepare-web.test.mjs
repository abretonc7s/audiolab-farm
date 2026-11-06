import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

const script = fileURLToPath(new URL('../scripts/prepare-web.sh', import.meta.url));
const artifacts = ['sherpa-onnx-wasm-combined.js', 'sherpa-onnx-wasm-combined.wasm'];
function fixture(t, version = '2.0.0') {
  const root = mkdtempSync(path.join(tmpdir(), 'audiolab-wasm-'));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const repo = path.join(root, 'checkout with spaces');
  const pkg = path.join(repo, 'packages/sherpa-onnx.rn');
  const bin = path.join(root, 'bin');
  mkdirSync(path.join(pkg, 'wasm-src'), { recursive: true });
  mkdirSync(bin);
  writeFileSync(path.join(pkg, 'wasm-src/loader.js'), 'workspace loader\n');
  const setVersion = value => writeFileSync(path.join(pkg, 'package.json'), JSON.stringify({
    name: '@siteed/sherpa-onnx.rn', ...(value === undefined ? {} : { version: value }),
  }));
  setVersion(version);
  const calls = path.join(root, 'curl.jsonl');
  const fail = path.join(root, 'fail-download');
  writeFileSync(path.join(bin, 'curl'), `#!${process.execPath}\nconst fs=require('node:fs'); const args=process.argv.slice(2); fs.appendFileSync(${JSON.stringify(calls)}, JSON.stringify(args)+'\\n'); if(fs.existsSync(${JSON.stringify(fail)})) process.exit(22); fs.writeFileSync(args[args.indexOf('-o')+1], args.find(arg=>arg.startsWith('https://')));\n`, { mode: 0o755 });
  return {
    repo, setVersion, fail,
    run: () => spawnSync('bash', [script, repo], {
      env: { ...process.env, PATH: `${bin}${path.delimiter}${process.env.PATH}` }, encoding: 'utf8',
    }),
    calls: () => existsSync(calls) ? readFileSync(calls, 'utf8').trim().split('\n').map(JSON.parse) : [],
    read: name => readFileSync(path.join(repo, 'apps/sherpa-voice/public/wasm', name), 'utf8'),
  };
}

test('downloads the exact checkout package version and keeps loader files', t => {
  const f = fixture(t, '2.0.0');
  const result = f.run();
  assert.equal(result.status, 0, result.stderr);
  assert.equal(f.calls().length, 2);
  for (const name of artifacts) {
    assert.equal(f.read(name), `https://cdn.jsdelivr.net/npm/@siteed/sherpa-onnx.rn@2.0.0/wasm/${name}`);
  }
  assert.equal(f.read('loader.js'), 'workspace loader\n');
});

test('switching package versions isolates the cache and repeat prepare reuses it', t => {
  const f = fixture(t, '1.3.1');
  assert.equal(f.run().status, 0);
  f.setVersion('2.0.1');
  assert.equal(f.run().status, 0);
  assert.equal(f.calls().length, 4);
  for (const name of artifacts) assert.match(f.read(name), /@2\.0\.1\/wasm\//);
  assert.equal(f.run().status, 0);
  assert.equal(f.calls().length, 4);
});

test('preserves an exact prerelease version rather than silently selecting a stable release', t => {
  const f = fixture(t, '2.1.0-beta.1');
  assert.equal(f.run().status, 0);
  assert.match(f.read(artifacts[0]), /@2\.1\.0-beta\.1\/wasm\//);
});

test('missing or invalid versions refuse prepare before any download', t => {
  const f = fixture(t);
  for (const value of [undefined, '', '../1.3.1', '^2.0.0']) {
    f.setVersion(value);
    assert.notEqual(f.run().status, 0);
    assert.equal(f.calls().length, 0);
  }
});

test('an unavailable exact version fails instead of keeping old published assets', t => {
  const f = fixture(t, '2.0.0');
  writeFileSync(f.fail, 'offline');
  assert.notEqual(f.run().status, 0);
  assert.equal(f.calls().length, 1);
  assert.equal(existsSync(path.join(f.repo, 'apps/sherpa-voice/public/wasm', artifacts[0])), false);
});

test('source setup invokes the canonical helper without rewriting other hooks', () => {
  const config = JSON.parse(readFileSync(new URL('../project.json', import.meta.url), 'utf8'));
  assert.match(config.hooks.setup, /&& bash "\{\{farmslot_dir\}\}\/projects\/audiolab-farm\/scripts\/prepare-web\.sh" "\{\{repo\}\}"$/);
});
