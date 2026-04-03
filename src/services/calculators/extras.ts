import type { ExtraCostsEstimate, FlightEstimate, LodgingEstimate, ManualCostOverride } from "@/types";
import {
  applyManualOverride,
  createBudgetValue,
  createExplanation,
  money,
  sum
} from "@/services/calculators/common";
import { resolveDestinationCostProfile } from "@/services/calculators/reference";
import type { TripComputationContext } from "@/types";
import { getTripDaysFromNights } from "@/utils/date";

export interface ExtraBudgetOptions {
  includeCheckedBag?: boolean;
  includeTravelInsurance?: boolean;
  includeRoaming?: boolean;
  includeAirportTransfers?: boolean;
  includeContingency?: boolean;
  includeSouvenirs?: boolean;
  includeVisaCosts?: boolean;
  includeTouristTaxes?: boolean;
  includeTips?: boolean;
  flightBudget?: FlightEstimate;
  lodgingBudget?: LodgingEstimate;
  override?: ManualCostOverride;
}

function baggageEstimate(context: TripComputationContext, flightBudget?: FlightEstimate): number {
  if (flightBudget?.checkedBagCost) {
    return flightBudget.checkedBagCost;
  }

  const travelers = context.travelers.adults + context.travelers.children;
  return money(travelers * 34 * 2);
}

function insuranceEstimate(context: TripComputationContext): number {
  const travelers = context.travelers.adults + context.travelers.children + context.travelers.infants;
  return money(travelers * 16);
}

function roamingEstimate(context: TripComputationContext): number {
  const travelers = context.travelers.adults + context.travelers.children + context.travelers.infants;
  return money(travelers * 12);
}

function airportTransferEstimate(context: TripComputationContext): number {
  const profile = resolveDestinationCostProfile(context.referenceData);
  const base = profile.publicTransportScore >= 65 ? 36 : 48;
  const premium = profile.flightMultiplier > 1.1 ? 1.15 : 1;
  return money(base * premium);
}

function touristTaxEstimate(
  context: TripComputationContext,
  lodgingBudget?: LodgingEstimate
): number {
  const profile = resolveDestinationCostProfile(context.referenceData);
  const roomCount = lodgingBudget?.roomCount ?? Math.max(1, Math.ceil((context.travelers.adults + context.travelers.children + context.travelers.infants) / 2));
  return money((profile.touristTaxNightly || 0) * context.nights * roomCount);
}

function visaEstimate(context: TripComputationContext): number {
  const profile = resolveDestinationCostProfile(context.referenceData);
  if (!profile.visaRequired) {
    return 0;
  }

  const travelers = context.travelers.adults + context.travelers.children + context.travelers.infants;
  return money(travelers * 35);
}

function tipsEstimate(context: TripComputationContext): number {
  const days = getTripDaysFromNights(context.nights);
  return money(Math.max(10, days * 6));
}

function souvenirsEstimate(context: TripComputationContext): number {
  const days = getTripDaysFromNights(context.nights);
  const travelers = context.travelers.adults + context.travelers.children + context.travelers.infants;
  return money(Math.max(25, days * travelers * 8 * 0.25));
}

