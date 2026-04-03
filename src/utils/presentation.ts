import type {
  BudgetCategoryKey,
  DataSourceType,
  EstimateExplanation,
  PriceConfidence,
  ScenarioKey,
  TripSearchInput
} from "@/types";

export type PresentationLanguage = "es" | "en";

const categoryLabels: Record<PresentationLanguage, Record<BudgetCategoryKey, string>> = {
  es: {
    flights: "Vuelos",
    lodging: "Alojamiento",
    food: "Comida",
    localTransport: "Transporte local",
    activities: "Actividades",
    extras: "Extras"
  },
  en: {
    flights: "Flights",
    lodging: "Lodging",
    food: "Food",
    localTransport: "Local transport",
    activities: "Activities",
    extras: "Extras"
  }
};

const sourceLabels: Record<PresentationLanguage, Record<DataSourceType, string>> = {
  es: {
    api: "API oficial",
    estimated: "Estimado",
    mixed: "Mixto",
    manual: "Manual",
    mock: "Demo",
    external: "Enlace externo"
  },
  en: {
    api: "Official API",
    estimated: "Estimated",
    mixed: "Mixed",
    manual: "Manual",
    mock: "Demo",
    external: "External link"
  }
};

const confidenceLabels: Record<PresentationLanguage, Record<PriceConfidence, string>> = {
  es: {
    high: "Confianza alta",
    medium: "Confianza media",
    low: "Confianza baja"
  },
  en: {
    high: "High confidence",
    medium: "Medium confidence",
    low: "Low confidence"
  }
};

const scenarioLabels: Record<PresentationLanguage, Record<ScenarioKey, string>> = {
  es: {
    minimum: "Mínimo",
    expected: "Esperado",
    high: "Alto"
  },
  en: {
    minimum: "Minimum",
    expected: "Expected",
    high: "High"
  }
};

const sourceNameLabels: Record<PresentationLanguage, Record<string, string>> = {
  es: {
    "Amadeus Self-Service": "Amadeus Self-Service",
    "Google Gemini API": "Google Gemini API",
    Travelpayouts: "Travelpayouts",
    Aviasales: "Aviasales",
    "ECB Reference Rates": "Banco Central Europeo",
    "REST Countries": "REST Countries",
    "Open-Meteo": "Open-Meteo",
    "Booking.com": "Booking.com",
    "destination-flight-model": "Modelo estimado de vuelos",
    "destination-lodging-model": "Modelo estimado de alojamiento",
    "destination-food-model": "Modelo estimado de comida",
    "destination-transport-model": "Modelo estimado de transporte",
    "destination-activities-model": "Modelo estimado de actividades",
    "destination-extras-model": "Modelo estimado de extras",
    "destination-metadata": "Metadatos del destino",
    "Mock flight search": "Búsqueda demo de vuelos",
    "Mock lodging search": "Búsqueda demo de alojamiento",
    "Mock food estimator": "Estimador demo de comida",
    "Mock transport estimator": "Estimador demo de transporte",
    "Mock activities estimator": "Estimador demo de actividades",
    "Mock extras estimator": "Estimador demo de extras",
    "Mock trip budget calculator": "Calculadora demo de presupuesto"
  },
  en: {
    "Amadeus Self-Service": "Amadeus Self-Service",
    "Google Gemini API": "Google Gemini API",
    Travelpayouts: "Travelpayouts",
    Aviasales: "Aviasales",
    "ECB Reference Rates": "European Central Bank",
    "REST Countries": "REST Countries",
    "Open-Meteo": "Open-Meteo",
    "Booking.com": "Booking.com",
    "destination-flight-model": "Estimated flight model",
    "destination-lodging-model": "Estimated lodging model",
    "destination-food-model": "Estimated food model",
    "destination-transport-model": "Estimated transport model",
    "destination-activities-model": "Estimated activities model",
    "destination-extras-model": "Estimated extras model",
    "destination-metadata": "Destination metadata",
    "Mock flight search": "Demo flight search",
    "Mock lodging search": "Demo lodging search",
    "Mock food estimator": "Demo food estimator",
    "Mock transport estimator": "Demo transport estimator",
    "Mock activities estimator": "Demo activities estimator",
    "Mock extras estimator": "Demo extras estimator",
    "Mock trip budget calculator": "Demo trip budget calculator"
  }
};

