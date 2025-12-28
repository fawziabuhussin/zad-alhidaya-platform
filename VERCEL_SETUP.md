# 🚀 دليل النشر على Vercel - زاد الهداية

## 📋 المتطلبات قبل النشر

### 1. قاعدة بيانات PostgreSQL

Vercel لا يدعم SQLite. ستحتاج إلى قاعدة بيانات PostgreSQL:

**الخيارات المجانية:**
- [Neon](https://neon.tech) - ⭐ موصى به (مجاني، سريع)
- [Supabase](https://supabase.com) - مجاني
- [Railway](https://railway.app) - مجاني
- [PlanetScale](https://planetscale.com) - مجاني

**خطوات إنشاء قاعدة بيانات على Neon:**
1. اذهب إلى [neon.tech](https://neon.tech)
2. سجل حساب جديد
3. أنشئ مشروع جديد
4. انسخ `DATABASE_URL` (سيبدو مثل: `postgresql://user:pass@host/dbname`)

### 2. تحديث Prisma Schema

بعد إنشاء قاعدة البيانات، قم بتحديث `apps/api/prisma/schema.prisma`:

```prisma
datasource db {
  provider = "postgresql"  // تغيير من sqlite
  url      = env("DATABASE_URL")
}
```

ثم قم بتشغيل:
```bash
cd apps/api
npx prisma db push
npx prisma generate
```

## 🔧 خطوات النشر

### الخطوة 1: إعداد Git Repository

تأكد من أن المشروع موجود على GitHub:

```bash
cd /Users/fawziabuhussin/Downloads/zad-alhidaya-platform
git init
git add .
git commit -m "Initial commit"
git remote add origin YOUR_GITHUB_REPO_URL
git push -u origin main
```

### الخطوة 2: نشر Backend API

1. اذهب إلى [Vercel Dashboard](https://vercel.com/new?teamSlug=fawzis-projects-fea58d03)
2. اضغط **"Import Git Repository"**
3. اختر المستودع الخاص بك
4. في إعدادات المشروع:
   - **Project Name**: `zad-alhidaya-api` (أو أي اسم تريده)
   - **Root Directory**: `apps/api`
   - **Framework Preset**: **Other**
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `cd ../.. && npm install && cd apps/api && npm install && npx prisma generate`
5. اضغط **"Environment Variables"** وأضف:
   ```
   DATABASE_URL=postgresql://user:pass@host/dbname
   JWT_SECRET=your-super-secret-jwt-key-min-32-chars
   JWT_REFRESH_SECRET=your-super-secret-refresh-key-min-32-chars
   FRONTEND_URL=https://your-frontend-url.vercel.app
   NODE_ENV=production
   ```
6. اضغط **"Deploy"**

**ملاحظة:** بعد النشر، ستحصل على URL مثل: `https://zad-alhidaya-api.vercel.app`

### الخطوة 3: نشر Frontend (Next.js)

1. اذهب إلى [Vercel Dashboard](https://vercel.com/new?teamSlug=fawzis-projects-fea58d03) مرة أخرى
2. اضغط **"Import Git Repository"**
3. اختر نفس المستودع
4. في إعدادات المشروع:
   - **Project Name**: `zad-alhidaya-web` (أو أي اسم تريده)
   - **Root Directory**: `apps/web`
   - **Framework Preset**: **Next.js** (سيتم اكتشافه تلقائياً)
   - **Build Command**: `npm run build` (افتراضي)
   - **Output Directory**: `.next` (افتراضي)
   - **Install Command**: `cd ../.. && npm install && cd apps/web && npm install`
5. اضغط **"Environment Variables"** وأضف:
   ```
   NEXT_PUBLIC_API_URL=https://zad-alhidaya-api.vercel.app
   NEXT_PUBLIC_FRONTEND_URL=https://zad-alhidaya-web.vercel.app
   ```
   (استبدل URLs بالـ URLs الفعلية من الخطوة 2)
6. اضغط **"Deploy"**

### الخطوة 4: تشغيل Migrations

بعد نشر API، ستحتاج إلى تشغيل migrations:

**الطريقة 1: من Vercel CLI**
```bash
npm i -g vercel
vercel login
cd apps/api
vercel env pull .env.local
npx prisma migrate deploy
```

**الطريقة 2: من Vercel Dashboard**
1. اذهب إلى مشروع API في Vercel
2. اضغط على **"Settings"** → **"Deploy Hooks"**
3. أضف Post-Deploy Hook:
   - **Name**: `Run Migrations`
   - **Command**: `cd apps/api && npx prisma migrate deploy`

**الطريقة 3: إضافة Script**
أضف في `apps/api/package.json`:
```json
"scripts": {
  "postdeploy": "prisma migrate deploy"
}
```

### الخطوة 5: تشغيل Seed (اختياري)

```bash
cd apps/api
vercel env pull .env.local
npx prisma db seed
```

## 🔄 تحديث Environment Variables بعد النشر

إذا احتجت تحديث Environment Variables:

1. اذهب إلى Vercel Dashboard
2. اختر المشروع
3. اضغط **"Settings"** → **"Environment Variables"**
4. أضف أو عدّل المتغيرات
5. اضغط **"Redeploy"** لإعادة النشر

## ✅ التحقق من النشر

### Frontend:
- افتح URL الخاص بـ Frontend
- يجب أن ترى الصفحة الرئيسية

### Backend:
- افتح `https://your-api-url.vercel.app/api/health`
- يجب أن ترى: `{"status":"ok","timestamp":"..."}`

## 🐛 استكشاف الأخطاء

### خطأ: "Cannot find module"
- تأكد من أن `Install Command` صحيح
- تأكد من أن جميع dependencies موجودة في `package.json`

### خطأ: "Database connection failed"
- تحقق من `DATABASE_URL`
- تأكد من أن قاعدة البيانات تسمح بالاتصالات من أي IP (Neon يفعل هذا تلقائياً)

### خطأ: "CORS error"
- تأكد من إضافة `FRONTEND_URL` في API environment variables
- تأكد من أن `NEXT_PUBLIC_API_URL` في Frontend يشير إلى API URL الصحيح

### خطأ: "Prisma Client not generated"
- أضف `npx prisma generate` في `Install Command`

## 📝 ملاحظات مهمة

1. **قاعدة البيانات**: تأكد من استخدام PostgreSQL وليس SQLite
2. **Environment Variables**: لا تنس إضافة جميع المتغيرات المطلوبة
3. **CORS**: تأكد من إضافة URL الخاص بـ Frontend في `FRONTEND_URL`
4. **Build Time**: قد يستغرق البناء وقتاً أطول في المرة الأولى
5. **Migrations**: يجب تشغيل migrations بعد النشر الأول

## 🎉 بعد النشر

بعد النشر الناجح:
1. ✅ Frontend يعمل على: `https://your-frontend.vercel.app`
2. ✅ API يعمل على: `https://your-api.vercel.app`
3. ✅ قاعدة البيانات متصلة
4. ✅ Migrations تم تشغيلها
5. ✅ Seed تم تشغيله (اختياري)

**حساب Admin الافتراضي:**
- Email: `admin@zad-alhidaya.com`
- Password: `admin123`

**ملاحظة:** تأكد من تغيير كلمة مرور Admin بعد النشر!

