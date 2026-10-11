# Worker: CI Fix Pass

> CI-watch detected issues on your PR. Fix them, verify, commit and push.
> **Signal file:** `./mark N` for progress; `SIGNAL.json` when done.
> **Checklist marker:** Run `{{TASK_DIR}}/mark start` once when work begins (before the first `./mark N`). After each checklist item, run `{{TASK_DIR}}/mark N` (use the visible 1-based step number). If unsure, run `{{TASK_DIR}}/mark --help`. Terminal: `{{TASK_DIR}}/mark complete --outcome success` (never `echo > SIGNAL.json`).

**CRITICAL: Never pause or wait for user input. Complete ALL steps. After each step, run `{{TASK_DIR}}/mark N` (or mark `[x]` manually if the helper is unavailable).**

---

## Task

```
TASK_DIR: {{TASK_DIR}}
PR: #{{PR_NUMBER}}
REPO: {{GH_REPO}}
BRANCH: {{BRANCH}}
ISSUE_TYPE: {{CI_ISSUE_TYPE}}
```

## Issues Detected

{{CI_ISSUES}}

---

## Checklist

### Triage (steps 1-2)

- [ ] **1. Start** — `{{TASK_DIR}}/mark start`, then `{{TASK_DIR}}/mark 1`.
- [ ] **2. Fetch full context:**
  - If review comments: `unset GH_TOKEN && gh api "repos/{{GH_REPO}}/pulls/{{PR_NUMBER}}/comments" --jq '.[] | select(.in_reply_to_id == null) | {id: .id, author: .user.login, body: .body, path: .path, line: .line}'`
  - If CI failures: `unset GH_TOKEN && gh pr checks {{PR_NUMBER}} --repo {{GH_REPO}} 2>&1 | grep -iE 'fail|error'`

### Fix (steps 3-4)

- [ ] **3. Triage each issue** — classify as REAL (needs fix) or FALSE POSITIVE (dismiss/ignore).
- [ ] **4. Apply minimal fixes** — fix exactly what was flagged, nothing more.

### Verify (steps 5-6)

- [ ] **5. Auto-fix + CI parity gate:**
  ```bash
  cd {{REPO}}
  # Auto-fix (best-effort, NOT a gate):
  yarn lint:fix || true

  # CI PARITY CHECK (strict — must all pass before pushing):
  # DO NOT substitute `lint:fix` — it's an auto-fixer that exits 0, not a validator.
  yarn lint 2>&1 | tail -20
  yarn lint:tsc 2>&1 | tail -30
  ```
  STOP if any command exits non-zero. Fix the errors before proceeding.
- [ ] **6. Run affected tests** (if any test files changed):
  ```bash
  yarn jest <changed-test-files> --no-coverage 2>&1 | tail -20
  ```

### Commit & Reply (steps 7-8)

- [ ] **7. Commit and push:**
  ```bash
  # Only stage files YOU intentionally changed for the fix.
  # Do NOT use `git add -A` — lint:fix may have modified unrelated files.
  git add <file1> <file2> ...
  git commit -m "fix: address CI feedback" && git push
  ```
- [ ] **8. Reply to each bot comment thread** (skip if CI-failures-only):
  ```bash
  unset GH_TOKEN && gh api "repos/{{GH_REPO}}/pulls/{{PR_NUMBER}}/comments/{COMMENT_ID}/replies" -X POST -f body="Fixed in $(git rev-parse --short HEAD)"
  ```

### Signal (step 9)

- [ ] **9. Write SIGNAL.json:**
  ```bash
  {{TASK_DIR}}/mark complete --outcome success --mark-last
  ```
  **Do NOT `/exit`. Stay alive — CI-watch may nudge you again if new issues appear.**

## Acceptance verdicts + recipe coverage

Before successful completion or handing off this PR, set `export TASK_DIR="{{TASK_DIR}}"`. Use the deployed agent runtime, not the application checkout's dependencies:

```bash
FARMSLOT_ACCEPTANCE_ROOT="{{farmslot_dir}}"
case "$FARMSLOT_ACCEPTANCE_ROOT" in
  "~/"*) FARMSLOT_ACCEPTANCE_ROOT="$HOME/${FARMSLOT_ACCEPTANCE_ROOT#\~/}" ;;
esac
node "$FARMSLOT_ACCEPTANCE_ROOT/packages/agent-runtime/bin/farmslot-agent.mjs" ac list
```

If `ac list` has no registered criteria, skip ledger recording/rendering and retain the task's existing recipe-coverage workflow. Otherwise, record an honest verdict for each AC with `node "$FARMSLOT_ACCEPTANCE_ROOT/packages/agent-runtime/bin/farmslot-agent.mjs" ac set AC-N proven --proof-mode state --recipe-node <node-id> --evidence <task-relative-path>`. Use the actual state, visual or mixed mode and existing evidence; omit the recipe node when no recipe applies. Use `untestable --note <reason>` only when proof is unavailable. Check `ac list` again.

When a recipe exists and ACs are registered, render coverage to a temporary file and replace the existing coverage only after success:

```bash
coverage_tmp=$(mktemp "{{TASK_DIR}}/artifacts/recipe-coverage.XXXXXX")
if node "$FARMSLOT_ACCEPTANCE_ROOT/packages/agent-runtime/bin/farmslot-agent.mjs" ac render > "$coverage_tmp"; then
  mv "$coverage_tmp" "{{TASK_DIR}}/artifacts/recipe-coverage.md"
else
  rm -f "$coverage_tmp"
  exit 1
fi
```

Before `mark complete`, run `node "$FARMSLOT_ACCEPTANCE_ROOT/packages/agent-runtime/bin/farmslot-agent.mjs" artifact-check "{{TASK_DIR}}" --require-recipe-coverage-if-recipe --require-acceptance-status`. Refresh affected verdicts and coverage after the final proof run. Checklist completion alone does not assess an AC.
