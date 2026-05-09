const fmtCache = new Map<string, Intl.DateTimeFormat>();

function getFormatter(locale: string, timeZone: string): Intl.DateTimeFormat {
  const key = `${locale}|${timeZone}`;
  let f = fmtCache.get(key);
  if (!f) {
    f = new Intl.DateTimeFormat(locale, {
      timeZone,
      dateStyle: "medium",
      timeStyle: "short",
    });
    fmtCache.set(key, f);
  }
  return f;
}

/**
 * Displays an absolute instant (`Date` persisted as UTC in Postgres).
 */
export function formatInstantUtc(
  instantUtc: Date,
  viewerTimezone: string,
  locale: string,
): string {
  return getFormatter(locale, viewerTimezone).format(instantUtc);
}

export interface DualTzLabel {

  /** ISO-ish label in viewer TZ */
  viewerLabel: string;
  /** Same instant in counterpart TZ */
  counterpartLabel: string;
}

/** “Your time / Their time” for cross-time-zone surfaces. */
export function formatDualTzPair(
  instantUtc: Date,
  viewerTz: string,
  counterpartTz: string,
  locale: string,
): DualTzLabel {
  return {
    viewerLabel: formatInstantUtc(instantUtc, viewerTz, locale),
    counterpartLabel: formatInstantUtc(instantUtc, counterpartTz, locale),
  };
}
