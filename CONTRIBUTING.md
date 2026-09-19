# Contributing

Thanks for taking the time. Bug reports, prefix corrections, and dataset
updates are all useful.

## Setup

Node 20 or later. The repository has an `.nvmrc`.

```bash
nvm use
npm install
```

## Scripts

| Script                  | What it does                                                                                            |
| ----------------------- | ------------------------------------------------------------------------------------------------------- |
| `npm test`              | Runs the test suite once.                                                                               |
| `npm run test:watch`    | Runs it in watch mode.                                                                                  |
| `npm run test:coverage` | Runs it with coverage. Thresholds are 95 percent.                                                       |
| `npm run lint`          | ESLint. Must pass with zero warnings.                                                                   |
| `npm run typecheck`     | `tsc --noEmit`.                                                                                         |
| `npm run format`        | Prettier, writing changes.                                                                              |
| `npm run build`         | Builds ESM, CJS, and type definitions into `dist/`.                                                     |
| `npm run build:psgc`    | Rebuilds the address dataset from the PSA workbook. See [docs/updating-psgc.md](docs/updating-psgc.md). |

Before opening a pull request, run lint, typecheck, tests, and build. CI runs
all four on Node 20, 22, and 24.

## Coding standards

- TypeScript strict mode. No `any`, no non-null assertions.
- Zero runtime dependencies. Dev dependencies are fine.
- Named exports only. No default exports.
- Pure functions. No side effects, no global state.
- Naming: `isValidX` for validators returning a boolean, `formatX` for
  formatters, `getX` for lookups by code or parent, `findX` for name search.
- Formatters return `null` on invalid input. They do not throw.
- Validators and formatters accept whatever a plain JavaScript caller passes,
  including `null` and `undefined`, and return `false` or `null` rather than
  throwing.
- Small files grouped by domain under `src/`.
- JSDoc on every public export: one short description and one realistic
  example. Internal helpers only need a comment when the logic is not obvious.
- Comments explain why, not what.
- Prettier defaults. Run `npm run format`.

Use realistic Philippine examples in code, tests, and docs. Real city names,
realistic but fake phone numbers and TINs. Never `foo` or `bar`.

## Tests

Vitest. Tests sit next to the code they cover, as `*.test.ts`.

- Table-driven with `test.each` where it keeps things readable.
- Cover real input: numbers with spaces and dashes, `+63` and `63` forms, empty
  strings, whitespace, wrong lengths, letters mixed in.
- Coverage for validators and formatters stays above 95 percent. It is at 100
  percent now.

The address module is tested two ways. `queries.test.ts` runs the lookup and
search logic against a small fixture, so it does not depend on the shipped
dataset. `address.test.ts` runs against the real data and asserts counts,
specific places, and structural invariants.

## Proposing changes

Open an issue first for anything that changes behavior or the public API. A
short description of the case that is wrong today is enough.

Send a pull request directly for typos, documentation, test coverage, and clear
bugs with an obvious fix.

Do not report security issues in a public issue or pull request. See
[SECURITY.md](SECURITY.md) for how to report one privately.

For a change to what counts as valid, say where the rule comes from. Mobile
prefix ranges come from the NTC, TIN formats from the BIR, and address data
from the PSA. A link to the source matters more than the diff, because the rule
is the part that has to be right.

## Commit messages

[Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/).

```
feat: accept the 08 mobile blocks
fix: stop independent cities inheriting the province above them
docs: add the cascading address selector guide
test: cover whitespace handling across the public API
chore: bump dev dependencies
```

Use the body to explain why, not what. The diff already says what.

## Versioning

[Semantic versioning](https://semver.org/spec/v2.0.0.html). A dataset update is
a minor bump, because PSGC codes and names can change between releases.

Record every change in `CHANGELOG.md`, following
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/).
