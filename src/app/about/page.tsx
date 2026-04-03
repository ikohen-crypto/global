import { Breadcrumbs } from "@/components/breadcrumbs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "About",
  description: "Why GlobalEcon exists and how it turns public macroeconomic data into approachable decision support.",
  path: "/about",
});

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "About" }]} />
      <div className="space-y-6">
        <div>
          <h1 className="font-display text-4xl font-semibold">
            GlobalEcon is designed to make public macro data feel usable.
          </h1>
          <p className="mt-3 max-w-3xl text-muted-foreground">
            Most macro portals are either overwhelming for newcomers or too rigid for fast comparisons.
            This product aims to sit in the middle: trustworthy, educational, and much easier to navigate.
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Principles</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <div>Usability beats clutter.</div>
              <div>Explain every important metric.</div>
              <div>Gracefully handle missing and lagged data.</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Sources</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <div>World Bank Indicators API for time-series economics data.</div>
              <div>REST Countries for metadata such as flags, languages, and regions.</div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
