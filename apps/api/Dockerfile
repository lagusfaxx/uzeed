# syntax=docker/dockerfile:1

FROM node:20-alpine AS base
WORKDIR /app
RUN apk add --no-cache openssl libc6-compat
RUN corepack enable

# ---------- BUILD ----------
FROM base AS build
COPY . .
RUN pnpm install --frozen-lockfile=false

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

# SOLO deps de producción (Prisma Client se genera aquí automáticamente)
RUN pnpm install --prod --frozen-lockfile=false

# Copiamos el build compilado
COPY --from=build /app/apps/api/dist ./apps/api/dist

EXPOSE 3001
CMD ["node", "apps/api/dist/server.js"]

