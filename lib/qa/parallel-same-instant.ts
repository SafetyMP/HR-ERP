/**
 * Launch N concurrent branches synchronized at the same JS microtask instant —
 * use after freezing FakeClock so timestamps collide intentionally when callers stamp `clock.nowMs()`.
 */
export async function parallelDuplicateBarrier<T>(
  count: number,
  fn: (index: number) => Promise<T>,
): Promise<T[]> {
  if (count < 1) return [];
  let release!: () => void;
  const gate = new Promise<void>((r) => {
    release = r;
  });
  const tasks = Array.from({ length: count }, (_, index) =>
    gate.then(() => fn(index)),
  );
  queueMicrotask(() => release());
  return Promise.all(tasks);
}

/**
 * Same as parallelDuplicateBarrier but returns Promise.allSettled for observing partial failures (e.g. one unique violation).
 */
export async function parallelDuplicateBarrierSettled<T>(
  count: number,
  fn: (index: number) => Promise<T>,
): Promise<PromiseSettledResult<T>[]> {
  if (count < 1) return [];
  let release!: () => void;
  const gate = new Promise<void>((r) => {
    release = r;
  });
  const tasks = Array.from({ length: count }, (_, index) =>
    gate.then(() => fn(index)),
  );
  queueMicrotask(() => release());
  return Promise.allSettled(tasks);
}
