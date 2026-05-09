/** Structured security logs — never pass raw bodies, emails, names, tokens. */

type SafePrimitive = string | number | boolean | null | undefined;

export interface SecurityAuditFields {
  event: string;
  correlationId?: string;
  subjectId?: string;
  tenantId?: string;
  outcome: "allow" | "deny";
  detail?: string;
}

export function securityAuditLine(fields: SecurityAuditFields): string {
  const payload: Record<string, SafePrimitive> = {
    ts: new Date().toISOString(),
    severity: "security",
    ...fields,
  };
  return JSON.stringify(payload);
}
