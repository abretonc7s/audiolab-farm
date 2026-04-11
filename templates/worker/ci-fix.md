# Worker: CI Fix Pass

> CI-watch detected issues on your PR. Fix them, verify, commit and push.
> **Signal file:** Write `{{TASK_DIR}}/SIGNAL.json` when done.

**CRITICAL: Never pause or wait for user input. Complete ALL steps. Mark each checkbox as you complete it.**

---

## Task

```
TASK_DIR: {{TASK_DIR}}
PR: #{{PR_NUMBER}}
REPO: {{GH_REPO}}
BRANCH: {{BRANCH}}
ISSUE_TYPE: {{CI_ISSUE_TYPE}}
STATUS: pending
```

## Issues Detected

{{CI_ISSUES}}

---

## Checklist

### Triage (steps 1-2)

- [ ] **1. Update Status** — edit the Task block above: set `STATUS: working`.
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
  echo '{"status":"complete","outcome":"success","timestamp":"'$(date -u +%Y-%m-%dT%H:%M:%SZ)'"}' > {{TASK_DIR}}/SIGNAL.json
  ```
  **Do NOT `/exit`. Stay alive — CI-watch may nudge you again if new issues appear.**
