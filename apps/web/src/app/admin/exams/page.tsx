'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import api from '@/lib/api';

interface Exam {
  id: string;
  title: string;
  description?: string;
  durationMinutes: number;
  startDate: string;
  endDate: string;
  maxScore: number;
  passingScore: number;
  course: { title: string };
  _count: { attempts: number; questions: number };
}

export default function AdminExamsPage() {
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [courses, setCourses] = useState<any[]>([]);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [formData, setFormData] = useState({
    courseId: '',
    title: '',
    description: '',
    durationMinutes: 60,
    startDate: '',
    endDate: '',
    maxScore: 100,
    passingScore: 60,
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [coursesRes] = await Promise.all([
        api.get('/courses/admin'), // Use admin endpoint to get all courses including DRAFT
      ]);
      setCourses(coursesRes.data || []);
      // Load exams for all courses
      const allExams: Exam[] = [];
      for (const course of coursesRes.data || []) {
        try {
          const examsRes = await api.get(`/exams/course/${course.id}`);
          // Ensure each exam has course info
          const examsWithCourse = (examsRes.data || []).map((exam: any) => ({
            ...exam,
            course: exam.course || { title: course.title },
          }));
          allExams.push(...examsWithCourse);
        } catch (e) {
          // Skip if no exams
        }
      }
      setExams(allExams);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.courseId) {
      alert('يجب اختيار دورة');
      return;
    }
    try {
      await api.post('/exams', formData);
      setShowForm(false);
      setFormData({
        courseId: '',
        title: '',
        description: '',
        durationMinutes: 60,
        startDate: '',
        endDate: '',
        maxScore: 100,
        passingScore: 60,
      });
      loadData();
    } catch (error: any) {
      alert(error.response?.data?.message || 'فشل إنشاء الامتحان');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا الامتحان؟')) return;
    try {
      await api.delete(`/exams/${id}`);
      loadData();
    } catch (error: any) {
      alert(error.response?.data?.message || 'فشل حذف الامتحان');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 px-4 sm:px-6 lg:px-8" style={{ overflow: 'visible', position: 'relative', maxWidth: '100%', width: '100%' }}>
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">إدارة الامتحانات</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-8 py-4 bg-primary text-white rounded-lg font-bold text-lg hover:bg-primary-dark transition btn-large"
        >
          + امتحان جديد
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-lg shadow-lg p-8 border-2 border-primary" style={{ overflow: 'visible', position: 'relative', zIndex: 100 }}>
          <h2 className="text-2xl font-bold mb-6">إنشاء امتحان جديد</h2>
          <form onSubmit={handleSubmit} className="space-y-6" style={{ overflow: 'visible', position: 'relative' }}>
            <div className="relative w-full">
              <label className="block text-lg font-semibold mb-3 text-gray-800">الدورة *</label>
              <div className="relative w-full">
                {/* Custom Dropdown */}
                <button
                  type="button"
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="w-full px-4 py-3 text-lg border-2 border-gray-300 rounded-lg focus:ring-4 focus:ring-primary focus:border-primary bg-white text-gray-800 font-medium text-right flex items-center justify-between"
                  style={{ minHeight: '56px' }}
                >
                  <span className="flex-1 text-right">
                    {formData.courseId 
                      ? courses.find(c => c.id === formData.courseId)?.title || 'اختر الدورة'
                      : 'اختر الدورة'
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
                
                {/* Dropdown Menu */}
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
                          setFormData({ ...formData, courseId: '' });
                          setDropdownOpen(false);
                        }}
                        className={`w-full text-right px-4 py-3 text-lg hover:bg-gray-100 transition ${
                          formData.courseId === '' ? 'bg-primary text-white' : 'text-gray-800'
                        }`}
                      >
                        اختر الدورة
                      </button>
                      {courses.map((course) => (
                        <button
                          key={course.id}
                          type="button"
                          onClick={() => {
                            setFormData({ ...formData, courseId: course.id });
                            setDropdownOpen(false);
                          }}
                          className={`w-full text-right px-4 py-3 text-lg hover:bg-gray-100 transition border-t border-gray-200 ${
                            formData.courseId === course.id ? 'bg-primary text-white' : 'text-gray-800'
                          }`}
                        >
                          {course.title}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
              {courses.length === 0 && (
                <p className="text-sm text-yellow-600 mt-2">جاري تحميل الدورات...</p>
              )}
              {!formData.courseId && (
                <p className="text-sm text-red-600 mt-1">يجب اختيار دورة</p>
              )}
            </div>

            <div>
              <label className="block text-lg font-semibold mb-3">عنوان الامتحان</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
                className="w-full px-4 py-3 text-lg border-2 border-gray-300 rounded-lg focus:ring-4 focus:ring-primary focus:border-primary"
                placeholder="مثال: امتحان منتصف الفصل"
              />
            </div>

            <div>
              <label className="block text-lg font-semibold mb-3">الوصف</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={4}
                className="w-full px-4 py-3 text-lg border-2 border-gray-300 rounded-lg focus:ring-4 focus:ring-primary focus:border-primary"
                placeholder="وصف الامتحان..."
              />
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-lg font-semibold mb-3">مدة الامتحان (دقيقة)</label>
                <input
                  type="number"
                  value={formData.durationMinutes}
                  onChange={(e) => setFormData({ ...formData, durationMinutes: parseInt(e.target.value) })}
                  required
                  min="1"
                  className="w-full px-4 py-3 text-lg border-2 border-gray-300 rounded-lg focus:ring-4 focus:ring-primary focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-lg font-semibold mb-3">الدرجة الكاملة</label>
                <input
                  type="number"
                  value={formData.maxScore}
                  onChange={(e) => setFormData({ ...formData, maxScore: parseFloat(e.target.value) })}
                  required
                  min="1"
                  className="w-full px-4 py-3 text-lg border-2 border-gray-300 rounded-lg focus:ring-4 focus:ring-primary focus:border-primary"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-lg font-semibold mb-3">تاريخ البدء</label>
                <input
                  type="datetime-local"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  required
                  className="w-full px-4 py-3 text-lg border-2 border-gray-300 rounded-lg focus:ring-4 focus:ring-primary focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-lg font-semibold mb-3">تاريخ الانتهاء</label>
                <input
                  type="datetime-local"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  required
                  className="w-full px-4 py-3 text-lg border-2 border-gray-300 rounded-lg focus:ring-4 focus:ring-primary focus:border-primary"
                />
              </div>
            </div>

            <div>
              <label className="block text-lg font-semibold mb-3">درجة النجاح</label>
              <input
                type="number"
                value={formData.passingScore}
                onChange={(e) => setFormData({ ...formData, passingScore: parseFloat(e.target.value) })}
                required
                min="0"
                max={formData.maxScore}
                className="w-full px-4 py-3 text-lg border-2 border-gray-300 rounded-lg focus:ring-4 focus:ring-primary focus:border-primary"
              />
            </div>

            <div className="flex gap-4">
              <button
                type="submit"
                className="px-8 py-4 bg-primary text-white rounded-lg font-bold text-lg hover:bg-primary-dark transition btn-large"
              >
                حفظ
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-8 py-4 bg-gray-200 text-gray-700 rounded-lg font-bold text-lg hover:bg-gray-300 transition btn-large"
              >
                إلغاء
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        {exams.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-xl text-gray-500 mb-6">لا توجد امتحانات</p>
            <button
              onClick={() => setShowForm(true)}
              className="px-8 py-4 bg-primary text-white rounded-lg font-bold text-lg hover:bg-primary-dark transition btn-large"
            >
              إنشاء امتحان جديد
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-primary text-white">
                <tr>
                  <th className="px-6 py-4 text-right text-lg font-bold">الامتحان</th>
                  <th className="px-6 py-4 text-right text-lg font-bold">الدورة</th>
                  <th className="px-6 py-4 text-right text-lg font-bold">المدة</th>
                  <th className="px-6 py-4 text-right text-lg font-bold">تاريخ البدء</th>
                  <th className="px-6 py-4 text-right text-lg font-bold">المحاولات</th>
                  <th className="px-6 py-4 text-right text-lg font-bold">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {exams.map((exam) => (
                  <tr key={exam.id} className="hover:bg-gray-50 bg-white">
                    <td className="px-6 py-4">
                      <div>
                        <h3 className="text-lg font-bold text-gray-800">{exam.title}</h3>
                        {exam.description && (
                          <p className="text-base text-gray-600 mt-1">{exam.description}</p>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-lg text-gray-800 font-semibold">{exam.course?.title || 'غير محدد'}</td>
                    <td className="px-6 py-4 text-lg text-gray-800 font-semibold">{exam.durationMinutes} دقيقة</td>
                    <td className="px-6 py-4 text-lg text-gray-800 font-semibold">
                      {new Date(exam.startDate).toLocaleDateString('ar-SA')} {new Date(exam.startDate).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="px-6 py-4 text-lg text-gray-800 font-semibold">{exam._count?.attempts || 0}</td>
                    <td className="px-6 py-4">
                      <div className="flex gap-3">
                        <Link
                          href={`/admin/exams/${exam.id}`}
                          className="px-5 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition text-base font-semibold"
                        >
                          إدارة الأسئلة
                        </Link>
                        <Link
                          href={`/admin/exams/${exam.id}/attempts`}
                          className="px-5 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition text-base font-semibold"
                        >
                          المحاولات
                        </Link>
                        <button
                          onClick={() => handleDelete(exam.id)}
                          className="px-5 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition text-base font-semibold"
                        >
                          حذف
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
  );
}

