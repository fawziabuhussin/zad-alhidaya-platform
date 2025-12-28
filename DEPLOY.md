# دليل النشر على Vercel

## متطلبات النشر

### 1. إعداد قاعدة البيانات

لنشر المشروع على Vercel، ستحتاج إلى قاعدة بيانات PostgreSQL (لأن SQLite لا يعمل على Vercel).

**خيارات قاعدة البيانات:**
- [Neon](https://neon.tech) - مجاني وممتاز
- [Supabase](https://supabase.com) - مجاني
- [Railway](https://railway.app) - مجاني
- [PlanetScale](https://planetscale.com) - مجاني

### 2. تحديث Prisma Schema

بعد إنشاء قاعدة بيانات PostgreSQL، قم بتحديث `apps/api/prisma/schema.prisma`:

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

### 3. Environment Variables

#### للـ Frontend (Next.js):
```
NEXT_PUBLIC_API_URL=https://your-api-url.vercel.app
NEXT_PUBLIC_FRONTEND_URL=https://your-app.vercel.app
```

#### للـ Backend (API):
```
DATABASE_URL=postgresql://user:password@host:5432/database
JWT_SECRET=your-super-secret-jwt-key-here
JWT_REFRESH_SECRET=your-super-secret-refresh-key-here
FRONTEND_URL=https://your-app.vercel.app
NODE_ENV=production
```

## خطوات النشر

### الطريقة 1: نشر Frontend و Backend منفصلين (موصى به)

#### 1. نشر Backend API

1. اذهب إلى [Vercel Dashboard](https://vercel.com/new?teamSlug=fawzis-projects-fea58d03)
2. اختر "Import Git Repository"
3. اختر المستودع الخاص بك
4. في إعدادات المشروع:
   - **Root Directory**: `apps/api`
   - **Framework Preset**: Other
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `cd ../.. && npm install && cd apps/api && npm install`
5. أضف Environment Variables (انظر أعلاه)
6. اضغط Deploy

#### 2. نشر Frontend

1. اذهب إلى [Vercel Dashboard](https://vercel.com/new?teamSlug=fawzis-projects-fea58d03)
2. اختر "Import Git Repository" مرة أخرى
3. اختر نفس المستودع
4. في إعدادات المشروع:
   - **Root Directory**: `apps/web`
   - **Framework Preset**: Next.js
   - **Build Command**: `npm run build` (افتراضي)
   - **Output Directory**: `.next` (افتراضي)
   - **Install Command**: `cd ../.. && npm install && cd apps/web && npm install`
5. أضف Environment Variables:
   - `NEXT_PUBLIC_API_URL`: URL الخاص بـ API الذي نشرته للتو
6. اضغط Deploy

### الطريقة 2: نشر كل شيء في مشروع واحد

1. اذهب إلى [Vercel Dashboard](https://vercel.com/new?teamSlug=fawzis-projects-fea58d03)
2. اختر "Import Git Repository"
3. اختر المستودع الخاص بك
4. في إعدادات المشروع:
   - **Root Directory**: `.` (الجذر)
   - **Framework Preset**: Other
   - **Build Command**: `cd apps/web && npm run build`
   - **Output Directory**: `apps/web/.next`
5. أضف جميع Environment Variables
6. اضغط Deploy

## بعد النشر

### 1. تشغيل Migrations

بعد نشر API، ستحتاج إلى تشغيل migrations:

```bash
cd apps/api
npx prisma migrate deploy
```

أو يمكنك إضافة script في `package.json`:

```json
"postdeploy": "prisma migrate deploy"
```

### 2. تشغيل Seed (اختياري)

```bash
cd apps/api
npx prisma db seed
```

## ملاحظات مهمة

1. **قاعدة البيانات**: تأكد من استخدام PostgreSQL وليس SQLite
2. **CORS**: تأكد من إضافة URL الخاص بـ Frontend في CORS settings في API
3. **Environment Variables**: لا تنس إضافة جميع المتغيرات المطلوبة
4. **Build Time**: قد يستغرق البناء وقتاً أطول في المرة الأولى

## استكشاف الأخطاء

### خطأ في البناء
- تأكد من أن جميع dependencies مثبتة
- تحقق من logs في Vercel Dashboard

### خطأ في الاتصال بقاعدة البيانات
- تحقق من `DATABASE_URL`
- تأكد من أن قاعدة البيانات تسمح بالاتصالات من Vercel IPs

### خطأ في API Calls
- تحقق من `NEXT_PUBLIC_API_URL`
- تأكد من أن CORS مضبوط بشكل صحيح

