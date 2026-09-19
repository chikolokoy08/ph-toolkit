import { asString } from "../internal/guards.js";
import type { AddressIndex } from "./build-index.js";
import type {
  Barangay,
  City,
  CityListOptions,
  Province,
  Region,
} from "./types.js";

/** Results are copies so a caller cannot mutate the shared index. */
function list<T>(items: T[]): T[] {
  return [...items];
}

function one<T>(source: Map<string, T>, code: unknown): T | null {
  const text = asString(code);
  return text === null ? null : (source.get(text) ?? null);
}

function many<T>(source: Map<string, T[]>, code: unknown): T[] {
  const text = asString(code);
  return text === null ? [] : list(source.get(text) ?? []);
}

/** Sub-municipalities are the districts of one city, not places of their own,
 * so a city list leaves them out unless they are asked for. */
function cityList(items: City[], options: CityListOptions): City[] {
  return options.includeSubMunicipalities === true
    ? items
    : items.filter((city) => city.type !== "SubMunicipality");
}

/** Diacritics are folded so "Parañaque" and "Paranaque" match each other. */
function fold(value: string): string {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();
}

function toNeedle(query: unknown): string | null {
  const text = asString(query);
  if (text === null) {
    return null;
  }
  const trimmed = text.trim();
  return trimmed === "" ? null : fold(trimmed);
}

function search<T extends { name: string }>(items: T[], query: unknown): T[] {
  const needle = toNeedle(query);
  return needle === null
    ? []
    : items.filter((item) => fold(item.name).includes(needle));
}

export function getRegions(index: AddressIndex): Region[] {
  return list(index.regions);
}

export function getRegionByCode(
  index: AddressIndex,
  code: string,
): Region | null {
  return one(index.regionByCode, code);
}

export function getProvinces(index: AddressIndex): Province[] {
  return list(index.provinces);
}

export function getProvinceByCode(
  index: AddressIndex,
  code: string,
): Province | null {
  return one(index.provinceByCode, code);
}

export function getProvincesByRegion(
  index: AddressIndex,
  regionCode: string,
): Province[] {
  return many(index.provincesByRegion, regionCode);
}

export function getCities(
  index: AddressIndex,
  options: CityListOptions = {},
): City[] {
  return cityList(list(index.cities), options);
}

export function getCityByCode(index: AddressIndex, code: string): City | null {
  return one(index.cityByCode, code);
}

export function getCitiesByProvince(
  index: AddressIndex,
  provinceCode: string,
  options: CityListOptions = {},
): City[] {
  return cityList(many(index.citiesByProvince, provinceCode), options);
}

export function getCitiesByRegion(
  index: AddressIndex,
  regionCode: string,
  options: CityListOptions = {},
): City[] {
  return cityList(many(index.citiesByRegion, regionCode), options);
}

export function getSubMunicipalitiesByCity(
  index: AddressIndex,
  cityCode: string,
): City[] {
  return many(index.subMunicipalitiesByParent, cityCode);
}

export function getBarangayByCode(
  index: AddressIndex,
  code: string,
): Barangay | null {
  return one(index.barangayByCode, code);
}

export function getBarangaysByCity(
  index: AddressIndex,
  cityCode: string,
): Barangay[] {
  return many(index.barangaysByCity, cityCode);
}

export function findRegionsByName(
  index: AddressIndex,
  query: string,
): Region[] {
  return search(index.regions, query);
}

export function findProvincesByName(
  index: AddressIndex,
  query: string,
): Province[] {
  return search(index.provinces, query);
}

export function findCitiesByName(index: AddressIndex, query: string): City[] {
  return search(index.cities, query);
}

export function findBarangaysByName(
  index: AddressIndex,
  query: string,
  options: { cityCode?: string } = {},
): Barangay[] {
  const { cityCode } = options;
  const scope =
    cityCode === undefined
      ? index.barangays
      : many(index.barangaysByCity, cityCode);
  return search(scope, query);
}
