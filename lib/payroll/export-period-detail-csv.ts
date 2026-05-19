export type PeriodExportRow = {
  employeeName: string;
  employeeId: string;
  lineType: string;
  amountMinor: number;
  currencyCode: string;
  inputsFingerprintSha256?: string | null;
};

export function buildPeriodDetailCsv(rows: PeriodExportRow[]): string {
  const header =
    "employee_name,employee_id,line_type,amount_minor,currency_code,inputs_fingerprint_sha256";
  const lines = rows.map((r) =>
    [
      csvEscape(r.employeeName),
      csvEscape(r.employeeId),
      csvEscape(r.lineType),
      String(r.amountMinor),
      csvEscape(r.currencyCode),
      csvEscape(r.inputsFingerprintSha256 ?? ""),
    ].join(","),
  );
  return [header, ...lines].join("\n");
}

function csvEscape(value: string): string {
  if (/[",\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}
