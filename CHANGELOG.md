# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project follows [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - Unreleased

### Added

- `isValidMobileNumber` and `formatMobileNumber`. Validation covers the 09
  range and the known 08 mobile blocks (0813, 0817, 0895 through 0898), each
  in local, 63, and +63 form. `formatMobileNumber` normalizes to E.164.
- `isValidTin` and `formatTin`. Accepts 9, 12, and 14 digits, covering the
  base TIN and both the 3-digit and 5-digit branch code forms. Formats as
  XXX-XXX-XXX, XXX-XXX-XXX-XXX, or XXX-XXX-XXX-XXXXX.
- `isValidZipCode`. Structural check for exactly four digits.
- `formatPeso`, wrapping `Intl.NumberFormat` with a `locale` and `decimals`
  option.
- Mobile numbers and TINs ignore spaces, dashes, dots, and parentheses, so
  input is validated on its digits. Letters and other characters fail.
- Formatters return `null` on invalid input instead of throwing.
- `@chikolokoy08/ph-toolkit/address`, a separate entry point carrying the PSGC dataset:
  lookups by code and by parent, accent-insensitive name search, and
  `PSGC_VERSION`. Validator-only users do not load the data.
- `scripts/build-psgc.ts`, which converts the PSA PSGC publication workbook
  into the compact JSON the address module ships.
- Provinces carry `isProvince`. It is `false` for the two PSA entries that hold
  a province code without being provinces, "City of Isabela (Not a Province)"
  and "Special Geographic Area", which are kept so the places under them stay
  reachable.
- Cities carry `parentCityCode`, set for the 14 sub-municipalities of the City
  of Manila and `null` everywhere else. `getCities`, `getCitiesByRegion`, and
  `getCitiesByProvince` leave sub-municipalities out unless called with
  `{ includeSubMunicipalities: true }`, `getSubMunicipalitiesByCity` lists
  them, and `getBarangaysByCity` for the City of Manila returns all 897
  barangays across its districts.
- Builds ship without source maps. Most of the address bundle is data, so the
  maps tripled the package for no debugging value. Output is not minified.

- `data/psgc/meta.json` records only the release, source, source file, and
  counts, so rebuilding the dataset from an unchanged workbook produces
  byte-identical files.

### Changed

- TIN validation ignores dots and parentheses in addition to spaces and
  dashes, matching how mobile numbers are handled. Dotted TINs such as
  123.456.789 were rejected in earlier development builds.

[0.1.0]: https://github.com/chikolokoy08/ph-toolkit/releases/tag/v0.1.0
