import {
  createContext,
  startTransition,
  useContext,
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode
} from "react";

import { compareBudgets } from "@/services/apis/budgetApi";
import { searchDestinations, type DestinationSearchResponse } from "@/services/apis/destinationApi";
import {
  buildDefaultTripInput,
  mockReferenceConfig
} from "@/services/apis/mockCatalog";
import { getReferenceConfig, type AppReferenceConfig } from "@/services/apis/referenceApi";
import type {
  BudgetApiResponse,
  BudgetCategoryKey,
  DestinationOption,
  ManualCostOverride,
  TripSearchInput,
  TravelerGroup
} from "@/types";

type AsyncStatus = "idle" | "loading" | "success" | "error";

interface WorkspaceState {
  referenceConfig: AppReferenceConfig;
  referenceStatus: AsyncStatus;
  referenceError: string | null;
  originQuery: string;
  originSearchStatus: AsyncStatus;
  originSearchResults: DestinationSearchResponse;
  originSearchError: string | null;
  destinationQuery: string;
  destinationSearchStatus: AsyncStatus;
  destinationSearchResults: DestinationSearchResponse;
  destinationSearchError: string | null;
  comparisonStatus: AsyncStatus;
  comparisonError: string | null;
  comparison: BudgetApiResponse | null;
  activeDestinationId: string | null;
  draftInput: TripSearchInput;
}

interface WorkspaceActions {
  setOrigin(destination: DestinationOption): void;
  setDestinations(destinations: DestinationOption[]): void;
  setOriginQuery(query: string): void;
  setDestinationQuery(query: string): void;
  setDepartureDate(value: string): void;
  setReturnDate(value: string): void;
  setNights(value: number): void;
  setPreferredCurrency(value: string): void;
  setTravelers(breakdown: TravelerGroup["breakdown"]): void;
  setAccommodationType(value: TripSearchInput["accommodationType"]): void;
  setLodgingStyle(value: TripSearchInput["lodgingStyle"]): void;
  setFoodStyle(value: TripSearchInput["foodStyle"]): void;
  setLocalTransportStyle(value: TripSearchInput["localTransportStyle"]): void;
  setActivityStyle(value: TripSearchInput["activityStyle"]): void;
  setActivityCount(value: number): void;
  toggleFlag(key: keyof Pick<
    TripSearchInput,
    | "includeCheckedBag"
    | "includeTravelInsurance"
    | "includeRoaming"
    | "includeAirportTransfers"
    | "includeContingency"
    | "includeSouvenirs"
    | "includeVisaCosts"
    | "includeTouristTaxes"
    | "includeTips"
  >): void;
  setManualOverride(category: BudgetCategoryKey, override: ManualCostOverride | null): void;
  setActiveDestinationId(id: string): void;
  searchOriginNow(): Promise<void>;
  searchDestinationNow(): Promise<void>;
  compareNow(input?: TripSearchInput): Promise<void>;
  refreshReferenceConfig(): Promise<void>;
}

interface WorkspaceValue extends WorkspaceState, WorkspaceActions {}

const WorkspaceContext = createContext<WorkspaceValue | null>(null);

function resolvePartyType(breakdown: TravelerGroup["breakdown"]): TravelerGroup["partyType"] {
  const total = breakdown.adults + breakdown.children + breakdown.infants;

  if (total <= 1) {
    return "solo";
  }

  if (breakdown.adults === 2 && breakdown.children === 0 && breakdown.infants === 0) {
    return "couple";
  }

  if (breakdown.children > 0 || breakdown.infants > 0) {
    return "family";
  }

  return "group";
}

function cloneDefaultInput(referenceConfig: AppReferenceConfig): TripSearchInput {
  return {
    ...buildDefaultTripInput(),
    origin: referenceConfig.defaultOrigin,
    preferredCurrency: referenceConfig.defaultCurrency
  };
}

function buildEmptySearchResult(message: string): DestinationSearchResponse {
  return {
    destinations: [],
    sourceType: "mock",
    limitations: [message]
  };
}

