# =============================================================================
# BUILD STAGE
# =============================================================================
FROM public.ecr.aws/docker/library/node:22-alpine AS builder

# Install canvas build dependencies
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    cairo-dev \
    jpeg-dev \
    pango-dev \
    giflib-dev \
    pixman-dev \
    && ln -sf python3 /usr/bin/python

# Install pnpm
RUN npm install -g pnpm

WORKDIR /usr/src/app

# Copy package files for dependency installation
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# Install all dependencies (including dev for build)
RUN pnpm install --frozen-lockfile

# Copy source code
COPY . .

# Build TypeScript
RUN pnpm run build

# Prune dev dependencies for production
RUN pnpm prune --prod

# =============================================================================
# PRODUCTION STAGE
# =============================================================================
FROM public.ecr.aws/docker/library/node:22-alpine AS production

# OCI labels
LABEL org.opencontainers.image.source="https://github.com/switz/relisten-sonos"
LABEL org.opencontainers.image.description="Relisten Sonos Integration Service"
LABEL org.opencontainers.image.licenses="MIT"

# Install canvas runtime dependencies (without -dev packages) and curl for healthcheck
RUN apk add --no-cache \
    cairo \
    pango \
    jpeg \
    giflib \
    pixman \
    fontconfig \
    curl

# Set production environment
ENV NODE_ENV=production

WORKDIR /usr/src/app

# Copy built application and production dependencies from builder
COPY --from=builder /usr/src/app/build ./build
COPY --from=builder /usr/src/app/node_modules ./node_modules
COPY --from=builder /usr/src/app/package.json ./
COPY --from=builder /usr/src/app/Sonos.wsdl ./
COPY --from=builder /usr/src/app/fonts ./fonts

# Static files - code expects them at build/public (import.meta.dirname + 'public')
COPY --from=builder /usr/src/app/src/public ./build/public

# Use non-root user
USER node

EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:3000/ || exit 1

CMD ["node", "build/server.js"]
