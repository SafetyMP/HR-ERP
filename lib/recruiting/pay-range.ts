import { ApiError } from "@/lib/api/v1/errors";

export type PayRangeInput = {
  payRangeMin?: number | null;
  payRangeMax?: number | null;
  payRangeCurrency?: string | null;
  postingJurisdiction?: string | null;
};

const CURRENCY_RE = /^[A-Z]{3}$/;
const JURISDICTION_RE = /^[A-Z]{2}(-[A-Z0-9]{1,8})?$/;

/**
 * Validates optional pay-transparency fields for requisition create/update.
 * Pure helper for unit tests and domain create path.
 */
export function normalizePayRangeFields(input: PayRangeInput): {
  payRangeMin: number | null;
  payRangeMax: number | null;
  payRangeCurrency: string;
  postingJurisdiction: string | null;
} {
  const min =
    input.payRangeMin === undefined || input.payRangeMin === null
      ? null
      : Number(input.payRangeMin);
  const max =
    input.payRangeMax === undefined || input.payRangeMax === null
      ? null
      : Number(input.payRangeMax);

  if (min !== null && (!Number.isFinite(min) || min < 0)) {
    throw new ApiError(400, {
      code: "validation_error",
      message: "payRangeMin must be a non-negative number",
    });
  }
  if (max !== null && (!Number.isFinite(max) || max < 0)) {
    throw new ApiError(400, {
      code: "validation_error",
      message: "payRangeMax must be a non-negative number",
    });
  }
  if (min !== null && max !== null && min > max) {
    throw new ApiError(400, {
      code: "validation_error",
      message: "payRangeMin must be less than or equal to payRangeMax",
    });
  }

  const currencyRaw = (input.payRangeCurrency ?? "USD").trim().toUpperCase();
  if (!CURRENCY_RE.test(currencyRaw)) {
    throw new ApiError(400, {
      code: "validation_error",
      message: "payRangeCurrency must be a 3-letter ISO code",
    });
  }

  let postingJurisdiction: string | null = null;
  if (
    input.postingJurisdiction !== undefined &&
    input.postingJurisdiction !== null &&
    input.postingJurisdiction.trim() !== ""
  ) {
    const j = input.postingJurisdiction.trim().toUpperCase();
    if (!JURISDICTION_RE.test(j)) {
      throw new ApiError(400, {
        code: "validation_error",
        message: "postingJurisdiction must look like US or US-VA",
      });
    }
    postingJurisdiction = j;
  }

  return {
    payRangeMin: min,
    payRangeMax: max,
    payRangeCurrency: currencyRaw,
    postingJurisdiction,
  };
}

export { formatPayRangeLabel } from "@/lib/recruiting/pay-range-format";
