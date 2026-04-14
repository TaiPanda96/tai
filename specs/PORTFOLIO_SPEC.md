# Tai Lin — Portfolio Spec

> Version 1.0 · Spec-driven development source of truth  
> Carry this file alongside `index.html` and `TAI_LIN_RESUME.docx`

---

## 1. Project Intent

This portfolio is **not a digitized resume**. It is an expansion of the resume — the story, context, and architectural thinking behind what the resume summarizes in bullet points.

The primary audience is:

- Technical recruiters doing a first pass (needs to scan in 10 seconds)
- Engineers and founders doing due diligence (needs to hold up to depth)
- Potential consulting clients evaluating fit (needs to communicate domain credibility)

The portfolio should read like a **YC application meets a technical design doc** — written by someone who thinks, not just someone who ships.

---

## 2. Format & Technology

| Decision   | Choice                                                            | Rationale                                        |
| ---------- | ----------------------------------------------------------------- | ------------------------------------------------ |
| Format     | E-book with chapter navigation                                    | More real estate for narrative; case study depth |
| Technology | Vanilla JS, single `index.html`                                   | Zero dependencies, instant deploy, no build step |
| Deployment | Vercel static site                                                | Drag folder, done                                |
| Styling    | Embedded `<style>` in HTML                                        | Self-contained, portable                         |
| Fonts      | Lora (serif, narrative) + DM Mono (labels, code) + DM Sans (body) | Editorial weight + technical precision           |

**Do not introduce a framework until the writing section requires live API data (Substack) or a contact form requires server-side handling.**

---

## 3. Visual Direction

### Aesthetic

- **Theme:** Dark cover, warm parchment interior — "a terminal that became a document"
- **Cover:** Dark (`#1a1916`) with warm amber/gold accent (`#c49a3c`)
- **Interior pages:** Warm off-white (`#f5f0e8`) with ink tones — not clinical white
- **Accent color:** Gold (`#9a6f2a`) used for drop caps, pull quote rules, aside borders, arrows
- **No gradients, no shadows, no glow effects**
- **Typography hierarchy:**
  - Chapter titles: Lora serif, large, weight 500
  - Body copy: Lora serif, 16px, line-height 1.85 — reads like a book
  - Labels / metadata / code: DM Mono, 10–12px, letter-spaced
  - UI elements: DM Sans

### Key Visual Moments

- **Drop cap** on the first paragraph of each chapter
- **Pull quotes** for the single most important insight per chapter
- **Aside blocks** (gold left-border) for editorial commentary — "why this matters"
- **Code blocks** for type signatures and architecture snippets
- **Stat rows** (bordered grid) for quantitative signals
- **Bullet lists** with `→` arrows in gold

---

## 4. Structure & Navigation

```
Cover (dark, static)
  └── Table of Contents (chapter list with dotted leaders)
        └── Chapter I   — Who I Am & What I Build
        └── Chapter II  — The AI Agent Harness
        └── Chapter III — Millie & Penny
        └── Chapter IV  — The Night Agent
        └── Chapter V   — The Financial Engines
        └── Chapter VI  — Before HighFi
```

Navigation: Prev / Next buttons + chapter title indicator at the bottom of every page.  
Clicking a TOC entry navigates directly to that chapter.  
Each chapter is a discrete view — not a scroll, a page turn.

---

## 5. Content Spec — Chapter by Chapter

Each chapter follows this narrative structure:

> **Problem** (what was broken or missing)  
> **What I built** (architectural decisions, with code snippets where meaningful)  
> **Outcome** (what changed, ideally with numbers)

Editorial asides provide context that goes beyond the resume — why a decision was made, what it signals, why it matters beyond HighFi.

---

### Chapter I — Who I Am & What I Build

**Type:** Introduction  
**Purpose:** Establish framing before any technical content. Answer: who is this person and what is the through-line?

**Content blocks:**

