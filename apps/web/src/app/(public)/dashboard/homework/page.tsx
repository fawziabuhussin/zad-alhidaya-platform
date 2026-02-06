'use client';

import { useEffect, useState, useMemo, useRef } from 'react';
import Link from 'next/link';
import useSWR from 'swr';
import api from '@/lib/api';
import { formatDate, formatTime } from '@/lib/utils';
import { CheckCircleIcon, HomeworkIcon, CalendarIcon, BookIcon, SearchIcon, ChevronLeftIcon, ChevronRightIcon } from '@/components/Icons';
import { HomeworkCardSkeleton, SearchBarSkeleton } from '@/components/Skeleton';

interface Homework {
  id: string;
  title: string;
  description: string;
  dueDate: string;
  maxScore: number;
  course: { title: string; id: string };
  submissions: Array<{ id: string; score: number; feedback: string }>;
}

// SWR fetcher
const fetcher = async (url: string) => {
  const response = await api.get(url);
  return response.data;
};

// Items per page
const ITEMS_PER_PAGE = 6;

export default function StudentHomeworkPage() {
  const [homeworks, setHomeworks] = useState<Homework[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [courseFilter, setCourseFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const hasLoadedOnce = useRef(false);

  // Use SWR to fetch enrollments with caching
  const { data: enrollments = [], isLoading: enrollmentsLoading } = useSWR(
    '/enrollments/my-enrollments',
    fetcher,
    {
      revalidateOnFocus: false,
      keepPreviousData: true,
      dedupingInterval: 10000,
      onError: () => [],
    }
  );

  // Extract courses from enrollments
  const courses = useMemo(() => {
    return enrollments.map((e: any) => e.course).filter((c: any) => c);
  }, [enrollments]);

  // Load homeworks for all courses IN PARALLEL
  useEffect(() => {
    if (enrollmentsLoading) return;
    
    if (courses.length === 0) {
      setHomeworks([]);
      setLoading(false);
      hasLoadedOnce.current = true;
      return;
    }

    const loadHomeworksParallel = async () => {
      try {
        const homeworkPromises = courses.map((course: any) =>
          api.get(`/homework/course/${course.id}`)
            .then(res => ({
              courseId: course.id,
              courseTitle: course.title || 'N/A',
              homeworks: res.data || [],
            }))
            .catch(() => ({
              courseId: course.id,
              courseTitle: course.title || 'N/A',
              homeworks: [],
            }))
        );

        const results = await Promise.all(homeworkPromises);

        const allHomeworks: Homework[] = [];
        for (const result of results) {
          if (result.homeworks && Array.isArray(result.homeworks)) {
            const homeworksWithCourse = result.homeworks.map((hw: any) => ({
              ...hw,
              course: { title: result.courseTitle, id: result.courseId },
            }));
            allHomeworks.push(...homeworksWithCourse);
          }
        }

        setHomeworks(allHomeworks);
      } catch (error: any) {
        console.error('Failed to load homeworks:', error);
        setHomeworks([]);
      } finally {
        setLoading(false);
        hasLoadedOnce.current = true;
      }
    };

    loadHomeworksParallel();
  }, [courses, enrollmentsLoading]);

  const getHomeworkStatus = (homework: Homework) => {
    const now = new Date();
    const due = new Date(homework.dueDate);
    const hasSubmission = homework.submissions && homework.submissions.length > 0;
    const isOverdue = now > due && !hasSubmission;

    if (hasSubmission) return { status: 'submitted', label: 'تم التسليم', color: 'bg-emerald-50 text-emerald-700' };
    if (isOverdue) return { status: 'overdue', label: 'متأخر', color: 'bg-red-50 text-red-700' };
    return { status: 'pending', label: 'قيد الانتظار', color: 'bg-amber-50 text-amber-700' };
  };

  // Filter homeworks based on search, status, and course
  const filteredHomeworks = useMemo(() => {
    return homeworks.filter((homework) => {
      // Search filter
      const matchesSearch = 
        homework.title.toLowerCase().includes(search.toLowerCase()) ||
        homework.course.title.toLowerCase().includes(search.toLowerCase());
      
      // Status filter
      const status = getHomeworkStatus(homework).status;
      const matchesStatus = statusFilter === 'all' || status === statusFilter;
      
      // Course filter
      const matchesCourse = courseFilter === 'all' || homework.course.id === courseFilter;
      
      return matchesSearch && matchesStatus && matchesCourse;
    });
  }, [homeworks, search, statusFilter, courseFilter]);

  // Pagination
  const totalPages = Math.ceil(filteredHomeworks.length / ITEMS_PER_PAGE);
  const paginatedHomeworks = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredHomeworks.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredHomeworks, currentPage]);

  // Reset page when filters change
  const handleSearchChange = (value: string) => {
    setSearch(value);
    setCurrentPage(1);
  };

  const handleStatusFilterChange = (value: string) => {
    setStatusFilter(value);
    setCurrentPage(1);
  };

  const handleCourseFilterChange = (value: string) => {
    setCourseFilter(value);
    setCurrentPage(1);
  };

  // Only show skeleton on truly fresh loads
  const showSkeleton = loading && !hasLoadedOnce.current && homeworks.length === 0;

  if (showSkeleton) {
    return (
      <div className="min-h-screen bg-stone-50">
        {/* Header Skeleton */}
        <div className="bg-gradient-to-l from-[#1a3a2f] via-[#1f4a3d] to-[#0d2b24] text-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/10 rounded-lg animate-pulse" />
              <div>
                <div className="h-6 bg-white/20 rounded w-24 mb-1 animate-pulse" />
                <div className="h-4 bg-white/10 rounded w-16 animate-pulse" />
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {/* Search Skeleton */}
          <SearchBarSkeleton />
          
          {/* Filter Tabs Skeleton */}
          <div className="flex flex-wrap gap-2 mb-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-9 bg-stone-200 rounded-lg animate-pulse" style={{ width: `${60 + i * 10}px` }} />
            ))}
          </div>

          {/* Homework Cards Grid Skeleton */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
            {[...Array(4)].map((_, i) => (
              <HomeworkCardSkeleton key={i} />
            ))}
          </div>
        </div>
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
              <HomeworkIcon className="text-white" size={20} />
            </div>
            <div>
              <h1 className="text-xl font-bold">الواجبات</h1>
              <p className="text-white/70 text-sm">
                {search || statusFilter !== 'all' || courseFilter !== 'all'
                  ? `${filteredHomeworks.length} من ${homeworks.length} واجب`
                  : `${homeworks.length} واجب`}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative">
            <SearchIcon className="absolute right-4 top-1/2 -translate-y-1/2 text-stone-400" size={20} />
            <input
              type="text"
              placeholder="ابحث عن واجب..."
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="w-full pl-4 pr-12 py-3 bg-white border border-stone-200 rounded-xl focus:ring-2 focus:ring-[#c9a227]/20 focus:border-[#c9a227] outline-none transition-all"
            />
          </div>

          {/* Filters Row */}
          <div className="flex flex-wrap items-center gap-4 mt-4">
            {/* Status Filter Tabs */}
            <div className="flex flex-wrap gap-2">
              {[
                { value: 'all', label: 'الكل' },
                { value: 'pending', label: 'قيد الانتظار' },
                { value: 'submitted', label: 'تم التسليم' },
                { value: 'overdue', label: 'متأخر' },
              ].map((tab) => (
                <button
                  key={tab.value}
                  onClick={() => handleStatusFilterChange(tab.value)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    statusFilter === tab.value
                      ? 'bg-[#1a3a2f] text-white'
                      : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Course Filter Dropdown */}
            {courses.length > 1 && (
              <select
                value={courseFilter}
                onChange={(e) => handleCourseFilterChange(e.target.value)}
                className="px-4 py-2 bg-white border border-stone-200 rounded-xl text-sm focus:ring-2 focus:ring-[#c9a227]/20 focus:border-[#c9a227] outline-none transition-all"
              >
                <option value="all">جميع الدورات</option>
                {courses.map((course: any) => (
                  <option key={course.id} value={course.id}>
                    {course.title}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>

        {homeworks.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-stone-100 p-12 text-center">
            <div className="w-16 h-16 bg-stone-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <HomeworkIcon className="text-stone-600" size={32} />
            </div>
            <h3 className="text-xl font-bold text-stone-800 mb-2">لا توجد واجبات متاحة</h3>
            <p className="text-stone-500 mb-6">سجل في دورات للوصول إلى الواجبات</p>
            <Link
              href="/courses"
              className="inline-flex items-center gap-2 px-6 py-3 bg-[#1a3a2f] text-white rounded-xl font-bold hover:bg-[#143026] transition"
            >
              <BookIcon size={18} />
              تصفح الدورات
            </Link>
          </div>
        ) : filteredHomeworks.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-stone-100 p-12 text-center">
            <div className="w-16 h-16 bg-stone-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <SearchIcon className="text-stone-400" size={32} />
            </div>
            <h3 className="text-xl font-bold text-stone-800 mb-2">لا توجد نتائج مطابقة</h3>
            <p className="text-stone-500 mb-6">جرب تغيير معايير البحث أو الفلتر</p>
            <button
              onClick={() => { setSearch(''); setStatusFilter('all'); setCourseFilter('all'); setCurrentPage(1); }}
              className="inline-flex items-center gap-2 px-6 py-3 bg-[#1a3a2f] text-white rounded-xl font-bold hover:bg-[#143026] transition"
            >
              إزالة الفلتر
            </button>
          </div>
        ) : (
          <>
            {/* Results count */}
            <div className="mb-4 text-sm text-stone-500">
              عرض {((currentPage - 1) * ITEMS_PER_PAGE) + 1} - {Math.min(currentPage * ITEMS_PER_PAGE, filteredHomeworks.length)} من {filteredHomeworks.length} واجب
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
              {paginatedHomeworks.map((homework) => {
                const hwStatus = getHomeworkStatus(homework);
                const hasSubmission = homework.submissions && homework.submissions.length > 0;
                const submission = hasSubmission ? homework.submissions[0] : null;

                return (
                  <div key={homework.id} className="bg-white rounded-xl shadow-sm border border-stone-100 p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h2 className="text-xl font-bold mb-1 text-stone-800">{homework.title}</h2>
                        <p className="text-stone-500">{homework.course.title}</p>
                      </div>
                      <span className={`px-3 py-1.5 rounded-lg font-medium text-sm ${hwStatus.color}`}>
                        {hwStatus.label}
                      </span>
                    </div>

                    <div className="mb-4">
                      <p className="text-stone-600 leading-relaxed line-clamp-2">{homework.description}</p>
                    </div>

                    <div className="space-y-2 mb-6 text-sm">
                      <div className="flex justify-between items-center py-2 border-b border-stone-100">
                        <span className="text-stone-500 flex items-center gap-2">
                          <CalendarIcon size={14} /> تاريخ الاستحقاق
                        </span>
                        <span className="font-medium text-stone-800">{formatDate(homework.dueDate)}</span>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b border-stone-100">
                        <span className="text-stone-500">الوقت</span>
                        <span className="font-medium text-stone-800">
                          {formatTime(homework.dueDate)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b border-stone-100">
                        <span className="text-stone-500">الدرجة الكاملة</span>
                        <span className="font-medium text-stone-800">{homework.maxScore}</span>
                      </div>
                      {submission && submission.score !== null && (
                        <div className="flex justify-between items-center pt-3">
                          <span className="font-bold text-stone-800">درجتك</span>
                          <span className="text-xl font-bold text-emerald-600">
                            {submission.score} / {homework.maxScore}
                          </span>
                        </div>
                      )}
                      {submission && submission.feedback && (
                        <div className="pt-3">
                          <p className="font-medium text-stone-700 mb-2">ملاحظات المدرس:</p>
                          <p className="text-stone-600 bg-stone-50 p-3 rounded-lg">{submission.feedback}</p>
                        </div>
                      )}
                    </div>

                    {!hasSubmission && (
                      <Link
                        href={`/dashboard/homework/${homework.id}/submit`}
                        className="block w-full py-3 bg-[#1a3a2f] text-white rounded-lg font-bold text-center hover:bg-[#143026] transition"
                      >
                        {hwStatus.status === 'overdue' ? 'تسليم متأخر' : 'تسليم الواجب'}
                      </Link>
                    )}

                    {hasSubmission && (
                      <div className="py-3 bg-emerald-50 text-emerald-700 rounded-lg text-center font-medium flex items-center justify-center gap-2">
                        <CheckCircleIcon size={18} /> تم تسليم الواجب
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="mt-8 flex items-center justify-center gap-2">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-2 rounded-lg border border-stone-200 bg-white text-stone-600 hover:bg-stone-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
                  aria-label="الصفحة السابقة"
                >
                  <ChevronRightIcon size={20} />
                </button>
                
                {/* Page numbers */}
                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter(page => {
                      if (page === 1 || page === totalPages) return true;
                      if (Math.abs(page - currentPage) <= 1) return true;
                      return false;
                    })
                    .map((page, index, arr) => {
                      const prevPage = arr[index - 1];
                      const showEllipsis = prevPage && page - prevPage > 1;
                      
                      return (
                        <span key={page} className="flex items-center">
                          {showEllipsis && (
                            <span className="px-2 text-stone-400">...</span>
                          )}
                          <button
                            onClick={() => setCurrentPage(page)}
                            className={`min-w-[40px] h-10 rounded-lg font-medium transition ${
                              currentPage === page
                                ? 'bg-[#1a3a2f] text-white'
                                : 'bg-white border border-stone-200 text-stone-600 hover:bg-stone-50'
                            }`}
                          >
                            {page}
                          </button>
                        </span>
                      );
                    })}
                </div>
                
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="p-2 rounded-lg border border-stone-200 bg-white text-stone-600 hover:bg-stone-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
                  aria-label="الصفحة التالية"
                >
                  <ChevronLeftIcon size={20} />
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
