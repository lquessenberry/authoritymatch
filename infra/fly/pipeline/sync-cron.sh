#!/bin/bash
# Sync cron script for Fly.io pipeline
# This runs inside the Fly VM to trigger scheduled syncs

SYNC_TYPE=${SYNC_TYPE:-scheduled}
DRUPAL_URL=${DRUPAL_URL:-http://localhost:8080}
STATE_FILTER=${STATE_FILTER:-}

# Build the sync command
SYNC_CMD="node packages/data-pipeline/dist/sync-engine.js $SYNC_TYPE"

if [ "$SYNC_TYPE" == "full" ] && [ -f "/data/fmcsa.csv" ]; then
    SYNC_CMD="$SYNC_CMD /data/fmcsa.csv"
fi

echo "🚀 Starting $SYNC_TYPE sync"
echo "=========================="
echo "Drupal: $DRUPAL_URL"
echo "State: ${STATE_FILTER:-All}"
echo "Time: $(date -u +"%Y-%m-%d %H:%M:%S UTC")"
echo ""

# Ensure dependencies are built
cd /app
if [ ! -d "packages/data-pipeline/dist" ]; then
    echo "📦 Building data-pipeline..."
    npm run build --workspace=@authoritymatch/data-pipeline || npx tsc -p packages/data-pipeline/tsconfig.json
fi

# Export environment
export DRUPAL_URL
export STATE_FILTER
export SYNC_INTERVAL_HOURS=24

# Run sync with error handling
$SYNC_CMD 2>&1 | tee -a /data/sync.log

EXIT_CODE=$?

if [ $EXIT_CODE -eq 0 ]; then
    echo ""
    echo "✅ Sync completed successfully"
    echo "Next sync: $(date -u -d '+24 hours' +"%Y-%m-%d %H:%M UTC")"
else
    echo ""
    echo "❌ Sync failed with exit code $EXIT_CODE"
    echo "Check /data/sync.log for details"
fi

exit $EXIT_CODE
