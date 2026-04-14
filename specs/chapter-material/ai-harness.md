```typescript
import { getLogger } from "@op/lib/common/logger";
import {
  StepTrace,
  createStepTrace,
  completeStepTrace,
  logStepTrace,
} from "../tracing/step-trace";
import {
  AgentHandoff,
  createSuccessHandoff,
  createFailureHandoff,
} from "../handoff/agent-handoff";
import { SlackStepTraceHandler } from "../notifications/slack-step-trace-handler";

/**
 * Abstract base class for all HighFi agents using the Agent Contexts & Composition architecture.
 *
 * Provides:
 * - Typed dependency injection via generics
 * - Structured step tracing via onStepFinish
 * - Typed AgentHandoff<TOutput> returns
 * - Error collection and propagation
 * - Consistent logging
 *
 * @template TDeps - The dependency context required by this agent (use domain contexts or Pick<> subsets).
 * @template TInput - The input type this agent accepts.
 * @template TOutput - The output type this agent produces.
 *
 * @example
 * type SentinelDeps = DefiContext & Pick<InfraContext, 'prisma'>
 *
 * class SentinelAgent extends BaseAgent<SentinelDeps, SentinelInput, SentinelOutput> {
 *   readonly agentId = 'sentinel-agent'
 *
 *   async execute(input: SentinelInput): Promise<AgentHandoff<SentinelOutput>> {
 *     const stepTrace = this.startStep('analyzePortfolio', { portfolioId: input.portfolioId })
 *     try {
 *       const result = await someAnalysis(this.deps.morpho, this.deps.prisma, input)
 *       this.finishStep(stepTrace, result)
 *       return this.succeed({ riskLevel: result.riskLevel, portfolioId: input.portfolioId })
 *     } catch (error) {
 *       this.failStep(stepTrace, error)
 *       return this.fail({ riskLevel: 'HIGH', portfolioId: input.portfolioId }, [error as Error])
 *     }
 *   }
 * }
 */
export abstract class BaseAgent<TDeps, TInput, TOutput> {
  protected readonly deps: TDeps;
  protected readonly traces: StepTrace[] = [];
  protected readonly errors: Error[] = [];
  protected readonly log: ReturnType<typeof getLogger>;
  private slackHandler?: SlackStepTraceHandler;
  private slackUser?: string;

  /** Unique identifier for this agent, used in traces and logs. Must be set by subclasses. */
  abstract readonly agentId: string;

  constructor(deps: TDeps) {
    this.deps = deps;
    this.log = getLogger("base-agent", "info");
  }

  /**
   * Attaches a Slack notification handler so that every traced step produces a
   * Slack message. Returns `this` for fluent chaining.
   *
   * @example
   * const agent = new PortfolioAgent(deps).withSlackNotifications(handler, 'user@example.com')
   *
   * @param handler - The `SlackStepTraceHandler` to dispatch notifications.
   * @param user - Optional user identifier included in each notification.
   */
  withSlackNotifications(handler: SlackStepTraceHandler, user?: string): this {
    this.slackHandler = handler;
    this.slackUser = user;
    return this;
  }

  /**
   * Execute the agent with the given input and return a typed AgentHandoff.
   * Must be implemented by all subclasses.
   */
  abstract execute(input: TInput): Promise<AgentHandoff<TOutput>>;

  /**
   * Starts a new trace for a named step, recording input and timestamp.
   * Call this at the beginning of each logical step.
   */
  protected startStep(
    stepName: string,
    input: unknown,
    metadata?: Record<string, unknown>,
  ): StepTrace {
    const trace = createStepTrace(this.agentId, stepName, input, metadata);
    this.log.debug(`[${this.agentId}] Starting step: ${stepName}`, {
      traceId: trace.id,
    });
    return trace;
  }

  /**
   * Marks a step as complete with its output and records duration.
   * If a Slack handler is attached, dispatches a success notification asynchronously.
   */
  protected finishStep(trace: StepTrace, output: unknown): StepTrace {
    const completed = completeStepTrace(trace, output, "complete");
    this.traces.push(completed);
    logStepTrace(completed);
    this.slackHandler
      ?.handle(completed, this.slackUser)
      .catch((err: unknown) => {
        this.log.error(`[${this.agentId}] Slack notification dispatch failed`, {
          error: err instanceof Error ? err.message : String(err),
        });
      });
    return completed;
  }

  /**
   * Marks a step as failed with error information.
   * If a Slack handler is attached, dispatches an error notification asynchronously.
   */
  protected failStep(trace: StepTrace, error: unknown): StepTrace {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const failed = completeStepTrace(trace, { error: errorMessage }, "error");
    this.traces.push(failed);
    logStepTrace(failed);
    if (error instanceof Error) {
      this.errors.push(error);
    }
    this.slackHandler?.handle(failed, this.slackUser).catch((err: unknown) => {
      this.log.error(`[${this.agentId}] Slack notification dispatch failed`, {
        error: err instanceof Error ? err.message : String(err),
      });
    });
    return failed;
  }

  /**
   * Creates an onStepFinish handler for use with generateText.
   * Automatically traces each LLM step with tool call information.
   *
   * @example
   * await generateText({
   *   model: anthropic('claude-sonnet-4-5-20250929'),
   *   tools,
   *   onStepFinish: this.createOnStepFinish('llm-reasoning'),
   * })
   */
  protected createOnStepFinish(stepPrefix: string) {
    return ({
      text,
      toolCalls,
      usage,
    }: {
      text: string;
      toolCalls: Array<{ toolName?: string }>;
      usage: unknown;
    }) => {
      // Strip args to avoid structuredClone failures on Decimal/BigInt values in Zod-parsed tool arguments
      const safeToolCalls = toolCalls.map((tc) => ({ toolName: tc.toolName }));
      const trace = createStepTrace(this.agentId, `${stepPrefix}:step`, {
        toolCalls: safeToolCalls,
        usage,
      });
      const completed = completeStepTrace(trace, { text: text.slice(0, 200) });
      this.traces.push(completed);
      this.log.debug(`[${this.agentId}] LLM step finished`, {
        toolCallCount: toolCalls.length,
        traceId: completed.id,
      });
    };
  }

  /**
   * Returns a successful AgentHandoff with all accumulated traces.
   */
  protected succeed(
    output: TOutput,
    metadata?: Record<string, unknown>,
  ): AgentHandoff<TOutput> {
    return createSuccessHandoff(output, [...this.traces], metadata);
  }

  /**
   * Returns a failed AgentHandoff with errors and all accumulated traces.
   */
  protected fail(
    output: TOutput,
    errors?: Error[],
    metadata?: Record<string, unknown>,
  ): AgentHandoff<TOutput> {
    const allErrors = [...this.errors, ...(errors ?? [])];
    return createFailureHandoff(output, [...this.traces], allErrors, metadata);
  }
}
```

