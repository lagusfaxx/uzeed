# syntax=docker/dockerfile:1

FROM node:20-alpine AS base
WORKDIR /app
RUN apk add --no-cache openssl libc6-compat
RUN corepack enable

# ---------- BUILD ----------
FROM base AS build
COPY . .
RUN pnpm install --frozen-lockfile=false

# Compilar API
WORKDIR /app/apps/api
RUN pnpm build

# Generar Prisma Client en build (NO en runtime)
WORKDIR /app
RUN pnpm exec prisma generate --schema=prisma/schema.prisma

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

# Copiamos Prisma Client generado (necesario en runtime)
COPY --from=build /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=build /app/node_modules/@prisma ./node_modules/@prisma

EXPOSE 3001
CMD ["node", "apps/api/dist/server.js"]
