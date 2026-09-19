import meta from "../../data/psgc/meta.json";

/**
 * The PSGC reference date of the dataset, as YYYY-MM-DD. This release is built
 * from PSGC 2Q 2026, which the PSA published on 13 July 2026.
 *
 * @example
 * PSGC_VERSION; // "2026-06-30"
 */
export const PSGC_VERSION: string = meta.release;
