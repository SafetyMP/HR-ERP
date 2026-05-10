/**
 * Best-effort redaction for free-text candidate-facing fields prior to AI
 * screening. We intentionally redact patterns that almost always introduce
 * EU AI Act / Title VII bias risk (names, contact info, postal codes), plus
 * obvious PII. This is **not** a substitute for governance HITL review; see
 * `docs/ai-governance/` and `lib/governance/high-stakes.ts`.
 */

const EMAIL_RE = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g;
const PHONE_RE = /(?:\+?\d{1,3}[\s.-]?)?(?:\(?\d{3}\)?[\s.-]?)?\d{3}[\s.-]?\d{4}/g;
const SSN_RE = /\b\d{3}-\d{2}-\d{4}\b/g;
const URL_RE = /\bhttps?:\/\/\S+/g;

export function redactCandidateText(input: string): string {
  if (!input) return input;
  return input
    .replace(EMAIL_RE, "[REDACTED_EMAIL]")
    .replace(URL_RE, "[REDACTED_URL]")
    .replace(SSN_RE, "[REDACTED_GOV_ID]")
    .replace(PHONE_RE, "[REDACTED_PHONE]");
}

/**
 * Redacts known direct identifiers from a candidate row before it's sent into
 * AI screening (model inputs, prompts, embeddings). The recruiter-visible
 * row is NOT modified.
 */
export function buildScreeningInput(parts: {
  candidateFullName: string;
  candidateEmail: string;
  resumeText?: string | null;
  requisitionTitle: string;
  requisitionDescription?: string | null;
}): {
  redactedCandidateLabel: string;
  redactedResume: string;
  jobContext: string;
} {
  return {
    redactedCandidateLabel: "[CANDIDATE]",
    redactedResume: redactCandidateText(parts.resumeText ?? ""),
    jobContext: `Title: ${parts.requisitionTitle}\n\n${redactCandidateText(parts.requisitionDescription ?? "")}`,
  };
}
