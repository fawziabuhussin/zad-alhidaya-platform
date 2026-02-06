'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import { HomeworkIcon, CalendarIcon, EditIcon, UsersIcon } from '@/components/Icons';

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
      
      // Load homeworks for all teacher's courses in PARALLEL (fixes N+1 query)
      const homeworkPromises = myCourses.map((course: any) =>
        api.get(`/homework/course/${course.id}`)
          .then(hwRes => ({
            courseId: course.id,
            courseTitle: course.title,
            homeworks: hwRes.data || [],
          }))
          .catch(error => {
            console.error(`Failed to load homeworks for course ${course.id}:`, error);
            return { courseId: course.id, courseTitle: course.title, homeworks: [] };
          })
      );
      
      const results = await Promise.all(homeworkPromises);
      
      // Flatten results and add course info
      const allHomeworks: Homework[] = results.flatMap(result =>
        result.homeworks.map((hw: any) => ({
          ...hw,
          course: hw.course || { id: result.courseId, title: result.courseTitle },
        }))
      );
      
      setHomeworks(allHomeworks);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1a3a2f]"></div>
      </div>
    );
  }

  const totalSubmissions = homeworks.reduce((sum, h) => sum + (h._count?.submissions || 0), 0);

  return (
    <div className="min-h-screen bg-stone-50">
      {/* Header */}
      <div className="bg-gradient-to-l from-[#1a3a2f] via-[#1f4a3d] to-[#0d2b24] text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center">
              <HomeworkIcon className="text-white" size={20} />
            </div>
            <div>
              <h1 className="text-xl font-bold">الواجبات</h1>
              <p className="text-white/70 text-sm">{homeworks.length} واجب</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          <div className="bg-white rounded-xl p-4 shadow-sm border border-stone-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-stone-100 rounded-lg flex items-center justify-center">
                <HomeworkIcon className="text-stone-600" size={18} />
              </div>
              <div>
                <p className="text-2xl font-bold text-stone-800">{homeworks.length}</p>
                <p className="text-xs text-stone-500">إجمالي الواجبات</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-stone-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-stone-100 rounded-lg flex items-center justify-center">
                <UsersIcon className="text-stone-600" size={18} />
              </div>
              <div>
                <p className="text-2xl font-bold text-stone-800">{totalSubmissions}</p>
                <p className="text-xs text-stone-500">إجمالي التسليمات</p>
              </div>
            </div>
          </div>
        </div>

        {homeworks.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-stone-100 p-12 text-center">
            <div className="w-16 h-16 bg-stone-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <HomeworkIcon className="text-stone-600" size={32} />
            </div>
            <h3 className="text-xl font-bold text-stone-800 mb-2">لا توجد واجبات بعد</h3>
            <p className="text-stone-500">قم بإنشاء دورة وإضافة واجبات إليها</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-stone-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-stone-50">
                  <tr>
                    <th className="px-6 py-3 text-right text-xs font-medium text-stone-500 uppercase">الواجب</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-stone-500 uppercase hidden md:table-cell">الدورة</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-stone-500 uppercase hidden sm:table-cell">الاستحقاق</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-stone-500 uppercase hidden lg:table-cell">الدرجة</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-stone-500 uppercase">التسليمات</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-stone-500 uppercase">تصحيح</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {homeworks.map((homework) => (
                    <tr key={homework.id} className="hover:bg-stone-50 transition-colors">
                      <td className="px-6 py-4">
                        <div>
                          <h3 className="font-medium text-stone-800">{homework.title}</h3>
                          <p className="text-sm text-stone-500 mt-1 line-clamp-1">{homework.description}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-stone-600 hidden md:table-cell">
                        {homework.course?.title || 'N/A'}
                      </td>
                      <td className="px-6 py-4 text-stone-600 hidden sm:table-cell">
                        <span className="flex items-center gap-1">
                          <CalendarIcon size={14} />
                          {new Date(homework.dueDate).toLocaleDateString('ar-SA')}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-stone-600 hidden lg:table-cell">
                        {homework.maxScore}
                      </td>
                      <td className="px-6 py-4 text-stone-800 font-medium">
                        {homework._count?.submissions || 0}
                      </td>
                      <td className="px-6 py-4">
                        <Link
                          href={`/teacher/homework/${homework.id}/submissions`}
                          className="p-2 bg-stone-100 text-stone-600 rounded-lg hover:bg-stone-200 transition inline-flex"
                          title="تصحيح"
                        >
                          <EditIcon size={16} />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

