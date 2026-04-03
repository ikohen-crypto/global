"use client";

import Link from "next/link";
import { Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useI18n } from "@/components/i18n-provider";
import { trackEvent } from "@/lib/analytics";
import { buildSearchIndex, searchEntities } from "@/lib/search";
import { storage } from "@/lib/storage";
import type { CountrySummary } from "@/lib/types";

export function SearchCommand({
  triggerClassName = "",
  countries,
}: {
  triggerClassName?: string;
  countries: CountrySummary[];
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const { messages } = useI18n();

  useEffect(() => {
    setRecentSearches(storage.getRecentSearches());
  }, []);

  const index = useMemo(() => buildSearchIndex(countries), [countries]);
  const results = useMemo(() => searchEntities(index, query), [index, query]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className={triggerClassName}>
          <Search className="mr-2 h-4 w-4" />
          {messages.nav.search}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{messages.search.title}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <Input
            autoFocus
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={messages.search.placeholder}
          />
          {!query && recentSearches.length > 0 ? (
            <div className="space-y-2">
              <div className="text-sm font-medium">{messages.search.recent}</div>
              <div className="flex flex-wrap gap-2">
                {recentSearches.map((item) => (
                  <button
                    key={item}
                    type="button"
                    className="rounded-full border border-border px-3 py-1 text-sm"
                    onClick={() => setQuery(item)}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>
          ) : null}
          <div className="space-y-2">
            {results.length > 0 ? (
              results.map((result) => (
                <Link
                  key={`${result.type}-${result.id}`}
                  href={result.href}
                  className="block rounded-2xl border border-border bg-card p-4 transition hover:border-primary/40 hover:bg-accent/50"
                  onClick={() => {
                    storage.addRecentSearch(query || result.title);
                    trackEvent("search_used", {
                      query: query || result.title,
                      target: result.href,
                    });
                    setOpen(false);
                  }}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="font-medium">{result.title}</div>
                    <span className="rounded-full border border-border px-2 py-0.5 text-xs uppercase tracking-wide text-muted-foreground">
                      {result.type}
                    </span>
                  </div>
                  <div className="text-sm text-muted-foreground">{result.subtitle}</div>
                </Link>
              ))
            ) : query ? (
              <div className="rounded-2xl border border-dashed border-border p-4 text-sm text-muted-foreground">
                {messages.search.empty}
              </div>
            ) : null}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
