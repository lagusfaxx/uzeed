# syntax=docker/dockerfile:1

FROM node:20-alpine AS base
WORKDIR /app
RUN corepack enable

# Copy workspace manifests
COPY package.json pnpm-workspace.yaml tsconfig.base.json ./
COPY packages/shared/package.json packages/shared/tsconfig.json packages/shared/ ./packages/shared/
COPY apps/api/package.json apps/api/tsconfig.json apps/api/.env.example ./apps/api/

FROM base AS deps
RUN pnpm install --frozen-lockfile=false

FROM deps AS dev
COPY packages/shared ./packages/shared
COPY prisma ./prisma
COPY apps/api ./apps/api
WORKDIR /app/apps/api
RUN pnpm prisma generate --schema=../../prisma/schema.prisma
EXPOSE 3001
CMD ["pnpm", "dev"]

FROM deps AS build
COPY packages/shared ./packages/shared
COPY prisma ./prisma
COPY apps/api ./apps/api
WORKDIR /app/apps/api
RUN pnpm prisma generate
RUN pnpm build

FROM node:20-alpine AS prod
WORKDIR /app
RUN corepack enable
ENV NODE_ENV=production
COPY --from=build /app/node_modules ./node_modules
COPY --from=deps /app/packages ./packages
COPY --from=build /app/apps/api/dist ./apps/api/dist
COPY --from=build /app/apps/api/package.json ./apps/api/package.json
COPY --from=build /app/prisma ./prisma
WORKDIR /app/apps/api
EXPOSE 3001
CMD ["node", "dist/server.js"]
