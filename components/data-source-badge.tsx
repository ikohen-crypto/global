import { Badge } from "@/components/ui/badge";

export function DataSourceBadge({ source }: { source: string }) {
  return <Badge className="bg-accent text-accent-foreground">{source}</Badge>;
}
