# Worker: Update-Branch

> Orchestrator sends this to pool workers. Fully autonomous — zero human input.

> **Signal file:** `./mark N` for progress; `SIGNAL.json` only when done. TASK `STATUS` ≠ SIGNAL `status`.
> **Checklist marker:** Run `{{TASK_DIR}}/mark start` once when work begins (before the first `./mark N`). After each checklist item, run `{{TASK_DIR}}/mark N` (use the visible 1-based step number). If unsure, run `{{TASK_DIR}}/mark --help`. Terminal: `{{TASK_DIR}}/mark complete | {{TASK_DIR}}/mark no-change --reason "…" | {{TASK_DIR}}/mark blocked --reason "…"` (never hand-write `SIGNAL.json`).

---

You are an autonomous agent bringing an Audiolab PR branch up to date against its base
branch and keeping CI green. Work completely independently. Do not ask questions — if
blocked, update the Status field and stop.

**CRITICAL: Never pause or wait for user input. Complete ALL steps in a single uninterrupted run.**

## Task

```text
PR: {{PR_NUMBER}}
TITLE: {{PR_TITLE}}
BRANCH: {{PR_BRANCH}}
PR_BRANCH: {{PR_BRANCH}}
BRANCH_UPDATE_STRATEGY: {{BRANCH_UPDATE_STRATEGY}}
TASK_DIR: {{TASK_DIR}}
STATUS: pending
```

This is an **update-branch** run: bring this PR branch up to date against its base
branch and continue CI/finalization. The intent is not "make a merge commit from
main" — it is "update this branch, resolve any fallout, keep CI green."

## Strategy

`BRANCH_UPDATE_STRATEGY` selects how to update the branch:

- `rebase` — rebase the PR branch onto the base branch. Push with
  `git push --force-with-lease` (never a bare `--force`).
- `merge` — merge the base branch into the PR branch (merge commit). Push with a
  normal `git push`.
- `project-default` — this pack has no configured `merge_main_strategy`; its historical
  behavior is a **merge commit**, so resolve `project-default` to `merge`.

Record the concrete strategy you actually used in the outcome artifact.

## Checklist

- [ ] **1. Update Status** — set `STATUS: working` in the Task block, then `{{TASK_DIR}}/mark start`, then `{{TASK_DIR}}/mark 1`.
- [ ] **2. Confirm target + strategy** — verify you are on `{{PR_BRANCH}}`; resolve `BRANCH_UPDATE_STRATEGY` (rebase | merge | project-default) to the concrete strategy you will use.
- [ ] **3. Fetch latest base**:
  ```bash
  git fetch origin main
  ```
- [ ] **4. Update branch** — update from `origin/main` using the selected strategy:
  - `merge`: `git merge origin/main --no-edit`
  - `rebase`: `git rebase origin/main`

  If conflicts occur, resolve them carefully and document every non-trivial resolution in `{{TASK_DIR}}/artifacts/report.md`.
- [ ] **5. Typecheck the impacted workspace(s)** — if conflicts touched app or shared package code, run the relevant Audiolab workspace typecheck.
- [ ] **6. Rerun task recipe if needed** — if the update touched user-visible or stateful app code and an existing task recipe is available, rerun it and store artifacts under `{{TASK_DIR}}/artifacts/recipe-runs/update-branch`.
- [ ] **7. Push** — publish the updated branch. For `rebase`, use `git push --force-with-lease`; for `merge`, a normal `git push origin {{PR_BRANCH}}`. Record the exact push command used.
- [ ] **8. Write report** — create `{{TASK_DIR}}/artifacts/report.md` recording: **selected strategy** (rebase | merge), **conflict resolution summary**, **typecheck / recipe results**, **push command used**, and **risk notes** (force-push impact, follow-up needed).
- [ ] **9. Write `{{TASK_DIR}}/artifacts/learnings.md`** — required packaged evidence. Use 3–5 bullets on key learnings or struggles during the session; if nothing relevant: `- Nothing relevant — straightforward run; no blockers or surprises.`
- [ ] **10. Update Status and signal** — set `STATUS: done`, then run: `{{TASK_DIR}}/mark complete --mark-last`
