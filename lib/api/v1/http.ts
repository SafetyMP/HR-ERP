import { API_VERSION } from "@/lib/backend/stack-manifest";
import { NextResponse } from "next/server";

import { toPublicError, type ApiErrorPayload } from "@/lib/api/v1/errors";
import type { AuthContext } from "@/lib/security/auth-context";
import { readCorrelationId } from "@/lib/security/correlation-id";
import { requireBearerAuth } from "@/lib/security/request-auth";

export type V1SuccessBody<T> = {
  apiVersion: typeof API_VERSION;
  data: T;
};

export function jsonV1<T>(
  data: T,
  correlationId: string,
  init?: ResponseInit,
): NextResponse<V1SuccessBody<T>> {
  const headers = new Headers(init?.headers);
  headers.set("x-correlation-id", correlationId);
  return NextResponse.json({ apiVersion: API_VERSION, data }, { ...init, headers });
}

export type V1ErrorBody = {
  apiVersion: typeof API_VERSION;
  error: ApiErrorPayload;
};

export function jsonV1Error(
  status: number,
  payload: ApiErrorPayload,
  correlationId: string,
): NextResponse<V1ErrorBody> {
  return NextResponse.json(
    { apiVersion: API_VERSION, error: payload },
    {
      status,
      headers: {
        "x-correlation-id": correlationId,
      },
    },
  );
}

export async function safeRoute<T>(
  correlationId: string,
  run: () => Promise<NextResponse<V1SuccessBody<T>>>,
): Promise<NextResponse<V1SuccessBody<T> | V1ErrorBody>> {
  try {
    return await run();
  } catch (err: unknown) {
    const { status, payload } = toPublicError(err);
    if (status >= 500) {
      console.error(
        JSON.stringify({
          scope: "api_v1",
          correlationId,
          code: payload.code,
        }),
      );
    }
    return jsonV1Error(status, payload, correlationId);
  }
}

/** Bearer auth + handler — keeps `ApiError` from auth inside `safeRoute` so clients always get JSON envelopes. */
export async function safeRouteAuth<T>(
  request: Request,
  run: (auth: AuthContext) => Promise<NextResponse<V1SuccessBody<T>>>,
): Promise<NextResponse<V1SuccessBody<T> | V1ErrorBody>> {
  const correlationId = readCorrelationId(request);
  return safeRoute(correlationId, async () => {
    const auth = await requireBearerAuth(request);
    return run(auth);
  });
}
