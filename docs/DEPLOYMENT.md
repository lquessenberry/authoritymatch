# Deployment Guide

## Fly.io Production Deployment

### Prerequisites

- [Fly.io CLI](https://fly.io/docs/hands-on/install-flyctl/) installed
- `fly auth login` completed
- Access to the GitHub repository

### Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  authoritymatch │────▶│  authoritymatch │────▶│ authoritymatch- │
│      -web       │     │    -drupal      │     │       db        │
│   (Next.js)     │     │    (Drupal 11)  │     │   (Postgres)    │
└─────────────────┘     └─────────────────┘     └─────────────────┘
       │                         │
       │                  ┌──────┴──────┐
       │                  │             │
       ▼                  ▼             ▼
   Cloudflare          Drupal Files   Volumes
   (SSL/DNS)           Volume
```

### Step 1: Create Infrastructure

```bash
# Create database
fly postgres create \
  --name authoritymatch-db \
  --region ord \
  --initial-cluster-size 1 \
  --vm-size shared-cpu-1x \
  --volume-size 10

# Create Drupal app
fly apps create authoritymatch-drupal

# Create web app
fly apps create authoritymatch-web
```

### Step 2: Configure Secrets

```bash
# Drupal secrets
fly secrets set \
  DRUPAL_ENV=production \
  DATABASE_URL=$(fly postgres connect -a authoritymatch-db --print-url) \
  --app authoritymatch-drupal

# Web secrets
fly secrets set \
  NEXT_PUBLIC_DRUPAL_BASE_URL=https://authoritymatch-drupal.fly.dev \
  NEXT_PUBLIC_GRAPHQL_ENDPOINT=https://authoritymatch-drupal.fly.dev/graphql \
  DRUPAL_GRAPHQL_ENDPOINT=https://authoritymatch-drupal.fly.dev/graphql \
  --app authoritymatch-web

# OAuth secrets (generate these in Drupal admin)
fly secrets set \
  OAUTH_CLIENT_ID=your-client-id \
  OAUTH_CLIENT_SECRET=your-client-secret \
  --app authoritymatch-web
```

### Step 3: Create Volumes

```bash
# Drupal files volume
fly volumes create drupal_files \
  --region ord \
  --size 10 \
  --app authoritymatch-drupal
```

### Step 4: Deploy

```bash
# Deploy Drupal
pnpm fly:deploy:drupal

# Deploy web frontend
pnpm fly:deploy:web
```

### Step 5: Database Setup

```bash
# SSH into Drupal app
fly ssh console --app authoritymatch-drupal

# Run Drupal installation
drush si minimal --existing-config -y
drush ucrt admin --mail=admin@authoritymatch.com --password=changeme
drush urol administrator admin

# Enable AuthorityMatch recipe
drush recipe:apply authoritymatch
```

### SSL / Custom Domain

```bash
# Add custom domain (optional)
fly certs add authoritymatch.com --app authoritymatch-web

# DNS records will be provided - add to your registrar
```

### Scaling

```bash
# Scale Drupal vertically
fly scale vm dedicated-cpu-1x --memory 1024 --app authoritymatch-drupal

# Scale web horizontally
fly scale count 2 --app authoritymatch-web

# Auto-scaling
fly autoscale set min=1 max=3 --app authoritymatch-web
```

### Monitoring

```bash
# View logs
fly logs --app authoritymatch-drupal
fly logs --app authoritymatch-web

# View metrics
fly status --app authoritymatch-drupal
fly status --app authoritymatch-web
```

### Backup Strategy

```bash
# Database backups (automatic with Fly Postgres)
fly postgres list --app authoritymatch-db

# File backups
fly ssh console --app authoritymatch-drupal
# tar -czf /tmp/backup-$(date +%Y%m%d).tar.gz /var/www/html/web/sites/default/files/
```

### CI/CD (GitHub Actions)

```yaml
# .github/workflows/deploy.yml
name: Deploy to Fly.io
on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: superfly/flyctl-actions/setup-flyctl@master
      - run: flyctl deploy --config infra/fly/drupal/fly.toml --remote-only
        env:
          FLY_API_TOKEN: ${{ secrets.FLY_API_TOKEN }}
      - run: flyctl deploy --config infra/fly/web/fly.toml --remote-only
        env:
          FLY_API_TOKEN: ${{ secrets.FLY_API_TOKEN }}
```

---

## Troubleshooting

### Drupal Won't Start

```bash
# Check logs
fly logs --app authoritymatch-drupal

# SSH and debug
fly ssh console --app authoritymatch-drupal
ls -la /var/www/html/web/sites/default/
cat /var/log/apache2/error.log
```

### GraphQL Connection Issues

```bash
# Verify endpoint
curl https://authoritymatch-drupal.fly.dev/graphql \
  -H "Content-Type: application/json" \
  -d '{"query":"{__schema{types{name}}}"}'
```

### Database Connection Failures

```bash
# Verify connection string
fly ssh console --app authoritymatch-drupal
echo $DATABASE_URL

# Test connection
psql $DATABASE_URL -c "SELECT 1;"
```