const airlineNameLabels: Record<string, string> = {
  AA: "American Airlines",
  AC: "Air Canada",
  AF: "Air France",
  AM: "Aeromexico",
  AV: "Avianca",
  BA: "British Airways",
  BR: "EVA Air",
  CM: "Copa Airlines",
  CX: "Cathay Pacific",
  DL: "Delta Air Lines",
  EI: "Aer Lingus",
  EK: "Emirates",
  ET: "Ethiopian Airlines",
  EY: "Etihad Airways",
  FI: "Icelandair",
  G3: "GOL Linhas Aereas",
  IB: "Iberia",
  JL: "Japan Airlines",
  KE: "Korean Air",
  KL: "KLM Royal Dutch Airlines",
  LA: "LATAM Airlines",
  LH: "Lufthansa",
  LO: "LOT Polish Airlines",
  MS: "EgyptAir",
  NH: "All Nippon Airways",
  NZ: "Air New Zealand",
  OS: "Austrian Airlines",
  QR: "Qatar Airways",
  QF: "Qantas",
  RJ: "Royal Jordanian",
  SA: "South African Airways",
  SK: "Scandinavian Airlines",
  SQ: "Singapore Airlines",
  SU: "Aeroflot",
  TG: "Thai Airways",
  TK: "Turkish Airlines",
  TP: "TAP Air Portugal",
  UA: "United Airlines",
  UX: "Air Europa",
  VY: "Vueling",
  WN: "Southwest Airlines",
  WS: "WestJet"
};

