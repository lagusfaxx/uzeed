# Coolify deploy (click-by-click)

## 0) DNS (Cloudflare) para uzeed.cl
Crea 2 subdominios (A records):
- `only.uzeed.cl` -> IP del VPS
- `api.only.uzeed.cl` -> IP del VPS

En Cloudflare, para que Coolify gestione SSL, deja **Proxy = DNS only** mientras pides certificados (luego puedes activar proxy si te funciona bien).

## 1) Repo
- Sube este repo a GitHub (push)

## 2) Coolify: proyecto
- Projects -> New -> `only-mvp`

## 3) Postgres (Resource)
- Resources -> New -> Database -> Postgres
- Nombre: `only-postgres`
- Define: db=`onlymvp`, user=`postgres`, password=... (una fuerte)

Obtén la `DATABASE_URL` con host interno que muestra Coolify.

## 4) API (Service)
- New Resource -> Application -> Dockerfile
- Repo: tu GitHub
- Root directory: `/`
- Dockerfile: `apps/api/Dockerfile`
- Port: `3001`
- Domain: `api.only.uzeed.cl`

Env vars mínimas:
- APP_URL=https://only.uzeed.cl
- DATABASE_URL=...
- SESSION_SECRET=... (32+ chars)
- COOKIE_DOMAIN=.uzeed.cl
- KHIPU_API_KEY=...
- KHIPU_MERCHANT_SECRET=...
- KHIPU_RETURN_URL=https://only.uzeed.cl/billing/return
- KHIPU_NOTIFY_URL=https://api.only.uzeed.cl/billing/khipu/notify
- MEMBERSHIP_DAYS=30
- MEMBERSHIP_PRICE_CLP=1990

Opcional email:
- SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, EMAIL_FROM

Healthcheck:
- Path: `/health`

## 5) WEB (Service)
- New Resource -> Application -> Dockerfile
- Dockerfile: `apps/web/Dockerfile`
- Port: `3000`
- Domain: `only.uzeed.cl`

Env vars:
- NEXT_PUBLIC_API_URL=https://api.only.uzeed.cl
- NEXT_PUBLIC_APP_URL=https://only.uzeed.cl

## 6) Orden de deploy
- Deploy Postgres
- Deploy API
- Deploy WEB

## 7) DB migraciones + seed
En API -> Terminal:
```bash
cd /app/apps/api
pnpm prisma migrate deploy
pnpm seed
```

Admin demo:
- admin@uzeed.cl / Admin1234!
