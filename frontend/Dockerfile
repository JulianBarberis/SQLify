# ==============================================================================
# 1. STAGE: Development (Vite HMR & local dev server)
# ==============================================================================
FROM node:22-alpine3.20 AS dev

WORKDIR /app

RUN corepack enable && corepack prepare pnpm@latest --activate

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .

ENV VITE_APP_API_URL=http://localhost:3001

EXPOSE 5173

CMD ["pnpm", "run", "dev", "--", "--host", "0.0.0.0"]

# ==============================================================================
# 2. STAGE: Build (Static compilation)
# ==============================================================================
FROM node:22-alpine3.20 AS build

WORKDIR /app

RUN corepack enable && corepack prepare pnpm@latest --activate

# Argumento opcional para inyectar URL de backend durante compilación
ARG VITE_APP_API_URL
ENV VITE_APP_API_URL=${VITE_APP_API_URL}

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .
RUN pnpm run build

# ==============================================================================
# 3. STAGE: Production (Nginx Web Server)
# ==============================================================================
FROM nginx:1.27-alpine3.20 AS production

# Copiar archivos compilados y configuración de Nginx para SPA
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -qO- http://localhost:80/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
