# Spec Conventions

Specs are the primary interface between humans and the Claude Agent. A well-written spec produces a correct, focused implementation. A vague spec produces code that needs significant rework.

---

## Core Principles

### 1. Specs are executable instructions, not design documents

Write for an agent that has no context about the feature, the team's intent, or the business rationale — only what is written in the spec and the codebase itself.

**Bad:** "Add a risk dashboard component"
**Good:** "Create a read-only dashboard at `/dashboard/risk` that displays the current portfolio's VaR, liquidation threshold, and collateral ratio from the `portfolio_snapshots` table"

### 2. Every ambiguity is a potential bug

If two reasonable engineers would interpret a requirement differently, resolve it in the spec before the agent implements it. The agent will pick one interpretation and commit it.

### 3. Scope classification determines agent behavior

The `scope` frontmatter field is not cosmetic — the agent uses it to decide how much discovery to do before coding:

| Scope      | Discovery depth                      | When to use                                        |
| ---------- | ------------------------------------ | -------------------------------------------------- |
| `narrow`   | Minimal — adjacent files only        | Bug fix, config tweak, single-function change      |
| `standard` | Full — all docs in Context Discovery | New feature, component, API route                  |
| `broad`    | Full + explicit data flow mapping    | Schema migration, new domain, cross-cutting change |

Over-scoping wastes the agent's execution window. Under-scoping causes the agent to miss critical patterns.

### 4. Context Discovery saves tokens and time

The agent has a limited execution window. Every file listed in **Context Discovery** is a direct instruction — "read this before writing anything." Unlisted files will be discovered organically, but that costs time and risks missing them entirely.

List files that:

- Define patterns the new code must follow
- Contain types or contracts the new code must satisfy
- Contain tests that reveal expected behavior

### 5. The Definition of Done is a checklist, not a summary

The agent runs each item in the DoD before marking the spec `completed`. Write items as verifiable actions, not descriptions.

**Bad:** "Implementation is correct and tested"
**Good:** "`_not configured_` passes with no regressions"

### 6. Constraints prevent the most common failures

The agent cannot read your mind about what patterns to avoid. The Constraints section is where you make implicit team knowledge explicit. If there's a pattern the team always avoids, write it here.

---

## Frontmatter Fields

| Field      | Type           | Required | Notes                                                        |
| ---------- | -------------- | -------- | ------------------------------------------------------------ |
| `id`       | `spec-NNN`     | Yes      | Sequential, unique                                           |
| `title`    | string         | Yes      | Imperative: "Add X", "Fix Y", "Migrate Z"                    |
| `status`   | enum           | Yes      | `pending` → `in-progress` → `completed` or `blocked`         |
| `priority` | enum           | Yes      | `high` / `medium` / `low`                                    |
| `scope`    | enum           | Yes      | `narrow` / `standard` / `broad`                              |
| `created`  | date           | Yes      | ISO format `YYYY-MM-DD`                                      |
| `pr`       | number or null | Auto     | Set when the PR is opened. Do not set manually               |

### Status lifecycle

```
pending      → /plan picks it up           → in-progress
in-progress  → /implement + /qa succeed    → completed
in-progress  → Blocker hit                 → blocked (human must resolve)
blocked      → Blocker resolved            → pending (reset for next run)
```

---

## Writing Requirements

Requirements must be:

- **Specific** — no room for interpretation
- **Observable** — the agent (and a human reviewer) can verify it
- **Atomic** — one thing per bullet, not "X and Y and Z"

Use the REQ-N prefix for traceability — the agent's completion report references requirements by ID.

### Example: Weak vs. Strong requirements

**Weak:**

> Add error handling to the position calculation

**Strong:**

> REQ-1: `calculatePositionRisk()` returns a typed `RiskCalculationError` (defined in `src/types/errors.ts`) when the collateral value is zero or negative, rather than throwing or returning `null`

---

## File Mapping

Always provide the file mapping table. This is one of the highest-value sections:

- It tells the agent exactly where to create files (no guessing conventions)
- It prevents files from being placed in wrong directories
- It makes the PR diff predictable for reviewers

---

## What Happens When a Spec Is Ambiguous

If the agent cannot determine the correct behavior from the spec and codebase, it will:

1. Document the specific ambiguity
2. Implement the most conservative interpretation
3. Continue with remaining parts of the spec
4. Mark the spec `blocked` if the ambiguity is in a critical path

Resolve blockers by updating the spec and resetting status to `pending`.

---

## Anti-Patterns to Avoid When Writing Specs

- **Vague requirements:** "Make it better", "Improve performance", "Clean up the code"
- **Missing file hints:** Requiring the agent to discover the entire file structure from scratch
- **No DoD:** The agent has no clear signal for when it's done
- **Overlapping specs:** Two specs that modify the same file — run them sequentially or merge them
- **Spec as design exploration:** Specs should be decisions already made, not questions being explored. Use issues for open-ended design discussions.
