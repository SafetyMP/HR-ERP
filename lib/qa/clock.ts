export type InstantMs = number;

export interface Clock {
  nowMs(): InstantMs;
}

export class SystemClock implements Clock {
  nowMs(): number {
    return Date.now();
  }
}

/** Deterministic clock for temporal anomalies — freeze or jump explicitly */
export class FakeClock implements Clock {
  constructor(private t: InstantMs) {}

  set(ms: InstantMs): void {
    this.t = ms;
  }

  advance(ms: number): void {
    this.t += ms;
  }

  nowMs(): number {
    return this.t;
  }
}
