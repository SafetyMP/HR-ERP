"use client";

import { createContext, useContext, useMemo } from "react";

import {
  type SupportedLocale,
  DEFAULT_LOCALE,
  normalizeLocale,
} from "./locales";
import { translate, type MessageKey } from "./messages";

interface LocaleContextShape {
  locale: SupportedLocale;
  t: (key: MessageKey) => string;
}

const LocaleContext = createContext<LocaleContextShape>({
  locale: DEFAULT_LOCALE,
  t: (key) => translate(DEFAULT_LOCALE, key),
});

export function LocaleProvider({
  locale,
  children,
}: {
  locale: SupportedLocale | string;
  children: React.ReactNode;
}) {
  const normalized = normalizeLocale(locale);
  const value = useMemo<LocaleContextShape>(() => {
    return {
      locale: normalized,
      t: (key) => translate(normalized, key),
    };
  }, [normalized]);

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale(): LocaleContextShape {
  return useContext(LocaleContext);
}
