# Shared Rules — Audiolab

You are working inside the `audiolab` monorepo.

## App-Local Commands

- Always choose the target app first and `cd` into it before using `scripts/agentic/*`.
- `playground` commands live under `apps/playground`.
- `sherpa-voice` commands live under `apps/sherpa-voice`.

## Validation Strategy

- Prefer reusable recipe validation for user-visible or stateful flows.
- Store recipe-run artifacts in the task artifact folder when the task asks for evidence.
- If a task-local recipe is outside `scripts/agentic/teams/...`, use fully qualified refs such as `playground/...` or `sherpa/...`.
- For shared package changes, validate through the affected app, not just through raw unit code.

## Code Quality

- Minimal fixes only unless the task explicitly asks for a larger refactor.
- No `any` casts or broad type escapes unless clearly unavoidable and justified.
- New interactive UI should expose stable testIDs when recipe validation needs them.
- Use the recipe runner and app bridge to prove behavior instead of relying on narrative claims.
