# 🚀 إعداد المشروع | Project Setup

## المتطلبات | Requirements

- Node.js 18+
- PostgreSQL 14+
- pnpm (أو npm/yarn)

## خطوات الإعداد | Setup Steps

### 1. تثبيت الحزم | Install Dependencies

```bash
pnpm install
```

### 2. إعداد قاعدة البيانات | Database Setup

أنشئ قاعدة بيانات PostgreSQL:

```sql
CREATE DATABASE zad_alhidaya;
```

### 3. إعداد متغيرات البيئة | Environment Variables

**في `apps/api/.env`:**

```env
DATABASE_URL="postgresql://user:password@localhost:5432/zad_alhidaya?schema=public"
JWT_SECRET="your-super-secret-jwt-key-change-in-production-min-32-chars"
JWT_REFRESH_SECRET="your-super-secret-refresh-key-change-in-production-min-32-chars"
NODE_ENV="development"
PORT=3001
CORS_ORIGIN="http://localhost:3000"
```

**في `apps/web/.env.local`:**

```env
NEXT_PUBLIC_API_URL="http://localhost:3001"
```

### 4. إعداد Prisma | Prisma Setup

```bash
# Generate Prisma Client
pnpm db:generate

# Run migrations
pnpm db:migrate

# Seed database
pnpm db:seed
```

### 5. تشغيل المشروع | Run Project

```bash
# تشغيل جميع الخدمات
pnpm dev

# أو بشكل منفصل:

# API فقط (port 3001)
cd apps/api && pnpm dev

# Frontend فقط (port 3000)
cd apps/web && pnpm dev
```

## الحسابات الافتراضية | Default Accounts

بعد تشغيل `pnpm db:seed`:

**Admin:**
- Email: `admin@zad-alhidaya.com`
- Password: `admin123`

**Teacher:**
- Email: `teacher@zad-alhidaya.com`
- Password: `teacher123`

**Student:**
- Email: `student@zad-alhidaya.com`
- Password: `student123`

## البنية | Structure

```
zad-alhidaya-platform/
├── apps/
│   ├── api/          # Express API
│   └── web/          # Next.js Frontend
├── packages/
│   └── shared/       # Shared types
└── package.json
```

## النشر | Deployment

### Frontend (Vercel)

```bash
cd apps/web
vercel deploy
```

### Backend (Render/Railway)

1. اربط GitHub repo
2. حدد `apps/api` كمجلد الجذر
3. أضف متغيرات البيئة
4. Build command: `pnpm install && pnpm build`
5. Start command: `pnpm start`

### Database (Supabase/Neon)

1. أنشئ PostgreSQL database
2. انسخ `DATABASE_URL`
3. شغّل migrations في الإنتاج

## ملاحظات | Notes

- جميع البيانات محفوظة في PostgreSQL
- JWT tokens مع refresh token rotation
- RBAC كامل (Admin, Teacher, Student)
- دعم RTL كامل للعربية

