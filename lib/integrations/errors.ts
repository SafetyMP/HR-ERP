/**
 * Stable classification for outbound HTTP / vendor failures — drives retry vs DLQ.
 */
export type ErrorClass = "retryable" | "fatal";

export class IntegrationError extends Error {
  readonly class: ErrorClass;
  readonly cause?: unknown;

  constructor(message: string, class_: ErrorClass, cause?: unknown) {
    super(message);
    this.name = "IntegrationError";
    this.class = class_;
    this.cause = cause;
  }
}

export class IntegrationHttpError extends IntegrationError {
  readonly statusCode: number;
  readonly retryAfterSec?: number;

  constructor(
    message: string,
    statusCode: number,
    class_: ErrorClass,
    retryAfterSec?: number,
    cause?: unknown,
  ) {
    super(message, class_, cause);
    this.name = "IntegrationHttpError";
    this.statusCode = statusCode;
    this.retryAfterSec = retryAfterSec;
  }
}

export function classifyHttpStatus(status: number): ErrorClass {
  if (status === 429) return "retryable";
  if (status >= 500) return "retryable";
  if (status >= 400) return "fatal";
  return "fatal";
}

export function integrationErrorClass(err: unknown): ErrorClass {
  if (err instanceof IntegrationError) return err.class;
  if (err instanceof TypeError && err.message.includes("fetch")) return "retryable";
  if (err instanceof DOMException && err.name === "AbortError") return "retryable";
  return "retryable";
}

export function isIntegrationFatal(err: unknown): boolean {
  return integrationErrorClass(err) === "fatal";
}
