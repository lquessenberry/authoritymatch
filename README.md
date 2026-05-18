# AuthorityMatch

Connecting newly authorized domestic truckers with trusted factoring partners.

**Live Demo**: <https://lquessenberry.github.io/authoritymatch/> (static placeholder)  
**Stack**: Drupal 11 + GraphQL | Next.js 15 + TypeScript | Fly.io

---

## Quick Start

```bash
# 1. Clone and setup
git clone https://github.com/lquessenberry/authoritymatch.git
cd authoritymatch

# 2. Install dependencies
pnpm install

# 3. Start Drupal locally (requires Docker + DDEV)
pnpm drupal:start

# 4. Start Next.js frontend
cd apps/web/nextjs && pnpm dev
```

---

## Architecture

```
authoritymatch/
├── drupal/                 # Drupal 11 backend (drupalx-decoupled)
│   ├── web/               # Drupal core
│   ├── recipes/           # Custom AuthorityMatch recipes
│   └── nextjs/            # (moved to apps/web/)
├── apps/
│   ├── web/               # Public marketing + trucker self-serve
│   └── dashboard/         # Factor portal (Coming Soon)
├── packages/
│   ├── ui/                # Shared shadcn/ui components
│   ├── core/              # Types, calculators, matching logic
│   └── data-pipeline/     # FMCSA ingestion scripts
├── infra/fly/             # Fly.io deployment configs
└── docs/                  # Documentation
```

---

## Tech Stack

| Layer         | Technology                              |
| ------------- | --------------------------------------- |
| **Backend**   | Drupal 11 + GraphQL (drupalx-decoupled) |
| **Frontend**  | Next.js 15 + TypeScript + Tailwind      |
| **Auth**      | Simple OAuth (JWT)                      |
| **Database**  | PostgreSQL (Fly)                        |
| **Hosting**   | Fly.io (primary)                        |
| **Payments**  | Stripe                                  |
| **Email**     | Resend / Postmark                       |
| **Analytics** | PostHog                                 |

---

## Local Development

### Prerequisites

- [Node.js](https://nodejs.org/) 18+
- [pnpm](https://pnpm.io/) 9+
- [Docker](https://docker.com/) + [DDEV](https://ddev.com/)
- [Fly.io CLI](https://fly.io/docs/hands-on/install-flyctl/)

### Setup

```bash
# Install dependencies
pnpm install

# Copy environment files
cp .env.example .env.local
cp drupal/.env.example drupal/.env

# Start Drupal backend
pnpm drupal:start
pnpm drupal:install  # First time only

# Start frontend (in another terminal)
cd apps/web/nextjs && pnpm dev
```

**Drupal Admin**: https://authoritymatch.ddev.site/user/login  
**Next.js Frontend**: http://localhost:3000

---

## Deployment (Fly.io)

### First Deploy

```bash
# 1. Login to Fly
fly auth login

# 2. Create apps (one-time)
fly apps create authoritymatch-drupal
fly apps create authoritymatch-web

# 3. Set secrets
fly secrets set DRUPAL_ENV=production --app authoritymatch-drupal
fly secrets set NEXT_PUBLIC_DRUPAL_BASE_URL=https://authoritymatch-drupal.fly.dev --app authoritymatch-web

# 4. Deploy
pnpm fly:deploy:drupal
pnpm fly:deploy:web
```

### Database Setup

```bash
# Create PostgreSQL on Fly
fly postgres create --name authoritymatch-db --region ord

# Attach to Drupal app
fly postgres attach authoritymatch-db --app authoritymatch-drupal
```

### File Storage

```bash
# Create volume for Drupal files
fly volumes create drupal_files --size 10 --app authoritymatch-drupal
```

---

## Customization

### Adding Content Types

Edit `drupal/recipes/authoritymatch/recipe.yml` to add new entity types.

### Adding UI Components

```bash
cd packages/ui
pnpm dlx shadcn-ui@latest add button
```

### FMCSA Data Pipeline

```bash
# Run ingestion manually
cd packages/data-pipeline
pnpm ingest

# Or via cron (GitHub Actions / Fly Machines)
```

---

## Environment Variables

See `.env.example` for full list.

**Required for local:**

- `DRUPAL_GRAPHQL_ENDPOINT`
- `OAUTH_CLIENT_ID`
- `OAUTH_CLIENT_SECRET`

**Required for production:**

- `DRUPAL_ENV`
- `DATABASE_URL`
- `STRIPE_SECRET_KEY`
- `RESEND_API_KEY`

---

## Project Status

- [x] Scaffold setup (Turborepo + drupalx-decoupled)
- [x] Fly.io deployment configs
- [ ] Drupal content types (In Progress)
- [ ] FMCSA data pipeline
- [ ] Factor dashboard
- [ ] Stripe payments
- [ ] Jonesboro pilot launch

---

## License

GPL-2.0-or-later


GPL-2.0-or-later
