import { NextResponse } from "next/server";

import { ApiError } from "@/lib/api/v1/errors";
import { prisma } from "@/lib/prisma";
import { guardScimRequest } from "@/lib/scim/scim-request-guard";
import {
  createScimUser,
  listScimUsers,
  ScimUserAlreadyExistsError,
} from "@/lib/scim/users-service";
import {
  employeeToScim,
  parseScimUser,
  scimError,
  scimListResponse,
} from "@/lib/scim/user-mapping";

const SCIM_CONTENT_TYPE = "application/scim+json";

function baseUrlOf(request: Request): string {
  const u = new URL(request.url);
  return `${u.protocol}//${u.host}`;
}

function parseFilterUserNameEq(filter: string | null): string | null {
  if (!filter) return null;
  const match = filter.match(/^userName eq ['"]([^'"]+)['"]$/i);
  return match ? match[1]! : null;
}

export async function GET(request: Request) {
  try {
    const { binding, rateLimitHeaders } = await guardScimRequest(request);
    const url = new URL(request.url);
    const startIndex = Math.max(1, Number(url.searchParams.get("startIndex") ?? "1") || 1);
    const count = Math.min(200, Math.max(0, Number(url.searchParams.get("count") ?? "100") || 100));
    const userNameFilter = parseFilterUserNameEq(url.searchParams.get("filter"));

    const { total, employees } = await listScimUsers(prisma, binding, {
      startIndex,
      count,
      userNameFilter,
    });

    const baseUrl = baseUrlOf(request);
    const body = scimListResponse(
      employees.map((e) => employeeToScim(e, baseUrl)),
      total,
      startIndex,
      count,
    );

    return NextResponse.json(body, {
      status: 200,
      headers: { "content-type": SCIM_CONTENT_TYPE, ...rateLimitHeaders },
    });
  } catch (err) {
    return scimErrorResponse(err);
  }
}

export async function POST(request: Request) {
  try {
    const { binding, rateLimitHeaders } = await guardScimRequest(request);
    const json = await request.json().catch(() => null);
    const parsed = parseScimUser(json);

    const created = await createScimUser(prisma, binding, parsed);

    const baseUrl = baseUrlOf(request);
    return NextResponse.json(employeeToScim(created, baseUrl), {
      status: 201,
      headers: {
        "content-type": SCIM_CONTENT_TYPE,
        location: `${baseUrl}/api/scim/v2/Users/${created.id}`,
        ...rateLimitHeaders,
      },
    });
  } catch (err) {
    if (err instanceof ScimUserAlreadyExistsError) {
      return NextResponse.json(scimError(409, "user_already_exists", "uniqueness"), {
        status: 409,
        headers: { "content-type": SCIM_CONTENT_TYPE },
      });
    }
    return scimErrorResponse(err);
  }
}

function scimErrorResponse(err: unknown): NextResponse {
  if (err instanceof ApiError) {
    const headers: Record<string, string> = { "content-type": SCIM_CONTENT_TYPE };
    const details = err.payload.details as { retryAfterSec?: number } | undefined;
    if (typeof details?.retryAfterSec === "number") {
      headers["Retry-After"] = String(details.retryAfterSec);
    }
    return NextResponse.json(scimError(err.status, err.payload.message), {
      status: err.status,
      headers,
    });
  }
  if (err instanceof Error && err.message === "userName_required") {
    return NextResponse.json(scimError(400, "userName_required", "invalidValue"), {
      status: 400,
      headers: { "content-type": SCIM_CONTENT_TYPE },
    });
  }
  return NextResponse.json(scimError(500, "internal_error"), {
    status: 500,
    headers: { "content-type": SCIM_CONTENT_TYPE },
  });
}
