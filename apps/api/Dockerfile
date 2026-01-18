# syntax=docker/dockerfile:1

# ---------- BASE ----------
FROM node:20-alpine AS base
WORKDIR /app

RUN apk add --no-cache openssl libc6-compat
RUN corepack enable

# ---------- DEPS ----------
FROM base AS deps

# Workspace root
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.base.json ./

# Workspaces
COPY packages ./packages
COPY apps ./apps
COPY prisma ./prisma

RUN pnpm install --frozen-lockfile

# ---------- BUILD ----------
FROM deps AS build
WORKDIR /app/apps/api
RUN pnpm build

# ---------- PROD ----------
FROM base AS prod
WORKDIR /app
ENV NODE_ENV=production

# Copiamos TODO el workspace necesario
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/package.json ./package.json
COPY --from=deps /app/pnpm-workspace.yaml ./pnpm-workspace.yaml
COPY --from=deps /app/packages ./packages
COPY --from=deps /app/prisma ./prisma
COPY --from=build /app/apps/api/dist ./apps/api/dist

EXPOSE 3001

# Prisma SIEMPRE desde root
CMD sh -c "node node_modules/prisma/build/index.js generate --schema=prisma/schema.prisma && node apps/api/dist/server.js"