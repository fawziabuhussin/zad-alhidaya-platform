# 🚀 نشر زاد الهداية على Vercel - دليل كامل

## ✅ DATABASE_URL جاهز!
```
postgresql://neondb_owner:npg_QOBhvZTRWS48@ep-plain-resonance-adm6lz8k-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require
```

---

## 📤 الخطوة 1: رفع المشروع على GitHub

### الطريقة السريعة:
1. اذهب إلى: https://github.com/new
2. اسم المستودع: `zad-alhidaya-platform`
3. اضغط **"Create repository"**
4. انسخ URL المستودع

### من Terminal:
```bash
cd /Users/fawziabuhussin/Downloads/zad-alhidaya-platform

# إضافة جميع الملفات
git add .

# Commit
git commit -m "Ready for Vercel deployment - Complete academy platform"

# إضافة remote (استبدل YOUR_USERNAME)
git remote add origin https://github.com/YOUR_USERNAME/zad-alhidaya-platform.git

# رفع المشروع
git branch -M main
git push -u origin main
```

**أو استخدم:** `./deploy-to-github.sh`

---

## 🚀 الخطوة 2: نشر Backend API

### في Vercel Dashboard:

1. **اذهب إلى:** https://vercel.com/new?teamSlug=fawzis-projects-fea58d03
2. اضغط **"Import Git Repository"**
3. اختر: `zad-alhidaya-platform`

### Project Settings:

```
Project Name: zad-alhidaya-api
Root Directory: apps/api
Framework Preset: Other
Build Command: npm run build
Output Directory: dist
Install Command: cd ../.. && npm install && cd apps/api && npm install && npx prisma generate
```

### Environment Variables:

انسخ والصق هذه القيم:

```
DATABASE_URL=postgresql://neondb_owner:npg_QOBhvZTRWS48@ep-plain-resonance-adm6lz8k-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require

JWT_SECRET=zad-alhidaya-super-secret-jwt-key-2024-production-minimum-32-characters-long

JWT_REFRESH_SECRET=zad-alhidaya-super-secret-refresh-key-2024-production-minimum-32-characters-long

FRONTEND_URL=https://zad-alhidaya-web.vercel.app

NODE_ENV=production
```

4. اضغط **"Deploy"**
5. انتظر 2-3 دقائق
6. **انسخ API URL:** `https://zad-alhidaya-api.vercel.app`

---

## 🌐 الخطوة 3: نشر Frontend

1. **نفس الرابط:** https://vercel.com/new?teamSlug=fawzis-projects-fea58d03
2. **Import Git Repository** → نفس المستودع

### Project Settings:

```
Project Name: zad-alhidaya-web
Root Directory: apps/web
Framework Preset: Next.js (تلقائي)
Install Command: cd ../.. && npm install && cd apps/web && npm install
```

### Environment Variables:

```
NEXT_PUBLIC_API_URL=https://zad-alhidaya-api.vercel.app
NEXT_PUBLIC_FRONTEND_URL=https://zad-alhidaya-web.vercel.app
```

(استبدل URLs بالـ URLs الفعلية من الخطوة 2)

3. اضغط **"Deploy"**
4. انتظر 2-3 دقائق
5. **انسخ Frontend URL**

---

## 🔄 الخطوة 4: تحديث FRONTEND_URL

1. Vercel Dashboard → `zad-alhidaya-api` → Settings → Environment Variables
2. عدّل `FRONTEND_URL` إلى URL الفعلي للـ Frontend
3. **Redeploy**

---

## 🗄️ الخطوة 5: تشغيل Migrations

### من Terminal:
```bash
npm i -g vercel
vercel login
cd apps/api
vercel link
vercel env pull .env.local
npx prisma migrate deploy
```

---

## 🌱 الخطوة 6: تشغيل Seed

```bash
cd apps/api
vercel env pull .env.local
npx prisma db seed
```

---

## ✅ التحقق

- Frontend: `https://your-frontend.vercel.app`
- API Health: `https://your-api.vercel.app/api/health`
- Login: `admin@zad-alhidaya.com` / `admin123`

---

**ابدأ الآن:** https://vercel.com/new?teamSlug=fawzis-projects-fea58d03

