export function isValidDateValue(value: string): boolean {
  return Number.isFinite(Date.parse(value));
}

export function toUtcDate(value: string): Date | null {
  if (!isValidDateValue(value)) {
    return null;
  }

  return new Date(value);
}

export function diffInCalendarDays(startDate: string, endDate: string): number {
  const start = toUtcDate(startDate);
  const end = toUtcDate(endDate);

  if (!start || !end) {
    return 0;
  }

  const startUtc = Date.UTC(
    start.getUTCFullYear(),
    start.getUTCMonth(),
    start.getUTCDate()
  );
  const endUtc = Date.UTC(end.getUTCFullYear(), end.getUTCMonth(), end.getUTCDate());
  const diff = Math.round((endUtc - startUtc) / 86_400_000);

  return Number.isFinite(diff) && diff > 0 ? diff : 0;
}

export function getTripNightsFromDates(
  departureDate: string,
  returnDate: string,
  fallbackNights: number
): number {
  const byDates = diffInCalendarDays(departureDate, returnDate);
  if (byDates > 0) {
    return byDates;
  }

  return Math.max(0, Math.floor(fallbackNights));
}

export function getTripDaysFromNights(nights: number): number {
  return Math.max(1, Math.floor(nights) + 1);
}

export function clampDays(days: number): number {
  return Math.max(1, Math.floor(days));
}
