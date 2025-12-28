'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';

interface Course {
  id: string;
  title: string;
  description: string;
  coverImage?: string;
  status: string;
  _count: { enrollments: number };
}

export default function TeacherDashboard() {
  const router = useRouter();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // Try to get user from localStorage first
      const userStr = localStorage.getItem('user');
      if (userStr) {
        try {
          const cachedUser = JSON.parse(userStr);
          if (cachedUser.role === 'TEACHER' || cachedUser.role === 'ADMIN') {
            setUser(cachedUser);
          }
        } catch (e) {
          // Invalid cached user
        }
      }

      const [userRes, coursesRes] = await Promise.all([
        api.get('/auth/me').catch(() => {
          // If API fails, return cached user
          const userStr = localStorage.getItem('user');
          if (userStr) {
            try {
              return { data: JSON.parse(userStr) };
            } catch (e) {
              throw new Error('No user data');
            }
          }
          throw new Error('No user data');
        }),
        api.get('/courses/teacher/my-courses'),
      ]);
      
      if (userRes.data) {
        setUser(userRes.data);
        localStorage.setItem('user', JSON.stringify(userRes.data));
      }
      setCourses(coursesRes.data || []);
    } catch (error: any) {
      console.error('Failed to load data:', error);
      // Don't redirect if we have cached user
      const userStr = localStorage.getItem('user');
      if (userStr) {
        try {
          const cachedUser = JSON.parse(userStr);
          if (cachedUser.role === 'TEACHER' || cachedUser.role === 'ADMIN') {
            setUser(cachedUser);
            // Try to load courses only
            try {
              const coursesRes = await api.get('/courses/teacher/my-courses');
              setCourses(coursesRes.data || []);
            } catch (e) {
              // Courses failed, but keep user
            }
            setLoading(false);
            return;
          }
        } catch (e) {
          // Invalid cached user
        }
      }
      // Only redirect if no valid cached user
      router.push('/login');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">لوحة تحكم المدرس</h1>
          <p className="text-lg text-gray-800">مرحباً، {user?.name}</p>
        </div>

        {/* Create Course Button - Centered */}
        <div className="flex justify-center mb-12">
          <Link
            href="/teacher/courses/create"
            className="px-8 py-4 bg-primary text-white rounded-lg font-bold text-lg hover:bg-primary-dark transition shadow-lg hover:shadow-xl transform hover:scale-105"
          >
            + إنشاء دورة جديدة
          </Link>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <p className="text-gray-500 text-lg mb-4">لم تنشئ أي دورة بعد</p>
              <Link
                href="/teacher/courses/create"
                className="inline-block px-6 py-3 bg-primary text-white rounded-lg font-bold hover:bg-primary-dark transition"
              >
                إنشاء دورة جديدة
              </Link>
            </div>
          ) : (
            courses.map((course) => (
              <Link
                key={course.id}
                href={`/teacher/courses/${course.id}`}
                className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition"
              >
                <div className="h-48 bg-gradient-to-br from-primary to-primary-light relative">
                  {course.coverImage ? (
                    <img
                      src={course.coverImage}
                      alt={course.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-white text-2xl font-bold">
                      {course.title.charAt(0)}
                    </div>
                  )}
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-bold mb-2 text-gray-800">{course.title}</h3>
                  <div className="flex justify-between items-center mt-4">
                    <span className={`px-3 py-1 rounded-full text-sm ${
                      course.status === 'PUBLISHED' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {course.status === 'PUBLISHED' ? 'منشور' : 'مسودة'}
                    </span>
                    <span className="text-gray-700 font-semibold">
                      {course._count.enrollments} طالب
                    </span>
                  </div>
                </div>
              </Link>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

