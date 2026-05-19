FROM node:20-alpine AS deps
WORKDIR /app
ENV CYPRESS_INSTALL_BINARY=0
COPY apps/web/nextjs/package.json apps/web/nextjs/package-lock.json ./
RUN npm ci

FROM node:20-alpine AS builder
WORKDIR /app
ENV DRUPAL_AUTH_URI=http://localhost:8080
ENV NEXT_PUBLIC_DRUPAL_BASE_URL=http://localhost:8080
COPY --from=deps /app/node_modules ./node_modules
COPY apps/web/nextjs ./
RUN npm run build

FROM node:20-alpine AS prod-deps
WORKDIR /app
ENV CYPRESS_INSTALL_BINARY=0
COPY apps/web/nextjs/package.json apps/web/nextjs/package-lock.json ./
RUN npm ci --omit=dev

FROM node:20-alpine AS runner
WORKDIR /app
ENV PORT=8080
ENV NODE_ENV=production
COPY --from=prod-deps /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/next.config.mjs ./next.config.mjs
EXPOSE 8080
CMD ["npm", "start"]
