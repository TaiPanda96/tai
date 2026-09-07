---
# ── REQUIRED ──────────────────────────────────────────────
name: my-skill # dirname must match exactly
description: >
  One sentence on what it does. Then list every implicit context
  that should trigger it: mention X, Y, Z, or ask about A even
  without saying "run my-skill". Be pushy — Claude under-triggers.

# ── INVOCATION CONTROL ────────────────────────────────────
disable-model-invocation: false # true = manual /name only; use for destructive ops

# ── EXECUTION CONTEXT ─────────────────────────────────────
context: fork # omit for inline; fork = isolated subagent, result returned to main convo
agent: Explore # built-ins: Explore, Plan — or any .claude/agents/<name>

# ── TOOL PERMISSIONS ──────────────────────────────────────
allowed-tools:
  - Read
  - Grep
  - Glob
  - Bash(git diff:*) # scope Bash to specific commands with parens
  - Bash(# TODO: set run command (none configured):*)

# ── UX HINTS ──────────────────────────────────────────────
argument-hint: "[arg-1 | arg-2]" # shown in autocomplete after /name<space>

# ── MODEL OVERRIDE ────────────────────────────────────────
model: claude-sonnet-4-6 # omit to inherit session default; opus for heavy reasoning, haiku for cheap tools
---
