import { index } from "./data.js";
import * as queries from "./queries.js";
import type { Barangay, City, Province, Region } from "./types.js";

/**
 * Finds regions whose name contains the query. Case- and accent-insensitive.
 * An empty query returns an empty array.
 *
 * @example
 * findRegionsByName("visayas"); // Regions VI, VII, and VIII
 */
export function findRegionsByName(query: string): Region[] {
  return queries.findRegionsByName(index, query);
}

/**
 * Finds provinces whose name contains the query. Case- and accent-insensitive.
 *
 * @example
 * findProvincesByName("camarines"); // Camarines Norte, Camarines Sur
 */
export function findProvincesByName(query: string): Province[] {
  return queries.findProvincesByName(index, query);
}

/**
 * Finds cities and municipalities whose name contains the query. Case- and
 * accent-insensitive, so "paranaque" matches "Parañaque".
 *
 * @example
 * findCitiesByName("paranaque"); // City of Parañaque
 */
export function findCitiesByName(query: string): City[] {
  return queries.findCitiesByName(index, query);
}

/**
 * Finds barangays whose name contains the query. Pass a cityCode to search
 * one city instead of all 42,010 barangays, which is much faster and is what
 * an address form usually wants.
 *
 * @example
 * findBarangaysByName("lahug", { cityCode: "0730600000" }); // Lahug
 */
export function findBarangaysByName(
  query: string,
  options?: { cityCode?: string },
): Barangay[] {
  return queries.findBarangaysByName(index, query, options);
}
