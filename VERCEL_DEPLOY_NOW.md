# 🚀 نشر فوري على Vercel - خطوات سريعة

## ✅ ما تم إعداده

- ✅ Prisma schema محدث لـ PostgreSQL
- ✅ ملفات Vercel config جاهزة
- ✅ المشروع جاهز للنشر

## 📋 الخطوات (5 دقائق)

### الخطوة 1: إنشاء قاعدة بيانات PostgreSQL

**Neon (أسهل وأسرع):**
1. اذهب إلى: https://neon.tech
2. سجل دخول (يمكنك استخدام GitHub)
3. اضغط **"Create Project"**
4. اختر اسم المشروع: `zad-alhidaya`
5. اضغط **"Create Project"**
6. انسخ `DATABASE_URL` (سيبدو مثل: `postgresql://user:pass@ep-xxx.region.aws.neon.tech/dbname?sslmode=require`)

### الخطوة 2: نشر Backend API

1. اذهب إلى: https://vercel.com/new?teamSlug=fawzis-projects-fea58d03
2. اضغط **"Import Git Repository"**
3. اختر المستودع: `zad-alhidaya-platform` (أو اسم المستودع الخاص بك)
4. في **Project Settings**:
   - **Project Name**: `zad-alhidaya-api`
   - **Root Directory**: `apps/api` ⚠️ مهم جداً!
   - **Framework Preset**: **Other**
   - **Build Command**: `npm run vercel-build` ⚠️ مهم!
   - **Output Directory**: (اتركه فارغاً - serverless functions لا تحتاج output directory)
   - **Install Command**: `npm install` (سيقوم Vercel بتثبيت dependencies تلقائياً)
5. اضغط **"Environment Variables"** وأضف:
   ```
   DATABASE_URL=postgresql://... (من Neon)
   JWT_SECRET=your-super-secret-jwt-key-minimum-32-characters-long
   JWT_REFRESH_SECRET=your-super-secret-refresh-key-minimum-32-characters-long
   FRONTEND_URL=https://zad-alhidaya-web.vercel.app
   NODE_ENV=production
   ```
   ⚠️ **ملاحظة**: `FRONTEND_URL` ستحتاج إلى تحديثه بعد نشر Frontend
6. اضغط **"Deploy"**
7. **انتظر حتى يكتمل النشر** (2-3 دقائق)
8. **انسخ URL الخاص بـ API** (مثل: `https://zad-alhidaya-api.vercel.app`)

### الخطوة 3: تحديث FRONTEND_URL في API

1. بعد نشر API، اذهب إلى Vercel Dashboard
2. اختر مشروع `zad-alhidaya-api`
3. اضغط **Settings** → **Environment Variables**
4. عدّل `FRONTEND_URL` إلى URL الفعلي للـ Frontend (سنحصل عليه في الخطوة التالية)
5. أو اتركه مؤقتاً وسنحدثه بعد نشر Frontend

### الخطوة 4: نشر Frontend

1. اذهب إلى: https://vercel.com/new?teamSlug=fawzis-projects-fea58d03
2. اضغط **"Import Git Repository"**
3. اختر نفس المستودع
4. في **Project Settings**:
   - **Project Name**: `zad-alhidaya-web`
   - **Root Directory**: `apps/web` ⚠️ مهم جداً!
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
7. **انتظر حتى يكتمل النشر** (2-3 دقائق)
8. **انسخ URL الخاص بـ Frontend** (مثل: `https://zad-alhidaya-web.vercel.app`)

### الخطوة 5: تحديث Environment Variables

**في API Project:**
1. اذهب إلى Vercel Dashboard → `zad-alhidaya-api`
2. **Settings** → **Environment Variables**
3. عدّل `FRONTEND_URL` إلى URL الفعلي للـ Frontend
4. اضغط **"Redeploy"** لإعادة النشر

**في Frontend Project:**
1. اذهب إلى Vercel Dashboard → `zad-alhidaya-web`
2. **Settings** → **Environment Variables**
3. تأكد من أن `NEXT_PUBLIC_API_URL` يشير إلى API URL الصحيح
4. اضغط **"Redeploy"** إذا لزم الأمر

### الخطوة 6: تشغيل Migrations

بعد نشر API، شغّل migrations:

**الطريقة 1: من Vercel CLI**
```bash
npm i -g vercel
vercel login
cd apps/api
vercel link
vercel env pull .env.local
npx prisma migrate deploy
```

**الطريقة 2: من Vercel Dashboard**
1. اذهب إلى `zad-alhidaya-api` → **Settings** → **Deploy Hooks**
2. أنشئ Post-Deploy Hook:
   - **Name**: `Run Migrations`
   - **Command**: `cd apps/api && npx prisma migrate deploy`
3. أو أضف في `package.json`:
   ```json
   "scripts": {
     "postdeploy": "prisma migrate deploy"
   }
   ```

### الخطوة 7: تشغيل Seed (اختياري)

```bash
cd apps/api
vercel env pull .env.local
npx prisma db seed
```

## ✅ التحقق من النشر

1. **Frontend**: افتح `https://your-frontend.vercel.app`
2. **API Health**: افتح `https://your-api.vercel.app/api/health`
3. **Login**: جرب تسجيل الدخول كـ Admin

## 🔑 حسابات الافتراضية

بعد تشغيل seed:
- **Admin**: `admin@zad-alhidaya.com` / `admin123`
- **Teacher**: `teacher@zad-alhidaya.com` / `teacher123`
- **Student**: `student@zad-alhidaya.com` / `student123`

⚠️ **غير كلمة مرور Admin بعد النشر!**

## 🐛 استكشاف الأخطاء

### خطأ: "Cannot connect to database"
- تحقق من `DATABASE_URL`
- تأكد من أن قاعدة البيانات تسمح بالاتصالات من أي IP

### خطأ: "CORS error"
- تأكد من إضافة `FRONTEND_URL` في API
- تأكد من أن `NEXT_PUBLIC_API_URL` في Frontend صحيح

### خطأ: "Prisma Client not generated"
- أضف `npx prisma generate` في Install Command

## 🎉 جاهز!

بعد اكتمال جميع الخطوات، سيكون لديك:
- ✅ Frontend يعمل على Vercel
- ✅ API يعمل على Vercel
- ✅ قاعدة بيانات PostgreSQL على Neon
- ✅ جميع Migrations تم تشغيلها

**ابدأ الآن:** https://vercel.com/new?teamSlug=fawzis-projects-fea58d03

