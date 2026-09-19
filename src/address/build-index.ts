import type { Barangay, City, CityType, Province, Region } from "./types.js";

export type RawRegion = [code: string, name: string];
export type RawProvince = [
  code: string,
  name: string,
  regionCode: string,
  isProvince: boolean,
];
export type RawCity = [
  code: string,
  name: string,
  provinceCode: string | null,
  regionCode: string,
  type: CityType,
  parentCityCode: string | null,
];
export type RawBarangay = [code: string, name: string, cityCode: string];

export interface RawDataset {
  regions: RawRegion[];
  provinces: RawProvince[];
  cities: RawCity[];
  barangays: RawBarangay[];
}

export interface AddressIndex {
  regions: Region[];
  provinces: Province[];
  cities: City[];
  barangays: Barangay[];
  regionByCode: Map<string, Region>;
  provinceByCode: Map<string, Province>;
  cityByCode: Map<string, City>;
  barangayByCode: Map<string, Barangay>;
  provincesByRegion: Map<string, Province[]>;
  citiesByProvince: Map<string, City[]>;
  citiesByRegion: Map<string, City[]>;
  barangaysByCity: Map<string, Barangay[]>;
  subMunicipalitiesByParent: Map<string, City[]>;
}

function byCode<T extends { code: string }>(items: T[]): Map<string, T> {
  return new Map(items.map((item) => [item.code, item]));
}

function groupBy<T>(
  items: T[],
  parentOf: (item: T) => string | null,
): Map<string, T[]> {
  const groups = new Map<string, T[]>();

  for (const item of items) {
    const parent = parentOf(item);
    if (parent === null) {
      continue;
    }
    const bucket = groups.get(parent);
    if (bucket === undefined) {
      groups.set(parent, [item]);
    } else {
      bucket.push(item);
    }
  }

  return groups;
}

export function buildIndex(raw: RawDataset): AddressIndex {
  const regions: Region[] = raw.regions.map(([code, name]) => ({ code, name }));
  const provinces: Province[] = raw.provinces.map(
    ([code, name, regionCode, isProvince]) => ({
      code,
      name,
      regionCode,
      isProvince,
    }),
  );
  const cities: City[] = raw.cities.map(
    ([code, name, provinceCode, regionCode, type, parentCityCode]) => ({
      code,
      name,
      provinceCode,
      regionCode,
      parentCityCode,
      type,
    }),
  );
  const barangays: Barangay[] = raw.barangays.map(([code, name, cityCode]) => ({
    code,
    name,
    cityCode,
  }));

  const barangaysByCity = groupBy(barangays, (barangay) => barangay.cityCode);

  // The City of Manila holds no barangays of its own; they belong to its
  // sub-municipalities. Rolling them up means a region to city to barangay
  // dropdown works there without a special case, while a district still
  // answers for its own barangays.
  for (const city of cities) {
    if (city.parentCityCode === null) {
      continue;
    }
    const own = barangaysByCity.get(city.code) ?? [];
    const parent = barangaysByCity.get(city.parentCityCode);
    if (parent === undefined) {
      barangaysByCity.set(city.parentCityCode, [...own]);
    } else {
      parent.push(...own);
    }
  }

  return {
    regions,
    provinces,
    cities,
    barangays,
    regionByCode: byCode(regions),
    provinceByCode: byCode(provinces),
    cityByCode: byCode(cities),
    barangayByCode: byCode(barangays),
    provincesByRegion: groupBy(provinces, (province) => province.regionCode),
    citiesByProvince: groupBy(cities, (city) => city.provinceCode),
    citiesByRegion: groupBy(cities, (city) => city.regionCode),
    barangaysByCity,
    subMunicipalitiesByParent: groupBy(cities, (city) => city.parentCityCode),
  };
}
