'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import api from '@/lib/api';

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
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 bg-gray-50 min-h-screen p-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">الامتحانات</h1>
      </div>

      {exams.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-12 text-center">
          <p className="text-gray-500 text-lg mb-4">لا توجد امتحانات بعد</p>
          <p className="text-gray-600">قم بإنشاء دورة وإضافة امتحانات إليها</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">الامتحان</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">الدورة</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">المدة</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">الدرجة</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">المحاولات</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {exams.map((exam) => (
                  <tr key={exam.id} className="hover:bg-gray-50 bg-white">
                    <td className="px-6 py-4">
                      <div>
                        <h3 className="font-semibold text-gray-800">{exam.title}</h3>
                        {exam.description && (
                          <p className="text-sm text-gray-600 mt-1">{exam.description}</p>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-800">
                      {exam.course?.title || 'N/A'}
                    </td>
                    <td className="px-6 py-4 text-gray-800">
                      {exam.durationMinutes} دقيقة
                    </td>
                    <td className="px-6 py-4 text-gray-800">
                      {exam.maxScore} ({exam.passingScore} للنجاح)
                    </td>
                    <td className="px-6 py-4 text-gray-800">
                      {exam._count?.attempts || 0}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <Link
                          href={`/teacher/exams/${exam.id}`}
                          className="px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition text-sm"
                        >
                          تعديل
                        </Link>
                        <Link
                          href={`/teacher/exams/${exam.id}/attempts`}
                          className="px-3 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200 transition text-sm"
                        >
                          المحاولات
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

