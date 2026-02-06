'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import { showSuccess, TOAST_MESSAGES } from '@/lib/toast';

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
      showSuccess(TOAST_MESSAGES.LOGOUT_SUCCESS);
      window.location.href = '/';
    }
  };

  return (
    <div className="min-h-screen bg-[#fdfbf7] flex flex-col">
      {/* Header */}
      <header className="bg-[#1a3a2f] sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14">
            <div className="flex items-center gap-6">
              <Link href="/" className="flex items-center gap-2 shrink-0">
                <img 
                  src="/photos/logo.jpg" 
                  alt="زاد الهداية" 
                  className="h-9 w-auto object-contain rounded"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
                <span className="hidden sm:block text-lg font-semibold text-white">زاد الهداية</span>
              </Link>

              <nav className="hidden md:flex items-center gap-1">
                <Link
                  href="/"
                  className={`px-3 py-1.5 rounded text-sm transition-colors ${
                    pathname === '/'
                      ? 'bg-white/15 text-white'
                      : 'text-stone-300 hover:text-white hover:bg-white/10'
                  }`}
                >
                  الرئيسية
                </Link>
                <Link
                  href="/courses"
                  className={`px-3 py-1.5 rounded text-sm transition-colors ${
                    pathname === '/courses' || pathname.startsWith('/courses/')
                      ? 'bg-white/15 text-white'
                      : 'text-stone-300 hover:text-white hover:bg-white/10'
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
                      className={`px-3 py-1.5 rounded text-sm transition-colors ${
                        pathname === '/dashboard' || pathname.startsWith('/dashboard/')
                          ? 'bg-white/15 text-white'
                          : 'text-stone-300 hover:text-white hover:bg-white/10'
                      }`}
                    >
                      {user.role === 'STUDENT' ? 'زادي' : 'لوحة التحكم'}
                    </Link>
                    {user.role === 'STUDENT' && (
                      <>
                        <Link
                          href="/dashboard/questions"
                          className={`px-3 py-1.5 rounded text-sm transition-colors ${
                            pathname === '/dashboard/questions'
                              ? 'bg-white/15 text-white'
                              : 'text-stone-300 hover:text-white hover:bg-white/10'
                          }`}
                        >
                          أسئلتي
                        </Link>
                        <Link
                          href="/dashboard/reports"
                          className={`px-3 py-1.5 rounded text-sm transition-colors ${
                            pathname === '/dashboard/reports'
                              ? 'bg-white/15 text-white'
                              : 'text-stone-300 hover:text-white hover:bg-white/10'
                          }`}
                        >
                          تبليغاتي
                        </Link>
                      </>
                    )}
                  </>
                )}
              </nav>
            </div>

            <div className="flex items-center gap-2">
              {user ? (
                <>
                  <div className="hidden md:flex items-center gap-2 px-2 py-1">
                    <span className="text-sm text-white">{user.name}</span>
                    <div className="w-7 h-7 bg-[#c9a227] rounded-full flex items-center justify-center text-white text-xs font-medium">
                      {user.name?.charAt(0) || 'U'}
                    </div>
                  </div>

                  <button
                    onClick={handleLogout}
                    className="hidden md:block px-2 py-1.5 text-sm text-stone-400 hover:text-red-400 transition-colors"
                  >
                    خروج
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/login"
                    className="hidden md:block px-3 py-1.5 text-sm text-stone-300 hover:text-white transition-colors"
                  >
                    دخول
                  </Link>
                  <Link
                    href="/register"
                    className="hidden md:block px-4 py-1.5 bg-[#c9a227] text-white rounded text-sm hover:bg-[#b08f20] transition-colors"
                  >
                    تسجيل
                  </Link>
                </>
              )}

              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="md:hidden p-1.5 text-stone-300 hover:text-white rounded"
                aria-label="القائمة"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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

        {menuOpen && (
          <div className="md:hidden border-t border-white/10 bg-[#1a3a2f]">
            <nav className="px-4 py-3 space-y-1">
              <Link
                href="/"
                onClick={() => setMenuOpen(false)}
                className={`block px-3 py-2 rounded text-sm ${
                  pathname === '/'
                    ? 'bg-white/15 text-white'
                    : 'text-stone-300 hover:bg-white/10'
                }`}
              >
                الرئيسية
              </Link>
              <Link
                href="/courses"
                onClick={() => setMenuOpen(false)}
                className={`block px-3 py-2 rounded text-sm ${
                  pathname === '/courses' || pathname.startsWith('/courses/')
                    ? 'bg-white/15 text-white'
                    : 'text-stone-300 hover:bg-white/10'
                }`}
              >
                الدورات
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
                    className={`block px-3 py-2 rounded text-sm ${
                      pathname === '/dashboard' || pathname.startsWith('/dashboard/')
                        ? 'bg-white/15 text-white'
                        : 'text-stone-300 hover:bg-white/10'
                    }`}
                  >
                    {user.role === 'STUDENT' ? 'زادي' : 'لوحة التحكم'}
                  </Link>
                  {user.role === 'STUDENT' && (
                    <>
                      <Link
                        href="/dashboard/questions"
                        onClick={() => setMenuOpen(false)}
                        className={`block px-3 py-2 rounded text-sm ${
                          pathname === '/dashboard/questions'
                            ? 'bg-white/15 text-white'
                            : 'text-stone-300 hover:bg-white/10'
                        }`}
                      >
                        أسئلتي
                      </Link>
                      <Link
                        href="/dashboard/reports"
                        onClick={() => setMenuOpen(false)}
                        className={`block px-3 py-2 rounded text-sm ${
                          pathname === '/dashboard/reports'
                            ? 'bg-white/15 text-white'
                            : 'text-stone-300 hover:bg-white/10'
                        }`}
                      >
                        تبليغاتي
                      </Link>
                    </>
                  )}
                  
                  <div className="border-t border-white/10 pt-3 mt-3">
                    <div className="flex items-center gap-2 px-3 py-2">
                      <div className="w-8 h-8 bg-[#c9a227] rounded-full flex items-center justify-center text-white text-sm font-medium">
                        {user.name?.charAt(0) || 'U'}
                      </div>
                      <div>
                        <p className="text-sm text-white">{user.name}</p>
                        <p className="text-xs text-stone-400">
                          {user.role === 'ADMIN' ? 'مدير' : user.role === 'TEACHER' ? 'مدرس' : 'طالب'}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={handleLogout}
                      className="w-full text-right px-3 py-2 text-sm text-red-400 hover:bg-white/10 rounded"
                    >
                      تسجيل الخروج
                    </button>
                  </div>
                </>
              ) : (
                <div className="border-t border-white/10 pt-3 mt-3 space-y-1">
                  <Link
                    href="/login"
                    onClick={() => setMenuOpen(false)}
                    className="block px-3 py-2 text-sm text-stone-300 hover:bg-white/10 rounded"
                  >
                    تسجيل الدخول
                  </Link>
                  <Link
                    href="/register"
                    onClick={() => setMenuOpen(false)}
                    className="block px-3 py-2 text-sm bg-[#c9a227] text-white rounded hover:bg-[#b08f20]"
                  >
                    إنشاء حساب
                  </Link>
                </div>
              )}
            </nav>
          </div>
        )}
      </header>

      <main className="flex-1">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-[#1a3a2f] text-white mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-lg font-semibold mb-3">زاد الهداية</h3>
              <p className="text-stone-400 text-sm leading-relaxed">
                منصة تعليمية للعلوم الشرعية تهدف لتسهيل طلب العلم للجميع
              </p>
            </div>

            <div>
              <h4 className="font-medium mb-3 text-[#c9a227]">روابط سريعة</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/courses" className="text-stone-400 hover:text-white transition">الدورات</Link></li>
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
                      className="text-stone-400 hover:text-white transition"
                    >
                      {user.role === 'STUDENT' ? 'زادي' : 'لوحة التحكم'}
                    </Link>
                  </li>
                )}
                <li><Link href="/about" className="text-stone-400 hover:text-white transition">عن المعهد</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-medium mb-3 text-[#c9a227]">الموارد</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/courses" className="text-stone-400 hover:text-white transition">تصفح الدورات</Link></li>
                <li><Link href="/about" className="text-stone-400 hover:text-white transition">من نحن</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-medium mb-3 text-[#c9a227]">تواصل معنا</h4>
              <ul className="space-y-2 text-stone-400 text-sm">
                <li>info@zad-alhidaya.com</li>
                <li dir="ltr" className="text-right">+972523779400</li>
                <li>باقة الغربية</li>
              </ul>
            </div>
          </div>

          <div className="border-t border-white/10 mt-8 pt-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <img 
                src="/photos/bottom photo.png" 
                alt="زاد الهداية" 
                className="h-12 w-auto object-contain opacity-80"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
              <div className="flex items-center gap-3">
                <a
                  href="https://www.facebook.com/NadyHedaya1"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-8 h-8 bg-white/10 text-white rounded-full flex items-center justify-center hover:bg-white/20 transition"
                  aria-label="Facebook"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                </a>
                <a
                  href="https://www.instagram.com/nadyhedaya/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-8 h-8 bg-white/10 text-white rounded-full flex items-center justify-center hover:bg-white/20 transition"
                  aria-label="Instagram"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                  </svg>
                </a>
                <span className="text-xs text-stone-500 mr-4">© 2025 زاد الهداية</span>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

