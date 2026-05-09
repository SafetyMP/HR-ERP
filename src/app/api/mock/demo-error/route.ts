import { NextResponse } from "next/server";

type Body = {
  scenario?: string;
};

export async function POST(request: Request) {
  let body: Body = {};
  try {
    body = (await request.json()) as Body;
  } catch {
    body = {};
  }

  if (body.scenario === "pto") {
    return NextResponse.json(
      { code: "PTO_BALANCE_EXCEEDED", detail: "PTO balance exceeded for requested window." },
      { status: 400, headers: { "x-request-id": "demo-pto-001" } },
    );
  }

  return NextResponse.json({ code: "INVALID_DATE_RANGE", detail: "Start must be before end." }, { status: 400 });
}
