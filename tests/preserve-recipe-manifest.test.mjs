import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { copyFileSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { preserveRecipeManifest } from '../scripts/preserve-recipe-manifest.mjs';

function fixture(t) {
  const repo = mkdtempSync(path.join(tmpdir(), 'audiolab-manifest-'));
  t.after(() => rmSync(repo, { recursive: true, force: true }));
  mkdirSync(path.join(repo, 'scripts/agentic'), { recursive: true });
  const file = path.join(repo, 'scripts/agentic/package.json');
  const original = '{\n    "private": true,\n    "dependencies": {"z": "1", "a": "2"}\n}\n';
  writeFileSync(file, original);
  return { repo, file, original };
}

test('guard preserves formatting and order without hiding actual content changes', t => {
  const f = fixture(t);
  preserveRecipeManifest(f.repo, () => writeFileSync(f.file, '{"dependencies":{"a":"2","z":"1"},"private":true}'));
  assert.equal(readFileSync(f.file, 'utf8'), f.original);
  preserveRecipeManifest(f.repo, () => writeFileSync(f.file, '{"dependencies":{"a":"3","z":"1"},"private":true}'));
  assert.equal(JSON.parse(readFileSync(f.file, 'utf8')).dependencies.a, '3');
});

test('guard returns the original command failure after preserving order', t => {
  const f = fixture(t);
  const failure = new Error('build failed');
  assert.throws(() => preserveRecipeManifest(f.repo, () => {
    writeFileSync(f.file, '{"dependencies":{"a":"2","z":"1"},"private":true}');
    throw failure;
  }), error => error === failure);
  assert.equal(readFileSync(f.file, 'utf8'), f.original);
});

test('older checkouts without an agentic workspace still execute their operation', t => {
  const f = fixture(t);
  rmSync(f.file);
  assert.equal(preserveRecipeManifest(f.repo, () => 23), 23);
});

test('installed runtime launch entrypoint guards its native preflight writer', t => {
  const f = fixture(t);
  const scripts = path.join(f.repo, 'pack');
  mkdirSync(scripts);
  for (const name of ['runtime.sh', 'preserve-recipe-manifest.mjs']) {
    copyFileSync(fileURLToPath(new URL(`../scripts/${name}`, import.meta.url)), path.join(scripts, name));
  }
  writeFileSync(path.join(scripts, 'env.sh'), 'audiolab_app_root() { printf "%s/apps/playground\\n" "$1"; }\n');
  const app = path.join(f.repo, 'apps/playground');
  mkdirSync(path.join(app, 'scripts/agentic'), { recursive: true });
  writeFileSync(path.join(app, 'scripts/agentic/preflight.sh'), `#!/bin/bash\n"${process.execPath}" -e 'require("node:fs").writeFileSync(${JSON.stringify(f.file)},JSON.stringify({dependencies:{a:"2",z:"1"},private:true}))'\n`);
  const result = spawnSync('bash', [path.join(scripts, 'runtime.sh'), 'launch', f.repo, '7465', '7670', 'ios', 'fixture-simulator'], { encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr);
  assert.equal(readFileSync(f.file, 'utf8'), f.original);
});
