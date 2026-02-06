'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import { StarIcon, ChartIcon, ExamIcon, HomeworkIcon, ChevronDownIcon } from '@/components/Icons';
import PageLoading from '@/components/PageLoading';
import { Pagination, PaginationInfo } from '@/components/Pagination';
import { formatDate } from '@/lib/utils';

const ITEMS_PER_PAGE = 10;

// Custom Dropdown Component
function CourseDropdown({ courses, selectedCourseId, onSelect }: { courses: any[], selectedCourseId: string, onSelect: (id: string) => void }) {
  const [dropdownOpen, setDropdownOpen] = useState(false);

  return (
    <div className="relative w-full">
      <div className="relative w-full">
        <button
          type="button"
          onClick={() => setDropdownOpen(!dropdownOpen)}
          className="w-full px-4 py-3 text-lg border-2 border-gray-300 rounded-lg focus:ring-4 focus:ring-primary bg-white text-gray-800 font-medium text-right flex items-center justify-between"
          style={{ minHeight: '56px' }}
        >
          <span className="flex-1 text-right">
            {selectedCourseId 
              ? courses.find(c => c.id === selectedCourseId) 
                ? `${courses.find(c => c.id === selectedCourseId)?.title} (${courses.find(c => c.id === selectedCourseId)?.exams.length || 0} امتحان، ${courses.find(c => c.id === selectedCourseId)?.homeworks.length || 0} واجب)`
                : 'اختر دورة لعرض التقييمات'
              : 'اختر دورة لعرض التقييمات'
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
                  onSelect('');
                  setDropdownOpen(false);
                }}
                className={`w-full text-right px-4 py-3 text-lg hover:bg-gray-100 transition ${
                  selectedCourseId === '' ? 'bg-primary text-white' : 'text-gray-800'
                }`}
              >
                اختر دورة لعرض التقييمات
              </button>
              {courses.map((course) => (
                <button
                  key={course.id}
                  type="button"
                  onClick={() => {
                    onSelect(course.id);
                    setDropdownOpen(false);
                  }}
                  className={`w-full text-right px-4 py-3 text-lg hover:bg-gray-100 transition border-t border-gray-200 ${
                    selectedCourseId === course.id ? 'bg-primary text-white' : 'text-gray-800'
                  }`}
                >
                  {course.title} ({course.exams.length} امتحان، {course.homeworks.length} واجب)
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

interface Grade {
  id: string;
  type: string;
  itemId: string; // ID of exam, homework, or quiz
  score: number;
  maxScore: number;
  percentage: number;
  letterGrade: string;
  createdAt: string;
  course?: { id: string; title: string };
  user: { id: string; name: string; email: string };
}

interface Course {
  id: string;
  title: string;
  exams: Array<{ id: string; title: string; maxScore: number }>;
  homeworks: Array<{ id: string; title: string; maxScore: number }>;
}

export default function AdminGradesPage() {
  const router = useRouter();
  const [selectedCourseId, setSelectedCourseId] = useState<string>('');
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [groupPages, setGroupPages] = useState<{ [key: string]: number }>({});

  useEffect(() => {
    loadCourses();
  }, []);

  useEffect(() => {
    if (selectedCourseId) {
      loadCourseGrades(selectedCourseId);
    } else {
      setGrades([]);
      setSelectedCourse(null);
    }
    // Reset pagination when course changes
    setCurrentPage(1);
    setGroupPages({});
  }, [selectedCourseId]);

  const loadCourses = async () => {
    try {
      const response = await api.get('/courses/admin');
      const coursesData = response.data || [];
      
      // Load exams and homeworks for each course
      const coursesWithAssessments = await Promise.all(
        coursesData.map(async (course: any) => {
          try {
            // Try to get exams and homeworks from the course object if available
            let exams = course.exams || [];
            let homeworks = course.homeworks || [];
            
            // If not available, try to fetch them
            if (exams.length === 0 && homeworks.length === 0) {
              try {
                const [examsRes, homeworksRes] = await Promise.all([
                  api.get(`/exams/course/${course.id}`).catch(() => ({ data: [] })),
                  api.get(`/homework/course/${course.id}`).catch(() => ({ data: [] })),
                ]);
                exams = examsRes.data || [];
                homeworks = homeworksRes.data || [];
              } catch (e) {
                // If fetching fails, use empty arrays
                exams = [];
                homeworks = [];
              }
            }
            
            return {
              ...course,
              exams,
              homeworks,
            };
          } catch (e) {
            return {
              ...course,
              exams: [],
              homeworks: [],
            };
          }
        })
      );
      
      setCourses(coursesWithAssessments);
    } catch (error) {
      console.error('Failed to load courses:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadCourseGrades = async (courseId: string) => {
    try {
      const [gradesRes, courseRes] = await Promise.all([
        api.get(`/grades/course/${courseId}`),
        api.get(`/courses/${courseId}`),
      ]);
      
      setGrades(gradesRes.data || []);
      setSelectedCourse(courseRes.data);
    } catch (error) {
      console.error('Failed to load course grades:', error);
      setGrades([]);
      setSelectedCourse(null);
    }
  };

  const getGradeColor = (grade: string) => {
    if (grade.startsWith('A')) return 'bg-green-100 text-green-800';
    if (grade.startsWith('B')) return 'bg-blue-100 text-blue-800';
    if (grade.startsWith('C')) return 'bg-yellow-100 text-yellow-800';
    if (grade === 'D') return 'bg-orange-100 text-orange-800';
    return 'bg-red-100 text-red-800';
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

  // Group grades by examId or homeworkId
  const groupedGrades = useMemo(() => {
    return grades.reduce((acc, grade) => {
      // Try to extract examId or homeworkId from the grade
      // The grade should have examId or homeworkId based on type
      const examId = (grade as any).examId;
      const homeworkId = (grade as any).homeworkId;
      const assessmentId = examId || homeworkId || 'unknown';
      const key = `${grade.type}-${assessmentId}`;
      
      if (!acc[key]) {
        acc[key] = {
          type: grade.type,
          assessmentId,
          grades: [],
        };
      }
      acc[key].grades.push(grade);
      return acc;
    }, {} as { [key: string]: { type: string; assessmentId: string; grades: Grade[] } });
  }, [grades]);

  // Helper function to get paginated grades for a group
  const getGroupPage = (key: string) => groupPages[key] || 1;
  const setGroupPage = (key: string, page: number) => {
    setGroupPages(prev => ({ ...prev, [key]: page }));
  };

  // Paginated grades for the "All Grades" fallback table
  const totalPages = Math.ceil(grades.length / ITEMS_PER_PAGE);
  const paginatedGrades = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return grades.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [grades, currentPage]);

  if (loading && courses.length === 0) {
    return <PageLoading title="الدرجات" icon={<StarIcon size={24} />} />;
  }

  // Calculate statistics
  const avgPercentage = grades.length > 0
    ? grades.reduce((sum, g) => sum + g.percentage, 0) / grades.length
    : 0;

  const gradeDistribution = grades.reduce((acc, grade) => {
    acc[grade.letterGrade] = (acc[grade.letterGrade] || 0) + 1;
    return acc;
  }, {} as { [key: string]: number });

  return (
    <div className="min-h-screen bg-stone-50">
      {/* Header */}
      <div className="bg-gradient-to-l from-[#1a3a2f] via-[#1f4a3d] to-[#0d2b24] text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center">
                <StarIcon size={24} />
              </div>
              <div>
                <h1 className="text-xl md:text-2xl font-bold">إدارة التقييمات</h1>
                <p className="text-white/70 text-sm">{grades.length} تقييم</p>
              </div>
            </div>
            <button
              onClick={() => router.back()}
              className="px-5 py-2.5 bg-white/10 text-white rounded-xl font-medium hover:bg-white/20 transition"
            >
              العودة ←
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Course Selection */}
        <div className="bg-white rounded-xl shadow-sm border border-stone-100 p-6 mb-6">
          <h2 className="text-lg font-bold mb-4 text-stone-800">اختر الدورة</h2>
          <CourseDropdown
            courses={courses}
            selectedCourseId={selectedCourseId}
            onSelect={(courseId) => setSelectedCourseId(courseId)}
          />
        </div>

      {selectedCourseId && selectedCourse && (
        <>
          {/* Course Info */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-bold mb-4 text-gray-800">{selectedCourse.title}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">الامتحانات ({selectedCourse.exams.length})</h3>
                {selectedCourse.exams.length === 0 ? (
                  <p className="text-gray-600">لا توجد امتحانات</p>
                ) : (
                  <div className="space-y-2">
                    {selectedCourse.exams.map((exam) => (
                      <Link
                        key={exam.id}
                        href={`/admin/exams/${exam.id}/attempts`}
                        className="block p-3 bg-blue-50 rounded-lg hover:bg-blue-100 transition"
                      >
                        <p className="font-semibold text-gray-800">{exam.title}</p>
                        <p className="text-sm text-gray-600">الدرجة الكاملة: {exam.maxScore}</p>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">الواجبات ({selectedCourse.homeworks.length})</h3>
                {selectedCourse.homeworks.length === 0 ? (
                  <p className="text-gray-600">لا توجد واجبات</p>
                ) : (
                  <div className="space-y-2">
                    {selectedCourse.homeworks.map((homework) => (
                      <Link
                        key={homework.id}
                        href={`/admin/homework/${homework.id}/submissions`}
                        className="block p-3 bg-green-50 rounded-lg hover:bg-green-100 transition"
                      >
                        <p className="font-semibold text-gray-800">{homework.title}</p>
                        <p className="text-sm text-gray-600">الدرجة الكاملة: {homework.maxScore}</p>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Statistics */}
          {grades.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-white rounded-lg shadow-lg p-6 border-r-4 border-primary">
                <p className="text-gray-600 text-lg mb-2">إجمالي التقييمات</p>
                <p className="text-4xl font-bold text-primary">{grades.length}</p>
              </div>
              <div className="bg-white rounded-lg shadow-lg p-6 border-r-4 border-green-500">
                <p className="text-gray-600 text-lg mb-2">المتوسط العام</p>
                <p className="text-4xl font-bold text-green-600">{avgPercentage.toFixed(1)}%</p>
              </div>
              <div className="bg-white rounded-lg shadow-lg p-6 border-r-4 border-blue-500">
                <p className="text-gray-600 text-lg mb-2">امتحانات</p>
                <p className="text-4xl font-bold text-blue-600">
                  {grades.filter(g => g.type === 'EXAM').length}
                </p>
              </div>
              <div className="bg-white rounded-lg shadow-lg p-6 border-r-4 border-purple-500">
                <p className="text-gray-600 text-lg mb-2">واجبات</p>
                <p className="text-4xl font-bold text-purple-600">
                  {grades.filter(g => g.type === 'HOMEWORK').length}
                </p>
              </div>
            </div>
          )}

          {/* Grade Distribution */}
          {Object.keys(gradeDistribution).length > 0 && (
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-bold mb-4 text-gray-800">توزيع التقديرات</h2>
              <div className="flex flex-wrap gap-4">
                {Object.entries(gradeDistribution).map(([grade, count]) => (
                  <div key={grade} className={`px-6 py-3 rounded-lg ${getGradeColor(grade)}`}>
                    <span className="text-2xl font-bold">{grade}</span>
                    <span className="text-lg mr-2">: {count}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Grades by Type */}
          {Object.keys(groupedGrades).length > 0 && (
            <div className="space-y-6">
              {Object.entries(groupedGrades).map(([key, group]) => {
                // Find assessment by assessmentId
                let assessment = null;
                if (group.type === 'EXAM') {
                  assessment = selectedCourse?.exams?.find((e: any) => e.id === group.assessmentId);
                } else if (group.type === 'HOMEWORK') {
                  assessment = selectedCourse?.homeworks?.find((h: any) => h.id === group.assessmentId);
                }
                
                // Pagination for this group
                const groupCurrentPage = getGroupPage(key);
                const groupTotalPages = Math.ceil(group.grades.length / ITEMS_PER_PAGE);
                const startIndex = (groupCurrentPage - 1) * ITEMS_PER_PAGE;
                const paginatedGroupGrades = group.grades.slice(startIndex, startIndex + ITEMS_PER_PAGE);
                
                return (
                  <div key={key} className="bg-white rounded-lg shadow-lg overflow-hidden">
                    <div className="bg-gradient-to-r from-primary to-primary-light text-white p-4">
                      <h3 className="text-xl font-bold">
                        {getTypeLabel(group.type)}: {assessment?.title || 'غير محدد'}
                      </h3>
                      <p className="text-sm text-white/90">
                        {group.grades.length} تقييم • الدرجة الكاملة: {assessment?.maxScore || group.grades[0]?.maxScore || 'N/A'}
                      </p>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-right text-sm font-medium text-gray-700 uppercase">الطالب</th>
                            <th className="px-6 py-3 text-right text-sm font-medium text-gray-700 uppercase">الدرجة</th>
                            <th className="px-6 py-3 text-right text-sm font-medium text-gray-700 uppercase">النسبة</th>
                            <th className="px-6 py-3 text-right text-sm font-medium text-gray-700 uppercase">التقدير</th>
                            <th className="px-6 py-3 text-right text-sm font-medium text-gray-700 uppercase">التاريخ</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 bg-white">
                          {paginatedGroupGrades.map((grade) => (
                            <tr key={grade.id} className="hover:bg-gray-50">
                              <td className="px-6 py-4">
                                <div>
                                  <p className="text-base font-semibold text-gray-800">{grade.user.name}</p>
                                  <p className="text-sm text-gray-600">{grade.user.email}</p>
                                </div>
                              </td>
                              <td className="px-6 py-4 text-base font-semibold text-gray-800">
                                {grade.score} / {grade.maxScore}
                              </td>
                              <td className="px-6 py-4 text-base font-semibold text-gray-800">{grade.percentage.toFixed(1)}%</td>
                              <td className="px-6 py-4">
                                <span className={`px-3 py-1 rounded-lg font-bold text-base ${getGradeColor(grade.letterGrade)}`}>
                                  {grade.letterGrade}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-sm text-gray-800">
                                {formatDate(grade.createdAt)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    
                    {/* Pagination for this group */}
                    {group.grades.length > ITEMS_PER_PAGE && (
                      <div className="p-4 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-4">
                        <PaginationInfo
                          currentPage={groupCurrentPage}
                          limit={ITEMS_PER_PAGE}
                          total={group.grades.length}
                          itemName="تقييم"
                        />
                        <Pagination
                          currentPage={groupCurrentPage}
                          totalPages={groupTotalPages}
                          onPageChange={(page) => setGroupPage(key, page)}
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* All Grades Table (Fallback) */}
          {grades.length > 0 && Object.keys(groupedGrades).length === 0 && (
            <div className="bg-white rounded-lg shadow-lg overflow-hidden">
              <div className="bg-primary text-white p-4">
                <h3 className="text-xl font-bold">جميع التقييمات</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-right text-sm font-medium text-gray-700 uppercase">الطالب</th>
                      <th className="px-6 py-3 text-right text-sm font-medium text-gray-700 uppercase">النوع</th>
                      <th className="px-6 py-3 text-right text-sm font-medium text-gray-700 uppercase">الدرجة</th>
                      <th className="px-6 py-3 text-right text-sm font-medium text-gray-700 uppercase">النسبة</th>
                      <th className="px-6 py-3 text-right text-sm font-medium text-gray-700 uppercase">التقدير</th>
                      <th className="px-6 py-3 text-right text-sm font-medium text-gray-700 uppercase">التاريخ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {paginatedGrades.map((grade) => (
                      <tr key={grade.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div>
                            <p className="text-base font-semibold text-gray-800">{grade.user.name}</p>
                            <p className="text-sm text-gray-600">{grade.user.email}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-lg font-semibold text-sm">
                            {getTypeLabel(grade.type)}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-base font-semibold text-gray-800">
                          {grade.score} / {grade.maxScore}
                        </td>
                        <td className="px-6 py-4 text-base font-semibold text-gray-800">{grade.percentage.toFixed(1)}%</td>
                        <td className="px-6 py-4">
                          <span className={`px-3 py-1 rounded-lg font-bold text-base ${getGradeColor(grade.letterGrade)}`}>
                            {grade.letterGrade}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-800">
                          {formatDate(grade.createdAt)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              {/* Pagination for All Grades */}
              {grades.length > ITEMS_PER_PAGE && (
                <div className="p-4 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <PaginationInfo
                    currentPage={currentPage}
                    limit={ITEMS_PER_PAGE}
                    total={grades.length}
                    itemName="تقييم"
                  />
                  <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={setCurrentPage}
                  />
                </div>
              )}
            </div>
          )}

          {grades.length === 0 && (
            <div className="bg-white rounded-lg shadow-lg p-12 text-center">
              <p className="text-xl text-gray-500">لا توجد تقييمات لهذه الدورة</p>
            </div>
          )}
        </>
      )}

      {!selectedCourseId && (
        <div className="bg-white rounded-lg shadow-lg p-12 text-center">
          <p className="text-xl text-gray-500">يرجى اختيار دورة لعرض التقييمات</p>
        </div>
      )}
      </div>
    </div>
  );
}
