#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { preserveRecipeManifest } from './preserve-recipe-manifest.mjs';

const repo = path.resolve(process.argv[2]);
const scriptDir = path.dirname(fileURLToPath(import.meta.url));
process.exitCode = preserveRecipeManifest(repo, () => {
  for (const [command, args, cwd] of [
    ['yarn', ['install', '--immutable'], repo],
    ['yarn', ['build:deps'], path.join(repo, 'apps/playground')],
    ['bash', [path.join(scriptDir, 'prepare-web.sh'), repo], repo],
  ]) {
    const result = spawnSync(command, args, { cwd, stdio: 'inherit', env: {
      ...process.env, COREPACK_ENABLE_DOWNLOAD_PROMPT: '0',
    } });
    if (result.error) throw result.error;
    if (result.status !== 0) return result.status ?? 1;
  }

  return 0;
});
