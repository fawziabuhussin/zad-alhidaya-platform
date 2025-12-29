# 🎨 Frontend Vercel Setup Guide

## Project Configuration

**Project Name:** `zad-alhidaya-web`  
**Root Directory:** `apps/web`  
**Framework:** Next.js

## Step-by-Step Setup

### 1. Go to Frontend Project Settings

1. Go to Vercel Dashboard
2. Click on `zad-alhidaya-web` project
3. Go to **Settings → General**

### 2. Configure Project Settings

**Root Directory:**
```
apps/web
```
⚠️ **CRITICAL:** Must be set to `apps/web`

**Framework Preset:**
- Select: **Next.js** (should auto-detect)

**Build Command:**
```
npm run build
```
(Or leave empty - vercel.json handles it)

**Output Directory:**
```
.next
```
(Or leave as "Next.js default")

**Install Command:**
```
npm install
```
(Not `npm install --prefix=../..`)

### 3. Add Environment Variables

Go to **Settings → Environment Variables** → **Import** → Select `env-templates/web.env`

Or add manually:
```
NEXT_PUBLIC_API_URL=https://zad-alhidaya-platform-api.vercel.app
NEXT_PUBLIC_FRONTEND_URL=https://zad-alhidaya-web.vercel.app
```

⚠️ **IMPORTANT:** Make sure `NEXT_PUBLIC_API_URL` is complete: `https://zad-alhidaya-platform-api.vercel.app` (not truncated)

Apply to: **Production, Preview, Development**

### 4. Redeploy

1. Go to **Deployments** tab
2. Click **...** on the latest deployment
3. Click **Redeploy**
4. Or push a new commit to trigger auto-deploy

### 5. Verify

After deployment, check:
- `https://zad-alhidaya-web.vercel.app` → Should show your Next.js app
- Open browser console → Should see `[API] Using API URL: https://zad-alhidaya-platform-api.vercel.app`
- Navigate to `/courses` → Should load courses from API

## Common Issues

### Build fails with "Cannot find module"
- ✅ Check **Root Directory** is `apps/web`
- ✅ Check **Install Command** is `npm install` (not with `--prefix`)

### Build fails with "cd apps/web: No such file or directory"
- ✅ **Build Command** should be `npm run build` (not `cd apps/web && npm run build`)
- ✅ **Root Directory** must be set to `apps/web`

### Frontend can't connect to API
- ✅ Check `NEXT_PUBLIC_API_URL` is set correctly
- ✅ Check API is deployed and working: `https://zad-alhidaya-platform-api.vercel.app`
- ✅ Check browser console for errors

### Environment variables not working
- ✅ Make sure variables start with `NEXT_PUBLIC_` for client-side access
- ✅ Redeploy after adding/changing environment variables

