import type { AbacConstraints } from "@/lib/security/abac-attributes";
import type { Permission } from "@/lib/security/permissions";

export interface RoutePolicy {
  permission: Permission;
  abac?: AbacConstraints;
}

type HttpVerb = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

function routeKey(method: HttpVerb, pathname: string): string {
  return `${method} ${pathname}`;
}

/** Central registry: every versioned API route must have an explicit policy entry (deny-by-default via absence). */
const ROUTES: Record<string, RoutePolicy> = {
  [routeKey("GET", "/api/v1/employees")]: {
    permission: "employees:list",
    abac: { minMfa: "standard", maxDataClassification: "confidential" },
  },
  [routeKey("GET", "/api/v1/employees/:employeeId")]: {
    permission: "employees:read",
    abac: { minMfa: "standard", maxDataClassification: "internal" },
  },
  [routeKey("POST", "/api/v1/attendance/clock-in")]: {
    permission: "attendance:clock",
    abac: { minMfa: "standard", maxDataClassification: "internal" },
  },
  [routeKey("GET", "/api/v1/me/attendance/today")]: {
    permission: "attendance:clock",
    abac: { minMfa: "standard", maxDataClassification: "internal" },
  },
  [routeKey("GET", "/api/v1/analytics/churn")]: {
    permission: "analytics:churn:read",
    abac: { minMfa: "standard", maxDataClassification: "confidential" },
  },
  [routeKey("GET", "/api/v1/analytics/skills/match")]: {
    permission: "analytics:skills:read",
    abac: { minMfa: "standard", maxDataClassification: "confidential" },
  },
  [routeKey("GET", "/api/v1/analytics/benchmarks")]: {
    permission: "analytics:benchmarks:read",
    abac: { minMfa: "standard", maxDataClassification: "confidential" },
  },
  [routeKey("POST", "/api/v1/ml/churn/score")]: {
    permission: "analytics:churn:read",
    abac: { minMfa: "standard", maxDataClassification: "confidential" },
  },
  [routeKey("GET", "/api/v1/me/paystub/current")]: {
    permission: "paystub:read",
    abac: { minMfa: "standard", maxDataClassification: "confidential" },
  },
  [routeKey("GET", "/api/v1/me/benefits/summary")]: {
    permission: "benefits:read",
    abac: { minMfa: "standard", maxDataClassification: "confidential" },
  },
  [routeKey("GET", "/api/v1/me/profile")]: {
    permission: "employees:read",
    abac: { minMfa: "standard", maxDataClassification: "confidential" },
  },
  [routeKey("PATCH", "/api/v1/me/profile")]: {
    permission: "profile:self_update",
    abac: { minMfa: "standard", maxDataClassification: "confidential" },
  },
  [routeKey("GET", "/api/v1/me/pto/summary")]: {
    permission: "pto:self_read",
    abac: { minMfa: "standard", maxDataClassification: "confidential" },
  },
  [routeKey("GET", "/api/v1/me/time-off/requests")]: {
    permission: "leave:self_submit",
    abac: { minMfa: "standard", maxDataClassification: "confidential" },
  },
  [routeKey("POST", "/api/v1/me/time-off/requests")]: {
    permission: "leave:self_submit",
    abac: { minMfa: "standard", maxDataClassification: "confidential" },
  },
  [routeKey("GET", "/api/v1/me/paystub/history")]: {
    permission: "paystub:read",
    abac: { minMfa: "standard", maxDataClassification: "confidential" },
  },
  [routeKey("GET", "/api/v1/manager/team/attendance/today")]: {
    permission: "manager:team_attendance",
    abac: { minMfa: "standard", maxDataClassification: "internal" },
  },
  [routeKey("GET", "/api/v1/me/onboarding/tasks")]: {
    permission: "onboarding:read",
    abac: { minMfa: "standard", maxDataClassification: "internal" },
  },
  [routeKey("PATCH", "/api/v1/me/onboarding/tasks")]: {
    permission: "onboarding:write",
    abac: { minMfa: "standard", maxDataClassification: "internal" },
  },
  [routeKey("POST", "/api/v1/me/hr-case-requests")]: {
    permission: "case:intake_submit",
    abac: { minMfa: "standard", maxDataClassification: "confidential" },
  },
  [routeKey("GET", "/api/v1/me/hr-case-requests")]: {
    permission: "case:intake_read",
    abac: { minMfa: "standard", maxDataClassification: "confidential" },
  },
  [routeKey("PATCH", "/api/v1/hr/case-requests/review")]: {
    permission: "case:hr_triage",
    abac: { minMfa: "standard", maxDataClassification: "confidential" },
  },
  [routeKey("GET", "/api/v1/me/tax-documents/summary")]: {
    permission: "tax_documents:read",
    abac: { minMfa: "standard", maxDataClassification: "confidential" },
  },
  [routeKey("POST", "/api/v1/me/benefits/election-change-requests")]: {
    permission: "benefits:election_intent_submit",
    abac: { minMfa: "standard", maxDataClassification: "confidential" },
  },
  [routeKey("GET", "/api/v1/me/organization/context")]: {
    permission: "employees:read",
    abac: { minMfa: "standard", maxDataClassification: "internal" },
  },
  [routeKey("GET", "/api/v1/me/separation/tasks")]: {
    permission: "separation:read",
    abac: { minMfa: "standard", maxDataClassification: "internal" },
  },
  [routeKey("PATCH", "/api/v1/me/separation/tasks")]: {
    permission: "separation:write",
    abac: { minMfa: "standard", maxDataClassification: "internal" },
  },
  [routeKey("GET", "/api/v1/manager/team/time-off/requests")]: {
    permission: "leave:manager_decide",
    abac: { minMfa: "standard", maxDataClassification: "confidential" },
  },
  [routeKey("PATCH", "/api/v1/manager/team/time-off/decision")]: {
    permission: "leave:manager_decide",
    abac: { minMfa: "standard", maxDataClassification: "confidential" },
  },
  [routeKey("GET", "/api/v1/manager/team/attendance/correction-requests")]: {
    permission: "attendance:correction_submit",
    abac: { minMfa: "standard", maxDataClassification: "internal" },
  },
  [routeKey("POST", "/api/v1/manager/team/attendance/correction-requests")]: {
    permission: "attendance:correction_submit",
    abac: { minMfa: "standard", maxDataClassification: "internal" },
  },
  [routeKey("PATCH", "/api/v1/hr/attendance/correction-requests/review")]: {
    permission: "attendance:correction_review",
    abac: { minMfa: "standard", maxDataClassification: "internal" },
  },
  [routeKey("GET", "/api/v1/hr/onboarding/templates")]: {
    permission: "hr:onboarding_template_assign",
    abac: { minMfa: "standard", maxDataClassification: "internal" },
  },
  [routeKey("POST", "/api/v1/hr/onboarding/apply-template")]: {
    permission: "hr:onboarding_template_assign",
    abac: { minMfa: "standard", maxDataClassification: "internal" },
  },
  [routeKey("GET", "/api/v1/hr/case-requests/pending")]: {
    permission: "case:hr_triage",
    abac: { minMfa: "standard", maxDataClassification: "confidential" },
  },
  [routeKey("GET", "/api/v1/hr/attendance/correction-requests/pending")]: {
    permission: "attendance:correction_review",
    abac: { minMfa: "standard", maxDataClassification: "internal" },
  },
  [routeKey("GET", "/api/v1/payroll/runs")]: {
    permission: "payroll:run_read",
    abac: { minMfa: "standard", maxDataClassification: "confidential" },
  },
  [routeKey("POST", "/api/v1/payroll/runs")]: {
    permission: "payroll:run_execute",
    abac: { minMfa: "step_up", maxDataClassification: "confidential" },
  },
  [routeKey("GET", "/api/v1/payroll/runs/:periodId")]: {
    permission: "payroll:run_read",
    abac: { minMfa: "standard", maxDataClassification: "confidential" },
  },
  [routeKey("GET", "/api/v1/payroll/runs/:periodId/exceptions")]: {
    permission: "payroll:run_read",
    abac: { minMfa: "standard", maxDataClassification: "confidential" },
  },
  [routeKey("PATCH", "/api/v1/payroll/runs/exceptions/:id")]: {
    permission: "payroll:run_execute",
    abac: { minMfa: "step_up", maxDataClassification: "confidential" },
  },
  [routeKey("POST", "/api/v1/payroll/runs/:periodId/lock")]: {
    permission: "payroll:run_execute",
    abac: { minMfa: "step_up", maxDataClassification: "confidential" },
  },
  [routeKey("GET", "/api/v1/payroll/runs/:periodId/filing-artifact")]: {
    permission: "payroll:run_read",
    abac: { minMfa: "standard", maxDataClassification: "confidential" },
  },
  [routeKey("POST", "/api/v1/payroll/runs/:periodId/filing-artifact")]: {
    permission: "payroll:run_execute",
    abac: { minMfa: "step_up", maxDataClassification: "confidential" },
  },
  [routeKey("POST", "/api/v1/me/benefits/life-events")]: {
    permission: "benefits:election_intent_submit",
    abac: { minMfa: "standard", maxDataClassification: "confidential" },
  },
  [routeKey("GET", "/api/v1/me/benefits/life-events")]: {
    permission: "benefits:read",
    abac: { minMfa: "standard", maxDataClassification: "confidential" },
  },
  [routeKey("GET", "/api/v1/hr/benefits/life-events")]: {
    permission: "case:hr_triage",
    abac: { minMfa: "standard", maxDataClassification: "confidential" },
  },
  [routeKey("PATCH", "/api/v1/hr/benefits/life-events/:id")]: {
    permission: "case:hr_triage",
    abac: { minMfa: "standard", maxDataClassification: "confidential" },
  },
  [routeKey("GET", "/api/v1/recruiting/applications/:id/interviews")]: {
    permission: "recruiting:application_read",
    abac: { minMfa: "standard", maxDataClassification: "confidential" },
  },
  [routeKey("POST", "/api/v1/recruiting/applications/:id/interviews")]: {
    permission: "recruiting:application_write",
    abac: { minMfa: "standard", maxDataClassification: "confidential" },
  },
  [routeKey("PATCH", "/api/v1/recruiting/interviews/:id")]: {
    permission: "recruiting:application_write",
    abac: { minMfa: "standard", maxDataClassification: "confidential" },
  },
  [routeKey("GET", "/api/v1/me/performance/reviews")]: {
    permission: "performance:review_self_write",
    abac: { minMfa: "standard", maxDataClassification: "confidential" },
  },
  [routeKey("PATCH", "/api/v1/me/performance/reviews/:id")]: {
    permission: "performance:review_self_write",
    abac: { minMfa: "standard", maxDataClassification: "confidential" },
  },
  [routeKey("GET", "/api/v1/manager/performance/reviews")]: {
    permission: "performance:review_team_write",
    abac: { minMfa: "standard", maxDataClassification: "confidential" },
  },
  [routeKey("PATCH", "/api/v1/manager/performance/reviews/:id")]: {
    permission: "performance:review_team_write",
    abac: { minMfa: "standard", maxDataClassification: "confidential" },
  },
  [routeKey("GET", "/api/v1/hr/analytics/ops-summary")]: {
    permission: "case:hr_triage",
    abac: { minMfa: "standard", maxDataClassification: "internal" },
  },
  [routeKey("GET", "/api/v1/recruiting/requisitions")]: {
    permission: "recruiting:requisition_read",
    abac: { minMfa: "standard", maxDataClassification: "internal" },
  },
  [routeKey("POST", "/api/v1/recruiting/requisitions")]: {
    permission: "recruiting:requisition_write",
    abac: { minMfa: "standard", maxDataClassification: "internal" },
  },
  [routeKey("PATCH", "/api/v1/recruiting/requisitions/:id")]: {
    permission: "recruiting:requisition_write",
    abac: { minMfa: "standard", maxDataClassification: "internal" },
  },
  [routeKey("GET", "/api/v1/recruiting/requisitions/:id/applications")]: {
    permission: "recruiting:application_read",
    abac: { minMfa: "standard", maxDataClassification: "confidential" },
  },
  [routeKey("POST", "/api/v1/recruiting/applications")]: {
    permission: "recruiting:application_write",
    abac: { minMfa: "standard", maxDataClassification: "confidential" },
  },
  [routeKey("POST", "/api/v1/recruiting/applications/:id/screening-proposals")]: {
    permission: "governance:ai_propose",
    abac: { minMfa: "standard", maxDataClassification: "confidential" },
  },
  [routeKey("PATCH", "/api/v1/recruiting/applications/:id/stage")]: {
    permission: "recruiting:application_write",
    abac: { minMfa: "step_up", maxDataClassification: "confidential" },
  },
  [routeKey("POST", "/api/v1/recruiting/offers")]: {
    permission: "recruiting:offer_write",
    abac: { minMfa: "step_up", maxDataClassification: "confidential" },
  },
  [routeKey("POST", "/api/v1/recruiting/offers/:id/extend")]: {
    permission: "recruiting:offer_write",
    abac: { minMfa: "step_up", maxDataClassification: "confidential" },
  },
  [routeKey("GET", "/api/v1/performance/cycles")]: {
    permission: "performance:cycle_read",
    abac: { minMfa: "standard", maxDataClassification: "internal" },
  },
  [routeKey("POST", "/api/v1/performance/cycles")]: {
    permission: "performance:cycle_write",
    abac: { minMfa: "standard", maxDataClassification: "internal" },
  },
  [routeKey("PATCH", "/api/v1/performance/cycles/:id")]: {
    permission: "performance:cycle_write",
    abac: { minMfa: "standard", maxDataClassification: "internal" },
  },
  [routeKey("GET", "/api/v1/me/performance/goals")]: {
    permission: "performance:goal_self_write",
    abac: { minMfa: "standard", maxDataClassification: "internal" },
  },
  [routeKey("POST", "/api/v1/me/performance/goals")]: {
    permission: "performance:goal_self_write",
    abac: { minMfa: "standard", maxDataClassification: "internal" },
  },
  [routeKey("GET", "/api/v1/manager/performance/goals")]: {
    permission: "performance:goal_team_write",
    abac: { minMfa: "standard", maxDataClassification: "internal" },
  },
  [routeKey("POST", "/api/v1/manager/performance/goals")]: {
    permission: "performance:goal_team_write",
    abac: { minMfa: "standard", maxDataClassification: "internal" },
  },
  [routeKey("GET", "/api/v1/compensation/cycles")]: {
    permission: "compensation:cycle_read",
    abac: { minMfa: "standard", maxDataClassification: "confidential" },
  },
  [routeKey("POST", "/api/v1/compensation/cycles")]: {
    permission: "compensation:cycle_write",
    abac: { minMfa: "step_up", maxDataClassification: "confidential" },
  },
  [routeKey("PATCH", "/api/v1/compensation/cycles/:id")]: {
    permission: "compensation:cycle_write",
    abac: { minMfa: "step_up", maxDataClassification: "confidential" },
  },
  [routeKey("POST", "/api/v1/compensation/recommendations")]: {
    permission: "compensation:recommend_write",
    abac: { minMfa: "step_up", maxDataClassification: "confidential" },
  },
  [routeKey("POST", "/api/v1/compensation/recommendations/:id/apply")]: {
    permission: "compensation:recommend_apply",
    abac: { minMfa: "step_up", maxDataClassification: "confidential" },
  },
  [routeKey("POST", "/api/v1/learning/courses")]: {
    permission: "learning:catalog_write",
    abac: { minMfa: "standard", maxDataClassification: "internal" },
  },
  [routeKey("POST", "/api/v1/learning/courses/:id/assignments")]: {
    permission: "learning:enrollment_assign",
    abac: { minMfa: "standard", maxDataClassification: "internal" },
  },
  [routeKey("GET", "/api/v1/me/learning/enrollments")]: {
    permission: "learning:enrollment_self_read",
    abac: { minMfa: "standard", maxDataClassification: "internal" },
  },
  [routeKey("POST", "/api/v1/me/learning/enrollments/:id/complete")]: {
    permission: "learning:enrollment_complete_self",
    abac: { minMfa: "standard", maxDataClassification: "internal" },
  },
  [routeKey("POST", "/api/v1/workflow/definitions")]: {
    permission: "workflow:definition_write",
    abac: { minMfa: "standard", maxDataClassification: "internal" },
  },
  [routeKey("POST", "/api/v1/workflow/instances")]: {
    permission: "workflow:instance_create",
    abac: { minMfa: "standard", maxDataClassification: "internal" },
  },
  [routeKey("POST", "/api/v1/workflow/instances/:id/decisions")]: {
    permission: "workflow:instance_decide",
    abac: { minMfa: "standard", maxDataClassification: "internal" },
  },
  [routeKey("POST", "/api/v1/integrations/webhooks/subscriptions")]: {
    permission: "integrations:webhook_subscription_write",
    abac: { minMfa: "step_up", maxDataClassification: "confidential" },
  },
  [routeKey("GET", "/api/v1/integrations/instances")]: {
    permission: "integrations:configure",
    abac: { minMfa: "step_up", maxDataClassification: "confidential" },
  },
  [routeKey("PUT", "/api/v1/integrations/instances")]: {
    permission: "integrations:configure",
    abac: { minMfa: "step_up", maxDataClassification: "confidential" },
  },
  [routeKey("POST", "/api/v1/payroll/runs/:periodId/partner-export")]: {
    permission: "payroll:run_execute",
    abac: { minMfa: "step_up", maxDataClassification: "confidential" },
  },
  [routeKey("GET", "/api/v1/payroll/runs/:periodId/partner-export")]: {
    permission: "payroll:run_read",
    abac: { minMfa: "standard", maxDataClassification: "confidential" },
  },
  [routeKey("POST", "/api/v1/positions")]: {
    permission: "position:write",
    abac: { minMfa: "standard", maxDataClassification: "internal" },
  },
  [routeKey("POST", "/api/v1/engagement/surveys")]: {
    permission: "engagement:survey_write",
    abac: { minMfa: "standard", maxDataClassification: "internal" },
  },
  [routeKey("POST", "/api/v1/me/engagement/responses")]: {
    permission: "engagement:response_submit",
    abac: { minMfa: "standard", maxDataClassification: "confidential" },
  },
};

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function getRoutePolicy(
  method: string,
  pathname: string,
): RoutePolicy | undefined {
  const verb = method as HttpVerb;
  const exact = ROUTES[routeKey(verb, pathname)];
  if (exact) return exact;

  if (
    verb === "GET" &&
    /^\/api\/v1\/employees\/[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      pathname,
    )
  ) {
    return ROUTES[routeKey("GET", "/api/v1/employees/:employeeId")];
  }

  if (verb === "GET") {
    const match = pathname.match(/^\/api\/v1\/payroll\/runs\/([^/]+)$/);
    if (match && UUID_PATTERN.test(match[1]!)) {
      return ROUTES[routeKey("GET", "/api/v1/payroll/runs/:periodId")];
    }
    const exceptionsMatch = pathname.match(
      /^\/api\/v1\/payroll\/runs\/([^/]+)\/exceptions$/,
    );
    if (exceptionsMatch && UUID_PATTERN.test(exceptionsMatch[1]!)) {
      return ROUTES[routeKey("GET", "/api/v1/payroll/runs/:periodId/exceptions")];
    }
    const filingGetMatch = pathname.match(
      /^\/api\/v1\/payroll\/runs\/([^/]+)\/filing-artifact$/,
    );
    if (filingGetMatch && UUID_PATTERN.test(filingGetMatch[1]!)) {
      return ROUTES[
        routeKey("GET", "/api/v1/payroll/runs/:periodId/filing-artifact")
      ];
    }
    const partnerExportGet = pathname.match(
      /^\/api\/v1\/payroll\/runs\/([^/]+)\/partner-export$/,
    );
    if (partnerExportGet && UUID_PATTERN.test(partnerExportGet[1]!)) {
      return ROUTES[
        routeKey("GET", "/api/v1/payroll/runs/:periodId/partner-export")
      ];
    }
  }

  if (verb === "POST") {
    const lockMatch = pathname.match(/^\/api\/v1\/payroll\/runs\/([^/]+)\/lock$/);
    if (lockMatch && UUID_PATTERN.test(lockMatch[1]!)) {
      return ROUTES[routeKey("POST", "/api/v1/payroll/runs/:periodId/lock")];
    }
    const filingPostMatch = pathname.match(
      /^\/api\/v1\/payroll\/runs\/([^/]+)\/filing-artifact$/,
    );
    if (filingPostMatch && UUID_PATTERN.test(filingPostMatch[1]!)) {
      return ROUTES[
        routeKey("POST", "/api/v1/payroll/runs/:periodId/filing-artifact")
      ];
    }
    const partnerExportPost = pathname.match(
      /^\/api\/v1\/payroll\/runs\/([^/]+)\/partner-export$/,
    );
    if (partnerExportPost && UUID_PATTERN.test(partnerExportPost[1]!)) {
      return ROUTES[
        routeKey("POST", "/api/v1/payroll/runs/:periodId/partner-export")
      ];
    }
    const interviewPostMatch = pathname.match(
      /^\/api\/v1\/recruiting\/applications\/([^/]+)\/interviews$/,
    );
    if (interviewPostMatch && UUID_PATTERN.test(interviewPostMatch[1]!)) {
      return ROUTES[
        routeKey("POST", "/api/v1/recruiting/applications/:id/interviews")
      ];
    }
  }

  if (verb === "PATCH") {
    const exceptionPatch = pathname.match(
      /^\/api\/v1\/payroll\/runs\/exceptions\/([^/]+)$/,
    );
    if (exceptionPatch && UUID_PATTERN.test(exceptionPatch[1]!)) {
      return ROUTES[routeKey("PATCH", "/api/v1/payroll/runs/exceptions/:id")];
    }
    const lifeEventPatch = pathname.match(
      /^\/api\/v1\/hr\/benefits\/life-events\/([^/]+)$/,
    );
    if (lifeEventPatch && UUID_PATTERN.test(lifeEventPatch[1]!)) {
      return ROUTES[routeKey("PATCH", "/api/v1/hr/benefits/life-events/:id")];
    }
    const interviewPatch = pathname.match(
      /^\/api\/v1\/recruiting\/interviews\/([^/]+)$/,
    );
    if (interviewPatch && UUID_PATTERN.test(interviewPatch[1]!)) {
      return ROUTES[routeKey("PATCH", "/api/v1/recruiting/interviews/:id")];
    }
    const selfReviewPatch = pathname.match(
      /^\/api\/v1\/me\/performance\/reviews\/([^/]+)$/,
    );
    if (selfReviewPatch && UUID_PATTERN.test(selfReviewPatch[1]!)) {
      return ROUTES[routeKey("PATCH", "/api/v1/me/performance/reviews/:id")];
    }
    const mgrReviewPatch = pathname.match(
      /^\/api\/v1\/manager\/performance\/reviews\/([^/]+)$/,
    );
    if (mgrReviewPatch && UUID_PATTERN.test(mgrReviewPatch[1]!)) {
      return ROUTES[routeKey("PATCH", "/api/v1/manager/performance/reviews/:id")];
    }
  }

  if (verb === "GET") {
    const interviewListMatch = pathname.match(
      /^\/api\/v1\/recruiting\/applications\/([^/]+)\/interviews$/,
    );
    if (interviewListMatch && UUID_PATTERN.test(interviewListMatch[1]!)) {
      return ROUTES[
        routeKey("GET", "/api/v1/recruiting/applications/:id/interviews")
      ];
    }
  }

  // Recruiting / ATS dynamic-segment routes (`/recruiting/...`).
  const recruitingReqMatch = pathname.match(
    /^\/api\/v1\/recruiting\/requisitions\/([^/]+)$/,
  );
  if (recruitingReqMatch && UUID_PATTERN.test(recruitingReqMatch[1]!)) {
    if (verb === "PATCH") {
      return ROUTES[routeKey("PATCH", "/api/v1/recruiting/requisitions/:id")];
    }
  }
  const recruitingReqApplicationsMatch = pathname.match(
    /^\/api\/v1\/recruiting\/requisitions\/([^/]+)\/applications$/,
  );
  if (
    recruitingReqApplicationsMatch &&
    UUID_PATTERN.test(recruitingReqApplicationsMatch[1]!) &&
    verb === "GET"
  ) {
    return ROUTES[
      routeKey("GET", "/api/v1/recruiting/requisitions/:id/applications")
    ];
  }
  const recruitingProposalMatch = pathname.match(
    /^\/api\/v1\/recruiting\/applications\/([^/]+)\/screening-proposals$/,
  );
  if (
    recruitingProposalMatch &&
    UUID_PATTERN.test(recruitingProposalMatch[1]!) &&
    verb === "POST"
  ) {
    return ROUTES[
      routeKey("POST", "/api/v1/recruiting/applications/:id/screening-proposals")
    ];
  }
  const recruitingStageMatch = pathname.match(
    /^\/api\/v1\/recruiting\/applications\/([^/]+)\/stage$/,
  );
  if (
    recruitingStageMatch &&
    UUID_PATTERN.test(recruitingStageMatch[1]!) &&
    verb === "PATCH"
  ) {
    return ROUTES[
      routeKey("PATCH", "/api/v1/recruiting/applications/:id/stage")
    ];
  }
  const recruitingOfferExtendMatch = pathname.match(
    /^\/api\/v1\/recruiting\/offers\/([^/]+)\/extend$/,
  );
  if (
    recruitingOfferExtendMatch &&
    UUID_PATTERN.test(recruitingOfferExtendMatch[1]!) &&
    verb === "POST"
  ) {
    return ROUTES[routeKey("POST", "/api/v1/recruiting/offers/:id/extend")];
  }

  const perfCycleMatch = pathname.match(
    /^\/api\/v1\/performance\/cycles\/([^/]+)$/,
  );
  if (
    perfCycleMatch &&
    UUID_PATTERN.test(perfCycleMatch[1]!) &&
    verb === "PATCH"
  ) {
    return ROUTES[routeKey("PATCH", "/api/v1/performance/cycles/:id")];
  }
  const compCycleMatch = pathname.match(
    /^\/api\/v1\/compensation\/cycles\/([^/]+)$/,
  );
  if (
    compCycleMatch &&
    UUID_PATTERN.test(compCycleMatch[1]!) &&
    verb === "PATCH"
  ) {
    return ROUTES[routeKey("PATCH", "/api/v1/compensation/cycles/:id")];
  }
  const compApplyMatch = pathname.match(
    /^\/api\/v1\/compensation\/recommendations\/([^/]+)\/apply$/,
  );
  if (
    compApplyMatch &&
    UUID_PATTERN.test(compApplyMatch[1]!) &&
    verb === "POST"
  ) {
    return ROUTES[
      routeKey("POST", "/api/v1/compensation/recommendations/:id/apply")
    ];
  }

  const learningAssignMatch = pathname.match(
    /^\/api\/v1\/learning\/courses\/([^/]+)\/assignments$/,
  );
  if (
    learningAssignMatch &&
    UUID_PATTERN.test(learningAssignMatch[1]!) &&
    verb === "POST"
  ) {
    return ROUTES[routeKey("POST", "/api/v1/learning/courses/:id/assignments")];
  }
  const learningCompleteMatch = pathname.match(
    /^\/api\/v1\/me\/learning\/enrollments\/([^/]+)\/complete$/,
  );
  if (
    learningCompleteMatch &&
    UUID_PATTERN.test(learningCompleteMatch[1]!) &&
    verb === "POST"
  ) {
    return ROUTES[
      routeKey("POST", "/api/v1/me/learning/enrollments/:id/complete")
    ];
  }
  const workflowDecisionMatch = pathname.match(
    /^\/api\/v1\/workflow\/instances\/([^/]+)\/decisions$/,
  );
  if (
    workflowDecisionMatch &&
    UUID_PATTERN.test(workflowDecisionMatch[1]!) &&
    verb === "POST"
  ) {
    return ROUTES[
      routeKey("POST", "/api/v1/workflow/instances/:id/decisions")
    ];
  }

  return undefined;
}

export function registerRoutePolicy(
  method: HttpVerb,
  pathname: string,
  policy: RoutePolicy,
): void {
  ROUTES[routeKey(method, pathname)] = policy;
}

/** Introspection for CI / audits — stable sorted keys. */
export function listRegisteredRoutePolicies(): string[] {
  return Object.keys(ROUTES).sort();
}
