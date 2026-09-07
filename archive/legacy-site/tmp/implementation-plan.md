# Implementation Plan — spec-002

## Spec
- File: `specs/spec-002-portfolio-chronological-timeline-splash.md`
- Scope: standard

## Summary

New standalone `timeline.html` entry point alongside the existing e-book `index.html`. Condenses the career into a reverse-chronological, scroll-driven timeline with IntersectionObserver reveals, count-up stats, and a sticky gold vertical rail. Three new files created; no existing files modified.

## Files to Read Before Implementing

| Priority | File | Why |
|---|---|---|
| 1 (must) | `styles/tokens.css` | All CSS custom properties — every color in `timeline.css` must use these vars |
| 1 (must) | `styles/cover.css` | `.availability-badge`, `.pulse-dot`, `@keyframes pulse`, `.stat-num`, `.stat-label` patterns to replicate |
| 1 (must) | `specs/resume.md` | Authoritative source for all project text, dates, metrics — do not invent content |
| 2 (must) | `index.html` lines 1–17 | Exact Google Fonts `<link>` tag and `<meta>` tags to replicate in `timeline.html` head |
| 3 (ref) | `js/chapters.js` | Vanilla JS module pattern to follow; timeline.js must NOT use ES module syntax (no imports) |

## Implementation Tasks

### Task 1: Create `js/timeline.js`

- **Files to create:** `js/timeline.js`
- **What to implement:** Single IIFE, no ES6 imports (loaded via plain `<script src>` tag).

  **Four responsibilities:**

  **1a. `positionEraNodes()`** — Called after DOMContentLoaded. For each `.era-section`, reads its `offsetTop` relative to `.timeline-section`, sets the corresponding `.era-node[data-era]`'s `style.top` to that value in px. Match via `data-era` attribute.

  **1b. `initRailProgress()`** — `window.addEventListener('scroll', ...)`. Calculates how far the user has scrolled within `.timeline-section` as a percentage: `(window.scrollY - sectionTop) / sectionHeight * 100`. Sets `.rail-fill`'s `style.height` to that value clamped to `[0, 100]%`.

  **1c. `initScrollReveal()`** — `IntersectionObserver` at `threshold: 0.2`. Observes all `.reveal-target` elements. On intersection: `el.classList.add('revealed')`. If `el.classList.contains('count-up')` AND `!el.dataset.counted`, call `countUp(el, ...)` and set `el.dataset.counted = 'true'`. Then `observer.unobserve(el)`.

  **1d. `initEraTracking()`** — Second `IntersectionObserver` at `threshold: 0.3`. Observes each `.era-section`. On intersection: remove `.era-active` from all `.era-node` elements, then add `.era-active` to `document.querySelector('.era-node[data-era="' + entry.target.dataset.era + '"]')`.

  **1e. `countUp(el, target, prefix, suffix, duration=800)`** — `requestAnimationFrame` loop. Each frame: `elapsed / duration * target`, floor it, set `el.textContent = prefix + value + suffix`. Stop when elapsed >= duration and set final value.

  **Count-up data attribute convention:**
  - `data-prefix="$"` `data-target="200"` `data-suffix="K"` → animates `$0K` → `$200K`
  - `data-prefix=""` `data-target="100"` `data-suffix="+"` → `0+` → `100+`
  - `data-prefix=""` `data-target="3"` `data-suffix="yr"` → `0yr` → `3yr`

  **Init call at bottom of IIFE:**
  ```js
  document.addEventListener('DOMContentLoaded', function() {
    positionEraNodes();
    initRailProgress();
    initScrollReveal();
    initEraTracking();
  });
  ```

- **Pattern to follow:** `js/chapters.js`
- **Dependencies:** none

---

### Task 2: Create `styles/timeline.css`

