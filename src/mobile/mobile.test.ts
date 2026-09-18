import { describe, expect, test } from "vitest";
import { formatMobileNumber, isValidMobileNumber } from "./index.js";

const nineSeries: [input: string, e164: string][] = [
  ["09171234567", "+639171234567"],
  ["0917 123 4567", "+639171234567"],
  ["0917-123-4567", "+639171234567"],
  ["+639171234567", "+639171234567"],
  ["+63 917 123 4567", "+639171234567"],
  ["+63-917-123-4567", "+639171234567"],
  ["639171234567", "+639171234567"],
  ["63 917 123 4567", "+639171234567"],
  ["  0917 123 4567  ", "+639171234567"],
  ["0905 555 1234", "+639055551234"],
  ["0926-123-4567", "+639261234567"],
  ["09181234567", "+639181234567"],
  ["0999 888 7766", "+639998887766"],
  ["0908 765 4321", "+639087654321"],
  ["0991 234 5678", "+639912345678"],
  ["09931234567", "+639931234567"],
];

// Every known 08 block, in local, 63, and +63 form.
const eightSeries: [input: string, e164: string][] = [
  "813",
  "817",
  "895",
  "896",
  "897",
  "898",
].flatMap((block): [string, string][] => {
  const e164 = `+63${block}1234567`;
  return [
    [`0${block}1234567`, e164],
    [`0${block} 123 4567`, e164],
    [`0${block}-123-4567`, e164],
    [`63${block}1234567`, e164],
    [`+63${block}1234567`, e164],
    [`+63 ${block} 123 4567`, e164],
  ];
});

const validNumbers = [...nineSeries, ...eightSeries];

const separatorStyles: [input: string, e164: string][] = [
  ["(0917) 123-4567", "+639171234567"],
  ["0917.123.4567", "+639171234567"],
  ["+63 (917) 123.4567", "+639171234567"],
  ["(0895) 123 4567", "+638951234567"],
];

const invalidNumbers: [label: string, input: string][] = [
  ["empty string", ""],
  ["whitespace only", "   "],
  ["dashes only", "---"],
  ["too short", "0917123456"],
  ["too long", "091712345678"],
  ["landline prefix", "0281234567"],
  ["unlisted 08 prefix 0801", "08011234567"],
  ["unlisted 08 prefix 0899", "08991234567"],
  ["unlisted 08 prefix 0894", "08941234567"],
  ["unlisted 08 prefix 0812", "08121234567"],
  ["unlisted 08 prefix 0818", "08181234567"],
  ["unlisted 08 prefix in +63 form", "+638011234567"],
  ["listed 08 prefix, too short", "0895123456"],
  ["listed 08 prefix, too long", "089512345678"],
  ["missing leading zero", "9171234567"],
  ["wrong country code", "+649171234567"],
  ["zero after country code", "+630917123456"],
  ["letters mixed in", "0917ABC4567"],
  ["letters only", "abcdefghijk"],
  ["plus in the middle", "0917+1234567"],
  ["underscores as separators", "0917_123_4567"],
  ["slashes as separators", "0917/123/4567"],
  ["hash prefix", "#09171234567"],
  ["trailing letters", "09171234567abc"],
  ["truncated international", "+63917123456"],
  ["double zero prefix", "00639171234567"],
];

const nonStrings: [unknown][] = [[null], [undefined], [42], [{}], [[]], [true]];

describe("isValidMobileNumber", () => {
  test.each(validNumbers)("accepts %s", (input) => {
    expect(isValidMobileNumber(input)).toBe(true);
  });

  test.each(separatorStyles)("ignores separators in %s", (input) => {
    expect(isValidMobileNumber(input)).toBe(true);
  });

  test.each(invalidNumbers)("rejects %s", (_label, input) => {
    expect(isValidMobileNumber(input)).toBe(false);
  });

  test.each(nonStrings)("rejects non-string input %p", (input) => {
    expect(isValidMobileNumber(input as string)).toBe(false);
  });
});

describe("formatMobileNumber", () => {
  test.each(validNumbers)("normalizes %s to %s", (input, e164) => {
    expect(formatMobileNumber(input)).toBe(e164);
  });

  test.each(separatorStyles)("normalizes %s to %s", (input, e164) => {
    expect(formatMobileNumber(input)).toBe(e164);
  });

  test.each(invalidNumbers)("returns null for %s", (_label, input) => {
    expect(formatMobileNumber(input)).toBeNull();
  });

  test.each(nonStrings)("returns null for non-string input %p", (input) => {
    expect(formatMobileNumber(input as string)).toBeNull();
  });

  test("is idempotent", () => {
    const once = formatMobileNumber("0917 123 4567");
    expect(once).not.toBeNull();
    expect(formatMobileNumber(once ?? "")).toBe(once);
  });
});
