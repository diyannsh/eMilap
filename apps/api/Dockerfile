# ==============================================================================
# e-Milap — API Server Production Dockerfile (Multi-Stage)
# ==============================================================================

# Stage 1: Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Install build dependencies
RUN apk add --no-cache libc6-compat openssl

# Copy root package manifests and workspace configurations
COPY package.json package-lock.json ./
COPY packages/contracts/package.json ./packages/contracts/
COPY apps/api/package.json ./apps/api/
COPY database ./database/

# Install all dependencies (including devDependencies for building)
RUN npm ci

# Copy contracts and API source code
COPY packages/contracts ./packages/contracts
COPY apps/api ./apps/api

# Build shared contracts package
RUN npm run build --workspace @foundnear/contracts --if-present

# Generate Prisma Client with production mappings
ENV DATABASE_URL="postgresql://placeholder:placeholder@localhost:5432/placeholder"
RUN npx prisma generate --schema=database/prisma/schema.prisma

# Build the TypeScript API server into dist/
RUN npm run build --workspace @foundnear/api

# Prune dev dependencies for lean production runner
RUN npm prune --production

# ==============================================================================
# Stage 2: Production Runner
# ==============================================================================
FROM node:20-alpine AS runner

WORKDIR /app

# Security: Install runtime libraries and wget for healthchecks
RUN apk add --no-cache openssl wget ca-certificates \
    && addgroup --system --gid 1001 nodejs \
    && adduser --system --uid 1001 foundnear

ENV NODE_ENV=production \
    PORT=4000

# Copy node_modules from builder
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages/contracts ./packages/contracts
COPY --from=builder /app/apps/api/package.json ./apps/api/package.json
COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY --from=builder /app/database ./database

# Set working directory for API server
WORKDIR /app/apps/api

# Security: drop root privileges
USER foundnear

EXPOSE 4000

# Health check configuration
HEALTHCHECK --interval=15s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:4000/health/live || exit 1

CMD ["node", "dist/server.js"]
