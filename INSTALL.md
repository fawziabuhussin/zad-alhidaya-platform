# 📦 دليل التثبيت الكامل | Complete Installation Guide

## الخطوة 1: إنشاء ملفات البيئة | Step 1: Create Environment Files

### في `apps/api/.env`:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/zad_alhidaya?schema=public"
JWT_SECRET="zad-alhidaya-super-secret-jwt-key-change-in-production-min-32-chars-12345"
JWT_REFRESH_SECRET="zad-alhidaya-super-secret-refresh-key-change-in-production-min-32-chars-12345"
NODE_ENV="development"
PORT=3001
CORS_ORIGIN="http://localhost:3000"
```

### في `apps/web/.env.local`:

```env
NEXT_PUBLIC_API_URL="http://localhost:3001"
```

## الخطوة 2: إعداد قاعدة البيانات | Step 2: Database Setup

### إنشاء قاعدة البيانات:

```bash
# إذا كان PostgreSQL مثبت محلياً
createdb zad_alhidaya

# أو عبر psql
psql -U postgres
CREATE DATABASE zad_alhidaya;
\q
```

### تشغيل Migrations:

```bash
cd apps/api
npx prisma migrate dev --name init
```

### Seed البيانات:

```bash
cd apps/api
npx prisma db seed
# أو
npx tsx prisma/seed.ts
```

## الخطوة 3: تشغيل المشروع | Step 3: Run Project

### تشغيل API:

```bash
cd apps/api
npm run dev
```

### تشغيل Frontend (في terminal آخر):

```bash
cd apps/web
npm run dev
```

## الحسابات الافتراضية | Default Accounts

بعد seed البيانات:

- **Admin**: `admin@zad-alhidaya.com` / `admin123`
- **Teacher**: `teacher@zad-alhidaya.com` / `teacher123`
- **Student**: `student@zad-alhidaya.com` / `student123`

## الوصول | Access

- Frontend: http://localhost:3000
- API: http://localhost:3001
- Prisma Studio: `cd apps/api && npx prisma studio`

## استكشاف الأخطاء | Troubleshooting

### خطأ في DATABASE_URL:
- تأكد من أن PostgreSQL يعمل
- تحقق من اسم المستخدم وكلمة المرور
- تأكد من وجود قاعدة البيانات `zad_alhidaya`

### خطأ في Port:
- تأكد من أن Port 3001 و 3000 غير مستخدمين
- غيّر PORT في `.env` إذا لزم الأمر

### خطأ في Prisma:
```bash
cd apps/api
npx prisma generate
npx prisma migrate reset  # احذر: سيحذف جميع البيانات
```

