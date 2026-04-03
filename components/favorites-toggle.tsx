"use client";

import { Heart } from "lucide-react";
import { useEffect, useState } from "react";

import { useI18n } from "@/components/i18n-provider";
import { trackEvent } from "@/lib/analytics";
import { storage } from "@/lib/storage";
import { cn } from "@/lib/utils";

export function FavoritesToggle({
  type,
  id,
}: {
  type: "country" | "comparison";
  id: string;
}) {
  const [active, setActive] = useState(false);
  const { locale } = useI18n();

  useEffect(() => {
    const values =
      type === "country" ? storage.getFavoriteCountries() : storage.getFavoriteComparisons();
    setActive(values.includes(id));
  }, [id, type]);

  return (
    <button
      type="button"
      aria-label={
        locale === "es"
          ? active
            ? "Quitar de favoritos"
            : "Guardar en favoritos"
          : active
            ? "Remove favorite"
            : "Save favorite"
      }
      onClick={() => {
        const next =
          type === "country"
            ? storage.toggleFavoriteCountry(id)
            : storage.toggleFavoriteComparison(id);
        setActive(next.includes(id));
        trackEvent("country_favorited", { type, id, active: !active });
      }}
      className={cn(
        "inline-flex h-10 w-10 items-center justify-center rounded-full border border-border bg-background transition hover:bg-accent",
        active && "border-rose-300 bg-rose-50 text-rose-600 dark:border-rose-900 dark:bg-rose-950/40",
      )}
    >
      <Heart className={cn("h-4 w-4", active && "fill-current")} />
    </button>
  );
}
