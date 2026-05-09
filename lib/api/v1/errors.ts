import { AuthorizationError } from "@/lib/security/policy-engine";
import { ZodError } from "zod";

/** Avoid importing Prisma in modules used by Edge (e.g. middleware); Prisma ships Node-only globals. */
function isPrismaClientKnownRequestError(err: unknown): err is { code: string } {
  return (
    typeof err === "object" &&
    err !== null &&
    "constructor" in err &&
    typeof (err as { constructor?: { name?: unknown } }).constructor?.name === "string" &&
    (err as { constructor: { name: string } }).constructor.name === "PrismaClientKnownRequestError" &&
    "code" in err &&
    typeof (err as { code: unknown }).code === "string"
  );
}

export type ApiErrorPayload = {
  code: string;
  message: string;
  details?: unknown;
};

export class ApiError extends Error {
  readonly status: number;
  readonly payload: ApiErrorPayload;

  constructor(status: number, payload: ApiErrorPayload) {
    super(payload.message);
    this.name = "ApiError";
    this.status = status;
    this.payload = payload;
  }
}

/** Maps infrastructure failures to a safe client-facing envelope (no stack / DB internals). */
export function toPublicError(err: unknown): { status: number; payload: ApiErrorPayload } {
  if (err instanceof ApiError) {
    return { status: err.status, payload: err.payload };
  }

  if (err instanceof AuthorizationError) {
    return {
      status: 403,
      payload: { code: "forbidden", message: err.message },
    };
  }

  if (err instanceof ZodError) {
    return {
      status: 400,
      payload: {
        code: "validation_error",
        message: "validation_failed",
        details: err.flatten(),
      },
    };
  }

  if (isPrismaClientKnownRequestError(err)) {
    switch (err.code) {
      case "P2002":
        return {
          status: 409,
          payload: { code: "conflict", message: "unique_constraint" },
        };
      case "P2025":
        return {
          status: 404,
          payload: { code: "not_found", message: "record_not_found" },
        };
      default:
        break;
    }
  }

  return {
    status: 500,
    payload: { code: "internal_error", message: "unexpected_error" },
  };
}
