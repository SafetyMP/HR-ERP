export type TodayAttendanceApi = {
  calendarDate: string;
  timeZone: string;
  clockedIn: boolean;
  openShiftStartedAt?: string | null;
  openShiftFromPriorDay?: boolean;
  punches: { kind: string; occurredAt: string }[];
};
