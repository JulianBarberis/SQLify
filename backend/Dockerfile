# ==============================================================================
# 1. STAGE: Dependencies
# ==============================================================================
FROM node:22-alpine3.20 AS deps

WORKDIR /app

# Instalar dependencias usando lockfile para reproducibilidad
COPY package.json package-lock.json ./
RUN npm ci

# ==============================================================================
# 2. STAGE: Development (Local dev with hot-reload)
# ==============================================================================
FROM node:22-alpine3.20 AS dev

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NODE_ENV=development \
    PORT=3001

EXPOSE 3001

CMD ["npm", "run", "dev"]

# ==============================================================================
# 3. STAGE: Production (Minimal, hardened & non-root)
# ==============================================================================
FROM node:22-alpine3.20 AS production

WORKDIR /app

# Crear usuario y grupo sin privilegios (Principle of Least Privilege)
RUN addgroup -g 1001 -S appgroup && \
    adduser -S appuser -u 1001 -G appgroup

# Copiar dependencias y podar devDependencies
COPY --from=deps --chown=appuser:appgroup /app/node_modules ./node_modules
COPY --chown=appuser:appgroup package.json package-lock.json ./
RUN npm prune --omit=dev

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
