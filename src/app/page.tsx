import Link from "next/link";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const examples = [
  {
    title: "Jurisdiction-driven payroll intake",
    description: "Select a locality — additional fields hydrate from `/api/mock/jurisdiction-fields`.",
    href: "/examples/jurisdiction",
  },
  {
    title: "Onboarding wizard state",
    description: "Zustand-managed steps with React Query remaining the future system of record.",
    href: "/examples/onboarding",
  },
  {
    title: "Org hierarchy explorer",
    description: "JSON tree mapped to disclosure-based navigation tuned for keyboards and SRs.",
    href: "/examples/org",
  },
  {
    title: "Compensation tables & charts",
    description: "TanStack Table + Recharts interpreting the same sample payload.",
    href: "/examples/reporting",
  },
];

export default function Home() {
  return (
    <div className="flex flex-col flex-1 bg-zinc-50 dark:bg-black">
      <header className="border-b border-zinc-200 bg-white dark:border-zinc-900 dark:bg-zinc-950">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-6 py-14">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-zinc-500">HR ERP Frontend</p>
          <div className="space-y-4">
            <h1 className="text-4xl font-semibold text-zinc-950 dark:text-white">Hide the complexity.</h1>
            <p className="max-w-2xl text-lg text-zinc-600 dark:text-zinc-300">
              This UI layer renders what the payroll and HR platforms authorize—never re-deriving statutes, taxes, or
              jurisdictional outcomes in the browser.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button asChild>
              <Link href="/examples/jurisdiction">Start with payroll fields</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/examples/reporting">View data visualization</Link>
            </Button>
            <Button asChild variant="ghost">
              <Link href="/qa-lab">Open QA Lab</Link>
            </Button>
          </div>
        </div>
      </header>
      <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-6 py-12">
        <section aria-labelledby="examples-heading">
          <h2 id="examples-heading" className="text-2xl font-semibold text-zinc-950 dark:text-white">
            Pattern library & demos
          </h2>
          <ul className="mt-8 grid gap-6 sm:grid-cols-2" role="list">
            {examples.map((demo) => (
              <li key={demo.href} className="list-none">
                <Card className="h-full shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
                  <CardHeader>
                    <CardTitle>{demo.title}</CardTitle>
                    <CardDescription>{demo.description}</CardDescription>
                  </CardHeader>
                  <CardFooter>
                    <Button asChild variant="secondary">
                      <Link href={demo.href}>Open</Link>
                    </Button>
                  </CardFooter>
                </Card>
              </li>
            ))}
          </ul>
        </section>
      </main>
    </div>
  );
}
