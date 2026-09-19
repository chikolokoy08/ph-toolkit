# Building a cascading address selector

This walks through a region to province to city to barangay dropdown in React,
using `@chikolokoy08/ph-toolkit/address`. The dataset is bundled and every lookup is
synchronous, so there is nothing to fetch and no loading state.

```bash
npm install @chikolokoy08/ph-toolkit
```

## The shape of the data

Four levels, each with a PSGC code:

| Level                | Lookup by code      | Lookup by parent                           |
| -------------------- | ------------------- | ------------------------------------------ |
| Region               | `getRegionByCode`   | `getRegions`                               |
| Province             | `getProvinceByCode` | `getProvincesByRegion`                     |
| City or municipality | `getCityByCode`     | `getCitiesByProvince`, `getCitiesByRegion` |
| Barangay             | `getBarangayByCode` | `getBarangaysByCity`                       |

Two things about Philippine geography make a naive cascade wrong, and both are
handled below.

## Regions without provinces

NCR has no provinces. Its 17 cities and municipalities sit directly under the
region, so `getProvincesByRegion("1300000000")` returns an empty array.

The same applies to highly urbanized cities elsewhere. City of Cebu, City of
Baguio, and City of Zamboanga are independent of the provinces around them, so
their `provinceCode` is `null` and they do not appear in
`getCitiesByProvince`. There are 34 such cities and municipalities: the 17
in NCR, and 17 highly urbanized cities elsewhere.

Handle both by skipping the province step when a region has no provinces, and
by listing a region's province-less cities alongside its provinces:

```jsx
import {
  getCitiesByProvince,
  getCitiesByRegion,
  getProvincesByRegion,
} from "@chikolokoy08/ph-toolkit/address";

function citiesFor(regionCode, provinceCode) {
  if (provinceCode) {
    return getCitiesByProvince(provinceCode);
  }
  // No province chosen: show the cities that do not belong to one.
  return getCitiesByRegion(regionCode).filter(
    (city) => city.provinceCode === null,
  );
}

function provincesFor(regionCode) {
  return getProvincesByRegion(regionCode);
}
```

## The City of Manila and its districts

The City of Manila has no barangays of its own. Its 897 barangays belong to 14
sub-municipalities, the districts established under RA 409: Tondo I/II,
Binondo, Quiapo, San Nicolas, Santa Cruz, Sampaloc, San Miguel, Ermita,
Intramuros, Malate, Paco, Pandacan, Port Area, and Santa Ana. The PSA gives
each one a code, but they are not municipalities.

You do not have to care about this. `getCities`, `getCitiesByRegion`, and
`getCitiesByProvince` leave sub-municipalities out, so Metro Manila lists the
City of Manila once. And `getBarangaysByCity("1380600000")` returns all 897
barangays across the districts, so a region to city to barangay cascade works
in Manila with no special case.

If you do want a district step, add one. It appears only for Manila, because
every other city returns an empty array:

```jsx
import {
  getBarangaysByCity,
  getSubMunicipalitiesByCity,
} from "@chikolokoy08/ph-toolkit/address";

function DistrictStep({ cityCode, districtCode, onChange }) {
  const districts = getSubMunicipalitiesByCity(cityCode);
  if (districts.length === 0) {
    return null;
  }

  return (
    <label>
      District
      <select
        value={districtCode}
        onChange={(event) => onChange(event.target.value)}
      >
        <option value="">All districts</option>
        {districts.map((district) => (
          <option key={district.code} value={district.code}>
            {district.name}
          </option>
        ))}
      </select>
    </label>
  );
}

// Barangays for the chosen district, or all of Manila's when none is chosen.
const barangays = getBarangaysByCity(districtCode || cityCode);
```

To list the districts inline with the cities instead, pass the option. It works
the same way on `getCities`, `getCitiesByRegion`, and `getCitiesByProvince`:

```js
getCitiesByRegion("1300000000", { includeSubMunicipalities: true }); // 31 entries
getCities({ includeSubMunicipalities: true }).length; // 1656, up from 1642
```

## Entries that hold a province code without being provinces

Two rows in the PSGC sit at the province level without being provinces:

- `0990100000` "City of Isabela (Not a Province)" under Region IX, which
  contains City of Isabela.
