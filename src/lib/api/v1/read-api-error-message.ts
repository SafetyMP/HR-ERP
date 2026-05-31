const FRIENDLY_MESSAGES: Record<string, string> = {
  leave_decision_already_final:
    "That leave request was already decided and cannot be changed here.",
  time_off_request_not_found:
    "We could not find that leave request for someone on your team.",
  leave_decision_invalid: "That decision could not be applied.",
  life_event_already_decided: "That life event was already decided.",
  life_event_not_found: "That life event is no longer in the queue.",
  correction_already_decided: "That punch correction was already decided.",
  correction_request_not_found: "That punch correction is no longer in the queue.",
  correction_requires_clock_out_first:
    "This employee is still on the clock. Approve a clock-out correction first, or have them clock out in Time.",
  correction_punch_replay_mismatch:
    "This correction was already applied with different punch details.",
  correction_review_invalid_decision: "That correction decision is not valid.",
};

export async function readApiErrorMessage(
  res: Response,
  fallback: string,
): Promise<string> {
  try {
    const body = (await res.json()) as { error?: { message?: string } };
    const code = body.error?.message?.trim();
    if (code && FRIENDLY_MESSAGES[code]) {
      return FRIENDLY_MESSAGES[code];
    }
    if (code) {
      return fallback;
    }
  } catch {
    /* ignore parse errors */
  }
  return fallback;
}
