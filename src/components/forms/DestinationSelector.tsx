import { useMemo } from "react";

import { Badge } from "@/components/ui/Badge";
import { Panel } from "@/components/ui/Panel";
import { useLocale } from "@/hooks/useLocale";
import { useTravelBudgetWorkspace } from "@/hooks/useTravelBudgetWorkspace";
import type { DestinationOption } from "@/types";

function ResultCard({
  destination,
  actionLabel,
  onAction
}: {
  destination: DestinationOption;
  actionLabel: string;
  onAction(): void;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white px-3 py-3 text-left text-sm dark:border-stone-800 dark:bg-stone-900">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-semibold text-pine dark:text-stone-100">{destination.cityName}</p>
          <p className="mt-1 text-xs text-slate-500 dark:text-stone-400">{destination.countryName}</p>
        </div>
        <Badge tone="neutral">{destination.iataCode ?? "IATA"}</Badge>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={onAction}
          className="rounded-full bg-pine px-3 py-2 text-xs font-semibold text-white transition hover:opacity-95"
        >
          {actionLabel}
        </button>
      </div>
    </div>
  );
}

function DestinationChip({
  destination,
  onRemove
}: {
  destination: DestinationOption;
  onRemove(): void;
}) {
  return (
    <button
      type="button"
      onClick={onRemove}
      className="inline-flex items-center gap-2 rounded-full bg-pine px-3 py-2 text-xs font-semibold text-white transition hover:opacity-95"
    >
      <span>{destination.cityName}</span>
      <span aria-hidden="true">x</span>
    </button>
  );
}

