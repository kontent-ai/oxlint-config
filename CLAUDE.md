# Code Style

## Functional Programming

- Prefer functional style: pure functions, immutable data, expressions over statements
- Small, single-purpose functions — if a function does more than one thing, split it
- `const` everywhere; never use `let` unless mutation is genuinely unavoidable, never use `var`
- `readonly` on all type properties, function parameters, and array types (`readonly T[]`); exception: a mutable array used as a local accumulator within a single function body (built with `.push()`, never returned or exposed as mutable) is acceptable when the immutable alternative would cause repeated full-array copies — e.g. `[...acc, item]` inside a loop or recursion allocates a new array on every iteration (O(n) per step), whereas `.push()` is O(1) amortised
- Avoid side effects — functions should return values, not mutate external state
- Prefer `map`, `filter`, `reduce`, and other higher-order functions over imperative loops
- Prefer early returns over nested conditionals

## No Magic Strings

- Do not use magic strings unless absolutely necessary (e.g. a one-off literal with no meaning outside its single use)
- Values that carry meaning (header names, URLs, keys, error codes, config values) must live in a properly named `const` and be referenced through it
- When a string refers to another type or property (property names, method names, union members), narrow it with `satisfies` so it is checked against the source type and breaks at compile time when that type changes:
  - `vi.spyOn(httpService, "request" satisfies keyof HttpService)`
  - `header.name !== ("X-KC-SDKID" satisfies KnownHeaderName)`
- Never use `as` to type such a string; it widens the type and skips the check

## Exports

- Everything public must be exported from `lib/public_api.ts` or listed as a subpath in `package.json` `exports`; nothing else is part of the public API

# Tooling

- After making code changes, run `pnpm run biome:fix` to auto-format and fix lint issues
