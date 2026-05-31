import { defineV1Route } from "@/lib/api/v1/define-v1-route";
import { getTodayAttendanceSummary } from "@/lib/attendance/get-today-attendance-summary";

const PATH = "/api/v1/me/attendance/today";

export const GET = defineV1Route({
  method: "GET",
  pathname: PATH,
  classification: "internal",
  handler: async ({ auth }) => {
    const todayAttendance = await getTodayAttendanceSummary(auth);
    return { todayAttendance };
  },
});
