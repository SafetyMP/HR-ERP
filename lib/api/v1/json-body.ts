import { ApiError } from "@/lib/api/v1/errors";
import type { ZodType } from "zod";

export async function parseJsonBody<T>(request: Request, schema: ZodType<T>): Promise<T> {
  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    throw new ApiError(400, {
      code: "bad_request",
      message: "invalid_json",
    });
  }

  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    throw parsed.error;
  }
  return parsed.data;
}
