# Worker: Review PR

> Orchestrator sends this to pool workers. Fully autonomous — zero human input.

> **Signal file:** Write `{{TASK_DIR}}/SIGNAL.json` with status updates. The orchestrator watches this for instant completion detection.

---

You are an autonomous agent reviewing an Audiolab PR. Work completely independently. Do not ask questions — if blocked, update the Status field and stop.

**CRITICAL: Never pause or wait for user input. After completing each step, immediately proceed to the next. You must complete ALL steps in a single uninterrupted run.**

## Task

```text
PR_NUMBER: {{PR_NUMBER}}
PR_TITLE: {{PR_TITLE}}
PR_BRANCH: {{PR_BRANCH}}
PR_URL: {{PR_URL}}
REVIEW_TIER: {{REVIEW_TIER}}
TASK_DIR: {{TASK_DIR}}
STATUS: pending
SESSION: {{SESSION}}
REPO: {{REPO}}
PLATFORM: {{PLATFORM}}
WATCHER_PORT: {{WATCHER_PORT}}
```

## PR Body

{{PR_BODY}}

## Linked Tickets

{{LINKED_TICKETS}}

## Linked Ticket Descriptions

{{LINKED_DESCRIPTIONS}}

## Checklist

Execute top-to-bottom. Every step is mandatory. Do NOT skip, reorder, or batch steps.

### Setup

- [ ] **1. Read the recipe docs** — read `{{REPO}}/.agent/agentic-toolkit.md` and `{{REPO}}/scripts/agentic/README.md`.
- [ ] **2. Update Status** — edit the Task block above: set `STATUS: working`.
- [ ] **3. Fetch PR metadata and diff** — read the PR body, changed files, and full diff before forming conclusions.
- [ ] **4. Resolve the impacted app and export working vars:**
  ```bash
  # Default to playground. Switch to sherpa-voice if the diff is in apps/sherpa-voice/ or packages/sherpa-onnx.rn/.
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
- [ ] **5. Classify changed files** — separate UI and stateful app behavior from tests, docs, and config-only files.

### Review

- [ ] **6. Read every changed file in full** — not just the diff hunks.
- [ ] **7. Write down findings first** — focus on bugs, regressions, missing tests, or broken behavior. Do not start with a summary.
- [ ] **8. Decide whether live recipe validation is warranted:**
  - Required when the PR changes user-visible or stateful app behavior.
  - Optional when the PR is docs, config, type, or test-only.
- [ ] **9. If live validation is warranted, prefer an existing recipe or flow. If none proves the PR claim, write `"$TASK_ARTIFACT_DIR/recipe.json"`.**
  Rules:
  - Use fully qualified refs like `playground/...` or `sherpa/...`.
  - The recipe must prove the PR's claimed behavior, not just that the app boots.
- [ ] **10. Validate the review recipe** — from `{{REPO}}/$APP_DIR` run:
  ```bash
  bash scripts/agentic/validate-pre-conditions.sh
  bash scripts/agentic/validate-flow-schema.sh "$TASK_ARTIFACT_DIR/recipe.json"
  bash scripts/agentic/validate-recipe.sh "$TASK_ARTIFACT_DIR/recipe.json" --dry-run
  ```
  Skip the file-specific commands only if step 9 was legitimately skipped.
- [ ] **11. Run live validation when step 8 said it was warranted**:
  - Stable `playground` UI flows may use:
    ```bash
    cd "{{REPO}}/$APP_DIR"
    bash scripts/agentic/validate-recipe.sh "$TASK_ARTIFACT_DIR/recipe.json" --matrix ios,android,web --artifacts-dir "$TASK_ARTIFACT_DIR/recipe-runs/review"
    ```
  - Otherwise use:
    ```bash
    cd "{{REPO}}/$APP_DIR"
    bash scripts/agentic/validate-recipe.sh "$TASK_ARTIFACT_DIR/recipe.json" --artifacts-dir "$TASK_ARTIFACT_DIR/recipe-runs/review"
    ```
  Skip this step for code-only PRs, but explicitly say why in the review report.

### Report

- [ ] **12. Write `{{TASK_DIR}}/artifacts/review.md`** — findings first with file references, then open questions, then a brief summary.
- [ ] **13. Include a validation section** — say whether live recipe validation was run, skipped, or not applicable, and list the exact command and artifact path if it was run.
- [ ] **14. Update Status** — set `STATUS: done`.
- [ ] **15. Write completion signal**:
  ```bash
  echo '{"status":"complete","outcome":"success","timestamp":"'$(date -u +%Y-%m-%dT%H:%M:%SZ)'"}' > {{TASK_DIR}}/SIGNAL.json
  ```
