# 🔐 Environment Variables للنشر على Vercel

## للـ Backend API Project:

```
DATABASE_URL=postgresql://neondb_owner:npg_QOBhvZTRWS48@ep-plain-resonance-adm6lz8k-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require
JWT_SECRET=zad-alhidaya-super-secret-jwt-key-2024-production-min-32-chars
JWT_REFRESH_SECRET=zad-alhidaya-super-secret-refresh-key-2024-production-min-32-chars
FRONTEND_URL=https://zad-alhidaya-web.vercel.app
NODE_ENV=production
```

## للـ Frontend Project:

```
NEXT_PUBLIC_API_URL=https://zad-alhidaya-api.vercel.app
NEXT_PUBLIC_FRONTEND_URL=https://zad-alhidaya-web.vercel.app
```

⚠️ **ملاحظة:** بعد نشر Frontend، عدّل `FRONTEND_URL` في API Project إلى URL الفعلي.

