# 🚀 Vercel Deployment Setup

You need **TWO separate Vercel projects** for this monorepo:

## Project 1: API Backend (Already exists ✅)
**Project Name:** `zad-alhidaya-platform-api`
**Root Directory:** `apps/api`
**Framework:** Other (Node.js/Express)

### Setup:
1. Go to Vercel Dashboard → Your Project → Settings → General
2. Set **Root Directory** to: `apps/api`
3. Go to **Environment Variables** → Import `env-templates/api.env`
4. Deploy

## Project 2: Frontend (Create this now ⚠️)
**Project Name:** `zad-alhidaya-web`
**Root Directory:** `apps/web`
**Framework:** Next.js (auto-detected)

### Steps to Create:

1. **Create New Project:**
   - Go to Vercel Dashboard → Add New → Project
   - Import your GitHub repository: `zad-alhidaya-platform`
   - Project Name: `zad-alhidaya-web`

2. **Configure Project:**
   - **Framework Preset:** Next.js (auto-detected)
   - **Root Directory:** `apps/web`
   - **Build Command:** (leave default or `cd apps/web && npm run build`)
   - **Output Directory:** `.next` (default)
   - **Install Command:** `npm install`

3. **Add Environment Variables:**
   - Go to Settings → Environment Variables
   - Click **Import** → Select `env-templates/web.env`
   - Apply to: Production, Preview, Development
   - Click **Import**

4. **Deploy:**
   - Click **Deploy**
   - Wait for build to complete
   - Your frontend will be at: `https://zad-alhidaya-web.vercel.app`

## Verify Both Projects:

✅ **API:** `https://zad-alhidaya-platform-api.vercel.app` → Should show `{"status":"ok"}`
✅ **Frontend:** `https://zad-alhidaya-web.vercel.app` → Should show your Next.js app

## Important Notes:

- Each project has its own **Root Directory** pointing to the correct app folder
- Each project has its own **Environment Variables**
- The frontend automatically detects the API URL, but setting `NEXT_PUBLIC_API_URL` is recommended
- After creating the frontend project, both will auto-deploy on every git push


