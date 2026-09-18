/**
 * Plain JavaScript callers can pass anything, so public entry points funnel
 * input through here rather than trusting the declared parameter type.
 */
export function asString(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}

/**
 * Spaces, dashes, dots, and parentheses are presentation, not data, so
 * numbers are validated on their digits. Every other character survives and
 * fails the pattern it is checked against.
 */
export function stripSeparators(value: string): string {
  return value.replace(/[\s.()-]/g, "");
}
