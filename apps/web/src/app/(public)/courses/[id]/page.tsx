'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import { CheckCircleIcon, BookIcon, UserIcon, ClockIcon, AlertIcon } from '@/components/Icons';
import { Resource } from '@/types/resource';
import { ResourceList } from '@/components/resources';
import ExpandableLessonCard from '@/components/ExpandableLessonCard';

interface PrerequisiteStatus {
  prerequisite: { id: string; title: string };
  status: 'not_enrolled' | 'enrolled' | 'completed';
  isCompleted: boolean;
}

interface Course {
  id: string;
  title: string;
  description: string;
  coverImage?: string;
  price?: number;
  category: { title: string };
  teacher: { name: string };
  resources?: Resource[];
  prerequisites?: PrerequisiteStatus[];
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
      resources?: Resource[];
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
  const [progress, setProgress] = useState<{ 
    percentage: number; 
    completedLessons: number; 
    totalLessons: number;
    completedLessonIds?: string[];
  } | null>(null);
  const [completedLessonIds, setCompletedLessonIds] = useState<Set<string>>(new Set());

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
      
      if (response.data.enrollments && response.data.enrollments.length > 0 && token) {
        try {
          const progressRes = await api.get(`/progress/courses/${params.id}`);
          setProgress(progressRes.data);
          const completedIds = new Set<string>(progressRes.data.completedLessonIds || []);
          setCompletedLessonIds(completedIds);
        } catch (e) {
          const totalLessons = response.data.modules?.reduce((sum: number, m: any) => sum + (m.lessons?.length || 0), 0) || 0;
          setProgress({ percentage: 0, completedLessons: 0, totalLessons });
          setCompletedLessonIds(new Set());
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
      // UI updates automatically - button changes to "مسجل في الدورة"
    } catch (error: any) {
      alert(error.response?.data?.message || 'فشل التسجيل في الدورة');
    } finally {
      setEnrolling(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1a3a2f]"></div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <div className="bg-white rounded-xl border border-stone-200 p-8 text-center">
          <p className="text-stone-600 mb-4">الدورة غير موجودة</p>
          <Link href="/courses" className="text-[#1a3a2f] hover:underline">
            العودة إلى قائمة الدورات
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50">
      {/* Course Header */}
      <div className="bg-gradient-to-l from-[#1a3a2f] via-[#1f4a3d] to-[#0d2b24] text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <span className="px-3 py-1 bg-white/10 rounded-lg text-sm">
                  {course.category.title}
                </span>
                <span className={`px-3 py-1 rounded-lg text-sm font-medium ${
                  course.price === 0 || !course.price 
                    ? 'bg-emerald-500/20 text-emerald-200' 
                    : 'bg-white/10'
                }`}>
                  {course.price === 0 || !course.price ? 'مجاني' : `${course.price} ر.س`}
                </span>
              </div>
              <h1 className="text-2xl md:text-3xl font-bold mb-3">{course.title}</h1>
              <p className="text-white/80 mb-4">{course.description}</p>
              <div className="flex items-center gap-4 text-sm text-white/70">
                <span className="flex items-center gap-1">
                  <UserIcon size={14} />
                  {course.teacher.name}
                </span>
                <span className="flex items-center gap-1">
                  <BookIcon size={14} />
                  {course.modules.reduce((sum, m) => sum + m.lessons.length, 0)} درس
                </span>
              </div>
            </div>
            
            <div className="flex-shrink-0">
              {!isEnrolled ? (() => {
                const hasPrerequisites = course.prerequisites && course.prerequisites.length > 0;
                const allPrereqsCompleted = !hasPrerequisites || course.prerequisites!.every((p) => p.isCompleted);
                const canEnroll = allPrereqsCompleted;
                
                return canEnroll ? (
                  <button
                    onClick={handleEnroll}
                    disabled={enrolling}
                    className="px-6 py-3 bg-white text-[#1a3a2f] rounded-lg font-bold hover:bg-stone-100 transition disabled:opacity-50"
                  >
                    {enrolling ? 'جاري التسجيل...' : 'سجل في الدورة'}
                  </button>
                ) : (
                  <div className="relative group">
                    <button
                      disabled
                      className="px-6 py-3 bg-white/30 text-white/70 rounded-lg font-bold cursor-not-allowed"
                    >
                      سجل في الدورة
                    </button>
                    <div className="absolute top-full right-0 mt-2 px-4 py-3 bg-white text-stone-800 text-sm rounded-lg shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 min-w-[200px]">
                      <p className="font-bold mb-1">أكمل المتطلبات السابقة أولاً</p>
                      <p className="text-xs text-stone-500">راجع قائمة المتطلبات أدناه</p>
                      <div className="absolute bottom-full right-6 border-8 border-transparent border-b-white"></div>
                    </div>
                  </div>
                );
              })() : (
                <span className="px-6 py-3 bg-emerald-500/20 text-emerald-200 rounded-lg font-bold flex items-center gap-2">
                  <CheckCircleIcon size={18} />
                  مسجل في الدورة
                </span>
              )}
            </div>
          </div>
          {course.prerequisites && course.prerequisites.length > 0 && (() => {
            const allCompleted = course.prerequisites.every((p) => p.isCompleted);
            const completedCount = course.prerequisites.filter((p) => p.isCompleted).length;
            
            return (
              <div className={`mt-6 rounded-lg p-4 border ${
                allCompleted 
                  ? 'bg-emerald-500/10 border-emerald-400/30' 
                  : 'bg-white/10 border-white/20'
              }`}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2 text-sm font-semibold">
                    {allCompleted ? (
                      <CheckCircleIcon size={16} className="text-emerald-400" />
                    ) : (
                      <AlertIcon size={16} />
                    )}
                    المساقات السابقة المطلوبة
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    allCompleted 
                      ? 'bg-emerald-500/20 text-emerald-300' 
                      : 'bg-white/10 text-white/70'
                  }`}>
                    {completedCount} / {course.prerequisites.length} مكتمل
                  </span>
                </div>
                
                {!allCompleted && (
                  <p className="text-sm text-white/70 mb-3">
                    يجب إكمال المساقات التالية والنجاح بنسبة 60% على الأقل قبل التسجيل.
                  </p>
                )}
                
                <div className="space-y-2">
                  {course.prerequisites.map((prereq) => (
                    <div 
                      key={prereq.prerequisite.id}
                      className={`flex items-center justify-between p-3 rounded-lg ${
                        prereq.isCompleted 
                          ? 'bg-emerald-500/10' 
                          : prereq.status === 'enrolled' 
                            ? 'bg-amber-500/10' 
                            : 'bg-white/5'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        {prereq.isCompleted ? (
                          <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center">
                            <CheckCircleIcon size={14} className="text-emerald-400" />
                          </div>
                        ) : prereq.status === 'enrolled' ? (
                          <div className="w-6 h-6 rounded-full bg-amber-500/20 flex items-center justify-center">
                            <ClockIcon size={14} className="text-amber-400" />
                          </div>
                        ) : (
                          <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center">
                            <BookIcon size={14} className="text-white/50" />
                          </div>
                        )}
                        <div>
                          <p className="text-sm font-medium text-white">{prereq.prerequisite.title}</p>
                          <p className={`text-xs ${
                            prereq.isCompleted 
                              ? 'text-emerald-400' 
                              : prereq.status === 'enrolled' 
                                ? 'text-amber-400' 
                                : 'text-white/50'
                          }`}>
                            {prereq.isCompleted 
                              ? 'مكتمل ✓' 
                              : prereq.status === 'enrolled' 
                                ? 'قيد الدراسة' 
                                : 'غير مسجل'}
                          </p>
                        </div>
                      </div>
                      
                      {!prereq.isCompleted && (
                        <Link
                          href={`/courses/${prereq.prerequisite.id}`}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                            prereq.status === 'enrolled'
                              ? 'bg-amber-500/20 text-amber-200 hover:bg-amber-500/30'
                              : 'bg-white/10 text-white hover:bg-white/20'
                          }`}
                        >
                          {prereq.status === 'enrolled' ? 'متابعة الدورة' : 'سجل الآن'}
                        </Link>
                      )}
                    </div>
                  ))}
                </div>
                
                {allCompleted && (
                  <p className="text-sm text-emerald-300 mt-3 flex items-center gap-2">
                    <CheckCircleIcon size={14} />
                    أنت مؤهل للتسجيل في هذه الدورة
                  </p>
                )}
              </div>
            );
          })()}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Progress Tracker */}
        {isEnrolled && progress && (
          <div className="bg-white rounded-xl border border-stone-200 p-6 mb-6">
            <div className="flex justify-between items-center mb-3">
              <div className="flex items-center gap-3">
                <h3 className="font-bold text-stone-800">تقدمك في الدورة</h3>
                {progress.percentage === 100 && (
                  <span className="px-3 py-1 bg-emerald-50 text-emerald-700 rounded-lg text-sm flex items-center gap-1">
                    <CheckCircleIcon size={14} /> مكتملة
                  </span>
                )}
              </div>
              <span className="text-2xl font-bold text-[#1a3a2f]">{progress.percentage}%</span>
            </div>
            <div className="w-full bg-stone-100 rounded-full h-3 mb-2">
              <div
                className={`h-3 rounded-full transition-all ${
                  progress.percentage === 100 ? 'bg-emerald-500' : 'bg-[#1a3a2f]'
                }`}
                style={{ width: `${progress.percentage}%` }}
              ></div>
            </div>
            <p className="text-sm text-stone-600">
              {progress.completedLessons} من {progress.totalLessons} درس مكتمل
            </p>
          </div>
        )}

        {/* Course Resources */}
        {isEnrolled && course.resources && course.resources.length > 0 && (
          <div className="bg-white rounded-xl border border-stone-200 p-6 mb-6">
            <h2 className="text-lg font-bold mb-4 text-stone-800">مواد الدورة</h2>
            <ResourceList resources={course.resources} showActions={false} />
          </div>
        )}

        {/* Exams Section */}
        {isEnrolled && course.exams && course.exams.length > 0 && (
          <div className="bg-white rounded-xl border border-stone-200 p-6 mb-6">
            <h2 className="text-lg font-bold mb-4 text-stone-800">الامتحانات</h2>
            <div className="space-y-3">
              {course.exams.map((exam) => {
                const now = new Date();
                const start = new Date(exam.startDate);
                const end = new Date(exam.endDate);
                const isActive = now >= start && now <= end;
                const isUpcoming = now < start;
                
                return (
                  <div key={exam.id} className="border border-stone-200 rounded-lg p-4 hover:border-stone-300 transition">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="font-bold text-stone-800 mb-1">{exam.title}</h3>
                        {exam.description && (
                          <p className="text-sm text-stone-600 mb-2">{exam.description}</p>
                        )}
                        <div className="flex flex-wrap gap-3 text-xs text-stone-500">
                          <span>الدرجة الكاملة: {exam.maxScore}</span>
                          <span>
                            من {new Date(exam.startDate).toLocaleDateString('ar-SA')} إلى {new Date(exam.endDate).toLocaleDateString('ar-SA')}
                          </span>
                        </div>
                      </div>
                      <span className={`px-3 py-1 rounded-lg text-xs font-medium ${
                        isActive ? 'bg-amber-50 text-amber-700' :
                        isUpcoming ? 'bg-stone-100 text-stone-600' :
                        'bg-stone-100 text-stone-500'
                      }`}>
                        {isActive ? 'متاح الآن' : isUpcoming ? 'قادم' : 'منتهي'}
                      </span>
                    </div>
                    {isActive && (
                      progress && progress.percentage === 100 ? (
                        <Link
                          href={`/dashboard/exams/${exam.id}/take`}
                          className="inline-block px-4 py-2 bg-[#1a3a2f] text-white rounded-lg text-sm hover:bg-[#2d5a4a] transition"
                        >
                          بدء الامتحان
                        </Link>
                      ) : (
                        <span className="inline-block px-4 py-2 bg-stone-100 text-stone-500 rounded-lg text-sm">
                          يجب إكمال جميع الدروس أولاً
                        </span>
                      )
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Homework Section */}
        {isEnrolled && course.homeworks && course.homeworks.length > 0 && (
          <div className="bg-white rounded-xl border border-stone-200 p-6 mb-6">
            <h2 className="text-lg font-bold mb-4 text-stone-800">الواجبات</h2>
            <div className="space-y-3">
              {course.homeworks.map((homework) => {
                const now = new Date();
                const due = new Date(homework.dueDate);
                const isOverdue = now > due;
                
                return (
                  <div key={homework.id} className="border border-stone-200 rounded-lg p-4 hover:border-stone-300 transition">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="font-bold text-stone-800 mb-1">{homework.title}</h3>
                        <p className="text-sm text-stone-600 mb-2">{homework.description}</p>
                        <div className="flex flex-wrap gap-3 text-xs text-stone-500">
                          <span>الدرجة الكاملة: {homework.maxScore}</span>
                          <span className={isOverdue ? 'text-red-600 font-medium' : ''}>
                            <ClockIcon size={12} className="inline ml-1" />
                            موعد التسليم: {new Date(homework.dueDate).toLocaleDateString('ar-SA')}
                          </span>
                        </div>
                      </div>
                      {isOverdue && (
                        <span className="px-3 py-1 bg-red-50 text-red-600 rounded-lg text-xs font-medium flex items-center gap-1">
                          <AlertIcon size={12} /> متأخر
                        </span>
                      )}
                    </div>
                    <Link
                      href={`/dashboard/homework/${homework.id}/submit`}
                      className="inline-block px-4 py-2 bg-[#1a3a2f] text-white rounded-lg text-sm hover:bg-[#2d5a4a] transition"
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
        <div className="bg-white rounded-xl border border-stone-200 p-6">
          <h2 className="text-lg font-bold mb-4 text-stone-800">محتوى الدورة</h2>
          {course.modules.map((module) => (
            <div key={module.id} className="mb-6 last:mb-0">
              <h3 className="font-bold text-stone-700 mb-3">{module.title}</h3>
              <div className="space-y-2">
                {module.lessons.map((lesson) => {
                  const isCompleted = completedLessonIds.has(lesson.id);
                  return (
                    <ExpandableLessonCard
                      key={lesson.id}
                      lesson={lesson}
                      isCompleted={isCompleted}
                      isEnrolled={isEnrolled}
                      courseId={course.id}
                    />
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
