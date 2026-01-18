# syntax=docker/dockerfile:1

FROM node:20-alpine AS base
WORKDIR /app
RUN apk add --no-cache openssl libc6-compat
RUN corepack enable

# ---------- BUILD ----------
FROM base AS build
COPY . .
RUN pnpm install --frozen-lockfile=false

# Build shared primero, luego api
RUN pnpm --filter @uzeed/shared build
RUN pnpm --filter @uzeed/api build

# ---------- PROD ----------
FROM node:20-alpine AS prod
WORKDIR /app
ENV NODE_ENV=production
RUN apk add --no-cache openssl libc6-compat

# Copiamos solo lo necesario para runtime:
# - node_modules (runtime)
# - prisma schema (si lo usas en runtime para migraciones/cliente)
# - dist del api
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/prisma ./prisma
COPY --from=build /app/apps/api/dist ./apps/api/dist

EXPOSE 3001
CMD ["node", "apps/api/dist/server.js"]


