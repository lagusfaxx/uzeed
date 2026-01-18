# syntax=docker/dockerfile:1

FROM node:20-alpine AS base
WORKDIR /app
RUN apk add --no-cache openssl libc6-compat
RUN corepack enable

# ---------- BUILD ----------
FROM base AS build

# Copiamos el repo completo para que tsup/prisma y workspace funcionen al compilar
COPY . .

# Instalamos todo para build (incluye devDeps)
RUN pnpm install --frozen-lockfile=false

# Compilar API
WORKDIR /app/apps/api
RUN pnpm build

# ---------- PROD ----------
FROM base AS prod
ENV NODE_ENV=production
WORKDIR /app

COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY apps ./apps
COPY packages ./packages
COPY prisma ./prisma

# Instala SOLO dependencias de producción
RUN pnpm install --prod --frozen-lockfile=false

# Copiamos el build ya compilado
COPY --from=build /app/apps/api/dist ./apps/api/dist

EXPOSE 3001

# Prisma + arranque
CMD sh -c "pnpm exec prisma generate --schema=prisma/schema.prisma && node apps/api/dist/server.js"