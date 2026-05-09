import { applyScenarioTags } from "./tags";
import type { EmployeeScenario, ScenarioId, ScenarioTag } from "./types";

const defaultPayload = (): EmployeeScenario["extensions"] => ({
  workLocation: {
    primaryWorksiteState: "CA",
    residenceState: "CA",
  },
});

export function buildEmployeeScenario(input: {
  scenarioId: ScenarioId;
  tenantId?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  tags?: ScenarioTag[];
  extensions?: Partial<EmployeeScenario["extensions"]>;
}): EmployeeScenario {
  const tenantId = input.tenantId ?? "tenant_qa_default";
  const slug = input.scenarioId.replace(/[^a-z0-9]+/gi, "_").toLowerCase();
  const email = input.email ?? `${slug}@${tenantId}.qa.local`;

  const mergedBase: EmployeeScenario["extensions"] = {
    ...defaultPayload(),
    ...input.extensions,
    workLocation: {
      ...defaultPayload().workLocation,
      ...input.extensions?.workLocation,
    },
  };

  const tags = input.tags ?? [];
  const extensions = applyScenarioTags(mergedBase, tags);

  return {
    scenarioId: input.scenarioId,
    tenantId,
    email,
    firstName: input.firstName ?? "Synthetic",
    lastName: input.lastName ?? "Employee",
    tags,
    extensions,
  };
}
