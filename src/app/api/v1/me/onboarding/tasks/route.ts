import { z } from "zod";

import { defineV1Route } from "@/lib/api/v1/define-v1-route";
import {
  getMyOnboardingTasks,
  patchMyOnboardingTask,
} from "@/lib/onboarding/onboarding-tasks-service";

const PATH = "/api/v1/me/onboarding/tasks";

const patchBodySchema = z.object({
  taskId: z.string().uuid(),
  status: z.enum(["PENDING", "IN_PROGRESS", "DONE"]),
});

export const GET = defineV1Route({
  method: "GET",
  pathname: PATH,
  classification: "internal",
  handler: async ({ auth }) => {
    const onboardingTasks = await getMyOnboardingTasks(auth);
    return { onboardingTasks };
  },
});

export const PATCH = defineV1Route({
  method: "PATCH",
  pathname: PATH,
  classification: "internal",
  bodySchema: patchBodySchema,
  handler: async ({ auth, body }) => {
    const onboardingTask = await patchMyOnboardingTask(auth, body);
    return { onboardingTask };
  },
});
