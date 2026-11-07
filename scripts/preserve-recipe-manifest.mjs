#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { isDeepStrictEqual } from 'node:util';

export function preserveRecipeManifest(repo, operation) {
  const file = path.join(repo, 'scripts/agentic/package.json');
  const original = existsSync(file) ? readFileSync(file, 'utf8') : null;
  const manifest = original === null ? null : JSON.parse(original);
  try {
    return operation();
  } finally {
    if (original !== null) {
      const current = readFileSync(file, 'utf8');
      // Yarn persists normalized dependency order even under --immutable.
      // Retain the checkout's bytes only when no actual manifest content changed.
      if (current !== original && isDeepStrictEqual(JSON.parse(current), manifest)) {
        writeFileSync(file, original);
      }
    }
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const [repo, command, ...args] = process.argv.slice(2);
  if (!repo || !command) throw new Error('Usage: preserve-recipe-manifest.mjs <repo> <command> [args...]');
  process.exitCode = preserveRecipeManifest(repo, () => {
    const result = spawnSync(command, args, { stdio: 'inherit', env: {
      ...process.env, FARMSLOT_RECIPE_MANIFEST_GUARD: '1',
    } });
    if (result.error) throw result.error;
    return result.status ?? 1;
  });
}
