import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const keys = ['AUDIOLAB_NPM_TOKEN', 'EAS_PROJECT_ID', 'APPLE_TEAM_ID'];
const script = fileURLToPath(new URL('../scripts/env.sh', import.meta.url));
const values = value => Object.fromEntries(keys.map(key => [key, value]));

function load(t, { inherited = {}, launch = '', tmux = '', keychain = '', missingSecurity = false }, expected) {
  const root = mkdtempSync(path.join(tmpdir(), 'audiolab-env-'));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const bin = path.join(root, 'bin');
  mkdirSync(bin);
  for (const name of ['dirname', 'sed']) symlinkSync(`/usr/bin/${name}`, path.join(bin, name));
  symlinkSync(process.execPath, path.join(bin, 'node'));
  const providers = {
    launchctl: 'key="$2"; value="$F437_LAUNCH"',
    tmux: 'key="$3"; value="$F437_TMUX"',
    security: 'value="$F437_KEYCHAIN"',
  };
  for (const [name, select] of Object.entries(providers)) {
    if (name === 'security' && missingSecurity) continue;
    writeFileSync(path.join(bin, name), `#!/bin/bash
printf '%s\\n' '${name} '"$*" >> "$F437_CALLS"
${select}
if [ -z "$value" ]; then echo 'provider unavailable' >&2; exit 44; fi
${name === 'tmux' ? 'printf "%s=%s\\n" "$key" "$value"' : 'printf "%s\\n" "$value"'}
`, { mode: 0o755 });
  }
  const callsFile = path.join(root, 'calls');
  writeFileSync(callsFile, '');
  const verify = `const expected=JSON.parse(process.env.F437_EXPECTED);
if(!Object.entries(expected).every(([key,value])=>value===null ? !(key in process.env) : process.env[key]===value))process.exit(7);`;
  const result = spawnSync('/bin/bash', ['-c', 'set -eu; source "$F437_SCRIPT"; node -e "$F437_VERIFY"'], {
    encoding: 'utf8',
    env: {
      PATH: bin, AUDIOLAB_NODE_BIN: bin, F437_SCRIPT: script, F437_VERIFY: verify,
      F437_CALLS: callsFile, F437_EXPECTED: JSON.stringify(expected),
      F437_LAUNCH: launch, F437_TMUX: tmux, F437_KEYCHAIN: keychain, ...inherited,
    },
  });
  assert.equal(result.status, 0, 'loader or inherited-value check failed');
  assert.equal(result.stdout, '', 'loader must not print values');
  assert.equal(result.stderr, '', 'provider failures must stay quiet');
  return readFileSync(callsFile, 'utf8').trim().split('\n').filter(Boolean);
}

for (const [name, options, expected, providers] of [
  ['inherited values win', { inherited: values('inherited-fixture'), launch: 'launch-fixture', tmux: 'tmux-fixture', keychain: 'keychain-fixture' }, values('inherited-fixture'), []],
  ['launchctl precedes tmux and Keychain', { launch: 'launch-fixture', tmux: 'tmux-fixture', keychain: 'keychain-fixture' }, values('launch-fixture'), ['launchctl']],
  ['tmux precedes Keychain', { tmux: 'tmux-fixture', keychain: 'keychain-fixture' }, values('tmux-fixture'), ['launchctl', 'tmux']],
  ['Keychain survives missing reboot-time providers', { keychain: 'keychain-fixture' }, values('keychain-fixture'), ['launchctl', 'tmux', 'security']],
]) {
  test(name, t => {
    const calls = load(t, options, expected);
    assert.deepEqual(calls.map(call => call.split(' ')[0]), keys.flatMap(() => providers));
    if (providers.includes('security')) {
      assert.deepEqual(calls.filter(call => call.startsWith('security ')), keys.map(key =>
        `security find-generic-password -a deeeed -s ${key} -w`));
    }
  });
}

for (const missingSecurity of [false, true]) {
  test(`${missingSecurity ? 'missing security command' : 'unavailable Keychain'} stays quiet and preserves the public npm default`, t => {
    load(t, { missingSecurity }, { AUDIOLAB_NPM_TOKEN: '', EAS_PROJECT_ID: null, APPLE_TEAM_ID: null });
  });
}
