export type TodayAttendanceApi = {
  calendarDate: string;
  timeZone: string;
  clockedIn: boolean;
  punches: { kind: string; occurredAt: string }[];
};
