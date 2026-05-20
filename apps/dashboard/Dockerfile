FROM node:20-alpine AS deps
WORKDIR /app
COPY apps/dashboard/package.json ./
RUN npm install --legacy-peer-deps

FROM node:20-alpine AS builder
WORKDIR /app
ENV DRUPAL_HOSTNAME=authoritymatch-drupal.fly.dev
ENV NEXT_PUBLIC_DRUPAL_BASE_URL=https://authoritymatch-drupal.fly.dev
COPY --from=deps /app/node_modules ./node_modules
COPY apps/dashboard ./
RUN npm run build

FROM node:20-alpine AS prod-deps
WORKDIR /app
COPY apps/dashboard/package.json ./
RUN npm install --legacy-peer-deps --omit=dev

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
