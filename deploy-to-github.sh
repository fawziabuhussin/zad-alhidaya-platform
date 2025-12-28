#!/bin/bash

# Script to push project to GitHub

cd /Users/fawziabuhussin/Downloads/zad-alhidaya-platform

echo "🚀 رفع المشروع على GitHub..."

# Check if git is initialized
if [ ! -d ".git" ]; then
    echo "📦 تهيئة Git repository..."
    git init
fi

# Add all files
echo "➕ إضافة الملفات..."
git add -A

# Commit
echo "💾 حفظ التغييرات..."
git commit -m "Ready for Vercel deployment - Complete academy platform with PostgreSQL support" || echo "No changes to commit"

# Check if remote exists
if ! git remote get-url origin &>/dev/null; then
    echo "⚠️  لا يوجد remote configured"
    echo "📝 يرجى إضافة remote يدوياً:"
    echo "   git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git"
    echo "   ثم شغّل: git push -u origin main"
else
    echo "📤 رفع المشروع..."
    git branch -M main
    git push -u origin main || git push origin main || echo "⚠️  يرجى التحقق من remote URL"
fi

echo "✅ تم!"

