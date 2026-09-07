@AGENTS.md

## Agentic Development Pipeline

This codebase uses a four-stage agent pipeline for implementing features. Specs live in `specs/`.

**Skills**
Under `.claude/skills`, you will find a spec/plan/implement/qa workflow you can invoke.

**Typical session:**

```
/spec "rough description of the feature — or specs/my-rough-draft.md"
/plan specs/<spec-file>.md
/implement
/qa
```

Each stage hands off via files in `tmp/`. Full conventions: `specs/SPEC_CONVENTIONS.md`.
