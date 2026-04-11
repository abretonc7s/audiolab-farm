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

## Recipe Validation & Video Evidence

### Graph Validation

After editing any recipe node, run schema validation then a dry run:

```bash
bash scripts/agentic/validate-flow-schema.sh              # catches orphaned nodes, dangling next pointers, cycles
bash scripts/agentic/validate-recipe.sh <recipe.json> --dry-run   # walks the graph without executing
```

Fix all issues before proceeding — then re-run both to confirm no regressions.

### Video Recording Philosophy

**Core principle: setup via eval, proof via navigation.**

- **Preconditions** (set state, toggle features) → use `eval_sync`/`eval_async`. Fast, no visual noise, no wasted video time.
- **Visual proof** → navigate FROM a different screen TO the target screen. Shows intent and the full transition.
- **Gate-check route**: before the visual proof section, detect the current route. If already on target, navigate away first so the video captures the full arrival.

**Video length**: aim for 15-30s of meaningful visual activity. >45s → move more setup into eval or split into segments.

**Animated scroll**: break long scrolls into 2+ intermediate steps with short pauses so motion is visible in the recording.

**Skeleton loading**: always `wait_for` the main content element after navigation before proceeding — don't record skeleton frames.

### Assertion Gotchas

- **`wait_for`**: checks React fiber tree existence, NOT visual visibility or scroll position. For transient states (<500ms like spinners), prove via side effects — list growth, log entries, state changes.
- **`log_watch`**: `watch_for` is informational (count only, no hard fail). Use `must_not_appear` for hard failures. To assert a log appeared, pair with a separate hard assertion.

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
