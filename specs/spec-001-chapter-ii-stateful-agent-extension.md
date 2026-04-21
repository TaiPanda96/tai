---
id: spec-001
title: "Add stateful agent extension (Layer 4) to Chapter II HTML"
status: completed
priority: high
scope: standard
created: 2026-04-21
pr: null
---

## Summary

Chapter II of `index.html` currently covers three layers of the AI Agent Harness:
the execution contract (`BaseAgent`), step tracing (`StepTrace`), and the capability
registry. This spec adds a fourth layer — "Layer 4" — that introduces the stateful
extension to `BaseAgent`: the `TContext`/`TState` generics, FSM-enforced state
transition tables, lifecycle hooks (`onEnterState`/`onExitState`), and context
threading through `AgentHandoff`. The new section grounds the abstraction in a
concrete Capital Markets narrative: a multi-step bond issuance workflow that benefits
from stateful agents because it has explicit phase ordering requirements, spans
multiple sessions, and operates in a compliance-sensitive context where illegal state
transitions are a regulatory concern, not just a runtime bug.

Resolved design decisions:

- **OQ-1:** Layer 4 heading: `Stateful Execution & Session Memory`
- **OQ-2:** Aside placement: after the FSM transition table (reinforces enforcement)
- **OQ-3:** Outcome block expanded in-place (no second pull-quote)
- **OQ-4:** Bond issuance phases: `term-sheet → bookbuilding → pricing → allocation → settled` (standard Capital Markets deal lifecycle)
- **OQ-5:** `init()` call convention elided in portfolio code blocks for readability

---

## Context Discovery

### Files to Read First

| File                                                   | Why                                                                                                 |
| ------------------------------------------------------ | --------------------------------------------------------------------------------------------------- |
| `index.html` lines 253–493                             | Existing Chapter II — layer structure, prose tone, code block syntax, HTML class conventions        |
| `specs/chapter-material/ai-harness-stateful-design.md` | TypeScript source for the stateful extension — all type signatures, method bodies, design rationale |
| `styles/interior.css`                                  | CSS classes: `layer-heading`, `layer-num`, `code-block`, `cap-table`, `aside`, `outcome-section`    |
| `specs/PORTFOLIO_SPEC.md`                              | Portfolio tone and Chapter II brief                                                                 |

### Patterns to Match

| File                       | What to learn                                                                         |
| -------------------------- | ------------------------------------------------------------------------------------- |
| `index.html` lines 282–343 | `layer-heading` + prose + `code-block` unit (Layer 1 pattern)                         |
| `index.html` lines 386–477 | `layer-heading` + prose + `code-block` + `cap-table` + `aside` unit (Layer 3 pattern) |
| `index.html` lines 479–491 | `outcome-section` / `pull-quote` closing block                                        |

---

## Requirements

### Functional Requirements

- [ ] REQ-1: Insert `<h3 class="layer-heading"><span class="layer-num">Layer 4</span> Stateful Execution & Session Memory</h3>` inside `div#ch2 .ch-body`, immediately before the `<div class="outcome-section">` block.

- [ ] REQ-2: Existing chapter shell (`div#ch2`, `<h2 class="ch-title">The AI Agent Harness</h2>`, `data-index="3"`) is unchanged.

- [ ] REQ-3: Opening paragraph explains the stateful problem: stateless agents cannot resume mid-workflow, cannot enforce phase ordering, and cannot carry enriched context across a multi-step regulated deal flow without out-of-band storage. Connects to the compliance-first framing in the chapter's drop-cap paragraph.

- [ ] REQ-4: A `<div class="code-block">` displays the updated `BaseAgent` signature with all five generics and new members: `protected context: TContext`, `protected currentState: TState`, `abstract readonly initialState: TState`, `protected validTransitions?`, `onEnterState?`, `onExitState?`, `protected transition(next: TState): void`, `protected updateContext(patch: Partial<TContext>): void`, and updated `execute(input: TInput, ctx?: TContext)`. Label: `BaseAgent — five-generic signature with FSM layer`. Use existing `ck`/`cm`/`cs` span classes for syntax highlighting.

- [ ] REQ-5: A second `<div class="code-block">` shows `BondIssuanceAgent` concrete example with: (a) `TState = 'term-sheet' | 'bookbuilding' | 'pricing' | 'allocation' | 'settled'`; (b) `validTransitions` table enforcing the deal lifecycle order; (c) `onEnterState` hook recording a compliance event; (d) `execute()` accepting optional incoming context for session resumption; (e) `this.transition()` called between phases. Label: `BondIssuanceAgent — stateful Capital Markets workflow`.

- [ ] REQ-6: A `<table class="cap-table">` displays the FSM transition matrix. Columns: `From` / `Allowed next states`. Rows cover all five bond issuance states.

- [ ] REQ-7: A `<div class="aside">` with label `Why state enforcement is a compliance requirement` explains that in a regulated deal flow, moving from term-sheet to allocation without completing bookbuilding is an audit failure, not just a logic error. Placed after the FSM transition table.

- [ ] REQ-8: A prose paragraph explains `AgentHandoff` context threading: `this.succeed()` / `this.fail()` now carry `context` and `agentState` in the handoff, enabling orchestrator-level session persistence and resumption without replaying steps.

- [ ] REQ-9: The existing `<div class="outcome-section">` pull-quote is expanded to reference the stateful extension. Preserve the existing text about `extends BaseAgent + typed deps + execute()`, append: a new stateful agent declares its phase graph in a `validTransitions` table and inherits FSM enforcement, episodic context, and session resumption — compliance encoded in the type system.

- [ ] REQ-10: No new CSS classes. All styling uses existing `interior.css` classes only.

- [ ] REQ-11: The paragraph beginning "The architecture has three layers" is updated to "The architecture has four layers:" with Layer 4 named.

### Non-Functional Requirements

- Prose voice: declarative, technical, no marketing language — written for a senior engineer
- All existing Layer 1–3 content preserved unchanged, except REQ-9 and REQ-11
- No inline styles introduced; existing `style=""` attributes preserved
- HTML remains valid (no unclosed tags, correct nesting)

---

## Files to Modify

| Action | Path         | Purpose                                                                              |
| ------ | ------------ | ------------------------------------------------------------------------------------ |
| modify | `index.html` | Insert Layer 4 section; update "three layers" to "four layers"; expand outcome block |

---

## Definition of Done

- [ ] All REQ-1 through REQ-11 implemented
- [ ] `index.html` opens in browser with no console errors
- [ ] Chapter II shows all four layer headings
- [ ] FSM transition table visible using `cap-table` class
- [ ] `BondIssuanceAgent` code block visible with syntax highlighting
- [ ] Aside with gold left-border visible after transition table
- [ ] Outcome block references the stateful extension
- [ ] "Three layers" updated to "four layers"
- [ ] No existing Layer 1–3 content removed
- [ ] Spec status updated to `completed`

---

## Constraints

- Insert inside existing `div#ch2 .ch-body`, not as a new chapter div
- Use `<h3 class="layer-heading">` — not `<h2>`
- No new CSS classes or `<style>` blocks
- No JavaScript or interactive elements — static document only
- No emoji in prose or labels
- `BondIssuanceAgent` is illustrative — note in prose it is a "hypothetical bond issuance workflow"
- `init()` call convention elided for readability
