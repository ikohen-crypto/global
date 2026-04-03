"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  type SortingState,
  createColumnHelper,
} from "@tanstack/react-table";

import { useI18n } from "@/components/i18n-provider";
import { Sparkline } from "@/components/sparkline";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { RankingRow } from "@/lib/types";

const columnHelper = createColumnHelper<RankingRow>();

export function RankingTable({
  rows,
  heading,
}: {
  rows: RankingRow[];
  heading: string;
}) {
  const { messages } = useI18n();
  const [sorting, setSorting] = useState<SortingState>([{ id: "value", desc: true }]);
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
      columnHelper.accessor("formattedValue", {
        header: heading,
      }),
      columnHelper.accessor("latestYear", {
        header: messages.common.latestYear,
      }),
      columnHelper.display({
        id: "sparkline",
        header: messages.common.trend,
        cell: ({ row }) => <Sparkline data={row.original.sparkline} />,
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
        <h2 className="font-display text-2xl font-semibold">{messages.rankings.rankingTable}</h2>
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
                  <td key={cell.id} className="px-4 py-3 align-middle">
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
