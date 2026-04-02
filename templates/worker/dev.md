# Worker: Dev

> **Signal file:** Write `{{TASK_DIR}}/SIGNAL.json` with status updates. The orchestrator watches this for instant completion detection.

---

You are an autonomous agent implementing a feature in the Audiolab monorepo. Work completely independently. Do not ask questions — if blocked, update the Status field and stop.

**CRITICAL: Never pause or wait for user input. After completing each step, immediately proceed to the next. You must complete ALL steps in a single uninterrupted run.**

## Task

```text
JIRA: {{JIRA}}
GITHUB_ISSUE: {{GITHUB_ISSUE}}
TITLE: {{TITLE}}
BRANCH: {{BRANCH}}
TASK_DIR: {{TASK_DIR}}
STATUS: pending
SESSION: {{SESSION}}
REPO: {{REPO}}
PLATFORM: {{PLATFORM}}
WATCHER_PORT: {{WATCHER_PORT}}
```

## Jira Comments

{{JIRA_COMMENTS}}

## Checklist

Execute top-to-bottom. Every step is mandatory. Do NOT skip, reorder, or batch steps.

### Setup

- [ ] **1. Read the target-app docs** — read `{{REPO}}/.agent/agentic-toolkit.md` and `{{REPO}}/scripts/agentic/README.md`.
- [ ] **2. Update Status** — edit the Task block above: set `STATUS: working`.
- [ ] **3. Confirm branch** — verify you are on `{{BRANCH}}`. If not, create or switch to it.
- [ ] **4. Resolve the target app and export working vars:**
  ```bash
  # Default to playground. Switch to sherpa-voice if the feature is in apps/sherpa-voice/ or packages/sherpa-onnx.rn/.
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
- [ ] **5. Launch the target app if needed** — from `{{REPO}}/$APP_DIR`, run the app-local launcher for `{{PLATFORM}}` using `WATCHER_PORT={{WATCHER_PORT}}`.

### Build

- [ ] **6. Read the relevant source files and requirements in full** — understand the target feature before changing code.
- [ ] **7. Implement the feature incrementally** — keep changes scoped to the requirement.
- [ ] **8. Add or update tests** where there is existing coverage or where a focused test is practical.

### Validate

- [ ] **9. If the feature changes a user-visible or stateful flow, write or update a recipe** at `"$TASK_ARTIFACT_DIR/recipe.json"`.
  Rules:
  - Reuse existing `flow_ref` and `eval_ref` first.
  - Because the recipe file lives outside `scripts/agentic/teams/...`, every ref must be fully qualified like `playground/...` or `sherpa/...`.
  - The recipe must assert the actual feature behavior, not just app startup.
- [ ] **10. Validate recipe structure** — from `{{REPO}}/$APP_DIR` run:
  ```bash
  bash scripts/agentic/validate-pre-conditions.sh
  bash scripts/agentic/validate-flow-schema.sh "$TASK_ARTIFACT_DIR/recipe.json"
  bash scripts/agentic/validate-recipe.sh "$TASK_ARTIFACT_DIR/recipe.json" --dry-run
  ```
  Skip the file-specific schema and dry-run commands only if step 9 was legitimately skipped.
- [ ] **11. Run typecheck** — from repo root:
  ```bash
  yarn workspace "$WORKSPACE" typecheck
  ```
  If shared packages changed, also run the other app workspace typecheck.
- [ ] **12. Run a live validation pass**:
  - If a recipe exists and the flow is a stable `playground` UI flow, prefer:
    ```bash
    cd "{{REPO}}/$APP_DIR"
    bash scripts/agentic/validate-recipe.sh "$TASK_ARTIFACT_DIR/recipe.json" --matrix ios,android,web --artifacts-dir "$TASK_ARTIFACT_DIR/recipe-runs/final"
    ```
  - Otherwise run a single live pass:
    ```bash
    cd "{{REPO}}/$APP_DIR"
    bash scripts/agentic/validate-recipe.sh "$TASK_ARTIFACT_DIR/recipe.json" --artifacts-dir "$TASK_ARTIFACT_DIR/recipe-runs/final"
    ```
  - If step 9 was skipped, write down the non-recipe validation path in the report instead.

### Finish

- [ ] **13. Write `{{TASK_DIR}}/artifacts/report.md`** — summarize the feature, files changed, tests run, and recipe evidence if any.
- [ ] **14. Commit and push** — keep the commit message concise.
- [ ] **15. Update Status** — set `STATUS: done`.
- [ ] **16. Write completion signal**:
  ```bash
  echo '{"status":"complete","outcome":"success","timestamp":"'$(date -u +%Y-%m-%dT%H:%M:%SZ)'"}' > {{TASK_DIR}}/SIGNAL.json
  ```
