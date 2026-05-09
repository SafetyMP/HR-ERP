type State = "closed" | "open" | "half_open";

export type CircuitBreakerOptions = {
  /** Consecutive failures before opening. */
  failureThreshold: number;
  /** Time in ms spent open before half-open probe. */
  resetTimeoutMs: number;
};

/**
 * Minimal per-key circuit breaker (no external deps). Tracks state in-process.
 */
export class CircuitBreaker {
  private state: State = "closed";
  private failures = 0;
  private successes = 0;
  private nextAttempt = 0;

  constructor(private readonly options: CircuitBreakerOptions) {}

  async exec<T>(fn: () => Promise<T>): Promise<T> {
    const now = Date.now();
    if (this.state === "open") {
      if (now < this.nextAttempt) {
        throw new Error("Circuit breaker open");
      }
      this.state = "half_open";
      this.successes = 0;
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (e) {
      this.onFailure();
      throw e;
    }
  }

  snapshot(): { state: State; failures: number } {
    return { state: this.state, failures: this.failures };
  }

  private onSuccess(): void {
    if (this.state === "half_open") {
      this.successes += 1;
      if (this.successes >= 1) {
        this.state = "closed";
        this.failures = 0;
      }
      return;
    }
    this.failures = 0;
  }

  private onFailure(): void {
    this.failures += 1;
    if (this.state === "half_open") {
      this.state = "open";
      this.nextAttempt = Date.now() + this.options.resetTimeoutMs;
      return;
    }
    if (this.failures >= this.options.failureThreshold) {
      this.state = "open";
      this.nextAttempt = Date.now() + this.options.resetTimeoutMs;
    }
  }
}

const breakers = new Map<string, CircuitBreaker>();

export function getVendorCircuitBreaker(vendorKey: string): CircuitBreaker {
  let b = breakers.get(vendorKey);
  if (!b) {
    b = new CircuitBreaker({ failureThreshold: 5, resetTimeoutMs: 30_000 });
    breakers.set(vendorKey, b);
  }
  return b;
}