export function calculateExtraCosts(
  context: TripComputationContext,
  options?: ExtraBudgetOptions
): ExtraCostsEstimate {
  const profile = resolveDestinationCostProfile(context.referenceData);
  const includeCheckedBag = options?.includeCheckedBag ?? true;
  const includeTravelInsurance = options?.includeTravelInsurance ?? true;
  const includeRoaming = options?.includeRoaming ?? true;
  const includeAirportTransfers = options?.includeAirportTransfers ?? true;
  const includeContingency = options?.includeContingency ?? true;
  const includeSouvenirs = options?.includeSouvenirs ?? false;
  const includeVisaCosts = options?.includeVisaCosts ?? true;
  const includeTouristTaxes = options?.includeTouristTaxes ?? true;
  const includeTips = options?.includeTips ?? true;

  const baggage = includeCheckedBag ? baggageEstimate(context, options?.flightBudget) : 0;
  const insurance = includeTravelInsurance ? insuranceEstimate(context) : 0;
  const roaming = includeRoaming ? roamingEstimate(context) : 0;
  const airportTransfers = includeAirportTransfers ? airportTransferEstimate(context) : 0;
  const touristTaxes = includeTouristTaxes ? touristTaxEstimate(context, options?.lodgingBudget) : 0;
  const visaCosts = includeVisaCosts ? visaEstimate(context) : 0;
  const tips = includeTips ? tipsEstimate(context) : 0;
  const souvenirs = includeSouvenirs ? souvenirsEstimate(context) : 0;

  const preContingencyTotal = sum([
    baggage,
    insurance,
    roaming,
    airportTransfers,
    touristTaxes,
    visaCosts,
    tips,
    souvenirs
  ]);

  const contingency = includeContingency ? money(preContingencyTotal * 0.1) : 0;

  const items: ExtraCostsEstimate["items"] = [
    {
      key: "baggage",
      label: "Checked baggage",
      value: baggage,
      sourceType: includeCheckedBag ? (options?.flightBudget ? "api" : "estimated") : "estimated",
      confidence: options?.flightBudget ? "high" : "medium",
      explanation: createExplanation(
        includeCheckedBag ? "Checked baggage is modeled as a separate round-trip fee." : "Checked baggage is disabled.",
        "Baggage stays in extras so airfare remains a clean flight-only category.",
        [
          { label: "Travelers", value: context.travelers.adults + context.travelers.children },
          { label: "Checked bag total", value: baggage }
        ],
        { formula: "eligible travelers x round-trip baggage allowance" }
      )
    },
    {
      key: "insurance",
      label: "Travel insurance",
      value: insurance,
      sourceType: includeTravelInsurance ? "estimated" : "estimated",
      confidence: "medium",
      explanation: createExplanation(
        includeTravelInsurance ? "Travel insurance is estimated per traveler." : "Travel insurance is disabled.",
        "A per-traveler allowance keeps the item visible until a policy quote is wired in.",
        [{ label: "Travelers", value: context.travelers.adults + context.travelers.children + context.travelers.infants }],
        { formula: "per traveler insurance x travelers" }
      )
    },
    {
      key: "roaming",
      label: "Roaming or eSIM",
      value: roaming,
      sourceType: includeRoaming ? "estimated" : "estimated",
      confidence: "medium",
      explanation: createExplanation(
        includeRoaming ? "Roaming or eSIM is estimated per traveler." : "Roaming or eSIM is disabled.",
        "Connectivity is intentionally separate from lodging and meals so the user can turn it off easily.",
        [{ label: "Travelers", value: context.travelers.adults + context.travelers.children + context.travelers.infants }],
        { formula: "per traveler connectivity x travelers" }
      )
    },
    {
      key: "airportTransfers",
      label: "Airport transfers",
      value: airportTransfers,
      sourceType: includeAirportTransfers ? "estimated" : "estimated",
      confidence: "medium",
      explanation: createExplanation(
        includeAirportTransfers ? "Airport transfers are estimated as a round-trip allowance." : "Airport transfers are disabled.",
        "This stays transparent until a city transfer feed is available.",
        [{ label: "Total", value: airportTransfers }, { label: "Transport score", value: profile.publicTransportScore }],
        { formula: "fixed allowance adjusted by destination transport profile" }
      )
    },
    {
      key: "touristTaxes",
      label: "Tourist taxes",
      value: touristTaxes,
      sourceType: includeTouristTaxes ? "mixed" : "estimated",
      confidence: profile.touristTaxNightly > 0 ? "medium" : "low",
      explanation: createExplanation(
        includeTouristTaxes ? "Tourist taxes are estimated from destination metadata." : "Tourist taxes are disabled.",
        "These taxes often vary by room and night, so the calculation stays explicit rather than hidden.",
        [{ label: "Nights", value: context.nights }, { label: "Room multiplier", value: options?.lodgingBudget?.roomCount ?? 1 }],
        { formula: "tourist tax per night x nights x rooms" }
      )
    },
    {
      key: "visaCosts",
      label: "Visa / eTA",
      value: visaCosts,
      sourceType: includeVisaCosts ? "mixed" : "estimated",
      confidence: visaCosts > 0 ? "low" : "high",
      explanation: createExplanation(
        includeVisaCosts ? "Visa or eTA fees are estimated only when destination metadata marks them required." : "Visa costs are disabled.",
        "This should be replaced by visa eligibility rules once the data layer wires them in.",
        [{ label: "Visa required", value: visaCosts > 0 ? "yes" : "no" }, { label: "Total", value: visaCosts }],
        { formula: "per traveler visa fee x travelers when required" }
      )
    },
    {
      key: "tips",
      label: "Tips",
      value: tips,
      sourceType: includeTips ? "estimated" : "estimated",
      confidence: "low",
      explanation: createExplanation(
        includeTips ? "Tips are estimated from trip length." : "Tips are disabled.",
        "A daily gratuity allowance is more auditable than blending gratuities into other categories.",
        [{ label: "Nights", value: context.nights }, { label: "Total", value: tips }],
        { formula: "daily gratuity x trip days" }
      )
    },
    {
      key: "souvenirs",
      label: "Souvenirs or shopping",
      value: souvenirs,
      sourceType: includeSouvenirs ? "estimated" : "estimated",
      confidence: "low",
      explanation: createExplanation(
        includeSouvenirs ? "Souvenirs are modeled as a discretionary allowance." : "Souvenirs are disabled.",
        "This is intentionally optional because it is highly user dependent.",
        [{ label: "Total", value: souvenirs }],
        { formula: "discretionary shopping allowance" }
      )
    },
    {
      key: "contingency",
      label: "Contingency buffer",
      value: contingency,
      sourceType: includeContingency ? "estimated" : "estimated",
      confidence: "low",
      explanation: createExplanation(
        includeContingency ? "Contingency is a 10% buffer on the enabled extras subtotal." : "Contingency is disabled.",
        "A visible buffer keeps the estimate realistic when inputs are incomplete.",
        [{ label: "Pre-contingency subtotal", value: preContingencyTotal }, { label: "Buffer", value: contingency }],
        { formula: "10% of enabled extras subtotal" }
      )
    }
  ];

  const total = money(items.reduce((accumulator, item) => accumulator + item.value, 0));
  const confidence = includeContingency || includeCheckedBag || includeTravelInsurance ? "medium" : "low";
  const sourceType = includeCheckedBag || includeTravelInsurance || includeRoaming || includeAirportTransfers || includeTouristTaxes || includeVisaCosts || includeTips || includeSouvenirs
    ? "estimated"
    : "estimated";

  const base = createBudgetValue({
    value: total,
    currency: context.preferredCurrency,
    sourceType,
    confidence,
    sourceName: context.referenceData.warnings.length > 0 ? "destination-extras-model" : "destination-extras-model",
    explanation: createExplanation(
      "Extra costs combine baggage, insurance, transfers and optional buffers.",
      "Each item is transparent so the total can be adjusted without touching the base category math.",
      [{ label: "Enabled items", value: items.filter((item) => item.value > 0).length }],
      {
        formula: "sum(extra line items)"
      }
    ),
    range: {
      minimum: money(total * 0.74),
      expected: total,
      high: money(total * 1.42),
      currency: context.preferredCurrency
    }
  });

  const patched = applyManualOverride(base, options?.override, (override, original) => ({
    ...original.explanation,
    summary: "Extras budget manually overridden.",
    methodology: original.explanation.methodology,
    sourceNotes: [
      ...(original.explanation.sourceNotes ?? []),
      `Manual override applied at ${override.appliedAt ?? new Date().toISOString()}`,
      ...(override.reason ? [`Reason: ${override.reason}`] : [])
    ]
  }));

  return {
    ...patched,
    items
  };
}
