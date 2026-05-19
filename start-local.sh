#!/bin/bash
set -e

echo "🚀 Starting AuthorityMatch (Lightweight Mode)"
echo "=============================================="
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

cd /home/lquessenberry/CascadeProjects/authmatch/authoritymatch

# Check if we need to build
echo -e "${YELLOW}Checking Docker images...${NC}"

# Build Drupal if needed
if ! docker images | grep -q "authoritymatch-drupal"; then
  echo "Building Drupal image..."
  docker build -f infra/fly/drupal/Dockerfile -t authoritymatch-drupal:latest .
fi

# Build Next.js if needed  
if ! docker images | grep -q "authoritymatch-web"; then
  echo "Building Next.js image..."
  cd apps/web/nextjs
  # Build the Next.js app first
  if [ ! -d ".next" ]; then
    echo "Installing dependencies and building Next.js..."
    npm install
    npm run build
  fi
  docker build -t authoritymatch-web:latest .
  cd ../../..
fi

echo ""
echo -e "${GREEN}Starting services...${NC}"
docker-compose up -d

echo ""
echo -e "${GREEN}✅ Services started!${NC}"
echo ""
echo "URLs:"
echo "  Drupal:   http://localhost:8080"
echo "  Next.js:  http://localhost:3000"
echo ""
echo "To stop: docker-compose down"
echo "To view logs: docker-compose logs -f"
