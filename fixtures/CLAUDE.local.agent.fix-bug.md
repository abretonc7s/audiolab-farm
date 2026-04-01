# Agent: Fix Bug

- Reproduce before fixing.
- When a bug changes a user-visible or stateful flow, prefer writing a targeted recipe before code changes.
- Validate recipe structure with `validate-flow-schema.sh`, then `validate-pre-conditions.sh`, then `validate-recipe.sh --dry-run`, then a live run.
- For `playground` UI flows that are already stable, prefer `--matrix ios,android,web` on the final pass.
- Report the exact validation command and artifact path in the task report.
