import { beforeEach, describe, expect, it } from "vitest";

import { storage } from "@/lib/storage";

describe("storage", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("adds and removes favorite countries", () => {
    expect(storage.toggleFavoriteCountry("MEX")).toEqual(["MEX"]);
    expect(storage.toggleFavoriteCountry("MEX")).toEqual([]);
  });

  it("dedupes recent searches", () => {
    storage.addRecentSearch("mexico");
    storage.addRecentSearch("brazil");
    expect(storage.addRecentSearch("mexico")).toEqual(["mexico", "brazil"]);
  });

  it("falls back cleanly on corrupted state", () => {
    window.localStorage.setItem("globalecon:favorites:countries", "{bad json");
    expect(storage.getFavoriteCountries()).toEqual([]);
  });
});
