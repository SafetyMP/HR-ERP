"use client";

import type { TodayAttendanceApi } from "@/lib/attendance/today-attendance-types";
import { useAuthenticatedResource } from "@/lib/hooks/use-authenticated-resource";

type TodayAttendanceResponse = {
  data?: { todayAttendance: TodayAttendanceApi };
};

export function useTodayAttendanceQuery() {
  return useAuthenticatedResource(
    ["me", "attendance", "today"],
    "/api/v1/me/attendance/today",
    async (res) => {
      const body = (await res.json()) as TodayAttendanceResponse;
      const summary = body.data?.todayAttendance;
      if (!summary) {
        throw new Error("today_attendance_missing");
      }
      return summary;
    },
  );
}
