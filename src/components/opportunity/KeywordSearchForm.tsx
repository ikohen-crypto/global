import { useEffect, useState, type FormEvent } from "react";

import { getCountryList } from "@/services/apis/referenceApi";
import type { CountryReference } from "@/types";

interface KeywordSearchFormProps {
  initialValue?: string;
  initialGeo?: string;
  onSubmit(keyword: string, geo: string): void;
  onExampleClick?(keyword: string): void;
  compact?: boolean;
}

const examples = ["fitness en casa", "AI for lawyers", "dropshipping mascotas", "meal prep vegano"];
const DEFAULT_GEO = "US";

export function KeywordSearchForm({
  initialValue = "",
  initialGeo = DEFAULT_GEO,
  onSubmit,
  onExampleClick,
  compact = false
}: KeywordSearchFormProps) {
  const [keyword, setKeyword] = useState(initialValue);
  const [geo, setGeo] = useState(initialGeo);
  const [countryQuery, setCountryQuery] = useState("");
  const [countries, setCountries] = useState<CountryReference[]>([]);
  const [loadingCountries, setLoadingCountries] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setKeyword(initialValue);
  }, [initialValue]);

  useEffect(() => {
    setGeo(initialGeo || DEFAULT_GEO);
  }, [initialGeo]);

  useEffect(() => {
    let cancelled = false;

    async function loadCountries() {
      setLoadingCountries(true);

      try {
        const countryList = await getCountryList();
        if (!cancelled) {
          setCountries(countryList);
        }
      } catch {
        if (!cancelled) {
          setCountries([]);
        }
      } finally {
        if (!cancelled) {
          setLoadingCountries(false);
        }
      }
    }

    void loadCountries();

    return () => {
      cancelled = true;
    };
  }, []);

  const filteredCountries =
    countryQuery.trim().length === 0
      ? countries
      : countries.filter((country) => {
          const haystack = `${country.countryName} ${country.countryCode} ${country.region ?? ""} ${country.subregion ?? ""}`.toLowerCase();
          return haystack.includes(countryQuery.trim().toLowerCase());
        });

  const selectedCountry =
    countries.find((country) => country.countryCode === geo) ??
    (geo ? { countryCode: geo, countryName: geo } : null);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextKeyword = keyword.trim();

    if (!nextKeyword) {
      setError("Escribe un keyword o nicho para comenzar.");
      return;
    }

    if (nextKeyword.length < 2) {
      setError("Necesitamos un termino un poco mas especifico para generar una lectura util.");
      return;
    }

    setError("");
    onSubmit(nextKeyword, geo);
  }

  return (
    <div className={`space-y-4 ${compact ? "" : "max-w-5xl"}`}>
      {!compact ? (
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-[0.24em] text-slate-400 dark:text-stone-500">
            Start scan
          </p>
          <h2 className="font-display text-2xl font-bold tracking-tight text-pine dark:text-stone-100 sm:text-3xl">
            Analiza un nicho y descubre si hay oportunidad real
          </h2>
          <p className="max-w-3xl text-sm leading-6 text-slate-600 dark:text-stone-300">
            Escribe una idea amplia o un subnicho. El pais define el mercado de Google Trends que vamos a leer.
          </p>
        </div>
      ) : null}

      <form onSubmit={handleSubmit} className="card-surface space-y-4 p-5 sm:p-6">
        <div className="grid gap-3 lg:grid-cols-[1fr_0.72fr_auto]">
          <label className="space-y-2">
            <span className="text-xs uppercase tracking-[0.2em] text-slate-400 dark:text-stone-500">
              Keyword o nicho
            </span>
            <input
              value={keyword}
              onChange={(event) => setKeyword(event.target.value)}
              className="field-control min-h-14 rounded-3xl text-base"
              placeholder="Ej. fitness en casa, AI for lawyers, meal prep vegano"
            />
          </label>

          <label className="space-y-2">
            <span className="text-xs uppercase tracking-[0.2em] text-slate-400 dark:text-stone-500">
              Pais
            </span>
            <input
              value={countryQuery}
              onChange={(event) => setCountryQuery(event.target.value)}
              className="field-control rounded-3xl text-sm"
              placeholder="Buscar pais..."
            />
            <select
              value={geo}
              onChange={(event) => setGeo(event.target.value)}
              className="field-control min-h-14 rounded-3xl text-base"
              disabled={loadingCountries && countries.length === 0}
            >
              {countries.length === 0 ? (
                <option value={DEFAULT_GEO}>{loadingCountries ? "Cargando paises..." : geo}</option>
              ) : null}
              {filteredCountries.map((country) => (
                <option key={country.countryCode} value={country.countryCode}>
                  {country.countryName}
                </option>
              ))}
            </select>
          </label>

          <button
            type="submit"
            className="min-h-14 rounded-3xl bg-pine px-6 py-4 text-sm font-semibold text-white shadow-card transition hover:-translate-y-0.5 hover:opacity-95"
          >
            Analizar oportunidad
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs uppercase tracking-[0.2em] text-slate-400 dark:text-stone-500">
            Ejemplos
          </span>
          {examples.map((example) => (
            <button
              key={example}
              type="button"
              onClick={() => {
                setKeyword(example);
                setError("");
                onExampleClick?.(example);
              }}
              className="rounded-full border border-slate-200 bg-white/90 px-4 py-2 text-sm text-slate-700 transition hover:border-pine hover:text-pine dark:border-stone-700 dark:bg-stone-900/90 dark:text-stone-200"
            >
              {example}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm leading-6 text-slate-500 dark:text-stone-400">
            Google Trends, autocomplete y heuristicas explicables. Sin caja negra.
          </p>
          <p className="text-sm text-slate-500 dark:text-stone-400">
            Geo actual: {selectedCountry?.countryName ?? geo} ({geo})
          </p>
        </div>

        {error ? <p className="text-sm font-medium text-rose-600 dark:text-rose-300">{error}</p> : null}
      </form>
    </div>
  );
}
