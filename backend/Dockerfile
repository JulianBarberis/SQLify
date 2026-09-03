# ==============================================================================
# 1. STAGE: Dependencies
# ==============================================================================
FROM node:22-alpine3.20 AS deps

WORKDIR /app

RUN corepack enable && corepack prepare pnpm@latest --activate

# Instalar dependencias usando pnpm-lock.yaml y .npmrc para reproducibilidad
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile

# ==============================================================================
# 2. STAGE: Development (Local dev with hot-reload)
# ==============================================================================
FROM node:22-alpine3.20 AS dev

WORKDIR /app

RUN corepack enable && corepack prepare pnpm@latest --activate

COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NODE_ENV=development \
    PORT=3001

EXPOSE 3001

CMD ["pnpm", "run", "dev"]

# ==============================================================================
# 3. STAGE: Production (Minimal, hardened & non-root)
# ==============================================================================
FROM node:22-alpine3.20 AS production

WORKDIR /app

RUN corepack enable && corepack prepare pnpm@latest --activate

# Crear usuario y grupo sin privilegios (Principle of Least Privilege)
RUN addgroup -g 1001 -S appgroup && \
    adduser -S appuser -u 1001 -G appgroup

# Copiar dependencias y podar devDependencies con pnpm
COPY --from=deps --chown=appuser:appgroup /app/node_modules ./node_modules
COPY --chown=appuser:appgroup package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm prune --prod

# Copiar código fuente
COPY --chown=appuser:appgroup src ./src
COPY --chown=appuser:appgroup SQLify.sql ./

# Cambiar a usuario no root
USER appuser

ENV NODE_ENV=production \
    PORT=3001

EXPOSE 3001

# Healthcheck nativo HTTP
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost:3001/api || exit 1

CMD ["node", "src/index.js"]
