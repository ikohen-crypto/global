import { Badge } from "@/components/ui/Badge";
import { Panel } from "@/components/ui/Panel";
import { useLocale } from "@/hooks/useLocale";
import { formatCurrency } from "@/utils/currency";
import { getSourceNameLabel, resolveAirlineNames, translateBudgetText } from "@/utils/presentation";
import type { FinalBudgetSummary } from "@/types";

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-slate-50 px-3 py-2.5">
      <p className="text-xs uppercase tracking-[0.2em] text-slate-400">{label}</p>
      <p className="mt-1 font-semibold leading-snug text-slate-700">{value}</p>
    </div>
  );
}

function ProviderCard({
  title,
  subtitle,
  value,
  actionLabel,
  actionHref
}: {
  title: string;
  subtitle: string;
  value?: string;
  actionLabel?: string;
  actionHref?: string;
}) {
  return (
    <article className="rounded-3xl border border-slate-100 bg-white p-3.5 shadow-sm">
      <p className="text-xs uppercase tracking-[0.2em] text-slate-400">{title}</p>
      <p className="mt-1 font-semibold text-slate-800">{subtitle}</p>
      {value ? <p className="mt-3 text-lg font-semibold text-pine">{value}</p> : null}
      {actionHref && actionLabel ? (
        <a
          href={actionHref}
          target="_blank"
          rel="noreferrer"
          className="mt-3 inline-flex rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-pine transition hover:border-pine hover:bg-pine hover:text-white"
        >
          {actionLabel}
        </a>
      ) : null}
    </article>
  );
}

function formatHotelField(value?: string): string | undefined {
  const normalized = value?.trim();
  if (!normalized) return undefined;
  return normalized.replace(/[_-]+/g, " ").replace(/\s+/g, " ");
}

function formatDateTime(value: string | undefined, locale: string): string | undefined {
  if (!value) return undefined;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return undefined;
  return new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "short" }).format(parsed);
}

function formatOccupancy(totalGuests: number, roomCount: number, language: "es" | "en"): string {
  const guestLabel = language === "es" ? (totalGuests === 1 ? "huesped" : "huespedes") : totalGuests === 1 ? "guest" : "guests";
  const roomLabel = language === "es" ? (roomCount === 1 ? "habitacion" : "habitaciones") : roomCount === 1 ? "room" : "rooms";
  return `${totalGuests} ${guestLabel} / ${roomCount} ${roomLabel}`;
}

function providerLabel(sourceName: string | undefined, language: "es" | "en"): string | undefined {
  return getSourceNameLabel(sourceName, language) ?? sourceName;
}

