import barangaysJson from "../../data/psgc/barangays.json";
import citiesJson from "../../data/psgc/cities.json";
import provincesJson from "../../data/psgc/provinces.json";
import regionsJson from "../../data/psgc/regions.json";
import type {
  RawBarangay,
  RawCity,
  RawProvince,
  RawRegion,
} from "./build-index.js";
import { buildIndex } from "./build-index.js";

// scripts/build-psgc.ts produces these files in exactly these shapes and
// validates every parent link before writing them, so they are asserted once
// here rather than re-checked at run time.
export const index = buildIndex({
  regions: regionsJson as RawRegion[],
  provinces: provincesJson as RawProvince[],
  cities: citiesJson as RawCity[],
  barangays: barangaysJson as RawBarangay[],
});
