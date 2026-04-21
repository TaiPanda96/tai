---
id: spec-002
title: "Chronological timeline splash page (timeline.html)"
status: completed
priority: high
scope: standard
created: 2026-04-21
pr: null
---

## Summary

`index.html` is a long-form e-book optimized for deep readers. Most people who land
on a portfolio won't read it. This spec adds a second entry point — `timeline.html`
— that condenses the same career into a reverse-chronological, scroll-driven timeline
with enough visual interactivity to hold short attention spans. The two pages serve
different audiences: the e-book is for engineers who want to dig in; the timeline is
for people who want to scan in 90 seconds.

The timeline covers four career eras in reverse order: HighFi (2023–present),
Utradea (2021–2023), BMO (2018–2021), CDL (2017–2018). Each era has an anchor node
on a sticky vertical rail, project cards that reveal on scroll, stat callouts with
count-up animations, and tech-stack badges. Chapter crosslinks in the HighFi era
connect back to the relevant deep-dive sections in `index.html`.

Source of truth for content: `specs/resume.md` and `specs/chronological-portfolio-inspo.md`.
Design tokens: `styles/tokens.css` (reused verbatim).

---

## Context Discovery

### Files to Read First

| File | Why |
|---|---|
| `specs/resume.md` | Authoritative content for every project, role, date, and metric |
| `specs/chronological-portfolio-inspo.md` | Design direction: skimmability, interactivity, sticky timeline, reverse-chronological |
| `styles/tokens.css` | All CSS custom properties — must be imported and reused, no new colors |
| `index.html` lines 1–17 | Font stack and head tags to replicate in `timeline.html` |
| `styles/cover.css` | Cover-page visual tone — the timeline uses the dark theme (`--cover-bg`) |

### What the Cover Page Establishes (Inherit This Feel)

The `index.html` cover (`#cover`) sets the house aesthetic: dark charcoal (`#1a1916`),
warm gold (`#c49a3c`) accents, DM Serif Display for headings, DM Mono for labels, Lora
for body text. The timeline splash inherits this palette entirely — it is a dark-theme
document, not a parchment-interior document.

---

## Content Map

The following is the authoritative content structure for the timeline. All text is
derived from `specs/resume.md`. Do not invent roles, dates, or metrics.

### Era 1 — HighFi (Mar 2023 – Present)

- **Title:** Founding Software Engineer
- **Domain label:** AI Infrastructure · Capital Markets
- **Tech stack chips:** TypeScript, PostgreSQL, Next.js, Vercel AI SDK, Pulumi, GCP
- **Era stat:** $200K ARR scaled
- **Projects (4 cards):**
  1. **AI Agent Harness** — `BaseAgent<TDeps,TInput,TOutput>` harness powering 6+ agents;
     typed deps, step tracing, AgentHandoff returns, Slack observability.
     Metric: `6+ agents`. Chapter link: `index.html` Chapter II.
  2. **Millie & Penny** — Slack agent (15-step multi-tool execution, thread-persistent
     history) and in-app Capital Markets agent (streaming, real-time risk reporting).
     Metric: `2 flagship products`. Chapter link: `index.html` Chapter III.
  3. **The Night Agent** — Autonomous nightly CI/CD pipeline on GitHub Actions: Planner /
     Implementer / QA Claude Code instances, whitelist-based security layer, 1-click PR
     creation. Chapter link: `index.html` Chapter IV.
  4. **Financial Engines** — Config-driven calculation engine (dependency graphs,
     runtime-evaluable expressions) and Assignment Engine (borrowing base constraints,
     concentration limits, deterministic priority-sorted outcomes).
     Chapter link: `index.html` Chapter V.

### Era 2 — Utradea (Mar 2021 – Feb 2023)

