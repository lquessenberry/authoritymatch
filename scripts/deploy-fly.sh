#!/bin/bash
set -e

echo "🚀 Deploying AuthorityMatch to Fly.io"
echo "======================================"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

cd /home/lquessenberry/CascadeProjects/authmatch/authoritymatch

# Create apps if they don't exist
echo -e "${YELLOW}Creating apps (if needed)...${NC}"

# Drupal Backend
if ! flyctl status --app authoritymatch-drupal >/dev/null 2>&1; then
  echo "Creating authoritymatch-drupal..."
  flyctl apps create authoritymatch-drupal --org personal || true
else
  echo "authoritymatch-drupal already exists"
fi

# Next.js Frontend
if ! flyctl status --app authoritymatch-web >/dev/null 2>&1; then
  echo "Creating authoritymatch-web..."
  flyctl apps create authoritymatch-web --org personal || true
else
  echo "authoritymatch-web already exists"
fi

# Create volumes if needed
echo -e "${YELLOW}Creating volumes...${NC}"
flyctl volumes list --app authoritymatch-drupal 2>/dev/null | grep -q "drupal_files" || {
  echo "Creating drupal_files volume..."
  flyctl volumes create drupal_files --app authoritymatch-drupal --size 10 --region ord || true
}

# Set secrets
echo -e "${YELLOW}Setting secrets...${NC}"
flyctl secrets set --app authoritymatch-drupal DRUPAL_DATABASE_URL="sqlite:///tmp/drupal.sqlite" --yes || true

# Deploy Drupal
echo -e "${GREEN}Deploying Drupal backend...${NC}"
cd infra/fly/drupal
flyctl deploy --app authoritymatch-drupal --yes
cd ../../..

echo ""
echo -e "${GREEN}✅ Deployment complete!${NC}"
echo ""
echo "URLs:"
echo "  Drupal: https://authoritymatch-drupal.fly.dev"
echo "  Web:    https://authoritymatch-web.fly.dev"
