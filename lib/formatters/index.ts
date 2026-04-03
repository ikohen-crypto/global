const compactCurrency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  notation: "compact",
  maximumFractionDigits: 1,
});

const fullCurrency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

const compactNumber = new Intl.NumberFormat("en-US", {
  notation: "compact",
  maximumFractionDigits: 1,
});

const decimalNumber = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 1,
});

export function formatCurrencyShort(value: number | null) {
  if (value == null || Number.isNaN(value)) return "No data";
  return compactCurrency.format(value);
}

export function formatCurrencyFull(value: number | null) {
  if (value == null || Number.isNaN(value)) return "No data";
  return fullCurrency.format(value);
}

export function formatPercent(value: number | null, digits = 1) {
  if (value == null || Number.isNaN(value)) return "No data";
  return `${value.toFixed(digits)}%`;
}

export function formatPopulation(value: number | null) {
  if (value == null || Number.isNaN(value)) return "No data";
  return compactNumber.format(value);
}

export function formatNumber(value: number | null, suffix = "") {
  if (value == null || Number.isNaN(value)) return "No data";
  return `${decimalNumber.format(value)}${suffix}`;
}

export function formatYear(year: number | null) {
  return year == null ? "Latest year unavailable" : String(year);
}
