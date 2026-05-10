export default function ManagerAreaLoading() {
  return (
    <main
      role="status"
      aria-live="polite"
      aria-busy="true"
      className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-4 p-8"
    >
      <div className="h-8 w-72 animate-pulse rounded-md bg-zinc-200 dark:bg-zinc-800" />
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="h-40 animate-pulse rounded-lg bg-zinc-200 dark:bg-zinc-800" />
        <div className="h-40 animate-pulse rounded-lg bg-zinc-200 dark:bg-zinc-800" />
      </div>
      <span className="sr-only">Loading manager workspace…</span>
    </main>
  );
}
