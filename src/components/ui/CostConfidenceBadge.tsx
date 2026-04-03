import { Badge } from "@/components/ui/Badge";
import { useLocale } from "@/hooks/useLocale";
import { getConfidenceLabel, getSourceLabel } from "@/utils/presentation";
import type { DataSourceType, PriceConfidence } from "@/types";

export function CostConfidenceBadge({
  confidence,
  sourceType
}: {
  confidence: PriceConfidence;
  sourceType: DataSourceType;
}) {
  const { language } = useLocale();
  const tone =
    sourceType === "api"
      ? "success"
      : sourceType === "manual"
        ? "accent"
        : sourceType === "mock"
          ? "warning"
          : confidence === "high"
            ? "info"
            : "neutral";

  return (
    <Badge tone={tone}>
      {`${getSourceLabel(sourceType, language)} · ${getConfidenceLabel(confidence, language)}`}
    </Badge>
  );
}
