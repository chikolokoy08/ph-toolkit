import { toTinDigits } from "./normalize.js";

/**
 * Formats a Philippine TIN as XXX-XXX-XXX, XXX-XXX-XXX-XXX, or
 * XXX-XXX-XXX-XXXXX depending on its length, or returns null if it is not a
 * valid TIN. Spaces, dashes, dots, and parentheses in the input are ignored,
 * and surrounding whitespace is trimmed.
 *
 * @example
 * formatTin("123456789000"); // "123-456-789-000"
 */
export function formatTin(value: string): string | null {
  const digits = toTinDigits(value);
  if (digits === null) {
    return null;
  }

  const groups = [digits.slice(0, 3), digits.slice(3, 6), digits.slice(6, 9)];
  const branch = digits.slice(9);

  return branch === "" ? groups.join("-") : [...groups, branch].join("-");
}
