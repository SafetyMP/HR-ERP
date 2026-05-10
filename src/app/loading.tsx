export default function RootLoading() {
  return (
    <main
      role="status"
      aria-live="polite"
      aria-busy="true"
      className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-4 p-8"
    >
      <div className="h-7 w-48 animate-pulse rounded-md bg-zinc-200 dark:bg-zinc-800" />
      <div className="h-4 w-full animate-pulse rounded-md bg-zinc-200 dark:bg-zinc-800" />
      <div className="h-4 w-5/6 animate-pulse rounded-md bg-zinc-200 dark:bg-zinc-800" />
      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="h-32 animate-pulse rounded-lg bg-zinc-200 dark:bg-zinc-800" />
        <div className="h-32 animate-pulse rounded-lg bg-zinc-200 dark:bg-zinc-800" />
      </div>
      <span className="sr-only">Loading…</span>
    </main>
  );
}
