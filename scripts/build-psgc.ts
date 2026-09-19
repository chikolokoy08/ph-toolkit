/**
 * Converts the PSA PSGC publication workbook in data/raw/ into the compact
 * JSON that ph-toolkit/address ships.
 *
 * The publication file lists one row per geographic unit, ordered so that a
 * region is followed by its provinces, each province by its cities and
 * municipalities, and each of those by its barangays. This script derives the
 * hierarchy from that order and the Geographic Level column rather than from
 * the digits of the code, so it does not depend on the code layout. If the
 * order assumption does not hold, or a level is not recognised, the script
 * stops with the offending row number instead of writing partial data.
 */
import { mkdir, readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import ExcelJS from "exceljs";

/**
 * Fill this in before running the script: the release date printed on the PSA
 * publication for the file in data/raw/, as YYYY-MM-DD. It becomes
 * PSGC_VERSION. The script checks it against the workbook's own Metadata
 * sheet and stops if the two disagree.
 */
const PSGC_RELEASE_DATE = "2026-06-30";

const SOURCE =
  "Philippine Statistics Authority, Philippine Standard Geographic Code (PSGC)";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const RAW_DIR = path.join(ROOT, "data", "raw");
const OUT_DIR = path.join(ROOT, "data", "psgc");

type Level =
  | "region"
  | "province"
  | "city"
  | "municipality"
  | "submunicipality"
  | "barangay";

const LEVELS = new Map<string, Level>([
  ["reg", "region"],
  ["region", "region"],
  ["prov", "province"],
  ["province", "province"],
  ["city", "city"],
  ["mun", "municipality"],
  ["municipality", "municipality"],
  ["submun", "submunicipality"],
  ["submunicipality", "submunicipality"],
  ["bgy", "barangay"],
  ["brgy", "barangay"],
  ["barangay", "barangay"],
]);

const CITY_TYPES: Record<"city" | "municipality" | "submunicipality", string> =
  {
    city: "City",
    municipality: "Municipality",
    submunicipality: "SubMunicipality",
  };

const MONTHS = new Map(
  [
    "january",
    "february",
    "march",
    "april",
    "may",
    "june",
    "july",
    "august",
    "september",
    "october",
    "november",
    "december",
  ].map((name, offset) => [name, offset + 1]),
);

class BuildError extends Error {}

function fail(message: string): never {
  throw new BuildError(message);
}

function normalizeKey(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function cellText(value: ExcelJS.CellValue): string {
  if (value === null || value === undefined) {
    return "";
  }
  if (typeof value === "string") {
    return value.trim();
  }
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  if (value instanceof Date) {
    return value.toISOString().slice(0, 10);
  }
  if (typeof value === "object") {
    if ("richText" in value) {
      return value.richText
        .map((part) => part.text)
        .join("")
        .trim();
    }
    if ("result" in value) {
      return cellText(value.result ?? null);
    }
    if ("text" in value) {
      return value.text.trim();
    }
  }
  return "";
}

async function findWorkbook(): Promise<string> {
  let entries: string[];
  try {
    entries = await readdir(RAW_DIR);
  } catch {
    fail(
      `Could not read ${RAW_DIR}. Create it and put the PSA PSGC workbook there.`,
    );
  }

  const workbooks = entries.filter(
    (name) => name.endsWith(".xlsx") && !name.startsWith("~$"),
  );
  const [only] = workbooks;
  if (only === undefined) {
    fail(
      `No .xlsx file in ${RAW_DIR}. Download the PSGC publication file from the PSA and put it there.`,
    );
  }
  if (workbooks.length > 1) {
    fail(
      `Found more than one .xlsx in ${RAW_DIR}: ${workbooks.join(", ")}. Leave only one.`,
    );
  }

  return path.join(RAW_DIR, only);
}

/**
 * The Metadata sheet carries the publication date as "30 June 2026". Other
 * sheets carry an "As of" heading that is not always updated, so only this
 * one is trusted.
 */
function readPublicationDate(workbook: ExcelJS.Workbook): string | null {
  const sheet = workbook.getWorksheet("Metadata");
  if (sheet === undefined) {
    return null;
  }

  let found: string | null = null;
  sheet.eachRow({ includeEmpty: false }, (row) => {
    if (
      found !== null ||
      normalizeKey(cellText(row.getCell(1).value)) !== "publicationdate"
    ) {
      return;
    }

    const raw = cellText(row.getCell(2).value);
    const match = /^(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})$/.exec(raw);
    if (match === null) {
      return;
    }

    const [, day = "", monthName = "", year = ""] = match;
    const month = MONTHS.get(monthName.toLowerCase());
    if (month === undefined) {
      return;
    }

    found = `${year}-${String(month).padStart(2, "0")}-${day.padStart(2, "0")}`;
  });

  return found;
}

interface HeaderMatch {
  rowNumber: number;
  codeColumn: number;
  nameColumn: number;
  levelColumn: number;
}

/** Sheets other than PSGC carry title rows, so the header row is searched for. */
function findHeader(sheet: ExcelJS.Worksheet): HeaderMatch | null {
  const limit = Math.min(sheet.rowCount, 25);

  for (let rowNumber = 1; rowNumber <= limit; rowNumber += 1) {
    let codeColumn = 0;
    let nameColumn = 0;
    let levelColumn = 0;

    sheet
      .getRow(rowNumber)
      .eachCell({ includeEmpty: false }, (cell, columnNumber) => {
        const key = normalizeKey(cellText(cell.value));
        if (
          codeColumn === 0 &&
          key.includes("psgc") &&
          !key.includes("correspondence")
        ) {
          codeColumn = columnNumber;
        }
        if (nameColumn === 0 && key === "name") {
          nameColumn = columnNumber;
        }
        if (levelColumn === 0 && key.includes("geographiclevel")) {
          levelColumn = columnNumber;
        }
      });

    if (codeColumn > 0 && nameColumn > 0 && levelColumn > 0) {
      return { rowNumber, codeColumn, nameColumn, levelColumn };
    }
  }

  return null;
}

function describeHeaders(sheet: ExcelJS.Worksheet): string {
  const limit = Math.min(sheet.rowCount, 10);
  const lines: string[] = [];

  for (let rowNumber = 1; rowNumber <= limit; rowNumber += 1) {
    const cells: string[] = [];
    sheet.getRow(rowNumber).eachCell({ includeEmpty: false }, (cell) => {
      const text = cellText(cell.value);
      if (text !== "") {
        cells.push(text);
      }
    });
    if (cells.length > 0) {
      lines.push(`  row ${String(rowNumber)}: ${cells.join(" | ")}`);
    }
  }

  return lines.join("\n");
}

interface RawRow {
  rowNumber: number;
  code: string;
  name: string;
  /** null when the Geographic Level cell is blank, which the PSA uses for
   * province-level entries that are not provinces. */
  level: Level | null;
}

function readRows(sheet: ExcelJS.Worksheet, header: HeaderMatch): RawRow[] {
  const rows: RawRow[] = [];

  sheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
    if (rowNumber <= header.rowNumber) {
      return;
    }

    const code = cellText(row.getCell(header.codeColumn).value);
    const name = cellText(row.getCell(header.nameColumn).value);
    const levelText = cellText(row.getCell(header.levelColumn).value);

    if (code === "" && name === "" && levelText === "") {
      return;
    }
    if (code === "" || name === "") {
      fail(
        `Row ${String(rowNumber)} is missing a code or a name: code "${code}", name "${name}".`,
      );
    }

    if (levelText === "") {
      rows.push({ rowNumber, code, name, level: null });
      return;
    }

    const level = LEVELS.get(normalizeKey(levelText));
    if (level === undefined) {
      fail(
        `Row ${String(rowNumber)} has an unrecognised geographic level "${levelText}". ` +
          `Add it to LEVELS in scripts/build-psgc.ts once you know which level it belongs to.`,
      );
    }

    rows.push({ rowNumber, code, name, level });
  });

  return rows;
}

