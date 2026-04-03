import type { ComparisonScenario } from "../types/index.js";

export const APP_NAME = "Market Opportunity Scanner";
export const APP_TAGLINE = "Detecta nichos en tendencia y mercados saturados";

export const DEFAULT_CURRENCY = "USD";

export const DEFAULT_COMPARISON_SCENARIOS: ComparisonScenario[] = [
  {
    key: "minimum",
    label: "Minimum",
    description: "Optimistic scenario that trims flexible categories when data is estimated.",
    multipliers: {
      food: 0.92,
      localTransport: 0.9,
      activities: 0.85,
      extras: 0.9
    }
  },
  {
    key: "expected",
    label: "Expected",
    description: "Balanced scenario using the base result from real data and standard estimates.",
    multipliers: {}
  },
  {
    key: "high",
    label: "High",
    description: "Protective scenario that adds buffer to the most volatile categories.",
    multipliers: {
      flights: 1.08,
      lodging: 1.1,
      food: 1.15,
      localTransport: 1.15,
      activities: 1.15,
      extras: 1.2
    }
  }
];

export const API_TIMEOUT_MS = 30_000;

export const SERVER_PORT = 8787;