export function TravelBudgetProvider({ children }: { children: ReactNode }) {
  const [referenceConfig, setReferenceConfig] = useState<AppReferenceConfig>(mockReferenceConfig);
  const [referenceStatus, setReferenceStatus] = useState<AsyncStatus>("idle");
  const [referenceError, setReferenceError] = useState<string | null>(null);
  const [originQuery, setOriginQuery] = useState("");
  const [originSearchResults, setOriginSearchResults] = useState<DestinationSearchResponse>(
    buildEmptySearchResult("Escribe una ciudad, aeropuerto o país para elegir el origen.")
  );
  const [originSearchStatus, setOriginSearchStatus] = useState<AsyncStatus>("idle");
  const [originSearchError, setOriginSearchError] = useState<string | null>(null);
  const [destinationQuery, setDestinationQuery] = useState("");
  const [destinationSearchResults, setDestinationSearchResults] = useState<DestinationSearchResponse>(
    buildEmptySearchResult("Escribe una ciudad, aeropuerto o país para agregar destinos.")
  );
  const [destinationSearchStatus, setDestinationSearchStatus] = useState<AsyncStatus>("idle");
  const [destinationSearchError, setDestinationSearchError] = useState<string | null>(null);
  const [comparisonStatus, setComparisonStatus] = useState<AsyncStatus>("idle");
  const [comparisonError, setComparisonError] = useState<string | null>(null);
  const [comparison, setComparison] = useState<BudgetApiResponse | null>(null);
  const [activeDestinationId, setActiveDestinationId] = useState<string | null>(null);
  const [draftInput, setDraftInput] = useState<TripSearchInput>(() =>
    cloneDefaultInput(mockReferenceConfig)
  );
  const originRequestCounter = useRef(0);
  const destinationRequestCounter = useRef(0);
  const deferredOriginQuery = useDeferredValue(originQuery);
  const deferredDestinationQuery = useDeferredValue(destinationQuery);

  async function refreshReferenceConfig() {
    setReferenceStatus("loading");
    setReferenceError(null);

    try {
      const config = await getReferenceConfig();
      setReferenceConfig(config);
      setDraftInput((current) => ({
        ...current,
        origin: config.defaultOrigin,
        preferredCurrency: config.defaultCurrency
      }));
      setReferenceStatus("success");
    } catch (error) {
      setReferenceError(error instanceof Error ? error.message : "Unable to load reference config");
      setReferenceStatus("error");
    }
  }

  async function searchOriginNow() {
    const ticket = ++originRequestCounter.current;
    const query = deferredOriginQuery.trim();

    setOriginSearchStatus("loading");
    setOriginSearchError(null);

    if (!query) {
      setOriginSearchResults(
        buildEmptySearchResult("Escribe una ciudad, aeropuerto o país para elegir el origen.")
      );
      setOriginSearchStatus("idle");
      return;
    }

    try {
      const response = await searchDestinations(query);
      if (ticket !== originRequestCounter.current) {
        return;
      }

      setOriginSearchResults(response);
      setOriginSearchStatus("success");
    } catch (error) {
      if (ticket !== originRequestCounter.current) {
        return;
      }

      setOriginSearchError(error instanceof Error ? error.message : "Origin search failed");
      setOriginSearchStatus("error");
    }
  }

  async function searchDestinationNow() {
    const ticket = ++destinationRequestCounter.current;
    const query = deferredDestinationQuery.trim();

    setDestinationSearchStatus("loading");
    setDestinationSearchError(null);

    if (!query) {
      setDestinationSearchResults(
        buildEmptySearchResult("Escribe una ciudad, aeropuerto o país para agregar destinos.")
      );
      setDestinationSearchStatus("idle");
      return;
    }

    try {
      const response = await searchDestinations(query);
      if (ticket !== destinationRequestCounter.current) {
        return;
      }

      setDestinationSearchResults(response);
      setDestinationSearchStatus("success");
    } catch (error) {
      if (ticket !== destinationRequestCounter.current) {
        return;
      }

      setDestinationSearchError(
        error instanceof Error ? error.message : "Destination search failed"
      );
      setDestinationSearchStatus("error");
    }
  }

  async function compareNow(input: TripSearchInput = draftInput) {
    setComparisonStatus("loading");
    setComparisonError(null);

    try {
      const response = await compareBudgets(input);
      setComparison(response);
      setActiveDestinationId(response.summaries[0]?.destination.id ?? null);
      setComparisonStatus("success");
    } catch (error) {
      setComparisonError(error instanceof Error ? error.message : "Comparison failed");
      setComparisonStatus("error");
    }
  }

  useEffect(() => {
    startTransition(() => {
      void refreshReferenceConfig();
      void compareNow();
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!deferredOriginQuery.trim()) {
      setOriginSearchResults(
        buildEmptySearchResult("Escribe una ciudad, aeropuerto o país para elegir el origen.")
      );
      setOriginSearchStatus("idle");
      return;
    }

    void searchOriginNow();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deferredOriginQuery]);

  useEffect(() => {
    if (!deferredDestinationQuery.trim()) {
      setDestinationSearchResults(
        buildEmptySearchResult("Escribe una ciudad, aeropuerto o país para agregar destinos.")
      );
      setDestinationSearchStatus("idle");
      return;
    }

    void searchDestinationNow();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deferredDestinationQuery]);

  const actions: WorkspaceActions = useMemo(
    () => ({
      setOrigin(destination) {
        setDraftInput((current) => ({ ...current, origin: destination }));
      },
      setDestinations(destinations) {
        setDraftInput((current) => ({ ...current, destinations }));
      },
      setOriginQuery(query) {
        setOriginQuery(query);
      },
      setDestinationQuery(query) {
        setDestinationQuery(query);
      },
      setDepartureDate(value) {
        setDraftInput((current) => ({ ...current, departureDate: value }));
      },
      setReturnDate(value) {
        setDraftInput((current) => ({ ...current, returnDate: value }));
      },
      setNights(value) {
        setDraftInput((current) => ({ ...current, nights: Math.max(1, value) }));
      },
      setPreferredCurrency(value) {
        setDraftInput((current) => ({ ...current, preferredCurrency: value }));
      },
      setTravelers(breakdown) {
        const totalTravelers = Math.max(1, breakdown.adults + breakdown.children + breakdown.infants);
        setDraftInput((current) => ({
          ...current,
          travelers: {
            breakdown,
            totalTravelers,
            partyType: resolvePartyType(breakdown)
          }
        }));
      },
      setAccommodationType(value) {
        setDraftInput((current) => ({ ...current, accommodationType: value }));
      },
      setLodgingStyle(value) {
        setDraftInput((current) => ({ ...current, lodgingStyle: value }));
      },
      setFoodStyle(value) {
        setDraftInput((current) => ({ ...current, foodStyle: value }));
      },
      setLocalTransportStyle(value) {
        setDraftInput((current) => ({ ...current, localTransportStyle: value }));
      },
      setActivityStyle(value) {
        setDraftInput((current) => ({ ...current, activityStyle: value }));
      },
      setActivityCount(value) {
        setDraftInput((current) => ({ ...current, activityCount: Math.max(0, value) }));
      },
      toggleFlag(key) {
        setDraftInput((current) => ({ ...current, [key]: !current[key] }));
      },
      setManualOverride(category, override) {
        setDraftInput((current) => ({
          ...current,
          manualOverrides: {
            ...(current.manualOverrides ?? {}),
            [category]: override ?? undefined
          }
        }));
      },
      setActiveDestinationId(id) {
        setActiveDestinationId(id);
      },
      searchOriginNow,
      searchDestinationNow,
      compareNow,
      refreshReferenceConfig
    }),
    [searchOriginNow, searchDestinationNow, compareNow]
  );

  const value: WorkspaceValue = {
    referenceConfig,
    referenceStatus,
    referenceError,
    originQuery,
    originSearchStatus,
    originSearchResults,
    originSearchError,
    destinationQuery,
    destinationSearchStatus,
    destinationSearchResults,
    destinationSearchError,
    comparisonStatus,
    comparisonError,
    comparison,
    activeDestinationId,
    draftInput,
    ...actions
  };

  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>;
}

export function useTravelBudgetWorkspace() {
  const context = useContext(WorkspaceContext);

  if (!context) {
    throw new Error("useTravelBudgetWorkspace must be used within TravelBudgetProvider");
  }

  return context;
}
