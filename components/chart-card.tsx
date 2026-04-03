"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { useI18n } from "@/components/i18n-provider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type ChartRow = {
  year: number;
  [key: string]: string | number | null;
};

export function ChartCard({
  title,
  data,
  seriesKeys,
  type = "line",
}: {
  title: string;
  data: ChartRow[];
  seriesKeys: Array<{ key: string; color: string }>;
  type?: "line" | "bar";
}) {
  const Chart = type === "bar" ? BarChart : LineChart;
  const hasRenderableSeries = seriesKeys.length > 0 && data.length > 0;
  const { messages } = useI18n();

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="h-[320px]">
        {hasRenderableSeries ? (
          <ResponsiveContainer width="100%" height="100%">
            <Chart data={data}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
              <XAxis dataKey="year" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Legend />
              {seriesKeys.map((series) =>
                type === "bar" ? (
                  <Bar key={series.key} dataKey={series.key} fill={series.color} radius={[8, 8, 0, 0]} />
                ) : (
                  <Line
                    key={series.key}
                    type="monotone"
                    dataKey={series.key}
                    stroke={series.color}
                    strokeWidth={2.5}
                    dot={false}
                  />
                ),
              )}
            </Chart>
          </ResponsiveContainer>
        ) : (
          <div className="flex h-full items-center justify-center rounded-2xl border border-dashed border-border bg-muted/10 px-6 text-center text-sm text-muted-foreground">
            {messages.chart.noSeries}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
