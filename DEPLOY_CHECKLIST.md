# ✅ قائمة التحقق من النشر على Vercel

## قبل البدء

- [ ] المشروع موجود على GitHub
- [ ] لديك حساب Vercel متصل
- [ ] لديك قاعدة بيانات PostgreSQL (Neon/Supabase)

## الخطوة 1: إنشاء قاعدة بيانات PostgreSQL

### Neon (موصى به - مجاني):
1. [neon.tech](https://neon.tech) → Sign up with GitHub
2. Create Project → `zad-alhidaya`
3. Copy `DATABASE_URL`

### Supabase (بديل):
1. [supabase.com](https://supabase.com) → Sign up
2. New Project → `zad-alhidaya`
3. Settings → Database → Copy Connection String

## الخطوة 2: نشر Backend API

### في Vercel Dashboard:
1. [New Project](https://vercel.com/new?teamSlug=fawzis-projects-fea58d03)
2. Import Git Repository → اختر المستودع
3. **Project Settings:**
   ```
   Project Name: zad-alhidaya-api
   Root Directory: apps/api
   Framework: Other
   Build Command: npm run build
   Output Directory: dist
   Install Command: cd ../.. && npm install && cd apps/api && npm install && npx prisma generate
   ```
4. **Environment Variables:**
   ```
   DATABASE_URL=postgresql://... (من Neon)
   JWT_SECRET=your-32-character-secret-key-here
   JWT_REFRESH_SECRET=your-32-character-refresh-secret-here
   FRONTEND_URL=https://zad-alhidaya-web.vercel.app (سنحدثه لاحقاً)
   NODE_ENV=production
   ```
5. Deploy → انتظر 2-3 دقائق
6. **انسخ API URL:** `https://zad-alhidaya-api.vercel.app`

## الخطوة 3: نشر Frontend

### في Vercel Dashboard:
1. [New Project](https://vercel.com/new?teamSlug=fawzis-projects-fea58d03) مرة أخرى
2. Import Git Repository → نفس المستودع
3. **Project Settings:**
   ```
   Project Name: zad-alhidaya-web
   Root Directory: apps/web
   Framework: Next.js (تلقائي)
   Install Command: cd ../.. && npm install && cd apps/web && npm install
   ```
4. **Environment Variables:**
   ```
   NEXT_PUBLIC_API_URL=https://zad-alhidaya-api.vercel.app
   NEXT_PUBLIC_FRONTEND_URL=https://zad-alhidaya-web.vercel.app
   ```
5. Deploy → انتظر 2-3 دقائق
6. **انسخ Frontend URL:** `https://zad-alhidaya-web.vercel.app`

## الخطوة 4: تحديث Environment Variables

### في API Project:
1. Settings → Environment Variables
2. عدّل `FRONTEND_URL` إلى URL الفعلي للـ Frontend
3. Redeploy

## الخطوة 5: تشغيل Migrations

### من Vercel CLI:
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
2. Create Hook → Post-Deploy
3. Command: `cd apps/api && npx prisma migrate deploy`

## الخطوة 6: تشغيل Seed (اختياري)

```bash
cd apps/api
vercel env pull .env.local
npx prisma db seed
```

## ✅ التحقق

- [ ] Frontend يعمل: `https://your-frontend.vercel.app`
- [ ] API Health: `https://your-api.vercel.app/api/health`
- [ ] يمكن تسجيل الدخول كـ Admin
- [ ] قاعدة البيانات متصلة

## 🔑 حسابات الافتراضية

- Admin: `admin@zad-alhidaya.com` / `admin123`
- Teacher: `teacher@zad-alhidaya.com` / `teacher123`
- Student: `student@zad-alhidaya.com` / `student123`

⚠️ **غير كلمة مرور Admin بعد النشر!**

