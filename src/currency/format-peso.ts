export interface FormatPesoOptions {
  /** BCP 47 locale tag. Defaults to "en-PH". */
  locale?: string;
  /** Fixed number of decimal places. Defaults to 2. */
  decimals?: number;
}

const DEFAULT_LOCALE = "en-PH";
const DEFAULT_DECIMALS = 2;

/**
 * Formats a number as Philippine pesos, or returns null if the value is not
 * finite or the options are out of range.
 *
 * @example
 * formatPeso(1234.5); // "₱1,234.50"
 */
export function formatPeso(
  value: number,
  options: FormatPesoOptions = {},
): string | null {
  if (!Number.isFinite(value)) {
    return null;
  }

  const { locale = DEFAULT_LOCALE, decimals = DEFAULT_DECIMALS } = options;
  if (!Number.isInteger(decimals)) {
    return null;
  }

  try {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency: "PHP",
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(value);
  } catch {
    // Intl throws RangeError on a malformed locale tag or an out-of-range
    // digit count. Formatters return null instead of throwing.
    return null;
  }
}
