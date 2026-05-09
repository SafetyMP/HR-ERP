"use client";

import * as React from "react";

import type { OrgTreeNode } from "@/features/org/sample-org-data";

type Props = Readonly<{ root: OrgTreeNode }>;

/**
 * Accessible org explorer using nested disclosure buttons instead of canvas-only widgets.
 * Swap the inner rendering for react-flow/org-chart libs without changing consumers.
 */
export function OrgChartTree({ root }: Props) {
  return (
    <nav aria-label="Organization structure" className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
      <OrgBranch node={root} depth={0} />
    </nav>
  );
}

function OrgBranch({ node, depth }: Readonly<{ node: OrgTreeNode; depth: number }>) {
  const [open, setOpen] = React.useState(true);
  const hasChildren = Boolean(node.children?.length);

  const padding = Math.min(depth * 16, 96);

  return (
    <div className="space-y-3" style={{ marginLeft: padding }}>
      <div className="flex flex-wrap items-center gap-3">
        {hasChildren ? (
          <button
            type="button"
            aria-expanded={open}
            onClick={() => setOpen((prev) => !prev)}
            className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-zinc-200 text-sm font-semibold hover:bg-zinc-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900 dark:border-zinc-800 dark:hover:bg-zinc-900 dark:focus-visible:outline-zinc-100"
            aria-label={open ? `Collapse ${node.name}` : `Expand ${node.name}`}
          >
            {open ? "−" : "+"}
          </button>
        ) : (
          <span
            className="inline-flex h-8 w-8 shrink-0 items-center justify-center text-zinc-300 dark:text-zinc-700"
            aria-hidden
          >
            •
          </span>
        )}
        <div>
          <p className="text-base font-semibold text-zinc-900 dark:text-zinc-100">{node.name}</p>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">{node.title}</p>
          <p className="text-xs text-zinc-500 dark:text-zinc-500">{node.department}</p>
        </div>
      </div>
      {open && hasChildren ? (
        <ul className="space-y-3 border-l border-dashed border-zinc-300 pl-3 dark:border-zinc-700" role="list">
          {node.children!.map((child) => (
            <li key={child.id} className="list-none">
              <OrgBranch node={child} depth={depth + 1} />
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
