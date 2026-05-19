FROM node:20-alpine AS deps
WORKDIR /app
COPY apps/web/nextjs/package.json apps/web/nextjs/package-lock.json ./
RUN npm ci

FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY apps/web/nextjs ./
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV PORT=8080
ENV NODE_ENV=production
COPY --from=builder /app ./
EXPOSE 8080
CMD ["npm", "start"]
