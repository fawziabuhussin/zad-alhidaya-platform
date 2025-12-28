# 🚀 تعليمات النشر النهائية - زاد الهداية

## ✅ DATABASE_URL جاهز!
```
postgresql://neondb_owner:npg_QOBhvZTRWS48@ep-plain-resonance-adm6lz8k-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require
```

## 📤 الخطوة 1: رفع المشروع على GitHub

### إذا لم يكن المشروع على GitHub:
1. اذهب إلى GitHub.com
2. اضغط "New Repository"
3. اسم المستودع: `zad-alhidaya-platform`
4. اضغط "Create repository"
5. انسخ URL المستودع

### من Terminal:
```bash
cd /Users/fawziabuhussin/Downloads/zad-alhidaya-platform

# إذا لم يكن git initialized
git init

# إضافة جميع الملفات
git add .

# Commit
git commit -m "Ready for Vercel deployment"

# إضافة remote (استبدل YOUR_USERNAME)
git remote add origin https://github.com/YOUR_USERNAME/zad-alhidaya-platform.git

# رفع المشروع
git branch -M main
git push -u origin main
```

## 🚀 الخطوة 2: نشر Backend API على Vercel

1. **اذهب إلى:** https://vercel.com/new?teamSlug=fawzis-projects-fea58d03
2. اضغط **"Import Git Repository"**
3. اختر المستودع: `zad-alhidaya-platform`
4. **Project Settings:**
   - **Project Name**: `zad-alhidaya-api`
   - **Root Directory**: `apps/api` ⚠️ مهم جداً!
   - **Framework Preset**: **Other**
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `cd ../.. && npm install && cd apps/api && npm install && npx prisma generate`
5. **Environment Variables** (انسخ من VERCEL_ENV_VARS.md):
   ```
   DATABASE_URL=postgresql://neondb_owner:npg_QOBhvZTRWS48@ep-plain-resonance-adm6lz8k-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require
   JWT_SECRET=zad-alhidaya-super-secret-jwt-key-2024-production-min-32-chars
   JWT_REFRESH_SECRET=zad-alhidaya-super-secret-refresh-key-2024-production-min-32-chars
   FRONTEND_URL=https://zad-alhidaya-web.vercel.app
   NODE_ENV=production
   ```
6. اضغط **"Deploy"**
7. **انتظر 2-3 دقائق**
8. **انسخ API URL:** `https://zad-alhidaya-api.vercel.app` (أو الاسم الذي اخترته)

## 🌐 الخطوة 3: نشر Frontend على Vercel

1. **نفس الرابط:** https://vercel.com/new?teamSlug=fawzis-projects-fea58d03
2. اضغط **"Import Git Repository"** مرة أخرى
3. اختر **نفس المستودع**
4. **Project Settings:**
   - **Project Name**: `zad-alhidaya-web`
   - **Root Directory**: `apps/web` ⚠️ مهم جداً!
   - **Framework Preset**: **Next.js** (تلقائي)
   - **Install Command**: `cd ../.. && npm install && cd apps/web && npm install`
5. **Environment Variables:**
   ```
   NEXT_PUBLIC_API_URL=https://zad-alhidaya-api.vercel.app
   NEXT_PUBLIC_FRONTEND_URL=https://zad-alhidaya-web.vercel.app
   ```
   (استبدل URLs بالـ URLs الفعلية من الخطوة 2)
6. اضغط **"Deploy"**
7. **انتظر 2-3 دقائق**
8. **انسخ Frontend URL**

## 🔄 الخطوة 4: تحديث FRONTEND_URL في API

1. Vercel Dashboard → `zad-alhidaya-api` → Settings → Environment Variables
2. عدّل `FRONTEND_URL` إلى URL الفعلي للـ Frontend
3. اضغط **"Redeploy"**

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

### أو من Vercel Dashboard:
1. API Project → Settings → Deploy Hooks
2. Create Post-Deploy Hook
3. Name: `Run Migrations`
4. Command: `cd apps/api && npx prisma migrate deploy`

## 🌱 الخطوة 6: تشغيل Seed

```bash
cd apps/api
vercel env pull .env.local
npx prisma db seed
```

## ✅ التحقق

- [ ] Frontend يعمل: `https://your-frontend.vercel.app`
- [ ] API Health: `https://your-api.vercel.app/api/health`
- [ ] يمكن تسجيل الدخول كـ Admin

## 🔑 حسابات الافتراضية

- **Admin**: `admin@zad-alhidaya.com` / `admin123`
- **Teacher**: `teacher@zad-alhidaya.com` / `teacher123`
- **Student**: `student@zad-alhidaya.com` / `student123`

⚠️ **غير كلمة مرور Admin بعد النشر!**

---

**ابدأ الآن:** https://vercel.com/new?teamSlug=fawzis-projects-fea58d03
