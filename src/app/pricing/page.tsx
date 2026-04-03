import { Breadcrumbs } from "@/components/breadcrumbs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Pricing",
  description: "See what GlobalEcon Premium unlocks for heavier research workflows.",
  path: "/pricing",
});

export default function PricingPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Pricing" }]} />
      <div className="mb-8 max-w-3xl">
        <h1 className="font-display text-4xl font-semibold">Free for exploration. Premium for depth.</h1>
        <p className="mt-3 text-muted-foreground">
          The free experience stays strong. Premium unlocks heavier workflows for classrooms,
          research, and reporting.
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Free</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <div>Compare up to 4 countries</div>
            <div>10-year history by default</div>
            <div>Country pages and public rankings</div>
            <div>Educational explainers and FAQs</div>
          </CardContent>
        </Card>
        <Card className="border-primary/30">
          <CardHeader>
            <CardTitle>Premium-ready</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <div>Up to 6 countries in compare</div>
            <div>20-year, 30-year, and max history</div>
            <div>CSV and PDF exports</div>
            <div>Saved dashboards and no-ads mode</div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
