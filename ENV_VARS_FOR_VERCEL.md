# 🔐 Environment Variables for Vercel

## 🗂️ Quick Import from `env-templates/`

Use the ready-to-import templates in `env-templates/`:
- `api.env.template` → for `zad-alhidaya-platform-api` project
- `web.env.template` → for `zad-alhidaya-web` project

Copy the values from these files and add them in Vercel Dashboard → Settings → Environment Variables, then redeploy.

## 📋 قائمة Environment Variables المطلوبة

### 1. DATABASE_URL (مطلوب - من Neon)
```
DATABASE_URL=postgresql://username:password@ep-xxx-xxx.us-east-1.aws.neon.tech/neondb?sslmode=require
```
**كيف تحصل عليه:**
1. اذهب إلى Neon Dashboard: https://console.neon.tech
2. اختر مشروعك `database_zad`
3. اضغط على **"Connection String"** أو **"Connection Details"**
4. انسخ الـ Connection String

---

### 2. JWT_SECRET (مطلوب)
```
JWT_SECRET=a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6
```
**ملاحظة:** استخدم مفتاح عشوائي قوي (32 حرف على الأقل)

**لإنشاء مفتاح عشوائي:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

### 3. JWT_REFRESH_SECRET (مطلوب)
```
JWT_REFRESH_SECRET=z9y8x7w6v5u4t3s2r1q0p9o8n7m6l5k4j3i2h1g0f9e8d7c6b5a4
```
**ملاحظة:** استخدم مفتاح مختلف عن JWT_SECRET (32 حرف على الأقل)

---

### 4. FRONTEND_URL (مطلوب)
```
FRONTEND_URL=https://zad-alhidaya-web.vercel.app
```
**ملاحظة:** يجب أن يكون URL الفعلي للـ Frontend على Vercel

---

### 5. NODE_ENV (مطلوب)
```
NODE_ENV=production
```

---

### 6. GOOGLE_CLIENT_ID (اختياري - إذا كنت تستخدم Google OAuth)
```
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
```

---

## 📝 كيفية إضافتها في Vercel

### الخطوة 1: اذهب إلى Vercel Dashboard
1. افتح: https://vercel.com/dashboard
2. اختر مشروع: `zad-alhidaya-platform-api`

### الخطوة 2: أضف Environment Variables
1. اضغط **Settings** (من القائمة الجانبية)
2. اضغط **Environment Variables** (من القائمة الفرعية)
3. اضغط **Add New** (أو **Add**)

### الخطوة 3: أضف كل متغير
لكل متغير:
- **Key**: اسم المتغير (مثل `DATABASE_URL`)
- **Value**: القيمة (مثل connection string من Neon)
- **Environment**: اختر **Production**, **Preview**, **Development** (أو Production فقط)

### الخطوة 4: احفظ
- اضغط **Save** بعد كل متغير
- أو اضغط **Add** لإضافة متغير آخر

### الخطوة 5: إعادة النشر
بعد إضافة جميع المتغيرات:
1. اذهب إلى **Deployments**
2. اضغط على **...** بجانب آخر deployment
3. اختر **Redeploy**

---

## ✅ التحقق

بعد إضافة المتغيرات وإعادة النشر:
1. انتظر 2-3 دقائق
2. افتح: `https://zad-alhidaya-platform-api.vercel.app/api/health`
3. يجب أن ترى: `{"status":"ok","timestamp":"..."}`

---

## 🐛 استكشاف الأخطاء

### خطأ: "Cannot connect to database"
- ✅ تحقق من `DATABASE_URL` من Neon
- ✅ تأكد من أن Connection String صحيح
- ✅ تأكد من إضافة `?sslmode=require` في النهاية

### خطأ: "JWT_SECRET is not defined"
- ✅ تأكد من إضافة `JWT_SECRET` و `JWT_REFRESH_SECRET`
- ✅ تأكد من أن القيم طويلة بما فيه الكفاية (32+ حرف)

### خطأ: "CORS error"
- ✅ تأكد من إضافة `FRONTEND_URL`
- ✅ تأكد من أن URL صحيح (يبدأ بـ `https://`)

---

## 📌 ملاحظات مهمة

1. **لا تشارك Environment Variables** - هذه معلومات سرية
2. **استخدم قيم مختلفة** لكل بيئة (Production, Preview, Development)
3. **بعد التعديل** - يجب إعادة النشر (Redeploy)
4. **DATABASE_URL** - احصل عليه من Neon Dashboard → Connection String

---

## 🎯 Complete Example

See `env-templates/api.env.template` and `env-templates/web.env.template` for ready-to-use templates with actual values.

