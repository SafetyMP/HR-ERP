const DEFAULT_COPY = {
  title: "Something went wrong",
  description:
    "We could not complete that action. Please try again. If the issue continues, contact HR support with the reference shown in the details.",
};

const KNOWN: Record<string, { title: string; description: string }> = {
  PTO_BALANCE_EXCEEDED: {
    title: "Insufficient PTO balance",
    description:
      "The time you requested exceeds your available paid time off. Adjust your dates or hours, or speak with your manager about an exception.",
  },
  INVALID_DATE_RANGE: {
    title: "Check your dates",
    description:
      "The start and end of your request do not form a valid range. Please fix the dates and try again.",
  },
  JURISDICTION_FIELD_REQUIRED: {
    title: "More information needed",
    description:
      "This location requires additional fields. Complete the highlighted items and submit again.",
  },
  UNAUTHORIZED: {
    title: "Session issue",
    description:
      "Your session may have expired. Sign in again and retry. If you still see this message, contact IT.",
  },
};

export function friendlyMessageForCode(code: string | undefined) {
  if (!code) return null;
  return KNOWN[code] ?? null;
}

export function fallbackFriendlyMessage() {
  return DEFAULT_COPY;
}
