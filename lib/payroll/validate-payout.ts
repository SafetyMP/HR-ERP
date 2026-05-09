import { PayoutSplitMode } from "@/app/generated/prisma/client";

export interface PayoutDraftLine {
  amountMinor: number | null;
  allocationBasisPoints: number | null;
  currencyCode: string | null;
  cryptoAssetId: string | null;
}

export class PayoutValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PayoutValidationError";
  }
}

/** Shared server + client guardrails for multi-currency split rows. */
export function validatePayoutDraft(
  mode: PayoutSplitMode,
  lines: PayoutDraftLine[],
): void {
  if (lines.length === 0) {
    throw new PayoutValidationError("Add at least one payout line.");
  }

  for (const line of lines) {
    const hasFiat = Boolean(line.currencyCode?.trim());
    const hasCrypto = Boolean(line.cryptoAssetId?.trim());
    if (hasFiat && hasCrypto) {
      throw new PayoutValidationError(
        "Each line must use either a fiat ISO currency or a crypto asset id, not both.",
      );
    }
    if (!hasFiat && !hasCrypto) {
      throw new PayoutValidationError(
        "Specify currencyCode (ISO 4217) or cryptoAssetId per line.",
      );
    }
  }

  if (mode === PayoutSplitMode.PERCENT_BASIS_POINTS) {
    let sum = 0;
    for (const line of lines) {
      const bp = line.allocationBasisPoints;
      if (bp == null || bp < 0 || bp > 10000) {
        throw new PayoutValidationError(
          "Percent mode requires allocation basis points (0–10000) on every line.",
        );
      }
      sum += bp;
    }
    if (sum !== 10000) {
      throw new PayoutValidationError(
        `Percent splits must total 10000 basis points (100%); got ${sum}.`,
      );
    }
    return;
  }

  for (const line of lines) {
    if (
      line.amountMinor == null ||
      line.amountMinor < 0 ||
      !Number.isInteger(line.amountMinor)
    ) {
      throw new PayoutValidationError(
        "Fixed-minor-units mode requires a non-negative integer amountMinor on every line.",
      );
    }
  }
}
