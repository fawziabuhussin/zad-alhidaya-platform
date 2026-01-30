'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import { BookIcon, ExamIcon, HomeworkIcon, StarIcon, PlayIcon } from '@/components/Icons';

interface Enrollment {
  id: string;
  course: {
    id: string;
    title: string;
    coverImage?: string;
    modules: Array<{
      lessons: Array<{ id: string }>;
    }>;
  };
}

export default function DashboardPage() {
  const router = useRouter();
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [userRes, enrollmentsRes] = await Promise.all([
        api.get('/auth/me'),
        api.get('/enrollments/my-enrollments'),
      ]);
      setUser(userRes.data);
      setEnrollments(enrollmentsRes.data);
    } catch (error) {
      router.push('/login');
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

  const totalLessons = enrollments.reduce((sum, e) => 
    sum + e.course.modules.reduce((s, m) => s + m.lessons.length, 0), 0
  );

  return (
    <div className="min-h-screen bg-stone-50">
      {/* Welcome Header */}
      <div className="bg-gradient-to-l from-[#1a3a2f] via-[#1f4a3d] to-[#0d2b24] text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold mb-2">مرحباً، {user?.name}</h1>
              <p className="text-white/70">تابع رحلتك في طلب العلم الشرعي</p>
            </div>
            <Link
              href="/courses"
              className="inline-flex items-center gap-2 px-6 py-3 bg-[#c9a227] text-white rounded-xl font-bold hover:bg-[#b08f20] transition-all shadow-lg"
            >
              <BookIcon size={20} />
              تصفح الدورات
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl p-4 md:p-6 shadow-sm border border-stone-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 md:w-12 md:h-12 bg-stone-100 rounded-lg flex items-center justify-center">
                <BookIcon className="text-stone-600" size={20} />
              </div>
              <div>
                <p className="text-2xl md:text-3xl font-bold text-stone-800">{enrollments.length}</p>
                <p className="text-xs md:text-sm text-stone-500">دوراتي</p>
              </div>
            </div>
          </div>
          <Link href="/dashboard/exams" className="group bg-white rounded-xl p-4 md:p-6 shadow-sm border border-stone-100 hover:border-[#c9a227]/30 transition-all">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 md:w-12 md:h-12 bg-stone-100 rounded-lg flex items-center justify-center group-hover:bg-stone-200 transition-colors">
                <ExamIcon className="text-stone-600" size={20} />
              </div>
              <div>
                <p className="text-lg font-bold text-stone-800">الامتحانات</p>
                <p className="text-xs md:text-sm text-stone-500">عرض الكل</p>
              </div>
            </div>
          </Link>
          <Link href="/dashboard/homework" className="group bg-white rounded-xl p-4 md:p-6 shadow-sm border border-stone-100 hover:border-[#c9a227]/30 transition-all">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 md:w-12 md:h-12 bg-stone-100 rounded-lg flex items-center justify-center group-hover:bg-stone-200 transition-colors">
                <HomeworkIcon className="text-stone-600" size={20} />
              </div>
              <div>
                <p className="text-lg font-bold text-stone-800">الواجبات</p>
                <p className="text-xs md:text-sm text-stone-500">عرض الكل</p>
              </div>
            </div>
          </Link>
          <Link href="/dashboard/grades" className="group bg-white rounded-xl p-4 md:p-6 shadow-sm border border-stone-100 hover:border-[#c9a227]/30 transition-all">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 md:w-12 md:h-12 bg-stone-100 rounded-lg flex items-center justify-center group-hover:bg-stone-200 transition-colors">
                <StarIcon className="text-stone-600" size={20} />
              </div>
              <div>
                <p className="text-lg font-bold text-stone-800">التقييمات</p>
                <p className="text-xs md:text-sm text-stone-500">عرض الكل</p>
              </div>
            </div>
          </Link>
        </div>

        {/* Section Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-stone-800">دوراتي المسجلة</h2>
        </div>

        {/* Courses Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {enrollments.length === 0 ? (
            <div className="col-span-full">
              <div className="bg-white rounded-2xl shadow-sm border border-stone-100 p-12 text-center">
                <div className="w-16 h-16 bg-[#1a3a2f]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <BookIcon className="text-[#1a3a2f]" size={32} />
                </div>
                <h3 className="text-xl font-bold text-stone-800 mb-2">لم تسجل في أي دورة بعد</h3>
                <p className="text-stone-500 mb-6">ابدأ رحلتك في طلب العلم الشرعي الآن</p>
                <Link
                  href="/courses"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-[#1a3a2f] text-white rounded-xl font-bold hover:bg-[#143026] transition"
                >
                  <BookIcon size={18} />
                  تصفح الدورات المتاحة
                </Link>
              </div>
            </div>
          ) : (
            enrollments.map((enrollment) => {
              const totalLessons = enrollment.course.modules.reduce(
                (sum, module) => sum + module.lessons.length,
                0
              );

              return (
                <Link
                  key={enrollment.id}
                  href={`/courses/${enrollment.course.id}`}
                  className="group bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-lg transition-all duration-300 border border-stone-100"
                >
                  <div className="h-40 md:h-44 bg-gradient-to-br from-[#1a3a2f] to-[#2d5a4a] relative">
                    {enrollment.course.coverImage ? (
                      <img
                        src={enrollment.course.coverImage}
                        alt={enrollment.course.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-white text-3xl font-bold">
                        {enrollment.course.title.charAt(0)}
                      </div>
                    )}
                    {/* Play overlay on hover */}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                        <PlayIcon className="text-white" size={28} />
                      </div>
                    </div>
                  </div>
                  <div className="p-5">
                    <h3 className="text-lg font-bold text-stone-800 mb-3 group-hover:text-[#1a3a2f] transition-colors line-clamp-1">
                      {enrollment.course.title}
                    </h3>
                    <div className="mb-4">
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-stone-500">التقدم</span>
                        <span className="text-stone-600 font-medium">{totalLessons} درس</span>
                      </div>
                      <div className="w-full bg-stone-100 rounded-full h-2">
                        <div className="bg-[#c9a227] h-2 rounded-full transition-all" style={{ width: '0%' }}></div>
                      </div>
                    </div>
                    <div className="flex items-center justify-center gap-2 py-2.5 bg-[#1a3a2f] text-white rounded-lg font-medium group-hover:bg-[#143026] transition-colors">
                      <PlayIcon size={16} />
                      متابعة التعلم
                    </div>
                  </div>
                </Link>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

