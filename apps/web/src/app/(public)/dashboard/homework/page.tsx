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
  course: { title: string; id: string };
  submissions: Array<{ id: string; score: number; feedback: string }>;
}

export default function StudentHomeworkPage() {
  const [homeworks, setHomeworks] = useState<Homework[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadHomeworks();
  }, []);

  const loadHomeworks = async () => {
    try {
      const enrollmentsRes = await api.get('/enrollments/my-enrollments').catch(() => ({ data: [] }));
      const enrollments = enrollmentsRes.data || [];
      const courses = enrollments.map((e: any) => e.course).filter((c: any) => c);

      if (courses.length === 0) {
        setHomeworks([]);
        setLoading(false);
        return;
      }

      const allHomeworks: Homework[] = [];
      for (const course of courses) {
        try {
          const hwRes = await api.get(`/homework/course/${course.id}`);
          if (hwRes.data && Array.isArray(hwRes.data)) {
            allHomeworks.push(...hwRes.data);
          }
        } catch (e) {
          // Skip if no homeworks or error
          console.log(`No homeworks for course ${course.id}`);
        }
      }

      setHomeworks(allHomeworks);
    } catch (error: any) {
      console.error('Failed to load homeworks:', error);
      setHomeworks([]);
    } finally {
      setLoading(false);
    }
  };

  const getHomeworkStatus = (homework: Homework) => {
    const now = new Date();
    const due = new Date(homework.dueDate);
    const hasSubmission = homework.submissions && homework.submissions.length > 0;
    const isOverdue = now > due && !hasSubmission;

    if (hasSubmission) return { status: 'submitted', label: 'تم التسليم', color: 'bg-green-100 text-green-800' };
    if (isOverdue) return { status: 'overdue', label: 'متأخر', color: 'bg-red-100 text-red-800' };
    return { status: 'pending', label: 'قيد الانتظار', color: 'bg-yellow-100 text-yellow-800' };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6 px-4 sm:px-6 lg:px-8 py-6 bg-gray-50 min-h-screen">
      <h1 className="text-2xl md:text-3xl font-bold text-gray-800">الواجبات</h1>

      {homeworks.length === 0 ? (
        <div className="bg-white rounded-lg shadow-lg p-12 text-center">
          <p className="text-xl text-gray-500 mb-6">لا توجد واجبات متاحة</p>
          <Link
            href="/courses"
            className="inline-block px-8 py-4 bg-primary text-white rounded-lg font-bold text-lg hover:bg-primary-dark transition btn-large"
          >
            تصفح الدورات
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
          {homeworks.map((homework) => {
            const hwStatus = getHomeworkStatus(homework);
            const hasSubmission = homework.submissions && homework.submissions.length > 0;
            const submission = hasSubmission ? homework.submissions[0] : null;

            return (
              <div key={homework.id} className="bg-white rounded-lg shadow-lg p-6 border-2 border-gray-200">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h2 className="text-2xl font-bold mb-2 text-gray-800">{homework.title}</h2>
                    <p className="text-lg text-gray-700">{homework.course.title}</p>
                  </div>
                  <span className={`px-4 py-2 rounded-lg font-semibold text-base ${hwStatus.color}`}>
                    {hwStatus.label}
                  </span>
                </div>

                <div className="mb-4">
                  <p className="text-lg text-gray-700 leading-relaxed">{homework.description}</p>
                </div>

                <div className="space-y-3 mb-6">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-semibold text-gray-800">تاريخ الاستحقاق:</span>
                    <span className="text-lg text-gray-800">{new Date(homework.dueDate).toLocaleDateString('ar-SA')}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-semibold text-gray-800">الوقت:</span>
                    <span className="text-lg text-gray-800">
                      {new Date(homework.dueDate).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-semibold text-gray-800">الدرجة الكاملة:</span>
                    <span className="text-lg text-gray-800">{homework.maxScore}</span>
                  </div>
                  {submission && submission.score !== null && (
                    <div className="flex justify-between items-center pt-3 border-t-2">
                      <span className="text-xl font-bold">درجتك:</span>
                      <span className="text-2xl font-bold text-green-600">
                        {submission.score} / {homework.maxScore}
                      </span>
                    </div>
                  )}
                  {submission && submission.feedback && (
                    <div className="pt-3 border-t-2">
                      <p className="text-lg font-semibold mb-2">ملاحظات المدرس:</p>
                      <p className="text-lg text-gray-700 bg-gray-50 p-3 rounded-lg">{submission.feedback}</p>
                    </div>
                  )}
                </div>

                {!hasSubmission && (
                  <Link
                    href={`/dashboard/homework/${homework.id}/submit`}
                    className="block w-full px-6 py-4 bg-primary text-white rounded-lg font-bold text-lg text-center hover:bg-primary-dark transition btn-large"
                  >
                    {hwStatus.status === 'overdue' ? 'تسليم متأخر' : 'تسليم الواجب'}
                  </Link>
                )}

                {hasSubmission && (
                  <div className="px-6 py-4 bg-green-50 text-green-700 rounded-lg text-center font-semibold text-lg">
                    ✓ تم تسليم الواجب
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

