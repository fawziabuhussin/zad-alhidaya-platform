'use client';

import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import useSWR from 'swr';
import api from '@/lib/api';
import { StarIcon, ChartIcon, FilterIcon } from '@/components/Icons';
import { GradeItemSkeleton, StatCardSkeleton, FilterSkeleton } from '@/components/Skeleton';
import { Pagination, PaginationInfo, PaginatedResponse } from '@/components/Pagination';
import { navigateTo } from '@/lib/navigation';
import { formatDate } from '@/lib/utils';

interface Grade {
  id: string;
  type: string;
  score: number;
  maxScore: number;
  percentage: number;
  letterGrade: string;
  createdAt: string;
  course: { id: string; title: string; coverImage?: string };
}

interface PaginatedGradesResponse {
  grades: PaginatedResponse<Grade>;
  gpa: string;
}

// SWR fetcher
const fetcher = async (url: string) => {
  const response = await api.get(url);
  return response.data;
};

// Items per page
const ITEMS_PER_PAGE = 10;

export default function StudentGradesPage() {
  const router = useRouter();
  const [filter, setFilter] = useState({ courseId: '', type: '' });
  const [currentPage, setCurrentPage] = useState(1);
  const [userId, setUserId] = useState<string | null>(null);

  // Get user ID from localStorage on mount
  useEffect(() => {
    const userStr = localStorage.getItem('user');
    const user = userStr ? JSON.parse(userStr) : null;
    if (!user) {
      navigateTo('/login', router);
      return;
    }
    setUserId(user.id);
  }, [router]);

  // Fetch grades with SWR (cached) - now with pagination
  const gradesUrl = useMemo(() => {
    if (!userId) return null;
    return `/grades/student/${userId}?page=${currentPage}&limit=${ITEMS_PER_PAGE}`;
  }, [userId, currentPage]);

  const { data, isLoading } = useSWR<PaginatedGradesResponse>(
    gradesUrl,
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 5000,
    }
  );

  const grades = data?.grades?.data || [];
  const pagination = data?.grades?.pagination;
  const totalPages = pagination?.totalPages || 1;
  const totalGrades = pagination?.total || grades.length;
  const gpa = data?.gpa || '0.00';
  const loading = isLoading || !userId;

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const getGradeColor = (grade: string) => {
    if (grade.startsWith('A')) return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    if (grade.startsWith('B')) return 'bg-sky-50 text-sky-700 border-sky-200';
    if (grade.startsWith('C')) return 'bg-amber-50 text-amber-700 border-amber-200';
    if (grade === 'D') return 'bg-orange-50 text-orange-700 border-orange-200';
    return 'bg-red-50 text-red-700 border-red-200';
  };

  const getTypeLabel = (type: string) => {
    const labels: { [key: string]: string } = {
      EXAM: 'امتحان',
      HOMEWORK: 'واجب',
      QUIZ: 'اختبار',
      FINAL: 'نهائي',
    };
    return labels[type] || type;
  };

  // Client-side filtering on current page's data (for full filtering, would need API support)
  const filteredGrades = useMemo(() => {
    return grades.filter(grade => {
      if (filter.courseId && grade.course.id !== filter.courseId) return false;
      if (filter.type && grade.type !== filter.type) return false;
      return true;
    });
  }, [grades, filter]);

  // Reset page when filter changes
  const handleFilterChange = (newFilter: typeof filter) => {
    setFilter(newFilter);
    setCurrentPage(1);
  };

  const uniqueCourses = useMemo(() => {
    return Array.from(new Set(grades.map(g => g.course.id)))
      .map(id => grades.find(g => g.course.id === id)?.course)
      .filter(Boolean) as any[];
  }, [grades]);

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-50">
        {/* Header Skeleton */}
        <div className="bg-gradient-to-l from-[#1a3a2f] via-[#1f4a3d] to-[#0d2b24] text-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/10 rounded-lg animate-pulse" />
              <div>
                <div className="h-6 bg-white/20 rounded w-28 mb-1 animate-pulse" />
                <div className="h-4 bg-white/10 rounded w-16 animate-pulse" />
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {/* Statistics Skeleton */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            {[...Array(3)].map((_, i) => (
              <StatCardSkeleton key={i} />
            ))}
          </div>

          {/* Filter Skeleton */}
          <FilterSkeleton />

          {/* Grade Items Skeleton */}
          <div className="space-y-4">
            {[...Array(4)].map((_, i) => (
              <GradeItemSkeleton key={i} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Calculate statistics
  const avgPercentage = filteredGrades.length > 0
    ? filteredGrades.reduce((sum, g) => sum + g.percentage, 0) / filteredGrades.length
    : 0;

  return (
    <div className="min-h-screen bg-stone-50">
      {/* Header */}
      <div className="bg-gradient-to-l from-[#1a3a2f] via-[#1f4a3d] to-[#0d2b24] text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center">
              <StarIcon className="text-white" size={20} />
            </div>
            <div>
              <h1 className="text-xl font-bold">التقييمات والدرجات</h1>
              <p className="text-white/70 text-sm">{grades.length} تقييم</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Statistics */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow-sm border border-stone-100 p-5">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-stone-100 rounded-lg flex items-center justify-center">
                <ChartIcon className="text-stone-600" size={22} />
              </div>
              <div>
                <p className="text-3xl font-bold text-stone-800">{gpa}</p>
                <p className="text-stone-500 text-sm">المتوسط التراكمي (GPA)</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-stone-100 p-5">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-stone-100 rounded-lg flex items-center justify-center">
                <StarIcon className="text-stone-600" size={22} />
              </div>
              <div>
                <p className="text-3xl font-bold text-stone-800">{avgPercentage.toFixed(1)}%</p>
                <p className="text-stone-500 text-sm">المتوسط العام</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-stone-100 p-5">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-stone-100 rounded-lg flex items-center justify-center">
                <FilterIcon className="text-stone-600" size={22} />
              </div>
              <div>
                <p className="text-3xl font-bold text-stone-800">{filteredGrades.length}</p>
                <p className="text-stone-500 text-sm">إجمالي التقييمات</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-stone-100 p-5 mb-6">
          <h2 className="text-lg font-bold mb-4 text-stone-800">التصفية</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2 text-stone-700">الدورة</label>
              <select
                value={filter.courseId}
                onChange={(e) => handleFilterChange({ ...filter, courseId: e.target.value })}
                className="w-full px-4 py-2.5 border border-stone-200 rounded-lg focus:ring-2 focus:ring-[#1a3a2f]/20 focus:border-[#1a3a2f] text-stone-800 bg-white"
              >
                <option value="">جميع الدورات</option>
                {uniqueCourses.map((course) => (
                  <option key={course.id} value={course.id}>{course.title}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2 text-stone-700">النوع</label>
              <select
                value={filter.type}
                onChange={(e) => handleFilterChange({ ...filter, type: e.target.value })}
                className="w-full px-4 py-2.5 border border-stone-200 rounded-lg focus:ring-2 focus:ring-[#1a3a2f]/20 focus:border-[#1a3a2f] text-stone-800 bg-white"
              >
                <option value="">جميع الأنواع</option>
                <option value="EXAM">امتحان</option>
                <option value="HOMEWORK">واجب</option>
                <option value="QUIZ">اختبار</option>
                <option value="FINAL">نهائي</option>
              </select>
            </div>
          </div>
        </div>

        {/* Grades List */}
        {filteredGrades.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-stone-100 p-12 text-center">
            <div className="w-16 h-16 bg-stone-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <StarIcon className="text-stone-600" size={32} />
            </div>
            <h3 className="text-xl font-bold text-stone-800 mb-2">لا توجد تقييمات</h3>
            <p className="text-stone-500">أكمل الامتحانات والواجبات لعرض درجاتك</p>
          </div>
        ) : (
          <>
            {/* Results count */}
            <div className="mb-4">
              <PaginationInfo
                currentPage={currentPage}
                limit={ITEMS_PER_PAGE}
                total={totalGrades}
                itemName="تقييم"
              />
            </div>

            <div className="space-y-4">
              {filteredGrades.map((grade) => (
                <div key={grade.id} className="bg-white rounded-xl shadow-sm border border-stone-100 p-5">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                    <div className="w-16 h-16 rounded-lg overflow-hidden bg-[#1a3a2f] shrink-0 relative">
                      {grade.course.coverImage ? (
                        <Image
                          src={grade.course.coverImage}
                          alt={grade.course.title}
                          fill
                          className="object-cover"
                          sizes="64px"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-white text-xl font-bold">
                          {grade.course.title.charAt(0)}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-bold text-stone-800 truncate">{grade.course.title}</h3>
                      <p className="text-stone-500">{getTypeLabel(grade.type)}</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className={`px-4 py-2 rounded-lg border ${getGradeColor(grade.letterGrade)}`}>
                        <p className="text-2xl font-bold">{grade.letterGrade}</p>
                        <p className="text-sm font-medium">{grade.percentage.toFixed(1)}%</p>
                      </div>
                      <div className="text-left">
                        <p className="text-lg font-bold text-stone-800">
                          {grade.score} / {grade.maxScore}
                        </p>
                        <p className="text-sm text-stone-500">
                          {formatDate(grade.createdAt)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={handlePageChange}
                className="mt-8"
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}

