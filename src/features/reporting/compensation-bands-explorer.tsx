"use client";

import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  type SortingState,
  useReactTable,
} from "@tanstack/react-table";
import * as React from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import type { SalaryBandRow } from "@/features/reporting/salary-sample-data";

const columnHelper = createColumnHelper<SalaryBandRow>();

const columns = [
  columnHelper.accessor("grade", {
    header: "Grade",
    cell: (info) => info.getValue(),
  }),
  columnHelper.accessor("currency", {
    header: "CCY",
  }),
  columnHelper.accessor("minimum", {
    header: "Minimum",
    cell: (info) => info.getValue().toLocaleString(undefined, { style: "currency", currency: "USD", maximumFractionDigits: 0 }),
  }),
  columnHelper.accessor("midpoint", {
    header: "Midpoint",
    cell: (info) =>
      info.getValue().toLocaleString(undefined, { style: "currency", currency: "USD", maximumFractionDigits: 0 }),
  }),
  columnHelper.accessor("maximum", {
    header: "Maximum",
    cell: (info) =>
      info.getValue().toLocaleString(undefined, { style: "currency", currency: "USD", maximumFractionDigits: 0 }),
  }),
];

export function CompensationBandsExplorer({ rows }: Readonly<{ rows: SalaryBandRow[] }>) {
  const [sorting, setSorting] = React.useState<SortingState>([{ id: "grade", desc: false }]);

  // TanStack Table's hook intentionally returns unstable function identities; incompatible with React Compiler memoization gates.
  // eslint-disable-next-line react-hooks/incompatible-library -- deliberate: sortable interactive grid
  const table = useReactTable({
    data: rows,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  return (
    <div className="space-y-8">
      <div className="overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-800">
        <table className="min-w-[640px] w-full border-collapse text-left text-sm" aria-label="Salary band table">
          <thead className="bg-zinc-50 dark:bg-zinc-900">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    scope="col"
                    className="border-b px-4 py-2 font-semibold text-zinc-900 dark:border-zinc-800 dark:text-zinc-50"
                    aria-sort={
                      header.isPlaceholder
                        ? undefined
                        : header.column.getIsSorted() === "desc"
                          ? "descending"
                          : header.column.getIsSorted() === "asc"
                            ? "ascending"
                            : "none"
                    }
                  >
                    {header.isPlaceholder ? null : (
                      <button
                        type="button"
                        className="inline-flex w-full items-center justify-between rounded-md px-2 py-1 text-left hover:bg-zinc-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900 dark:hover:bg-zinc-800 dark:focus-visible:outline-zinc-100"
                        onClick={header.column.getToggleSortingHandler()}
                      >
                        <span>{flexRender(header.column.columnDef.header, header.getContext())}</span>
                      </button>
                    )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map((row) => (
              <tr key={row.id} className="odd:bg-white even:bg-zinc-50 dark:odd:bg-zinc-950 dark:even:bg-zinc-900/30">
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className="border-b px-4 py-2 text-zinc-800 dark:border-zinc-900 dark:text-zinc-200">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="h-80 rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
        <p className="mb-4 text-sm text-zinc-600 dark:text-zinc-400" id="band-chart-caption">
          Midpoint trajectory by compensation grade (numbers are illustrative artifacts from mock JSON).
        </p>
        <div className="h-64 focus-within:outline focus-within:outline-2 focus-within:outline-offset-4 focus-within:outline-zinc-400" tabIndex={0} role="img" aria-labelledby="band-chart-caption">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={rows} aria-hidden>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="grade" />
              <YAxis
                aria-hidden
                tickFormatter={(value) =>
                  Intl.NumberFormat(undefined, { notation: "compact", maximumFractionDigits: 1 }).format(value as number)
                }
              />
              <Tooltip
                formatter={(value) =>
                  typeof value === "number" ? value.toLocaleString() : ""
                }
              />
              <Bar dataKey="midpoint" name="Midpoint" fill="#3f3f46" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
