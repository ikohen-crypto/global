export function buildBookingComSearchLink(input: {
  cityName: string;
  countryName?: string;
  propertyName?: string;
  checkInDate?: string;
  checkOutDate?: string;
  adults?: number;
  children?: number;
  rooms?: number;
}): string {
  const url = new URL("https://www.booking.com/searchresults.html");
  const destination = [input.propertyName, input.cityName, input.countryName].filter(Boolean).join(", ");

  url.searchParams.set("ss", destination);

  if (input.checkInDate) {
    url.searchParams.set("checkin", input.checkInDate);
  }

  if (input.checkOutDate) {
    url.searchParams.set("checkout", input.checkOutDate);
  }

  url.searchParams.set("group_adults", String(Math.max(1, input.adults ?? 1)));
  url.searchParams.set("group_children", String(Math.max(0, input.children ?? 0)));
  url.searchParams.set("no_rooms", String(Math.max(1, input.rooms ?? 1)));

  return url.toString();
}

export function buildAviasalesSearchLink(input: {
  originIata: string;
  destinationIata: string;
  departureDate: string;
  returnDate: string;
  adults: number;
  children: number;
  infants: number;
}): string {
  const url = new URL("https://www.aviasales.com/search");
  url.searchParams.set("origin_iata", input.originIata);
  url.searchParams.set("destination_iata", input.destinationIata);
  url.searchParams.set("depart_date", input.departureDate);
  url.searchParams.set("return_date", input.returnDate);
  url.searchParams.set("adults", String(Math.max(1, input.adults)));
  url.searchParams.set("children", String(Math.max(0, input.children)));
  url.searchParams.set("infants", String(Math.max(0, input.infants)));
  url.searchParams.set("trip_class", "0");
  return url.toString();
}
