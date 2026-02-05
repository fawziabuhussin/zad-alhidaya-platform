'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import api from '@/lib/api';
import { BookIcon, PlusIcon, EditIcon, TrashIcon, SearchIcon, GraduateIcon } from '@/components/Icons';
import { showSuccess, showError, TOAST_MESSAGES } from '@/lib/toast';

interface Course {
  id: string;
  title: string;
  description: string;
  coverImage?: string;
  status: string;
  price?: number;
  category: { id: string; title: string };
  teacher: { name: string };
  _count: { enrollments: number };
  createdAt: string;
}

export default function AdminCoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const searchParams = useSearchParams();
  const selectedCategoryId = searchParams.get('categoryId') || '';

  useEffect(() => {
    loadCourses();
  }, []);

  const loadCourses = async () => {
    try {
      const response = await api.get('/courses/admin');
      setCourses(response.data || []);
    } catch (error) {
      console.error('Failed to load courses:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذه الدورة؟')) return;

    try {
      await api.delete(`/courses/${id}`);
      setCourses(courses.filter(c => c.id !== id));
      showSuccess(TOAST_MESSAGES.DELETE_SUCCESS);
    } catch (error: any) {
      showError(error.response?.data?.message || 'فشل حذف الدورة');
    }
  };

  const filteredCourses = useMemo(() => {
    const searchValue = search.toLowerCase();
    return courses.filter((course) => {
      if (selectedCategoryId && course.category?.id !== selectedCategoryId) {
        return false;
      }
      return (
        course.title.toLowerCase().includes(searchValue) ||
        course.description.toLowerCase().includes(searchValue)
      );
    });
  }, [courses, search, selectedCategoryId]);

  const selectedCategoryTitle = useMemo(() => {
    if (!selectedCategoryId) return '';
    return courses.find((course) => course.category?.id === selectedCategoryId)?.category?.title || '';
  }, [courses, selectedCategoryId]);

  const stats = {
    total: courses.length,
    published: courses.filter(c => c.status === 'PUBLISHED').length,
    draft: courses.filter(c => c.status === 'DRAFT').length,
    totalStudents: courses.reduce((sum, c) => sum + (c._count?.enrollments || 0), 0),
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center">
                <BookIcon size={24} />
              </div>
              <div>
                <h1 className="text-xl md:text-2xl font-bold">إدارة الدورات</h1>
                <p className="text-white/70 text-sm">{stats.total} دورة</p>
              </div>
            </div>
            <Link
              href="/admin/courses/create"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#c9a227] text-white rounded-xl font-bold hover:bg-[#b08f20] transition-all shadow-lg"
            >
              <PlusIcon size={18} />
              دورة جديدة
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl p-4 shadow-sm border border-stone-100">
            <p className="text-2xl font-bold text-[#1a3a2f]">{stats.total}</p>
            <p className="text-sm text-stone-500">إجمالي الدورات</p>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-stone-100">
            <p className="text-2xl font-bold text-emerald-600">{stats.published}</p>
            <p className="text-sm text-stone-500">منشورة</p>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-stone-100">
            <p className="text-2xl font-bold text-stone-500">{stats.draft}</p>
            <p className="text-sm text-stone-500">مسودات</p>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-stone-100">
            <p className="text-2xl font-bold text-sky-600">{stats.totalStudents}</p>
            <p className="text-sm text-stone-500">إجمالي التسجيلات</p>
          </div>
        </div>

        {/* Search */}
        <div className="bg-white rounded-xl shadow-sm border border-stone-100 p-4 mb-6 space-y-3">
          {selectedCategoryId && (
            <div className="flex flex-wrap items-center gap-3">
              <span className="px-3 py-1.5 rounded-lg bg-amber-50 text-amber-800 text-sm font-medium">
                الفئة: {selectedCategoryTitle || 'مختارة'}
              </span>
              <Link
                href="/admin/courses"
                className="text-sm text-stone-600 hover:text-stone-800 transition"
              >
                إظهار كل الدورات
              </Link>
            </div>
          )}
          <div className="relative">
            <SearchIcon size={18} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-stone-400" />
            <input
              type="text"
              placeholder="ابحث عن دورة..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pr-10 pl-4 py-2.5 border border-stone-200 rounded-lg focus:ring-2 focus:ring-[#1a3a2f]/20 focus:border-[#1a3a2f] text-stone-800 bg-white transition-all"
            />
          </div>
        </div>

        {/* Courses Table */}
        <div className="bg-white rounded-xl shadow-sm border border-stone-100 overflow-hidden">
          {filteredCourses.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-stone-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <BookIcon size={32} className="text-stone-400" />
              </div>
              <p className="text-stone-500 text-lg mb-4">لا توجد دورات</p>
              <Link
                href="/admin/courses/create"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#1a3a2f] text-white rounded-xl font-bold hover:bg-[#143026] transition"
              >
                <PlusIcon size={18} />
                إنشاء دورة جديدة
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-stone-50 border-b border-stone-200">
                  <tr>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-stone-600 uppercase tracking-wider">الدورة</th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-stone-600 uppercase tracking-wider hidden md:table-cell">الفئة</th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-stone-600 uppercase tracking-wider hidden lg:table-cell">المدرس</th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-stone-600 uppercase tracking-wider">الحالة</th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-stone-600 uppercase tracking-wider hidden sm:table-cell">التسجيلات</th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-stone-600 uppercase tracking-wider">الإجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {filteredCourses.map((course) => (
                    <tr key={course.id} className="hover:bg-stone-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-[#1a3a2f] to-[#2d5a4a] rounded-lg flex items-center justify-center text-white font-bold text-sm overflow-hidden">
                            {course.coverImage ? (
                              <img src={course.coverImage} alt={course.title} className="w-full h-full object-cover" />
                            ) : (
                              course.title.charAt(0)
                            )}
                          </div>
                          <div>
                            <h3 className="font-semibold text-stone-800 line-clamp-1">{course.title}</h3>
                            <p className="text-sm text-stone-500 line-clamp-1 hidden sm:block">{course.description}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-stone-600 hidden md:table-cell">{course.category?.title || 'بدون فئة'}</td>
                      <td className="px-6 py-4 text-sm text-stone-600 hidden lg:table-cell">{course.teacher?.name || 'غير محدد'}</td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1.5 rounded-lg text-xs font-medium ${
                          course.status === 'PUBLISHED' 
                            ? 'bg-emerald-100 text-emerald-700' 
                            : 'bg-stone-100 text-stone-600'
                        }`}>
                          {course.status === 'PUBLISHED' ? 'منشور' : 'مسودة'}
                        </span>
                      </td>
                      <td className="px-6 py-4 hidden sm:table-cell">
                        <div className="flex items-center gap-1 text-stone-600">
                          <GraduateIcon size={14} />
                          <span className="text-sm font-medium">{course._count?.enrollments || 0}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          <Link
                            href={`/admin/courses/${course.id}/edit`}
                            className="p-2 bg-sky-50 text-sky-600 rounded-lg hover:bg-sky-100 transition"
                            title="تعديل"
                          >
                            <EditIcon size={16} />
                          </Link>
                          <button
                            onClick={() => handleDelete(course.id)}
                            className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition"
                            title="حذف"
                          >
                            <TrashIcon size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

