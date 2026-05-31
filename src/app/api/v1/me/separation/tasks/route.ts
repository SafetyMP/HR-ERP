import { z } from "zod";

import { defineV1Route } from "@/lib/api/v1/define-v1-route";
import {
  getMySeparationTasks,
  patchMySeparationTask,
} from "@/lib/separation/separation-tasks-service";

const PATH = "/api/v1/me/separation/tasks";

const patchBodySchema = z.object({
  taskId: z.string().uuid(),
  status: z.enum(["PENDING", "IN_PROGRESS", "DONE"]),
});

export const GET = defineV1Route({
  method: "GET",
  pathname: PATH,
  classification: "internal",
  handler: async ({ auth }) => {
    const separationTasks = await getMySeparationTasks(auth);
    return { separationTasks };
  },
});

export const PATCH = defineV1Route({
  method: "PATCH",
  pathname: PATH,
  classification: "internal",
  bodySchema: patchBodySchema,
  handler: async ({ auth, body }) => {
    const separationTask = await patchMySeparationTask(auth, body);
    return { separationTask };
  },
});
