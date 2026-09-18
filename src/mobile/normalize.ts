import { asString, stripSeparators } from "../internal/guards.js";

/**
 * The known mobile blocks outside the 09 range, from public prefix
 * directories: DITO launched on 0895 through 0898 in 2021, and Smart and
 * Globe hold the legacy 0813 and 0817 blocks. Update this list if the NTC
 * assigns new 08 ranges.
 */
const MOBILE_08_PREFIXES = ["0813", "0817", "0895", "0896", "0897", "0898"];

const EIGHT_SERIES = MOBILE_08_PREFIXES.map((prefix) => prefix.slice(1)).join(
  "|",
);

/**
 * Within those blocks the check is structural. Number portability means a
 * prefix no longer identifies a network, so there is nothing further to
 * check against.
 */
const MOBILE_PATTERN = new RegExp(
  `^(?:\\+?63|0)(?:9\\d{9}|(?:${EIGHT_SERIES})\\d{7})$`,
);

export function toE164(value: unknown): string | null {
  const text = asString(value);
  if (text === null) {
    return null;
  }

  const compact = stripSeparators(text);
  if (!MOBILE_PATTERN.test(compact)) {
    return null;
  }

  return `+63${compact.slice(-10)}`;
}
