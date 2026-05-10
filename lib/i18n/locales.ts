export const SUPPORTED_LOCALES = [
  "en-US",
  "en-GB",
  "es-ES",
  "es-MX",
  "fr-FR",
  "fr-CA",
  "de-DE",
  "pt-BR",
  "ja-JP",
] as const;

export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number];

export const DEFAULT_LOCALE: SupportedLocale = "en-US";

const ALIASES: Record<string, SupportedLocale> = {
  en: "en-US",
  es: "es-ES",
  fr: "fr-FR",
  de: "de-DE",
  pt: "pt-BR",
  ja: "ja-JP",
};

export function isSupportedLocale(value: string): value is SupportedLocale {
  return (SUPPORTED_LOCALES as readonly string[]).includes(value);
}

export function normalizeLocale(value: string | null | undefined): SupportedLocale {
  if (!value) return DEFAULT_LOCALE;
  const trimmed = value.trim();
  if (!trimmed) return DEFAULT_LOCALE;
  if (isSupportedLocale(trimmed)) return trimmed;
  const lang = trimmed.split(/[-_]/)[0]?.toLowerCase();
  if (lang && ALIASES[lang]) return ALIASES[lang];
  return DEFAULT_LOCALE;
}

/**
 * Picks the first supported locale from an Accept-Language header per RFC 4647 §3.4.
 */
export function pickFromAcceptLanguage(header: string | null): SupportedLocale {
  if (!header) return DEFAULT_LOCALE;
  const parts = header
    .split(",")
    .map((p) => {
      const [tag, qStr] = p.trim().split(";");
      const q = qStr?.startsWith("q=") ? Number(qStr.slice(2)) : 1;
      return { tag: tag?.trim() ?? "", q: Number.isFinite(q) ? q : 0 };
    })
    .filter((p) => p.tag.length > 0)
    .sort((a, b) => b.q - a.q);

  for (const { tag } of parts) {
    if (isSupportedLocale(tag)) return tag;
    const lang = tag.split(/[-_]/)[0]?.toLowerCase();
    if (lang && ALIASES[lang]) return ALIASES[lang];
  }
  return DEFAULT_LOCALE;
}
