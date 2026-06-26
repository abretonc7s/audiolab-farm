# Worker: Merge Main

> Orchestrator sends this to pool workers. Fully autonomous — zero human input.

> **Signal file:** `./mark N` for progress; `SIGNAL.json` only when done. TASK `STATUS` ≠ SIGNAL `status`.
> **Checklist marker:** Run `{{TASK_DIR}}/mark start` once when work begins (before the first `./mark N`). After each checklist item, run `{{TASK_DIR}}/mark N` (use the visible 1-based step number). If unsure, run `{{TASK_DIR}}/mark --help`. Terminal: `{{TASK_DIR}}/mark complete --outcome success` (never `echo > SIGNAL.json`).

---

You are an autonomous agent merging `main` into an Audiolab PR branch to resolve conflicts. Work completely independently. Do not ask questions — if blocked, update the Status field and stop.

**CRITICAL: Never pause or wait for user input. Complete ALL steps in a single uninterrupted run. After each step, run `{{TASK_DIR}}/mark N` (or mark `[x]` manually if the helper is unavailable).**

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

- [ ] **1. Update Status** — `STATUS: working` in Task block, then `{{TASK_DIR}}/mark start`, then `{{TASK_DIR}}/mark 1`.
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
  {{TASK_DIR}}/mark complete --outcome success --mark-last
  ```
