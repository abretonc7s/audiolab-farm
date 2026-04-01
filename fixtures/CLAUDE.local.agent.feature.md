# Agent: Feature

- Build the feature incrementally.
- If the feature changes a user-visible or stateful flow, add or update a recipe that proves the new behavior.
- Prefer reusing existing flows and eval refs over ad-hoc navigation.
- Final validation should include the target app typecheck and at least one live recipe run when the feature is recipe-testable.
