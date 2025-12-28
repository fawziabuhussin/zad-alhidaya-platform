'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';

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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8">
        <h1 className="text-2xl md:text-3xl font-bold mb-6 md:mb-8 text-gray-800">
          مرحباً، {user?.name}
        </h1>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {enrollments.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <p className="text-gray-500 text-lg mb-4">لم تسجل في أي دورة بعد</p>
              <Link
                href="/courses"
                className="inline-block px-6 py-3 bg-primary text-white rounded-lg font-bold hover:bg-primary-dark transition"
              >
                تصفح الدورات
              </Link>
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
                  className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition block"
                >
                  <div className="h-40 md:h-48 bg-gradient-to-br from-primary to-primary-light relative">
                    {enrollment.course.coverImage ? (
                      <img
                        src={enrollment.course.coverImage}
                        alt={enrollment.course.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-white text-2xl font-bold">
                        {enrollment.course.title.charAt(0)}
                      </div>
                    )}
                  </div>
                  <div className="p-4 md:p-6">
                    <h3 className="text-lg md:text-xl font-bold mb-2 text-gray-800">{enrollment.course.title}</h3>
                    <div className="mt-4">
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-gray-700">التقدم</span>
                        <span className="text-gray-700">{totalLessons} درس</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className="bg-primary h-2 rounded-full" style={{ width: '0%' }}></div>
                      </div>
                    </div>
                    <button className="mt-4 w-full px-4 py-3 bg-primary text-white rounded-lg hover:bg-primary-dark transition text-lg font-semibold">
                      متابعة التعلم
                    </button>
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