- Opening paragraph (drop cap): the through-line — infrastructure for autonomous agents in regulated financial contexts
- The unusual background: capital markets ops → self-taught engineer → founding engineer
- Pull quote: the core tension between probabilistic models and deterministic requirements
- Stat row: 6+ agents · $200K ARR · 5yr finance domain · 0→1 founding engineer
- Closing paragraph: what this portfolio is and who it's for

**Enrichment needed:**

- [ ] Personal framing in your own voice — what drew you to this specific intersection?
- [ ] Any specific moment that crystallized the "infrastructure, not just agents" insight

---

### Chapter II — The AI Agent Harness

**Type:** Platform case study  
**Tag:** Platform

**The problem:**
Each new agent required rebuilding the same scaffolding. In a regulated financial context, an agent that fails silently is a compliance risk, not just a bug. No shared abstraction meant inconsistent observability, no audit trail, and expensive maintenance.

**What I built:**

- `BaseAgent<TDeps, TInput, TOutput>` — abstract base class, typed dependency injection via generics
- Structured step tracing: `startStep()` / `finishStep()` / `failStep()` — timestamps, I/O, durations recorded on every step
- `AgentHandoff<T>` — typed return wrapper carrying output, accumulated traces, and errors
- `createOnStepFinish()` — plugs into Vercel AI SDK's `onStepFinish` callback
- `SlackStepTraceHandler` — per-step real-time monitoring, graceful degradation
- Role-based capability registry — gates LLM tool access by customer config and user role
- Dynamic system prompt generation — capability manifests injected at runtime per authorized toolset

**Key code snippet to include:**

```typescript
abstract class BaseAgent<TDeps, TInput, TOutput> {
  constructor(deps: TDeps);
  abstract execute(input: TInput): Promise<AgentHandoff<TOutput>>;
  startStep(name: string, input?: unknown): StepTrace;
  finishStep(trace: StepTrace, output?: unknown): void;
  failStep(trace: StepTrace, error: Error): void;
  createOnStepFinish(): OnStepFinishCallback;
  withSlackNotifications(handler, user): this;
}
```

**Capability tiers:**
| Capability | Access |
|---|---|
| Funding Request Support | Customer users with active facilities |
| Fees Support | Customer users with active facilities |
| Facility Reporting | Customer users with active facilities |
| DeFi Operations | Admin only |
| Morpho Market Analysis | Admin only |

**Outcome:**
6+ production agents. New agent = extend BaseAgent + wire deps. Observability, tracing, authorization inherited. Every execution produces a complete audit trail.

**Enrichment needed:**

- [ ] What did the "before" look like — how many agents existed before the harness was formalized?
- [ ] Any specific incident or near-miss that made the compliance/audit requirement concrete?
- [ ] Are there interesting failure modes the step tracing has caught in production?

---

### Chapter III — Millie & Penny

**Type:** AI Agent case studies (two agents, one chapter)  
**Tag:** AI Agents

**The problem:**
Multi-tenant LLM tool access in a regulated context. Different user types have fundamentally different permissions. A single-prompt agent either over-exposes tools or becomes too restrictive. Multi-step financial workflows (fetch facility → verify rates → submit request) require persistent thread context.

**Millie — Slack Agent:**

- `MillieSlackAgent extends BaseAgent<AgentDeps, MillieSlackInput, MillieSlackOutput>`
- Dynamically constructs authorized toolset per-request from capability registry
- 15-step multi-tool execution (Claude claude-sonnet-4-5-20250929)
- Full Slack webhook integration: signature verification (`@slack/events-api`), event deduplication, bot message filtering
- Conversation persistence in PostgreSQL — reconstructed as `CoreMessage[]` per turn
- Tool prefix audit trail → `inferCapabilitiesFromTools()` for compliance logging
- Dynamic system prompt: capability list + per-capability manifests + custom facility flows + Slack formatting guidelines

**Penny — In-App Agent:**

