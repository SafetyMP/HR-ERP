// Synthetic payroll desk. Amounts are fixed payment-instruction fixtures in USD.
export type ExceptionStatus = "Open" | "Resolved" | "Waived";
export type DeskAction =
  | "tracePrior"
  | "sourceFuture"
  | "trace"
  | "waiveExisting"
  | "source"
  | "retry"
  | "resolveMissing"
  | "waiveMissing"
  | "lock"
  | "artifact";
export type Desk = {
  minutes: number;
  existing: ExceptionStatus;
  missing: ExceptionStatus;
  sourceAttached: boolean;
  newInstruction: boolean;
  locked: boolean;
  artifact: boolean;
  history: { minute: number; message: string }[];
};
export const openDesk: Desk = {
  minutes: 0,
  existing: "Open",
  missing: "Open",
  sourceAttached: false,
  newInstruction: false,
  locked: false,
  artifact: false,
  history: [],
};
export const cutoffMinutes = 20;
export const usd = (amount: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(amount);
export function clock(minute: number) {
  const total = 14 * 60 + 40 + minute;
  return Math.floor(total / 60) + ":" + String(total % 60).padStart(2, "0");
}
export function openCount(desk: Desk) {
  return Number(desk.existing === "Open") + Number(desk.missing === "Open");
}
export function register(desk: Desk) {
  return [
    { employee: "Sam Brooks", amount: 2180, instruction: "PI-701" },
    { employee: "Alex Morgan", amount: 1760, instruction: "PI-702" },
    {
      employee: "Casey Rivera",
      amount: desk.newInstruction ? 1520 : null,
      instruction: desk.newInstruction ? "PI-703" : null,
    },
  ];
}
export const actions = {
  tracePrior: {
    label: "Match PI-686 and resolve",
    minutes: 5,
    message:
      "PI-686 belongs to the October period. Alex’s November instruction is still unverified and the exception stays open.",
  },
  sourceFuture: {
    label: "Apply HR-58",
    minutes: 12,
    message:
      "HR-58 takes effect November 16, after the period ended. Casey still has no eligible compensation record for this retry.",
  },
  trace: {
    label: "Match PI-702 and resolve",
    minutes: 5,
    message:
      "Matched PI-702 to Alex and the current period. Closed the exception. No second instruction was created.",
  },
  waiveExisting: {
    label: "Waive without matching",
    minutes: 1,
    message:
      "Waived Alex’s exception. PI-702 remains on the register without an independent match.",
  },
  source: {
    label: "Apply HR-52",
    minutes: 12,
    message:
      "HR supplied Casey’s approved compensation record, effective before this period ended.",
  },
  retry: {
    label: "Rerun Casey only",
    minutes: 4,
    message:
      "The targeted retry created PI-703 for Casey. Sam’s and Alex’s instructions stayed in place.",
  },
  resolveMissing: {
    label: "Reconcile new instruction and resolve",
    minutes: 1,
    message:
      "Matched PI-703 to Casey and marked the missing-compensation exception resolved.",
  },
  waiveMissing: {
    label: "Waive missing compensation",
    minutes: 1,
    message:
      "Waived Casey’s exception. Changing the exception status does not create a payment instruction.",
  },
  lock: {
    label: "Lock computed period",
    minutes: 2,
    message:
      "Locked the period. Further pay runs against this period are closed.",
  },
  artifact: {
    label: "Prepare artifact summary",
    minutes: 0,
    message:
      "Prepared a local summary of the locked instructions and open exceptions.",
  },
} as const;
export function canRun(d: Desk, action: DeskAction) {
  if (action === "artifact") return d.locked && !d.artifact;
  if (d.locked) return false;
  switch (action) {
    case "tracePrior":
    case "trace":
    case "waiveExisting":
      return d.existing === "Open";
    case "sourceFuture":
    case "source":
      return !d.sourceAttached;
    case "retry":
      return d.sourceAttached && !d.newInstruction;
    case "resolveMissing":
      return d.newInstruction && d.missing === "Open";
    case "waiveMissing":
      return !d.newInstruction && d.missing === "Open";
    case "lock":
      return true;
  }
}
export function advance(d: Desk, action: DeskAction): Desk {
  if (!canRun(d, action)) return d;
  const next = { ...d, minutes: d.minutes + actions[action].minutes };
  switch (action) {
    case "trace":
      next.existing = "Resolved";
      break;
    case "waiveExisting":
      next.existing = "Waived";
      break;
    case "source":
      next.sourceAttached = true;
      break;
    case "retry":
      next.newInstruction = true;
      break;
    case "resolveMissing":
      next.missing = "Resolved";
      break;
    case "waiveMissing":
      next.missing = "Waived";
      break;
    case "lock":
      next.locked = true;
      break;
    case "artifact":
      next.artifact = true;
      break;
  }
  next.history = [
    ...d.history,
    { minute: next.minutes, message: actions[action].message },
  ];
  return next;
}
