import { toE164 } from "./normalize.js";

/**
 * Checks whether a string is a valid Philippine mobile number.
 *
 * Accepts the 09 range and the known 08 blocks (0813, 0817, 0895 through
 * 0898), each in local, 63, and +63 form. Spaces, dashes, dots, and
 * parentheses are ignored, so numbers are checked on their digits. Letters
 * and any other character fail.
 *
 * @example
 * isValidMobileNumber("(0917) 123-4567"); // true
 */
export function isValidMobileNumber(value: string): boolean {
  return toE164(value) !== null;
}
