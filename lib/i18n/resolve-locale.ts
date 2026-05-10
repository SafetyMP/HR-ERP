import { cookies, headers } from "next/headers";

import {
  DEFAULT_LOCALE,
  normalizeLocale,
  pickFromAcceptLanguage,
  type SupportedLocale,
} from "./locales";

export const LOCALE_COOKIE_NAME = "hr_erp_locale";

/**
 * Server-side locale resolution. Order: explicit cookie → Accept-Language → default.
 * Returns one of the values in `SUPPORTED_LOCALES`; never throws.
 */
export async function resolveServerLocale(): Promise<SupportedLocale> {
  try {
    const cookieStore = await cookies();
    const cookieLocale = cookieStore.get(LOCALE_COOKIE_NAME)?.value;
    if (cookieLocale) {
      const resolved = normalizeLocale(cookieLocale);
      if (resolved) return resolved;
    }

    const headerStore = await headers();
    const accept = headerStore.get("accept-language");
    return pickFromAcceptLanguage(accept);
  } catch {
    return DEFAULT_LOCALE;
  }
}
