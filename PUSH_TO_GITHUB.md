# 📤 رفع المشروع على GitHub

## إذا لم يكن المشروع على GitHub بعد:

```bash
cd /Users/fawziabuhussin/Downloads/zad-alhidaya-platform

# تهيئة Git (إذا لم يكن موجوداً)
git init

# إضافة جميع الملفات
git add .

# Commit
git commit -m "Ready for Vercel deployment - Complete academy platform"

# إضافة Remote (استبدل YOUR_USERNAME و YOUR_REPO)
git remote add origin https://github.com/YOUR_USERNAME/zad-alhidaya-platform.git

# أو إذا كان المستودع موجوداً:
# git remote set-url origin https://github.com/YOUR_USERNAME/zad-alhidaya-platform.git

# رفع المشروع
git branch -M main
git push -u origin main
```

## إذا كان المشروع موجوداً على GitHub:

```bash
cd /Users/fawziabuhussin/Downloads/zad-alhidaya-platform

# إضافة التغييرات
git add .

# Commit
git commit -m "Update for Vercel deployment: PostgreSQL, Vercel configs"

# رفع التغييرات
git push origin main
```

## بعد الرفع على GitHub:

1. اذهب إلى: https://vercel.com/new?teamSlug=fawzis-projects-fea58d03
2. اختر "Import Git Repository"
3. اختر المستودع الخاص بك
4. اتبع التعليمات في `DEPLOY_CHECKLIST.md`

