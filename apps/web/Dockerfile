# ==============================================================================
# e-Milap — Web Frontend Production Dockerfile (Multi-Stage)
# ==============================================================================

# Stage 1: Build static assets
FROM node:20-alpine AS builder

WORKDIR /app

# Copy dependency manifests
COPY package.json package-lock.json ./
COPY packages/contracts/package.json ./packages/contracts/
COPY apps/api/package.json ./apps/api/

# Install build dependencies
RUN npm ci

# Copy contracts and frontend source files
COPY packages/contracts ./packages/contracts
COPY index.html vite.config.js ./
COPY public ./public
COPY src ./src

# Build contracts if needed
RUN npm run build --workspace @foundnear/contracts --if-present

# Build production SPA bundle into dist/
RUN npm run build

# ==============================================================================
# Stage 2: Production Nginx Server
# ==============================================================================
FROM nginx:1.27-alpine AS runner

# Install wget for healthcheck
RUN apk add --no-cache wget

# Copy custom Nginx configuration
COPY apps/web/nginx.conf /etc/nginx/conf.d/default.conf

# Copy compiled SPA bundle from builder
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

# Health check configuration matching infra/compose.prod.yaml
HEALTHCHECK --interval=15s --timeout=3s --retries=3 \
  CMD wget -qO- http://localhost:80/healthz || exit 1

CMD ["nginx", "-g", "daemon off;"]