function trailingZeros(code: string): number {
  return code.length - code.replace(/0+$/, "").length;
}

/**
 * Every level of the PSGC code is a fixed-width segment, so a row that belongs
 * at a given level has that many trailing zeros: a province code such as
 * 0702200000 (Cebu) has five. The widths are measured from the rows whose
 * level the file states, rather than assumed, so a change to the coding
 * structure shows up as a validation failure instead of wrong parents.
 */
interface Slots {
  province: number;
  city: number;
}

function calibrate(rows: RawRow[]): Slots {
  const zerosFor = (levels: Level[]): number[] =>
    rows
      .filter((row) => row.level !== null && levels.includes(row.level))
      .map((row) => trailingZeros(row.code));

  const provinceZeros = zerosFor(["province"]);
  const cityZeros = zerosFor(["city", "municipality", "submunicipality"]);

  if (provinceZeros.length === 0 || cityZeros.length === 0) {
    fail(
      "The file has no province rows or no city rows, so the code structure cannot be read.",
    );
  }

  return { province: Math.min(...provinceZeros), city: Math.min(...cityZeros) };
}

/** Excel drops leading zeros from numeric cells, so codes are padded back to a fixed width. */
function padCodes(rows: RawRow[]): RawRow[] {
  const width = rows.reduce(
    (longest, row) => Math.max(longest, row.code.length),
    0,
  );

  return rows.map((row) => {
    if (!/^\d+$/.test(row.code)) {
      fail(
        `Row ${String(row.rowNumber)} has a non-numeric PSGC code "${row.code}".`,
      );
    }
    return { ...row, code: row.code.padStart(width, "0") };
  });
}

