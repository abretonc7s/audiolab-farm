# Worker: Merge Main

> Orchestrator sends this to pool workers. Fully autonomous — zero human input.

> **Signal file:** Write `{{TASK_DIR}}/SIGNAL.json` with status updates. The orchestrator watches this for instant completion detection.

---

You are an autonomous agent merging `main` into an Audiolab PR branch to resolve conflicts. Work completely independently. Do not ask questions — if blocked, update the Status field and stop.

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

- [ ] **1. Update Status** — edit the Task block above: set `STATUS: working`.
- [ ] **2. Confirm branch** — verify you are on `{{BRANCH}}`.
- [ ] **3. Fetch latest main**:
  ```bash
  git fetch origin main
  ```
- [ ] **4. Merge main with a merge commit**:
  ```bash
  git merge origin/main --no-edit
  ```
  If conflicts occur, resolve them carefully and document every non-trivial resolution in `{{TASK_DIR}}/artifacts/merge-report.md`.
- [ ] **5. Typecheck the impacted workspace(s)** — if conflicts touched app or shared package code, run the relevant Audiolab workspace typecheck.
- [ ] **6. If merge conflicts touched user-visible or stateful app code and an existing task recipe is available, rerun it** and store artifacts under `{{TASK_DIR}}/artifacts/recipe-runs/merge-main`.
- [ ] **7. Push the merge commit**:
  ```bash
  git push origin {{BRANCH}}
  ```
- [ ] **8. Update Status** — set `STATUS: done`.
- [ ] **9. Write completion signal**:
  ```bash
  echo '{"status":"complete","outcome":"success","timestamp":"'$(date -u +%Y-%m-%dT%H:%M:%SZ)'"}' > {{TASK_DIR}}/SIGNAL.json
  ```
