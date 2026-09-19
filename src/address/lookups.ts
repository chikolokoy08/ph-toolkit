import { index } from "./data.js";
import * as queries from "./queries.js";
import type {
  Barangay,
  City,
  CityListOptions,
  Province,
  Region,
} from "./types.js";

/**
 * Returns all 18 regions, in PSGC order.
 *
 * @example
 * getRegions().find((region) => region.name.includes("Central Visayas"));
 */
export function getRegions(): Region[] {
  return queries.getRegions(index);
}

/**
 * Looks up a region by its PSGC code, or returns null if there is no match.
 *
 * @example
 * getRegionByCode("0700000000"); // Region VII (Central Visayas)
 */
export function getRegionByCode(code: string): Region | null {
  return queries.getRegionByCode(index, code);
}

/**
 * Returns every province, including the two PSA entries whose isProvince is
 * false. See the Province type for what those are.
 *
 * @example
 * getProvinces().filter((province) => province.isProvince).length; // 82
 */
export function getProvinces(): Province[] {
  return queries.getProvinces(index);
}

/**
 * Looks up a province by its PSGC code, or returns null if there is no match.
 *
 * @example
 * getProvinceByCode("0702200000"); // Cebu
 */
export function getProvinceByCode(code: string): Province | null {
  return queries.getProvinceByCode(index, code);
}

/**
 * Returns the provinces of a region, in PSGC order. Empty for NCR, which has
 * no provinces: use getCitiesByRegion there.
 *
 * @example
 * getProvincesByRegion("0700000000"); // Bohol and Cebu
 */
export function getProvincesByRegion(regionCode: string): Province[] {
  return queries.getProvincesByRegion(index, regionCode);
}

/**
 * Returns every city, municipality, and sub-municipality in the country.
 *
 * @example
 * getCities().filter((city) => city.type === "City").length;
 */
export function getCities(): City[] {
  return queries.getCities(index);
}

/**
 * Looks up a city or municipality by its PSGC code, or returns null if there
 * is no match.
 *
 * @example
 * getCityByCode("0730600000"); // City of Cebu
 */
export function getCityByCode(code: string): City | null {
  return queries.getCityByCode(index, code);
}

/**
 * Returns the cities and municipalities of a province, in PSGC order.
 * Sub-municipalities are left out unless you ask for them.
 *
 * @example
 * getCitiesByProvince("0702200000").length; // 50, the cities and municipalities of Cebu
 */
export function getCitiesByProvince(
  provinceCode: string,
  options?: CityListOptions,
): City[] {
  return queries.getCitiesByProvince(index, provinceCode, options);
}

/**
 * Returns every city and municipality in a region, whether or not it sits
 * under a province. This is how to list the cities of NCR.
 *
 * Sub-municipalities are left out unless you ask for them, so Metro Manila
 * lists the City of Manila once rather than followed by its 14 districts.
 *
 * @example
 * getCitiesByRegion("1300000000").length; // 17, the cities of Metro Manila
 */
export function getCitiesByRegion(
  regionCode: string,
  options?: CityListOptions,
): City[] {
  return queries.getCitiesByRegion(index, regionCode, options);
}

/**
 * Returns the sub-municipalities of a city, in PSGC order. Only the City of
 * Manila has any; every other city returns an empty array. Use this for an
 * optional district step in an address form.
 *
 * @example
 * getSubMunicipalitiesByCity("1380600000").length; // 14, the districts of Manila
 */
export function getSubMunicipalitiesByCity(cityCode: string): City[] {
  return queries.getSubMunicipalitiesByCity(index, cityCode);
}

/**
 * Looks up a barangay by its PSGC code, or returns null if there is no match.
 *
 * @example
 * getBarangayByCode("0730600041"); // Lahug, City of Cebu
 */
export function getBarangayByCode(code: string): Barangay | null {
  return queries.getBarangayByCode(index, code);
}

/**
 * Returns the barangays of a city or municipality, in PSGC order.
 *
 * The City of Manila holds no barangays directly, so this returns all 897
 * from its 14 sub-municipalities. Passing a sub-municipality code returns
 * only that district's barangays.
 *
 * @example
 * getBarangaysByCity("0730600000").length; // 80, the barangays of City of Cebu
 */
export function getBarangaysByCity(cityCode: string): Barangay[] {
  return queries.getBarangaysByCity(index, cityCode);
}
