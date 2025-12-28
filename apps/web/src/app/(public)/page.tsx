'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import api from '@/lib/api';

export default function Home() {
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    // Check if user is logged in but don't redirect
    const token = localStorage.getItem('accessToken');
    if (token) {
      api.get('/auth/me')
        .then(res => {
          setUser(res.data);
          // Store user in localStorage to prevent logout
          localStorage.setItem('user', JSON.stringify(res.data));
        })
        .catch(() => {
          // If API fails, try to get from localStorage
          const userStr = localStorage.getItem('user');
          if (userStr) {
            setUser(JSON.parse(userStr));
          }
        });
    } else {
      // Try to get from localStorage
      const userStr = localStorage.getItem('user');
      if (userStr) {
        setUser(JSON.parse(userStr));
      }
    }
  }, []);
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">

      {/* Hero Section */}
      <section className="relative bg-gradient-to-r from-primary to-primary-dark text-white py-12 md:py-20 -mt-20 pt-32 md:pt-40 overflow-hidden">
        {/* Background Image */}
        <div className="absolute inset-0 opacity-20">
          <img 
            src="/photos/برنامج.jpg" 
            alt="Banner" 
            className="w-full h-full object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="mb-6">
            <img 
              src="/photos/logo.jpg" 
              alt="زاد الهداية" 
              className="h-24 md:h-32 w-auto mx-auto object-contain"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
          </div>
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 md:mb-6">معهد زاد الهداية للعلوم الشرعية</h1>
          <p className="text-lg md:text-xl mb-6 md:mb-8 max-w-2xl mx-auto">
            منصة تعليمية إلكترونية متكاملة تهدف إلى تسهيل طلب العلم الشرعي للجميع
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            {user ? (
              <>
                {user.role === 'ADMIN' ? (
                  <Link href="/admin" className="px-8 py-4 bg-white text-primary rounded-lg font-bold text-lg hover:bg-gray-100 transition btn-large">
                    لوحة التحكم
                  </Link>
                ) : user.role === 'TEACHER' ? (
                  <Link href="/teacher" className="px-8 py-4 bg-white text-primary rounded-lg font-bold text-lg hover:bg-gray-100 transition btn-large">
                    لوحة التحكم
                  </Link>
                ) : (
                  <Link href="/dashboard" className="px-8 py-4 bg-white text-primary rounded-lg font-bold text-lg hover:bg-gray-100 transition btn-large">
                    لوحة التحكم
                  </Link>
                )}
                <Link href="/courses" className="px-8 py-4 border-2 border-white text-white rounded-lg font-bold text-lg hover:bg-white/10 transition btn-large">
                  استكشف الدورات
                </Link>
              </>
            ) : (
              <>
                <Link href="/register" className="px-8 py-4 bg-white text-primary rounded-lg font-bold text-lg hover:bg-gray-100 transition btn-large">
                  انضم إلينا الآن
                </Link>
                <Link href="/courses" className="px-8 py-4 border-2 border-white text-white rounded-lg font-bold text-lg hover:bg-white/10 transition btn-large">
                  استكشف الدورات
                </Link>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-12 md:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-8 md:mb-12 text-gray-800">مميزات المنصة</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 md:gap-8">
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-xl font-bold mb-3 text-gray-800">دورات متكاملة</h3>
              <p className="text-gray-700">دورات شاملة في مختلف العلوم الشرعية</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-xl font-bold mb-3 text-gray-800">جلسات مباشرة</h3>
              <p className="text-gray-700">جلسات حية مع المدرسين</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-xl font-bold mb-3 text-gray-800">تتبع التقدم</h3>
              <p className="text-gray-700">تابع تقدمك في كل دورة</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

