'use client';

import { useEffect, useState } from 'react';
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
  _count: { enrollments: number };
}

export default function CoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');

  useEffect(() => {
    loadCourses();
  }, [search, selectedCategory]);

  const loadCourses = async () => {
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (selectedCategory) params.append('categoryId', selectedCategory);
      
      const response = await api.get(`/courses/public?${params.toString()}`);
      setCourses(response.data);
    } catch (error) {
      console.error('Failed to load courses:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 md:py-6">
        <h1 className="text-2xl md:text-3xl font-bold mb-4 text-gray-800">الدورات المتاحة</h1>
        
        {/* Search and Filter */}
        <div className="flex gap-4 flex-wrap mb-6">
          <input
            type="text"
            placeholder="ابحث عن دورة..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 min-w-full sm:min-w-[200px] px-4 py-3 text-lg border-2 border-gray-300 rounded-lg focus:ring-4 focus:ring-primary focus:border-primary text-gray-800 bg-white"
          />
        </div>

        {/* Courses Grid */}
        <div>
          {courses.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg md:text-xl">لا توجد دورات متاحة</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
              {courses.map((course) => (
                <Link
                  key={course.id}
                  href={`/courses/${course.id}`}
                  className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition block"
                >
                  <div className="h-40 md:h-48 bg-gradient-to-br from-primary to-primary-light relative">
                    {course.coverImage ? (
                      <img
                        src={course.coverImage}
                        alt={course.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-white text-2xl font-bold">
                        {course.title.charAt(0)}
                      </div>
                    )}
                  </div>
                  <div className="p-4 md:p-6">
                    <h3 className="text-lg md:text-xl font-bold mb-2 text-gray-800">{course.title}</h3>
                    <p className="text-gray-700 text-base mb-4 line-clamp-2">
                      {course.description}
                    </p>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-500">
                        {course.category.title}
                      </span>
                      <span className="text-primary font-bold">
                        {course.price === 0 || !course.price ? 'مجاني' : `${course.price} ر.س`}
                      </span>
                    </div>
                    <div className="mt-4 text-sm text-gray-500">
                      المدرس: {course.teacher.name}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
