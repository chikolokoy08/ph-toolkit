import { describe, expect, test } from "vitest";
import { formatPeso } from "./index.js";

describe("formatPeso", () => {
  test.each([
    [1234.5, "₱1,234.50"],
    [0, "₱0.00"],
    [-500, "-₱500.00"],
    [1234567.891, "₱1,234,567.89"],
    [99, "₱99.00"],
    [0.005, "₱0.01"],
  ])("formats %d as %s", (value, expected) => {
    expect(formatPeso(value)).toBe(expected);
  });

  test("rounds to whole pesos when decimals is 0", () => {
    expect(formatPeso(1234.5, { decimals: 0 })).toBe("₱1,235");
  });

  test("keeps extra decimals when asked", () => {
    expect(formatPeso(1234.5, { decimals: 4 })).toBe("₱1,234.5000");
  });

  test("accepts another locale", () => {
    expect(formatPeso(1234.5, { locale: "fil-PH" })).toBe("₱1,234.50");
  });

  test.each([
    ["NaN", Number.NaN],
    ["Infinity", Number.POSITIVE_INFINITY],
    ["-Infinity", Number.NEGATIVE_INFINITY],
  ])("returns null for %s", (_label, value) => {
    expect(formatPeso(value)).toBeNull();
  });

  test.each([[null], [undefined], ["1234.50"], [{}], [[]]])(
    "returns null for non-number input %p",
    (value) => {
      expect(formatPeso(value as number)).toBeNull();
    },
  );

  test.each([
    ["fractional decimals", 1.5],
    ["negative decimals", -1],
  ])("returns null for %s", (_label, decimals) => {
    expect(formatPeso(1234.5, { decimals })).toBeNull();
  });

  test("returns null for a malformed locale tag", () => {
    expect(formatPeso(1234.5, { locale: "not a locale" })).toBeNull();
  });
});
