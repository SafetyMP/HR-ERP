import { describe, expect, it } from "vitest";

import { buildScreeningInput, redactCandidateText } from "@/lib/recruiting/redact";

describe("redactCandidateText", () => {
  it("redacts emails, phones, gov ids, and URLs", () => {
    const input =
      "Contact jane.doe@example.com or +1 (415) 555-1234. SSN 123-45-6789. https://linkedin.com/in/jane";
    const out = redactCandidateText(input);
    expect(out).not.toContain("jane.doe@example.com");
    expect(out).not.toContain("415");
    expect(out).not.toContain("123-45-6789");
    expect(out).not.toContain("linkedin.com");
    expect(out).toContain("[REDACTED_EMAIL]");
    expect(out).toContain("[REDACTED_PHONE]");
    expect(out).toContain("[REDACTED_GOV_ID]");
    expect(out).toContain("[REDACTED_URL]");
  });

  it("returns empty input untouched", () => {
    expect(redactCandidateText("")).toBe("");
  });
});

describe("buildScreeningInput", () => {
  it("masks the candidate identifier and redacts free text", () => {
    const out = buildScreeningInput({
      candidateFullName: "Jane Doe",
      candidateEmail: "jane@example.com",
      resumeText: "Worked at Acme. Contact: jane@example.com",
      requisitionTitle: "Senior Engineer",
      requisitionDescription: "Apply via https://company.example/careers",
    });
    expect(out.redactedCandidateLabel).toBe("[CANDIDATE]");
    expect(out.redactedResume).not.toContain("jane@example.com");
    expect(out.jobContext).toContain("Senior Engineer");
    expect(out.jobContext).not.toContain("https://company.example");
  });
});
