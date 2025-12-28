# ⚡ نشر سريع على Vercel

## 🚀 خطوات سريعة

### 1. إنشاء قاعدة بيانات PostgreSQL

**Neon (موصى به):**
1. اذهب إلى [neon.tech](https://neon.tech)
2. سجل حساب جديد
3. أنشئ مشروع جديد
4. انسخ `DATABASE_URL`

### 2. تحديث Prisma Schema

عدّل `apps/api/prisma/schema.prisma`:

```prisma
datasource db {
  provider = "postgresql"  // تغيير من sqlite
  url      = env("DATABASE_URL")
}
```

ثم شغّل:
```bash
cd apps/api
npx prisma db push
npx prisma generate
```

### 3. رفع المشروع على GitHub

```bash
git init
git add .
git commit -m "Ready for Vercel deployment"
git remote add origin YOUR_GITHUB_REPO
git push -u origin main
```

### 4. نشر Backend API

1. اذهب إلى: https://vercel.com/new?teamSlug=fawzis-projects-fea58d03
2. **Import Git Repository** → اختر المستودع
3. الإعدادات:
   - **Root Directory**: `apps/api`
   - **Framework**: Other
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `cd ../.. && npm install && cd apps/api && npm install && npx prisma generate`
4. **Environment Variables**:
   ```
   DATABASE_URL=postgresql://...
   JWT_SECRET=your-secret-key-32-chars-min
   JWT_REFRESH_SECRET=your-refresh-secret-32-chars-min
   FRONTEND_URL=https://your-frontend.vercel.app
   NODE_ENV=production
   ```
5. **Deploy** ✅

**انسخ API URL** (مثل: `https://zad-alhidaya-api.vercel.app`)

### 5. نشر Frontend

1. نفس الرابط: https://vercel.com/new?teamSlug=fawzis-projects-fea58d03
2. **Import Git Repository** → نفس المستودع
3. الإعدادات:
   - **Root Directory**: `apps/web`
   - **Framework**: Next.js (تلقائي)
   - **Install Command**: `cd ../.. && npm install && cd apps/web && npm install`
4. **Environment Variables**:
   ```
   NEXT_PUBLIC_API_URL=https://zad-alhidaya-api.vercel.app
   NEXT_PUBLIC_FRONTEND_URL=https://zad-alhidaya-web.vercel.app
   ```
5. **Deploy** ✅

### 6. تشغيل Migrations

بعد نشر API:

```bash
cd apps/api
vercel env pull .env.local
npx prisma migrate deploy
```

أو من Vercel Dashboard → API Project → Settings → Deploy Hooks

## ✅ جاهز!

- Frontend: `https://your-frontend.vercel.app`
- API: `https://your-api.vercel.app`

**Admin Login:**
- Email: `admin@zad-alhidaya.com`
- Password: `admin123`

⚠️ **غير كلمة مرور Admin بعد النشر!**

