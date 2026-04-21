```typescript

// ── New generic parameters ──────────────────────────────────────────────────
//
//  TContext  — episodic memory: what the agent has seen, decided, and enriched
//              over the course of a workflow session. Serializable to Postgres.
//
//  TState    — finite state: the agent's current "lifecycle position".
//              Constrained to a string-union you declare per subclass.
//
// ── Updated signature ───────────────────────────────────────────────────────
//   BaseAgent<TDeps, TInput, TOutput, TContext extends object = Record<string,unknown>, TState extends string = string>
//
// ── Key design choices ──────────────────────────────────────────────────────
//   1. TContext has a default so existing agents don't need to change their
//      signature — they just won't be context-aware until they opt in.
//
//   2. TState has a default of `string` for the same reason. Subclasses that
//      want strict FSM enforcement narrow it:
//        TState = 'idle' | 'analysing' | 'alerting' | 'complete'
//
//   3. execute() now accepts an optional incoming context so agents can resume
//      a prior session rather than starting cold.
//
//   4. AgentHandoff is extended to carry `context` and `agentState` so the
//      orchestrator or next agent can thread them forward without any
//      out-of-band storage.

export abstract class BaseAgent
  TDeps,
  TInput,
  TOutput,
  TContext extends object = Record<string, unknown>,
  TState extends string = string,
> {
  protected readonly deps: TDeps
  protected readonly traces: StepTrace[] = []
  protected readonly errors: Error[] = []
  protected readonly log: ReturnType<typeof getLogger>
  private slackHandler?: SlackStepTraceHandler
  private slackUser?: string

  // ── Episodic context ───────────────────────────────────────────────────────
  // Starts empty; subclasses call updateContext() to accumulate observations.
  // The final state is emitted in the handoff so it can be persisted or forwarded.
  protected context: TContext

  // ── FSM layer ─────────────────────────────────────────────────────────────
  // Subclasses declare initialState and optionally override validTransitions.
  protected currentState: TState
  abstract readonly initialState: TState

  // Override in subclasses to enforce valid transitions.
  // Returning false causes transition() to throw, preventing illegal state moves.
  protected validTransitions?: Partial<Record<TState, TState[]>>

  // Optional lifecycle hooks — called synchronously inside transition()
  protected onEnterState?(state: TState, prev: TState): void
  protected onExitState?(state: TState, next: TState): void

  abstract readonly agentId: string

  constructor(deps: TDeps, initialContext?: TContext) {
    this.deps = deps
    this.log = getLogger('base-agent', 'info')
    // Subclasses that don't use TContext get a trivial empty object at no cost.
    this.context = (initialContext ?? {}) as TContext
    // currentState is a placeholder until the constructor runs after the
    // subclass field initializer sets initialState. We cast to satisfy TS.
    this.currentState = undefined as unknown as TState
  }

  // Called by the runtime after construction so initialState is available.
  // Alternatively, use a factory pattern if you prefer not to call this manually.
  protected init() {
    this.currentState = this.initialState
  }

  // ── Context API ────────────────────────────────────────────────────────────
  /**
   * Merges a partial update into the current episodic context.
   * Call this whenever the agent learns something worth persisting.
   *
   * @example
   * this.updateContext({ riskLevel: 'HIGH', lastCheckedAt: new Date() })
   */
  protected updateContext(patch: Partial<TContext>): void {
    this.context = { ...this.context, ...patch }
  }

  /**
   * Replaces the entire context (e.g. when resuming from a persisted session).
   */
  protected restoreContext(ctx: TContext): void {
    this.context = ctx
  }

  // ── FSM API ────────────────────────────────────────────────────────────────

  /**
   * Transitions to a new state, enforcing the validTransitions table if defined.
   * Calls onExitState and onEnterState hooks.
   *
   * @throws if the transition is not listed in validTransitions
   *
   * @example
   * this.transition('analysing')
   * this.transition('alerting')
   */
  protected transition(next: TState): void {
    if (this.validTransitions) {
      const allowed = this.validTransitions[this.currentState] ?? []
      if (!allowed.includes(next)) {
        throw new Error(
          `[${this.agentId}] Invalid transition: ${this.currentState} → ${next}. ` +
          `Allowed: ${allowed.join(', ') || 'none'}`,
        )
      }
    }
    this.log.debug(`[${this.agentId}] State transition: ${this.currentState} → ${next}`)
    this.onExitState?.(this.currentState, next)
    const prev = this.currentState
    this.currentState = next
    this.onEnterState?.(next, prev)
  }

  // ── Abstract execute ───────────────────────────────────────────────────────

  /**
   * Execute the agent. Optionally receives an incoming context to resume from.
   * The returned handoff carries the enriched context for forwarding.
   */
  abstract execute(input: TInput, ctx?: TContext): Promise<AgentHandoff<TOutput, TContext>>

  // ── Existing step-trace helpers (unchanged) ────────────────────────────────
  withSlackNotifications(handler: SlackStepTraceHandler, user?: string): this {
    this.slackHandler = handler
    this.slackUser = user
    return this
  }

  /**
   * Creates the starting step trace
  */
  protected startStep(stepName: string, input: unknown, metadata?: Record<string, unknown>): StepTrace {
    const trace = createStepTrace(this.agentId, stepName, input, metadata)
    this.log.debug(`[${this.agentId}] Starting step: ${stepName}`, { traceId: trace.id })
    return trace
  }

  /**
   * Completes the step trace object and pushes to traces array.
   * Complete the step trace meta data
   * Push to trace array
   * Log Step Trace
  */
  protected finishStep(trace: StepTrace, output: unknown): StepTrace {
    const completed = completeStepTrace(trace, output, 'complete')
    this.traces.push(completed)
    logStepTrace(completed)
    this.slackHandler?.handle(completed, this.slackUser).catch((err: unknown) => {
      this.log.error(`[${this.agentId}] Slack notification dispatch failed`, {
        error: err instanceof Error ? err.message : String(err),
      })
    })
    return completed
  }

  /**
   * Fires when steps fail. Same protocol as finish step
   * Complete the step trace meta data
   * Push to trace array
   * Log Step Trace
   *
  */
  protected failStep(trace: StepTrace, error: unknown): StepTrace {
    const errorMessage = error instanceof Error ? error.message : String(error)
    const failed = completeStepTrace(trace, { error: errorMessage }, 'error')
    this.traces.push(failed)
    logStepTrace(failed)
    if (error instanceof Error) this.errors.push(error)
    this.slackHandler?.handle(failed, this.slackUser).catch((err: unknown) => {
      this.log.error(`[${this.agentId}] Slack notification dispatch failed`, {
        error: err instanceof Error ? err.message : String(err),
      })
    })
    return failed
  }

  protected createOnStepFinish(stepPrefix: string) {
    return ({ text, toolCalls, usage }: { text: string; toolCalls: Array<{ toolName?: string }>; usage: unknown }) => {
      const safeToolCalls = toolCalls.map((tc) => ({ toolName: tc.toolName }))
      const trace = createStepTrace(this.agentId, `${stepPrefix}:step`, { toolCalls: safeToolCalls, usage })
      const completed = completeStepTrace(trace, { text: text.slice(0, 200) })
      this.traces.push(completed)
      this.log.debug(`[${this.agentId}] LLM step finished`, { toolCallCount: toolCalls.length, traceId: completed.id })
    }
  }

  // ── Handoff builders — now carry context and state ─────────────────────────
  protected succeed(output: TOutput, metadata?: Record<string, unknown>): AgentHandoff<TOutput, TContext> {
    return createSuccessHandoff(output, [...this.traces], {
      ...metadata,
      context: this.context,
      agentState: this.currentState,
    })
  }

  protected fail(output: TOutput, errors?: Error[], metadata?: Record<string, unknown>): AgentHandoff<TOutput, TContext> {
    const allErrors = [...this.errors, ...(errors ?? [])]
    return createFailureHandoff(output, [...this.traces], allErrors, {
      ...metadata,
      context: this.context,
      agentState: this.currentState,
    })
  }
}

```
