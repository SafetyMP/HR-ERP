import { describe, expect, it } from "vitest";

import {
  dispatchToConnectors,
  eventTypeMatches,
  type ConnectorAdapter,
  type ConnectorEvent,
} from "@/lib/connectors/sdk";

describe("eventTypeMatches", () => {
  it("matches exact event types", () => {
    expect(
      eventTypeMatches("domain.payroll.payroll.pay_run.computed", [
        "domain.payroll.payroll.pay_run.computed",
      ]),
    ).toBe(true);
  });

  it("supports wildcard patterns ending in .*", () => {
    expect(
      eventTypeMatches("domain.recruiting.application.created", [
        "domain.recruiting.*",
      ]),
    ).toBe(true);
    expect(
      eventTypeMatches("domain.payroll.payroll.pay_run.computed", [
        "domain.recruiting.*",
      ]),
    ).toBe(false);
  });
});

describe("dispatchToConnectors", () => {
  const event: ConnectorEvent<{ requisitionId: string }> = {
    tenantId: "tenant-1",
    eventType: "domain.recruiting.application.created",
    category: "recruiting",
    correlationId: "abc",
    payload: { requisitionId: "req-1" },
    occurredAt: new Date(),
  };

  it("invokes matching adapters and skips non-matching ones", async () => {
    const calls: string[] = [];
    const matching: ConnectorAdapter<{ requisitionId: string }, string> = {
      id: "match",
      eventTypes: ["domain.recruiting.*"],
      transform: () => "ok",
      emit: async () => {
        calls.push("match");
      },
    };
    const skipping: ConnectorAdapter<{ requisitionId: string }, string> = {
      id: "skip",
      eventTypes: ["domain.payroll.*"],
      transform: () => "no",
      emit: async () => {
        calls.push("skip");
      },
    };
    const result = await dispatchToConnectors(event, [matching, skipping]);
    expect(result.delivered).toEqual(["match"]);
    expect(result.failed).toEqual([]);
    expect(calls).toEqual(["match"]);
  });

  it("collects per-adapter failures without aborting the dispatch", async () => {
    const ok: ConnectorAdapter<{ requisitionId: string }, string> = {
      id: "ok",
      eventTypes: ["domain.recruiting.*"],
      transform: () => "ok",
      emit: async () => undefined,
    };
    const broken: ConnectorAdapter<{ requisitionId: string }, string> = {
      id: "broken",
      eventTypes: ["domain.recruiting.*"],
      transform: () => "ok",
      emit: async () => {
        throw new Error("boom");
      },
    };
    const result = await dispatchToConnectors(event, [ok, broken]);
    expect(result.delivered).toEqual(["ok"]);
    expect(result.failed).toEqual([{ id: "broken", error: "boom" }]);
  });

  it("treats null transform as 'skip this event'", async () => {
    const adapter: ConnectorAdapter<{ requisitionId: string }, string> = {
      id: "filter",
      eventTypes: ["domain.recruiting.*"],
      transform: () => null,
      emit: async () => {
        throw new Error("should not be called");
      },
    };
    const result = await dispatchToConnectors(event, [adapter]);
    expect(result.delivered).toEqual([]);
    expect(result.failed).toEqual([]);
  });
});