const englishToSpanishMap: Array<[string, string]> = [
  ["Flight budget was normalized from an official flight offer.", "El presupuesto de vuelos se normalizó a partir de una oferta oficial."],
  ["Flight budget was estimated from destination characteristics and traveler composition.", "El presupuesto de vuelos se estimó según las características del destino y la composición del grupo."],
  ["The engine prefers a real offer, uses the median available option as the expected value, and keeps the offer range visible.", "El motor prioriza ofertas reales, usa la opción mediana disponible como valor esperado y mantiene visible el rango de ofertas."],
  ["Without route-level flight data, the engine falls back to a destination-level airfare curve that remains easy to replace.", "Cuando no hay datos por ruta, el motor usa una curva estimada de tarifa aérea por destino que puede reemplazarse fácilmente."],
  ["Flight estimates are based on official offers when available; otherwise a destination-level model is used.", "Las estimaciones de vuelos usan ofertas oficiales cuando existen; si no, se aplica un modelo estimado por destino."],
  ["Passenger-level prices are normalized from the group fare total.", "Los precios por pasajero se normalizan a partir de la tarifa total del grupo."],
  ["No live flight offers were returned.", "No se devolvieron ofertas reales de vuelos."],
  ["A non-affiliate Aviasales search link was attached because Travelpayouts marker/TRS are not configured yet.", "Se adjuntó un enlace normal de Aviasales porque Travelpayouts todavía no tiene configurados marker/TRS."],
  ["Travelpayouts affiliate deeplink was attached to the current search.", "Se adjuntó un deeplink afiliado de Travelpayouts a la búsqueda actual."],
  ["View affiliate link", "Ver enlace afiliado"],
  ["Open affiliate link", "Abrir enlace afiliado"],
  ["Travelpayouts returned a response without a partner URL.", "Travelpayouts devolvió una respuesta sin URL de afiliado."],
  ["Travelpayouts rejected the deeplink request for this search.", "Travelpayouts rechazó la solicitud del deeplink para esta búsqueda."],
  ["Travelpayouts API request failed while creating the deeplink.", "La API de Travelpayouts falló al crear el deeplink."],
  ["Alternative flight price from Travelpayouts", "Precio alternativo de vuelo de Travelpayouts"],
  ["Flight search on Aviasales", "Búsqueda de vuelo en Aviasales"],
  ["Ver vuelo en Travelpayouts", "Ver vuelo en Travelpayouts"],
  ["Buscar vuelo en Aviasales", "Buscar vuelo en Aviasales"],
  ["Travelpayouts flight price data was attached as a secondary comparison option.", "Se adjuntaron datos de precio de vuelo de Travelpayouts como segunda opción de comparación."],
  ["Travelpayouts token is not configured, so no secondary flight price reference could be fetched.", "No hay token de Travelpayouts configurado, así que no se pudo obtener una segunda referencia de precio de vuelo."],
  ["Travelpayouts did not return a secondary flight price reference for this search.", "Travelpayouts no devolvió una segunda referencia de precio de vuelo para esta búsqueda."],
  ["Travelpayouts secondary flight price lookup failed.", "La búsqueda secundaria de precio de vuelo en Travelpayouts falló."],
  ["Travelpayouts secondary flight price lookup failed: ", "La búsqueda secundaria de precio de vuelo en Travelpayouts falló: "],
  ["Hotel search on Booking.com", "Búsqueda de hotel en Booking.com"],
  ["Travelpayouts does not provide a live hotel price source, so this is the external booking option.", "Travelpayouts no ofrece una fuente viva de precios de hotel, así que esta es la opción externa de reserva."],
  ["Open in Booking.com", "Abrir en Booking.com"],
  ["Amadeus credentials are not configured", "Las credenciales de Amadeus no están configuradas"],
  ["Amadeus credentials are not configured, so flight, lodging, activity and destination search data may fall back to deterministic mocks.", "Las credenciales de Amadeus no están configuradas, así que vuelos, alojamiento, actividades y búsqueda de destinos pueden usar datos demo determinísticos."],
  ["Amadeus token request failed: fetch failed", "La solicitud del token de Amadeus falló: error de conexión"],
  ["Amadeus token request failed: Request timed out", "La solicitud del token de Amadeus agotó el tiempo de espera"],
  ["Amadeus token request failed: Client credentials are invalid", "La solicitud del token de Amadeus falló: las credenciales son inválidas"],
  ["Client credentials are invalid", "Las credenciales son inválidas"],
  ["Amadeus token response did not include an access token", "La respuesta de Amadeus no incluyó un token de acceso"],
  ["Mock weather snapshot", "Clima demo de referencia"],
  ["ECB XML payload did not contain exchange rates", "La respuesta XML del BCE no contenía tipos de cambio"],
  ["ECB response did not include the expected rate table.", "La respuesta del BCE no incluyó la tabla de tipos de cambio esperada."],
  ["Request failed with status 400", "La API devolvió un estado 400"],
  ["Request failed with status 500", "La API devolvió un estado 500"],
  ["An internal error occurred, please contact your administrator", "Ocurrió un error interno del proveedor, por favor contacta al administrador"],
  ["INVALID FORMAT", "Formato inválido"],
  ["The network rate limit is exceeded, please try again later", "Se excedió el límite de solicitudes de la red, por favor inténtalo más tarde"],
  ["Mock mode is currently enabled because the app is missing live provider credentials.", "El modo demo está activo porque faltan credenciales de proveedores en vivo."],
  ["Mock mode was requested for this comparison.", "Se solicitó modo demo para esta comparación."],
  ["Mock destination results were returned because the live search did not succeed.", "Se devolvieron destinos demo porque la búsqueda en vivo no tuvo éxito."],
  ["Flight budget manually overridden.", "El presupuesto de vuelos fue ajustado manualmente."],
  ["Manual override applied at ", "Ajuste manual aplicado el "],
  ["Reason: ", "Motivo: "],
  ["Adults", "Adultos"],
  ["Children", "Niños"],
  ["Infants", "Bebés"],
  ["Expected airfare", "Tarifa aérea esperada"],
  ["Selected baggage estimate", "Estimación de equipaje seleccionada"],
  ["Preferred currency", "Moneda preferida"],
  ["Source currency", "Moneda de origen"],
  ["Destination flight multiplier", "Multiplicador de vuelos del destino"],
  ["expected flight offer or fallback airfare model", "oferta de vuelo esperada o modelo alternativo de tarifa aérea"],
  ["Lodging cost was normalized from an official accommodation offer.", "El costo de alojamiento se normalizó a partir de una oferta oficial."],
  ["Lodging cost was estimated from accommodation style and destination cost profile.", "El costo de alojamiento se estimó según el estilo elegido y el perfil de costo del destino."],
  ["Food budget was adjusted by destination meal-cost metadata.", "El presupuesto de comida se ajustó con metadatos de costo de comida del destino."],
  ["Food budget was estimated from meal style and trip length.", "El presupuesto de comida se estimó según el estilo de comida y la duración del viaje."],
  ["Food cost is derived from style and destination meal-cost metadata when available.", "El costo de comida se deriva del estilo y de los metadatos de costo de comida del destino cuando están disponibles."],
  ["Local transport was adjusted by destination transport metadata.", "El transporte local se ajustó con metadatos de transporte del destino."],
  ["Local transport was estimated from travel style and trip length.", "El transporte local se estimó según el estilo de viaje y la duración del viaje."],
  ["Activities budget was derived from reference attraction items.", "El presupuesto de actividades se obtuvo a partir de atracciones de referencia."],
  ["Activities budget was estimated from activity style and trip length.", "El presupuesto de actividades se estimó según el estilo de actividades y la duración del viaje."],
  ["Extra costs combine baggage, insurance, transfers and optional buffers.", "Los extras combinan equipaje, seguro, traslados y márgenes opcionales."],
  ["Each item is transparent so the total can be adjusted without touching the base category math.", "Cada ítem es transparente para que el total pueda ajustarse sin tocar la matemática base de las categorías."],
  ["Checked baggage", "Equipaje facturado"],
  ["Travel insurance", "Seguro de viaje"],
  ["Roaming or eSIM", "Roaming o eSIM"],
  ["Airport transfers", "Traslados aeropuerto"],
  ["Tourist taxes", "Tasas turísticas"],
  ["Visa / eTA", "Visa / eTA"],
  ["Tips", "Propinas"],
  ["Souvenirs or shopping", "Souvenirs o compras"],
  ["Contingency buffer", "Margen de imprevistos"],
  ["Travelers", "Viajeros"],
  ["Days", "Días"],
  ["Style", "Estilo"],
  ["Daily per person", "Diario por persona"],
  ["Group daily total", "Total diario del grupo"],
  ["Meal multiplier", "Multiplicador de comida"],
  ["Daily group cost", "Costo diario del grupo"],
  ["Transport multiplier", "Multiplicador de transporte"],
  ["Taxi index", "Índice de taxi"],
  ["Public transport score", "Puntaje de transporte público"],
  ["Paid activities", "Actividades pagas"],
  ["Free activities", "Actividades gratuitas"],
  ["Average paid activity cost", "Costo promedio por actividad paga"],
  ["Activity multiplier", "Multiplicador de actividades"],
  ["Reference paid items", "Actividades pagas de referencia"],
  ["Accommodation type", "Tipo de alojamiento"],
  ["Expected nightly rate", "Tarifa nocturna esperada"],
  ["Room count", "Cantidad de habitaciones"],
  ["Guests", "Huéspedes"],
  ["Nights", "Noches"],
  ["Room 1", "Habitación 1"],
  ["Room 2", "Habitación 2"],
  ["Room 3", "Habitación 3"],
  ["Enabled items", "Ítems activos"],
  ["Budget summary", "Resumen del presupuesto"],
  ["Source", "Fuente"],
  ["Price source", "Fuente del precio"],
  ["Price shown", "Precio mostrado"],
  ["Booking link", "Enlace de reserva"],
  ["No booking link is available for this estimate.", "No hay un enlace de reserva disponible para esta estimación."],
  ["No live offer was available for this search, so the amount is estimated.", "No hubo una oferta real disponible para esta búsqueda, así que el monto es estimado."],
  ["View flight", "Ver vuelo"],
  ["View flight options", "Ver opciones de vuelo"],
  ["Open booking link", "Abrir enlace de reserva"],
  ["Search hotel on Booking.com", "Buscar hotel en Booking.com"],
  ["View hotel on Booking.com", "Ver hotel en Booking.com"],
  ["Request timed out", "La solicitud agotó el tiempo de espera"],
  ["Network request failed", "La solicitud de red falló"],
  ["Flight pricing is seeded from destination profile and traveler count.", "El precio del vuelo demo se genera a partir del perfil del destino y la cantidad de viajeros."],
  ["Mock flight search stands in for the future official search endpoint.", "La búsqueda demo de vuelos reemplaza temporalmente al endpoint oficial mientras no haya una oferta real disponible."],
  ["Demo flight prices are estimates until the official API is connected.", "Los precios demo de vuelos son estimaciones hasta que se conecte la API oficial."],
  ["Results are based on demo data until the BFF returns real API values.", "Los resultados se basan en datos demo hasta que el BFF devuelva valores reales de API."]
];

