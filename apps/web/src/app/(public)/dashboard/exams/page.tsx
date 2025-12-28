'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
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
  course: { title: string; id: string };
  attempts: Array<{ id: string; score: number }>;
}

export default function StudentExamsPage() {
  const router = useRouter();
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadExams();
  }, []);

  const loadExams = async () => {
    try {
      // Get all enrolled courses
      const enrollmentsRes = await api.get('/enrollments/my-enrollments').catch(() => ({ data: [] }));
      const enrollments = enrollmentsRes.data || [];
      const courses = enrollments.map((e: any) => e.course).filter((c: any) => c);

      if (courses.length === 0) {
        setExams([]);
        setLoading(false);
        return;
      }

      // Load exams for all courses
      const allExams: Exam[] = [];
      for (const course of courses) {
        try {
          const examsRes = await api.get(`/exams/course/${course.id}`);
          if (examsRes.data && Array.isArray(examsRes.data)) {
            const examsWithCourse = examsRes.data.map((exam: any) => ({
              ...exam,
              course: { title: course.title || 'N/A', id: course.id },
            }));
            allExams.push(...examsWithCourse);
          }
        } catch (e: any) {
          // Skip if no exams or error
          console.log(`No exams for course ${course.id}:`, e.response?.data?.message || e.message);
        }
      }

      setExams(allExams);
    } catch (error: any) {
      console.error('Failed to load exams:', error);
      setExams([]);
    } finally {
      setLoading(false);
    }
  };

  const getExamStatus = (exam: Exam) => {
    const now = new Date();
    const start = new Date(exam.startDate);
    const end = new Date(exam.endDate);
    const hasAttempt = exam.attempts && exam.attempts.length > 0;

    if (hasAttempt) return { status: 'completed', label: 'مكتمل', color: 'bg-green-100 text-green-800' };
    if (now < start) return { status: 'upcoming', label: 'قادم', color: 'bg-blue-100 text-blue-800' };
    if (now >= start && now <= end) return { status: 'active', label: 'متاح الآن', color: 'bg-yellow-100 text-yellow-800' };
    return { status: 'expired', label: 'منتهي', color: 'bg-red-100 text-red-800' };
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
      <h1 className="text-2xl md:text-3xl font-bold text-gray-800">الامتحانات</h1>

      {exams.length === 0 ? (
        <div className="bg-white rounded-lg shadow-lg p-12 text-center">
          <p className="text-xl text-gray-500 mb-6">لا توجد امتحانات متاحة</p>
          <Link
            href="/courses"
            className="inline-block px-8 py-4 bg-primary text-white rounded-lg font-bold text-lg hover:bg-primary-dark transition btn-large"
          >
            تصفح الدورات
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
          {exams.map((exam) => {
            const examStatus = getExamStatus(exam);
            const hasAttempt = exam.attempts && exam.attempts.length > 0;
            const score = hasAttempt ? exam.attempts[0].score : null;

            return (
              <div key={exam.id} className="bg-white rounded-lg shadow-lg p-6 border-2 border-gray-200">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h2 className="text-2xl font-bold mb-2 text-gray-800">{exam.title}</h2>
                    <p className="text-lg text-gray-700">{exam.course.title}</p>
                  </div>
                  <span className={`px-4 py-2 rounded-lg font-semibold text-base ${examStatus.color}`}>
                    {examStatus.label}
                  </span>
                </div>

                {exam.description && (
                  <p className="text-lg text-gray-700 mb-4">{exam.description}</p>
                )}

                <div className="space-y-3 mb-6">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-semibold text-gray-800">المدة:</span>
                    <span className="text-lg text-gray-800">{exam.durationMinutes} دقيقة</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-semibold text-gray-800">الدرجة الكاملة:</span>
                    <span className="text-lg text-gray-800">{exam.maxScore}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-semibold text-gray-800">درجة النجاح:</span>
                    <span className="text-lg text-gray-800">{exam.passingScore}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-semibold text-gray-800">تاريخ البدء:</span>
                    <span className="text-lg text-gray-800">{new Date(exam.startDate).toLocaleDateString('ar-SA')}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-semibold text-gray-800">تاريخ الانتهاء:</span>
                    <span className="text-lg text-gray-800">{new Date(exam.endDate).toLocaleDateString('ar-SA')}</span>
                  </div>
                  {hasAttempt && score !== null && (
                    <div className="flex justify-between items-center pt-3 border-t-2">
                      <span className="text-xl font-bold">درجتك:</span>
                      <span className={`text-2xl font-bold ${
                        score >= exam.passingScore ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {score} / {exam.maxScore}
                      </span>
                    </div>
                  )}
                </div>

                {examStatus.status === 'active' && !hasAttempt && (
                  <Link
                    href={`/dashboard/exams/${exam.id}/take`}
                    className="block w-full px-6 py-4 bg-primary text-white rounded-lg font-bold text-lg text-center hover:bg-primary-dark transition btn-large"
                  >
                    بدء الامتحان
                  </Link>
                )}

                {hasAttempt && (
                  <div className="px-6 py-4 bg-green-50 text-green-700 rounded-lg text-center font-semibold text-lg">
                    ✓ تم إكمال الامتحان
                  </div>
                )}

                {examStatus.status === 'upcoming' && (
                  <div className="px-6 py-4 bg-blue-50 text-blue-700 rounded-lg text-center font-semibold text-lg">
                    سيتم فتح الامتحان قريباً
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

