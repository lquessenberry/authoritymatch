# Development Guide

## Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/lquessenberry/authoritymatch.git
cd authoritymatch
```

### 2. Install Dependencies

```bash
# Install pnpm if not already installed
npm install -g pnpm

# Install all dependencies
pnpm install
```

### 3. Start the Backend (Drupal)

```bash
# Start DDEV (requires Docker)
pnpm drupal:start

# First time setup
pnpm drupal:install

# Access Drupal
open https://authoritymatch.ddev.site
```

### 4. Start the Frontend (Next.js)

```bash
# In a new terminal
cd apps/web/nextjs
pnpm dev

# Access frontend
open http://localhost:3000
```

## Project Structure

```
authoritymatch/
├── drupal/                    # Drupal backend
│   ├── web/                   # Drupal core files
│   ├── config/                # Exported configuration
│   ├── recipes/               # Custom recipes
│   │   └── authoritymatch/    # AuthorityMatch content types
│   └── ...
├── apps/
│   ├── web/                   # Public Next.js app
│   │   └── nextjs/            # (from drupalx-decoupled)
│   └── dashboard/             # Factor portal (TODO)
├── packages/
│   ├── ui/                    # Shared UI components
│   ├── core/                  # Business logic, types, matching
│   └── data-pipeline/         # FMCSA data ingestion
├── infra/fly/                 # Deployment configs
└── docs/                      # Documentation
```

## Turborepo Commands

```bash
# Run dev mode for all packages
pnpm dev

# Build everything
pnpm build

# Lint all packages
pnpm lint

# Type check all packages
pnpm type-check
```

## Working with Drupal

### Content Types

The AuthorityMatch recipe defines these content types:

- **authority_record** - Trucking company authority data
- **factor_profile** - Factoring company profiles
- **lead** - Generated leads for matching

### GraphQL Queries

Example query for authority records:

```graphql
query GetAuthorities($limit: Int!) {
  authorities(limit: $limit) {
    nodes {
      id
      mcNumber
      companyName
      creditScore
      monthlyVolume
      location {
        city
        state
      }
    }
  }
}
```

### Custom Recipes

Edit `drupal/recipes/authoritymatch/recipe.yml` to add new content types or modify existing ones.

## Working with Next.js

### Routing

The frontend uses Next.js App Router:

```
apps/web/nextjs/app/
├── page.tsx              # Home page
├── authorities/
│   └── page.tsx          # Authority listing
├── factors/
│   └── page.tsx          # Factor profiles
├── api/
│   └── auth/
│       └── [...nextauth]/
│           └── route.ts  # NextAuth.js
└── layout.tsx            # Root layout
```

### Components

Shared components live in `packages/ui/`:

```bash
cd packages/ui

# Add shadcn component
pnpm dlx shadcn-ui@latest add button card input

# Import in apps
import { Button } from "@authoritymatch/ui";
```

### GraphQL Integration

The Next.js app uses URQL with GraphQL fragments:

```typescript
// apps/web/nextjs/lib/graphql/queries.ts
import { gql } from 'urql';

export const AUTHORITY_FRAGMENT = gql`
  fragment AuthorityFields on Authority {
    id
    mcNumber
    companyName
    creditScore
  }
`;
```

## Working with the Data Pipeline

### FMCSA Ingestion

The data pipeline fetches new authority records from FMCSA:

```bash
cd packages/data-pipeline

# Run ingestion manually
pnpm ingest

# Or with options
pnpm ingest --since 2024-01-01 --state AR
```

### Adding a New Data Source

Edit `packages/data-pipeline/src/sources/`:

```typescript
// src/sources/fmcsa.ts
export async function fetchAuthorities(options: FetchOptions): Promise<Authority[]> {
  // Implementation
}
```

## Testing

### Unit Tests

```bash
# Run all tests
pnpm test

# Run specific package
cd packages/core
pnpm test
```

### Integration Tests

```bash
# Drupal tests
cd drupal
./vendor/bin/phpunit

# Next.js E2E
cd apps/web/nextjs
pnpm playwright test
```

## Code Style

### TypeScript

- Use strict mode
- Prefer interfaces over types for objects
- Use Zod for runtime validation

### Formatting

```bash
# Format all files
pnpm format

# Check formatting
pnpm format:check
```

## Environment Variables

Copy `.env.example` to `.env.local` and fill in:

```bash
# Required
DRUPAL_GRAPHQL_ENDPOINT=http://authoritymatch.ddev.site/graphql
OAUTH_CLIENT_ID=...
OAUTH_CLIENT_SECRET=...

# Optional
STRIPE_SECRET_KEY=...
RESEND_API_KEY=...
```

## Common Issues

### Drupal DDEV Won't Start

```bash
# Reset DDEV
ddev poweroff
ddev start

# Or reinstall
ddev delete -Oy
ddev start
pnpm drupal:install
```

### GraphQL Endpoint Not Found

```bash
# Enable GraphQL Compose module
ddev . drush en graphql_compose -y

# Clear cache
ddev . drush cr
```

### Next.js Build Fails

```bash
# Clear Next.js cache
rm -rf apps/web/nextjs/.next

# Rebuild
pnpm build
```

## Useful Commands

```bash
# Drupal Drush via DDEV
ddev . drush status
ddev . drush cr  # Clear cache
ddev . drush uli # Login link

# Database operations
ddev . drush sqlc      # Connect to database
ddev . drush sql-dump  # Export database

# Logs
ddev logs -f
ddev . tail -f /var/log/apache2/error.log
```
