'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';

interface StudentLayoutProps {
  children: React.ReactNode;
}

export default function StudentLayout({ children }: StudentLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        // Don't redirect, just set user to null
        setUser(null);
        setLoading(false);
        return;
      }

      const response = await api.get('/auth/me');
      setUser(response.data);
    } catch (error) {
      // Keep user logged in even if API fails
      const userStr = localStorage.getItem('user');
      if (userStr) {
        setUser(JSON.parse(userStr));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
  };

  const navItems = [
    { href: '/dashboard', label: 'لوحة التحكم', icon: '📊' },
    { href: '/courses', label: 'الدورات', icon: '📚' },
    { href: '/dashboard/exams', label: 'الامتحانات', icon: '📝' },
    { href: '/dashboard/homework', label: 'الواجبات', icon: '📋' },
    { href: '/dashboard/grades', label: 'التقييمات', icon: '⭐' },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white shadow-lg sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-3">
              <div className="text-3xl font-bold bg-gradient-to-r from-primary to-primary-light bg-clip-text text-transparent">
                زاد الهداية
              </div>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-6">
              {navItems.map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-lg transition ${
                      isActive
                        ? 'bg-primary text-white'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <span>{item.icon}</span>
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>

            {/* User Menu & Mobile Menu Button */}
            <div className="flex items-center gap-4">
              {user ? (
                <>
                  <div className="hidden md:flex items-center gap-3">
                    <div className="text-right">
                      <p className="font-semibold text-lg">{user.name}</p>
                      <p className="text-sm text-gray-500">{user.email}</p>
                    </div>
                    <div className="w-12 h-12 bg-gradient-to-br from-primary to-primary-light rounded-full flex items-center justify-center text-white font-bold text-xl">
                      {user.name.charAt(0)}
                    </div>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="hidden md:block px-6 py-3 bg-red-50 text-red-600 rounded-lg font-semibold text-lg hover:bg-red-100 transition"
                  >
                    تسجيل الخروج
                  </button>
                </>
              ) : (
                <Link
                  href="/login"
                  className="px-6 py-3 bg-primary text-white rounded-lg font-semibold text-lg hover:bg-primary-dark transition"
                >
                  تسجيل الدخول
                </Link>
              )}

              {/* Mobile Menu Button */}
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="md:hidden p-3 text-gray-700 hover:bg-gray-100 rounded-lg"
                aria-label="Menu"
              >
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
          <div className="md:hidden border-t bg-white">
            <nav className="px-4 py-4 space-y-2">
              {navItems.map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMenuOpen(false)}
                    className={`flex items-center gap-3 px-4 py-4 rounded-lg font-semibold text-lg transition ${
                      isActive
                        ? 'bg-primary text-white'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <span className="text-2xl">{item.icon}</span>
                    <span>{item.label}</span>
                  </Link>
                );
              })}
              {user && (
                <>
                  <div className="border-t pt-4 mt-4">
                    <div className="flex items-center gap-3 px-4 py-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-primary to-primary-light rounded-full flex items-center justify-center text-white font-bold text-xl">
                        {user.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-semibold text-lg">{user.name}</p>
                        <p className="text-sm text-gray-500">{user.email}</p>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="w-full px-4 py-4 bg-red-50 text-red-600 rounded-lg font-semibold text-lg hover:bg-red-100 transition text-right"
                  >
                    تسجيل الخروج
                  </button>
                </>
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
                <li>
                  <Link href="/dashboard" className="text-gray-400 hover:text-white transition text-lg">
                    لوحة التحكم
                  </Link>
                </li>
                <li>
                  <Link href="/dashboard/exams" className="text-gray-400 hover:text-white transition text-lg">
                    الامتحانات
                  </Link>
                </li>
                <li>
                  <Link href="/dashboard/grades" className="text-gray-400 hover:text-white transition text-lg">
                    التقييمات
                  </Link>
                </li>
              </ul>
            </div>

            {/* Resources */}
            <div>
              <h4 className="text-xl font-bold mb-4">الموارد</h4>
              <ul className="space-y-3">
                <li>
                  <Link href="/dashboard/homework" className="text-gray-400 hover:text-white transition text-lg">
                    الواجبات
                  </Link>
                </li>
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
      </footer>
    </div>
  );
}