```typescript
import "server-cli-only";

import { Customer } from "@op/gen/prisma";
import { InfraContext } from "@op/lib/agents/contexts";
import { getLogger } from "@op/lib/common/logger";

const log = getLogger("customer-capability-registry", "info");

/**
 * Context required for capability evaluation and tool creation.
 */
export interface CapabilityContext {
  customer: Customer;
  userEmail: string;
  isAdmin: boolean;
}

/**
 * Customer-specific capabilities that Millie can provide based on user permissions.
 * Each capability represents a bounded set of tools and operations.
 */
export enum CustomerCapability {
  /** Support for funding requests, draws, and recycling operations */
  FUNDING_REQUEST_SUPPORT = "funding-request-support",
  /** Support for fee management and SOFR rate updates */
  FEES_SUPPORT = "fees-support",
  /** DeFi operations (Admin only) */
  DEFI_OPERATIONS = "defi-operations",
  /** Support for facility reporting, receivable querying and updates */
  FACILITY_REPORTING = "facility-reporting",
  /** DeFi Morpho Markets Support */
  MORPHO_MARKET_ANALYSIS = "morpho-market-analysis",
}

export type CustomerCapabilityKey = keyof typeof CustomerCapability;

/**
 * A bundle of capabilities available to a customer, represented as a mapping of capability keys to boolean values indicating availability.
 * This will be the data structure that maps capability bundle to tool availability in the agent logic.
 * This will also inform the prompting logic to only show capabilities that are true for the customer and user context.
 */
export type CapabilityBundle = Record<CustomerCapabilityKey, boolean>;

/**
 * Metadata about a customer capability including permissions and description.
 */
export interface CustomerCapabilityInfo {
  capability: CustomerCapability;
  name: string;
  description: string;
  icon: string;
  whiteListedCustomerSlugs?: string[];
  adminOnly?: boolean; // Whether this capability is only for admins
}

/**
 * Registry of all customer capabilities that Millie can provide.
 */
export const CUSTOMER_CAPABILITY_REGISTRY: Record<
  CustomerCapability,
  CustomerCapabilityInfo
> = {
  [CustomerCapability.FUNDING_REQUEST_SUPPORT]: {
    capability: CustomerCapability.FUNDING_REQUEST_SUPPORT,
    name: "Funding Request Support",
    description:
      "Help with funding requests, draws, facility information, and funding operations",
    adminOnly: false,
    icon: "💰",
    whiteListedCustomerSlugs: ["wayflyer"],
  },
  [CustomerCapability.FEES_SUPPORT]: {
    capability: CustomerCapability.FEES_SUPPORT,
    name: "Fees & Rates Support",
    description:
      "Update SOFR rates, manage facility fees, and handle rate calculations",
    adminOnly: false,
    icon: "📊",
    whiteListedCustomerSlugs: ["wayflyer"],
  },
  [CustomerCapability.DEFI_OPERATIONS]: {
    capability: CustomerCapability.DEFI_OPERATIONS,
    name: "DeFi Operations",
    description:
      "Advanced DeFi operations, portfolio management, and yield optimization (Admin Only)",
    adminOnly: true,
    icon: "🔗",
  },
  [CustomerCapability.MORPHO_MARKET_ANALYSIS]: {
    capability: CustomerCapability.MORPHO_MARKET_ANALYSIS,
    name: "Morpho Market Analysis",
    description:
      "Real-time Morpho market health analysis including borrow/repay ratios, liquidation tracking, and net capital flow monitoring (Admin Only)",
    adminOnly: true,
    icon: "📈",
  },
  [CustomerCapability.FACILITY_REPORTING]: {
    capability: CustomerCapability.FACILITY_REPORTING,
    name: "Facility Reporting",
    description:
      "Access facility reports, query receivables, and update receivable data",
    adminOnly: false,
    icon: "📋",
    whiteListedCustomerSlugs: ["wayflyer"],
  },
};

/**
 * Determines which capabilities are available for a specific customer and user.
 *
 * @param ctx - Infrastructure context for database access
 * @param capabilityContext - Customer and user context
 * @returns Array of available capabilities
 */
export async function getAvailableCapabilities(
  ctx: Pick<InfraContext, "prisma">,
  capabilityContext: CapabilityContext,
): Promise<CustomerCapabilityInfo[]> {
  const { customer, isAdmin } = capabilityContext;

  const availableCapabilities: CustomerCapabilityInfo[] = [];

  const facilityCount = await ctx.prisma.facility.count({
    where: { customerId: customer.id },
  });

  if (facilityCount > 0) {
    availableCapabilities.push(
      CUSTOMER_CAPABILITY_REGISTRY[CustomerCapability.FUNDING_REQUEST_SUPPORT],
    );
    availableCapabilities.push(
      CUSTOMER_CAPABILITY_REGISTRY[CustomerCapability.FEES_SUPPORT],
    );
    availableCapabilities.push(
      CUSTOMER_CAPABILITY_REGISTRY[CustomerCapability.FACILITY_REPORTING],
    );
  }

  // DeFi operations only for admins
  if (isAdmin) {
    availableCapabilities.push(
      CUSTOMER_CAPABILITY_REGISTRY[CustomerCapability.DEFI_OPERATIONS],
    );
    availableCapabilities.push(
      CUSTOMER_CAPABILITY_REGISTRY[CustomerCapability.MORPHO_MARKET_ANALYSIS],
    );
  }

  return availableCapabilities;
}

/**
 * Creates a capabilities menu display for user interaction.
 *
 * @param capabilities - Available capabilities for the user
 * @returns Formatted menu string for display
 */
export function formatCapabilitiesMenu(
  capabilities: CustomerCapabilityInfo[],
): string {
  if (capabilities.length === 0) {
    return "I don't have any capabilities available for your customer at this time. Please contact HighFi support for assistance.";
  }

  const menuItems = capabilities
    .map(
      (cap, index) =>
        `${index + 1}. ${cap.icon} **${cap.name}**\n   ${cap.description}`,
    )
    .join("\n\n");

  return `Hello! I'm Millie, your HighFi assistant. I can help you with the following:\n\n${menuItems}\n\nPlease select a capability by number (1-${capabilities.length}) or describe what you'd like help with.`;
}

/**
 * Creates a channel introduction message for when Millie joins a channel.
 *
 * @param capabilities - Available capabilities for the customer
 * @param customerName - Name of the customer
 * @returns Formatted introduction message
 */
export function formatChannelIntroduction(
  capabilities: CustomerCapabilityInfo[],
  customerName?: string,
): string {
  const greeting = customerName
    ? `Hello! I'm **Millie**, your HighFi AI assistant for **${customerName}**. 👋`
    : `Hello! I'm **Millie**, your HighFi AI assistant. 👋`;

  if (capabilities.length === 0) {
    return `${greeting}\n\nI don't have any capabilities available for this customer at the moment. Please contact HighFi support for assistance with your capital markets workflows.`;
  }

  const capabilityList = capabilities
    .map((cap) => `• ${cap.icon} **${cap.name}**: ${cap.description}`)
    .join("\n");

  const commonWorkflows = [
    "💬 Ask questions about your funding requests or facility status",
    "📊 Get help with fee calculations and rate updates",
    "📈 Access detailed facility reporting and analytics",
    "🔧 Update receivable data and manage portfolio information",
  ].join("\n");

  return `${greeting}

I'm here to help your Capital Markets team with:

${capabilityList}

**Common workflows I can assist with:**
${commonWorkflows}

Simply @mention me in this channel or send me a direct message to get started! I can understand natural language, so just tell me what you need help with.

*Questions? Contact your HighFi support team or check our documentation.*`;
}

