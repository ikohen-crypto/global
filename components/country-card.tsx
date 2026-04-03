import Image from "next/image";
import Link from "next/link";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatPopulation } from "@/lib/formatters";
import type { CountrySummary } from "@/lib/types";

export function CountryCard({
  country,
  labels,
}: {
  country: CountrySummary;
  labels?: {
    capital: string;
    population: string;
    populationUnavailable: string;
  };
}) {
  const populationLabel =
    country.population != null
      ? formatPopulation(country.population)
      : labels?.populationUnavailable ?? "Population unavailable";

  return (
    <Link href={`/country/${country.slug}`}>
      <Card className="h-full transition hover:-translate-y-0.5 hover:shadow-panel">
        <CardHeader className="flex flex-row items-center gap-4 space-y-0">
          <Image src={country.flagUrl} alt={`${country.name} flag`} width={40} height={28} className="rounded-md border border-border" />
          <div>
            <CardTitle className="text-lg">{country.name}</CardTitle>
            <p className="text-sm text-muted-foreground">{country.region}</p>
          </div>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <div>{labels?.capital ?? "Capital"}: {country.capital}</div>
          <div>{labels?.population ?? "Population"}: {populationLabel}</div>
        </CardContent>
      </Card>
    </Link>
  );
}
