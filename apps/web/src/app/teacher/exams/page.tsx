'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import { ExamIcon, ClockIcon, EditIcon, UsersIcon } from '@/components/Icons';

interface Exam {
  id: string;
  title: string;
  description?: string;
  durationMinutes: number;
  startDate: string;
  endDate: string;
  maxScore: number;
  passingScore: number;
  course: { id: string; title: string };
  _count: { attempts: number; questions: number };
}

export default function TeacherExamsPage() {
  const [exams, setExams] = useState<Exam[]>([]);
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
      
      // Load exams for teacher's courses
      const allExams: Exam[] = [];
      for (const course of myCourses) {
        try {
          const examRes = await api.get(`/exams/course/${course.id}`);
          const examsWithCourse = (examRes.data || []).map((exam: any) => ({
            ...exam,
            course: exam.course || { id: course.id, title: course.title },
          }));
          allExams.push(...examsWithCourse);
        } catch (error) {
          console.error(`Failed to load exams for course ${course.id}:`, error);
        }
      }
      setExams(allExams);
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

  const totalAttempts = exams.reduce((sum, e) => sum + (e._count?.attempts || 0), 0);

  return (
    <div className="min-h-screen bg-stone-50">
      {/* Header */}
      <div className="bg-gradient-to-l from-[#1a3a2f] via-[#1f4a3d] to-[#0d2b24] text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center">
              <ExamIcon className="text-white" size={20} />
            </div>
            <div>
              <h1 className="text-xl font-bold">الامتحانات</h1>
              <p className="text-white/70 text-sm">{exams.length} امتحان</p>
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
                <ExamIcon className="text-stone-600" size={18} />
              </div>
              <div>
                <p className="text-2xl font-bold text-stone-800">{exams.length}</p>
                <p className="text-xs text-stone-500">إجمالي الامتحانات</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-stone-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-stone-100 rounded-lg flex items-center justify-center">
                <UsersIcon className="text-stone-600" size={18} />
              </div>
              <div>
                <p className="text-2xl font-bold text-stone-800">{totalAttempts}</p>
                <p className="text-xs text-stone-500">إجمالي المحاولات</p>
              </div>
            </div>
          </div>
        </div>

        {exams.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-stone-100 p-12 text-center">
            <div className="w-16 h-16 bg-stone-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <ExamIcon className="text-stone-600" size={32} />
            </div>
            <h3 className="text-xl font-bold text-stone-800 mb-2">لا توجد امتحانات بعد</h3>
            <p className="text-stone-500">قم بإنشاء دورة وإضافة امتحانات إليها</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-stone-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-stone-50">
                  <tr>
                    <th className="px-6 py-3 text-right text-xs font-medium text-stone-500 uppercase">الامتحان</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-stone-500 uppercase hidden md:table-cell">الدورة</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-stone-500 uppercase hidden sm:table-cell">المدة</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-stone-500 uppercase hidden lg:table-cell">الدرجة</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-stone-500 uppercase">المحاولات</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-stone-500 uppercase">الإجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {exams.map((exam) => (
                    <tr key={exam.id} className="hover:bg-stone-50 transition-colors">
                      <td className="px-6 py-4">
                        <div>
                          <h3 className="font-medium text-stone-800">{exam.title}</h3>
                          {exam.description && (
                            <p className="text-sm text-stone-500 mt-1 line-clamp-1">{exam.description}</p>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-stone-600 hidden md:table-cell">
                        {exam.course?.title || 'N/A'}
                      </td>
                      <td className="px-6 py-4 text-stone-600 hidden sm:table-cell">
                        <span className="flex items-center gap-1">
                          <ClockIcon size={14} />
                          {exam.durationMinutes} د
                        </span>
                      </td>
                      <td className="px-6 py-4 text-stone-600 hidden lg:table-cell">
                        {exam.maxScore} ({exam.passingScore} للنجاح)
                      </td>
                      <td className="px-6 py-4 text-stone-800 font-medium">
                        {exam._count?.attempts || 0}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          <Link
                            href={`/teacher/exams/${exam.id}`}
                            className="p-2 bg-stone-100 text-stone-600 rounded-lg hover:bg-stone-200 transition"
                            title="تعديل"
                          >
                            <EditIcon size={16} />
                          </Link>
                          <Link
                            href={`/teacher/exams/${exam.id}/attempts`}
                            className="p-2 bg-stone-100 text-stone-600 rounded-lg hover:bg-stone-200 transition"
                            title="المحاولات"
                          >
                            <UsersIcon size={16} />
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
    </div>
  );
}