/**
 * @abstract - Validates that a user can access a specific capability.
 * @param capability - The capability to check
 * @param capabilityContext - User and customer context
 * @param availableCapabilities - Pre-computed available capabilities
 * @returns true if user has access, false otherwise
 */
export function canUserAccessCapability(
  capabilityKey: CustomerCapability,
  capabilityContext: CapabilityContext,
  availableCapabilities: CustomerCapabilityInfo[],
): boolean {
  const capabilityRegistered = CUSTOMER_CAPABILITY_REGISTRY[capabilityKey];
  if (!capabilityRegistered) {
    log.warn(
      `Capability ${capabilityKey} is not registered in the capability registry`,
    );
    return false;
  }

  const capabilityAvailable = availableCapabilities.some(
    (cap) => cap.capability === capabilityKey,
  );
  if (capabilityRegistered.adminOnly && !capabilityContext.isAdmin) {
    log.warn(
      `Capability ${capabilityKey} is admin only, access denied for non-admin users`,
    );
    return false;
  }

  if (
    capabilityRegistered.whiteListedCustomerSlugs &&
    !capabilityRegistered.whiteListedCustomerSlugs.includes(
      capabilityContext.customer.slug,
    )
  ) {
    log.warn(
      `Capability ${capabilityKey} is not available for customer slug ${capabilityContext.customer.slug}`,
    );
    return false;
  }

  return capabilityAvailable;
}
```

```typescript
import { getLogger } from "@op/lib/common/logger";
import { randomUUID } from "crypto";

