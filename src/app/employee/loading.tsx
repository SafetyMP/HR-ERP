export default function EmployeeAreaLoading() {
  return (
    <main
      role="status"
      aria-live="polite"
      aria-busy="true"
      className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-4 p-8"
    >
      <div className="h-8 w-64 animate-pulse rounded-md bg-zinc-200 dark:bg-zinc-800" />
      <div className="h-32 animate-pulse rounded-lg bg-zinc-200 dark:bg-zinc-800" />
      <div className="h-48 animate-pulse rounded-lg bg-zinc-200 dark:bg-zinc-800" />
      <span className="sr-only">Loading employee workspace…</span>
    </main>
  );
}
