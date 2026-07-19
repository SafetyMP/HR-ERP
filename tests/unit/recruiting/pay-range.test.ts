import { describe, expect, it } from "vitest";

import { ApiError } from "@/lib/api/v1/errors";
import {
  formatPayRangeLabel,
  normalizePayRangeFields,
} from "@/lib/recruiting/pay-range";

describe("normalizePayRangeFields", () => {
  it("defaults currency to USD when omitted", () => {
    expect(normalizePayRangeFields({})).toEqual({
      payRangeMin: null,
      payRangeMax: null,
      payRangeCurrency: "USD",
      postingJurisdiction: null,
    });
  });

  it("accepts a valid min/max range and jurisdiction", () => {
    expect(
      normalizePayRangeFields({
        payRangeMin: 70000,
        payRangeMax: 90000,
        payRangeCurrency: "usd",
        postingJurisdiction: "us-va",
      }),
    ).toEqual({
      payRangeMin: 70000,
      payRangeMax: 90000,
      payRangeCurrency: "USD",
      postingJurisdiction: "US-VA",
    });
  });

  it("rejects min greater than max", () => {
    expect(() =>
      normalizePayRangeFields({ payRangeMin: 100, payRangeMax: 50 }),
    ).toThrow(ApiError);
  });

  it("rejects invalid currency", () => {
    expect(() =>
      normalizePayRangeFields({ payRangeCurrency: "US" }),
    ).toThrow(ApiError);
  });
});

describe("formatPayRangeLabel", () => {
  it("formats a closed range", () => {
    expect(
      formatPayRangeLabel({
        payRangeMin: 70000,
        payRangeMax: 90000,
        payRangeCurrency: "USD",
      }),
    ).toMatch(/\$70,000/);
  });

  it("returns null when both bounds are empty", () => {
    expect(
      formatPayRangeLabel({
        payRangeMin: null,
        payRangeMax: null,
        payRangeCurrency: "USD",
      }),
    ).toBeNull();
  });
});
