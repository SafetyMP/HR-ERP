export type PtoSummaryApiShape = {
  balanceHours: number | null;
  balanceAsOfDate: string | null;
  recentTimeOff: { requestDate: string }[];
};
