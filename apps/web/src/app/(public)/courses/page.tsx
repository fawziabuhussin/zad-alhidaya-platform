'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import { BookIcon, UserIcon, SearchIcon } from '@/components/Icons';

interface Category {
  id: string;
  title: string;
}

interface Course {
  id: string;
  title: string;
  description: string;
  coverImage?: string;
  price?: number;
  category: { id: string; title: string };
  teacher: { name: string };
  _count: { enrollments: number };
}

export default function CoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [filtering, setFiltering] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');

  // Load categories on mount
  useEffect(() => {
    loadCategories();
  }, []);

  // Load courses when search or category changes
  useEffect(() => {
    loadCourses();
  }, [search, selectedCategory]);

  const loadCategories = async () => {
    try {
      const response = await api.get('/categories');
      setCategories(response.data || []);
    } catch (error: any) {
      console.error('[Courses] Failed to load categories:', error);
      setCategories([]);
    }
  };

  const loadCourses = async () => {
    try {
      // Only show filtering indicator after initial load
      if (!initialLoading) {
        setFiltering(true);
      }
      
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (selectedCategory) params.append('categoryId', selectedCategory);
      
      const url = `/courses/public${params.toString() ? `?${params.toString()}` : ''}`;
      const response = await api.get(url);
      setCourses(response.data || []);
    } catch (error: any) {
      console.error('[Courses] Failed to load courses:', error);
      setCourses([]);
    } finally {
      setInitialLoading(false);
      setFiltering(false);
    }
  };

  // Full-screen spinner only on initial load
  if (initialLoading) {
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center">
              <BookIcon className="text-white" size={20} />
            </div>
            <h1 className="text-2xl font-bold">الدورات المتاحة</h1>
          </div>
          
          {/* Search */}
          <div className="relative max-w-xl">
            <SearchIcon className="absolute right-4 top-1/2 -translate-y-1/2 text-stone-400" size={20} />
            <input
              type="text"
              placeholder="ابحث عن دورة..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pr-12 pl-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/30"
            />
          </div>

          {/* Category Filter */}
          {categories.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-4">
              <button
                onClick={() => setSelectedCategory('')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  selectedCategory === ''
                    ? 'bg-[#c9a227] text-white'
                    : 'bg-white/10 text-white/80 hover:bg-white/20'
                }`}
              >
                الكل
              </button>
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    selectedCategory === category.id
                      ? 'bg-[#c9a227] text-white'
                      : 'bg-white/10 text-white/80 hover:bg-white/20'
                  }`}
                >
                  {category.title}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 transition-opacity duration-200 ${filtering ? 'opacity-50' : 'opacity-100'}`}>
        {courses.length === 0 ? (
          <div className="bg-white rounded-xl border border-stone-200 p-12 text-center">
            <BookIcon className="mx-auto mb-4 text-stone-300" size={48} />
            <p className="text-stone-500">
              {search || selectedCategory 
                ? 'لا توجد نتائج مطابقة للبحث' 
                : 'لا توجد دورات متاحة'}
            </p>
            {(search || selectedCategory) && (
              <button
                onClick={() => { setSearch(''); setSelectedCategory(''); }}
                className="mt-4 text-[#1a3a2f] font-medium hover:underline"
              >
                إزالة الفلتر
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.map((course) => (
              <Link
                key={course.id}
                href={`/courses/${course.id}`}
                className="bg-white rounded-xl border border-stone-200 overflow-hidden hover:shadow-lg transition group"
              >
                <div className="h-40 bg-gradient-to-br from-[#1a3a2f] to-[#2d5a4a] relative">
                  {course.coverImage ? (
                    <img
                      src={course.coverImage}
                      alt={course.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-white text-4xl font-bold opacity-50">
                      {course.title.charAt(0)}
                    </div>
                  )}
                  <div className="absolute top-3 left-3">
                    <span className={`px-3 py-1 rounded-lg text-sm font-medium ${
                      course.price === 0 || !course.price 
                        ? 'bg-emerald-500 text-white' 
                        : 'bg-white text-stone-800'
                    }`}>
                      {course.price === 0 || !course.price ? 'مجاني' : `${course.price} ر.س`}
                    </span>
                  </div>
                </div>
                <div className="p-5">
                  <div className="mb-2">
                    <span className="text-xs px-2 py-1 bg-stone-100 text-stone-600 rounded">
                      {course.category.title}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-stone-800 mb-2 group-hover:text-[#1a3a2f] transition">
                    {course.title}
                  </h3>
                  <p className="text-stone-600 text-sm mb-4 line-clamp-2">
                    {course.description}
                  </p>
                  <div className="flex items-center gap-2 text-sm text-stone-500">
                    <UserIcon size={14} />
                    <span>{course.teacher.name}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