type RegionTuple = [string, string];
type ProvinceTuple = [string, string, string, boolean];
type CityTuple = [string, string, string | null, string, string, string | null];
type BarangayTuple = [string, string, string];

interface Dataset {
  regions: RegionTuple[];
  provinces: ProvinceTuple[];
  cities: CityTuple[];
  barangays: BarangayTuple[];
}

interface BuildResult {
  dataset: Dataset;
  /** Province-level rows the PSA left without a Geographic Level. */
  flagged: RawRow[];
}

/**
 * A sub-municipality's code is its parent city's code with the city segment
 * filled in, so zeroing that segment gives the parent. The result is checked
 * against the city the file actually lists above it, and a disagreement stops
 * the build rather than guessing which one is right.
 */
function subMunicipalityParent(
  row: RawRow,
  slots: Slots,
  listedAbove: string | null,
): string {
  const derived = row.code
    .slice(0, row.code.length - slots.province)
    .padEnd(row.code.length, "0");

  if (derived !== listedAbove) {
    fail(
      `Row ${String(row.rowNumber)}: sub-municipality "${row.name}" has a code under ` +
        `${derived}, but the city listed above it is ${listedAbove ?? "none"}.`,
    );
  }

  return derived;
}

function buildDataset(rows: RawRow[], slots: Slots): BuildResult {
  const dataset: Dataset = {
    regions: [],
    provinces: [],
    cities: [],
    barangays: [],
  };
  const flagged: RawRow[] = [];

  let region: string | null = null;
  let province: string | null = null;
  let city: string | null = null;
  let parentCity: string | null = null;

  for (const row of rows) {
    // The PSA leaves the level blank for entries that hold a province code
    // without being provinces, such as "City of Isabela (Not a Province)" and
    // "Special Geographic Area". They are kept so the cities beneath them stay
    // reachable through their region, and marked isProvince: false.
    if (row.level === null) {
      if (region === null) {
        fail(
          `Row ${String(row.rowNumber)}: "${row.name}" has no level and no region above it.`,
        );
      }
      flagged.push(row);
      province = row.code;
      city = null;
      dataset.provinces.push([row.code, row.name, region, false]);
      continue;
    }

    switch (row.level) {
      case "region":
        region = row.code;
        province = null;
        city = null;
        dataset.regions.push([row.code, row.name]);
        break;

      case "province":
        if (region === null) {
          fail(
            `Row ${String(row.rowNumber)}: province "${row.name}" appears before any region.`,
          );
        }
        province = row.code;
        city = null;
        dataset.provinces.push([row.code, row.name, region, true]);
        break;

      case "city":
      case "municipality":
      case "submunicipality":
        if (region === null) {
          fail(
            `Row ${String(row.rowNumber)}: "${row.name}" appears before any region.`,
          );
        }
        // Independent cities such as City of Zamboanga, City of Baguio, and
        // the cities of NCR hold a province-level code and sit directly under
        // their region, so they must not inherit the province listed above.
        if (trailingZeros(row.code) >= slots.province) {
          province = null;
        }
        dataset.cities.push([
          row.code,
          row.name,
          province,
          region,
          CITY_TYPES[row.level],
          row.level === "submunicipality"
            ? subMunicipalityParent(row, slots, parentCity)
            : null,
        ]);
        if (row.level !== "submunicipality") {
          parentCity = row.code;
        }
        city = row.code;
        break;

      case "barangay":
        if (city === null) {
          fail(
            `Row ${String(row.rowNumber)}: barangay "${row.name}" appears before any city or municipality.`,
          );
        }
        dataset.barangays.push([row.code, row.name, city]);
        break;
    }
  }

  return { dataset, flagged };
}

