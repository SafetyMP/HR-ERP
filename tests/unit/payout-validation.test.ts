import assert from "node:assert/strict";
import { describe, it } from "vitest";

import { PayoutSplitMode } from "@/app/generated/prisma/client";

import {
  PayoutValidationError,
  validatePayoutDraft,
} from "@/lib/payroll/validate-payout";

describe("validatePayoutDraft", () => {
  it("accepts 50/50 percent split with fiat + crypto legs", () => {
    validatePayoutDraft(PayoutSplitMode.PERCENT_BASIS_POINTS, [
      {
        amountMinor: null,
        allocationBasisPoints: 5000,
        currencyCode: "USD",
        cryptoAssetId: null,
      },
      {
        amountMinor: null,
        allocationBasisPoints: 5000,
        currencyCode: null,
        cryptoAssetId: "ethereum:USDC",
      },
    ]);
  });

  it("rejects percent totals that are not 10000 bp", () => {
    assert.throws(
      () =>
        validatePayoutDraft(PayoutSplitMode.PERCENT_BASIS_POINTS, [
          {
            amountMinor: null,
            allocationBasisPoints: 5000,
            currencyCode: "USD",
            cryptoAssetId: null,
          },
          {
            amountMinor: null,
            allocationBasisPoints: 4000,
            currencyCode: null,
            cryptoAssetId: "ethereum:USDC",
          },
        ]),
      PayoutValidationError,
    );
  });

  it("requires amountMinor rows in FIXED_MINOR_UNITS mode", () => {
    assert.throws(
      () =>
        validatePayoutDraft(PayoutSplitMode.FIXED_MINOR_UNITS, [
          {
            amountMinor: null,
            allocationBasisPoints: null,
            currencyCode: "USD",
            cryptoAssetId: null,
          },
        ]),
      PayoutValidationError,
    );
  });
});
