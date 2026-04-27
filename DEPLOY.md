# Dokploy Deployment

## Prerequisites

- Dokploy instance running (exposes port 443 via Traefik)
- DNS A records pointing `api.yourdomain.com` and `store.yourdomain.com` to your server IP
- Repo pushed to GitHub/GitLab

## Phase 1 — Backend

1. In Dokploy: **Create Service → Compose**
2. Connect repo, select branch `main`, compose path: `docker-compose.yml`
3. In **Environment** tab, paste contents of `.env.dokploy.example` with real values:
   ```
   BACKEND_DOMAIN=api.yourdomain.com
   STOREFRONT_DOMAIN=store.yourdomain.com
   POSTGRES_PASSWORD=<openssl rand -hex 32>
   JWT_SECRET=<openssl rand -hex 32>
   COOKIE_SECRET=<openssl rand -hex 32>
   REVALIDATE_SECRET=<openssl rand -hex 32>
   NEXT_PUBLIC_DEFAULT_REGION=us
   NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY=placeholder
   ```
   Leave `COMPOSE_PROFILES` unset — storefront stays disabled.
4. Click **Deploy**. First build takes ~5 min (installs pnpm deps + compiles TS).
5. Verify: `curl https://api.yourdomain.com/health` → `{"status":"ok"}`
6. Admin UI: `https://api.yourdomain.com/app`

## Bootstrap Admin User

Exec into running backend container:

```sh
# In Dokploy → your compose → Containers → backend → exec, or via SSH:
docker exec -it <backend-container-name> sh
node_modules/.bin/medusa user -e admin@yourdomain.com -p <strong-password>
```

Then log into `https://api.yourdomain.com/app` and go to:
**Settings → Publishable API Keys → Create key** → attach to your sales channel → copy the `pk_...` value.

## Phase 2 — Storefront

1. In Dokploy **Environment** tab, add/update:
   ```
   NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY=pk_...your-key...
   COMPOSE_PROFILES=storefront
   ```
2. Click **Deploy**. Next.js build fetches data from the live backend during prerender — backend must be healthy.
3. Verify: `https://store.yourdomain.com` loads storefront.

## Redeployments

- Code push → trigger redeploy in Dokploy (or enable auto-deploy from branch).
- Backend redeploy runs `medusa db:migrate` automatically on start — safe on every boot.
- Storefront redeploy rebuilds Next.js image with current env vars. Requires `NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY` set.

## Secrets generation

```sh
openssl rand -hex 32
```

Run once per secret. Store them somewhere safe before pasting into Dokploy.

## Troubleshooting

| Symptom | Cause | Fix |
|---------|-------|-----|
| Backend container exits immediately | DB not ready | Check postgres healthcheck; `depends_on` should wait |
| `ECONNREFUSED postgres:5432` | Postgres still starting | Increase `start_period` or redeploy |
| Storefront build fails: `Missing NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY` | `NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY` not set | Phase 2 requires real key — cannot use placeholder |
| Storefront build fails fetching regions | Backend unreachable during build | Backend must be publicly accessible at `BACKEND_DOMAIN` before deploying storefront |
| Admin returns 401 on all requests | Wrong `ADMIN_CORS` | Verify `BACKEND_DOMAIN` matches the domain you access admin from |
| `pnpm: command not found` in backend runner | corepack not in runner stage | Runner uses npm directly — expected, not a bug |
