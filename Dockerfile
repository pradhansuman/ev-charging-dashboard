# ---- Base ----
FROM node:20-slim AS base
RUN apt-get update && apt-get install -y --no-install-recommends openssl && rm -rf /var/lib/apt/lists/*
WORKDIR /app

# ---- Deps ----
FROM base AS deps
COPY package.json package-lock.json* ./
RUN npm install --legacy-peer-deps

# ---- Build & Seed ----
FROM deps AS builder
COPY prisma ./prisma/
COPY next.config.ts ./
COPY tsconfig.json ./
COPY src ./src/
COPY public ./public/
COPY scripts ./scripts/
ENV NEXT_TELEMETRY_DISABLED=1
ENV DATABASE_URL="file:/app/db/custom.db"

RUN npx prisma generate
RUN mkdir -p /app/db

# Seed the database
RUN npm install -g tsx
RUN npx prisma db push --skip-generate
RUN npx tsx scripts/seed-ev-data.ts

# Build Next.js
RUN npm run build

# ---- Production ----
FROM base AS runner
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nextjs

# Copy standalone build
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

# Copy Prisma client (for runtime queries)
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma/
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma/

# Copy the pre-seeded database
COPY --from=builder /app/db/custom.db /app/custom.db.seed

# Runtime db directory
RUN mkdir -p /app/db && chown nextjs:nodejs /app/db
ENV DATABASE_URL="file:/app/db/custom.db"

COPY docker-entrypoint.sh ./docker-entrypoint.sh
RUN chmod +x ./docker-entrypoint.sh

USER nextjs
EXPOSE 10000

ENV PORT=10000
ENV HOSTNAME="0.0.0.0"

ENTRYPOINT ["./docker-entrypoint.sh"]