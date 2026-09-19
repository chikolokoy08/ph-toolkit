import { describe, expect, test } from "vitest";
import { buildIndex, type RawDataset } from "./build-index.js";
import * as queries from "./queries.js";

/**
 * A small stand-in for the real dataset, shaped like it but not drawn from it.
 * The names are real places; the codes are made up for these tests and do not
 * match the PSGC. It covers the awkward parts: a region with no provinces, an
 * entry that holds a province code without being a province, a city with no
 * province, and a name with a tilde.
 */
const fixture: RawDataset = {
  regions: [
    ["0700000000", "Region VII (Central Visayas)"],
    ["1300000000", "National Capital Region (NCR)"],
  ],
  provinces: [
    ["0701200000", "Bohol", "0700000000", true],
    ["0702200000", "Cebu", "0700000000", true],
    ["0799900000", "Special Area (Not a Province)", "0700000000", false],
  ],
  cities: [
    ["0701201000", "Tagbilaran", "0701200000", "0700000000", "City", null],
    ["0702201000", "Argao", "0702200000", "0700000000", "Municipality", null],
    ["0730600000", "City of Cebu", null, "0700000000", "City", null],
    [
      "0799901000",
      "Lone Municipality",
      "0799900000",
      "0700000000",
      "Municipality",
      null,
    ],
    ["1381000000", "City of Parañaque", null, "1300000000", "City", null],
    ["1380600000", "City of Manila", null, "1300000000", "City", null],
    [
      "1380601000",
      "Tondo I/II",
      null,
      "1300000000",
      "SubMunicipality",
      "1380600000",
    ],
    [
      "1380609000",
      "Intramuros",
      null,
      "1300000000",
      "SubMunicipality",
      "1380600000",
    ],
  ],
  barangays: [
    ["0730600041", "Lahug", "0730600000"],
    ["0730600042", "Mabolo", "0730600000"],
    ["0702201001", "Poblacion", "0702201000"],
    ["1381000001", "Baclaran", "1381000000"],
    ["1380601001", "Tondo I/II Barangay 1", "1380601000"],
  ],
};

const index = buildIndex(fixture);

describe("lookups by code", () => {
  test("getCities leaves out sub-municipalities by default", () => {
    expect(queries.getCities(index).map((c) => c.name)).toEqual([
      "Tagbilaran",
      "Argao",
      "City of Cebu",
      "Lone Municipality",
      "City of Parañaque",
      "City of Manila",
    ]);
  });

  test("getCities can include sub-municipalities", () => {
    expect(
      queries.getCities(index, { includeSubMunicipalities: true }),
    ).toHaveLength(8);
  });

  test("getRegions returns every region", () => {
    expect(queries.getRegions(index).map((region) => region.name)).toEqual([
      "Region VII (Central Visayas)",
      "National Capital Region (NCR)",
    ]);
  });

  test("getRegionByCode finds a region", () => {
    expect(queries.getRegionByCode(index, "0700000000")?.name).toBe(
      "Region VII (Central Visayas)",
    );
  });

  test("getProvinceByCode finds a province", () => {
    expect(queries.getProvinceByCode(index, "0702200000")?.name).toBe("Cebu");
  });

  test("getCityByCode finds a city", () => {
    expect(queries.getCityByCode(index, "0730600000")?.type).toBe("City");
  });

  test("getBarangayByCode finds a barangay", () => {
    expect(queries.getBarangayByCode(index, "0730600041")?.name).toBe("Lahug");
  });

  test.each([
    ["getRegionByCode", queries.getRegionByCode],
    ["getProvinceByCode", queries.getProvinceByCode],
    ["getCityByCode", queries.getCityByCode],
    ["getBarangayByCode", queries.getBarangayByCode],
  ])("%s returns null for an unknown code", (_label, lookup) => {
    expect(lookup(index, "9999999999")).toBeNull();
  });

  test.each([
    ["getRegionByCode", queries.getRegionByCode],
    ["getProvinceByCode", queries.getProvinceByCode],
    ["getCityByCode", queries.getCityByCode],
    ["getBarangayByCode", queries.getBarangayByCode],
  ])("%s returns null for non-string input", (_label, lookup) => {
    expect(lookup(index, null as unknown as string)).toBeNull();
  });
});

