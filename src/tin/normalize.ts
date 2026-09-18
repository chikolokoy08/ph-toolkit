import { asString, stripSeparators } from "../internal/guards.js";

/**
 * 9 digits is the base TIN. 12 adds a 3-digit branch code, 14 adds the
 * 5-digit branch code used on newer BIR forms. Structural only; the BIR
 * publishes no check-digit rule.
 */
const TIN_PATTERN = /^(?:\d{9}|\d{12}|\d{14})$/;

export function toTinDigits(value: unknown): string | null {
  const text = asString(value);
  if (text === null) {
    return null;
  }

  const digits = stripSeparators(text);
  return TIN_PATTERN.test(digits) ? digits : null;
}
