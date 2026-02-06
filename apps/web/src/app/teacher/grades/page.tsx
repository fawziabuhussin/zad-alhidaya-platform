'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { StarIcon, ChevronDownIcon } from '@/components/Icons';
import { navigateTo } from '@/lib/navigation';
import PageLoading from '@/components/PageLoading';
import { Pagination, PaginationInfo } from '@/components/Pagination';

const ITEMS_PER_PAGE = 10;

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
  const router = useRouter();
  const [grades, setGrades] = useState<Grade[]>([]);
  const [loading, setLoading] = useState(true);
  const [courses, setCourses] = useState<any[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [groupPages, setGroupPages] = useState<{ [key: string]: number }>({});

  useEffect(() => {
    checkAuth();
  // eslint-disable-next-line react-hooks/exhaustive-deps
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
        navigateTo('/login', router);
        return;
      }

      const userRes = await api.get('/auth/me');
      const userData = userRes.data;
      
      if (userData.role !== 'TEACHER' && userData.role !== 'ADMIN') {
        navigateTo('/dashboard', router);
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
      navigateTo('/login', router);
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

  const groupedGrades = useMemo(() => {
    return filteredGrades.reduce((acc, grade) => {
      const key = grade.itemId;
      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push(grade);
      return acc;
    }, {} as Record<string, Grade[]>);
  }, [filteredGrades]);

  // Helper function to get paginated grades for a group
  const getGroupPage = (key: string) => groupPages[key] || 1;
  const setGroupPage = (key: string, page: number) => {
    setGroupPages(prev => ({ ...prev, [key]: page }));
  };

  // Reset pagination when course filter changes
  useEffect(() => {
    setGroupPages({});
  }, [selectedCourseId]);

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'EXAM': return 'امتحان';
      case 'HOMEWORK': return 'واجب';
      default: return type;
    }
  };

  if (loading && grades.length === 0) {
    return <PageLoading title="الدرجات" icon={<StarIcon className="text-white" size={20} />} />;
  }

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
              <h1 className="text-xl font-bold">التقييمات</h1>
              <p className="text-white/70 text-sm">{grades.length} تقييم</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Course Filter */}
        <div className="bg-white rounded-xl shadow-sm border border-stone-100 p-5 mb-6">
          <label className="block text-sm font-medium mb-2 text-stone-700">تصفية حسب الدورة</label>
          <div className="relative">
            <button
              type="button"
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="w-full px-4 py-2.5 border border-stone-200 rounded-lg focus:ring-2 focus:ring-[#1a3a2f]/20 bg-white text-stone-800 font-medium text-right flex items-center justify-between"
            >
              <span className="flex-1 text-right">
                {selectedCourseId
                  ? courses.find(c => c.id === selectedCourseId)?.title || 'اختر دورة'
                  : 'جميع الدورات'
                }
              </span>
              <ChevronDownIcon className={`text-stone-400 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} size={18} />
            </button>
            
            {dropdownOpen && (
              <>
                <div 
                  className="fixed inset-0 z-10" 
                  onClick={() => setDropdownOpen(false)}
                />
                <div 
                  className="absolute z-20 w-full mt-1 bg-white border border-stone-200 rounded-lg shadow-lg max-h-60 overflow-y-auto"
                  style={{ direction: 'rtl' }}
                >
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedCourseId('');
                      setDropdownOpen(false);
                    }}
                    className={`w-full text-right px-4 py-3 hover:bg-stone-50 transition ${
                      !selectedCourseId ? 'bg-[#1a3a2f] text-white' : 'text-stone-800'
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
                      className={`w-full text-right px-4 py-3 hover:bg-stone-50 transition border-t border-stone-100 ${
                        selectedCourseId === course.id ? 'bg-[#1a3a2f] text-white' : 'text-stone-800'
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
          <div className="bg-white rounded-xl shadow-sm border border-stone-100 p-12 text-center">
            <div className="w-16 h-16 bg-stone-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <StarIcon className="text-stone-600" size={32} />
            </div>
            <h3 className="text-xl font-bold text-stone-800 mb-2">لا توجد تقييمات بعد</h3>
            <p className="text-stone-500">ستظهر تقييمات الطلاب هنا بعد إكمالهم للامتحانات والواجبات</p>
          </div>
        ) : (
          <div className="space-y-4">
            {Object.entries(groupedGrades).map(([itemId, itemGrades]) => {
              const firstGrade = itemGrades[0];
              
              // Pagination for this group
              const groupCurrentPage = getGroupPage(itemId);
              const groupTotalPages = Math.ceil(itemGrades.length / ITEMS_PER_PAGE);
              const startIndex = (groupCurrentPage - 1) * ITEMS_PER_PAGE;
              const paginatedGroupGrades = itemGrades.slice(startIndex, startIndex + ITEMS_PER_PAGE);
              
              return (
                <div key={itemId} className="bg-white rounded-xl shadow-sm border border-stone-100 p-5">
                  <div className="flex justify-between items-center mb-4">
                    <div>
                      <h3 className="text-lg font-bold text-stone-800">
                        {firstGrade.course?.title || 'N/A'}
                      </h3>
                      <p className="text-stone-500 text-sm">
                        {getTypeLabel(firstGrade.type)}
                      </p>
                    </div>
                    <span className="text-sm text-stone-500 bg-stone-100 px-3 py-1 rounded-lg">
                      {itemGrades.length} تقييم
                    </span>
                  </div>
                  <div className="space-y-2">
                    {paginatedGroupGrades.map((grade) => (
                      <div key={grade.id} className="flex justify-between items-center p-3 bg-stone-50 rounded-lg">
                        <div>
                          <p className="font-medium text-stone-800">
                            {grade.score} / {grade.maxScore}
                          </p>
                          <p className="text-sm text-stone-500">{grade.letterGrade}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {/* Pagination for this group */}
                  {itemGrades.length > ITEMS_PER_PAGE && (
                    <div className="mt-4 pt-4 border-t border-stone-100 flex flex-col sm:flex-row items-center justify-between gap-4">
                      <PaginationInfo
                        currentPage={groupCurrentPage}
                        limit={ITEMS_PER_PAGE}
                        total={itemGrades.length}
                        itemName="تقييم"
                      />
                      <Pagination
                        currentPage={groupCurrentPage}
                        totalPages={groupTotalPages}
                        onPageChange={(page) => setGroupPage(itemId, page)}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

