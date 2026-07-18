import { describe, expect, it, vi, beforeEach } from "vitest";

import {
  enqueueEvent,
  type DomainEventCategory,
} from "@/lib/outbox/enqueue-event";
import {
  resetInprocBusForTests,
  subscribeInprocBus,
} from "@/lib/outbox/inproc-bus";

function fakeTx() {
  const created: unknown[] = [];
  return {
    created,
    integrationOutbox: {
      findFirst: vi.fn().mockResolvedValue(null),
      create: vi.fn().mockImplementation(async ({ data }: { data: unknown }) => {
        created.push({ table: "integrationOutbox", data });
        return { id: "outbox-1" };
      }),
    },
    domainOutbox: {
      create: vi.fn().mockImplementation(async ({ data }: { data: unknown }) => {
        created.push({ table: "domainOutbox", data });
        return { id: "domain-1" };
      }),
    },
  };
}

describe("enqueueEvent", () => {
  beforeEach(() => {
    resetInprocBusForTests();
    delete process.env.USE_DOMAIN_OUTBOX;
    delete process.env.KAFKA_BROKERS;
    process.env.WEBHOOK_FANOUT_ON_ENQUEUE = "0";
  });

  it("writes integration outbox and publishes inproc bus", async () => {
    const seen: string[] = [];
    subscribeInprocBus("domain.payroll", (e) => {
      seen.push(e.eventType);
    });

    const tx = fakeTx();
    const result = await enqueueEvent(tx as never, {
      tenantId: "t1",
      category: "domain.payroll" satisfies DomainEventCategory,
      eventType: "payroll.pay_run.computed",
      payload: { ok: true },
      dedupeKey: "k1",
    });

    expect(result.outboxId).toBe("outbox-1");
    expect(tx.integrationOutbox.create).toHaveBeenCalledOnce();
    expect(tx.domainOutbox.create).not.toHaveBeenCalled();
    expect(seen).toEqual(["payroll.pay_run.computed"]);
  });

  it("also writes domain_outbox when USE_DOMAIN_OUTBOX=1", async () => {
    process.env.USE_DOMAIN_OUTBOX = "1";
    const tx = fakeTx();
    await enqueueEvent(tx as never, {
      tenantId: "t1",
      category: "domain.payroll",
      eventType: "payroll.pay_run.computed",
      payload: { ok: true },
    });
    expect(tx.domainOutbox.create).toHaveBeenCalledOnce();
  });

  it("does not dual-write from KAFKA_BROKERS alone", async () => {
    process.env.KAFKA_BROKERS = "localhost:9092";
    const tx = fakeTx();
    await enqueueEvent(tx as never, {
      tenantId: "t1",
      category: "domain.payroll",
      eventType: "payroll.pay_run.computed",
      payload: { ok: true },
    });
    expect(tx.domainOutbox.create).not.toHaveBeenCalled();
  });

  it("dedupes within window when payload key matches", async () => {
    const tx = fakeTx();
    tx.integrationOutbox.findFirst = vi.fn().mockResolvedValue({
      id: "existing",
      payload: { dedupeKey: "same" },
    });
    const result = await enqueueEvent(tx as never, {
      tenantId: "t1",
      category: "domain.payroll",
      eventType: "payroll.pay_run.computed",
      payload: { ok: true },
      dedupeKey: "same",
    });
    expect(result.outboxId).toBe("existing");
    expect(tx.integrationOutbox.create).not.toHaveBeenCalled();
  });
});
