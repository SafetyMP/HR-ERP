import { NextResponse } from "next/server";

type FieldSpec = {
  id: string;
  label: string;
  inputType: "text" | "number";
  description?: string;
};

const EXTRA_FIELDS: Record<string, FieldSpec[]> = {
  CA: [
    {
      id: "caWithholdingAllowance",
      label: "California withholding allowance total (DE-4)",
      inputType: "number",
      description:
        "Values come from employee elections on Form DE-4. This portal stores what your payroll provider needs — it does not compute withholding.",
    },
    {
      id: "caDisabilityElectionNote",
      label: "SDI / Disability insurance notes",
      inputType: "text",
      description:
        "Capture any statutory disability election acknowledgments communicated by Payroll (informational placeholder).",
    },
  ],
  NY: [
    {
      id: "nyResidencyCertification",
      label: "Residency certification (example)",
      inputType: "text",
      description: "Demonstrates another jurisdiction reacting instantly without client-side payroll math.",
    },
  ],
};

export function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const subdivision = searchParams.get("subdivision") ?? "";
  const extraFields = EXTRA_FIELDS[subdivision] ?? [];

  return NextResponse.json({
    subdivision,
    extraFields,
  });
}