const log = getLogger("step-trace", "info");

/**
 * Represents a single traced step within an agent execution.
 * Captured via the `onStepFinish` callback of the Vercel AI SDK's generateText.
 *
 * @example
 * const trace: StepTrace = {
 *   id: randomUUID(),
 *   agentId: 'sentinel-agent',
 *   stepName: 'analyzePortfolio',
 *   input: { portfolioId: 'abc' },
 *   output: { riskLevel: 'HIGH' },
 *   timestamp: new Date(),
 *   durationMs: 1500,
 *   status: 'complete',
 * }
 */
export interface StepTrace {
  id: string;
  agentId: string;
  stepName: string;
  input: unknown;
  output: unknown;
  timestamp: Date;
  durationMs: number;
  status: "pending" | "complete" | "error";
  metadata?: Record<string, unknown>;
}

/**
 * Creates a new StepTrace with auto-generated ID and timestamp.
 */
export function createStepTrace(
  agentId: string,
  stepName: string,
  input: unknown,
  metadata?: Record<string, unknown>,
): StepTrace {
  return {
    id: randomUUID(),
    agentId,
    stepName,
    input,
    output: null,
    timestamp: new Date(),
    durationMs: 0,
    status: "pending",
    metadata,
  };
}

/**
 * Completes a StepTrace with output and duration calculation.
 */
