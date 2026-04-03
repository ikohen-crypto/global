import Link from "next/link";
import { notFound } from "next/navigation";

import { Breadcrumbs } from "@/components/breadcrumbs";
import { FAQSection } from "@/components/faq-section";
import { NewsSection } from "@/components/news-section";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getIndicatorFaqs } from "@/lib/content/explainers";
import { allIndicators } from "@/lib/indicators/registry";
import { getServerLocale } from "@/lib/i18n/server";
import { getNewsByIndicator } from "@/lib/news/rss";
import { buildFaqJsonLd, buildMetadata } from "@/lib/seo";
import { toKebabCase } from "@/lib/utils";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ indicator: string }>;
}) {
  const { indicator } = await params;
  return buildMetadata({
    title: `What is ${indicator.replaceAll("-", " ")}? Meaning, interpretation, and country data`,
    description: `Learn what ${indicator.replaceAll("-", " ")} means, why it matters, and how to compare countries on this metric.`,
    path: `/indicator/${indicator}`,
  });
}

export default async function IndicatorPage({
  params,
}: {
  params: Promise<{ indicator: string }>;
}) {
  const locale = await getServerLocale();
  const isEs = locale === "es";
  const { indicator } = await params;
  const definitionData = allIndicators.find((item) => toKebabCase(item.id) === indicator);
  if (!definitionData) notFound();
  const definition = definitionData;

  const faqs = getIndicatorFaqs(definition.id);
  const newsItems = await getNewsByIndicator(definition.id);
  const faqJsonLd = buildFaqJsonLd(faqs);

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <Breadcrumbs
        items={[
          { label: isEs ? "Inicio" : "Home", href: "/" },
          { label: isEs ? "Indicadores" : "Indicators" },
          { label: definition.shortLabel },
        ]}
      />
      <div className="mb-8 max-w-3xl">
        <h1 className="font-display text-4xl font-semibold">{definition.shortLabel}</h1>
        <p className="mt-3 text-muted-foreground">{definition.description}</p>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>{isEs ? "Por que importa" : "Why it matters"}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">{definition.interpretation}</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>{isEs ? "Caveats" : "Caveats"}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">{definition.caveats}</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>{isEs ? "Perfil de rezago" : "Lag profile"}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">{definition.lagNote}</CardContent>
        </Card>
      </div>
      <div className="mt-8 rounded-[2rem] border border-border bg-card p-6">
        <h2 className="font-display text-2xl font-semibold">{isEs ? "Adonde seguir" : "Where to go next"}</h2>
        <div className="mt-4 flex flex-wrap gap-3 text-sm">
          <Link href={`/rankings/${indicator}`} className="rounded-full border border-border px-4 py-2">
            {isEs ? "Rankings globales" : "Global rankings"}
          </Link>
          <Link href="/compare" className="rounded-full border border-border px-4 py-2">
            {isEs ? "Comparar paises" : "Compare countries"}
          </Link>
          <Link href="/learn" className="rounded-full border border-border px-4 py-2">
            {isEs ? "Centro de aprendizaje" : "Learn center"}
          </Link>
        </div>
      </div>
      <section className="mt-10">
        <NewsSection
          title={isEs ? "Noticias relacionadas" : "Related news"}
          description={
            isEs
              ? "Titulares macro que ayudan a interpretar esta metrica dentro de decisiones de inversion."
              : "Macro headlines that help interpret this metric in an investment context."
          }
          items={newsItems.slice(0, 4)}
          locale={locale}
        />
      </section>
      <section className="mt-10">
        <FAQSection
          items={faqs}
          title={isEs ? "Preguntas frecuentes" : "FAQs"}
          description={
            isEs
              ? "Respuestas practicas a las preguntas mas comunes sobre esta metrica."
              : "Practical answers to the most common questions about this metric."
          }
        />
      </section>
    </div>
  );
}
