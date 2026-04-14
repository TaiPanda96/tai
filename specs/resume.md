Tai Lin
Toronto, ON taishanlin1996@gmail.com linkedin.com/in/tai-lin-122682105/ github.com/TaiPanda96
Founding engineer focused on building agentic systems and the infrastructure required to make them work in complex, real-world domains. At HighFi, I scaled the first two key customers from $0 to $200K ARR as the primary technical point of contact for complex system integrations. I design and build the core systems — configurable financial engines, multi-step AI agents, and autonomous dev tooling — that translate ambiguous requirements into deterministic, production-grade workflows.
EXPERIENCE
Founding Software Engineer | HighFi Mar 2023 – Present
AI-enabled capital markets infrastructure · TypeScript, PostgreSQL, Next.js, Vercel AI SDK, Pulumi, GCP
Product (Penny & Millie)
Shipped Penny, an in-app Capital Markets AI Agent (Claude + Gemini, streaming) for real-time risk reporting, funding requests, and ledger management — owned concept to live deployment, replacing manual legacy processes in funding operations.
Architected and shipped Millie, a context-aware Slack agent that dynamically builds authorized toolsets per-request, supports 15-step multi-tool execution, and handles capital markets funding requests, SOFR rate updates, & portfolio reporting — with full webhook verification, event deduplication, and thread-persistent conversation history in PostgreSQL.

Platform (Agent Harness & Context Layer)
Designed and built a production AI agent harness (BaseAgent<TDeps, TInput, TOutput>) — typed dependency injection, structured step tracing, AgentHandoff<T> returns, and per-step Slack observability — powering 6+ agents across a multi-tenant capital markets platform.
Implemented a role-based capability registry that gates LLM tool access by customer config and user role, generating dynamic system prompts with per-capability workflow manifests for safe, auditable multi-step financial operations.

Core Systems
Led the design of a config-driven financial calculation engine supporting dependency graphs, runtime-evaluable expressions, and unified eligibility, concentration, and facility-level formulas; replaced rigid hardcoded logic with extensible self-serve configuration.
Architected the lending Assignment Engine — core algorithm for assigning receivables under borrowing base constraints, enforcing concentration limits, and supporting add/remove strategies with deterministic, priority-sorted outcomes.

Agentic Continuous Delivery
Engineered security layer for Claude Coding Agent: whitelist-based command executor, bash wrapper interception, and scoped CI permissions — autonomous code execution with a zero-trust command surface.
Designed and built HighFi's Night Agent — a fully autonomous, spec-driven development pipeline running nightly on GitHub Actions: parallel matrix CI jobs across isolated branches, coordinated Planner / Implementer / QA Claude Code instances, with Slack Block Kit notifications and 1-click PR creation for human review at 8 AM.

Software Engineer → Software Engineer II | Utradea Mar 2021 – Feb 2023
Social investing platform → B2B API layer · Node.js, MongoDB, PostgreSQL, AWS, Redis · Merged with Financial Modeling Prep
Software Engineer II Jan 2022 – Feb 2023
Led migration of 100+ stock market APIs from Financial Modeling Prep into Utradea's Node.js / MongoDB stack post-merger
Architected AWS infrastructure for scale: managed PostgreSQL (RDS), ECS containers, load balancers, and structured logging
Implemented rate limiting by paid subscription tier, scaled to multi node Redis cluster with read/write replication to manage traffic load
Piloted and shipped OpenAI API integration — integrated into the Financial Writer tool, an AI-powered news article generator built on Utradea's real-time market APIs
Integrated Twitter V1 & V2 feeds to power time-series social sentiment analysis across stock tickers
Software Engineer Mar 2021 – Jan 2022
Joined with no formal CS background; self-taught and shipped paid production features within months
Built the Sentiment Parser for SEC filings using NLP processing and sentiment classification — classified filing sentiment to surface actionable stock signals
Integrated Stripe payments end-to-end, enabling Utradea's first paid users and establishing the monetization foundation for the business

Business Analyst | BMO Financial Group May 2018 – Mar 2021
Capital markets & commercial banking · Requirements, systems analysis & data
Senior Business Analyst Nov 2020 – Mar 2021
Led the decommissioning of a vendor risk management platform, owning business requirements and migration to a streamlined in-house replacement
Defined E2E requirements and drove cross-functional delivery for the Credit Flow for Commercial Banking transformation
Business Systems / Data Analyst May 2018 – Nov 2020
Owned E2E Client Portal Integration project, streamlining business banking onboarding from prospecting to signing across legacy systems via API
Enhanced Online Banking for Business experience as part of the client portal integration, coordinating across multiple platform teams
Introduced configurable credit compliance reporting templates, scaled across multiple lines of business to standardize regulatory workflows

EDUCATION
Bachelor of Commerce (B.Com.) | University of Toronto — Rotman Commerce 2018
Major in Management · Minor in Economics

Venture Growth in Machine Learning Stream | Creative Destruction Lab (CDL) 2017 – 2018
Student Cohort 2018 · Worked alongside ML-native founders and operators; developed early conviction in AI-native product building

SKILLS

Engineering TypeScript · PostgreSQL · Redis · AWS (ECS, RDS) · API design · LLM orchestration · System design
Product 0→1 product development · Requirements definition · Roadmapping · PMF thinking
Domain Capital markets · Commercial banking · Risk & compliance · Fintech infrastructure
