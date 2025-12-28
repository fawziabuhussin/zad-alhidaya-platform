# 🚀 خطوات سريعة للنشر على Vercel

## ✅ تم: المشروع على GitHub
- Repository: `https://github.com/fawziabuhussin/zad-alhidaya-platform`

---

## الخطوة 1: نشر Backend API

### في Vercel Dashboard:
1. اذهب إلى: **https://vercel.com/new?teamSlug=fawzis-projects-fea58d03**
2. اضغط **"Import Git Repository"**
3. اختر: `fawziabuhussin/zad-alhidaya-platform`

### Project Settings:
```
Project Name: zad-alhidaya-api
Root Directory: apps/api
Framework Preset: Other
Build Command: npm run build
Output Directory: dist
Install Command: cd ../.. && npm install && cd apps/api && npm install && npx prisma generate
```

### Environment Variables (انسخ والصق):
```
DATABASE_URL=postgresql://neondb_owner:npg_QOBhvZTRWS48@ep-plain-resonance-adm6lz8k-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require

JWT_SECRET=zad-alhidaya-super-secret-jwt-key-2024-production-minimum-32-characters-long

JWT_REFRESH_SECRET=zad-alhidaya-super-secret-refresh-key-2024-production-minimum-32-characters-long

FRONTEND_URL=https://zad-alhidaya-web.vercel.app

NODE_ENV=production
```

4. اضغط **"Deploy"**
5. انتظر 2-3 دقائق
6. **انسخ API URL:** `https://zad-alhidaya-api.vercel.app` (أو ما يعطيك Vercel)

---

## الخطوة 2: نشر Frontend

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
(استبدل URLs بالـ URLs الفعلية من الخطوة 1)

3. اضغط **"Deploy"**
4. انتظر 2-3 دقائق
5. **انسخ Frontend URL**

---

## الخطوة 3: تحديث FRONTEND_URL في API

1. Vercel Dashboard → `zad-alhidaya-api` → Settings → Environment Variables
2. عدّل `FRONTEND_URL` إلى URL الفعلي للـ Frontend
3. **Redeploy** (أو انتظر حتى يعيد النشر تلقائياً)

---

## الخطوة 4: تشغيل Migrations

### من Terminal:
```bash
npm i -g vercel
vercel login
cd /Users/fawziabuhussin/Downloads/zad-alhidaya-platform/apps/api
vercel link
vercel env pull .env.local
npx prisma migrate deploy
```

---

## الخطوة 5: تشغيل Seed

```bash
cd /Users/fawziabuhussin/Downloads/zad-alhidaya-platform/apps/api
vercel env pull .env.local
npx prisma db seed
```

---

## ✅ التحقق

- Frontend: `https://zad-alhidaya-web.vercel.app`
- API Health: `https://zad-alhidaya-api.vercel.app/api/health`
- Login: `admin@zad-alhidaya.com` / `admin123`

---

## 📝 ملاحظات مهمة:

1. **Root Directory مهم جداً!** تأكد من تعيينه بشكل صحيح:
   - API: `apps/api`
   - Web: `apps/web`

2. **Environment Variables:** تأكد من إضافتها في Settings → Environment Variables

3. **Build Commands:** قد تحتاج إلى تعديلها حسب احتياجاتك

4. **Migrations:** يجب تشغيلها بعد النشر الأول

---

**ابدأ الآن:** https://vercel.com/new?teamSlug=fawzis-projects-fea58d03

