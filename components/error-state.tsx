import { AlertTriangle } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function ErrorState({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <Card className="border-amber-500/30 bg-amber-50/80 dark:bg-amber-950/30">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <AlertTriangle className="h-4 w-4" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground">{description}</CardContent>
    </Card>
  );
}
