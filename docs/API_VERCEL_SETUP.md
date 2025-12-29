# 🚀 API Backend Vercel Setup Guide

## Project Configuration

**Project Name:** `zad-alhidaya-platform-api`  
**Root Directory:** `apps/api`  
**Framework:** Other (Node.js/Express)

## Step-by-Step Setup

### 1. Create/Configure Project in Vercel

1. Go to Vercel Dashboard
2. If project doesn't exist: **Add New → Project** → Import `zad-alhidaya-platform` repo
3. If project exists: Go to **Settings → General**

### 2. Configure Project Settings

**In Vercel UI → Settings → General:**

- **Project Name:** `zad-alhidaya-platform-api`
- **Root Directory:** `apps/api` ⚠️ **IMPORTANT**
- **Framework Preset:** Other (or Node.js)
- **Build Command:** `npm run vercel-build` (or leave empty, vercel.json handles it)
- **Output Directory:** (leave empty - not needed for serverless)
- **Install Command:** `npm install`

### 3. Add Environment Variables

Go to **Settings → Environment Variables** → **Import** → Select `env-templates/api.env`

Or add manually:
```
DATABASE_URL=postgresql://neondb_owner:npg_QOBhvZTRWS48@ep-plain-resonance-adm6lz8k-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require
JWT_SECRET=zad-alhidaya-super-secret-jwt-key-2024-production-min-32-chars
JWT_REFRESH_SECRET=zad-alhidaya-super-secret-refresh-key-2024-production-min-32-chars
FRONTEND_URL=https://zad-alhidaya-web.vercel.app
NODE_ENV=production
```

Apply to: **Production, Preview, Development**

### 4. Deploy

Click **Deploy** or push to GitHub (auto-deploy)

### 5. Verify

After deployment, check:
- `https://zad-alhidaya-platform-api.vercel.app` → Should show `{"status":"ok"}`
- `https://zad-alhidaya-platform-api.vercel.app/api/health` → Should show `{"status":"ok"}`
- `https://zad-alhidaya-platform-api.vercel.app/api/courses/public` → Should show courses array

## Troubleshooting

### Build fails with "Cannot find module"
- Make sure **Root Directory** is set to `apps/api`
- Check that `vercel.json` is in `apps/api/` folder

### Database connection errors
- Verify `DATABASE_URL` is correct in Environment Variables
- Make sure Neon database is accessible
- Check that `?sslmode=require&channel_binding=require` is at the end of DATABASE_URL

### CORS errors
- Verify `FRONTEND_URL` is set to `https://zad-alhidaya-web.vercel.app`
- Redeploy after changing environment variables

