import { NextResponse } from "next/server";

import { ApiError } from "@/lib/api/v1/errors";
import { prisma } from "@/lib/prisma";
import { requireScimBinding } from "@/lib/scim/auth";
import {
  employeeToScim,
  parseScimUser,
  scimError,
} from "@/lib/scim/user-mapping";

const SCIM_CONTENT_TYPE = "application/scim+json";

function baseUrlOf(request: Request): string {
  const u = new URL(request.url);
  return `${u.protocol}//${u.host}`;
}

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const binding = requireScimBinding(request);
    const { id } = await context.params;
    const employee = await prisma.employee.findFirst({
      where: { id, tenantId: binding.tenantId },
    });
    if (!employee) {
      return NextResponse.json(scimError(404, "user_not_found"), {
        status: 404,
        headers: { "content-type": SCIM_CONTENT_TYPE },
      });
    }
    return NextResponse.json(employeeToScim(employee, baseUrlOf(request)), {
      status: 200,
      headers: { "content-type": SCIM_CONTENT_TYPE },
    });
  } catch (err) {
    return scimErrorResponse(err);
  }
}

export async function PUT(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const binding = requireScimBinding(request);
    const { id } = await context.params;
    const body = await request.json().catch(() => null);
    const parsed = parseScimUser(body);

    const existing = await prisma.employee.findFirst({
      where: { id, tenantId: binding.tenantId },
      select: { id: true },
    });
    if (!existing) {
      return NextResponse.json(scimError(404, "user_not_found"), {
        status: 404,
        headers: { "content-type": SCIM_CONTENT_TYPE },
      });
    }

    const updated = await prisma.employee.update({
      where: { id },
      data: {
        email: parsed.email,
        firstName: parsed.firstName,
        lastName: parsed.lastName,
        status: parsed.active ? "ACTIVE" : "TERMINATED",
      },
    });
    return NextResponse.json(employeeToScim(updated, baseUrlOf(request)), {
      status: 200,
      headers: { "content-type": SCIM_CONTENT_TYPE },
    });
  } catch (err) {
    return scimErrorResponse(err);
  }
}

interface ScimPatchOp {
  op?: string;
  path?: string;
  value?: unknown;
}

interface ScimPatchBody {
  schemas?: string[];
  Operations?: ScimPatchOp[];
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const binding = requireScimBinding(request);
    const { id } = await context.params;
    const body = (await request.json().catch(() => null)) as ScimPatchBody | null;

    const existing = await prisma.employee.findFirst({
      where: { id, tenantId: binding.tenantId },
    });
    if (!existing) {
      return NextResponse.json(scimError(404, "user_not_found"), {
        status: 404,
        headers: { "content-type": SCIM_CONTENT_TYPE },
      });
    }

    const data: Record<string, unknown> = {};
    for (const op of body?.Operations ?? []) {
      const path = op.path?.toLowerCase();
      if ((op.op ?? "").toLowerCase() === "replace") {
        if (path === "active" && typeof op.value === "boolean") {
          data.status = op.value ? "ACTIVE" : "TERMINATED";
        } else if (path === "username" && typeof op.value === "string") {
          data.email = op.value;
        } else if (
          path === "name.givenname" &&
          typeof op.value === "string"
        ) {
          data.firstName = op.value;
        } else if (
          path === "name.familyname" &&
          typeof op.value === "string"
        ) {
          data.lastName = op.value;
        }
      }
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json(employeeToScim(existing, baseUrlOf(request)), {
        status: 200,
        headers: { "content-type": SCIM_CONTENT_TYPE },
      });
    }

    const updated = await prisma.employee.update({ where: { id }, data });
    return NextResponse.json(employeeToScim(updated, baseUrlOf(request)), {
      status: 200,
      headers: { "content-type": SCIM_CONTENT_TYPE },
    });
  } catch (err) {
    return scimErrorResponse(err);
  }
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const binding = requireScimBinding(request);
    const { id } = await context.params;

    const existing = await prisma.employee.findFirst({
      where: { id, tenantId: binding.tenantId },
      select: { id: true },
    });
    if (!existing) {
      return NextResponse.json(scimError(404, "user_not_found"), {
        status: 404,
        headers: { "content-type": SCIM_CONTENT_TYPE },
      });
    }

    await prisma.employee.update({
      where: { id },
      data: { status: "TERMINATED", terminationDate: new Date() },
    });
    return new NextResponse(null, { status: 204 });
  } catch (err) {
    return scimErrorResponse(err);
  }
}

function scimErrorResponse(err: unknown): NextResponse {
  if (err instanceof ApiError) {
    return NextResponse.json(scimError(err.status, err.payload.message), {
      status: err.status,
      headers: { "content-type": SCIM_CONTENT_TYPE },
    });
  }
  return NextResponse.json(scimError(500, "internal_error"), {
    status: 500,
    headers: { "content-type": SCIM_CONTENT_TYPE },
  });
}
