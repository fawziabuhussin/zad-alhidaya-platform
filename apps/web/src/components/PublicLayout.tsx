'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';

interface PublicLayoutProps {
  children: React.ReactNode;
}

export default function PublicLayout({ children }: PublicLayoutProps) {
  const pathname = usePathname();
  const [user, setUser] = useState<any>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem('accessToken');
    if (token) {
      api.get('/auth/me')
        .then(res => {
          setUser(res.data);
          localStorage.setItem('user', JSON.stringify(res.data));
        })
        .catch(() => {
          const userStr = localStorage.getItem('user');
          if (userStr) {
            setUser(JSON.parse(userStr));
          }
        });
    } else {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        setUser(JSON.parse(userStr));
      }
    }
  }, []);

  const handleLogout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('user');
      setUser(null);
      window.location.href = '/';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header - Enterprise RTL Design */}
      <header className="bg-white shadow-sm sticky top-0 z-50 border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Right Side: Logo + Navigation (RTL) */}
            <div className="flex items-center gap-8">
              {/* Logo */}
              <Link href="/" className="flex items-center gap-3 shrink-0">
                <img 
                  src="/photos/logo.jpg" 
                  alt="زاد الهداية" 
                  className="h-10 w-auto object-contain"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
                <span className="hidden sm:block text-xl font-bold text-gray-900">زاد الهداية</span>
              </Link>

              {/* Desktop Navigation */}
              <nav className="hidden md:flex items-center gap-1">
                <Link
                  href="/"
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    pathname === '/'
                      ? 'bg-primary/10 text-primary'
                      : 'text-gray-700 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  الرئيسية
                </Link>
                <Link
                  href="/courses"
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    pathname === '/courses' || pathname.startsWith('/courses/')
                      ? 'bg-primary/10 text-primary'
                      : 'text-gray-700 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  الدورات
                </Link>
                {user && (
                  <>
                    <Link
                      href={
                        user.role === 'ADMIN' 
                          ? '/admin' 
                          : user.role === 'TEACHER' 
                          ? '/teacher' 
                          : '/dashboard'
                      }
                      className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                        (user.role === 'ADMIN' && pathname.startsWith('/admin')) ||
                        (user.role === 'TEACHER' && pathname.startsWith('/teacher')) ||
                        (user.role === 'STUDENT' && pathname.startsWith('/dashboard') && !pathname.startsWith('/dashboard/exams') && !pathname.startsWith('/dashboard/homework') && !pathname.startsWith('/dashboard/grades'))
                          ? 'bg-primary/10 text-primary'
                          : 'text-gray-700 hover:text-gray-900 hover:bg-gray-50'
                      }`}
                    >
                      لوحة التحكم
                    </Link>
                    {user.role === 'STUDENT' && (
                      <>
                        <Link
                          href="/dashboard/exams"
                          className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                            pathname.startsWith('/dashboard/exams')
                              ? 'bg-primary/10 text-primary'
                              : 'text-gray-700 hover:text-gray-900 hover:bg-gray-50'
                          }`}
                        >
                          الامتحانات
                        </Link>
                        <Link
                          href="/dashboard/homework"
                          className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                            pathname.startsWith('/dashboard/homework')
                              ? 'bg-primary/10 text-primary'
                              : 'text-gray-700 hover:text-gray-900 hover:bg-gray-50'
                          }`}
                        >
                          الواجبات
                        </Link>
                        <Link
                          href="/dashboard/grades"
                          className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                            pathname.startsWith('/dashboard/grades')
                              ? 'bg-primary/10 text-primary'
                              : 'text-gray-700 hover:text-gray-900 hover:bg-gray-50'
                          }`}
                        >
                          التقييمات
                        </Link>
                      </>
                    )}
                  </>
                )}
              </nav>
            </div>

            {/* Left Side: User Actions (RTL) */}
            <div className="flex items-center gap-3">
              {user ? (
                <>
                  {/* User Profile */}
                  <div className="hidden md:flex items-center gap-3">
                    <div className="flex items-center gap-3 px-2 py-1.5 rounded-lg">
                      <div className="text-left">
                        <p className="text-sm font-medium text-gray-900">{user.name}</p>
                        <p className="text-xs text-gray-500">
                          {user.role === 'ADMIN' ? 'مدير' : user.role === 'TEACHER' ? 'مدرس' : 'طالب'}
                        </p>
                      </div>
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center text-white font-semibold text-sm shadow-sm ${
                        user.role === 'ADMIN' 
                          ? 'bg-gradient-to-br from-purple-600 to-purple-500'
                          : user.role === 'TEACHER'
                          ? 'bg-gradient-to-br from-blue-600 to-blue-500'
                          : 'bg-gradient-to-br from-green-600 to-green-500'
                      }`}>
                        {user.name?.charAt(0) || 'U'}
                      </div>
                    </div>
                  </div>

                  {/* Logout Button */}
                  <button
                    onClick={handleLogout}
                    className="hidden md:flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    <span>خروج</span>
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/login"
                    className="hidden md:flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-md transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                    </svg>
                    <span>دخول</span>
                  </Link>
                  <Link
                    href="/register"
                    className="hidden md:flex items-center gap-1.5 px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-dark transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                    </svg>
                    <span>تسجيل</span>
                  </Link>
                </>
              )}

              {/* Mobile Menu Button */}
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="md:hidden p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                aria-label="القائمة"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {menuOpen ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  )}
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {menuOpen && (
          <div className="md:hidden border-t border-gray-200 bg-white">
            <nav className="px-4 py-3 space-y-1 max-h-[75vh] overflow-y-auto">
              <Link
                href="/"
                onClick={() => setMenuOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  pathname === '/'
                    ? 'bg-primary/10 text-primary'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                <span>الرئيسية</span>
              </Link>
              <Link
                href="/courses"
                onClick={() => setMenuOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  pathname === '/courses' || pathname.startsWith('/courses/')
                    ? 'bg-primary/10 text-primary'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <span className="text-lg">📚</span>
                <span>الدورات</span>
              </Link>
              
              {user ? (
                <>
                  <Link
                    href={
                      user.role === 'ADMIN' 
                        ? '/admin' 
                        : user.role === 'TEACHER' 
                        ? '/teacher' 
                        : '/dashboard'
                    }
                    onClick={() => setMenuOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                      (user.role === 'ADMIN' && pathname.startsWith('/admin')) ||
                      (user.role === 'TEACHER' && pathname.startsWith('/teacher')) ||
                      (user.role === 'STUDENT' && pathname.startsWith('/dashboard'))
                        ? 'bg-primary/10 text-primary'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <span className="text-lg">📊</span>
                    <span>لوحة التحكم</span>
                  </Link>
                  
                  {user.role === 'STUDENT' && (
                    <>
                      <Link
                        href="/dashboard/exams"
                        onClick={() => setMenuOpen(false)}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                          pathname.startsWith('/dashboard/exams')
                            ? 'bg-primary/10 text-primary'
                            : 'text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        <span className="text-lg">📝</span>
                        <span>الامتحانات</span>
                      </Link>
                      <Link
                        href="/dashboard/homework"
                        onClick={() => setMenuOpen(false)}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                          pathname.startsWith('/dashboard/homework')
                            ? 'bg-primary/10 text-primary'
                            : 'text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        <span className="text-lg">📋</span>
                        <span>الواجبات</span>
                      </Link>
                      <Link
                        href="/dashboard/grades"
                        onClick={() => setMenuOpen(false)}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                          pathname.startsWith('/dashboard/grades')
                            ? 'bg-primary/10 text-primary'
                            : 'text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        <span className="text-lg">⭐</span>
                        <span>التقييمات</span>
                      </Link>
                    </>
                  )}
                  
                  {/* Mobile User Section */}
                  <div className="border-t border-gray-200 pt-3 mt-3">
                    <div className="flex items-center gap-3 px-3 py-2 mb-2">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold ${
                        user.role === 'ADMIN' 
                          ? 'bg-gradient-to-br from-purple-600 to-purple-500'
                          : user.role === 'TEACHER'
                          ? 'bg-gradient-to-br from-blue-600 to-blue-500'
                          : 'bg-gradient-to-br from-green-600 to-green-500'
                      }`}>
                        {user.name?.charAt(0) || 'U'}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{user.name}</p>
                        <p className="text-xs text-gray-500">
                          {user.role === 'ADMIN' ? 'مدير' : user.role === 'TEACHER' ? 'مدرس' : 'طالب'}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                      <span>تسجيل الخروج</span>
                    </button>
                  </div>
                </>
              ) : (
                <div className="border-t border-gray-200 pt-3 mt-3">
                  <Link
                    href="/login"
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                    </svg>
                    <span>تسجيل الدخول</span>
                  </Link>
                  <Link
                    href="/register"
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium bg-primary text-white hover:bg-primary-dark transition-colors mt-1"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                    </svg>
                    <span>إنشاء حساب</span>
                  </Link>
                </div>
              )}
            </nav>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="flex-1">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* About */}
            <div>
              <h3 className="text-2xl font-bold mb-4">زاد الهداية</h3>
              <p className="text-gray-400 text-lg leading-relaxed">
                منصة تعليمية إلكترونية متكاملة تهدف إلى تسهيل طلب العلم الشرعي للجميع
              </p>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="text-xl font-bold mb-4">روابط سريعة</h4>
              <ul className="space-y-3">
                <li>
                  <Link href="/courses" className="text-gray-400 hover:text-white transition text-lg">
                    الدورات
                  </Link>
                </li>
                {user && (
                  <li>
                    <Link 
                      href={
                        user.role === 'ADMIN' 
                          ? '/admin' 
                          : user.role === 'TEACHER' 
                          ? '/teacher' 
                          : '/dashboard'
                      } 
                      className="text-gray-400 hover:text-white transition text-lg"
                    >
                      لوحة التحكم
                    </Link>
                  </li>
                )}
                <li>
                  <Link href="/about" className="text-gray-400 hover:text-white transition text-lg">
                    عن المعهد
                  </Link>
                </li>
                <li>
                  <Link href="/contact" className="text-gray-400 hover:text-white transition text-lg">
                    اتصل بنا
                  </Link>
                </li>
              </ul>
            </div>

            {/* Resources */}
            <div>
              <h4 className="text-xl font-bold mb-4">الموارد</h4>
              <ul className="space-y-3">
                <li>
                  <Link href="/courses" className="text-gray-400 hover:text-white transition text-lg">
                    تصفح الدورات
                  </Link>
                </li>
                <li>
                  <Link href="/about" className="text-gray-400 hover:text-white transition text-lg">
                    من نحن
                  </Link>
                </li>
              </ul>
            </div>

            {/* Contact */}
            <div>
              <h4 className="text-xl font-bold mb-4">تواصل معنا</h4>
              <ul className="space-y-3 text-gray-400 text-lg">
                <li>📧 info@zad-alhidaya.com</li>
                <li>📱 <span dir="ltr">+972523779400</span></li>
                <li>📍 باقة الغربية</li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 mt-8 pt-8">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <img 
                src="/photos/bottom photo.png" 
                alt="زاد الهداية" 
                className="h-16 md:h-20 w-auto object-contain"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
              <div className="flex flex-col items-center gap-4">
                <div className="flex items-center gap-4">
                  <a
                    href="https://www.facebook.com/NadyHedaya1"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center hover:bg-blue-700 transition"
                    aria-label="Facebook"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                    </svg>
                  </a>
                  <a
                    href="https://www.instagram.com/nadyhedaya/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full flex items-center justify-center hover:from-purple-600 hover:to-pink-600 transition"
                    aria-label="Instagram"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                    </svg>
                  </a>
                </div>
                <p className="text-gray-400 text-lg text-center">
                  © 2025 زاد الهداية - جميع الحقوق محفوظة
                </p>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

