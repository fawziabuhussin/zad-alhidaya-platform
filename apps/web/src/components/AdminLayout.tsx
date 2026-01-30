'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import Modal from '@/components/Modal';

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [profileData, setProfileData] = useState<any>(null);
  const [profileLoading, setProfileLoading] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        window.location.href = '/login';
        return;
      }

      const response = await api.get('/auth/me');
      const userData = response.data;
      
      if (userData.role !== 'ADMIN') {
        window.location.href = '/dashboard';
        return;
      }

      setUser(userData);
    } catch (error) {
      window.location.href = '/login';
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

  const handleProfileClick = async () => {
    if (!user) return;
    
    setShowProfile(true);
    setProfileLoading(true);
    
    try {
      const response = await api.get(`/users/${user.id}/profile`);
      setProfileData(response.data);
    } catch (error) {
      console.error('Failed to load profile:', error);
    } finally {
      setProfileLoading(false);
    }
  };

  const navItems = [
    { href: '/admin/courses', label: 'إدارة الدورات', icon: '📚', category: 'content' },
    { href: '/admin/categories', label: 'الفئات', icon: '📁', category: 'content' },
    { href: '/admin/users', label: 'إدارة المستخدمين', icon: '👥', category: 'users' },
    { href: '/admin/teachers/create', label: 'إنشاء مدرس', icon: '👨‍🏫', category: 'users' },
    { href: '/admin/enrollments', label: 'التسجيلات', icon: '✅', category: 'users' },
    { href: '/admin/exams', label: 'الامتحانات', icon: '📝', category: 'assessments' },
    { href: '/admin/homework', label: 'الواجبات', icon: '📋', category: 'assessments' },
    { href: '/admin/grades', label: 'التقييمات', icon: '⭐', category: 'assessments' },
  ];

  const categories = [
    { id: 'content', label: 'المحتوى', icon: '📚' },
    { id: 'users', label: 'المستخدمين', icon: '👥' },
    { id: 'assessments', label: 'التقييمات', icon: '📊' },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header - Enterprise RTL Design */}
      <header className="bg-white shadow-sm sticky top-0 z-50 border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Right Side: Logo + Navigation (RTL) */}
            <div className="flex items-center gap-8">
              {/* Logo */}
              <Link href="/admin" className="flex items-center gap-3 shrink-0">
                <img 
                  src="/photos/logo.jpg" 
                  alt="زاد الهداية" 
                  className="h-10 w-auto object-contain"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
                <div className="hidden sm:block">
                  <span className="text-xl font-bold text-gray-900">زاد الهداية</span>
                  <span className="hidden lg:inline text-xs text-purple-600 font-medium mr-2 px-2 py-0.5 bg-purple-50 rounded-full">مدير</span>
                </div>
              </Link>

              {/* Desktop Navigation */}
              <nav className="hidden lg:flex items-center gap-1">
                {/* Dashboard - Direct Link */}
                <Link
                  href="/admin"
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    pathname === '/admin' || pathname === '/admin/'
                      ? 'bg-primary/10 text-primary'
                      : 'text-gray-700 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  لوحة التحكم
                </Link>

                {/* Category Dropdowns */}
                {categories.map((category) => {
                  const categoryItems = navItems.filter(item => item.category === category.id);
                  if (categoryItems.length === 0) return null;
                  
                  return (
                    <div key={category.id} className="relative group">
                      <button className="flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 transition-colors">
                        <span>{category.label}</span>
                        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                      <div className="absolute top-full right-0 mt-1 w-56 bg-white rounded-lg shadow-lg border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-150 z-50">
                        <div className="py-1">
                          {categoryItems.map((item) => {
                            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
                            return (
                              <Link
                                key={item.href}
                                href={item.href}
                                className={`flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${
                                  isActive
                                    ? 'bg-primary/10 text-primary font-medium'
                                    : 'text-gray-700 hover:bg-gray-50'
                                }`}
                              >
                                <span className="text-lg">{item.icon}</span>
                                <span>{item.label}</span>
                              </Link>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </nav>
            </div>

            {/* Left Side: User Actions (RTL) */}
            <div className="flex items-center gap-3">
              {/* Home Link */}
              <Link
                href="/"
                className="hidden md:flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-md transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                <span>الموقع</span>
              </Link>

              {/* Divider */}
              <div className="hidden md:block h-6 w-px bg-gray-200"></div>

              {/* User Profile */}
              <div className="hidden md:flex items-center gap-3">
                <button
                  onClick={handleProfileClick}
                  className="flex items-center gap-3 px-2 py-1.5 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="text-left">
                    <p className="text-sm font-medium text-gray-900">{user?.name || 'المدير'}</p>
                    <p className="text-xs text-gray-500">{user?.email || ''}</p>
                  </div>
                  <div className="w-9 h-9 bg-gradient-to-br from-purple-600 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold text-sm shadow-sm">
                    {user?.name?.charAt(0) || 'A'}
                  </div>
                </button>
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

              {/* Mobile Menu Button */}
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="lg:hidden p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
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
          <div className="lg:hidden border-t border-gray-200 bg-white">
            <nav className="px-4 py-3 space-y-1 max-h-[75vh] overflow-y-auto">
              {/* Dashboard - Direct Link */}
              <Link
                href="/admin"
                onClick={() => setMenuOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  pathname === '/admin' || pathname === '/admin/'
                    ? 'bg-primary/10 text-primary'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <span className="text-lg">📊</span>
                <span>لوحة التحكم</span>
              </Link>

              {/* Category Sections */}
              {categories.map((category) => {
                const categoryItems = navItems.filter(item => item.category === category.id);
                if (categoryItems.length === 0) return null;
                
                return (
                  <div key={category.id} className="mb-3">
                    <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      {category.label}
                    </div>
                    {categoryItems.map((item) => {
                      const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={() => setMenuOpen(false)}
                          className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                            isActive
                              ? 'bg-primary/10 text-primary'
                              : 'text-gray-700 hover:bg-gray-50'
                          }`}
                        >
                          <span className="text-lg">{item.icon}</span>
                          <span>{item.label}</span>
                        </Link>
                      );
                    })}
                  </div>
                );
              })}
              
              {/* Mobile User Section */}
              <div className="border-t border-gray-200 pt-3 mt-3">
                <div className="flex items-center gap-3 px-3 py-2 mb-2">
                  <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold">
                    {user?.name?.charAt(0) || 'A'}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{user?.name || 'المدير'}</p>
                    <p className="text-xs text-gray-500">{user?.email || ''}</p>
                  </div>
                </div>
                <Link
                  href="/"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                  </svg>
                  <span>الموقع الرئيسي</span>
                </Link>
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
            </nav>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="flex-1" style={{ overflow: 'visible', position: 'relative' }}>
        <div style={{ overflow: 'visible', position: 'relative', maxWidth: '100%', width: '100%' }}>
          {children}
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t mt-auto py-6 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="text-center md:text-right text-gray-600 text-sm">
              <p className="text-gray-800 font-semibold">© 2025 زاد الهداية - جميع الحقوق محفوظة</p>
              <p className="mt-2 text-xs text-gray-600">منصة تعليمية إلكترونية للعلوم الشرعية</p>
            </div>
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
          </div>
        </div>
      </footer>

      {/* Profile Modal */}
      <Modal
        isOpen={showProfile}
        onClose={() => {
          setShowProfile(false);
          setProfileData(null);
        }}
        title="الملف الشخصي"
        size="lg"
      >
        {profileLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-primary"></div>
              </div>
            ) : profileData ? (
              <div className="space-y-6">
                {/* User Info */}
                <div className="flex items-center gap-6 pb-6 border-b border-gray-200">
                  <div className="w-20 h-20 bg-gradient-to-br from-primary to-primary-light rounded-full flex items-center justify-center text-white font-bold text-3xl">
                    {profileData.name?.charAt(0) || 'A'}
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-gray-800">{profileData.name}</h3>
                    <p className="text-lg text-gray-600">{profileData.email}</p>
                    <div className="flex gap-2 mt-2">
                      <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                        profileData.role === 'ADMIN' 
                          ? 'bg-purple-100 text-purple-800'
                          : profileData.role === 'TEACHER'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {profileData.role === 'ADMIN' ? 'أدمن' : profileData.role === 'TEACHER' ? 'مدرس' : 'طالب'}
                      </span>
                      {profileData.provider && (
                        <span className="px-3 py-1 rounded-full text-sm font-semibold bg-gray-100 text-gray-800">
                          {profileData.provider === 'GOOGLE' ? 'Google' : profileData.provider === 'APPLE' ? 'Apple' : 'Email'}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Statistics */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {profileData.role === 'STUDENT' && (
                    <>
                      <div className="bg-blue-50 p-4 rounded-lg border-2 border-blue-200">
                        <p className="text-sm text-blue-600 font-semibold">التسجيلات</p>
                        <p className="text-2xl font-bold text-blue-800">{profileData._count?.enrollments || 0}</p>
                      </div>
                      <div className="bg-green-50 p-4 rounded-lg border-2 border-green-200">
                        <p className="text-sm text-green-600 font-semibold">الامتحانات</p>
                        <p className="text-2xl font-bold text-green-800">{profileData._count?.examAttempts || 0}</p>
                      </div>
                      <div className="bg-yellow-50 p-4 rounded-lg border-2 border-yellow-200">
                        <p className="text-sm text-yellow-600 font-semibold">الواجبات</p>
                        <p className="text-2xl font-bold text-yellow-800">{profileData._count?.homeworkSubmissions || 0}</p>
                      </div>
                      <div className="bg-purple-50 p-4 rounded-lg border-2 border-purple-200">
                        <p className="text-sm text-purple-600 font-semibold">التقييمات</p>
                        <p className="text-2xl font-bold text-purple-800">{profileData._count?.grades || 0}</p>
                      </div>
                    </>
                  )}
                  {profileData.role === 'TEACHER' && (
                    <>
                      <div className="bg-blue-50 p-4 rounded-lg border-2 border-blue-200">
                        <p className="text-sm text-blue-600 font-semibold">الدورات</p>
                        <p className="text-2xl font-bold text-blue-800">{profileData._count?.coursesTaught || 0}</p>
                      </div>
                    </>
                  )}
                </div>

                {/* Enrollments (for Students) */}
                {profileData.role === 'STUDENT' && profileData.enrollments && profileData.enrollments.length > 0 && (
                  <div>
                    <h4 className="text-xl font-bold text-gray-800 mb-4">الدورات المسجلة</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {profileData.enrollments.map((enrollment: any) => (
                        <div key={enrollment.id} className="bg-gray-50 p-4 rounded-lg border-2 border-gray-200">
                          <h5 className="font-semibold text-gray-800">{enrollment.course.title}</h5>
                          <p className="text-sm text-gray-600 mt-1">
                            تاريخ التسجيل: {new Date(enrollment.enrolledAt).toLocaleDateString('ar-SA')}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Courses Taught (for Teachers) */}
                {profileData.role === 'TEACHER' && profileData.coursesTaught && profileData.coursesTaught.length > 0 && (
                  <div>
                    <h4 className="text-xl font-bold text-gray-800 mb-4">الدورات التي أدرسها</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {profileData.coursesTaught.map((course: any) => (
                        <div key={course.id} className="bg-gray-50 p-4 rounded-lg border-2 border-gray-200">
                          <h5 className="font-semibold text-gray-800">{course.title}</h5>
                          <p className="text-sm text-gray-600 mt-1">
                            الطلاب: {course._count?.enrollments || 0}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Recent Grades */}
                {profileData.grades && profileData.grades.length > 0 && (
                  <div>
                    <h4 className="text-xl font-bold text-gray-800 mb-4">آخر التقييمات</h4>
                    <div className="space-y-2">
                      {profileData.grades.map((grade: any) => (
                        <div key={grade.id} className="bg-gray-50 p-4 rounded-lg border-2 border-gray-200 flex justify-between items-center">
                          <div>
                            <p className="font-semibold text-gray-800">{grade.course.title}</p>
                            <p className="text-sm text-gray-600">
                              {grade.type === 'EXAM' ? 'امتحان' : grade.type === 'HOMEWORK' ? 'واجب' : 'تقييم'}
                            </p>
                          </div>
                          <div className="text-left">
                            <p className="text-lg font-bold text-gray-800">
                              {grade.score} / {grade.maxScore}
                            </p>
                            <p className="text-sm text-gray-600">{grade.letterGrade}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Account Info */}
                <div className="pt-6 border-t border-gray-200">
                  <h4 className="text-lg font-bold text-gray-800 mb-3">معلومات الحساب</h4>
                  <div className="space-y-2 text-gray-700">
                    <p><span className="font-semibold">تاريخ الإنشاء:</span> {new Date(profileData.createdAt).toLocaleDateString('ar-SA')}</p>
                    <p><span className="font-semibold">الحالة:</span> {profileData.blocked ? 'محظور' : 'نشط'}</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-6 text-center text-gray-500">
                <p>فشل تحميل بيانات الملف الشخصي</p>
              </div>
            )}
      </Modal>
    </div>
  );
}
