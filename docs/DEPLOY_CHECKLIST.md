# Deploy & database checklist

Use this after migration changes or when fixing "Can't reach database server" / login errors.

---

## Done automatically (already run)

- **Prisma client** – `prisma generate` run; client is up to date.
- **Migration lock** – `prisma/migrations/migration_lock.toml` set to `postgresql` (was `sqlite`).
- **Failed migration** – `20260201110000_add_lesson_questions` marked as rolled back in the DB.
- **Init migration** – `20260206223330_init` marked as **applied** (your DB already had the tables; no re-create).
- **Migration SQL** – `20260206223330_init/migration.sql` updated: `DATETIME` → `TIMESTAMP(3)` for PostgreSQL (for future fresh DBs).
- **Migration status** – Database schema is up to date.
- **API build** – `npm run build` in `apps/api` succeeds.

**You still need to:** redeploy the API on Vercel (and confirm Neon is Active + `DATABASE_URL` in Vercel). See sections 1, 3, 4 below.

---

## 1. Neon database (console.neon.tech)

- [ ] **Project is Active**  
  - Left sidebar → **Monitoring** → **Compute**  
  - Next to **Primary** you should see a green **Active**. If it says **Suspended**, click to resume/restore.

- [ ] **Connection string is correct**  
  - **Connect** (or Connection details) → copy the **connection string** (not the `psql` command).  
  - It must look like:  
    `postgresql://USER:PASSWORD@ep-....-pooler....neon.tech/neondb?sslmode=require`  
  - Use the **pooled** (pooler) URL for serverless (Vercel).

- [ ] **Optional: Autosuspend**  
  - **Monitoring** → **Compute settings** → **Edit endpoint**  
  - If you get random "connection closed" after idle, increase **Autosuspend delay** (e.g. 10–30 min).

---

## 2. Run migration on production (choose one)

**Option A – Let Vercel run it on deploy (recommended)**  
- Your API’s `vercel-build` runs `prisma migrate deploy` in **production**.  
- So a **production redeploy** of the API (step 4) will apply the single migration.  
- Skip to step 3 if you’re fine with that.

**Option B – Run migration yourself first**  
- In terminal, from repo root:
  ```bash
  cd apps/api
  export DATABASE_URL="postgresql://...."   # your production Neon URL (from Neon or Vercel)
  npx prisma migrate deploy
  ```
- Use the **exact** production URL (no `psql`, no quotes).  
- Then do step 3 and 4.

---

## 3. Vercel environment variables

**API project** (e.g. `zad-alhidaya-platform-api`):

- [ ] **DATABASE_URL**  
  - Value = full Neon URL (from step 1), e.g.  
    `postgresql://neondb_owner:PASSWORD@ep-....-pooler....neon.tech/neondb?sslmode=require&channel_binding=require`  
  - Scope: **Production** (and Preview if you use it).

- [ ] **JWT_SECRET** and **JWT_REFRESH_SECRET**  
  - Set and at least 32 characters.

- [ ] **FRONTEND_URL**  
  - Your web app URL, e.g. `https://zad-alhidaya-web.vercel.app`

- [ ] **NODE_ENV**  
  - `production` for production.

**Web project** (e.g. `zad-alhidaya-web`):

- [ ] **NEXT_PUBLIC_API_URL**  
  - Your API base URL, e.g. `https://zad-alhidaya-platform-api.vercel.app`  
  - No trailing slash.

---

## 4. Redeploy

- [ ] **API**  
  - Vercel → API project → **Deployments** → ⋮ on latest → **Redeploy** (or push a commit to trigger deploy).  
  - This runs `vercel-build` and, in production, **runs `prisma migrate deploy`** so the single migration is applied.

- [ ] **Web** (if you changed env or need a fresh build)  
  - Same flow: Redeploy the web project.

---

## 5. Verify

- [ ] **Health**  
  - Open: `https://YOUR-API-URL.vercel.app/health` or `/api/health`  
  - Expect: `{"status":"ok",...}`

- [ ] **Login**  
  - Use the real app login page; no "Can't reach database server" or "Connection closed".

- [ ] **Neon Monitoring**  
  - After a successful login, Neon **Monitoring** may show a short spike in compute; that confirms the app is talking to the DB.

---

## Quick reference

| Item              | Where to check / set                          |
|-------------------|------------------------------------------------|
| DB suspended?     | Neon → Monitoring → Compute → Primary (Active) |
| Connection string | Neon → Connect / Connection details           |
| API env vars      | Vercel → API project → Settings → Environment Variables |
| Web API URL       | Vercel → Web project → NEXT_PUBLIC_API_URL    |
| Apply migration   | Redeploy API (production) or run `prisma migrate deploy` with prod DATABASE_URL |

---

*Template env: `env-templates/api.env`. Do not commit real secrets.*
