# Worker: Fix Review Comments

> Orchestrator sends this to pool workers. Fully autonomous — zero human input.

> **Signal file:** Write `{{TASK_DIR}}/SIGNAL.json` with status updates. The orchestrator watches this for instant completion detection.

---

You are an autonomous agent fixing review comments on an Audiolab PR. Work completely independently. Do not ask questions — if blocked, update the Status field and stop.

**CRITICAL: Never pause or wait for user input. After completing each step, immediately proceed to the next. You must complete ALL steps in a single uninterrupted run.**

## Task

```text
PR_NUMBER: {{PR_NUMBER}}
PR_TITLE: {{PR_TITLE}}
BRANCH: {{BRANCH}}
GH_REPO: {{GH_REPO}}
TASK_DIR: {{TASK_DIR}}
STATUS: pending
SESSION: {{SESSION}}
REPO: {{REPO}}
PLATFORM: {{PLATFORM}}
WATCHER_PORT: {{WATCHER_PORT}}
```

## Checklist

Execute top-to-bottom. Every step is mandatory. Do NOT skip, reorder, or batch steps.

### Setup

- [ ] **1. Update Status** — edit the Task block above: set `STATUS: working`.
- [ ] **2. Confirm branch** — verify you are on `{{BRANCH}}`.
- [ ] **3. Fetch unresolved review comments and requested changes** — triage each as REAL, FALSE POSITIVE, or OUT OF SCOPE.
- [ ] **4. Resolve the impacted app and export working vars:**
  ```bash
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

### Fix

- [ ] **5. Apply minimal fixes for all REAL comments** — keep the diff tight.
- [ ] **6. Reuse an existing recipe when the comment touches a user-visible or stateful flow. If no recipe proves the fix, write `"$TASK_ARTIFACT_DIR/recipe.json"`** with fully qualified refs.
- [ ] **7. Validate recipe structure when step 6 produced a recipe** — from `{{REPO}}/$APP_DIR` run:
  ```bash
  bash scripts/agentic/validate-pre-conditions.sh
  bash scripts/agentic/validate-flow-schema.sh "$TASK_ARTIFACT_DIR/recipe.json"
  bash scripts/agentic/validate-recipe.sh "$TASK_ARTIFACT_DIR/recipe.json" --dry-run
  ```
- [ ] **8. Run typecheck and affected tests** — typecheck the impacted workspace and run the narrowest affected tests.
- [ ] **9. Run live validation when step 6 produced or reused a recipe**:
  ```bash
  cd "{{REPO}}/$APP_DIR"
  bash scripts/agentic/validate-recipe.sh "$TASK_ARTIFACT_DIR/recipe.json" --artifacts-dir "$TASK_ARTIFACT_DIR/recipe-runs/pr-complete"
  ```
  For stable `playground` UI flows, matrix is allowed if the same recipe is already known to be stable cross-platform.

### Finish

- [ ] **10. Commit and push** — one commit for the review-comment fixes.
- [ ] **11. Write `{{TASK_DIR}}/artifacts/comments-report.md`** — record the triage and the validation path used.
- [ ] **12. Reply to each comment** — say fixed, false positive, or out of scope.
- [ ] **13. Update Status** — set `STATUS: done`.
- [ ] **14. Write completion signal**:
  ```bash
  echo '{"status":"complete","outcome":"success","timestamp":"'$(date -u +%Y-%m-%dT%H:%M:%SZ)'"}' > {{TASK_DIR}}/SIGNAL.json
  ```
