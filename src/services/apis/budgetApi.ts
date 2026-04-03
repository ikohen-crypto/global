import type { BudgetApiResponse, TripSearchInput } from "@/types";
import { fetchJson } from "@/services/apis/httpClient";

const BUDGET_ENDPOINT = "/api/budget/compare";

export async function compareBudgets(input: TripSearchInput): Promise<BudgetApiResponse> {
  return fetchJson<BudgetApiResponse>(BUDGET_ENDPOINT, {
    method: "POST",
    body: JSON.stringify({ input })
  });
}