- **Files to create:** `styles/timeline.css`
- **What to implement:** All timeline-specific styles. Every color value must use `var()` tokens from `tokens.css`. The only exceptions are `rgba()` expressions where opacity is needed on `var(--gold)` (CSS cannot apply opacity to a var directly) — document with `/* gold at N% */` comments.

  **Do NOT load `layout.css`** — it sets `overflow: hidden` on body. `timeline.css` provides its own reset.

  **Sections to implement:**

  **Reset:**
  ```css
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  html, body { height: auto; overflow: auto; background: var(--cover-bg); color: var(--cover-text); }
  body { font-family: "DM Sans", sans-serif; }
  ```

  **`.page-header`:**
  - `position: sticky; top: 0; z-index: 100; height: 48px; display: flex; align-items: center; justify-content: space-between; padding: 0 32px`
  - `background: var(--cover-bg); border-bottom: 0.5px solid var(--border-dark)`
  - `.header-name`: DM Mono, uppercase, `11px`, `var(--ink-faint)`, letter-spacing `0.14em`
  - `.header-link`: DM Mono, `11px`, `var(--ink-faint)`, no text-decoration; hover: `color: var(--gold)`; `:focus-visible`: `outline: 2px solid var(--gold); outline-offset: 2px`

  **`.hero-strip`:**
  - `background: var(--cover-bg); padding: 48px 64px; min-height: 200px; display: flex; flex-direction: column; justify-content: center; gap: 12px`
  - `.hero-title`: DM Serif Display, `clamp(40px, 6vw, 64px)`, `var(--cover-text)`, `line-height: 1.05`
  - `.hero-subtitle`: Lora, `16px`, `var(--ink-faint)`, `line-height: 1.5`
  - `.availability-badge`: replicate exactly from `cover.css` — flex, gap, DM Sans `13px`, `var(--cover-text)`, border `0.5px solid rgba(255,255,255,0.15)`, padding `6px 14px`, border-radius `20px`, align-self `flex-start`
  - `.pulse-dot`: replicate `@keyframes pulse` from `cover.css` — `8px` circle, `var(--gold)` bg, `box-shadow` glow, animation `pulse 2s ease-in-out infinite`

  **`.timeline-section`:**
  - `position: relative; max-width: 1100px; margin: 0 auto; padding: 64px 64px 64px 120px`

  **`.timeline-rail`:**
  - `position: absolute; left: 64px; top: 32px; bottom: 32px; width: 2px; background: rgba(196, 154, 60, 0.4) /* gold at 40% */`
  - `.rail-fill`: `position: absolute; top: 0; left: 0; width: 100%; height: 0%; background: var(--gold); transition: height 0.1s linear`

  **`.era-node`:**
  - `position: absolute; left: 50%; transform: translateX(-50%); width: 12px; height: 12px; border-radius: 50%; background: var(--gold); opacity: 0.4; transition: opacity 0.3s`
  - `.era-node.era-active`: `opacity: 1; animation: era-pulse 2s ease-in-out infinite`
  - `@keyframes era-pulse`: `0%, 100% { box-shadow: 0 0 0 0 rgba(196,154,60,0.6) /* gold pulse */ } 50% { box-shadow: 0 0 0 6px rgba(196,154,60,0) }`

  **`.era-section`:**
  - `margin-bottom: 80px`

  **`.era-header`:**
  - `display: grid; grid-template-columns: 1fr auto; gap: 32px; align-items: start; margin-bottom: 40px`
  - `.era-company`: DM Serif Display, `36px`, `var(--cover-text)`, `line-height: 1.05`
  - `.era-role`: Lora italic, `16px`, `var(--ink-faint)`, margin-top `8px`
  - `.era-dates`: DM Mono uppercase, `12px`, `var(--gold)`, letter-spacing `0.12em`, margin-top `6px`
  - `.tech-chips`: `display: flex; flex-wrap: wrap; gap: 8px; margin-top: 16px`
  - `.chip`: DM Mono, `10px`, `color: rgba(196,154,60,0.8) /* gold at 80% */`, `border: 1px solid rgba(196,154,60,0.4) /* gold at 40% */`, `padding: 4px 10px`, `border-radius: 2px`, transparent background; hover: `background: rgba(196,154,60,0.1)`

  **`.era-stat`:**
  - `.stat-num`: DM Serif Display, `48px`, `var(--gold)`, `line-height: 1`
  - `.stat-label`: DM Mono uppercase, `11px`, `var(--ink-muted)`, letter-spacing `0.12em`, margin-top `4px`

  **`.cards-grid`:**
  - `display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px`

  **`.project-card`:**
  - `background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); border-radius: 12px; padding: 24px`
  - `transition: border-color 0.2s, box-shadow 0.2s`
  - Hover: `border-color: rgba(196,154,60,0.3) /* gold at 30% */; box-shadow: 0 0 20px rgba(196,154,60,0.08)`
  - `.card-name`: DM Mono uppercase, `11px`, `var(--gold)`, letter-spacing `0.12em`
  - `.card-desc`: Lora, `14px`, `var(--cover-text)`, `line-height: 1.6`, margin-top `8px`
  - `.card-metric-num`: DM Serif Display, `28px`, `var(--gold)`, margin-top `16px`, `line-height: 1`
  - `.card-metric-label`: DM Mono uppercase, `10px`, `var(--ink-muted)`, letter-spacing `0.1em`
  - `.chapter-link`: DM Mono, `11px`, `var(--gold)`, margin-top `12px`, display block, no text-decoration; hover: `text-decoration: underline`; `:focus-visible`: `outline: 2px solid var(--gold); outline-offset: 2px`

  **Reveal animations:**
  ```css
  .reveal-target {
    opacity: 0;
    transform: translateY(24px);
    transition: opacity 0.5s ease, transform 0.5s ease;
  }
  .reveal-target.reveal-left  { transform: translateX(-32px); }
  .reveal-target.reveal-right { transform: translateX(32px); }
  .reveal-target.revealed     { opacity: 1; transform: translate(0, 0); }
  ```

  **`.timeline-footer`:**
  - `text-align: center; padding: 64px 32px; border-top: 0.5px solid var(--border-dark); margin-top: 32px`
  - `.footer-end-label`: DM Mono uppercase, `10px`, `var(--ink-muted)`, letter-spacing `0.16em`
  - `.footer-cta`: DM Serif Display, `24px`, `var(--gold)`, display block, margin `20px auto`, text-decoration none; hover: `text-decoration: underline`; `:focus-visible`: `outline: 2px solid var(--gold)`
  - `.footer-copy`: DM Mono, `11px`, `var(--ink-muted)`, margin-top `8px`

  **Mobile breakpoint `@media (max-width: 899px)`:**
  - `.cards-grid`: `grid-template-columns: 1fr`
  - `.reveal-target.reveal-left, .reveal-target.reveal-right`: `transform: translateY(24px)` (resets direction to bottom-up on mobile)
  - `.timeline-rail`: `left: 16px`
  - `.timeline-section`: `padding: 48px 24px 48px 56px`
  - `.era-header`: `grid-template-columns: 1fr; gap: 16px` (stack stat below meta)
  - `.hero-strip`: `min-height: 160px; padding: 32px 24px`
  - `.hero-title`: `font-size: clamp(32px, 8vw, 48px)`
  - `.tech-chips`: `gap: 6px`

