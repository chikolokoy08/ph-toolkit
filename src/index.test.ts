import { describe, expect, test } from "vitest";
import * as phToolkit from "./index.js";
import {
  formatMobileNumber,
  formatPeso,
  formatTin,
  isValidMobileNumber,
  isValidTin,
  isValidZipCode,
} from "./index.js";

test("root entry exports the documented names", () => {
  expect(Object.keys(phToolkit).sort()).toEqual([
    "formatMobileNumber",
    "formatPeso",
    "formatTin",
    "isValidMobileNumber",
    "isValidTin",
    "isValidZipCode",
  ]);
});

describe("surrounding whitespace", () => {
  const padded = ["  %s  ", "\t%s", "%s\n", "\n %s \t"];

  test.each(padded)("isValidMobileNumber tolerates %j", (pattern) => {
    expect(isValidMobileNumber(pattern.replace("%s", "09171234567"))).toBe(
      true,
    );
  });

  test.each(padded)("formatMobileNumber tolerates %j", (pattern) => {
    expect(formatMobileNumber(pattern.replace("%s", "09171234567"))).toBe(
      "+639171234567",
    );
  });

  test.each(padded)("isValidTin tolerates %j", (pattern) => {
    expect(isValidTin(pattern.replace("%s", "123456789"))).toBe(true);
  });

  test.each(padded)("formatTin tolerates %j", (pattern) => {
    expect(formatTin(pattern.replace("%s", "123456789"))).toBe("123-456-789");
  });

  test.each(padded)("isValidZipCode tolerates %j", (pattern) => {
    expect(isValidZipCode(pattern.replace("%s", "6000"))).toBe(true);
  });

  // formatPeso takes a number, so there is no whitespace to trim. A numeric
  // string is invalid input rather than something to coerce.
  test("formatPeso does not coerce a padded numeric string", () => {
    expect(formatPeso(" 1234.50 " as unknown as number)).toBeNull();
  });
});
