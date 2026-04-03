"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";

import type { CountrySummary } from "@/lib/types";

export function WorldMap({ countries }: { countries: CountrySummary[] }) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const router = useRouter();

  useEffect(() => {
    let active = true;
    let cleanup: (() => void) | undefined;

    async function createMap() {
      if (!containerRef.current) return;
      const L = await import("leaflet");
      if (!active || !containerRef.current) return;

      const map = L.map(containerRef.current, {
        zoomControl: false,
        scrollWheelZoom: false,
        attributionControl: false,
      }).setView([20, 0], 2);

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png").addTo(map);

      countries.forEach((country) => {
        if (!country.latlng) return;
        const marker = L.circleMarker(country.latlng, {
          radius: 6,
          fillColor: "#0f766e",
          color: "#ffffff",
          weight: 1.5,
          fillOpacity: 0.9,
        }).addTo(map);

        marker.bindTooltip(`<strong>${country.name}</strong><br/>${country.region}`);
        marker.on("mouseover", () => marker.openTooltip());
        marker.on("click", () => {
          router.push(`/country/${country.slug}`);
        });

        const markerElement = marker.getElement() as SVGElement | null;
        if (markerElement) {
          markerElement.style.cursor = "pointer";
        }
      });

      cleanup = () => map.remove();
    }

    void createMap();

    return () => {
      active = false;
      cleanup?.();
    };
  }, [countries, router]);

  return <div ref={containerRef} className="h-[360px] w-full overflow-hidden rounded-[2rem]" aria-label="Interactive world map" />;
}