- **Title:** Software Engineer → Software Engineer II
- **Domain label:** Social Investing · B2B API · Node.js / AWS
- **Tech stack chips:** Node.js, MongoDB, PostgreSQL, AWS (ECS, RDS), Redis, OpenAI API
- **Projects (4 cards):**
  1. **FMP API Migration** — Led migration of 100+ stock market APIs from Financial
     Modeling Prep into Utradea's Node.js / MongoDB stack post-merger.
  2. **AWS Infrastructure** — Architected scale infra: managed PostgreSQL (RDS), ECS
     containers, load balancers, multi-node Redis cluster with read/write replication.
  3. **First AI Feature** — Piloted and shipped OpenAI API integration into the Financial
     Writer tool, an AI-powered news article generator on real-time market data.
  4. **Sentiment Parser** — Built NLP-based SEC filing sentiment classifier; surfaced
     actionable stock signals. Also integrated Stripe end-to-end for first paid users.

### Era 3 — BMO Financial Group (May 2018 – Mar 2021)

- **Title:** Business Analyst → Senior Business Analyst
- **Domain label:** Capital Markets · Commercial Banking
- **Tech stack chips:** Requirements, Systems Analysis, Data, Regulatory Compliance
- **Projects (3 cards):**
  1. **Credit Flow Transformation** — Defined E2E requirements for Credit Flow for
     Commercial Banking; drove cross-functional delivery.
  2. **Client Portal Integration** — Owned E2E integration project streamlining business
     banking onboarding from prospecting to signing across legacy systems via API.
  3. **Compliance Reporting** — Introduced configurable credit compliance reporting
     templates scaled across multiple lines of business.

### Era 4 — CDL (2017 – 2018)

- **Title:** Venture Growth in Machine Learning Stream
- **Domain label:** ML · Venture · University of Toronto
- **Single card:**
  - Worked alongside ML-native founders and operators; developed early conviction in
    AI-native product building. Rotman B.Com, Management / Economics.

---

## Requirements

### REQ-1 — New page: `timeline.html`

A new standalone HTML file at the project root. It is not linked from `index.html`
(they are parallel entry points). Head section replicates the same Google Fonts
import as `index.html` and imports `styles/tokens.css` and `styles/timeline.css`.

### REQ-2 — New stylesheet: `styles/timeline.css`

All timeline-specific styles. Must import (via CSS `@import` or be loaded after)
`styles/tokens.css` so all `--custom-property` tokens are available. No new color
values defined inline — every color is `var(--cover-bg)`, `var(--gold)`,
`var(--cover-text)`, `var(--ink-muted)`, etc.

### REQ-3 — New script: `js/timeline.js`

Handles: (a) IntersectionObserver-based scroll reveals for project cards and stat
callouts; (b) count-up animation for numeric stats; (c) active era tracking on
the sticky timeline rail. Vanilla JS, no dependencies.

### REQ-4 — Page header

A fixed or sticky header containing:
- Left: `Tai Lin` in DM Mono, uppercase, `var(--ink-faint)` — small label, not a hero
- Right: `← Full portfolio` link pointing to `index.html`

The header is not a navigation bar. It is minimal — height ≤ 48px. It does not
obstruct the timeline content.

### REQ-5 — Hero strip

A short (not full-screen) hero strip at the top of the page, above the timeline.
Contains:
- A large DM Serif Display heading: `Career Timeline`
- A one-line subtitle in Lora: `Founding Engineer · AI Infrastructure · Capital Markets`
- The availability badge (pulse dot + "Available for consulting") from `index.html`
  cover — replicated in the same visual style

The hero strip uses the dark theme (`var(--cover-bg)` background). It is not
full-viewport-height — roughly 200–260px tall.

### REQ-6 — Vertical timeline rail

A vertical line (`2px`, `var(--gold)` at 40% opacity) running the full height of the
timeline section. On the left side of the content area (not center), at a fixed
horizontal position.

A progress fill element overlays this rail, growing from top to bottom as the user
scrolls through the timeline section. Implemented via IntersectionObserver or
CSS `animation-timeline: scroll()`.