- **Pattern to follow:** `styles/cover.css`
- **Dependencies:** none (can be authored in parallel with Task 1)

---

### Task 3: Create `timeline.html`

- **Files to create:** `timeline.html`
- **What to implement:** Full page markup. Head mirrors `index.html` lines 1–17 with adjustments noted below.

  **Head:**
  ```html
  <!doctype html>
  <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>Tai Lin — Career Timeline</title>
      <!-- same Google Fonts link as index.html -->
      <link rel="stylesheet" href="styles/tokens.css" />
      <link rel="stylesheet" href="styles/timeline.css" />
      <script src="js/timeline.js" defer></script>
    </head>
  ```

  **Body — full structure with all content:**

  ```
  <body>
    <header class="page-header">
    <main>
      <section class="hero-strip">
      <section class="timeline-section">
        <div class="timeline-rail">
          <div class="rail-fill"></div>
          <div class="era-node era-active" data-era="highfi"></div>
          <div class="era-node" data-era="utradea"></div>
          <div class="era-node" data-era="bmo"></div>
          <div class="era-node" data-era="cdl"></div>
        </div>
        [4 × .era-section]
    </main>
    <footer class="timeline-footer">
  </body>
  ```

  **Era 1 — HighFi (4 cards):**

  Era header:
  - Company: `HighFi`
  - Role: `Founding Software Engineer`
  - Dates: `Mar 2023 – Present`
  - Chips: TypeScript, PostgreSQL, Next.js, Vercel AI SDK, Pulumi, GCP
  - Stat: `data-prefix="$" data-target="200" data-suffix="K"` / label `ARR scaled`

  Card 1 (reveal-left):
  - Name: `AI Agent Harness`
  - Desc: `BaseAgent<TDeps,TInput,TOutput> harness powering 6+ agents with typed dependency injection, structured step tracing, and per-step Slack observability.`
  - Metric: `data-prefix="" data-target="6" data-suffix="+"` / label `agents powered`
  - Chapter link: `index.html#ch2` → `→ Chapter II`

  Card 2 (reveal-right):
  - Name: `Millie & Penny`
  - Desc: `Slack agent with 15-step multi-tool execution and thread-persistent history. In-app Capital Markets agent for real-time risk reporting and funding requests.`
  - Metric: `data-prefix="" data-target="2" data-suffix=""` / label `flagship products`
  - Chapter link: `index.html#ch3` → `→ Chapter III`

  Card 3 (reveal-left):
  - Name: `The Night Agent`
  - Desc: `Autonomous nightly CI/CD pipeline on GitHub Actions: Planner / Implementer / QA Claude Code instances, whitelist-based security, 1-click PR creation at 8 AM.`
  - No metric
  - Chapter link: `index.html#ch4` → `→ Chapter IV`

  Card 4 (reveal-right):
  - Name: `Financial Engines`
  - Desc: `Config-driven calculation engine with dependency graphs and runtime-evaluable expressions. Assignment Engine enforcing borrowing base constraints with deterministic outcomes.`
  - No metric
  - Chapter link: `index.html#ch5` → `→ Chapter V`

  **Era 2 — Utradea (4 cards):**

  Era header:
  - Company: `Utradea`
  - Role: `Software Engineer → Software Engineer II`
  - Dates: `Mar 2021 – Feb 2023`
  - Chips: Node.js, MongoDB, PostgreSQL, AWS ECS, RDS, Redis, OpenAI API
  - Stat: `data-prefix="" data-target="100" data-suffix="+"` / label `APIs migrated`

  Card 1 (reveal-left): `FMP API Migration` — Led migration of 100+ stock market APIs from Financial Modeling Prep into Utradea's Node.js / MongoDB stack post-merger.
  Card 2 (reveal-right): `AWS Infrastructure` — Managed PostgreSQL (RDS), ECS containers, load balancers, and multi-node Redis cluster with read/write replication for scale.
  Card 3 (reveal-left): `First AI Feature` — Piloted and shipped OpenAI API integration into the Financial Writer tool, an AI-powered news article generator on real-time market data.
  Card 4 (reveal-right): `Sentiment Parser & Stripe` — NLP-based SEC filing sentiment classifier surfacing actionable stock signals. Integrated Stripe end-to-end for first paid users.

  **Era 3 — BMO Financial Group (3 cards):**

  Era header:
  - Company: `BMO Financial Group`
  - Role: `Business Analyst → Senior Business Analyst`
  - Dates: `May 2018 – Mar 2021`
  - Chips: Requirements, Systems Analysis, Data, Regulatory Compliance
  - Stat: `data-prefix="" data-target="3" data-suffix="yr"` / label `Domain depth`

  Card 1 (reveal-left): `Credit Flow Transformation` — Defined E2E requirements and drove cross-functional delivery for the Credit Flow for Commercial Banking transformation.
  Card 2 (reveal-right): `Client Portal Integration` — Owned E2E project streamlining business banking onboarding from prospecting to signing across legacy systems via API.
  Card 3 (reveal-left): `Compliance Reporting` — Introduced configurable credit compliance reporting templates scaled across multiple lines of business to standardize regulatory workflows.

  **Era 4 — CDL (1 card):**

  Era header:
  - Company: `Creative Destruction Lab`
  - Role: `Venture Growth in Machine Learning Stream`
  - Dates: `2017 – 2018`
  - Chips: ML, Venture, University of Toronto, Rotman Commerce
  - No stat callout

  Card 1 (reveal-left): `ML Venture Cohort` — Worked alongside ML-native founders and operators; developed early conviction in AI-native product building. B.Com, University of Toronto.

