import type { SaveComparisonInput, SavedComparisonSimulation } from "@/services/comparison/types";

const STORAGE_KEY = "travel-budget-comparator.saved-comparisons";

function safeStorage(): Storage | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

export function loadSavedComparisons(): SavedComparisonSimulation[] {
  const storage = safeStorage();
  if (!storage) {
    return [];
  }

  const rawValue = storage.getItem(STORAGE_KEY);
  if (!rawValue) {
    return [];
  }

  try {
    const parsed = JSON.parse(rawValue) as SavedComparisonSimulation[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function persistSavedComparisons(
  comparisons: SavedComparisonSimulation[]
): void {
  const storage = safeStorage();
  if (!storage) {
    return;
  }

  storage.setItem(STORAGE_KEY, JSON.stringify(comparisons));
}

export function createSavedComparison(
  input: SaveComparisonInput
): SavedComparisonSimulation {
  const now = new Date().toISOString();

  return {
    id:
      typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : `cmp_${Date.now()}`,
    name: input.name.trim(),
    notes: input.notes?.trim() || undefined,
    scenarioKey: input.scenarioKey,
    createdAt: now,
    updatedAt: now,
    summaries: input.summaries
  };
}

export function upsertSavedComparison(
  comparisons: SavedComparisonSimulation[],
  comparison: SavedComparisonSimulation
): SavedComparisonSimulation[] {
  const exists = comparisons.some((item) => item.id === comparison.id);
  const nextComparison = { ...comparison, updatedAt: new Date().toISOString() };

  if (!exists) {
    return [nextComparison, ...comparisons];
  }

  return comparisons.map((item) => (item.id === comparison.id ? nextComparison : item));
}

export function removeSavedComparison(
  comparisons: SavedComparisonSimulation[],
  comparisonId: string
): SavedComparisonSimulation[] {
  return comparisons.filter((item) => item.id !== comparisonId);
}
