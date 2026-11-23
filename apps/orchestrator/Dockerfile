FROM node:20-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json turbo.json ./
COPY packages ./packages
COPY apps/orchestrator ./apps/orchestrator
RUN npm ci
RUN npm run build -w @brightpath/shared
WORKDIR /app/apps/orchestrator
RUN npm run build

FROM node:20-alpine AS runner
RUN apk add --no-cache curl
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages ./packages
COPY --from=builder /app/apps/orchestrator ./apps/orchestrator
WORKDIR /app/apps/orchestrator
EXPOSE 3002
HEALTHCHECK --interval=10s --timeout=5s --retries=12 \
  CMD curl -fsS http://127.0.0.1:3002/health || exit 1
CMD ["node", "dist/server.js"]