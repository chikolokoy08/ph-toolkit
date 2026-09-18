import { toTinDigits } from "./normalize.js";

/**
 * Checks whether a string is a valid Philippine TIN.
 *
 * Accepts 9, 12, or 14 digits. A 9-digit TIN has no branch code; 12 and 14
 * digits include a 3- or 5-digit branch code.
 *
 * Spaces, dashes, dots, and parentheses are ignored, so "123-456-789",
 * "123.456.789", and "123 456 789" are all accepted. Letters and any other
 * character fail.
 *
 * @example
 * isValidTin("123-456-789-000"); // true
 */
export function isValidTin(value: string): boolean {
  return toTinDigits(value) !== null;
}
