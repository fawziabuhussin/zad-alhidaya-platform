'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';

interface Course {
  id: string;
  title: string;
  description: string;
  coverImage?: string;
  price?: number;
  category: { title: string };
  teacher: { name: string };
  modules: Array<{
    id: string;
    title: string;
    order: number;
    lessons: Array<{
      id: string;
      title: string;
      type: string;
      order: number;
      durationMinutes?: number;
    }>;
  }>;
  exams?: Array<{
    id: string;
    title: string;
    description?: string;
    startDate: string;
    endDate: string;
    maxScore: number;
  }>;
  homeworks?: Array<{
    id: string;
    title: string;
    description: string;
    dueDate: string;
    maxScore: number;
  }>;
  enrollments?: Array<{ id: string }>;
}

export default function CourseDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [progress, setProgress] = useState<{ percentage: number; completedLessons: number; totalLessons: number } | null>(null);

  useEffect(() => {
    loadCourse();
  }, [params.id]);

  const loadCourse = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await api.get(`/courses/${params.id}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      setCourse(response.data);
      setIsEnrolled(response.data.enrollments && response.data.enrollments.length > 0);
      
      // Load progress if enrolled
      if (response.data.enrollments && response.data.enrollments.length > 0 && token) {
        try {
          const progressRes = await api.get(`/progress/courses/${params.id}`);
          setProgress(progressRes.data);
        } catch (e) {
          // Progress not available, calculate from lessons
          const totalLessons = response.data.modules?.reduce((sum: number, m: any) => sum + (m.lessons?.length || 0), 0) || 0;
          setProgress({ percentage: 0, completedLessons: 0, totalLessons });
        }
      }
    } catch (error: any) {
      console.error('Failed to load course:', error);
      if (error.response?.status === 404) {
        router.push('/courses');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleEnroll = async () => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      router.push('/login');
      return;
    }

    setEnrolling(true);
    try {
      await api.post('/enrollments', { courseId: params.id });
      setIsEnrolled(true);
      alert('تم التسجيل في الدورة بنجاح!');
    } catch (error: any) {
      alert(error.response?.data?.message || 'فشل التسجيل في الدورة');
    } finally {
      setEnrolling(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 text-lg mb-4">الدورة غير موجودة</p>
          <Link href="/courses" className="text-primary hover:underline">
            العودة إلى قائمة الدورات
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Course Header */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden mb-8">
          <div className="h-64 bg-gradient-to-br from-primary to-primary-light relative">
            {course.coverImage ? (
              <img
                src={course.coverImage}
                alt={course.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-white text-4xl font-bold">
                {course.title.charAt(0)}
              </div>
            )}
          </div>
          <div className="p-8">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h1 className="text-3xl font-bold mb-2 text-gray-800">{course.title}</h1>
                <p className="text-gray-700 mb-4">{course.description}</p>
                <div className="flex gap-4 text-sm text-gray-600">
                  <span>الفئة: {course.category.title}</span>
                  <span>المدرس: {course.teacher.name}</span>
                  <span className="text-primary font-bold">
                    {course.price === 0 || !course.price ? 'مجاني' : `${course.price} ر.س`}
                  </span>
                </div>
              </div>
              {!isEnrolled && (
                <button
                  onClick={handleEnroll}
                  disabled={enrolling}
                  className="px-6 py-3 bg-primary text-white rounded-lg font-bold hover:bg-primary-dark transition disabled:opacity-50"
                >
                  {enrolling ? 'جاري التسجيل...' : 'سجل في الدورة'}
                </button>
              )}
              {isEnrolled && (
                <span className="px-6 py-3 bg-green-100 text-green-800 rounded-lg font-bold">
                  مسجل في الدورة
                </span>
              )}
            </div>
            
            {/* Progress Tracker */}
            {isEnrolled && progress && (
              <div className="mt-6 bg-gray-50 rounded-lg p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xl font-bold text-gray-800">تقدمك في الدورة</h3>
                  <span className="text-2xl font-bold text-primary">{progress.percentage}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-6 mb-2">
                  <div
                    className="bg-primary h-6 rounded-full transition-all duration-300"
                    style={{ width: `${progress.percentage}%` }}
                  ></div>
                </div>
                <p className="text-gray-700 text-sm">
                  {progress.completedLessons} من {progress.totalLessons} درس مكتمل
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Exams Section */}
        {isEnrolled && course.exams && course.exams.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-8 mb-8">
            <h2 className="text-2xl font-bold mb-6">الامتحانات</h2>
            <div className="space-y-4">
              {course.exams.map((exam) => {
                const now = new Date();
                const start = new Date(exam.startDate);
                const end = new Date(exam.endDate);
                const isActive = now >= start && now <= end;
                const isUpcoming = now < start;
                
                return (
                  <div key={exam.id} className="border-2 border-gray-200 rounded-lg p-6 hover:border-primary transition bg-white">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-xl font-bold mb-2 text-gray-800">{exam.title}</h3>
                        {exam.description && (
                          <p className="text-gray-700 mb-2">{exam.description}</p>
                        )}
                        <div className="flex gap-4 text-sm text-gray-600">
                          <span>الدرجة الكاملة: {exam.maxScore}</span>
                          <span>
                            من {new Date(exam.startDate).toLocaleDateString('ar-SA')} {new Date(exam.startDate).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })}
                            {' '}إلى {new Date(exam.endDate).toLocaleDateString('ar-SA')} {new Date(exam.endDate).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>
                      <span className={`px-4 py-2 rounded-lg font-semibold ${
                        isActive ? 'bg-yellow-100 text-yellow-800' :
                        isUpcoming ? 'bg-blue-100 text-blue-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {isActive ? 'متاح الآن' : isUpcoming ? 'قادم' : 'منتهي'}
                      </span>
                    </div>
                    {isActive && (
                      <Link
                        href={`/dashboard/exams/${exam.id}/take`}
                        className="inline-block px-6 py-3 bg-primary text-white rounded-lg font-bold hover:bg-primary-dark transition"
                      >
                        بدء الامتحان
                      </Link>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Homework Section */}
        {isEnrolled && course.homeworks && course.homeworks.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-8 mb-8">
            <h2 className="text-2xl font-bold mb-6 text-gray-800">الواجبات</h2>
            <div className="space-y-4">
              {course.homeworks.map((homework) => {
                const now = new Date();
                const due = new Date(homework.dueDate);
                const isOverdue = now > due;
                
                return (
                  <div key={homework.id} className="border-2 border-gray-200 rounded-lg p-6 hover:border-primary transition bg-white">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-xl font-bold mb-2 text-gray-800">{homework.title}</h3>
                        <p className="text-gray-700 mb-2">{homework.description}</p>
                        <div className="flex gap-4 text-sm text-gray-600">
                          <span>الدرجة الكاملة: {homework.maxScore}</span>
                          <span className={isOverdue ? 'text-red-700 font-bold' : 'text-gray-600'}>
                            موعد التسليم: {new Date(homework.dueDate).toLocaleDateString('ar-SA')}
                          </span>
                        </div>
                      </div>
                      {isOverdue && (
                        <span className="px-4 py-2 bg-red-100 text-red-800 rounded-lg font-semibold">
                          متأخر
                        </span>
                      )}
                    </div>
                    <Link
                      href={`/dashboard/homework/${homework.id}/submit`}
                      className="inline-block px-6 py-3 bg-primary text-white rounded-lg font-bold hover:bg-primary-dark transition"
                    >
                      {isOverdue ? 'تسليم الواجب (متأخر)' : 'تسليم الواجب'}
                    </Link>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Modules and Lessons */}
        <div className="bg-white rounded-lg shadow-md p-8">
          <h2 className="text-2xl font-bold mb-6">محتوى الدورة</h2>
          {course.modules.map((module) => (
            <div key={module.id} className="mb-8">
              <h3 className="text-xl font-bold mb-4 text-gray-800">{module.title}</h3>
              <div className="space-y-2">
                {module.lessons.map((lesson) => (
                  <div
                    key={lesson.id}
                    className="flex justify-between items-center p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition"
                  >
                    <div className="flex items-center gap-4">
                      <span className="text-gray-600">{lesson.order}</span>
                      <div>
                        <h4 className="font-semibold text-gray-800">{lesson.title}</h4>
                        {lesson.durationMinutes && (
                          <p className="text-sm text-gray-600">
                            {lesson.durationMinutes} دقيقة
                          </p>
                        )}
                      </div>
                    </div>
                    {isEnrolled ? (
                      <Link
                        href={`/courses/${course.id}/lessons/${lesson.id}`}
                        className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition"
                      >
                        مشاهدة
                      </Link>
                    ) : (
                      <span className="text-gray-400">سجل للوصول</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