export function completeStepTrace(
  trace: StepTrace,
  output: unknown,
  status: "complete" | "error" = "complete",
): StepTrace {
  const durationMs = Date.now() - trace.timestamp.getTime();
  return { ...trace, output, durationMs, status };
}

/**
 * Logs a StepTrace using the structured logger.
 */
export function logStepTrace(trace: StepTrace): void {
  const level = trace.status === "error" ? "error" : "info";
  log[level](`[${trace.agentId}] Step: ${trace.stepName}`, {
    traceId: trace.id,
    status: trace.status,
    durationMs: trace.durationMs,
    metadata: trace.metadata,
  });
}
```

```typescript
import { Tool } from "ai";
import { withSerializedResult } from "../utils/serialize-tool-result";
import { z } from "zod";

/**
 * A map of named tools as used by the Vercel AI SDK.
 */
export type ToolMap = Record<string, Tool>;

// ---------------------------------------------------------------------------
// Tool Manifest Types
// ---------------------------------------------------------------------------

export interface ToolWorkflow {
  name: string;
  description: string;
  steps: string[];
  trigger?: string;
}

export interface ToolExample {
  input: string;
  expectedTools: string[];
  description?: string;
}

export interface ToolManifest {
  /** Human-readable description of what this tool category does */
  description: string;
  /** Detailed guidance for LLM on when and how to use these tools */
  promptGuidance: string;
  /** Common workflows that use these tools */
  workflows?: ToolWorkflow[];
  /** Example inputs and expected tool usage */
  examples?: ToolExample[];
  /** Prerequisites or constraints for using these tools */
  constraints?: string[];
}

export interface BoundToolFactoryWithManifest<
  TDeps,
  TTools extends ToolMap = ToolMap,
> {
  /** The tool factory function */
  factory: BoundToolFactory<TDeps, TTools>;
  /** The manifest describing how to use these tools */
  manifest: ToolManifest;
}

/**
 * A factory function that creates a ToolMap bound to a specific dependency context.
 * Use this pattern to create tool factories that can be independently tested
 * by swapping out their dependency context.
 *
 * @template TDeps - The dependency context required to create these tools.
 * @template TTools - The specific tool map shape returned by the factory.
 *
 * @example
 * // Define a DeFi tool factory for the Sentinel agent
 * const portfolioToolFactory: BoundToolFactory<DefiContext & Pick<InfraContext, 'prisma'>> =
 *   (deps) => ({
 *     checkPortfolioHealth: tool({
 *       description: 'Checks portfolio health against covenants',
 *       parameters: z.object({ portfolioId: z.string() }),
 *       async execute({ portfolioId }) {
 *         const data = await deps.morpho.getPortfolioData(portfolioId)
 *         return evaluateHealth(data)
 *       }
 *     })
 *   })
 *
 * // Bind to a concrete context for use in an agent
 * const tools = portfolioToolFactory(createDefiContext())
 */