function validate(dataset: Dataset, slots: Slots): void {
  const seen = new Set<string>();
  const all = [
    ...dataset.regions.map((entry) => entry[0]),
    ...dataset.provinces.map((entry) => entry[0]),
    ...dataset.cities.map((entry) => entry[0]),
    ...dataset.barangays.map((entry) => entry[0]),
  ];

  for (const code of all) {
    if (seen.has(code)) {
      fail(`Duplicate PSGC code ${code}.`);
    }
    seen.add(code);
  }

  const regions = new Set(dataset.regions.map((entry) => entry[0]));
  const provinces = new Set(dataset.provinces.map((entry) => entry[0]));
  const cities = new Set(dataset.cities.map((entry) => entry[0]));
  const parents = new Set(dataset.cities.map((entry) => entry[2]));

  for (const [code, name, regionCode] of dataset.provinces) {
    if (!regions.has(regionCode)) {
      fail(
        `Province ${code} "${name}" points at unknown region ${regionCode}.`,
      );
    }
  }
  for (const [code, name, provinceCode, regionCode] of dataset.cities) {
    if (provinceCode !== null && !provinces.has(provinceCode)) {
      fail(
        `City ${code} "${name}" points at unknown province ${provinceCode}.`,
      );
    }
    if (!regions.has(regionCode)) {
      fail(`City ${code} "${name}" points at unknown region ${regionCode}.`);
    }
  }
  for (const [code, name, cityCode] of dataset.barangays) {
    if (!cities.has(cityCode)) {
      fail(`Barangay ${code} "${name}" points at unknown city ${cityCode}.`);
    }
  }

  // A child's code carries its parent's code as a prefix. Checking that catches
  // a row attached to the wrong parent, which row order alone would not.
  const provincePrefix = (code: string): string =>
    code.slice(0, code.length - slots.province);
  const cityPrefix = (code: string): string =>
    code.slice(0, code.length - slots.city);

  for (const [code, name, provinceCode] of dataset.cities) {
    if (
      provinceCode !== null &&
      provincePrefix(code) !== provincePrefix(provinceCode)
    ) {
      fail(
        `City ${code} "${name}" is attached to province ${provinceCode}, but their codes do not share a prefix.`,
      );
    }
  }
  for (const [code, name, cityCode] of dataset.barangays) {
    if (cityPrefix(code) !== cityPrefix(cityCode)) {
      fail(
        `Barangay ${code} "${name}" is attached to city ${cityCode}, but their codes do not share a prefix.`,
      );
    }
  }

  const cityType = new Map(dataset.cities.map((entry) => [entry[0], entry[4]]));
  for (const [code, name, , , , parentCityCode] of dataset.cities) {
    if (parentCityCode === null) {
      continue;
    }
    const parent = cityType.get(parentCityCode);
    if (parent === undefined) {
      fail(
        `Sub-municipality ${code} "${name}" points at unknown city ${parentCityCode}.`,
      );
    }
    if (parent === "SubMunicipality") {
      fail(
        `Sub-municipality ${code} "${name}" points at another sub-municipality.`,
      );
    }
  }

  // A flagged row that turned out not to be province-level would sit here with
  // nothing under it, which is worth stopping for.
  for (const [code, name, , isProvince] of dataset.provinces) {
    if (!isProvince && !parents.has(code)) {
      fail(
        `${code} "${name}" has a blank geographic level and no cities or municipalities under it. ` +
          `Check what the PSA means by that row before shipping it as a province.`,
      );
    }
  }
}

