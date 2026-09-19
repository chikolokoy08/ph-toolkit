# ph-toolkit

Validators, formatters, and PSGC address data for developers building apps for
the Philippines.

Zero runtime dependencies. ESM and CJS, with type definitions.

## Install

```bash
npm install ph-toolkit
```

## Quick start

Validate and normalize a mobile number:

```js
import { formatMobileNumber, isValidMobileNumber } from "ph-toolkit";

isValidMobileNumber("0917 123 4567"); // true
formatMobileNumber("(0917) 123-4567"); // "+639171234567"
formatMobileNumber("09171234"); // null
```

Format an amount in pesos:

```js
import { formatPeso } from "ph-toolkit";

formatPeso(1234.5); // "₱1,234.50"
formatPeso(1234.5, { decimals: 0 }); // "₱1,235"
```

Look up addresses. The dataset is a separate entry point, so importing the
validators does not load it:

```js
import {
  getBarangaysByCity,
  getCitiesByProvince,
  getRegions,
} from "ph-toolkit/address";

getRegions().length; // 18
getCitiesByProvince("0702200000").length; // 50, the cities and municipalities of Cebu
getBarangaysByCity("0730600000").length; // 80, the barangays of City of Cebu
```

## API

Everything is a named export. There are no default exports.

### `ph-toolkit`

| Export                        | Description                                                                     |
| ----------------------------- | ------------------------------------------------------------------------------- |
| `isValidMobileNumber(value)`  | True for a valid Philippine mobile number.                                      |
| `formatMobileNumber(value)`   | Normalizes to E.164, or `null`.                                                 |
| `isValidTin(value)`           | True for a 9, 12, or 14 digit TIN.                                              |
| `formatTin(value)`            | Formats as `XXX-XXX-XXX`, `XXX-XXX-XXX-XXX`, or `XXX-XXX-XXX-XXXXX`, or `null`. |
| `formatPeso(value, options?)` | Formats a number as pesos, or `null`.                                           |
| `isValidZipCode(value)`       | True for exactly four digits.                                                   |

Validators return a boolean. Formatters return `null` on invalid input rather
than throwing.

### `ph-toolkit/address`

| Export                                        | Description                                                                |
| --------------------------------------------- | -------------------------------------------------------------------------- |
| `getRegions()`                                | All 18 regions.                                                            |
| `getRegionByCode(code)`                       | One region, or `null`.                                                     |
| `getProvinces()`                              | All 84 province-level entries.                                             |
| `getProvinceByCode(code)`                     | One province, or `null`.                                                   |
| `getProvincesByRegion(regionCode)`            | The provinces of a region. Empty for NCR.                                  |
| `getCities()`                                 | All 1,656 cities, municipalities, and sub-municipalities.                  |
| `getCityByCode(code)`                         | One city or municipality, or `null`.                                       |
| `getCitiesByProvince(provinceCode, options?)` | The cities and municipalities of a province.                               |
| `getCitiesByRegion(regionCode, options?)`     | Every city and municipality in a region, including those with no province. |
| `getSubMunicipalitiesByCity(cityCode)`        | The districts of a city. Only the City of Manila has any.                  |
| `getBarangayByCode(code)`                     | One barangay, or `null`.                                                   |
| `getBarangaysByCity(cityCode)`                | The barangays of a city or municipality.                                   |
| `findRegionsByName(query)`                    | Regions whose name contains the query.                                     |
| `findProvincesByName(query)`                  | Provinces whose name contains the query.                                   |
| `findCitiesByName(query)`                     | Cities and municipalities whose name contains the query.                   |
| `findBarangaysByName(query, options?)`        | Barangays whose name contains the query. Pass `{ cityCode }` to scope it.  |
| `PSGC_VERSION`                                | The release date of the dataset, `"2026-06-30"`.                           |

Name search is case- and accent-insensitive, so `"paranaque"` matches
`"Parañaque"`.

## What counts as valid

**Mobile numbers.** The 09 range, plus the known mobile blocks outside it:
0813, 0817, 0895, 0896, 0897, and 0898. Each is accepted in local, `63`, and
`+63` form. Validation is structural. Prefixes are not checked against network
ranges, because number portability means a prefix no longer identifies a
network. Every other 08 prefix is rejected. The 08 list lives in one constant
in `src/mobile/normalize.ts` and needs updating if the NTC assigns new ranges.

**TINs.** 9 digits for a base TIN, 12 with a 3-digit branch code, and 14 with
the 5-digit branch code used on newer BIR forms. Any other length is rejected.
Structural only. The BIR publishes no check-digit rule, so there is none here.

**ZIP codes.** Exactly four digits. Not checked against the PhilPost directory.
Validating against the real list of Philippine ZIP codes is a possible future
addition.

**Separators.** Mobile numbers and TINs ignore spaces, dashes, dots, and
parentheses, so input is checked on its digits. `"0917 123 4567"`,
`"0917-123-4567"`, and `"(0917) 123.4567"` are the same number. Letters and any
other character fail. ZIP codes are stricter: surrounding whitespace is
trimmed, but `"1 000"` and `"10-00"` are rejected, because ZIP codes are not
written in groups.

## Documentation

- [Validating form input](docs/validation.md)
- [Building a cascading address selector](docs/address-selector.md)
- [Updating the PSGC dataset](docs/updating-psgc.md)

## Data source

The address data comes from the Philippine Standard Geographic Code (PSGC),
published by the Philippine Statistics Authority. This release is built from
the PSGC publication dated **30 June 2026**, exposed as `PSGC_VERSION`.

It contains 18 regions, 84 province-level entries, 1,656 cities and
municipalities, and 42,010 barangays.

The PSA asks that it be acknowledged as the source, which this notice does. The
PSA publishes the PSGC quarterly and places it under no access constraints.
ph-toolkit is not affiliated with or endorsed by the PSA.

Two points where the data is not as tidy as it looks:

- 34 cities and municipalities are independent of any province and have
  `provinceCode: null`: the 17 in NCR, and 17 highly urbanized cities
  elsewhere, among them City of Cebu, City of Baguio, and City of Zamboanga.
  Reach them with `getCitiesByRegion`.
- Two entries hold a province code without being provinces: "City of Isabela
  (Not a Province)" and "Special Geographic Area". They ship as provinces with
  `isProvince: false`, under the names the PSA publishes.

Both are covered in [the address selector guide](docs/address-selector.md).

## Support

Node 20 or later.

Browsers get ESM and CJS builds targeting ES2022, with no Node APIs used.
`formatPeso` uses `Intl.NumberFormat`, and name search uses
`String.prototype.normalize` and Unicode property escapes. All are available in
current browsers.

The address entry point bundles 1.8 MB of JSON. That is the whole point of
keeping it separate: importing `ph-toolkit` alone costs about 2 KB. Named
exports and `sideEffects: false` let a bundler drop what you do not use.

## License

MIT. See [LICENSE](LICENSE).