- **Pattern to follow:** `index.html` head section; `styles/cover.css` class naming
- **Dependencies:** Tasks 1 and 2 (for full visual result, but HTML can be authored in parallel)

---

## Constraints

- NEVER use `var(--interior-bg)`, `var(--interior-text)`, or `var(--border-light)` in `timeline.css`
- NEVER load `styles/layout.css` in `timeline.html`
- NEVER use ES module syntax in `timeline.js` — no `import`/`export`
- NEVER add `type="module"` to the `timeline.js` script tag
- NEVER inline `<style>` blocks in `timeline.html`
- NEVER inline `onclick` handlers in `timeline.html`
- Content strictly from `specs/resume.md` — do not embellish metrics
- Chapter links: relative paths `index.html#ch2` through `index.html#ch5`, not absolute URLs
- No hardcoded hex in `timeline.css` except `rgba()` opacity layers with `/* comment */`
- `index.html` is NOT modified
- No emoji in any visible text
- Era node positions set by JS after layout, not hardcoded in HTML
- Mobile breakpoint: exactly `max-width: 899px`
- Cards alternate left/right on desktop; all bottom-reveal on mobile (CSS override)

---

## Definition of Done

- [ ] `timeline.html` opens in browser with no console errors
- [ ] `grep -n '#[0-9a-fA-F]' styles/timeline.css` returns only rgba() lines with comments
- [ ] `grep -n 'IntersectionObserver' js/timeline.js` returns ≥ 2 matches
- [ ] Page header visible with `← Full portfolio` link
- [ ] Hero strip with `Career Timeline`, subtitle, pulse-dot badge
- [ ] Vertical gold rail visible on left side of timeline section
- [ ] Rail fill grows on scroll
- [ ] All four era headers (HighFi, Utradea, BMO, CDL) in reverse chronological order
- [ ] Era nodes pulse when era is active
- [ ] Cards hidden on load; animate in on scroll
- [ ] Stat numbers count up: `$200K`, `100+`, `3yr`
- [ ] CDL era has no stat callout
- [ ] `grep -c 'class="count-up"' timeline.html` returns `3`
- [ ] 2-column card grid at ≥ 900px; 1-column at < 900px
- [ ] Chapter links present on all 4 HighFi cards
- [ ] Footer with `Read the full portfolio →` CTA
- [ ] All links keyboard-focusable with gold focus outline
- [ ] `<main>` landmark wraps hero + timeline
- [ ] Era headers are `<h2>`; card names are `<h3>`
- [ ] `grep 'import\|export' js/timeline.js` returns no matches
- [ ] `index.html` unchanged
- [ ] Spec status updated to `completed` in `specs/spec-002-portfolio-chronological-timeline-splash.md`
