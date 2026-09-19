export type CityType = "City" | "Municipality" | "SubMunicipality";

export interface Region {
  code: string;
  name: string;
}

export interface Province {
  code: string;
  name: string;
  regionCode: string;
  /**
   * False for the two PSA entries that carry a province code without being
   * provinces: "City of Isabela (Not a Province)" under Region IX, and
   * "Special Geographic Area" under BARMM. They are kept at the province level
   * so the cities and municipalities under them stay reachable, and their
   * names are left as the PSA publishes them.
   */
  isProvince: boolean;
}

export interface City {
  code: string;
  name: string;
  /** Null for cities that sit directly under a region, such as those in NCR. */
  provinceCode: string | null;
  regionCode: string;
  type: CityType;
  /**
   * The city a sub-municipality belongs to, and null for everything else. The
   * 14 sub-municipalities are the districts of the City of Manila, such as
   * Tondo I/II and Intramuros.
   */
  parentCityCode: string | null;
}

export interface Barangay {
  code: string;
  name: string;
  cityCode: string;
}

export interface CityListOptions {
  /**
   * Include sub-municipalities in the result. They are left out by default so
   * a city dropdown shows the City of Manila once rather than followed by its
   * 14 districts.
   */
  includeSubMunicipalities?: boolean;
}