export type BoundToolFactory<TDeps, TTools extends ToolMap = ToolMap> = (
  deps: TDeps,
) => TTools;

// ---------------------------------------------------------------------------
// Serialization Helpers
// ---------------------------------------------------------------------------

/**
 * Creates tools from a schema-based tools instance with automatic serialization.
 * Handles BigInt, Decimal, Date, and other complex types for AI SDK compatibility.
 */
function createSerializedTools<TToolsInstance>(
  toolsInstance: TToolsInstance,
  toolsSchema: Record<
    string,
    { description: string; parameters: z.AnyZodObject }
  >,
): ToolMap {
  const tools: ToolMap = {};

  Object.entries(toolsSchema).forEach(([toolName, schema]) => {
    const maybeFn = toolsInstance[toolName as keyof TToolsInstance];
    if (typeof maybeFn === "function") {
      const originalExecute = (
        maybeFn as (...args: Record<string, z.AnyZodObject>[]) => unknown
      ).bind(toolsInstance);

      tools[toolName] = {
        description: schema.description,
        parameters: schema.parameters,
        execute: withSerializedResult(originalExecute),
      };
    }
  });

  return tools;
}

// ---------------------------------------------------------------------------
// Factory Creation Methods
// ---------------------------------------------------------------------------

/**
 * Creates a bound tool factory by wrapping a factory function with a specific dependency type.
 * This is a helper to make TypeScript inference work correctly at the call site.
 *
 * @example
 * const sentinelTools = createBoundToolFactory<SentinelDeps>()((deps) => ({
 *   checkHealth: tool({ ... }),
 * }))
 */
export function createBoundToolFactory<TDeps>() {
  return function <TTools extends ToolMap>(
    factory: (deps: TDeps) => TTools,
  ): BoundToolFactory<TDeps, TTools> {
    return factory;
  };
}

/**
 * Creates a bound tool factory with automatic serialization for schema-based tools.
 * Perfect for tools that need complex type handling (BigInt, Decimal, etc.) and follow
 * a schema + implementation pattern.
 *
 * @example
 * const facilityTools = createBoundSerializedToolFactory<FacilityDeps>()(
 *   createFacilityTools,
 *   facilityToolsSchema
 * )
 */
export function createBoundSerializedToolFactory<TDeps>() {
  return function <TToolsInstance>(
    createToolsInstance: (deps: TDeps) => TToolsInstance,
    toolsSchema: Record<
      string,
      { description: string; parameters: z.AnyZodObject }
    >,
  ): BoundToolFactory<TDeps> {
    return (deps: TDeps) => {
      const toolsInstance = createToolsInstance(deps);
      return createSerializedTools(toolsInstance, toolsSchema);
    };
  };
}

/**
 * Creates a bound tool factory with both serialization and manifest support.
 * This is the preferred method for creating comprehensive tool factories that provide
 * LLM guidance and handle complex data types.
 *
 * @example
 * const facilityToolsWithManifest = createBoundToolFactoryWithManifest<FacilityDeps>()(
 *   createFacilityTools,
 *   facilityToolsSchema,
 *   facilityToolsManifest
 * )
 *
 * // Usage
 * const { factory, manifest } = facilityToolsWithManifest
 * const tools = factory(deps)
 * const promptGuidance = manifest.promptGuidance
 */
export function createBoundToolFactoryWithManifest<TDeps>() {
  return function <TToolsInstance>(
    createToolsInstance: (deps: TDeps) => TToolsInstance,
    toolsSchema: Record<
      string,
      { description: string; parameters: z.AnyZodObject }
    >,
    manifest: ToolManifest,
  ): BoundToolFactoryWithManifest<TDeps> {
    const factory = (deps: TDeps) => {
      const toolsInstance = createToolsInstance(deps);
      return createSerializedTools(toolsInstance, toolsSchema);
    };

    return {
      factory,
      manifest,
    };
  };
}
```
