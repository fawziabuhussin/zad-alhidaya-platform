'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import api from '@/lib/api';

interface Stats {
  courses: number;
  users: number;
  enrollments: number;
  teachers: number;
  students: number;
  categories: number;
}

interface RecentActivity {
  type: string;
  message: string;
  time: string;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats>({
    courses: 0,
    users: 0,
    enrollments: 0,
    teachers: 0,
    students: 0,
    categories: 0,
  });
  const [loading, setLoading] = useState(true);
  const [recentCourses, setRecentCourses] = useState<any[]>([]);
  const [recentUsers, setRecentUsers] = useState<any[]>([]);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const [coursesRes, usersRes, enrollmentsRes, categoriesRes] = await Promise.all([
        api.get('/courses/public').catch(() => ({ data: [] })),
        api.get('/users').catch(() => ({ data: [] })),
        api.get('/enrollments').catch(() => ({ data: [] })),
        api.get('/categories').catch(() => ({ data: [] })),
      ]);

      const courses = coursesRes.data || [];
      const users = usersRes.data || [];
      const enrollments = enrollmentsRes.data || [];
      const categories = categoriesRes.data || [];

      const teachers = users.filter((u: any) => u.role === 'TEACHER').length;
      const students = users.filter((u: any) => u.role === 'STUDENT').length;

      setStats({
        courses: courses.length,
        users: users.length,
        enrollments: enrollments.length,
        teachers,
        students,
        categories: categories.length,
      });

      setRecentCourses(courses.slice(0, 5));
      setRecentUsers(users.slice(0, 5));
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 bg-gray-50 min-h-screen p-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-primary to-primary-light text-white rounded-lg p-6">
        <h1 className="text-3xl font-bold mb-2">مرحباً بك في لوحة التحكم</h1>
        <p className="text-white/90">إدارة شاملة لمنصة زاد الهداية التعليمية</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6 border-r-4 border-primary">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-gray-600 text-sm mb-1">إجمالي الدورات</p>
              <p className="text-3xl font-bold text-primary">{stats.courses}</p>
            </div>
            <div className="text-4xl">📚</div>
          </div>
          <Link href="/admin/courses" className="text-primary text-sm mt-2 inline-block hover:underline">
            عرض جميع الدورات →
          </Link>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 border-r-4 border-green-500">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-gray-600 text-sm mb-1">إجمالي المستخدمين</p>
              <p className="text-3xl font-bold text-green-600">{stats.users}</p>
            </div>
            <div className="text-4xl">👥</div>
          </div>
          <Link href="/admin/users" className="text-green-600 text-sm mt-2 inline-block hover:underline">
            عرض جميع المستخدمين →
          </Link>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 border-r-4 border-blue-500">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-gray-600 text-sm mb-1">التسجيلات</p>
              <p className="text-3xl font-bold text-blue-600">{stats.enrollments}</p>
            </div>
            <div className="text-4xl">✅</div>
          </div>
          <Link href="/admin/enrollments" className="text-blue-600 text-sm mt-2 inline-block hover:underline">
            عرض جميع التسجيلات →
          </Link>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 border-r-4 border-purple-500">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-gray-600 text-sm mb-1">المدرسين</p>
              <p className="text-3xl font-bold text-purple-600">{stats.teachers}</p>
            </div>
            <div className="text-4xl">👨‍🏫</div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 border-r-4 border-orange-500">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-gray-600 text-sm mb-1">الطلاب</p>
              <p className="text-3xl font-bold text-orange-600">{stats.students}</p>
            </div>
            <div className="text-4xl">🎓</div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 border-r-4 border-indigo-500">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-gray-600 text-sm mb-1">الفئات</p>
              <p className="text-3xl font-bold text-indigo-600">{stats.categories}</p>
            </div>
            <div className="text-4xl">📁</div>
          </div>
          <Link href="/admin/categories" className="text-indigo-600 text-sm mt-2 inline-block hover:underline">
            إدارة الفئات →
          </Link>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Courses */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-800">أحدث الدورات</h2>
            <Link href="/admin/courses" className="text-primary text-sm hover:underline">
              عرض الكل
            </Link>
          </div>
          {recentCourses.length === 0 ? (
            <p className="text-gray-500 text-center py-8">لا توجد دورات</p>
          ) : (
            <div className="space-y-4">
              {recentCourses.map((course) => (
                <div key={course.id} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                  <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center text-white font-bold">
                    {course.title.charAt(0)}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-800">{course.title}</h3>
                    <p className="text-sm text-gray-600">{course.category?.title || 'بدون فئة'}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs ${
                    course.status === 'PUBLISHED' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {course.status === 'PUBLISHED' ? 'منشور' : 'مسودة'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Users */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-800">أحدث المستخدمين</h2>
            <Link href="/admin/users" className="text-primary text-sm hover:underline">
              عرض الكل
            </Link>
          </div>
          {recentUsers.length === 0 ? (
            <p className="text-gray-500 text-center py-8">لا يوجد مستخدمين</p>
          ) : (
            <div className="space-y-4">
              {recentUsers.map((user) => (
                <div key={user.id} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                  <div className="w-12 h-12 bg-gradient-to-br from-primary to-primary-light rounded-full flex items-center justify-center text-white font-bold">
                    {user.name.charAt(0)}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-800">{user.name}</h3>
                    <p className="text-sm text-gray-600">{user.email}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs ${
                    user.role === 'ADMIN' 
                      ? 'bg-purple-100 text-purple-800'
                      : user.role === 'TEACHER'
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-green-100 text-green-800'
                  }`}>
                    {user.role === 'ADMIN' ? 'أدمن' : user.role === 'TEACHER' ? 'مدرس' : 'طالب'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-bold mb-4 text-gray-800">إجراءات سريعة</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            href="/admin/courses?action=create"
            className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-primary hover:bg-primary/5 transition text-center"
          >
            <div className="text-3xl mb-2">➕</div>
            <p className="font-semibold text-gray-800">إنشاء دورة جديدة</p>
          </Link>
          <Link
            href="/admin/users?action=create"
            className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-primary hover:bg-primary/5 transition text-center"
          >
            <div className="text-3xl mb-2">👤</div>
            <p className="font-semibold text-gray-800">إضافة مستخدم جديد</p>
          </Link>
          <Link
            href="/admin/categories?action=create"
            className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-primary hover:bg-primary/5 transition text-center"
          >
            <div className="text-3xl mb-2">📁</div>
            <p className="font-semibold text-gray-800">إضافة فئة جديدة</p>
          </Link>
        </div>
      </div>
    </div>
  );
}
