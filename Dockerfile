# ─────────────────────────────────────────────────────────────────────────────
# ToolHub – multi-stage Docker build (monorepo)
#   Stage 1: install + build everything (turbo)
#   Stage 2: lean production image (backend + static frontend)
# ─────────────────────────────────────────────────────────────────────────────

# ── Stage 1: Builder ─────────────────────────────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app

RUN apk add --no-cache openssl

# Root workspace files
COPY package.json package-lock.json* turbo.json tsconfig.base.json ./

# Package manifests (so npm ci only re-runs when deps change)
COPY backend/package.json            backend/
COPY frontend/package.json           frontend/
COPY packages/ui/package.json        packages/ui/
COPY packages/auth/package.json      packages/auth/
COPY packages/config/package.json    packages/config/
COPY packages/api-client/package.json packages/api-client/

RUN npm ci
# npm/rollup optional-dependency issue on Alpine (musl):
# ensure Vite build can load rollup native binary in builder stage.
RUN npm install --workspace=frontend --no-save @rollup/rollup-linux-x64-musl

# Copy all source
COPY backend/    backend/
COPY frontend/   frontend/
COPY packages/   packages/

# Generate Prisma client, then build everything via turbo
RUN cd backend && npx prisma generate
RUN npx turbo build

# ── Stage 2: Production ─────────────────────────────────────────────────────
FROM node:20-alpine AS production
WORKDIR /app

RUN apk add --no-cache openssl

COPY package.json package-lock.json* ./
COPY backend/package.json backend/
COPY packages/config/package.json    packages/config/
COPY packages/auth/package.json      packages/auth/
COPY packages/api-client/package.json packages/api-client/
COPY packages/ui/package.json        packages/ui/

RUN npm ci --omit=dev

# tsx needed at runtime for prisma seed
RUN npm install -g tsx

# Copy built backend (compiled TS → dist/)
COPY --from=builder /app/backend/dist       backend/dist/
COPY --from=builder /app/backend/prisma     backend/prisma/

# Copy Prisma generated client to both locations:
# - src/generated/ (where seed.ts and prisma schema expect it)
# - dist/src/generated/ (where compiled JS requires it at runtime)
COPY --from=builder /app/backend/src/generated backend/src/generated/
COPY --from=builder /app/backend/src/generated backend/dist/src/generated/

# Copy built frontend (Vite → dist/)
COPY --from=builder /app/frontend/dist      backend/public/

# Copy shared packages source (needed at runtime by backend via workspace resolution)
COPY --from=builder /app/packages           packages/

ARG APP_PORT=4000
ENV NODE_ENV=production
ENV PORT=${APP_PORT}
EXPOSE ${APP_PORT}

WORKDIR /app/backend

# Run migrations, seed superadmin, then start
CMD ["sh", "-c", "npx prisma migrate deploy && npx tsx prisma/seed.ts && node dist/src/index.js"]
