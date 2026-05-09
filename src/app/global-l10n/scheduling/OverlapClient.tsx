"use client";

import { useMemo, useState } from "react";

type Roster = readonly { id: string; email: string }[];

interface OverlapClientProps {
  employeeIds: string[];
  roster: Roster;
}

export default function OverlapClient({
  employeeIds,
  roster,
}: OverlapClientProps) {
  const [viewerTz, setViewerTz] = useState("America/Los_Angeles");
  const [locale] = useState("en-US");
  const [payload, setPayload] = useState<unknown>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const defaultRange = useMemo(() => {
    const start = new Date();
    start.setUTCDate(start.getUTCDate());
    start.setUTCHours(13, 0, 0, 0);
    const end = new Date(start);
    end.setUTCDate(end.getUTCDate() + 7);
    return {
      startIso: start.toISOString(),
      endIso: end.toISOString(),
    };
  }, []);

  async function runOverlap() {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/global-l10n/scheduling/overlap", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          employeeIds,
          rangeStartUtc: defaultRange.startIso,
          rangeEndUtc: defaultRange.endIso,
          viewerTz,
          viewerLocale: locale,
        }),
      });

      const json = (await res.json()) as unknown;

      if (!res.ok) {
        setError(JSON.stringify(json));
        setPayload(null);
      } else {
        setPayload(json);
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "fetch_failed");
      setPayload(null);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-zinc-200 p-6 dark:border-zinc-800">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
          Demo roster
        </h2>
        <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-zinc-700 dark:text-zinc-300">
          {roster.map((p) => (
            <li key={p.id}>
              {p.email}{" "}
              <span className="font-mono text-xs text-zinc-500">({p.id})</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-2xl border border-dashed border-amber-300 bg-amber-50 p-6 text-sm text-amber-950 dark:border-amber-600 dark:bg-amber-950/30 dark:text-amber-100">
        <p className="font-semibold">Async default</p>
        <p className="mt-2">
          Overlap windows are intentionally rare for distributed teams. When
          none exist, fall back to threaded proposals, written decisions, and
          recorded outcomes — not last-minute meetings.
        </p>
      </section>

      <section className="space-y-3 rounded-2xl border border-zinc-200 p-6 dark:border-zinc-800">
        <label className="block text-sm text-zinc-700 dark:text-zinc-300">
          Viewer IANA zone (organizer)
          <input
            value={viewerTz}
            onChange={(e) => setViewerTz(e.target.value)}
            className="mt-1 w-full rounded border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
          />
        </label>

        <button
          type="button"
          onClick={() => void runOverlap()}
          disabled={loading || employeeIds.length === 0}
          className="rounded-full bg-zinc-900 px-5 py-2 text-sm font-medium text-white disabled:opacity-50 dark:bg-white dark:text-zinc-950"
        >
          {loading ? "Computing…" : "Compute overlap (next 7 UTC days)"}
        </button>
      </section>

      {error ? (
        <pre className="overflow-x-auto rounded bg-red-50 p-4 text-xs text-red-900 dark:bg-red-950/40 dark:text-red-100">
          {error}
        </pre>
      ) : null}

      {payload ? (
        <pre className="overflow-x-auto rounded bg-zinc-50 p-4 text-xs text-zinc-800 dark:bg-zinc-950 dark:text-zinc-100">
          {JSON.stringify(payload, null, 2)}
        </pre>
      ) : null}
    </div>
  );
}
