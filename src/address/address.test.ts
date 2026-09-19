import { describe, expect, test } from "vitest";
import {
  PSGC_VERSION,
  findBarangaysByName,
  findCitiesByName,
  findProvincesByName,
  findRegionsByName,
  getBarangayByCode,
  getBarangaysByCity,
  getCities,
  getCitiesByProvince,
  getCitiesByRegion,
  getCityByCode,
  getProvinceByCode,
  getProvinces,
  getProvincesByRegion,
  getRegionByCode,
  getRegions,
  getSubMunicipalitiesByCity,
} from "./index.js";

const NCR = "1300000000";
const REGION_VII = "0700000000";
const CEBU_PROVINCE = "0702200000";
const CITY_OF_CEBU = "0730600000";
const LAHUG = "0730600041";
const CITY_OF_MANILA = "1380600000";
const TONDO = "1380601000";

describe("dataset", () => {
  test("PSGC_VERSION is the release date of the PSA publication", () => {
    expect(PSGC_VERSION).toBe("2026-06-30");
  });

  test("has every region, province, city, and barangay", () => {
    expect(getRegions()).toHaveLength(18);
    expect(getProvinces()).toHaveLength(84);
    expect(getCities()).toHaveLength(1656);
  });

  test("every province belongs to a region that exists", () => {
    for (const province of getProvinces()) {
      expect(getRegionByCode(province.regionCode)).not.toBeNull();
    }
  });

  test("every city belongs to a region, and to a province when it has one", () => {
    for (const city of getCities()) {
      expect(getRegionByCode(city.regionCode)).not.toBeNull();
      if (city.provinceCode !== null) {
        expect(getProvinceByCode(city.provinceCode)?.regionCode).toBe(
          city.regionCode,
        );
      }
    }
  });

  test("every province is reachable from its region", () => {
    for (const province of getProvinces()) {
      expect(getProvincesByRegion(province.regionCode)).toContainEqual(
        province,
      );
    }
  });

  test("every city is reachable from its region", () => {
    for (const city of getCities()) {
      expect(
        getCitiesByRegion(city.regionCode, { includeSubMunicipalities: true }),
      ).toContainEqual(city);
    }
  });

  test("codes are unique across the whole dataset", () => {
    const codes = [
      ...getRegions().map((region) => region.code),
      ...getProvinces().map((province) => province.code),
      ...getCities().map((city) => city.code),
    ];
    expect(new Set(codes).size).toBe(codes.length);
  });
});

describe("entries that hold a province code without being provinces", () => {
  const notProvinces = getProvinces().filter(
    (province) => !province.isProvince,
  );

  test("there are two of them, named as the PSA publishes them", () => {
    expect(notProvinces.map((province) => province.name)).toEqual([
      "City of Isabela (Not a Province)",
      "Special Geographic Area",
    ]);
  });

  test("every other province is marked isProvince", () => {
    expect(
      getProvinces().filter((province) => province.isProvince),
    ).toHaveLength(82);
  });

  test.each([
    ["City of Isabela (Not a Province)", "0990100000", "0900000000", 1],
    ["Special Geographic Area", "1999900000", "1900000000", 8],
  ])(
    "%s appears under its region and has cities under it",
    (name, code, regionCode, children) => {
      const province = getProvinceByCode(code);
      expect(province?.name).toBe(name);
      expect(province?.isProvince).toBe(false);
      expect(getProvincesByRegion(regionCode)).toContainEqual(province);
      expect(getCitiesByProvince(code)).toHaveLength(children);
    },
  );

  test("City of Isabela resolves through getCitiesByProvince", () => {
    expect(getCitiesByProvince("0990100000").map((city) => city.name)).toEqual([
      "City of Isabela",
    ]);
  });

  test("the Special Geographic Area municipalities resolve through getCitiesByProvince", () => {
    const municipalities = getCitiesByProvince("1999900000");
    expect(municipalities.map((city) => city.name)).toContain("Kapalawan");
    expect(municipalities.every((city) => city.type === "Municipality")).toBe(
      true,
    );
  });
});

describe("cities that sit directly under a region", () => {
  test("NCR has no provinces but does have cities", () => {
    expect(getProvincesByRegion(NCR)).toEqual([]);
    expect(getCitiesByRegion(NCR)).toHaveLength(17);
  });

  test("a highly urbanized city is not attached to the province around it", () => {
    const cebuCity = getCityByCode(CITY_OF_CEBU);
    expect(cebuCity?.name).toBe("City of Cebu");
    expect(cebuCity?.provinceCode).toBeNull();
    expect(
      getCitiesByProvince(CEBU_PROVINCE).map((city) => city.code),
    ).not.toContain(CITY_OF_CEBU);
    expect(getCitiesByRegion(REGION_VII).map((city) => city.code)).toContain(
      CITY_OF_CEBU,
    );
  });

  test("Baguio is not attached to Benguet", () => {
    expect(getCityByCode("1430300000")?.provinceCode).toBeNull();
  });

  test("Zamboanga is not attached to the Isabela entry", () => {
    expect(getCityByCode("0931700000")?.provinceCode).toBeNull();
  });
});

