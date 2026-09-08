export { profile } from './profile'

export type Section = {
  id: string
  title: string
  paragraphs: string[]
  quote?: string
  flow?: string[]
}

export type Study = {
  slug: string
  category: 'work' | 'projects'
  company: string
  title: string
  shortTitle: string
  discipline: string
  description: string
  introduction: string
  figure?: 'snapshots' | 'agreements' | 'millie'
  sections: Section[]
}

export const studyPath = (study: Study) => `/${study.category}/${study.slug}`

// Role context comes from TaiPanda96/tai; HighFi's stories come from Tai's Notion profile.
export const workHistory: Partial<Record<string, { role: string; period: string; years: string }>> = {
  HighFi: { role: 'Founding Software Engineer', period: 'Mar 2023 - Present', years: '2023 - Present' },
  Utradea: { role: 'Software Engineer to Software Engineer II', period: 'Mar 2021 - Feb 2023', years: '2021 - 2023' },
  'BMO Financial Group': { role: 'Business Analyst to Senior Business Analyst', period: 'May 2018 - Mar 2021', years: '2018 - 2021' },
  'Creative Destruction Lab': { role: 'Student cohort, Venture Growth in Machine Learning', period: '2017 - 2018', years: '2017 - 2018' },
}

export const studies: Study[] = [
  {
    slug: 'replayable-compliance',
    category: 'work',
    company: 'HighFi',
    title: 'Making compliance replayable',
    shortTitle: 'Replayable compliance',
    discipline: 'Data infrastructure',
    description: 'From an 85 MB spreadsheet to a reliable, auditable financial system.',
    introduction: 'At HighFi, I built the ingestion and snapshot architecture that moved a customer’s compliance reporting out of Excel. The pilot handled roughly 300,000 collateral records and helped close a $150K ARR customer.',
    figure: 'snapshots',
    sections: [
      {
        id: 'the-real-problem',
        title: 'The real problem',
        paragraphs: [
          'Our first enterprise customer had a $200M revolving credit facility with a U.S. regional bank. Every day at 1 PM, their VP of Finance needed to know whether the business was compliant and how much it could borrow.',
          'The rules lived in a long legal agreement. The data lived across loan, cash, rates, and servicing systems. The operating system that held everything together was an 85 MB Excel workbook.',
          'I sat with the capital-markets team and co-ran an actual reporting package. The workbook contained years of institutional knowledge: formulas, policy changes, data-cleaning workarounds, manual overrides, and assumptions nobody could reliably trace to their source.',
          'When something was wrong, it was hard to tell whether the problem came from the source data, the transformation, or the calculation. Reconstructing a past compliance position meant finding an old spreadsheet and hoping its inputs still existed.',
        ],
        quote: 'We weren’t automating a reporting workflow. We were replacing an operational system that happened to live inside a spreadsheet.',
      },
      {
        id: 'a-replayable-system',
        title: 'A replayable system',
        paragraphs: [
          'I made time and data lineage first-class parts of the architecture. Instead of asking only whether a facility was compliant now, the system needed to answer: what was its compliance state at this point in time, using these particular inputs?',
          'Every input used in a calculation became a timestamped snapshot: cash, collateral, money in flight, and interest owed. Historical compliance could then be reproduced, rather than reconstructed from whatever data happened to be available today.',
          'The second decision was to make bad data fail loudly before it reached the calculation layer. I designed an ingestion verification layer to normalize incoming data, validate financial definitions, and give finance and engineering teams enough context to fix errors at their source.',
        ],
        flow: ['Raw customer data', 'Verified snapshots', 'Compliance calculations', 'Lender reporting'],
      },
      {
        id: 'shipping-the-boundary',
        title: 'Shipping the boundary',
        paragraphs: [
          'Version one was a daily script. It ran at 1 PM Eastern, with human-readable error logs shared in Slack. That let us test the boundary against the customer’s actual operating rhythm before building more infrastructure.',
          'I then moved execution onto Google Batch, added application-level status tracking, and delivered completion and data-quality events directly into the customer’s Slack workflow.',
          'Within the first week of the pilot, normalized ingestion was running against real cash balances and roughly 300,000 collateral records. Problems that had surfaced late in reporting were now caught at ingestion.',
        ],
      },
      {
        id: 'the-outcome',
        title: 'The outcome',
        paragraphs: [
          'By the end of the pilot, HighFi was producing the lender-facing reports, and we closed the customer at $150K ARR. Excel became an output artifact rather than the system driving the calculation.',
          'The customer implementation became the foundation for a reusable ingestion layer, eventually supporting configurable connections to BigQuery, S3, Metabase, and custom ERPs.',
          'The useful abstraction wasn’t “a better spreadsheet.” It was a trustworthy boundary between raw customer data and financial decisions, with enough history to explain every result.',
        ],
      },
    ],
  },
  {
    slug: 'executable-agreements',
    category: 'work',
    company: 'HighFi',
    title: 'From legal terms to executable models',
    shortTitle: 'Executable agreements',
    discipline: 'AI-assisted systems',
    description: 'Turning bespoke facility onboarding into a configurable platform.',
    introduction: 'I helped move HighFi’s facility onboarding from custom engineering implementations toward a reviewed, AI-assisted configuration workflow. The aim was to let a small engineering team support growing borrower complexity without writing new code for every agreement.',
    figure: 'agreements',
    sections: [
      {
        id: 'the-scaling-problem',
        title: 'The scaling problem',
        paragraphs: [
          'After proving that HighFi could automate compliance for individual facilities, we faced a different problem: what happened when five new borrowers arrived at once?',
          'A credit agreement is written for lawyers and capital-markets professionals. Someone had to interpret the legal terms, map them onto the borrower’s loan and cash data, and translate those rules into executable calculations.',
          'Each facility could become another bespoke implementation for a five-person engineering team. Our ambition was to support hundreds of borrower-lender relationships. Getting faster at manual implementation wasn’t a sufficient scaling model.',
        ],
      },
      {
        id: 'a-model-not-an-implementation',
        title: 'A model, not an implementation',
        paragraphs: [
          'I reframed onboarding as model extraction and compilation. Could a credit agreement become a typed, configurable facility model that HighFi could execute generically?',
          'We defined compliance rules as calculation recipes. Each recipe described the rule being enforced, the data needed to evaluate it, and the calculation itself. Facility-specific complexity became structured configuration rather than one-off application code.',
          'AI could interpret an agreement and draft a facility model. A capital-markets user could then review and correct it before anything became active.',
        ],
        quote: 'Engineering builds the platform once. Facility-specific complexity becomes configuration the platform can execute.',
      },
      {
        id: 'keeping-judgment-in-the-loop',
        title: 'Keeping judgment in the loop',
        paragraphs: [
          'The approval boundary was a core part of the design. We weren’t trying to automate away the judgment of the people responsible for the facility.',
          'The workflow moved from an engineer interpreting an agreement and deploying custom logic toward a user uploading an agreement, reviewing the extracted model, correcting it, and explicitly approving activation.',
          'Users could change the model directly. That gave capital-markets teams more control while keeping the underlying calculation engine standardized and within engineering’s control.',
        ],
        flow: ['Upload agreement', 'Extract model', 'Review + correct', 'Approve + activate'],
      },
      {
        id: 'what-changed',
        title: 'What changed',
        paragraphs: [
          'Onboarding moved toward a drafting and review workflow rather than a fresh engineering implementation for every facility.',
          'Every correction also became structured data. Instead of feedback disappearing into customer conversations, we could see which parts of the facility model users changed. Those corrections could inform improvements to extraction and to the model itself.',
          'The architectural change was the outcome: a clearer boundary between the reusable platform and the domain-specific configuration it executes.',
        ],
      },
    ],
  },
  {
    slug: 'millie',
    category: 'work',
    company: 'HighFi',
    title: 'Financial operations, where the work happens',
    shortTitle: 'Millie',
    discipline: 'Agents + enterprise workflows',
    description: 'A scoped, permission-aware interface to HighFi, inside Slack.',
    introduction: 'Millie brought recurring financial operations into the place HighFi’s customers already worked: Slack. It shipped with our largest customer in April 2026, then expanded from simple recurring tasks into compliance queries and approval-based funding workflows.',
    figure: 'millie',
    sections: [
      {
        id: 'work-without-context-switching',
        title: 'Work without context switching',
        paragraphs: [
          'HighFi’s customers coordinated capital-markets operations in Slack, but the information they needed was scattered across HighFi, loan tapes, bank accounts, reports, and internal systems.',
          'Even a routine question about borrowing capacity or concentration risk could require someone to leave the conversation, find a report, interpret it, and manually complete the next step.',
          'Our hypothesis was that Slack already contained valuable operating context: who was asking, which facility they meant, what had happened, and what needed to happen next. We could bring the workflow into that context while keeping HighFi as the source of truth.',
        ],
      },
      {
        id: 'authority-before-autonomy',
        title: 'Authority before autonomy',
        paragraphs: [
          'These workflows involved facility terms, cash balances, compliance calculations, interest rates, and funding requests. Different channels carried different customer contexts, and administrators and users had different permissions.',
          'We did not trust an agent to mutate financial workflow state autonomously. A funding-request status change, for example, required explicit approval from an authorized capital-markets user.',
          'We designed Millie around deterministic workflow boundaries. A policy-driven Slack menu acted as an intent router. Available actions depended on the user’s role, their HighFi session scope, the customer’s configuration, and the workflow being requested.',
        ],
        quote: 'Slack provided the conversation and context. HighFi retained the authority and source of truth.',
      },
      {
        id: 'making-execution-inspectable',
        title: 'Making execution inspectable',
        paragraphs: [
          'Persisted conversations carried the speaker, customer and facility scope, permissions, and requested workflows. That context was explicit rather than left for the model to reconstruct from free-form text.',
          'We added step-level tracing for tool calls, execution order, and results. This established an observability foundation for future evaluation.',
          'We began defining golden use cases with capital-markets teams around expected workflows and tool-call sequences. We started with low-complexity, recurring search and operations tasks, then expanded as the policy boundaries became clearer.',
        ],
        flow: ['Slack intent', 'Scope + permissions', 'Workflow + approval', 'HighFi execution'],
      },
      {
        id: 'from-first-task-to-daily-work',
        title: 'From first task to daily work',
        paragraphs: [
          'Millie shipped with our largest customer in April 2026, initially supporting simple recurring tasks such as updating benchmark SOFR rates.',
          'By May, it supported more involved work: updating the status of late or cancelled funding requests, running compliance reports and notifying users on completion, and querying current compliance state for specific risk categories.',
          'Those use cases settled into three areas: configuration on existing facilities, funding-request updates requiring manual operations intervention, and current-state compliance queries.',
          'The core lesson was to build a controlled conversational interface into existing financial workflows, with an explicit boundary around who could do what.',
        ],
      },
    ],
  },
  {
    slug: 'utradea',
    category: 'work',
    company: 'Utradea',
    title: 'Building a market data platform',
    shortTitle: 'Market data infrastructure',
    discipline: 'Financial data + infrastructure',
    description: 'From the first paid features to the infrastructure behind 50+ market data APIs.',
    introduction: 'I joined Utradea as its first engineering hire, without a formal computer science background. Within months I was shipping paid production features. My work grew from payments and investor tools to the infrastructure behind more than 50 market data APIs.',
    sections: [
      {
        id: 'api-migration',
        title: 'API migration',
        paragraphs: [
          'Following the merger with Financial Modeling Prep, I led the migration of more than 50 APIs into Utradea’s Node.js and MongoDB stack. I owned the infrastructure transition for a market data platform serving both free and enterprise customers.',
        ],
      },
      {
        id: 'scaling-the-infrastructure',
        title: 'Scaling the infrastructure',
        paragraphs: [
          'As traffic grew, I moved the backend from AWS Lightsail to ECS with Fargate and load balancers. I also implemented Redis cycle caching across a multi-node cluster for high-frequency stock-price reads, with rate limits tied to each customer’s subscription tier.',
        ],
      },
      {
        id: 'investor-tools-and-payments',
        title: 'Investor tools and payments',
        paragraphs: [
          'I built the SEC Dashboard end to end. Its NLP pipeline used winkNLP and VADER to turn SEC 8-K filings into investor-readable summaries, with keyword extraction and price-change context. I also integrated Stripe payments, enabling Utradea’s first paid users.',
        ],
      },
      {
        id: 'financial-writer',
        title: 'Financial Writer',
        paragraphs: [
          'I piloted an early OpenAI API integration for Financial Writer, a tool that generated news articles from real-time market data. It was my first production AI integration, shipped before ChatGPT launched.',
        ],
      },
    ],
  },
  {
    slug: 'bmo',
    category: 'work',
    company: 'BMO Financial Group',
    title: 'Connecting commercial banking systems',
    shortTitle: 'Commercial banking systems',
    discipline: 'Financial systems + business analysis',
    description: 'Credit, onboarding, and regulatory workflows across capital markets and commercial banking.',
    introduction: 'At BMO, I worked across capital markets and commercial banking, translating credit policies, legal agreements, and operational needs into requirements for financial systems. That experience gave me the domain knowledge I later brought into software engineering.',
    sections: [
      {
        id: 'vendor-risk',
        title: 'Vendor risk',
        paragraphs: [
          'I led the decommissioning of a vendor risk management platform, owning the business requirements and migration to an in-house replacement.',
        ],
      },
      {
        id: 'commercial-credit',
        title: 'Commercial credit',
        paragraphs: [
          'For the Credit Flow for Commercial Banking transformation, I defined end-to-end requirements and drove delivery across teams.',
        ],
      },
      {
        id: 'client-onboarding',
        title: 'Client onboarding',
        paragraphs: [
          'I owned Client Portal Integration from prospecting through signing, connecting legacy systems through APIs to streamline business banking onboarding. The work also included improvements to Online Banking for Business, coordinated across multiple platform teams.',
        ],
      },
      {
        id: 'compliance-reporting',
        title: 'Compliance reporting',
        paragraphs: [
          'I introduced configurable credit compliance reporting templates across multiple lines of business, standardizing regulatory workflows while allowing teams to adapt the reports to their needs.',
        ],
      },
    ],
  },
  {
    slug: 'creative-destruction-lab',
    category: 'work',
    company: 'Creative Destruction Lab',
    title: 'Venture growth in machine learning',
    shortTitle: 'Machine learning venture growth',
    discipline: 'Machine learning + venture growth',
    description: 'Working alongside founders and operators in the student cohort at Creative Destruction Lab.',
    introduction: 'As part of the student cohort at Creative Destruction Lab at the University of Toronto, I worked alongside machine-learning founders and operators. The experience shaped my interest in the infrastructure that turns model capability into usable products.',
    sections: [],
  },
]
