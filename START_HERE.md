# 🚀 ابدأ من هنا - نشر على Vercel

## ✅ المشروع جاهز تماماً!

تم إعداد كل شيء للنشر. اتبع هذه الخطوات:

## 📋 الخطوات السريعة (10 دقائق)

### 1️⃣ إنشاء قاعدة بيانات PostgreSQL (2 دقيقة)

**Neon (أسهل):**
1. اذهب إلى: https://neon.tech
2. سجل دخول بـ GitHub
3. اضغط **"Create Project"**
4. اسم المشروع: `zad-alhidaya`
5. اضغط **"Create Project"**
6. **انسخ `DATABASE_URL`** (مهم جداً!)

### 2️⃣ رفع المشروع على GitHub (1 دقيقة)

**الطريقة 1: من Terminal**
```bash
cd /Users/fawziabuhussin/Downloads/zad-alhidaya-platform
./deploy-to-github.sh
```

**الطريقة 2: يدوياً**
```bash
cd /Users/fawziabuhussin/Downloads/zad-alhidaya-platform
git init
git add .
git commit -m "Ready for Vercel"
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
git push -u origin main
```

**الطريقة 3: من VS Code**
- اضغط Ctrl+Shift+G (أو Cmd+Shift+G على Mac)
- اضغط "Initialize Repository"
- Commit جميع الملفات
- Push إلى GitHub

### 3️⃣ نشر Backend API (3 دقائق)

1. **اذهب إلى:** https://vercel.com/new?teamSlug=fawzis-projects-fea58d03
2. اضغط **"Import Git Repository"**
3. اختر المستودع الخاص بك
4. **الإعدادات:**
   - **Project Name**: `zad-alhidaya-api`
   - **Root Directory**: `apps/api` ⚠️ **مهم جداً!**
   - **Framework Preset**: **Other**
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `cd ../.. && npm install && cd apps/api && npm install && npx prisma generate`
5. **Environment Variables:**
   ```
   DATABASE_URL=postgresql://... (من Neon)
   JWT_SECRET=your-32-character-secret-key-minimum
   JWT_REFRESH_SECRET=your-32-character-refresh-secret-minimum
   FRONTEND_URL=https://zad-alhidaya-web.vercel.app
   NODE_ENV=production
   ```
6. اضغط **"Deploy"**
7. **انتظر 2-3 دقائق**
8. **انسخ API URL** (مثل: `https://zad-alhidaya-api.vercel.app`)

### 4️⃣ نشر Frontend (2 دقيقة)

1. **نفس الرابط:** https://vercel.com/new?teamSlug=fawzis-projects-fea58d03
2. اضغط **"Import Git Repository"** مرة أخرى
3. اختر **نفس المستودع**
4. **الإعدادات:**
   - **Project Name**: `zad-alhidaya-web`
   - **Root Directory**: `apps/web` ⚠️ **مهم جداً!**
   - **Framework Preset**: **Next.js** (تلقائي)
   - **Install Command**: `cd ../.. && npm install && cd apps/web && npm install`
5. **Environment Variables:**
   ```
   NEXT_PUBLIC_API_URL=https://zad-alhidaya-api.vercel.app
   NEXT_PUBLIC_FRONTEND_URL=https://zad-alhidaya-web.vercel.app
   ```
   (استبدل URLs بالـ URLs الفعلية من الخطوة 3)
6. اضغط **"Deploy"**
7. **انتظر 2-3 دقائق**
8. **انسخ Frontend URL**

### 5️⃣ تحديث Environment Variables

**في API Project:**
1. Vercel Dashboard → `zad-alhidaya-api` → Settings → Environment Variables
2. عدّل `FRONTEND_URL` إلى URL الفعلي للـ Frontend
3. Redeploy

### 6️⃣ تشغيل Migrations (1 دقيقة)

**من Terminal:**
```bash
npm i -g vercel
vercel login
cd apps/api
vercel link
vercel env pull .env.local
npx prisma migrate deploy
```

**أو من Vercel Dashboard:**
- API Project → Settings → Deploy Hooks
- Create Post-Deploy Hook
- Command: `cd apps/api && npx prisma migrate deploy`

### 7️⃣ تشغيل Seed (اختياري)

```bash
cd apps/api
vercel env pull .env.local
npx prisma db seed
```

## ✅ جاهز!

- Frontend: `https://your-frontend.vercel.app`
- API: `https://your-api.vercel.app`

**Admin Login:**
- Email: `admin@zad-alhidaya.com`
- Password: `admin123`

⚠️ **غير كلمة مرور Admin بعد النشر!**

## 📚 ملفات المساعدة

- `DEPLOY_CHECKLIST.md` - قائمة تحقق تفصيلية
- `VERCEL_DEPLOY_NOW.md` - دليل تفصيلي
- `PUSH_TO_GITHUB.md` - كيفية رفع على GitHub

## 🆘 مساعدة

إذا واجهت أي مشكلة:
1. تحقق من logs في Vercel Dashboard
2. تأكد من Environment Variables
3. تحقق من `DEPLOY_CHECKLIST.md`

---

**ابدأ الآن:** https://vercel.com/new?teamSlug=fawzis-projects-fea58d03

