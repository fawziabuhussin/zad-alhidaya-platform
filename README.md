# زاد الهداية | Zad Al-Hidaya Academy Platform

منصة أكاديمية إلكترونية متكاملة لإدارة الدورات التعليمية الشرعية.

## 🏗️ البنية التقنية

- **Frontend**: Next.js 14 (App Router) + TypeScript + Tailwind CSS
- **Backend**: Express.js + TypeScript + Prisma ORM
- **Database**: PostgreSQL
- **Authentication**: JWT with refresh tokens
- **Authorization**: Role-based access control (Admin, Teacher, Student)

## 📁 هيكل المشروع

```
zad-alhidaya-platform/
├── apps/
│   ├── web/          # Next.js frontend
│   └── api/          # Express API backend
├── packages/
│   └── shared/       # Shared types and utilities
└── package.json      # Root package.json
```

## 🚀 البدء السريع

### المتطلبات

- Node.js 18+
- PostgreSQL 14+
- pnpm (أو npm/yarn)

### التثبيت

```bash
# تثبيت الحزم
pnpm install

# إعداد قاعدة البيانات
pnpm db:generate
pnpm db:migrate
pnpm db:seed

# تشغيل المشروع (في وضع التطوير)
pnpm dev
```

### متغيرات البيئة

أنشئ ملف `.env` في `apps/api/`:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/zad_alhidaya"
JWT_SECRET="your-super-secret-jwt-key-change-in-production"
JWT_REFRESH_SECRET="your-super-secret-refresh-key-change-in-production"
NODE_ENV="development"
PORT=3001
```

أنشئ ملف `.env.local` في `apps/web/`:

```env
NEXT_PUBLIC_API_URL="http://localhost:3001"
```

## 👥 الحسابات الافتراضية

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

## 📦 النشر

### Frontend (Vercel)

```bash
cd apps/web
vercel deploy
```

### Backend (Render/Railway/Fly.io)

1. اربط مستودع GitHub
2. حدد `apps/api` كمجلد الجذر
3. أضف متغيرات البيئة
4. استخدم `pnpm install && pnpm build && pnpm start`

### Database (Supabase/Neon)

1. أنشئ قاعدة بيانات PostgreSQL
2. انسخ `DATABASE_URL` إلى متغيرات البيئة
3. شغّل `pnpm db:migrate` في الإنتاج

## 📚 الوثائق

- [API Documentation](./apps/api/README.md)
- [Frontend Guide](./apps/web/README.md)

## 🛠️ التطوير

```bash
# تشغيل جميع الخدمات
pnpm dev

# تشغيل API فقط
cd apps/api && pnpm dev

# تشغيل Frontend فقط
cd apps/web && pnpm dev

# فتح Prisma Studio
pnpm db:studio
```

## 📝 الرخصة

MIT

