export interface Coordinates {
  latitude: number;
  longitude: number;
}

export function hasCoordinates(value: Partial<Coordinates> | undefined): value is Coordinates {
  return (
    typeof value?.latitude === "number" &&
    Number.isFinite(value.latitude) &&
    typeof value?.longitude === "number" &&
    Number.isFinite(value.longitude)
  );
}

export function haversineDistanceKm(a: Coordinates, b: Coordinates): number {
  const toRad = (degrees: number) => (degrees * Math.PI) / 180;

  const earthRadiusKm = 6_371;
  const deltaLat = toRad(b.latitude - a.latitude);
  const deltaLon = toRad(b.longitude - a.longitude);

  const lat1 = toRad(a.latitude);
  const lat2 = toRad(b.latitude);

  const sinLat = Math.sin(deltaLat / 2);
  const sinLon = Math.sin(deltaLon / 2);

  const hav =
    sinLat * sinLat + Math.cos(lat1) * Math.cos(lat2) * sinLon * sinLon;

  return 2 * earthRadiusKm * Math.asin(Math.min(1, Math.sqrt(hav)));
}
