import { toE164 } from "./normalize.js";

/**
 * Normalizes a Philippine mobile number to E.164, or returns null if it is
 * not a valid number. Spaces, dashes, dots, and parentheses in the input are
 * ignored.
 *
 * @example
 * formatMobileNumber("0895 123 4567"); // "+638951234567"
 */
export function formatMobileNumber(value: string): string | null {
  return toE164(value);
}
