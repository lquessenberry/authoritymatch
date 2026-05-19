# AuthorityMatch Deployment Guide

## 🚀 Quick Start Options

### Option 1: Docker Compose (Lightweight - RECOMMENDED)
No DDEV overhead, just pure Docker. Much lighter on your laptop.

```bash
# Start everything
cd /home/lquessenberry/CascadeProjects/authmatch/authoritymatch
./start-local.sh

# Access:
# - Drupal: http://localhost:8080
# - Next.js: http://localhost:3000

# Stop:
docker-compose down
```

### Option 2: Fly.io (Cloud - Zero Local Resources)
Deploy to Fly.io and run everything in the cloud.

```bash
# Build locally
docker build -f infra/fly/drupal/Dockerfile -t authoritymatch-drupal:latest .

# Deploy to Fly.io
fly deploy

# URLs will be:
# - https://authoritymatch-drupal.fly.dev
# - https://authoritymatch-web.fly.dev
```

## 📋 Current Status

### ✅ COMPLETED

1. **Drupal Module** (`authoritymatch_core`)
   - Content types: Authority, Factor, Match
   - Migration source plugins for JSON import
   - GraphQL schema extension
   - Field configurations complete

2. **Matching Engine** (`packages/core/src/matching/engine.ts`)
   - 5 compatibility components (Geographic, Fleet Size, Risk, Preferences, Financial)
   - Hard disqualifiers
   - Batch matching support
   - Test script: `node test-matching.js`

3. **Pilot Factor Data** (`data/factors.json`)
   - Freight Funding (MODERATE)
   - Sunbelt Finance (CONSERVATIVE)
   - Century Finance (AGGRESSIVE)

4. **Next.js Dashboard** (`apps/web/nextjs/app/dashboard/`)
   - `/factors` - Factor profiles and selection
   - `/authorities` - Authority search and filter
   - `/matches` - Match management with status tabs

5. **Fly.io Configs** (`infra/fly/`)
   - Drupal Dockerfile and fly.toml
   - Web Dockerfile and fly.toml
   - Pipeline configs

### 🔄 PENDING DEPLOYMENT

The Docker images are built but need final configuration:

1. **Drupal Database**: Currently configured for SQLite (lightweight)
2. **Next.js Build**: Needs `npm run build` in `apps/web/nextjs`
3. **Environment Variables**: Need to set `NEXT_PUBLIC_DRUPAL_BASE_URL`

## 🔧 Manual Steps to Complete

### Build Next.js Frontend:
```bash
cd apps/web/nextjs
npm install
npm run build
cd ../../..
docker build -t authoritymatch-web:latest ./apps/web/nextjs
```

### Start Services:
```bash
# Start Drupal
docker run -d --name drupal \
  -p 8080:8080 \
  -v drupal_files:/var/www/html/web/sites/default/files \
  authoritymatch-drupal:latest

# Start Next.js
docker run -d --name web \
  -p 3000:8080 \
  -e NEXT_PUBLIC_DRUPAL_BASE_URL=http://localhost:8080 \
  authoritymatch-web:latest
```

### Or use Docker Compose:
```bash
docker-compose up -d
```

## 🌐 Fly.io Deployment (When Ready)

### Prerequisites:
```bash
# Ensure you're logged in
fly auth whoami

# Create apps (already done):
# - authoritymatch-drupal
# - authoritymatch-web

# Create volume for Drupal files
fly volumes create drupal_files --app authoritymatch-drupal --size 10 --region ord
```

### Deploy:
```bash
# From project root (where fly.toml is)
fly deploy --app authoritymatch-drupal

# For Next.js
cd infra/fly/web
fly deploy --app authoritymatch-web
```

## 📊 Resource Usage Comparison

| Setup | CPU | Memory | Startup Time |
|-------|-----|--------|--------------|
| DDEV | High | 2-4GB | 2-5 min |
| Docker Compose | Medium | 512MB-1GB | 30 sec |
| Fly.io (Cloud) | None (local) | None (local) | Instant |

## 🎯 Recommendation

For development without melting your laptop:

1. **Use Docker Compose** for local development
2. **Deploy to Fly.io** for testing/production
3. **Avoid DDEV** unless you need specific Drupal development features

## 🔗 Access Points

Once running:

| Service | Local URL | Fly.io URL |
|---------|-----------|------------|
| Drupal Backend | http://localhost:8080 | https://authoritymatch-drupal.fly.dev |
| Next.js Frontend | http://localhost:3000 | https://authoritymatch-web.fly.dev |
| Dashboard | http://localhost:3000/dashboard | https://authoritymatch-web.fly.dev/dashboard |

## 📁 Key Files

| File | Purpose |
|------|---------|
| `fly.toml` | Root Fly.io config for Drupal |
| `docker-compose.yml` | Local Docker orchestration |
| `start-local.sh` | One-command local startup |
| `infra/fly/drupal/Dockerfile` | Drupal container definition |
| `apps/web/nextjs/Dockerfile` | Next.js container definition |

---

**Last Updated**: 2024-05-19
**Status**: Ready for deployment