Each era has a **node** on the rail: a circle (`12px` diameter, `var(--gold)` fill)
at the vertical position of that era's header. When the era is the active scroll
era, the node pulses (CSS `@keyframes` scale + opacity loop, matching the
`pulse-dot` pattern in `styles/cover.css`).

### REQ-7 — Era headers

Each era begins with a header block adjacent to the timeline rail. The header
contains:
- Company/org name in DM Serif Display (large, `var(--cover-text)`)
- Role title in Lora italic (`var(--ink-faint)`)
- Date range in DM Mono uppercase (`var(--gold)`)
- Tech stack chips: small pill-shaped badges (DM Mono, `10px`, `var(--gold)` border,
  `var(--gold)` text at 80% opacity, transparent fill). On hover: fill becomes
  `var(--gold)` at 10% opacity. No JavaScript required for hover.

### REQ-8 — Project cards

Project cards are the primary content unit. Each era contains 3–4 cards (per the
Content Map above). Layout: a two-column grid on desktop (≥ 900px), single column
on mobile. Cards alternate entrance direction — odd cards slide in from the left,
even cards from the right — triggered by IntersectionObserver adding a `.revealed`
class.

Each card contains:
- **Project name** in DM Mono uppercase (`11px`, `var(--gold)`)
- **One-sentence description** in Lora (`14px`, `var(--cover-text)`)
- **Metric callout** (if present): a large number in DM Serif Display (`28px`,
  `var(--gold)`) with a small label. The number animates via count-up when the
  card enters the viewport. Cards without a metric omit this element.
- **Chapter link** (HighFi era only): a small `→ Chapter N` link in DM Mono
  pointing to `index.html#chN`. On hover: gold underline, cursor pointer.

Cards use a dark surface: `background: rgba(255,255,255,0.03)`, `1px solid
rgba(255,255,255,0.08)` border, `12px` border-radius. On hover: border becomes
`rgba(196,154,60,0.3)` (gold at 30%), with a `box-shadow` glow in gold.

### REQ-9 — Era stat callout

Each era (except CDL) has a single large stat displayed to the right of the era
header, before the project cards. Format: large number + label, same style as the
cover page's `.stat-num` / `.stat-label` pattern. The number animates count-up
when it enters the viewport. CDL era has no stat callout.

| Era | Stat | Label |
|---|---|---|
| HighFi | $200K | ARR scaled |
| Utradea | 100+ | APIs migrated |
| BMO | 3yr | Domain depth |

### REQ-10 — Scroll reveal behavior

All project cards and era headers begin in a visually hidden state:
`opacity: 0; transform: translateY(24px)` (or translateX for left/right slides).
IntersectionObserver triggers `.revealed` class addition when the element is
≥ 20% into the viewport. The `.revealed` transition is:
`opacity 0.5s ease, transform 0.5s ease`. No `animation-fill-mode` hacks —
use class toggling. Once revealed, elements stay revealed (observer disconnects
after triggering).

### REQ-11 — Count-up animation

When a stat number enters the viewport, it counts up from 0 to its target value
over 800ms using `requestAnimationFrame`. Numbers with `$` prefix or `+` suffix
preserve those characters throughout the animation. Numbers with `K` suffix
(e.g. `$200K`) animate the numeric part (`0` → `200`) with the `$` and `K`
static throughout.

### REQ-12 — Mobile layout

At viewport widths < 900px:
- Project card grid collapses to single column
- Cards do not alternate direction (all reveal from bottom: `translateY(24px)`)
- Timeline rail shifts to `left: 16px`, era headers shift to `padding-left: 40px`
- Tech stack chips wrap naturally (no overflow clip)
- Hero strip reduces to ~160px tall

### REQ-13 — Footer

A simple footer below the CDL era:
- DM Mono uppercase label: `End of timeline`
- A CTA link: `Read the full portfolio →` pointing to `index.html`
  (DM Serif Display, `var(--gold)`, hover underline)
- Copyright line: `Tai Lin · 2026` in DM Mono, `var(--ink-muted)`

