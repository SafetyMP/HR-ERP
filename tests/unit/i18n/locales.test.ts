import { describe, expect, it } from "vitest";

import {
  DEFAULT_LOCALE,
  isSupportedLocale,
  normalizeLocale,
  pickFromAcceptLanguage,
} from "@/lib/i18n/locales";
import { translate } from "@/lib/i18n/messages";

describe("locales", () => {
  it("treats supported tags as-is", () => {
    expect(isSupportedLocale("en-US")).toBe(true);
    expect(isSupportedLocale("es-MX")).toBe(true);
  });

  it("normalizes language-only tags via aliases", () => {
    expect(normalizeLocale("en")).toBe("en-US");
    expect(normalizeLocale("es")).toBe("es-ES");
    expect(normalizeLocale("ja_JP")).toBe("ja-JP");
  });

  it("falls back to default for unknown tags", () => {
    expect(normalizeLocale("xx-YY")).toBe(DEFAULT_LOCALE);
    expect(normalizeLocale(null)).toBe(DEFAULT_LOCALE);
  });

  it("respects q-weighted accept-language preferences", () => {
    expect(pickFromAcceptLanguage("fr-FR;q=0.9,en;q=0.4")).toBe("fr-FR");
    expect(pickFromAcceptLanguage("fr;q=0.9,en;q=0.4")).toBe("fr-FR");
  });

  it("returns default when accept-language is empty", () => {
    expect(pickFromAcceptLanguage(null)).toBe(DEFAULT_LOCALE);
  });
});

describe("translate", () => {
  it("returns localized string for supported keys", () => {
    expect(translate("es-ES", "common.loading")).toBe("Cargando…");
    expect(translate("ja-JP", "paystub.title")).toBe("最新の給与明細");
  });

  it("falls back to default locale when key missing in target", () => {
    expect(translate("ja-JP", "common.error.title")).toBeTypeOf("string");
  });
});