describe("lookups against the real dataset", () => {
  test("finds a region by code", () => {
    expect(getRegionByCode(REGION_VII)?.name).toBe(
      "Region VII (Central Visayas)",
    );
  });

  test("finds a province by code", () => {
    expect(getProvinceByCode(CEBU_PROVINCE)?.name).toBe("Cebu");
  });

  test("lists the cities and municipalities of a province", () => {
    expect(getCitiesByProvince(CEBU_PROVINCE)).toHaveLength(50);
  });

  test("lists the barangays of a city", () => {
    expect(getBarangaysByCity(CITY_OF_CEBU)).toHaveLength(80);
  });

  test("finds a barangay by code", () => {
    const barangay = getBarangayByCode(LAHUG);
    expect(barangay?.name).toBe("Lahug");
    expect(barangay?.cityCode).toBe(CITY_OF_CEBU);
  });

  test("returns null for a code that does not exist", () => {
    expect(getCityByCode("9999999999")).toBeNull();
  });
});

describe("search against the real dataset", () => {
  test("finds the three Visayas regions", () => {
    expect(findRegionsByName("visayas")).toHaveLength(3);
  });

  test("finds both Camarines provinces", () => {
    expect(
      findProvincesByName("camarines").map((province) => province.name),
    ).toEqual(["Camarines Norte", "Camarines Sur"]);
  });

  test("matches a name with a tilde when the query has none", () => {
    expect(findCitiesByName("paranaque").map((city) => city.name)).toEqual([
      "City of Parañaque",
    ]);
  });

  test("scopes a barangay search to one city", () => {
    expect(
      findBarangaysByName("lahug", { cityCode: CITY_OF_CEBU }).map(
        (b) => b.name,
      ),
    ).toEqual(["Lahug"]);
  });

  test("searches every barangay when no city is given", () => {
    expect(findBarangaysByName("poblacion").length).toBeGreaterThan(100);
  });
});

describe("sub-municipalities", () => {
  test("a city list shows the City of Manila but not its districts", () => {
    const names = getCitiesByRegion(NCR).map((city) => city.name);
    expect(names).toContain("City of Manila");
    expect(names).not.toContain("Tondo I/II");
    expect(
      getCitiesByRegion(NCR).every((city) => city.type !== "SubMunicipality"),
    ).toBe(true);
  });

  test("the districts are there when asked for", () => {
    const all = getCitiesByRegion(NCR, { includeSubMunicipalities: true });
    expect(all).toHaveLength(31);
    expect(all.map((city) => city.name)).toContain("Tondo I/II");
  });

  test("getSubMunicipalitiesByCity returns all 14 districts of Manila", () => {
    const districts = getSubMunicipalitiesByCity(CITY_OF_MANILA);
    expect(districts).toHaveLength(14);
    expect(districts.map((city) => city.name)).toEqual([
      "Tondo I/II",
      "Binondo",
      "Quiapo",
      "San Nicolas",
      "Santa Cruz",
      "Sampaloc",
      "San Miguel",
      "Ermita",
      "Intramuros",
      "Malate",
      "Paco",
      "Pandacan",
      "Port Area",
      "Santa Ana",
    ]);
    expect(
      districts.every((city) => city.parentCityCode === CITY_OF_MANILA),
    ).toBe(true);
  });

  test("every other city has no sub-municipalities", () => {
    expect(getSubMunicipalitiesByCity(CITY_OF_CEBU)).toEqual([]);
    expect(
      getCities().filter((city) => city.parentCityCode !== null),
    ).toHaveLength(14);
  });

  test("Manila's barangays are the union of its districts' barangays", () => {
    const union = getSubMunicipalitiesByCity(CITY_OF_MANILA).flatMap(
      (district) => getBarangaysByCity(district.code),
    );
    expect(union).toHaveLength(897);
    expect(getBarangaysByCity(CITY_OF_MANILA)).toEqual(union);
  });

  test("a district still answers for its own barangays", () => {
    const tondo = getBarangaysByCity(TONDO);
    expect(tondo.length).toBeGreaterThan(0);
    expect(tondo.every((barangay) => barangay.cityCode === TONDO)).toBe(true);
  });

  test("a Tondo barangay resolves directly to its district", () => {
    const [first] = getBarangaysByCity(TONDO);
    expect(first).toBeDefined();
    expect(getBarangayByCode(first?.code ?? "")?.cityCode).toBe(TONDO);
    expect(getCityByCode(TONDO)?.parentCityCode).toBe(CITY_OF_MANILA);
  });

  test("a city that is not a sub-municipality has a null parent", () => {
    expect(getCityByCode(CITY_OF_CEBU)?.parentCityCode).toBeNull();
  });
});
