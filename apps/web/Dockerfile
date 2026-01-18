# syntax=docker/dockerfile:1

FROM node:20-alpine AS base
WORKDIR /app
RUN corepack enable

COPY package.json pnpm-workspace.yaml tsconfig.base.json ./
COPY packages/shared/package.json packages/shared/tsconfig.json packages/shared/ ./packages/shared/
COPY apps/web/package.json apps/web/tsconfig.json ./apps/web/

FROM base AS deps
RUN pnpm install --frozen-lockfile=false

FROM deps AS dev
COPY packages/shared ./packages/shared
COPY apps/web ./apps/web
WORKDIR /app/apps/web
EXPOSE 3000
CMD ["pnpm", "dev"]

FROM deps AS build
COPY packages/shared ./packages/shared
COPY apps/web ./apps/web
WORKDIR /app/apps/web
RUN pnpm build

FROM node:20-alpine AS prod
WORKDIR /app
RUN corepack enable
ENV NODE_ENV=production
COPY --from=build /app/apps/web/.next/standalone ./
COPY --from=build /app/apps/web/.next/static ./.next/static
COPY --from=build /app/apps/web/public ./public
EXPOSE 3000
CMD ["node", "server.js"]