- `1999900000` "Special Geographic Area" under BARMM, which contains 8
  municipalities.

They are shipped as provinces so the places under them stay reachable through
a normal cascade, and their names are left exactly as the PSA publishes them so
the dataset can be diffed against a future release. Each has
`isProvince: false`.

Filter them out if you only want real provinces:

```js
getProvincesByRegion("0900000000").filter((province) => province.isProvince);
```

Or relabel them in the dropdown while keeping them selectable:

```jsx
{
  provinces.map((province) => (
    <option key={province.code} value={province.code}>
      {province.isProvince
        ? province.name
        : `${province.name.replace(/ \(Not a Province\)$/, "")} (city)`}
    </option>
  ));
}
```

## A complete selector

```jsx
import { useState } from "react";
import {
  getBarangaysByCity,
  getCitiesByProvince,
  getCitiesByRegion,
  getProvincesByRegion,
  getRegions,
} from "@chikolokoy08/ph-toolkit/address";

export function AddressSelector({ onChange }) {
  const [regionCode, setRegionCode] = useState("");
  const [provinceCode, setProvinceCode] = useState("");
  const [cityCode, setCityCode] = useState("");
  const [barangayCode, setBarangayCode] = useState("");

  const provinces = regionCode ? getProvincesByRegion(regionCode) : [];
  const cities = provinceCode
    ? getCitiesByProvince(provinceCode)
    : regionCode
      ? getCitiesByRegion(regionCode).filter(
          (city) => city.provinceCode === null,
        )
      : [];
  const barangays = cityCode ? getBarangaysByCity(cityCode) : [];

  function selectRegion(code) {
    setRegionCode(code);
    setProvinceCode("");
    setCityCode("");
    setBarangayCode("");
  }

  function selectProvince(code) {
    setProvinceCode(code);
    setCityCode("");
    setBarangayCode("");
  }

  function selectCity(code) {
    setCityCode(code);
    setBarangayCode("");
  }

  function selectBarangay(code) {
    setBarangayCode(code);
    onChange({ regionCode, provinceCode, cityCode, barangayCode: code });
  }

  return (
    <fieldset>
      <label>
        Region
        <select
          value={regionCode}
          onChange={(event) => selectRegion(event.target.value)}
        >
          <option value="">Select a region</option>
          {getRegions().map((region) => (
            <option key={region.code} value={region.code}>
              {region.name}
            </option>
          ))}
        </select>
      </label>

      {provinces.length > 0 && (
        <label>
          Province
          <select
            value={provinceCode}
            onChange={(event) => selectProvince(event.target.value)}
          >
            <option value="">Select a province</option>
            {provinces.map((province) => (
              <option key={province.code} value={province.code}>
                {province.name}
              </option>
            ))}
          </select>
        </label>
      )}

      <label>
        City or municipality
        <select
          value={cityCode}
          disabled={cities.length === 0}
          onChange={(event) => selectCity(event.target.value)}
        >
          <option value="">Select a city or municipality</option>
          {cities.map((city) => (
            <option key={city.code} value={city.code}>
              {city.name}
            </option>
          ))}
        </select>
      </label>

      <label>
        Barangay
        <select
          value={barangayCode}
          disabled={barangays.length === 0}
          onChange={(event) => selectBarangay(event.target.value)}
        >
          <option value="">Select a barangay</option>
          {barangays.map((barangay) => (
            <option key={barangay.code} value={barangay.code}>
              {barangay.name}
            </option>
          ))}
        </select>
      </label>
    </fieldset>
  );
}
```

## Searching instead of scrolling

There are 42,010 barangays. A type-ahead beats a dropdown once the city is
known. Scope the search to the chosen city, which is much faster than searching
the whole country:

```js
import { findBarangaysByName } from "@chikolokoy08/ph-toolkit/address";

findBarangaysByName(query, { cityCode: "0730600000" });
```

Search is case- and accent-insensitive, so "paranaque" matches "Parañaque".

## Storing what the user picked

Store the PSGC codes, not the names. Names change: the PSGC is republished
quarterly and places get renamed, merged, or reclassified. Codes are stable and
you can resolve a name at display time with `getCityByCode` and friends. Record
`PSGC_VERSION` alongside the address if you need to know which release a stored
code came from.
