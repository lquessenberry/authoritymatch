#!/bin/bash
set -e

# Fly.io CSV Ingestion Script
# Usage: ./scripts/fly-ingest.sh [ar|tx|all] [s3-url|local-path]

STATE_FILTER="${1:-ar}"
DATA_SOURCE="${2:-}"

APP_NAME="authoritymatch-pipeline"
VOLUME_NAME="data_volume"

echo "🚀 FMCSA Ingestion on Fly.io"
echo "============================="
echo "State filter: ${STATE_FILTER^^}"
echo "App: $APP_NAME"
echo ""

# Check if fly CLI is installed
if ! command -v fly &> /dev/null; then
    echo "❌ fly CLI not found. Install with:"
    echo "   curl -L https://fly.io/install.sh | sh"
    exit 1
fi

# Ensure app exists
echo "📦 Checking Fly app..."
if ! fly status --app "$APP_NAME" &> /dev/null; then
    echo "Creating app $APP_NAME..."
    fly launch --name "$APP_NAME" --region iad --no-deploy --yes
    
    # Create volume
    echo "Creating volume..."
    fly volumes create "$VOLUME_NAME" --size 50 --app "$APP_NAME" --yes
fi

# Upload CSV to Fly volume if provided
if [ -n "$DATA_SOURCE" ]; then
    echo "📤 Uploading data..."
    
    if [[ "$DATA_SOURCE" == s3://* ]]; then
        # Download from S3 on the Fly machine
        echo "Will download from S3 on Fly machine"
    elif [ -f "$DATA_SOURCE" ]; then
        # Upload local file via SFTP/SCP
        echo "Uploading $DATA_SOURCE to Fly volume..."
        fly ssh console --app "$APP_NAME" --command "mkdir -p /data/upload" &> /dev/null || true
        
        # Use fly sftp or copy via command
        echo "   (For large files, use: fly sftp shell --app $APP_NAME)"
        echo "   Or upload to S3 and provide s3:// URL"
    fi
fi

# Deploy and run ingestion
echo ""
echo "▶️  Running ingestion..."
fly deploy --app "$APP_NAME" \
    --env STATE_FILTER="${STATE_FILTER^^}" \
    --wait-timeout=600

# Execute the ingestion
fly ssh console --app "$APP_NAME" --command "cd /app && node batch-ingest.js" &
INGEST_PID=$!

# Monitor progress
echo ""
echo "📊 Monitoring progress (Ctrl+C to detach)..."
sleep 5

while true; do
    fly ssh console --app "$APP_NAME" --command "cat /data/checkpoint.json 2>/dev/null || echo 'Starting...'" 2>/dev/null
    sleep 10
done &
MONITOR_PID=$!

# Wait for completion
wait $INGEST_PID 2>/dev/null
kill $MONITOR_PID 2>/dev/null

echo ""
echo "✅ Ingestion complete!"

# Download results
echo ""
echo "📥 Downloading batches..."
mkdir -p ./data
fly ssh console --app "$APP_NAME" --command "tar -czf /data/batches.tar.gz -C /data batch_*.json 2>/dev/null; ls -lh /data/batches.tar.gz 2>/dev/null || echo 'No batches yet'"

# List results
fly ssh console --app "$APP_NAME" --command "ls -lh /data/batch_*.json 2>/dev/null | wc -l && cat /data/checkpoint.json 2>/dev/null"

echo ""
echo "To download batches locally:"
echo "   fly sftp get --app $APP_NAME /data/batch_00001.json ./data/"
echo ""
echo "To load into Drupal:"
echo "   fly ssh console --app $APP_NAME --command 'cd /app && DRUPAL_URL=xxx node batch-load-drupal.js'"