const spanishToEnglishMap: Array<[string, string]> = englishToSpanishMap.map(([english, spanish]) => [spanish, english]);

function applyReplacements(value: string, replacements: Array<[string, string]>): string {
  let output = value;
  for (const [source, target] of replacements) {
    output = output.split(source).join(target);
  }
  return output;
}

export function translateBudgetText(value: string, language: PresentationLanguage): string {
  if (!value) {
    return value;
  }

  return language === "es"
    ? applyReplacements(value, englishToSpanishMap)
    : applyReplacements(value, spanishToEnglishMap);
}

export function localizeExplanation(
  explanation: EstimateExplanation,
  language: PresentationLanguage
): EstimateExplanation {
  return {
    ...explanation,
    summary: translateBudgetText(explanation.summary, language),
    methodology: translateBudgetText(explanation.methodology, language),
    formula: explanation.formula ? translateBudgetText(explanation.formula, language) : undefined,
    inputs: explanation.inputs.map((input) => ({
      ...input,
      label: translateBudgetText(String(input.label), language)
    })),
    sourceNotes: explanation.sourceNotes?.map((note) => translateBudgetText(note, language)),
    technicalNotes: explanation.technicalNotes?.map((note) => translateBudgetText(note, language)),
    limitations: explanation.limitations?.map((note) => translateBudgetText(note, language))
  };
}

