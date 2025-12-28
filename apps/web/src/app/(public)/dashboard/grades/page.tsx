'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';

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

export default function StudentGradesPage() {
  const [grades, setGrades] = useState<Grade[]>([]);
  const [gpa, setGpa] = useState<string>('0.00');
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({ courseId: '', type: '' });

  useEffect(() => {
    loadGrades();
  }, []);

  const loadGrades = async () => {
    try {
      const userStr = localStorage.getItem('user');
      const user = userStr ? JSON.parse(userStr) : null;
      
      if (!user) {
        window.location.href = '/login';
        return;
      }

      const response = await api.get(`/grades/student/${user.id}`);
      setGrades(response.data.grades || []);
      setGpa(response.data.gpa || '0.00');
    } catch (error) {
      console.error('Failed to load grades:', error);
    } finally {
      setLoading(false);
    }
  };

  const getGradeColor = (grade: string) => {
    if (grade.startsWith('A')) return 'bg-green-100 text-green-800 border-green-500';
    if (grade.startsWith('B')) return 'bg-blue-100 text-blue-800 border-blue-500';
    if (grade.startsWith('C')) return 'bg-yellow-100 text-yellow-800 border-yellow-500';
    if (grade === 'D') return 'bg-orange-100 text-orange-800 border-orange-500';
    return 'bg-red-100 text-red-800 border-red-500';
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

  const filteredGrades = grades.filter(grade => {
    if (filter.courseId && grade.course.id !== filter.courseId) return false;
    if (filter.type && grade.type !== filter.type) return false;
    return true;
  });

  const uniqueCourses = Array.from(new Set(grades.map(g => g.course.id)))
    .map(id => grades.find(g => g.course.id === id)?.course)
    .filter(Boolean) as any[];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-primary"></div>
      </div>
    );
  }

  // Calculate statistics
  const avgPercentage = filteredGrades.length > 0
    ? filteredGrades.reduce((sum, g) => sum + g.percentage, 0) / filteredGrades.length
    : 0;

  return (
    <div className="space-y-4 md:space-y-6 px-4 sm:px-6 lg:px-8 py-6 bg-gray-50 min-h-screen">
      <h1 className="text-2xl md:text-3xl font-bold text-gray-800">التقييمات والدرجات</h1>

      {/* Statistics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        <div className="bg-gradient-to-br from-primary to-primary-light text-white rounded-lg shadow-lg p-8">
          <p className="text-xl mb-2">المتوسط التراكمي (GPA)</p>
          <p className="text-5xl font-bold">{gpa}</p>
        </div>
        <div className="bg-white rounded-lg shadow-lg p-8 border-r-4 border-green-500">
          <p className="text-gray-600 text-lg mb-2">المتوسط العام</p>
          <p className="text-4xl font-bold text-green-600">{avgPercentage.toFixed(1)}%</p>
        </div>
        <div className="bg-white rounded-lg shadow-lg p-8 border-r-4 border-blue-500">
          <p className="text-gray-600 text-lg mb-2">إجمالي التقييمات</p>
          <p className="text-4xl font-bold text-blue-600">{filteredGrades.length}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-xl font-bold mb-4 text-gray-800">التصفية</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-lg font-semibold mb-2 text-gray-800">الدورة</label>
            <select
              value={filter.courseId}
              onChange={(e) => setFilter({ ...filter, courseId: e.target.value })}
              className="w-full px-4 py-3 text-lg border-2 border-gray-300 rounded-lg focus:ring-4 focus:ring-primary text-gray-800 bg-white"
            >
              <option value="">جميع الدورات</option>
              {uniqueCourses.map((course) => (
                <option key={course.id} value={course.id}>{course.title}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-lg font-semibold mb-2 text-gray-800">النوع</label>
            <select
              value={filter.type}
              onChange={(e) => setFilter({ ...filter, type: e.target.value })}
              className="w-full px-4 py-3 text-lg border-2 border-gray-300 rounded-lg focus:ring-4 focus:ring-primary text-gray-800 bg-white"
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
        <div className="bg-white rounded-lg shadow-lg p-12 text-center">
          <p className="text-xl text-gray-500">لا توجد تقييمات</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredGrades.map((grade) => (
            <div key={grade.id} className="bg-white rounded-lg shadow-lg p-6 border-2 border-gray-200">
              <div className="flex items-center gap-6">
                {grade.course.coverImage ? (
                  <img
                    src={grade.course.coverImage}
                    alt={grade.course.title}
                    className="w-24 h-24 rounded-lg object-cover"
                  />
                ) : (
                  <div className="w-24 h-24 bg-primary rounded-lg flex items-center justify-center text-white text-3xl font-bold">
                    {grade.course.title.charAt(0)}
                  </div>
                )}
                <div className="flex-1">
                  <h3 className="text-2xl font-bold mb-2 text-gray-800">{grade.course.title}</h3>
                  <p className="text-lg text-gray-700">{getTypeLabel(grade.type)}</p>
                </div>
                <div className="text-center">
                  <div className={`px-6 py-4 rounded-lg border-4 ${getGradeColor(grade.letterGrade)}`}>
                    <p className="text-4xl font-bold mb-1">{grade.letterGrade}</p>
                    <p className="text-lg font-semibold">{grade.percentage.toFixed(1)}%</p>
                  </div>
                </div>
                <div className="text-left">
                  <p className="text-2xl font-bold mb-1 text-gray-800">
                    {grade.score} / {grade.maxScore}
                  </p>
                  <p className="text-base text-gray-600">
                    {new Date(grade.createdAt).toLocaleDateString('ar-SA')}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

