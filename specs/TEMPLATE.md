---
id: spec-000
title: "Short, imperative description of what is being built"
status: pending
# status options: pending | in-progress | completed | blocked
priority: medium
# priority options: high | medium | low
scope: standard
# scope options: narrow | standard | broad
#   narrow   — bug fix, typo, isolated config, single-function change
#   standard — new feature, new component, new API route
#   broad    — cross-cutting changes, schema migrations, new domain
created: YYYY-MM-DD
pr: null
---

## Summary

One paragraph. What is being built, why it exists, and what user or system problem it solves. Write this as if explaining to an engineer who has never seen the codebase.

---

## Context Discovery

> The agent reads this section before writing any code.
> Be explicit — every file listed here saves the agent from wasted discovery time.

### Files to Read First

| File                                      | Why                                            |
| ----------------------------------------- | ---------------------------------------------- |
| `src/path/to/pattern-file`                | Follow this pattern for the new code           |
| `docs/superpowers/best-practices/<x>.md`  | Required convention                            |

### Similar Implementations to Study

| File                              | What to learn from it                   |
| --------------------------------- | --------------------------------------- |
| `src/path/to/similar-feature`     | Pattern for error handling and logging  |

---

## Requirements

> Requirements must be **specific and testable**. Vague requirements produce vague implementations.

### Functional Requirements

- [ ] REQ-1: [What the system must do — specific, observable behavior]
- [ ] REQ-2: [What the system must do — specific, observable behavior]

### Non-Functional Requirements

- [ ] Type safety: no unchecked escape hatches without a justification comment
- [ ] All existing tests continue to pass
- [ ] New logic has test coverage (see Test Requirements below)
- [ ] No new lint warnings introduced

---

## Files to Create or Modify

> Explicit file mapping removes ambiguity. The agent should not have to guess where to put things.

| Action | Path                                           | Purpose                 |
| ------ | ---------------------------------------------- | ----------------------- |
| create | `src/path/to/new-file`                         | [purpose]               |
| modify | `src/path/to/existing-file`                    | [what changes]          |
| create | `src/path/to/__tests__/new-file.test`          | Tests for new logic     |

---

## Test Requirements

> Be explicit about what needs test coverage. "Write tests" is not a test requirement.

- [ ] Unit test: [expected behavior] when [specific input]
- [ ] Unit test: [typed error] thrown/returned when [specific failure condition]
- [ ] Integration test: [if applicable]

---

## Constraints and Anti-Patterns

> Tell the agent what NOT to do. This section prevents the most common mistakes.

- **Do not** [pattern the team avoids]
- **Do not** introduce a new pattern for X — follow the existing pattern in [directory]
- [Required pattern]

---

## Definition of Done

> The agent checks every item here before marking this spec `completed`.
> Do not mark complete if any item is unchecked.

- [ ] All functional requirements (REQ-1 through REQ-N) implemented
- [ ] `_not configured_` passes with zero errors
- [ ] `_not configured_` passes with zero warnings
- [ ] `_not configured_` passes — no regressions
- [ ] `_not configured_` applied and `_not configured_` passes
- [ ] Spec status updated to `completed`

---

## Open Questions

> Unresolved decisions that may require human input.

- [ ] [Question 1 — what decision needs to be made, and what are the options?]

---

## Implementation Notes

> Optional. Specific hints, gotchas, or decisions already made that the agent should know.

- [Example: "The `Foo` type is defined in `src/types/foo.ts` — import from there, do not redefine"]
