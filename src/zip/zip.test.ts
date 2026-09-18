import { describe, expect, test } from "vitest";
import { isValidZipCode } from "./index.js";

const validCodes: [label: string, input: string][] = [
  ["Manila", "1000"],
  ["Quezon City", "1101"],
  ["Makati", "1200"],
  ["Cebu City", "6000"],
  ["Davao City", "8000"],
  ["Iloilo City", "5000"],
  ["Baguio", "2600"],
  ["padded with whitespace", "  6000  "],
  ["trailing space", "1000 "],
  ["leading space", " 1000"],
  ["surrounding tab and newline", "\t6000\n"],
  ["leading zero", "0400"],
  ["all zeros, valid by shape", "0000"],
];

const invalidCodes: [label: string, input: string][] = [
  ["empty string", ""],
  ["whitespace only", "   "],
  ["three digits", "100"],
  ["five digits", "10000"],
  ["internal space", "1 000"],
  ["dash", "10-00"],
  ["letters only", "abcd"],
  ["letters mixed in", "100A"],
  ["decimal", "1000.0"],
  ["negative", "-1000"],
];

const nonStrings: [unknown][] = [[null], [undefined], [1000], [{}], [[]]];

describe("isValidZipCode", () => {
  test.each(validCodes)("accepts %s", (_label, input) => {
    expect(isValidZipCode(input)).toBe(true);
  });

  test.each(invalidCodes)("rejects %s", (_label, input) => {
    expect(isValidZipCode(input)).toBe(false);
  });

  test.each(nonStrings)("rejects non-string input %p", (input) => {
    expect(isValidZipCode(input as string)).toBe(false);
  });
});