### REQ-14 — No new font imports, no JS dependencies

Fonts are loaded from the same Google Fonts URL as `index.html`. No npm, no
bundler, no CDN scripts beyond what already exists. `timeline.js` is a single
vanilla JS file with no imports.

### REQ-15 — Accessibility floor

- All interactive elements (links, chapter links) are keyboard-focusable with a
  visible gold outline on `:focus-visible`
- `timeline.html` has a `<main>` landmark wrapping the hero + timeline sections
- Era headers use `<h2>`; project card names use `<h3>`; page header is `<header>`
- IntersectionObserver reveal does not remove content from the DOM — it only
  changes opacity/transform, so content is accessible before interaction

---

## Files to Create or Modify

| Action | Path | Purpose |
|---|---|---|
| create | `timeline.html` | New standalone page |
| create | `styles/timeline.css` | All timeline-specific styles |
| create | `js/timeline.js` | Scroll reveals, count-up, active era tracking |

`index.html`, `styles/tokens.css`, and all other existing files are **not modified**.

---

## Visual Rhythm (Implementation Guide)

The page reads top to bottom as a scroll document, not a paginated e-book.

```
[Header — 48px]
[Hero strip — ~240px dark]
[Timeline section — full height]
  [Era: HighFi]
    [Era header + stat callout]    ← sticky rail node activates
    [Project cards grid]           ← cards reveal on scroll
  [Era: Utradea]
    [Era header + stat callout]
    [Project cards grid]
  [Era: BMO]
    [Era header + stat callout]
    [Project cards grid]
  [Era: CDL]
    [Era header (no stat)]
    [Single card]
[Footer]
```

Timeline rail runs alongside the entire `[Timeline section]` div.

---

## Definition of Done

- [ ] REQ-1: `timeline.html` exists and opens in browser with no console errors
- [ ] REQ-2: `styles/timeline.css` exists; no hardcoded hex values (all `var()`)
- [ ] REQ-3: `js/timeline.js` exists; IntersectionObserver wired to `.reveal-target` elements
- [ ] REQ-4: Page header visible with `← Full portfolio` link
- [ ] REQ-5: Hero strip with heading, subtitle, and availability badge visible
- [ ] REQ-6: Vertical gold rail visible; progress fill grows on scroll; era nodes pulse when active
- [ ] REQ-7: All four era headers render with company, role, date, and tech chips
- [ ] REQ-8: Project cards render; cards enter with slide-in animation on scroll
- [ ] REQ-9: Stat callouts visible for HighFi, Utradea, BMO eras
- [ ] REQ-10: Cards start hidden and reveal on scroll (IntersectionObserver)
- [ ] REQ-11: Stat numbers count up on first viewport entry
- [ ] REQ-12: Layout collapses correctly at < 900px viewport
- [ ] REQ-13: Footer renders with "Read the full portfolio →" CTA
- [ ] REQ-14: No external JS dependencies loaded
- [ ] REQ-15: Era headers are `<h2>`, card names are `<h3>`, `<main>` landmark present
- [ ] Chapter links (HighFi cards) navigate to correct `index.html` chapters
- [ ] All four eras present in reverse chronological order
- [ ] Spec status updated to `completed`

---

## Constraints

- Dark theme throughout — never switch to `var(--interior-bg)` parchment
- No CSS frameworks (no Tailwind, no Bootstrap)
- No JavaScript frameworks or libraries
- No build step — `timeline.html` must work when opened directly as a file or served statically
- No inline `<style>` blocks in `timeline.html` — all styles in `timeline.css`
- No inline `onclick` handlers in HTML — all event wiring in `timeline.js`
- Content is strictly from `specs/resume.md` — do not embellish or invent achievements
- Chapter links use fragment-only URLs relative to the same directory: `index.html#ch2`,
  not absolute URLs
- The page does not replicate the e-book's paginated navigation — it is a standard
  vertically-scrolling document
- No emoji in any visible text
- `index.html` is not modified by this spec
