import { Lightbulb } from "lucide-react";

import { useI18n } from "@/components/i18n-provider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Insight } from "@/lib/types";

export function CompareSummary({ insights }: { insights: Insight[] }) {
  const { messages } = useI18n();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Lightbulb className="h-5 w-5 text-primary" />
          {messages.compareSummary.title}
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          {messages.compareSummary.body}
        </p>
      </CardHeader>
      <CardContent className="grid gap-4 md:grid-cols-2">
        {insights.map((insight) => (
          <div key={insight.id} className="rounded-2xl border border-border bg-background/70 p-4">
            <div className="font-medium">{insight.title}</div>
            <p className="mt-2 text-sm text-muted-foreground">{insight.body}</p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
