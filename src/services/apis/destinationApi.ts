import type { DestinationSearchResponse } from "@/types";
import { findMockDestination } from "@/services/apis/mockCatalog";
import { fetchJson, HttpError } from "@/services/apis/httpClient";

const DESTINATION_ENDPOINT = "/api/destinations/search";

export type { DestinationSearchResponse };

export async function searchDestinations(query: string): Promise<DestinationSearchResponse> {
  const normalizedQuery = query.trim();

  try {
    return await fetchJson<DestinationSearchResponse>(
      `${DESTINATION_ENDPOINT}?q=${encodeURIComponent(normalizedQuery)}`,
      { method: "GET" }
    );
  } catch (error) {
    if (error instanceof HttpError) {
      return {
        destinations: findMockDestination(normalizedQuery),
        sourceType: "mock",
        limitations: ["Destination search is using local mock data because the BFF endpoint is unavailable."]
      };
    }

    return {
      destinations: findMockDestination(normalizedQuery),
      sourceType: "mock",
      limitations: ["Destination search fallback activated."]
    };
  }
}
