'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import api from '@/lib/api';

interface Homework {
  id: string;
  title: string;
  description: string;
  dueDate: string;
  maxScore: number;
  course: { id: string; title: string };
  _count: { submissions: number };
}

export default function TeacherHomeworkPage() {
  const [homeworks, setHomeworks] = useState<Homework[]>([]);
  const [loading, setLoading] = useState(true);
  const [courses, setCourses] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      // Try to get user from localStorage first
      const userStr = localStorage.getItem('user');
      if (userStr) {
        try {
          const cachedUser = JSON.parse(userStr);
          if (cachedUser.role === 'TEACHER' || cachedUser.role === 'ADMIN') {
            setUser(cachedUser);
            loadData();
            return;
          }
        } catch (e) {
          // Invalid cached user
        }
      }

      const token = localStorage.getItem('accessToken');
      if (!token) {
        window.location.href = '/login';
        return;
      }

      const userRes = await api.get('/auth/me');
      const userData = userRes.data;
      
      if (userData.role !== 'TEACHER' && userData.role !== 'ADMIN') {
        window.location.href = '/dashboard';
        return;
      }

      setUser(userData);
      localStorage.setItem('user', JSON.stringify(userData));
      loadData();
    } catch (error: any) {
      // Try to use cached user
      const userStr = localStorage.getItem('user');
      if (userStr) {
        try {
          const cachedUser = JSON.parse(userStr);
          if (cachedUser.role === 'TEACHER' || cachedUser.role === 'ADMIN') {
            setUser(cachedUser);
            loadData();
            return;
          }
        } catch (e) {
          // Invalid cached user
        }
      }
      window.location.href = '/login';
    }
  };

  const loadData = async () => {
    try {
      const coursesRes = await api.get('/courses/teacher/my-courses');
      const myCourses = coursesRes.data || [];
      setCourses(myCourses);
      
      // Load homeworks for teacher's courses
      const allHomeworks: Homework[] = [];
      for (const course of myCourses) {
        try {
          const hwRes = await api.get(`/homework/course/${course.id}`);
          const hwWithCourse = (hwRes.data || []).map((hw: any) => ({
            ...hw,
            course: hw.course || { id: course.id, title: course.title },
          }));
          allHomeworks.push(...hwWithCourse);
        } catch (error) {
          console.error(`Failed to load homeworks for course ${course.id}:`, error);
        }
      }
      setHomeworks(allHomeworks);
    } catch (error) {
      console.error('Failed to load data:', error);
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
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">الواجبات</h1>
      </div>

      {homeworks.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-12 text-center">
          <p className="text-gray-500 text-lg mb-4">لا توجد واجبات بعد</p>
          <p className="text-gray-600">قم بإنشاء دورة وإضافة واجبات إليها</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">الواجب</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">الدورة</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">تاريخ الاستحقاق</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">الدرجة</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">التسليمات</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {homeworks.map((homework) => (
                  <tr key={homework.id} className="hover:bg-gray-50 bg-white">
                    <td className="px-6 py-4">
                      <div>
                        <h3 className="font-semibold text-gray-800">{homework.title}</h3>
                        <p className="text-sm text-gray-600 mt-1 line-clamp-2">{homework.description}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-800">
                      {homework.course?.title || 'N/A'}
                    </td>
                    <td className="px-6 py-4 text-gray-800">
                      {new Date(homework.dueDate).toLocaleDateString('ar-SA')}
                    </td>
                    <td className="px-6 py-4 text-gray-800">
                      {homework.maxScore}
                    </td>
                    <td className="px-6 py-4 text-gray-800">
                      {homework._count?.submissions || 0}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <Link
                          href={`/teacher/homework/${homework.id}/submissions`}
                          className="px-3 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200 transition text-sm"
                        >
                          تصحيح
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

