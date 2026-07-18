import type { DomainEventCategory } from "@/lib/outbox/enqueue-event";

export type InprocBusEvent = {
  tenantId: string | null;
  category: DomainEventCategory;
  eventType: string;
  payload: unknown;
  correlationId: string;
  outboxId: string;
};

type Handler = (event: InprocBusEvent) => void | Promise<void>;

const handlers = new Map<string, Set<Handler>>();

function keyFor(category: DomainEventCategory, eventType?: string): string {
  return eventType ? `${category}:${eventType}` : category;
}

/** Register an in-process consumer (Phase-1 bridge before Kafka). */
export function subscribeInprocBus(
  category: DomainEventCategory,
  handler: Handler,
  eventType?: string,
): () => void {
  const key = keyFor(category, eventType);
  let set = handlers.get(key);
  if (!set) {
    set = new Set();
    handlers.set(key, set);
  }
  set.add(handler);
  return () => {
    set?.delete(handler);
  };
}

export async function publishInprocBus(event: InprocBusEvent): Promise<void> {
  const exact = handlers.get(keyFor(event.category, event.eventType));
  const categoryWide = handlers.get(keyFor(event.category));
  const all = [...(exact ?? []), ...(categoryWide ?? [])];
  for (const handler of all) {
    await handler(event);
  }
}

/** Test helper */
export function resetInprocBusForTests(): void {
  handlers.clear();
}
