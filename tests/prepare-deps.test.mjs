import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const script = fileURLToPath(new URL('../scripts/prepare-deps.mjs', import.meta.url));
function fixture(t, mode = 'order') {
  const root = mkdtempSync(path.join(tmpdir(), 'audiolab-deps-'));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const repo = path.join(root, 'checkout with spaces');
  const bin = path.join(root, 'bin');
  mkdirSync(bin, { recursive: true });
  mkdirSync(path.join(repo, 'scripts/agentic'), { recursive: true });
  mkdirSync(path.join(repo, 'apps/playground'), { recursive: true });
  const file = path.join(repo, 'scripts/agentic/package.json');
  const original = JSON.stringify({ name: 'agentic', private: true, dependencies: {
    '@farmslot/adapter-sdk': '0.25.2', '@farmslot/recipe-cli': '0.32.1',
    '@farmslot/recipe-runner': '0.46.2', pngjs: '^7.0.0', '@farmslot/adapter-rn': '0.29.2',
  } }, null, 2) + '\n';
  writeFileSync(file, original);
  const log = path.join(root, 'commands.jsonl');
  writeFileSync(path.join(bin, 'yarn'), `#!${process.execPath}
const fs=require('node:fs');const p=${JSON.stringify(file)};const value=JSON.parse(fs.readFileSync(p));value.dependencies=Object.fromEntries(Object.entries(value.dependencies).sort(([a],[b])=>a.localeCompare(b)));if(${JSON.stringify(mode)}==='value')value.dependencies['@farmslot/adapter-rn']='0.31.2';fs.writeFileSync(p,JSON.stringify(value,null,2)+'\\n');fs.appendFileSync(${JSON.stringify(log)},JSON.stringify({command:'yarn',args:process.argv.slice(2),cwd:process.cwd()})+'\\n');if(${JSON.stringify(mode)}==='fail')process.exit(17);
`, { mode: 0o755 });
  writeFileSync(path.join(bin, 'bash'), `#!${process.execPath}\nrequire('node:fs').appendFileSync(${JSON.stringify(log)},JSON.stringify({command:'bash',args:process.argv.slice(2),cwd:process.cwd()})+'\\n');\n`, { mode: 0o755 });
  return { file, original, log, run: () => spawnSync(process.execPath, [script, repo], {
    encoding: 'utf8', env: { ...process.env, PATH: `${bin}${path.delimiter}${process.env.PATH}` },
  }) };
}

test('prepare leaves an order-only manifest rewrite byte-identical and is repeatable', t => {
  const f = fixture(t);
  for (let attempt = 0; attempt < 2; attempt++) {
    const result = f.run();
    assert.equal(result.status, 0, result.stderr);
    assert.equal(readFileSync(f.file, 'utf8'), f.original);
  }
  const commands = readFileSync(f.log, 'utf8').trim().split('\n').map(JSON.parse);
  assert.deepEqual(commands.map(c => c.command), ['yarn', 'yarn', 'bash', 'yarn', 'yarn', 'bash']);
  assert.deepEqual(commands[0].args, ['install', '--immutable']);
  assert.deepEqual(commands[1].args, ['build:deps']);
});

test('a real dependency change remains visible instead of being restored away', t => {
  const f = fixture(t, 'value');
  assert.equal(f.run().status, 0);
  assert.equal(JSON.parse(readFileSync(f.file, 'utf8')).dependencies['@farmslot/adapter-rn'], '0.31.2');
});

test('failed installs keep their failure and cannot dirty the manifest by reordering it', t => {
  const f = fixture(t, 'fail');
  assert.equal(f.run().status, 17);
  assert.equal(readFileSync(f.file, 'utf8'), f.original);
  assert.equal(readFileSync(f.log, 'utf8').trim().split('\n').length, 1);
});
