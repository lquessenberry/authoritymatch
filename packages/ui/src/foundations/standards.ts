export const designSystemVersion = '0.1.0';

export const designSystemStandards = {
  ownership: {
    sourceOfTruth: '@authoritymatch/ui',
    policy:
      'Reusable UI primitives and shared composites must be implemented in @authoritymatch/ui before app-level usage.',
  },
  accessibility: {
    minimum:
      'Components must preserve keyboard navigation, visible focus states, semantic roles, and accessible names.',
  },
  interaction: {
    minimum:
      'Interactive elements must include disabled states, hover/active affordances, and focus-visible rings.',
  },
  naming: {
    components: 'PascalCase exports',
    variants: 'variant/size patterns with class-variance-authority',
    cssVariables: 'kebab-case variables (for example --primary-foreground)',
  },
  api: {
    composition:
      'Prefer Radix primitives and forwardRef for composability and accessibility.',
    imports:
      'Consume primitives from @authoritymatch/ui instead of app-local components/ui duplicates.',
  },
  versioning: {
    scheme: 'semver',
    rule:
      'Breaking component API changes require a major version increment for @authoritymatch/ui.',
  },
} as const;

export type DesignSystemStandards = typeof designSystemStandards;
