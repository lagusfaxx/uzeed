# uzeed-only-mvp

MVP tipo OnlyFans (paywall + feed) con Next.js + Node (Express) + Postgres + Prisma + Khipu.

## Correr local

1) Copia envs

```bash
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env
```

2) Levanta todo

```bash
docker compose up --build
```

- Web: http://localhost:3000
- API: http://localhost:3001

## Deploy con Coolify

Ver guía en `infra/coolify.md`.
