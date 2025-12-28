#!/bin/bash

# 📤 سكريبت رفع المشروع على GitHub
# استبدل YOUR_USERNAME باسم المستخدم الخاص بك على GitHub

echo "🚀 بدء رفع المشروع على GitHub..."
echo ""

# اسم المستخدم على GitHub (استبدله!)
GITHUB_USERNAME="YOUR_USERNAME"

# اسم المستودع
REPO_NAME="zad-alhidaya-platform"

echo "📋 الخطوات:"
echo "1. تأكد من إنشاء المستودع على GitHub: https://github.com/new"
echo "2. اسم المستودع: $REPO_NAME"
echo "3. استبدل YOUR_USERNAME في هذا السكريبت باسم المستخدم الخاص بك"
echo ""

# التحقق من وجود remote
if git remote | grep -q "origin"; then
    echo "⚠️ Remote 'origin' موجود بالفعل"
    echo "تحديث URL..."
    git remote set-url origin "https://github.com/$GITHUB_USERNAME/$REPO_NAME.git"
else
    echo "➕ إضافة remote..."
    git remote add origin "https://github.com/$GITHUB_USERNAME/$REPO_NAME.git"
fi

echo ""
echo "📤 رفع المشروع..."
git push -u origin main

echo ""
echo "✅ تم! تحقق من: https://github.com/$GITHUB_USERNAME/$REPO_NAME"

