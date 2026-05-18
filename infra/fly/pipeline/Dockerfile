FROM node:20-slim

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy source
COPY . .

# Create data directory
RUN mkdir -p /data

# Non-root user
USER node

# Default command (can be overridden)
CMD ["node", "batch-ingest.js"]
