"use client";

import {
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import type { IndicatorPoint } from "@/lib/types";

export function Sparkline({ data }: { data: IndicatorPoint[] }) {
  return (
    <div className="h-16 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <XAxis dataKey="year" hide />
          <YAxis hide domain={["auto", "auto"]} />
          <Tooltip />
          <Line type="monotone" dataKey="value" stroke="#0f766e" dot={false} strokeWidth={2} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
