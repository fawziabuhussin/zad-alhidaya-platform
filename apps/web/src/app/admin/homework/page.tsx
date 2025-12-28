'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import api from '@/lib/api';

interface Homework {
  id: string;
  title: string;
  description: string;
  dueDate: string;
  maxScore: number;
  course: { title: string };
  _count: { submissions: number };
}

export default function AdminHomeworkPage() {
  const [homeworks, setHomeworks] = useState<Homework[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [courses, setCourses] = useState<any[]>([]);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [formData, setFormData] = useState({
    courseId: '',
    title: '',
    description: '',
    dueDate: '',
    maxScore: 100,
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
      
      // Load homeworks for all courses
      const allHomeworks: Homework[] = [];
      for (const course of coursesRes.data || []) {
        try {
          const hwRes = await api.get(`/homework/course/${course.id}`);
          // Ensure each homework has course info
          const hwWithCourse = (hwRes.data || []).map((hw: any) => ({
            ...hw,
            course: hw.course || { title: course.title },
          }));
          allHomeworks.push(...hwWithCourse);
        } catch (e) {
          // Skip if no homeworks
        }
      }
      setHomeworks(allHomeworks);
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
      await api.post('/homework', formData);
      setShowForm(false);
      setFormData({
        courseId: '',
        title: '',
        description: '',
        dueDate: '',
        maxScore: 100,
      });
      loadData();
    } catch (error: any) {
      alert(error.response?.data?.message || 'فشل إنشاء الواجب');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا الواجب؟')) return;
    try {
      await api.delete(`/homework/${id}`);
      loadData();
    } catch (error: any) {
      alert(error.response?.data?.message || 'فشل حذف الواجب');
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
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">إدارة الواجبات</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-8 py-4 bg-primary text-white rounded-lg font-bold text-lg hover:bg-primary-dark transition btn-large"
        >
          + واجب جديد
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-lg shadow-lg p-8 border-2 border-primary">
          <h2 className="text-2xl font-bold mb-6">إنشاء واجب جديد</h2>
          <form onSubmit={handleSubmit} className="space-y-6">
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
              <label className="block text-lg font-semibold mb-3">عنوان الواجب</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
                className="w-full px-4 py-3 text-lg border-2 border-gray-300 rounded-lg focus:ring-4 focus:ring-primary focus:border-primary"
                placeholder="مثال: واجب الأسبوع الأول"
              />
            </div>

            <div>
              <label className="block text-lg font-semibold mb-3">الوصف</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                required
                rows={6}
                className="w-full px-4 py-3 text-lg border-2 border-gray-300 rounded-lg focus:ring-4 focus:ring-primary focus:border-primary"
                placeholder="وصف الواجب والمطلوب من الطلاب..."
              />
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-lg font-semibold mb-3">تاريخ الاستحقاق</label>
                <input
                  type="datetime-local"
                  value={formData.dueDate}
                  onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                  required
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
        {homeworks.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-xl text-gray-500 mb-6">لا توجد واجبات</p>
            <button
              onClick={() => setShowForm(true)}
              className="px-8 py-4 bg-primary text-white rounded-lg font-bold text-lg hover:bg-primary-dark transition btn-large"
            >
              إنشاء واجب جديد
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-primary text-white">
                <tr>
                  <th className="px-6 py-4 text-right text-lg font-bold">الواجب</th>
                  <th className="px-6 py-4 text-right text-lg font-bold">الدورة</th>
                  <th className="px-6 py-4 text-right text-lg font-bold">تاريخ الاستحقاق</th>
                  <th className="px-6 py-4 text-right text-lg font-bold">الدرجة</th>
                  <th className="px-6 py-4 text-right text-lg font-bold">التسليمات</th>
                  <th className="px-6 py-4 text-right text-lg font-bold">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {homeworks.map((homework) => {
                  const dueDate = new Date(homework.dueDate);
                  const now = new Date();
                  const isOverdue = now > dueDate;
                  
                  return (
                    <tr key={homework.id} className="hover:bg-gray-50 bg-white">
                      <td className="px-6 py-4">
                        <div className="text-lg font-bold text-gray-800">{homework.title}</div>
                        <div className="text-sm text-gray-600 mt-1">{homework.description}</div>
                      </td>
                      <td className="px-6 py-4 text-lg text-gray-800 font-semibold">{homework.course?.title || 'غير محدد'}</td>
                      <td className="px-6 py-4">
                        <div className="text-lg text-gray-800 font-semibold">{dueDate.toLocaleDateString('ar-SA')}</div>
                        <div className="text-sm text-gray-600 mt-1">
                          {dueDate.toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })}
                        </div>
                        {isOverdue && (
                          <span className="inline-block mt-1 px-3 py-1 bg-red-100 text-red-800 rounded-lg text-sm font-bold">
                            منتهي
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-lg text-gray-800 font-semibold">{homework.maxScore}</td>
                      <td className="px-6 py-4 text-lg text-gray-800 font-semibold">{homework._count?.submissions || 0}</td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          <Link
                            href={`/admin/homework/${homework.id}/submissions`}
                            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition text-base font-semibold"
                          >
                            تصحيح ({homework._count?.submissions || 0})
                          </Link>
                          <button
                            onClick={() => handleDelete(homework.id)}
                            className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition text-base font-semibold"
                          >
                            حذف
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