function normalizeQuery(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

function pickFeaturedDestination(results: DestinationOption[], query: string): DestinationOption | undefined {
  if (results.length === 0) {
    return undefined;
  }

  const normalizedQuery = normalizeQuery(query);
  if (!normalizedQuery) {
    return results[0];
  }

  const exactMatch = results.find((destination) => {
    const label = normalizeQuery(destination.label);
    const city = normalizeQuery(destination.cityName);
    const country = normalizeQuery(destination.countryName);
    const iata = destination.iataCode?.trim().toLowerCase();
    return label === normalizedQuery || city === normalizedQuery || country === normalizedQuery || iata === normalizedQuery;
  });

  if (exactMatch) {
    return exactMatch;
  }

  const partialMatch = results.find((destination) => {
    const haystack = [destination.label, destination.cityName, destination.countryName, destination.iataCode ?? ""]
      .join(" ")
      .toLowerCase();
    return haystack.includes(normalizedQuery);
  });

  return partialMatch ?? results[0];
}

export function DestinationSelector() {
  const { language } = useLocale();
  const {
    originQuery,
    setOriginQuery,
    originSearchStatus,
    originSearchResults,
    originSearchError,
    destinationQuery,
    setDestinationQuery,
    destinationSearchStatus,
    destinationSearchResults,
    destinationSearchError,
    draftInput,
    setOrigin,
    setDestinations
  } = useTravelBudgetWorkspace();

  const originResults = useMemo(() => Array.from(new Map(originSearchResults.destinations.map((d) => [d.id, d])).values()), [originSearchResults.destinations]);
  const destinationResults = useMemo(() => Array.from(new Map(destinationSearchResults.destinations.map((d) => [d.id, d])).values()), [destinationSearchResults.destinations]);
  const featuredDestination = useMemo(
    () => pickFeaturedDestination(destinationResults, destinationQuery),
    [destinationResults, destinationQuery]
  );

  function addDestination(destination: DestinationOption) {
    const next = draftInput.destinations.some((item) => item.id === destination.id)
      ? draftInput.destinations
      : [...draftInput.destinations, destination];
    setDestinations(next);
  }

  function removeDestination(id: string) {
    setDestinations(draftInput.destinations.filter((destination) => destination.id !== id));
  }

  function isSelectedDestination(destinationId: string) {
    return draftInput.destinations.some((destination) => destination.id === destinationId);
  }

  return (
    <Panel
      title={language === "es" ? "Origen y destinos" : "Origin and destinations"}
      subtitle={
        language === "es"
          ? "Usa un buscador para elegir el origen y otro independiente para sumar uno o varios destinos."
          : "Use one search box for the origin and another independent one to add one or more destinations."
      }
    >
      <div className="grid gap-6 xl:grid-cols-2">
        <section className="space-y-4">
          <div className="soft-card p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400 dark:text-stone-500">
                  {language === "es" ? "Origen actual" : "Current origin"}
                </p>
                <p className="mt-2 text-base font-semibold text-pine dark:text-stone-100">{draftInput.origin.cityName}</p>
                <p className="text-sm text-slate-500 dark:text-stone-400">{draftInput.origin.countryName}</p>
              </div>
              <Badge tone="info">{draftInput.origin.iataCode ?? "IATA"}</Badge>
            </div>
          </div>

          <label className="space-y-2">
            <span className="text-xs uppercase tracking-[0.2em] text-slate-400 dark:text-stone-500">
              {language === "es" ? "Buscar origen" : "Search origin"}
            </span>
            <input value={originQuery} onChange={(event) => setOriginQuery(event.target.value)} placeholder={language === "es" ? "Madrid, JFK, Japón..." : "Madrid, JFK, Japan..."} className="field-control" />
          </label>

          <div className="soft-card p-4">
            <div className="mb-3 flex items-center justify-between gap-3">
              <p className="text-sm font-semibold text-pine dark:text-stone-100">
                {language === "es" ? "Resultados para origen" : "Origin results"}
              </p>
              <Badge tone={originSearchStatus === "success" ? "success" : originSearchStatus === "error" ? "danger" : originSearchStatus === "loading" ? "info" : "neutral"}>
                {originSearchStatus === "success" ? (language === "es" ? "listo" : "ready") : originSearchStatus === "error" ? "error" : originSearchStatus === "loading" ? (language === "es" ? "buscando" : "searching") : (language === "es" ? "esperando" : "idle")}
              </Badge>
            </div>
            {originSearchError ? <p className="mb-3 text-sm text-rose-600">{originSearchError}</p> : null}
            {originResults.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-300 px-4 py-6 text-sm text-slate-500 dark:border-stone-700 dark:text-stone-400">
                {originQuery.trim()
                  ? language === "es"
                    ? "No encontramos resultados para ese origen."
                    : "We couldn't find results for that origin."
                  : originSearchResults.limitations[0]}
              </div>
            ) : (
              <div className="grid gap-2 sm:grid-cols-2">
                {originResults.map((destination) => (
                  <ResultCard
                    key={destination.id}
                    destination={destination}
                    actionLabel={draftInput.origin.id === destination.id ? (language === "es" ? "Origen actual" : "Current origin") : language === "es" ? "Seleccionar origen" : "Select origin"}
                    onAction={() => setOrigin(destination)}
                  />
                ))}
              </div>
            )}
          </div>
        </section>

        <section className="space-y-4">
          <div className="soft-card p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400 dark:text-stone-500">
              {language === "es" ? "Destinos seleccionados" : "Selected destinations"}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {draftInput.destinations.length > 0 ? (
                draftInput.destinations.map((destination) => (
                  <DestinationChip key={destination.id} destination={destination} onRemove={() => removeDestination(destination.id)} />
                ))
              ) : (
                <p className="text-sm text-slate-500 dark:text-stone-400">
                  {language === "es" ? "Todavía no agregaste destinos." : "You haven't added destinations yet."}
                </p>
              )}
            </div>
          </div>

          <label className="space-y-2">
            <span className="text-xs uppercase tracking-[0.2em] text-slate-400 dark:text-stone-500">
              {language === "es" ? "Buscar destinos" : "Search destinations"}
            </span>
            <input value={destinationQuery} onChange={(event) => setDestinationQuery(event.target.value)} placeholder={language === "es" ? "Roma, Cancún, Tokyo..." : "Rome, Cancun, Tokyo..."} className="field-control" />
          </label>

          <div className="soft-card p-4">
            <div className="mb-3 flex items-center justify-between gap-3">
              <p className="text-sm font-semibold text-pine dark:text-stone-100">
                {language === "es" ? "Resultados para destinos" : "Destination results"}
              </p>
              <Badge tone={destinationSearchStatus === "success" ? "success" : destinationSearchStatus === "error" ? "danger" : destinationSearchStatus === "loading" ? "info" : "neutral"}>
                {destinationSearchStatus === "success" ? (language === "es" ? "listo" : "ready") : destinationSearchStatus === "error" ? "error" : destinationSearchStatus === "loading" ? (language === "es" ? "buscando" : "searching") : (language === "es" ? "esperando" : "idle")}
              </Badge>
            </div>
            {destinationSearchError ? <p className="mb-3 text-sm text-rose-600">{destinationSearchError}</p> : null}
            {destinationResults.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-300 px-4 py-6 text-sm text-slate-500 dark:border-stone-700 dark:text-stone-400">
                {destinationQuery.trim()
                  ? language === "es"
                    ? "No encontramos resultados para ese destino."
                    : "We couldn't find results for that destination."
                  : destinationSearchResults.limitations[0]}
              </div>
            ) : (
              <div className="space-y-3">
                <div className="text-xs uppercase tracking-[0.2em] text-slate-400 dark:text-stone-500">
                  {language === "es" ? "Mejor coincidencia" : "Best match"}
                </div>
                {featuredDestination ? (
                  <ResultCard
                    key={featuredDestination.id}
                    destination={featuredDestination}
                    actionLabel={isSelectedDestination(featuredDestination.id) ? (language === "es" ? "Ya agregado" : "Already added") : language === "es" ? "Agregar destino" : "Add destination"}
                    onAction={() => addDestination(featuredDestination)}
                  />
                ) : null}
              </div>
            )}
          </div>
        </section>
      </div>
    </Panel>
  );
}
