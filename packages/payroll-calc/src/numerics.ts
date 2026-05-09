/** Rounding semantics for snapping rational payroll intermediates into minor currency units. */
export type RoundingMode = "half_up" | "half_even" | "down" | "up";

/** Immutable reduced non-negative rational p/q supporting exact intermediate ratios. */
export class Rational {
  readonly numerator: bigint;
  readonly denominator: bigint;

  constructor(numerator: bigint, denominator: bigint) {
    if (denominator === 0n) {
      throw new RangeError("Rational: denominator cannot be zero");
    }
    const sign =
      numerator < 0n && denominator > 0n
        ? -1n
        : numerator > 0n && denominator < 0n
          ? -1n
          : 1n;
    const nn = numerator < 0n ? -numerator : numerator;
    const dd = denominator < 0n ? -denominator : denominator;
    const g = gcd(nn, dd);
    const rn = sign * (nn / g);
    const rd = dd / g;
    this.numerator = rn;
    this.denominator = rd;
  }

  mul(other: Rational): Rational {
    return new Rational(this.numerator * other.numerator, this.denominator * other.denominator);
  }

  add(other: Rational): Rational {
    const n =
      this.numerator * other.denominator +
      other.numerator * this.denominator;
    return new Rational(n, this.denominator * other.denominator);
  }

  static zero(): Rational {
    return new Rational(0n, 1n);
  }

  /** Every rational has a terminating decimal expansion in bigint minor units limited by denominator factors 2 & 5 only.
   * For payroll we keep rationals conservative; snapping is always explicit via `multiplyMoneyMinor`. */
  static fromInteger(n: bigint): Rational {
    return new Rational(n, 1n);
  }

  invert(): Rational {
    if (this.numerator === 0n) {
      throw new RangeError("invert: numerator is zero");
    }
    return new Rational(this.denominator, this.numerator);
  }
}

export function gcd(a: bigint, b: bigint): bigint {
  let x = a < 0n ? -a : a;
  let y = b < 0n ? -b : b;
  while (y !== 0n) {
    const t = y;
    y = x % y;
    x = t;
  }
  return x === 0n ? 1n : x;
}

export interface CanonicalMoney {
  /** ISO 4217 (e.g. USD). Engine is intentionally currency-agnostic. */
  readonly currencyCode: string;
  /** Minor units scale (USD → 2). */
  readonly scale: number;
  /** Amount in minor units (e.g., cents). */
  readonly minor: bigint;
}

export function zeroMoney(currencyCode: string, scale: number): CanonicalMoney {
  validateCurrencyScale(currencyCode, scale);
  return { currencyCode, scale, minor: 0n };
}

export function moneyFromMinor(parts: Omit<CanonicalMoney, "minor"> & { minor: bigint }): CanonicalMoney {
  validateCurrencyScale(parts.currencyCode, parts.scale);
  return {
    currencyCode: parts.currencyCode,
    scale: parts.scale,
    minor: parts.minor,
  };
}

export function assertSameCurrencyMoney(a: CanonicalMoney, b: CanonicalMoney): void {
  if (a.currencyCode !== b.currencyCode || a.scale !== b.scale) {
    throw new TypeError(`Currency mismatch ${a.currencyCode}/${a.scale} vs ${b.currencyCode}/${b.scale}`);
  }
}

export function moneyAdd(a: CanonicalMoney, b: CanonicalMoney): CanonicalMoney {
  assertSameCurrencyMoney(a, b);
  return moneyFromMinor({ currencyCode: a.currencyCode, scale: a.scale, minor: a.minor + b.minor });
}

export function moneyNeg(a: CanonicalMoney): CanonicalMoney {
  return moneyFromMinor({ currencyCode: a.currencyCode, scale: a.scale, minor: -a.minor });
}

export function moneySubtract(a: CanonicalMoney, b: CanonicalMoney): CanonicalMoney {
  return moneyAdd(a, moneyNeg(b));
}

/** Multiply integer minor-by-rational rounding once into integer minor units. */
export function multiplyMoneyMinor(amount: CanonicalMoney, factor: Rational, mode: RoundingMode): CanonicalMoney {
  if (factor.numerator === 0n) {
    return moneyFromMinor({ currencyCode: amount.currencyCode, scale: amount.scale, minor: 0n });
  }
  const prod = amount.minor * factor.numerator;
  return moneyFromMinor({
    currencyCode: amount.currencyCode,
    scale: amount.scale,
    minor: divideAndRoundSigned(prod, factor.denominator, mode),
  });
}

/** Divide two integer minor amounts as rate `numeratorDenominatorRational` rounding once — used for withholding rates. */
export function applyRationalRate(baseMinor: bigint, rateNumerator: bigint, rateDenominator: bigint, mode: RoundingMode): bigint {
  if (rateDenominator === 0n) {
    throw new RangeError("rateDenominator is zero");
  }
  const prod = baseMinor * rateNumerator;
  return divideAndRoundSigned(prod, rateDenominator, mode);
}

function validateCurrencyScale(currencyCode: string, scale: number): void {
  if (!/^[A-Z]{3}$/.test(currencyCode)) {
    throw new TypeError(`currencyCode must be ISO 4217 ALPHA-3 uppercase, received ${JSON.stringify(currencyCode)}`);
  }
  if (!Number.isInteger(scale) || scale < 0 || scale > 18) {
    throw new TypeError(`scale must be integer 0..18, received ${scale}`);
  }
}

function divideAndRoundSigned(numerator: bigint, denominator: bigint, mode: RoundingMode): bigint {
  const sign =
    numerator < 0n && denominator > 0n
      ? -1n
      : numerator > 0n && denominator < 0n
        ? -1n
        : 1n;
  const a = numerator < 0n ? -numerator : numerator;
  const d = denominator < 0n ? -denominator : denominator;
  const q = a / d;
  const rem = a % d;
  if (rem === 0n) {
    return sign * q;
  }
  switch (mode) {
    case "down": {
      return sign * q;
    }
    case "up": {
      return sign * (q + 1n);
    }
    case "half_up": {
      const twiceRem = rem * 2n;
      if (twiceRem >= d) return sign * (q + 1n);
      return sign * q;
    }
    case "half_even": {
      const twiceRem = rem * 2n;
      if (twiceRem > d || (twiceRem === d && q % 2n === 1n)) {
        return sign * (q + 1n);
      }
      return sign * q;
    }
    default: {
      const _exhaustive: never = mode;
      throw new Error(`Unhandled rounding ${_exhaustive}`);
    }
  }
}