export function getSourceNameLabel(
  sourceName: string | undefined,
  language: PresentationLanguage = "es"
): string | undefined {
  if (!sourceName) {
    return undefined;
  }

  return sourceNameLabels[language][sourceName] ?? sourceName;
}

export function getAirlineNameLabel(code: string | undefined): string | undefined {
  const normalized = code?.trim().toUpperCase();
  if (!normalized) {
    return undefined;
  }

  return airlineNameLabels[normalized] ?? normalized;
}

export function resolveAirlineNames(codes: string[] = [], preferredNames: string[] = []): string[] {
  const preferred = preferredNames
    .map((name) => name.trim())
    .filter(Boolean)
    .map((name) => (/^[A-Z0-9]{2,3}$/i.test(name) ? getAirlineNameLabel(name) ?? name : name));
  if (preferred.length > 0) {
    return Array.from(new Set(preferred));
  }

  return Array.from(new Set(codes.map((code) => getAirlineNameLabel(code) ?? code).filter(Boolean)));
}

export function getCategoryLabel(key: BudgetCategoryKey, language: PresentationLanguage = "es"): string {
  return categoryLabels[language][key];
}

export function getSourceLabel(type: DataSourceType, language: PresentationLanguage = "es"): string {
  return sourceLabels[language][type];
}

export function getConfidenceLabel(
  confidence: PriceConfidence,
  language: PresentationLanguage = "es"
): string {
  return confidenceLabels[language][confidence];
}

export function getScenarioLabel(key: ScenarioKey, language: PresentationLanguage = "es"): string {
  return scenarioLabels[language][key];
}

export function getPartyLabel(input: TripSearchInput, language: PresentationLanguage = "es"): string {
  const total = input.travelers.totalTravelers;

  if (total <= 1) {
    return language === "es" ? "Viajero solo" : "Solo traveler";
  }

  if (input.travelers.partyType === "couple") {
    return language === "es" ? "Pareja" : "Couple";
  }

  if (input.travelers.partyType === "family") {
    return language === "es" ? "Viaje familiar" : "Family trip";
  }

  return language === "es" ? "Viaje en grupo" : "Group trip";
}

export function summarizeDestinationNames(
  input: TripSearchInput,
  language: PresentationLanguage = "es"
): string {
  if (input.destinations.length === 0) {
    return language === "es" ? "Sin destinos seleccionados" : "No destinations selected";
  }

  if (input.destinations.length === 1) {
    return input.destinations[0]?.label ?? (language === "es" ? "Destino seleccionado" : "Selected destination");
  }

  const [first] = input.destinations;
  return language === "es"
    ? `${first?.cityName ?? "Primero"} +${Math.max(0, input.destinations.length - 1)} más`
    : `${first?.cityName ?? "First"} +${Math.max(0, input.destinations.length - 1)} more`;
}
