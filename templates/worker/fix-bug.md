# Worker: Fix Bug

> Orchestrator sends this to pool workers. Fully autonomous — zero human input.

> **Signal file:** `./mark N` for progress; `SIGNAL.json` only when done. TASK `STATUS` ≠ SIGNAL `status`.
> **Checklist marker:** Run `{{TASK_DIR}}/mark start` once when work begins (before the first `./mark N`). After each checklist item, run `{{TASK_DIR}}/mark N` (use the visible 1-based step number). If unsure, run `{{TASK_DIR}}/mark --help`. Terminal: `{{TASK_DIR}}/mark complete --outcome success` (never `echo > SIGNAL.json`).

---

You are an autonomous agent fixing a bug in the Audiolab monorepo. Work completely independently. Do not ask questions — if blocked, update the Status field and stop.

**CRITICAL: Never pause or wait for user input. Complete ALL steps in a single uninterrupted run. After each step, run `{{TASK_DIR}}/mark N` (or mark `[x]` manually if the helper is unavailable).**

## Task

```text
TICKET: {{TICKET}}
TICKET_URL: {{TICKET_URL}}
TITLE: {{TITLE}}
BRANCH: {{BRANCH}}
PR_NUMBER: {{PR_NUMBER}}
TASK_DIR: {{TASK_DIR}}
STATUS: pending
SESSION: {{SESSION}}
REPO: {{REPO}}
PLATFORM: {{PLATFORM}}
WATCHER_PORT: {{WATCHER_PORT}}
ADB_SERIAL: {{ADB_SERIAL}}
IOS_SIMULATOR: {{IOS_SIMULATOR}}
```

## Description

{{DESCRIPTION}}

## Acceptance Criteria

{{ACCEPTANCE_CRITERIA}}

## Affected Area

{{AFFECTED_AREA}}

## Screenshots

{{SCREENSHOTS}}

## Comments

{{COMMENTS}}

## Root Cause Hypothesis

> _Fill this in after investigation. Do not assume a root cause before you confirm it._

---

## Checklist

**When updating STATUS or checkboxes, make the edit idempotent.** If a line is already `[x]`, do not try to patch it again; verify the file state and continue.

Execute top-to-bottom. Every step is mandatory. Do NOT skip, reorder, or batch steps.


### Early no-change exit (before code/PR mutations)

After `STATUS: working`, first decide if a code fix is still needed. If the bug is already fixed or cannot be reproduced in a valid target environment, do not create a fake commit/PR. Write `{{TASK_DIR}}/artifacts/no-change-report.md` with proof/repro steps, observed result, and evidence paths, then write one terminal `SIGNAL.json` and stop.

- Already fixed / not reproducible: `status=complete`, `outcome=success`, `disposition=already_fixed|not_reproducible`, plus evidence `{ reportPath, artifacts, confidence, noCodeChange: true, reproductionAttempted: true }`.
- Blocked: use `status=blocked`, `outcome=partial`, `disposition=blocked` for branch/env/auth/device/CDP/precondition problems. Never call setup failure `not_reproducible`.

Signal shape:
```json
{ "status": "complete", "outcome": "success", "disposition": "already_fixed", "reason": "<one sentence>", "evidence": { "reportPath": "{{TASK_DIR}}/artifacts/no-change-report.md", "artifacts": ["{{TASK_DIR}}/artifacts/<proof>"], "confidence": "high", "noCodeChange": true, "reproductionAttempted": true }, "timestamp": "<UTC ISO8601>" }
```

### Setup

- [ ] **1. Read the recipe docs** — read `{{REPO}}/.agent/agentic-toolkit.md`, `{{REPO}}/scripts/agentic/README.md`, and the target app quick reference under `apps/*/docs/AGENTIC_FEEDBACK_LOOPS.md`.
- [ ] **2. Update Status** — `STATUS: working` in Task block, then `{{TASK_DIR}}/mark start`, then `{{TASK_DIR}}/mark 2`.
- [ ] **3. Resolve branch and PR number:**
  - If `PR_NUMBER` is set, confirm you are on `{{BRANCH}}`.
  - If `PR_NUMBER` is empty, create the branch, push it, and open a draft PR.
