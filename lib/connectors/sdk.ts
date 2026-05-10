/**
 * HR ERP Connector SDK (Phase 2 scaffold).
 *
 * Each connector implements the `ConnectorAdapter` interface. The orchestrator
 * pipes domain events from `enqueueEvent` (see lib/outbox/enqueue-event.ts)
 * through `transform` and either:
 *   - performs an outbound action via `emit` (push connectors: Slack, Workspace,
 *     GL post, DocuSign), or
 *   - schedules a webhook delivery via `lib/webhooks/scheduler.ts` (pull
 *     connectors: Greenhouse-style).
 *
 * Reference connectors for the milestone live in `lib/connectors/refs/`.
 * Real network I/O is intentionally out of scope here — the SDK normalizes the
 * shape so each connector can be implemented and tested independently.
 */

export type ConnectorEventCategory =
  | "core_hr"
  | "payroll"
  | "benefits"
  | "recruiting"
  | "performance"
  | "compensation"
  | "compliance"
  | "audit";

export interface ConnectorEvent<TPayload = unknown> {
  /** Tenant the event is scoped to. */
  tenantId: string;
  /** Event type as emitted by `enqueueEvent`. */
  eventType: string;
  /** Domain category. */
  category: ConnectorEventCategory;
  /** Correlation id for cross-system tracing. */
  correlationId?: string | null;
  /** Domain-specific payload — never raw PII without redaction. */
  payload: TPayload;
  /** Wallclock for the source row. */
  occurredAt: Date;
}

export interface ConnectorAdapter<TInput = unknown, TOutput = unknown> {
  /** Stable identifier — e.g. `slack-notify`, `gl-post`, `docusign-offer`. */
  readonly id: string;
  /** Event types this adapter wants to receive (prefix match supported). */
  readonly eventTypes: ReadonlyArray<string>;
  /** Pure transform that returns the outbound payload (or null to skip). */
  transform(event: ConnectorEvent<TInput>): TOutput | null;
  /**
   * Side-effect emitter. Implementations should be idempotent on the
   * (eventType, correlationId) tuple — the runtime may retry.
   */
  emit(event: ConnectorEvent<TInput>, output: TOutput): Promise<void>;
}

/** Returns true if `eventType` matches any of the patterns ('foo.*' supported). */
export function eventTypeMatches(
  eventType: string,
  patterns: ReadonlyArray<string>,
): boolean {
  for (const pattern of patterns) {
    if (pattern === eventType) return true;
    if (pattern.endsWith(".*") && eventType.startsWith(pattern.slice(0, -1))) {
      return true;
    }
  }
  return false;
}

/**
 * Minimal in-process driver — fans an event out to every adapter whose
 * `eventTypes` matches. Production deployments should run this from a queue
 * worker that pulls from `IntegrationOutbox` rows enqueued via
 * `enqueueEvent`. Errors are caught per-adapter so a single failure does not
 * block the rest.
 */
export async function dispatchToConnectors<TInput>(
  event: ConnectorEvent<TInput>,
  adapters: ReadonlyArray<ConnectorAdapter<TInput, unknown>>,
): Promise<{ delivered: string[]; failed: { id: string; error: string }[] }> {
  const delivered: string[] = [];
  const failed: { id: string; error: string }[] = [];
  for (const adapter of adapters) {
    if (!eventTypeMatches(event.eventType, adapter.eventTypes)) continue;
    try {
      const output = adapter.transform(event);
      if (output === null) continue;
      await adapter.emit(event, output);
      delivered.push(adapter.id);
    } catch (err) {
      failed.push({
        id: adapter.id,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }
  return { delivered, failed };
}
