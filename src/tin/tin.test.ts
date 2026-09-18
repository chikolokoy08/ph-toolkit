import { describe, expect, test } from "vitest";
import { formatTin, isValidTin } from "./index.js";

const validTins: [input: string, formatted: string][] = [
  ["123456789", "123-456-789"],
  ["123-456-789", "123-456-789"],
  ["123 456 789", "123-456-789"],
  ["  123456789  ", "123-456-789"],
  ["123456789000", "123-456-789-000"],
  ["123-456-789-000", "123-456-789-000"],
  ["123 456 789 000", "123-456-789-000"],
  ["004327982001", "004-327-982-001"],
  ["12345678900000", "123-456-789-00000"],
  ["123-456-789-00000", "123-456-789-00000"],
  ["123 456 789 00000", "123-456-789-00000"],
  ["123.456.789", "123-456-789"],
  ["(123) 456-789", "123-456-789"],
];

const invalidTins: [label: string, input: string][] = [
  ["empty string", ""],
  ["whitespace only", "   "],
  ["dashes only", "---------"],
  ["eight digits", "12345678"],
  ["ten digits", "1234567890"],
  ["eleven digits", "12345678901"],
  ["thirteen digits", "1234567890123"],
  ["fifteen digits", "123456789000000"],
  ["letters mixed in", "12345678A"],
  ["letters only", "abcdefghi"],
  ["leading plus", "+123456789"],
  ["underscores as separators", "123_456_789"],
  ["slashes as separators", "123/456/789"],
  ["trailing letters", "123456789abc"],
];

const nonStrings: [unknown][] = [[null], [undefined], [123456789], [{}], [[]]];

describe("isValidTin", () => {
  test.each(validTins)("accepts %s", (input) => {
    expect(isValidTin(input)).toBe(true);
  });

  test.each(invalidTins)("rejects %s", (_label, input) => {
    expect(isValidTin(input)).toBe(false);
  });

  test.each(nonStrings)("rejects non-string input %p", (input) => {
    expect(isValidTin(input as string)).toBe(false);
  });
});

describe("formatTin", () => {
  test.each(validTins)("formats %s as %s", (input, formatted) => {
    expect(formatTin(input)).toBe(formatted);
  });

  test.each(invalidTins)("returns null for %s", (_label, input) => {
    expect(formatTin(input)).toBeNull();
  });

  test.each(nonStrings)("returns null for non-string input %p", (input) => {
    expect(formatTin(input as string)).toBeNull();
  });

  test("is idempotent", () => {
    expect(formatTin("123-456-789-000")).toBe("123-456-789-000");
  });
});
