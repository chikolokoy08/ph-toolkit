import { asString } from "../internal/guards.js";

const ZIP_PATTERN = /^\d{4}$/;

/**
 * Checks whether a string is a valid Philippine ZIP code.
 *
 * Structural only: exactly four digits, with surrounding whitespace ignored.
 * Unlike mobile numbers and TINs, separators inside the code are not
 * stripped, because ZIP codes are not written in groups. The code is not
 * checked against the PhilPost directory.
 *
 * @example
 * isValidZipCode("6000"); // true, Cebu City
 */
export function isValidZipCode(value: string): boolean {
  const text = asString(value);
  if (text === null) {
    return false;
  }

  return ZIP_PATTERN.test(text.trim());
}
