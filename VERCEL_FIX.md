# 🔧 إصلاح خطأ Prisma Client على Vercel

## المشكلة:
```
Error: @prisma/client did not initialize yet. Please run "prisma generate"
```

## الحل:

### 1. تم إضافة `postinstall` script في `apps/api/package.json`

الآن `prisma generate` سيتم تشغيله تلقائياً بعد `npm install`.

### 2. في Vercel Dashboard:

اذهب إلى مشروع API → **Settings** → **Build & Development Settings**

#### Build Command:
```
cd ../.. && npm install && cd apps/api && npm install && npx prisma generate && npm run build
```

أو الأبسط:
```
npm run build
```
(لأن `postinstall` سيعمل تلقائياً الآن)

#### Install Command:
```
cd ../.. && npm install && cd apps/api && npm install
```

### 3. Redeploy:

بعد تحديث الإعدادات:
1. اذهب إلى **Deployments**
2. اضغط على **⋮** بجانب آخر deployment
3. اختر **Redeploy**

أو:
- ادفع تغيير جديد إلى GitHub (تم إضافة `postinstall` script)
- Vercel سيعيد النشر تلقائياً

---

## ✅ التحقق:

بعد Redeploy، تحقق من:
- `https://your-api.vercel.app/api/health` يجب أن يعمل بدون أخطاء

---

## 📝 ملاحظة:

إذا استمرت المشكلة، تأكد من:
1. **Root Directory** = `apps/api`
2. **Build Command** يحتوي على `prisma generate`
3. **Prisma schema** موجود في `apps/api/prisma/schema.prisma`