- [ ] **4. Resolve the target app and export working vars:**
  ```bash
  # Default to playground. Switch to sherpa-voice if the bug is in apps/sherpa-voice/ or packages/sherpa-onnx.rn/.
  export APP_DIR=apps/playground
  export TEAM=playground
  export WORKSPACE=audio-playground
  # Sherpa alternative:
  # export APP_DIR=apps/sherpa-voice
  # export TEAM=sherpa
  # export WORKSPACE=@siteed/sherpa-voice
  export TASK_ARTIFACT_DIR="{{REPO}}/{{TASK_DIR}}/artifacts"
  mkdir -p "$TASK_ARTIFACT_DIR"
  echo "APP_DIR=$APP_DIR TEAM=$TEAM WORKSPACE=$WORKSPACE"
  ```
- [ ] **5. Launch the target app if needed** — from `{{REPO}}/$APP_DIR`, run the app-local launcher for `{{PLATFORM}}` using `WATCHER_PORT={{WATCHER_PORT}}`. Then run `yarn devices`.
- [ ] **6. Inventory the existing agentic scenarios** — from `{{REPO}}/$APP_DIR`:
  ```bash
  find scripts/agentic/teams -maxdepth 3 -type f | sort
  ```

### Reproduce

- [ ] **7. Reproduce the bug before changing code** — use the app-local agentic commands to reach the affected route or flow.
- [ ] **8. If the bug affects a user-visible or stateful flow, write `"$TASK_ARTIFACT_DIR/recipe.json"` before code changes.**


Recipe rules:
  - Prefer existing `flow_ref` and `eval_ref` over raw steps.
  - Because the recipe file lives outside `scripts/agentic/teams/...`, every ref must be fully qualified like `playground/record-screen-smoke` or `sherpa/asr-ui`.
  - The recipe must assert the real broken behavior so it would fail if your fix were reverted.
  - Every executable recipe node must include `intent`: one short HUD sentence that tells the human what the agent is doing now.
  - Keep it focused. Use the runner's built-in HUD and failure artifacts instead of bloating the recipe.
- [ ] **9. Validate recipe structure** — from `{{REPO}}/$APP_DIR` run:
  ```bash
  bash scripts/agentic/validate-pre-conditions.sh
  bash scripts/agentic/validate-flow-schema.sh "$TASK_ARTIFACT_DIR/recipe.json"
  bash scripts/agentic/validate-recipe.sh "$TASK_ARTIFACT_DIR/recipe.json" --dry-run
  ```
  Skip the file-specific commands only if step 8 was legitimately skipped.

### Investigate and Fix

- [ ] **10. Read the affected code in full** — confirm the root cause with file and line references.
- [ ] **11. Update the Root Cause Hypothesis** — describe the actual bug source with file:line references.
- [ ] **12. Make the minimal fix** — no unrelated cleanup.
- [ ] **13. Add or update tests** where focused automated coverage is practical.

### Validate

- [ ] **14. Run typecheck** — from repo root:
  ```bash
  yarn workspace "$WORKSPACE" typecheck
  ```
  If shared packages changed, also run the other app workspace typecheck.
- [ ] **15. Run affected tests** — use the narrowest test command that covers the change.
- [ ] **16. Run live recipe validation when a recipe exists**:
  - Stable `playground` UI flows:
    ```bash
    cd "{{REPO}}/$APP_DIR"
    bash scripts/agentic/validate-recipe.sh "$TASK_ARTIFACT_DIR/recipe.json" --matrix ios,android,web --artifacts-dir "$TASK_ARTIFACT_DIR/recipe-runs/final"
    ```
  - Other recipe-backed fixes:
    ```bash
    cd "{{REPO}}/$APP_DIR"
    bash scripts/agentic/validate-recipe.sh "$TASK_ARTIFACT_DIR/recipe.json" --artifacts-dir "$TASK_ARTIFACT_DIR/recipe-runs/final"
    ```
  If step 8 was skipped, document the alternate validation path in the report.
- [ ] **17. Self-review the diff** — look for simpler fixes, test gaps, and missing testIDs on new interactive UI.

### Finish

- [ ] **18. Write `{{TASK_DIR}}/artifacts/report.md`** — include summary, root cause, changed files, tests, and recipe evidence.
- [ ] **19. Commit and push** — keep the commit message concise and factual.
- [ ] **20. Update Status** — set `STATUS: done`.
- [ ] **21. Write completion signal**:
  ```bash
  {{TASK_DIR}}/mark complete --outcome success --disposition fixed --mark-last
  ```
