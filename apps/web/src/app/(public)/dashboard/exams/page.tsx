'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import { CheckCircleIcon, ExamIcon, ClockIcon, BookIcon } from '@/components/Icons';

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

    if (hasAttempt) return { status: 'completed', label: 'مكتمل', color: 'bg-emerald-50 text-emerald-700' };
    if (now < start) return { status: 'upcoming', label: 'قادم', color: 'bg-sky-50 text-sky-700' };
    if (now >= start && now <= end) return { status: 'active', label: 'متاح الآن', color: 'bg-amber-50 text-amber-700' };
    return { status: 'expired', label: 'منتهي', color: 'bg-stone-100 text-stone-600' };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1a3a2f]"></div>
      </div>
    );
  }

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
        {exams.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-stone-100 p-12 text-center">
            <div className="w-16 h-16 bg-stone-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <ExamIcon className="text-stone-600" size={32} />
            </div>
            <h3 className="text-xl font-bold text-stone-800 mb-2">لا توجد امتحانات متاحة</h3>
            <p className="text-stone-500 mb-6">سجل في دورات للوصول إلى الامتحانات</p>
            <Link
              href="/courses"
              className="inline-flex items-center gap-2 px-6 py-3 bg-[#1a3a2f] text-white rounded-xl font-bold hover:bg-[#143026] transition"
            >
              <BookIcon size={18} />
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
                <div key={exam.id} className="bg-white rounded-xl shadow-sm border border-stone-100 p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h2 className="text-xl font-bold mb-1 text-stone-800">{exam.title}</h2>
                      <p className="text-stone-500">{exam.course.title}</p>
                    </div>
                    <span className={`px-3 py-1.5 rounded-lg font-medium text-sm ${examStatus.color}`}>
                      {examStatus.label}
                    </span>
                  </div>

                  {exam.description && (
                    <p className="text-stone-600 mb-4">{exam.description}</p>
                  )}

                  <div className="space-y-2 mb-6 text-sm">
                    <div className="flex justify-between items-center py-2 border-b border-stone-100">
                      <span className="text-stone-500 flex items-center gap-2">
                        <ClockIcon size={14} /> المدة
                      </span>
                      <span className="font-medium text-stone-800">{exam.durationMinutes} دقيقة</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-stone-100">
                      <span className="text-stone-500">الدرجة الكاملة</span>
                      <span className="font-medium text-stone-800">{exam.maxScore}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-stone-100">
                      <span className="text-stone-500">درجة النجاح</span>
                      <span className="font-medium text-stone-800">{exam.passingScore}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-stone-100">
                      <span className="text-stone-500">البدء</span>
                      <span className="font-medium text-stone-800">
                        {new Date(exam.startDate).toLocaleDateString('ar-SA')} {new Date(exam.startDate).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-stone-100">
                      <span className="text-stone-500">الانتهاء</span>
                      <span className="font-medium text-stone-800">
                        {new Date(exam.endDate).toLocaleDateString('ar-SA')} {new Date(exam.endDate).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    {hasAttempt && score !== null && (
                      <div className="flex justify-between items-center pt-3">
                        <span className="font-bold text-stone-800">درجتك</span>
                        <span className={`text-xl font-bold ${
                          score >= exam.passingScore ? 'text-emerald-600' : 'text-red-600'
                        }`}>
                          {score} / {exam.maxScore}
                        </span>
                      </div>
                    )}
                  </div>

                  {examStatus.status === 'active' && !hasAttempt && (
                    <Link
                      href={`/dashboard/exams/${exam.id}/take`}
                      className="block w-full py-3 bg-[#1a3a2f] text-white rounded-lg font-bold text-center hover:bg-[#143026] transition"
                    >
                      بدء الامتحان
                    </Link>
                  )}

                  {hasAttempt && (
                    <div className="py-3 bg-emerald-50 text-emerald-700 rounded-lg text-center font-medium flex items-center justify-center gap-2">
                      <CheckCircleIcon size={18} /> تم إكمال الامتحان
                    </div>
                  )}

                  {examStatus.status === 'upcoming' && (
                    <div className="py-3 bg-sky-50 text-sky-700 rounded-lg text-center font-medium">
                      سيتم فتح الامتحان قريباً
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

