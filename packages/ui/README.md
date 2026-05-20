# @authoritymatch/ui

`@authoritymatch/ui` is the single source of truth for AuthorityMatch shared design system assets:

- tokens
- primitives
- shared composite patterns
- usage standards

## Ownership

- Reusable UI components must be implemented here first.
- App-local components are only for app-specific composition.
- Do not add new duplicated primitives under `apps/*/components/ui`.

## Foundation contracts

- Tokens: `designTokens` from `src/foundations/tokens.ts`
- Standards: `designSystemStandards` from `src/foundations/standards.ts`
- Utilities: `cn` from `src/lib/utils.ts`

## Initial core primitives

- `Button`
- `Input`
- `Label`
- `Card`
- `Dialog`
- `Tabs`
- `Select`
- `Tooltip`

## Versioning and API

- Package follows semantic versioning.
- Breaking UI API changes require a major version bump.
- Prefer Radix primitives + `forwardRef` for accessibility and composability.
