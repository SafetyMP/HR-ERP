import { describe, expect, it } from "vitest";

import { ApiError } from "@/lib/api/v1/errors";
import {
  CORE_HR_MAX_BODY_BYTES,
  readJsonBytesLimited,
} from "@/lib/api/v1/read-json-limited";

describe("readJsonBytesLimited", () => {
  it("rejects bodies over 16 KiB via content-length", async () => {
    const body = "x".repeat(CORE_HR_MAX_BODY_BYTES + 1);
    const req = new Request("http://local/test", {
      method: "POST",
      headers: { "content-length": String(body.length) },
      body,
    });
    await expect(readJsonBytesLimited(req)).rejects.toBeInstanceOf(ApiError);
  });

  it("parses small JSON objects", async () => {
    const req = new Request("http://local/test", {
      method: "POST",
      body: JSON.stringify({ name: "ok" }),
    });
    await expect(readJsonBytesLimited(req)).resolves.toEqual({ name: "ok" });
  });
});
