# Audiolab Agentic Toolkit

This farm targets the `audiolab` monorepo. The shared recipe runner lives at repo root, but every command should be run from the target app directory.

## Target App

Choose the app before you validate:

- `apps/playground` -> team `playground` -> workspace `audio-playground`
- `apps/sherpa-voice` -> team `sherpa` -> workspace `@siteed/sherpa-voice`

Default slot warm-up boots `playground`. If the task is really about `sherpa-voice` or `packages/sherpa-onnx.rn`, relaunch from `apps/sherpa-voice` with the current slot port:

```bash
WATCHER_PORT={{port}} yarn ios:launch
WATCHER_PORT={{port}} yarn android:launch
WATCHER_PORT={{port}} yarn web
```

If you are dispatching or preparing the slot yourself, select the app up front instead of warming the wrong one:

```bash
farmslot slot prepare <slot-id> --app apps/sherpa-voice
farmslot dispatch execute <slot-id> <task-file> --app apps/sherpa-voice
```

## Read First

- `scripts/agentic/README.md`
- `apps/playground/docs/AGENTIC_FEEDBACK_LOOPS.md`
- `apps/sherpa-voice/docs/AGENTIC_FEEDBACK_LOOPS.md`

## Core Commands

Run these from the chosen app directory.

```bash
yarn devices
bash scripts/agentic/validate-flow-schema.sh
bash scripts/agentic/validate-pre-conditions.sh
bash scripts/agentic/validate-recipe.sh <recipe.json>
bash scripts/agentic/validate-recipe.sh <recipe.json> --dry-run
bash scripts/agentic/validate-recipe.sh <recipe.json> --matrix ios,android,web
```

Useful flags:

- `--artifacts-dir <path>` sends recipe-run artifacts into the task artifact folder instead of the app's `.agent/recipe-runs`.
- `--no-hud` disables the in-app step HUD. Leave HUD enabled by default unless a task says otherwise.
- `--update-baselines` is only for intentional screenshot baseline refreshes.

## Recipe Rules

- Reuse existing flows and eval refs first.
- If your task-local recipe lives outside `scripts/agentic/teams/...`, every `flow_ref` and `eval_ref` must be fully qualified:
  - `playground/record-screen-smoke`
  - `playground/route`
  - `sherpa/asr-screen-smoke`
  - `sherpa/asr-ui`
- Run schema validation, pre-condition validation, then `--dry-run` before a live run.
- Keep recipes focused on the bug or feature claim, not on generic app boot checks.
- A good recipe would fail if the fix were reverted.

## Platform Guidance

- `playground` stable UI flows are good candidates for `--matrix ios,android,web`.
- `sherpa-voice` flows should usually start with one live platform. Use matrix only when the exact flow is already known to work across all three targets.
- The runner already captures route, state, logs, and screenshots on failure. Use that instead of adding noisy debug steps.

## Typecheck

From repo root:

```bash
yarn workspace audio-playground typecheck
yarn workspace @siteed/sherpa-voice typecheck
```

Run the workspace that changed. If shared packages changed, run both.
