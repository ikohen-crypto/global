"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  type SortingState,
  useReactTable,
} from "@tanstack/react-table";

import { useI18n } from "@/components/i18n-provider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { FinancialRankingRow } from "@/lib/types";

const columnHelper = createColumnHelper<FinancialRankingRow>();

export function FinancialRankingTable({
  rows,
  heading,
}: {
  rows: FinancialRankingRow[];
  heading: string;
}) {
  const { messages } = useI18n();
  const [sorting, setSorting] = useState<SortingState>([{ id: "score", desc: true }]);
  const [rowLimit, setRowLimit] = useState("20");

  const columns = useMemo(
    () => [
      columnHelper.display({
        id: "country",
        header: messages.common.country,
        cell: ({ row }) => (
          <Link href={`/country/${row.original.country.slug}`} className="font-medium hover:text-primary">
            {row.original.country.name}
          </Link>
        ),
      }),
      columnHelper.accessor("formattedScore", {
        id: "score",
        header: heading,
      }),
      columnHelper.accessor("latestPeriodLabel", {
        header: messages.rankings.latestPeriod,
      }),
      columnHelper.accessor("summary", {
        header: messages.rankings.why,
        cell: ({ getValue }) => <span className="text-muted-foreground">{getValue()}</span>,
      }),
    ],
    [heading, messages],
  );

  const table = useReactTable({
    data: rows.slice(0, Number(rowLimit)),
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-2xl font-semibold">{messages.rankings.financialTable}</h2>
        <div className="w-28">
          <Select value={rowLimit} onValueChange={setRowLimit}>
            <SelectTrigger>
              <SelectValue placeholder={messages.rankings.rowsLabel} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="10">{messages.rankings.rows.top10}</SelectItem>
              <SelectItem value="20">{messages.rankings.rows.top20}</SelectItem>
              <SelectItem value="50">{messages.rankings.rows.top50}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="overflow-hidden rounded-2xl border border-border">
        <table className="w-full text-left text-sm">
          <thead className="bg-muted/50">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th key={header.id} className="px-4 py-3 font-medium">
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map((row) => (
              <tr key={row.id} className="border-t border-border">
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className="px-4 py-3 align-top">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