export function TripReferenceDetailsCard({ summary }: { summary: FinalBudgetSummary }) {
  const { language } = useLocale();
  const locale = language === "es" ? "es-ES" : "en-US";

  const travelerCount =
    summary.flights.travelerCount ?? summary.flights.passengerPricing.reduce((count, item) => count + item.quantity, 0);
  const lodgingGuestCount = summary.lodging.occupancyPlan.reduce((count, room) => count + room.guests, 0);
  const lodgingLinkLabel = translateBudgetText(
    summary.lodging.bookingLinkLabel ?? (language === "es" ? "Buscar hotel en Booking.com" : "Search hotel on Booking.com"),
    language
  );
  const routeLabel =
    summary.flights.itinerarySummary?.originLabel && summary.flights.itinerarySummary?.destinationLabel
      ? `${summary.flights.itinerarySummary.originLabel} -> ${summary.flights.itinerarySummary.destinationLabel}`
      : `${summary.flights.originAirportCode ?? "?"} -> ${summary.flights.destinationAirportCode ?? "?"}`;
  const airlineLabel =
    resolveAirlineNames(
      summary.flights.itinerarySummary?.validatingAirlineCodes ?? [],
      summary.flights.itinerarySummary?.validatingAirlineNames ?? []
    ).join(", ") || (language === "es" ? "No informado" : "Not provided");

  const flightSourceLabel = providerLabel(summary.flights.sourceName, language);
  const flightLinkSourceLabel = providerLabel(
    summary.flights.bookingLinkSource === "travelpayouts"
      ? "Travelpayouts"
      : summary.flights.bookingLinkSource === "aviasales"
        ? "Aviasales"
        : undefined,
    language
  );
  const lodgingSourceLabel = providerLabel(summary.lodging.sourceName, language);
  const lodgingLinkSourceLabel = providerLabel("Booking.com", language);
  const lodgingUpdatedAt = formatDateTime(summary.lodging.lastUpdatedAt, locale);

  return (
    <Panel
      title={language === "es" ? "Detalle resumido de vuelos y alojamiento" : "Flight and lodging quick details"}
      subtitle={language === "es" ? "Ver lo esencial sin entrar al detalle completo." : "See the essentials without opening the full details page."}
    >
      <div className="grid gap-4 xl:grid-cols-2">
        <section className="rounded-[1.75rem] border border-slate-100 bg-white p-4 shadow-sm">
          <div className="flex flex-wrap gap-2">
            {flightSourceLabel ? <Badge tone="accent">{flightSourceLabel}</Badge> : null}
            {flightLinkSourceLabel ? <Badge tone="neutral">{flightLinkSourceLabel}</Badge> : null}
          </div>
          <p className="mt-3 text-sm text-slate-500">
            {language === "es" ? `${travelerCount} viajeros` : `${travelerCount} travelers`}
          </p>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <DetailRow label={language === "es" ? "Ruta" : "Route"} value={routeLabel} />
            <DetailRow label={language === "es" ? "Precio total" : "Total price"} value={formatCurrency(summary.flights.groupTotal, summary.currency, locale)} />
            <DetailRow label={language === "es" ? "Por persona" : "Per person"} value={formatCurrency(summary.flights.perPassenger, summary.currency, locale)} />
            <DetailRow label={language === "es" ? "Aerolineas" : "Airlines"} value={airlineLabel} />
          </div>

          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <ProviderCard
              title={language === "es" ? "Oferta oficial" : "Official offer"}
              subtitle={flightSourceLabel ?? (language === "es" ? "No informado" : "Not provided")}
              value={formatCurrency(summary.flights.groupTotal, summary.currency, locale)}
            />
            <ProviderCard
              title={language === "es" ? "Proveedor de enlace" : "Link provider"}
              subtitle={flightLinkSourceLabel ?? (language === "es" ? "No informado" : "Not provided")}
              actionHref={summary.flights.bookingLink}
              actionLabel={
                summary.flights.bookingLinkSource === "travelpayouts"
                  ? language === "es"
                    ? "Ver vuelo en Travelpayouts"
                    : "View flight in Travelpayouts"
                  : language === "es"
                    ? "Abrir busqueda en Aviasales"
                    : "Open Aviasales search"
              }
            />
          </div>
        </section>

        <section className="rounded-[1.75rem] border border-slate-100 bg-white p-4 shadow-sm">
          <div className="flex flex-wrap gap-2">
            {lodgingSourceLabel ? <Badge tone="accent">{lodgingSourceLabel}</Badge> : null}
            {lodgingLinkSourceLabel ? <Badge tone="neutral">{lodgingLinkSourceLabel}</Badge> : null}
          </div>

          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <ProviderCard
              title={language === "es" ? "Oferta oficial" : "Official offer"}
              subtitle={lodgingSourceLabel ?? (language === "es" ? "No informado" : "Not provided")}
              value={formatCurrency(summary.lodging.value, summary.currency, locale)}
            />
            <ProviderCard
              title={language === "es" ? "Proveedor de enlace" : "Link provider"}
              subtitle={lodgingLinkSourceLabel ?? (language === "es" ? "No informado" : "Not provided")}
              actionHref={summary.lodging.bookingLink}
              actionLabel={lodgingLinkLabel}
            />
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <DetailRow label={language === "es" ? "Propiedad" : "Property"} value={summary.lodging.selectedPropertyName ?? (language === "es" ? "No informada" : "Not provided")} />
            <DetailRow label={language === "es" ? "Tipo" : "Type"} value={formatHotelField(summary.lodging.selectedPropertyType) ?? (language === "es" ? "No informado" : "Not provided")} />
            <DetailRow label={language === "es" ? "Regimen" : "Board"} value={formatHotelField(summary.lodging.boardType) ?? (language === "es" ? "No informado" : "Not provided")} />
            <DetailRow label={language === "es" ? "Habitaciones" : "Rooms"} value={String(summary.lodging.roomCount)} />
            <DetailRow label={language === "es" ? "Huespedes" : "Guests"} value={String(lodgingGuestCount)} />
            <DetailRow label={language === "es" ? "Ocupacion" : "Occupancy"} value={formatOccupancy(lodgingGuestCount, summary.lodging.roomCount, language)} />
            <DetailRow label={language === "es" ? "Tarifa por noche" : "Nightly rate"} value={formatCurrency(summary.lodging.nightlyRate, summary.currency, locale)} />
            <DetailRow label={language === "es" ? "Total estadia" : "Stay total"} value={formatCurrency(summary.lodging.value, summary.currency, locale)} />
            <DetailRow label={language === "es" ? "Actualizado" : "Updated"} value={lodgingUpdatedAt ?? (language === "es" ? "No informado" : "Not provided")} />
          </div>
        </section>
      </div>
    </Panel>
  );
}