- Streaming via Vercel AI SDK, 300s max
- Multi-model: Claude + Gemini 2.0 Flash selectable at runtime
- Three chat modes: `default`, `amendmentEdit` (CRUD on eligibility terms), `report` (read-only)
- Dynamic system message per session: customer data + amendment context + mode instructions
- Shared Prisma `Conversation` / `Message` models with Millie

**Outcome:**
Multi-step operations that required manual back-office workflows now complete in a single Slack thread. Penny replaced manual reporting and funding request process for first enterprise customers.

**Enrichment needed:**

- [ ] Real examples of multi-step operations Millie handles end-to-end (sanitized)
- [ ] How do customers actually use Penny day-to-day — what replaced what specifically?
- [ ] Any interesting edge cases in the capability authorization (e.g. a user trying to access something they shouldn't)?

---

### Chapter IV — The Night Agent

**Type:** Agentic CI/CD case study  
**Tag:** Agentic CI/CD

**The problem:**
Small founding team, growing spec backlog. Obvious solution (AI agent writes code overnight) introduces serious security risk: prompt injection through spec files, arbitrary installs, destructive filesystem commands. The challenge wasn't building the pipeline — it was making autonomous execution safe enough to trust.

**Architecture:**
Three coordinated GitHub Actions workflows:
| Workflow | Schedule | Role |
|---|---|---|
| `night-agent-pr-creator.yml` | 2 AM | Scans `specs/*.md`, pushes stub branches, sends Slack Block Kit with 1-click PR buttons |
| `night-agents-branch-writers.yml` | 3 AM | Matrix strategy, parallel Claude Code sessions per branch |
| `agent.yaml` | 3 AM | Single-branch variant, 40min timeout + incremental commits |

**SafeCommandExecutor:**

- `SHELL` env var hijacked → every bash command routed through whitelist
- Allowed: `git`, `bun test/lint/typecheck`, `gh` CLI, `ls/cat/find/pwd`
- Blocked: `rm`, `sudo`, `chmod`, `curl/wget`, arbitrary package installs
- Spec validation: path traversal prevention, injection pattern scanning (`eval`, `exec`, `$(...)`), 500KB size limit

**Key code concept:**

```bash
# SHELL env var hijack — intercepts every Claude CLI bash invocation
SHELL=scripts/safe-bash.sh claude --spec specs/feature.md
# safe-bash.sh → safe-execute.ts → SafeCommandExecutor → whitelist check → execute or reject
```

**Outcome:**
Specs written during the day implemented overnight. Security layer has blocked real injection attempts in spec content. Team reviews PRs each morning. Effective engineering capacity expanded without headcount.

**Enrichment needed:**

- [ ] Specific example of an injection attempt that was caught (sanitized)
- [ ] How many specs have been implemented autonomously to date?
- [ ] What's the TypeScript/lint/test pass rate on Night Agent PRs vs human PRs?
- [ ] Any failure modes — specs that were too ambiguous, edge cases in the whitelist?

---

### Chapter V — The Financial Engines

**Type:** Core systems case study (two systems, one chapter)  
**Tag:** Core Systems

**The problem:**
Every new customer has different eligibility rules, concentration limits, and borrowing base formulas defined in legal agreements. Hardcoded logic = engineering sprint per customer, deployment per formula change. Getting the assignment algorithm wrong = compliance failure with real financial consequences.

**Calculation Engine:**

- Config-driven: formulas as runtime-evaluable expressions, not hardcoded functions
- Dependency graph evaluation — topological ordering of formula dependencies
- Unified model: eligibility, concentration, facility-level calculations
- Self-serve configuration — ops teams modify rules without engineering

**Assignment Engine:**

- Core algorithm: priority-sorted receivables iteration, eligibility checks, concentration limit enforcement
- Borrowing base constraint enforcement — halts when facility capacity reached
- Add/remove strategy support — handles initial assignment and incremental portfolio adjustments
- Deterministic guarantee: same inputs → same assignment, always

**Why determinism matters (aside content):**
In a capital markets context, results are presented to counterparties and regulators. Non-determinism isn't a performance problem — it's a trust problem.

**Outcome:**
New customer onboarding no longer requires an engineering sprint. Formula changes deploy without code releases. Assignment Engine underpins every funding operation — auditable and verifiable against legal agreements.

**Enrichment needed:**

- [ ] How complex are the real formulas? (any sense of scale — number of variables, dependency depth)
- [ ] How many customers / facilities does the engine currently serve?
- [ ] Any close calls where the determinism guarantee mattered?
- [ ] Time-to-live improvement for new customer onboarding — before vs after?

---

### Chapter VI — Before HighFi

**Type:** Career narrative  
**Tag:** Prior Work

**Narrative arc:**
BMO (capital markets ops, no code) → self-taught → Utradea (shipped production features, first AI integration) → HighFi (founding engineer). The through-line is not "I learned to code" — it is "I came to understand financial systems from the inside, then built the tools to fix them."

**BMO (2018–2021):**

- Business Analyst → Senior BA, capital markets & commercial banking
- Led decommission of vendor risk management platform
- Drove E2E delivery for Credit Flow for Commercial Banking transformation
- Introduced config-driven credit compliance reporting scaled across multiple lines of business
- Context: this is where the financial domain depth comes from — the domain expertise that makes the HighFi work trustworthy

**Utradea (2021–2023):**

- Self-taught, no CS background, shipped paid features within months
- Built SEC filing Sentiment Parser (NLP classification → actionable stock signals)
- Integrated Stripe end-to-end — enabled first paid users
- Led 100+ API migration post-merger with Financial Modeling Prep
- Architected AWS infrastructure: RDS, ECS, load balancers, Redis clustering
- Piloted first OpenAI integration: Financial Writer tool on real-time market data APIs

**CDL (2017–2018):**

- Venture Growth in Machine Learning stream, Rotman Commerce
- Worked alongside ML-native founders
- Established early conviction: AI-native products are an infrastructure problem as much as a model problem

**Enrichment needed:**

- [ ] What specifically at BMO made you want to build rather than specify?
- [ ] The self-taught story — what was the actual path? (resources, timeline, first thing you shipped)
- [ ] The CDL experience — any specific insight or founder interaction that shaped how you think?

---

## 6. Writing Section (Future)

Three posts are pre-framed and waiting. When published, links replace "Coming soon" status.

| Post                                                                               | Status      | Target publication |
| ---------------------------------------------------------------------------------- | ----------- | ------------------ |
| How we authorized LLM tool access in a multi-tenant financial platform             | Coming soon | —                  |
| Building a type-safe agent harness: what we got wrong first                        | Coming soon | —                  |
| Running Claude autonomously overnight in CI: the security layer nobody talks about | Coming soon | —                  |

---

## 7. Enrichment Protocol

When adding context to any chapter, supply it as a response to the `[ ]` items in section 5.  
The spec gets updated, then `index.html` is regenerated from the updated spec.  
**The spec is always the source of truth. Never edit `index.html` copy directly.**

---

## 8. File Structure

```
tai-portfolio/
├── PORTFOLIO_SPEC.md       ← this file, source of truth
├── index.html              ← generated from spec
├── TAI_LIN_RESUME.docx     ← source resume
└── assets/                 ← (future) any images or diagrams
```

---

## 9. Deployment

```bash
# Vercel CLI — static deploy, no build step
vercel --prod

# Or drag the folder into vercel.com/new
# No vercel.json needed for a single index.html
```

Custom domain when ready: `tailin.dev` or `taishan.dev` (check availability).

---

## 10. Open Questions

- [ ] Availability / consulting signal in the hero — hold for now, add when transitioning
- [ ] Morpho Risk Manager project — add as Chapter VII once further along
- [ ] Photography or visual identity — currently typography-only, intentionally
- [ ] Analytics — add Fathom or Plausible (privacy-first) before sharing publicly
