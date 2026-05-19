import { getNeonAuth } from "@/lib/auth/neon-auth-server";
import { neonAuthConfigured } from "@/lib/auth/neon-auth-config";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ path: string[] }> };

async function notConfigured() {
  return Response.json({ error: "neon_auth_not_configured" }, { status: 501 });
}

export async function GET(request: Request, context: RouteContext) {
  if (!neonAuthConfigured()) return notConfigured();
  const { GET } = getNeonAuth().handler();
  return GET(request, { params: context.params });
}

export async function POST(request: Request, context: RouteContext) {
  if (!neonAuthConfigured()) return notConfigured();
  const { POST } = getNeonAuth().handler();
  return POST(request, { params: context.params });
}

export async function PUT(request: Request, context: RouteContext) {
  if (!neonAuthConfigured()) return notConfigured();
  const { PUT } = getNeonAuth().handler();
  return PUT(request, { params: context.params });
}

export async function PATCH(request: Request, context: RouteContext) {
  if (!neonAuthConfigured()) return notConfigured();
  const { PATCH } = getNeonAuth().handler();
  return PATCH(request, { params: context.params });
}

export async function DELETE(request: Request, context: RouteContext) {
  if (!neonAuthConfigured()) return notConfigured();
  const { DELETE } = getNeonAuth().handler();
  return DELETE(request, { params: context.params });
}