describe("lookups by parent", () => {
  test("getProvincesByRegion returns the provinces of a region", () => {
    expect(
      queries.getProvincesByRegion(index, "0700000000").map((p) => p.name),
    ).toEqual(["Bohol", "Cebu", "Special Area (Not a Province)"]);
  });

  test("getProvincesByRegion is empty for a region with no provinces", () => {
    expect(queries.getProvincesByRegion(index, "1300000000")).toEqual([]);
  });

  test("getCitiesByProvince returns the cities of a province", () => {
    expect(
      queries.getCitiesByProvince(index, "0702200000").map((c) => c.name),
    ).toEqual(["Argao"]);
  });

  test("an entry that is not a province still has cities under it", () => {
    expect(
      queries.getCitiesByProvince(index, "0799900000").map((c) => c.name),
    ).toEqual(["Lone Municipality"]);
  });

  test("getCitiesByRegion leaves out sub-municipalities by default", () => {
    expect(
      queries.getCitiesByRegion(index, "1300000000").map((c) => c.name),
    ).toEqual(["City of Parañaque", "City of Manila"]);
  });

  test("getCitiesByRegion can include sub-municipalities", () => {
    expect(
      queries
        .getCitiesByRegion(index, "1300000000", {
          includeSubMunicipalities: true,
        })
        .map((c) => c.name),
    ).toEqual([
      "City of Parañaque",
      "City of Manila",
      "Tondo I/II",
      "Intramuros",
    ]);
  });

  test("getSubMunicipalitiesByCity returns the districts of a city", () => {
    expect(
      queries
        .getSubMunicipalitiesByCity(index, "1380600000")
        .map((c) => c.name),
    ).toEqual(["Tondo I/II", "Intramuros"]);
  });

  test("a district with no barangays of its own contributes none", () => {
    expect(queries.getBarangaysByCity(index, "1380609000")).toEqual([]);
  });

  test("getSubMunicipalitiesByCity is empty for a city that has none", () => {
    expect(queries.getSubMunicipalitiesByCity(index, "0730600000")).toEqual([]);
  });

  test("a city with no barangays of its own answers with its districts'", () => {
    expect(
      queries.getBarangaysByCity(index, "1380600000").map((b) => b.name),
    ).toEqual(["Tondo I/II Barangay 1"]);
  });

  test("a district still answers for its own barangays", () => {
    expect(
      queries.getBarangaysByCity(index, "1380601000").map((b) => b.name),
    ).toEqual(["Tondo I/II Barangay 1"]);
  });

  test("getCitiesByRegion includes cities that have no province", () => {
    expect(
      queries.getCitiesByRegion(index, "0700000000").map((c) => c.name),
    ).toEqual(["Tagbilaran", "Argao", "City of Cebu", "Lone Municipality"]);
  });

  test("getBarangaysByCity returns the barangays of a city", () => {
    expect(
      queries.getBarangaysByCity(index, "0730600000").map((b) => b.name),
    ).toEqual(["Lahug", "Mabolo"]);
  });

  test.each([
    ["getProvincesByRegion", queries.getProvincesByRegion],
    ["getCitiesByProvince", queries.getCitiesByProvince],
    ["getCitiesByRegion", queries.getCitiesByRegion],
    ["getBarangaysByCity", queries.getBarangaysByCity],
  ])("%s returns an empty array for an unknown code", (_label, lookup) => {
    expect(lookup(index, "9999999999")).toEqual([]);
  });

  test.each([
    ["getProvincesByRegion", queries.getProvincesByRegion],
    ["getCitiesByProvince", queries.getCitiesByProvince],
    ["getCitiesByRegion", queries.getCitiesByRegion],
    ["getBarangaysByCity", queries.getBarangaysByCity],
  ])("%s returns an empty array for non-string input", (_label, lookup) => {
    expect(lookup(index, undefined as unknown as string)).toEqual([]);
  });
});

describe("results are copies", () => {
  test("mutating a returned list does not change the next call", () => {
    const first = queries.getRegions(index);
    first.pop();
    expect(queries.getRegions(index)).toHaveLength(2);
  });

  test("mutating a returned group does not change the next call", () => {
    const first = queries.getBarangaysByCity(index, "0730600000");
    first.length = 0;
    expect(queries.getBarangaysByCity(index, "0730600000")).toHaveLength(2);
  });
});

describe("search by name", () => {
  test("matches part of a name", () => {
    expect(queries.findCitiesByName(index, "cebu").map((c) => c.name)).toEqual([
      "City of Cebu",
    ]);
  });

  test("ignores case", () => {
    expect(
      queries.findProvincesByName(index, "CEBU").map((p) => p.name),
    ).toEqual(["Cebu"]);
  });

  test("ignores accents in the query", () => {
    expect(
      queries.findCitiesByName(index, "paranaque").map((c) => c.name),
    ).toEqual(["City of Parañaque"]);
  });

  test("ignores accents in the data", () => {
    expect(
      queries.findCitiesByName(index, "parañaque").map((c) => c.name),
    ).toEqual(["City of Parañaque"]);
  });

  test("finds regions", () => {
    expect(queries.findRegionsByName(index, "visayas")).toHaveLength(1);
  });

  test("finds barangays across every city", () => {
    expect(queries.findBarangaysByName(index, "a")).toHaveLength(5);
  });

  test("scopes barangays to one city", () => {
    expect(
      queries.findBarangaysByName(index, "a", { cityCode: "0730600000" }),
    ).toHaveLength(2);
  });

  test("returns nothing for an unknown city scope", () => {
    expect(
      queries.findBarangaysByName(index, "a", { cityCode: "9999999999" }),
    ).toEqual([]);
  });

  test.each([
    ["empty", ""],
    ["whitespace", "   "],
  ])("returns nothing for a %s query", (_label, query) => {
    expect(queries.findCitiesByName(index, query)).toEqual([]);
    expect(queries.findRegionsByName(index, query)).toEqual([]);
    expect(queries.findProvincesByName(index, query)).toEqual([]);
    expect(queries.findBarangaysByName(index, query)).toEqual([]);
  });

  test("trims the query", () => {
    expect(
      queries.findCitiesByName(index, "  cebu  ").map((c) => c.name),
    ).toEqual(["City of Cebu"]);
  });

  test("returns nothing for non-string input", () => {
    expect(queries.findCitiesByName(index, null as unknown as string)).toEqual(
      [],
    );
  });

  test("returns nothing when nothing matches", () => {
    expect(queries.findCitiesByName(index, "reykjavik")).toEqual([]);
  });
});
