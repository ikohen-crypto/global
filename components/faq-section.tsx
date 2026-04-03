import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { FaqItem } from "@/lib/types";

export function FAQSection({
  items,
  title = "FAQs",
  description = "Practical answers to the most common questions about this data.",
}: {
  items: FaqItem[];
  title?: string;
  description?: string;
}) {
  return (
    <section className="space-y-4">
      <div>
        <h2 className="font-display text-2xl font-semibold">{title}</h2>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      <div className="grid gap-4">
        {items.map((item) => (
          <Card key={item.question}>
            <CardHeader>
              <CardTitle className="text-lg">{item.question}</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">{item.answer}</CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
