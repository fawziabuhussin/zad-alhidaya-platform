'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';

interface Grade {
  id: string;
  score: number;
  maxScore: number;
  letterGrade: string;
  type: string;
  course?: { id: string; title: string };
  itemId: string;
}

export default function TeacherGradesPage() {
  const [grades, setGrades] = useState<Grade[]>([]);
  const [loading, setLoading] = useState(true);
  const [courses, setCourses] = useState<any[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      // Try to get user from localStorage first
      const userStr = localStorage.getItem('user');
      if (userStr) {
        try {
          const cachedUser = JSON.parse(userStr);
          if (cachedUser.role === 'TEACHER' || cachedUser.role === 'ADMIN') {
            setUser(cachedUser);
            loadData();
            return;
          }
        } catch (e) {
          // Invalid cached user
        }
      }

      const token = localStorage.getItem('accessToken');
      if (!token) {
        window.location.href = '/login';
        return;
      }

      const userRes = await api.get('/auth/me');
      const userData = userRes.data;
      
      if (userData.role !== 'TEACHER' && userData.role !== 'ADMIN') {
        window.location.href = '/dashboard';
        return;
      }

      setUser(userData);
      localStorage.setItem('user', JSON.stringify(userData));
      loadData();
    } catch (error: any) {
      // Try to use cached user
      const userStr = localStorage.getItem('user');
      if (userStr) {
        try {
          const cachedUser = JSON.parse(userStr);
          if (cachedUser.role === 'TEACHER' || cachedUser.role === 'ADMIN') {
            setUser(cachedUser);
            loadData();
            return;
          }
        } catch (e) {
          // Invalid cached user
        }
      }
      window.location.href = '/login';
    }
  };

  const loadData = async () => {
    try {
      const coursesRes = await api.get('/courses/teacher/my-courses');
      const myCourses = coursesRes.data || [];
      setCourses(myCourses);
      
      // Load grades for teacher's courses
      const allGrades: Grade[] = [];
      for (const course of myCourses) {
        try {
          const gradesRes = await api.get(`/grades/course/${course.id}`);
          const gradesWithCourse = (gradesRes.data || []).map((grade: any) => ({
            ...grade,
            course: grade.course || { id: course.id, title: course.title },
          }));
          allGrades.push(...gradesWithCourse);
        } catch (error) {
          console.error(`Failed to load grades for course ${course.id}:`, error);
        }
      }
      setGrades(allGrades);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredGrades = selectedCourseId
    ? grades.filter(g => g.course?.id === selectedCourseId)
    : grades;

  const groupedGrades = filteredGrades.reduce((acc, grade) => {
    const key = grade.itemId;
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(grade);
    return acc;
  }, {} as Record<string, Grade[]>);

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'EXAM': return 'امتحان';
      case 'HOMEWORK': return 'واجب';
      default: return type;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 bg-gray-50 min-h-screen p-6">
      <h1 className="text-2xl font-bold text-gray-800">التقييمات</h1>

      {/* Course Filter */}
      <div className="bg-white rounded-lg shadow-md p-4">
        <label className="block text-lg font-semibold mb-2 text-gray-800">تصفية حسب الدورة</label>
        <div className="relative">
          <button
            type="button"
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="w-full px-4 py-3 text-lg border-2 border-gray-300 rounded-lg focus:ring-4 focus:ring-primary bg-white text-gray-800 font-medium text-right flex items-center justify-between"
          >
            <span className="flex-1 text-right">
              {selectedCourseId
                ? courses.find(c => c.id === selectedCourseId)?.title || 'اختر دورة'
                : 'جميع الدورات'
              }
            </span>
            <svg 
              className={`w-5 h-5 transition-transform ${dropdownOpen ? 'transform rotate-180' : ''}`}
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          
          {dropdownOpen && (
            <>
              <div 
                className="fixed inset-0 z-10" 
                onClick={() => setDropdownOpen(false)}
              />
              <div 
                className="absolute z-20 w-full mt-1 bg-white border-2 border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto"
                style={{ direction: 'rtl' }}
              >
                <button
                  type="button"
                  onClick={() => {
                    setSelectedCourseId('');
                    setDropdownOpen(false);
                  }}
                  className={`w-full text-right px-4 py-3 text-lg hover:bg-gray-100 transition ${
                    !selectedCourseId ? 'bg-primary text-white' : 'text-gray-800'
                  }`}
                >
                  جميع الدورات
                </button>
                {courses.map((course) => (
                  <button
                    key={course.id}
                    type="button"
                    onClick={() => {
                      setSelectedCourseId(course.id);
                      setDropdownOpen(false);
                    }}
                    className={`w-full text-right px-4 py-3 text-lg hover:bg-gray-100 transition border-t border-gray-200 ${
                      selectedCourseId === course.id ? 'bg-primary text-white' : 'text-gray-800'
                    }`}
                  >
                    {course.title}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Grades */}
      {Object.keys(groupedGrades).length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-12 text-center">
          <p className="text-gray-500 text-lg">لا توجد تقييمات بعد</p>
        </div>
      ) : (
        <div className="space-y-4">
          {Object.entries(groupedGrades).map(([itemId, itemGrades]) => {
            const firstGrade = itemGrades[0];
            return (
              <div key={itemId} className="bg-white rounded-lg shadow-md p-6">
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-gray-800">
                      {firstGrade.course?.title || 'N/A'}
                    </h3>
                    <p className="text-gray-600">
                      {getTypeLabel(firstGrade.type)}
                    </p>
                  </div>
                </div>
                <div className="space-y-2">
                  {itemGrades.map((grade) => (
                    <div key={grade.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-semibold text-gray-800">
                          {grade.score} / {grade.maxScore}
                        </p>
                        <p className="text-sm text-gray-600">{grade.letterGrade}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

