# 📤 أوامر رفع المشروع على GitHub

## ✅ تم تنفيذ:
- ✅ `git add -A` - إضافة جميع الملفات
- ✅ `git commit` - حفظ التغييرات
- ✅ `git branch -M main` - تعيين branch إلى main

## 📋 الخطوات التالية:

### 1️⃣ أنشئ مستودع على GitHub:

1. اذهب إلى: **https://github.com/new**
2. **Repository name**: `zad-alhidaya-platform`
3. اختر **Public** أو **Private**
4. **لا** تضع علامة على "Initialize with README"
5. اضغط **"Create repository"**

### 2️⃣ شغّل هذه الأوامر (استبدل YOUR_USERNAME):

```bash
cd /Users/fawziabuhussin/Downloads/zad-alhidaya-platform

# إضافة remote (استبدل YOUR_USERNAME)
git remote add origin https://github.com/YOUR_USERNAME/zad-alhidaya-platform.git

# رفع المشروع
git push -u origin main
```

**أو إذا كان المستودع موجوداً بالفعل:**
```bash
git remote set-url origin https://github.com/YOUR_USERNAME/zad-alhidaya-platform.git
git push -u origin main
```

### 3️⃣ بعد الرفع على GitHub:

اذهب إلى Vercel: **https://vercel.com/new?teamSlug=fawzis-projects-fea58d03**

---

## 🔍 للتحقق من Remote:

```bash
git remote -v
```

## 🔍 للتحقق من Status:

```bash
git status
```

