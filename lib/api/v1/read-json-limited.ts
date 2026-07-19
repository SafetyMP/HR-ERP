import type { ZodType } from "zod";

import { ApiError } from "@/lib/api/v1/errors";

/** Core HR write body limit (R-009): reject before full parse when over 16 KiB. */
export const CORE_HR_MAX_BODY_BYTES = 16_384;

export async function readJsonBytesLimited(
  request: Request,
  maxBytes: number = CORE_HR_MAX_BODY_BYTES,
): Promise<unknown> {
  const contentLength = request.headers.get("content-length");
  if (contentLength !== null) {
    const declared = Number(contentLength);
    if (Number.isFinite(declared) && declared > maxBytes) {
      throw new ApiError(413, {
        code: "payload_too_large",
        message: "body_too_large",
      });
    }
  }

  const buf = await request.arrayBuffer();
  if (buf.byteLength > maxBytes) {
    throw new ApiError(413, {
      code: "payload_too_large",
      message: "body_too_large",
    });
  }

  if (buf.byteLength === 0) {
    return {};
  }

  const text = new TextDecoder("utf-8").decode(buf);
  try {
    return JSON.parse(text) as unknown;
  } catch {
    throw new ApiError(400, {
      code: "bad_request",
      message: "invalid_json",
    });
  }
}

export async function parseJsonBodyLimited<T>(
  request: Request,
  schema: ZodType<T>,
  maxBytes: number = CORE_HR_MAX_BODY_BYTES,
): Promise<T> {
  const raw = await readJsonBytesLimited(request, maxBytes);
  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    throw parsed.error;
  }
  return parsed.data;
}