async function main(): Promise<void> {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(PSGC_RELEASE_DATE)) {
    fail(
      "PSGC_RELEASE_DATE is not set. Open scripts/build-psgc.ts and set it to the release " +
        "date of the PSA publication in data/raw/, as YYYY-MM-DD.",
    );
  }

  const file = await findWorkbook();
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(file);

  const published = readPublicationDate(workbook);
  if (published !== null && published !== PSGC_RELEASE_DATE) {
    fail(
      `PSGC_RELEASE_DATE is ${PSGC_RELEASE_DATE} but ${path.basename(file)} was published on ` +
        `${published}. Update the constant in scripts/build-psgc.ts.`,
    );
  }

  let sheet: ExcelJS.Worksheet | undefined;
  let header: HeaderMatch | undefined;

  workbook.eachSheet((candidate) => {
    if (header !== undefined) {
      return;
    }
    const found = findHeader(candidate);
    if (found !== null) {
      sheet = candidate;
      header = found;
    }
  });

  if (sheet === undefined || header === undefined) {
    const sheets = workbook.worksheets
      .map((candidate) => `${candidate.name}\n${describeHeaders(candidate)}`)
      .join("\n\n");
    fail(
      `No sheet in ${path.basename(file)} has a header row with a PSGC code, a name, and a ` +
        `geographic level column. Sheets and their first rows:\n\n${sheets}`,
    );
  }

  const rows = padCodes(readRows(sheet, header));
  const [firstRow] = rows;
  if (firstRow === undefined) {
    fail(`No data rows below the header in sheet "${sheet.name}".`);
  }

  const slots = calibrate(rows);
  const { dataset, flagged } = buildDataset(rows, slots);
  validate(dataset, slots);

  const meta = {
    release: PSGC_RELEASE_DATE,
    source: SOURCE,
    sourceFile: path.basename(file),
    generatedAt: new Date().toISOString().slice(0, 10),
    counts: {
      regions: dataset.regions.length,
      provinces: dataset.provinces.length,
      cities: dataset.cities.length,
      barangays: dataset.barangays.length,
    },
  };

  await mkdir(OUT_DIR, { recursive: true });
  await Promise.all([
    writeFile(
      path.join(OUT_DIR, "regions.json"),
      JSON.stringify(dataset.regions),
    ),
    writeFile(
      path.join(OUT_DIR, "provinces.json"),
      JSON.stringify(dataset.provinces),
    ),
    writeFile(
      path.join(OUT_DIR, "cities.json"),
      JSON.stringify(dataset.cities),
    ),
    writeFile(
      path.join(OUT_DIR, "barangays.json"),
      JSON.stringify(dataset.barangays),
    ),
    writeFile(
      path.join(OUT_DIR, "meta.json"),
      `${JSON.stringify(meta, null, 2)}\n`,
    ),
  ]);

  console.log(
    `Read ${path.basename(file)}, sheet "${sheet.name}", ${String(rows.length)} rows.`,
  );
  console.log(
    `Wrote ${String(meta.counts.regions)} regions, ${String(meta.counts.provinces)} provinces, ` +
      `${String(meta.counts.cities)} cities and municipalities, ` +
      `${String(meta.counts.barangays)} barangays.`,
  );
  const subMunicipalities = dataset.cities.filter(
    (entry) => entry[5] !== null,
  ).length;
  if (subMunicipalities > 0) {
    console.log(
      `${String(subMunicipalities)} of those are sub-municipalities linked to a parent city.`,
    );
  }

  if (flagged.length > 0) {
    console.log(
      `\n${String(flagged.length)} province-level ${flagged.length === 1 ? "row has" : "rows have"} ` +
        `a blank Geographic Level. They ship as provinces with isProvince: false:`,
    );
    for (const row of flagged) {
      console.log(`  row ${String(row.rowNumber)}  ${row.code}  ${row.name}`);
    }
    console.log("Check these against the PSA notes when updating the dataset.");
  }

  console.log(`\nPSGC_VERSION is ${meta.release}.`);
}

main().catch((error: unknown) => {
  if (error instanceof BuildError) {
    console.error(`build-psgc: ${error.message}`);
  } else {
    console.error(error);
  }
  process.exitCode = 1;
});
