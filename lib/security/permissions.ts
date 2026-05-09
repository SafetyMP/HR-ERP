export const PERMISSIONS = [
  "employees:list",
  "employees:read",
  "employees:write",
  "attendance:clock",
  "onboarding:read",
  "onboarding:write",
  "governance:ai_propose",
  "governance:ai_approve",
  "governance:ai_execute",
  "governance:audit_read",
  "analytics:churn:read",
  "analytics:skills:read",
  "analytics:benchmarks:read",
] as const;

export type Permission = (typeof PERMISSIONS)[number];

export const ROLES = [
  "employee",
  "manager",
  "hr_admin",
  "payroll_admin",
  "auditor_readonly",
] as const;

export type Role = (typeof ROLES)[number];

export const ROLE_PERMISSIONS: Record<Role, readonly Permission[]> = {
  employee: ["employees:read", "attendance:clock", "onboarding:read", "onboarding:write"],
  manager: [
    "employees:list",
    "employees:read",
    "employees:write",
    "attendance:clock",
    "onboarding:read",
    "onboarding:write",
    "governance:ai_propose",
    "analytics:churn:read",
    "analytics:skills:read",
    "analytics:benchmarks:read",
  ],
  hr_admin: [
    "employees:list",
    "employees:read",
    "employees:write",
    "attendance:clock",
    "onboarding:read",
    "onboarding:write",
    "governance:ai_propose",
    "governance:ai_approve",
    "governance:ai_execute",
    "governance:audit_read",
    "analytics:churn:read",
    "analytics:skills:read",
    "analytics:benchmarks:read",
  ],
  payroll_admin: [
    "employees:list",
    "employees:read",
    "employees:write",
    "attendance:clock",
    "onboarding:read",
    "onboarding:write",
    "governance:ai_execute",
    "governance:audit_read",
    "analytics:churn:read",
    "analytics:skills:read",
    "analytics:benchmarks:read",
  ],
  auditor_readonly: [
    "employees:list",
    "employees:read",
    "onboarding:read",
    "governance:audit_read",
    "analytics:churn:read",
    "analytics:skills:read",
    "analytics:benchmarks:read",
  ],
};

export function roleHasPermission(role: Role, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}
