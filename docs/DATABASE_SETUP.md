# 🗄️ إعداد قاعدة البيانات | Database Setup

## المشكلة | Issue

PostgreSQL غير مثبت أو غير قيد التشغيل.

## الحلول | Solutions

### الحل 1: تثبيت PostgreSQL محلياً

**macOS:**
```bash
brew install postgresql@14
brew services start postgresql@14
createdb zad_alhidaya
```

**Linux (Ubuntu/Debian):**
```bash
sudo apt-get update
sudo apt-get install postgresql postgresql-contrib
sudo systemctl start postgresql
sudo -u postgres createdb zad_alhidaya
```

**Windows:**
- حمّل من: https://www.postgresql.org/download/windows/
- أو استخدم Chocolatey: `choco install postgresql`

### الحل 2: استخدام Supabase (مجاني)

1. اذهب إلى https://supabase.com
2. أنشئ حساب مجاني
3. أنشئ مشروع جديد
4. انسخ `Connection String` من Settings > Database
5. ضعه في `apps/api/.env` كـ `DATABASE_URL`

### الحل 3: استخدام Neon (مجاني)

1. اذهب إلى https://neon.tech
2. أنشئ حساب مجاني
3. أنشئ مشروع جديد
4. انسخ `Connection String`
5. ضعه في `apps/api/.env` كـ `DATABASE_URL`

### الحل 4: استخدام Railway (مجاني)

1. اذهب إلى https://railway.app
2. أنشئ حساب مجاني
3. أنشئ PostgreSQL database
4. انسخ `DATABASE_URL`
5. ضعه في `apps/api/.env`

## بعد إعداد قاعدة البيانات | After Database Setup

```bash
cd apps/api

# Generate Prisma Client
npx prisma generate

# Run migrations
npx prisma migrate dev --name init

# Seed data
npm run db:seed
```

## التحقق | Verify

```bash
# Test connection
cd apps/api
npx prisma db pull

# Open Prisma Studio
npx prisma studio
```

## ملاحظة | Note

إذا كنت تريد استخدام SQLite للتطوير (أبسط لكن أقل قوة):

1. غيّر في `apps/api/prisma/schema.prisma`:
```prisma
datasource db {
  provider = "sqlite"
  url      = "file:./dev.db"
}
```

2. ثم شغّل:
```bash
npx prisma migrate dev --name init
```




