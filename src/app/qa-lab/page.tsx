type Props = {
  searchParams?: Promise<{ scenarioId?: string }>;
};

export default async function QaLabPage(props: Props) {
  const sp = props.searchParams ? await props.searchParams : {};
  const scenarioId = sp.scenarioId ?? "none";

  return (
    <main data-qa-root data-qa-scenario={scenarioId} className="p-8">
      <h1 className="text-xl font-semibold">QA Lab</h1>
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        Fixture correlation surface — pass <code className="font-mono">?scenarioId=</code> from tests.
      </p>
      <p data-testid="scenario-label" className="mt-4 font-mono text-lg">
        {scenarioId}
      </p>
    </main>
  );
}
