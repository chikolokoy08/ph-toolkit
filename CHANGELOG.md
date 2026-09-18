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

### Changed

- TIN validation ignores dots and parentheses in addition to spaces and
  dashes, matching how mobile numbers are handled. Dotted TINs such as
  123.456.789 were rejected in earlier development builds.

[0.1.0]: https://github.com/chikolokoy08/ph-toolkit/releases/tag/v0.1.0
