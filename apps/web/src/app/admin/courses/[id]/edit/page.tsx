'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import { CreateResourceDTO } from '@/types/resource';
import { ResourceList, ResourceForm } from '@/components/resources';
import { showSuccess, showError, TOAST_MESSAGES } from '@/lib/toast';

// Custom Lesson Type Dropdown
function LessonTypeDropdown({ value, onChange }: { value: string, onChange: (value: string) => void }) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const options = [
    { value: 'VIDEO', label: 'فيديو (YouTube)' },
    { value: 'TEXT', label: 'نص' },
    { value: 'LIVE', label: 'بث مباشر' },
    { value: 'PLAYLIST', label: 'قائمة تشغيل' },
  ];

  return (
    <div className="relative w-full">
      <button
        type="button"
        onClick={() => setDropdownOpen(!dropdownOpen)}
        className="w-full px-4 py-3 text-lg border-2 border-gray-300 rounded-lg focus:ring-4 focus:ring-primary bg-white text-gray-800 font-medium text-right flex items-center justify-between"
        style={{ minHeight: '56px' }}
      >
        <span className="flex-1 text-right">
          {options.find(o => o.value === value)?.label || 'اختر النوع'}
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
            className="absolute z-20 w-full mt-1 bg-white border-2 border-gray-300 rounded-lg shadow-lg"
            style={{ direction: 'rtl' }}
          >
            {options.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  onChange(option.value);
                  setDropdownOpen(false);
                }}
                className={`w-full text-right px-4 py-3 text-lg hover:bg-gray-100 transition ${
                  value === option.value ? 'bg-primary text-white' : 'text-gray-800'
                } ${option.value !== options[0].value ? 'border-t border-gray-200' : ''}`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

interface Category {
  id: string;
  title: string;
}

interface Resource {
  id: string;
  title: string;
  description: string | null;
  url: string;
  order: number;
  courseId: string | null;
  lessonId: string | null;
  createdById: string;
  createdAt: string;
  updatedAt: string;
  createdBy: {
    id: string;
    name: string;
  };
}

interface Lesson {
  id: string;
  title: string;
  type: string;
  youtubeUrl?: string;
  youtubePlaylistId?: string;
  textContent?: string;
  durationMinutes?: number;
  order: number;
  resources?: Resource[];
}

interface Module {
  id: string;
  title: string;
  order: number;
  lessons: Lesson[];
}

interface Exam {
  id: string;
  title: string;
  description?: string;
  maxScore: number;
  startDate: string;
  endDate: string;
}

interface Homework {
  id: string;
  title: string;
  description: string;
  dueDate: string;
  maxScore: number;
}

interface Course {
  id: string;
  title: string;
  description: string;
  coverImage?: string;
  categoryId: string;
  price: number;
  status: string;
  gradingMethod?: string;
  prerequisites?: Array<{
    prerequisite: { id: string; title: string };
  }>;
  teacher?: { id: string; name: string; email: string };
  _count?: { enrollments: number };
  modules: Module[];
  exams?: Exam[];
  homeworks?: Homework[];
  resources?: Resource[];
}

interface CourseSummary {
  id: string;
  title: string;
}

export default function EditCoursePage() {
  const params = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [course, setCourse] = useState<Course | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    coverImage: '',
    categoryId: '',
    price: 0,
    status: 'DRAFT' as 'DRAFT' | 'PUBLISHED',
    gradingMethod: '',
  });
  const [gradingMethod, setGradingMethod] = useState({
    reading: 50,
    homework: 20,
    exam: 30,
  });
  const [exams, setExams] = useState<Exam[]>([]);
  const [homeworks, setHomeworks] = useState<Homework[]>([]);
  const [availablePrerequisites, setAvailablePrerequisites] = useState<CourseSummary[]>([]);
  const [selectedPrerequisites, setSelectedPrerequisites] = useState<string[]>([]);
  const [showExamForm, setShowExamForm] = useState(false);
  const [showHomeworkForm, setShowHomeworkForm] = useState(false);
  
  // Course resources state
  const [courseResources, setCourseResources] = useState<Resource[]>([]);
  const [showCourseResourceForm, setShowCourseResourceForm] = useState(false);
  const [editingCourseResource, setEditingCourseResource] = useState<Resource | null>(null);
  
  // Lesson resources state
  const [showLessonResourceForm, setShowLessonResourceForm] = useState<string | null>(null);
  const [editingLessonResource, setEditingLessonResource] = useState<{
    lessonId: string;
    resource: Resource;
  } | null>(null);
  const [categoryDropdownOpen, setCategoryDropdownOpen] = useState(false);
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false);
  const [lessonTypeDropdownOpen, setLessonTypeDropdownOpen] = useState(false);
  const [examFormData, setExamFormData] = useState({
    title: '',
    description: '',
    durationMinutes: 60,
    startDate: '',
    endDate: '',
    maxScore: 100,
    passingScore: 60,
  });
  const [homeworkFormData, setHomeworkFormData] = useState({
    title: '',
    description: '',
    dueDate: '',
    maxScore: 100,
  });
  const [showModuleForm, setShowModuleForm] = useState(false);
  const [showLessonForm, setShowLessonForm] = useState<string | null>(null);
  const [editingLesson, setEditingLesson] = useState<{ moduleId: string; lesson: Lesson } | null>(null);
  const [moduleFormData, setModuleFormData] = useState({ title: '' });
  const [lessonFormData, setLessonFormData] = useState({
    title: '',
    type: 'VIDEO' as 'VIDEO' | 'TEXT' | 'LIVE' | 'PLAYLIST',
    youtubeUrl: '',
    youtubePlaylistId: '',
    textContent: '',
    durationMinutes: 0,
  });

  useEffect(() => {
    const courseId = Array.isArray(params.id) ? params.id[0] : params.id;
    if (courseId) {
      loadData();
    }
  }, [params.id]);

  const loadData = async () => {
    try {
      const courseId = Array.isArray(params.id) ? params.id[0] : params.id;
      
      if (!courseId) {
        alert('معرف الدورة غير صحيح');
        return;
      }

      const [courseRes, categoriesRes, examsRes, homeworksRes, coursesRes] = await Promise.all([
        api.get(`/courses/${courseId}`),
        api.get('/categories'),
        api.get(`/exams/course/${courseId}`).catch(() => ({ data: [] })),
        api.get(`/homework/course/${courseId}`).catch(() => ({ data: [] })),
        api.get('/courses/admin').catch(() => ({ data: [] })),
      ]);

      const courseData = courseRes.data;
      setCourse(courseData);
      setFormData({
        title: courseData.title || '',
        description: courseData.description || '',
        coverImage: courseData.coverImage || '',
        categoryId: courseData.categoryId || '',
        price: courseData.price || 0,
        status: courseData.status || 'DRAFT',
        gradingMethod: courseData.gradingMethod || '',
      });

      // Load grading method
      if (courseData.gradingMethod) {
        try {
          const grading = JSON.parse(courseData.gradingMethod);
          setGradingMethod({
            reading: grading.reading || 50,
            homework: grading.homework || 20,
            exam: grading.exam || 30,
          });
        } catch {
          // Use default
        }
      }

      setExams(examsRes.data || []);
      setHomeworks(homeworksRes.data || []);
      setCourseResources(courseData.resources || []);
      setCategories(categoriesRes.data || []);
      const allCourses = coursesRes.data || [];
      setAvailablePrerequisites(allCourses.filter((c: CourseSummary) => c.id !== courseId));
      setSelectedPrerequisites(
        (courseData.prerequisites || []).map((prereq: any) => prereq.prerequisite.id)
      );
    } catch (error: any) {
      console.error('Failed to load data:', error);
      showError(error.response?.data?.message || 'فشل تحميل البيانات');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const total = gradingMethod.reading + gradingMethod.homework + gradingMethod.exam;
      if (total !== 100) {
        showError(`المجموع يجب أن يكون 100% (حالياً: ${total}%)`);
        setSaving(false);
        return;
      }

      const updateData: any = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        price: formData.price || 0,
        status: formData.status,
        gradingMethod: JSON.stringify(gradingMethod),
        prerequisiteCourseIds: selectedPrerequisites,
      };

      // Only include categoryId if it's a valid UUID (not empty string)
      if (formData.categoryId && formData.categoryId.trim() !== '') {
        updateData.categoryId = formData.categoryId;
      }

      if (formData.coverImage.trim()) {
        updateData.coverImage = formData.coverImage.trim();
      }

      const courseId = Array.isArray(params.id) ? params.id[0] : params.id;
      await api.put(`/courses/${courseId}`, updateData);
      showSuccess(TOAST_MESSAGES.UPDATE_SUCCESS);
      loadData();
    } catch (error: any) {
      console.error('Failed to update course:', error);
      if (error.response?.data?.errors) {
        const errorMessages = error.response.data.errors.map((e: any) => e.message).join('\n');
        showError(`أخطاء في التحقق: ${errorMessages}`);
      } else {
        showError(error.response?.data?.message || 'فشل تحديث الدورة');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleAddExam = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const courseId = Array.isArray(params.id) ? params.id[0] : params.id;
      await api.post('/exams', {
        courseId: courseId,
        ...examFormData,
      });
      setShowExamForm(false);
      setExamFormData({
        title: '',
        description: '',
        durationMinutes: 60,
        startDate: '',
        endDate: '',
        maxScore: 100,
        passingScore: 60,
      });
      showSuccess(TOAST_MESSAGES.CREATE_SUCCESS);
      loadData();
    } catch (error: any) {
      showError(error.response?.data?.message || 'فشل إضافة الامتحان');
    }
  };

  const handleDeleteExam = async (examId: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا الامتحان؟')) return;
    try {
      await api.delete(`/exams/${examId}`);
      showSuccess(TOAST_MESSAGES.DELETE_SUCCESS);
      loadData();
    } catch (error: any) {
      showError(error.response?.data?.message || 'فشل حذف الامتحان');
    }
  };

  const handleAddHomework = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const courseId = Array.isArray(params.id) ? params.id[0] : params.id;
      await api.post('/homework', {
        courseId: courseId,
        ...homeworkFormData,
      });
      setShowHomeworkForm(false);
      setHomeworkFormData({
        title: '',
        description: '',
        dueDate: '',
        maxScore: 100,
      });
      showSuccess(TOAST_MESSAGES.CREATE_SUCCESS);
      loadData();
    } catch (error: any) {
      showError(error.response?.data?.message || 'فشل إضافة الواجب');
    }
  };

  const handleDeleteHomework = async (homeworkId: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا الواجب؟')) return;
    try {
      await api.delete(`/homework/${homeworkId}`);
      showSuccess(TOAST_MESSAGES.DELETE_SUCCESS);
      loadData();
    } catch (error: any) {
      showError(error.response?.data?.message || 'فشل حذف الواجب');
    }
  };

  // Course Resource Handlers
  const handleAddCourseResource = async (data: CreateResourceDTO) => {
    try {
      const courseId = Array.isArray(params.id) ? params.id[0] : params.id;
      await api.post(`/courses/${courseId}/resources`, data);
      setShowCourseResourceForm(false);
      showSuccess(TOAST_MESSAGES.CREATE_SUCCESS);
      loadData();
    } catch (error: any) {
      showError(error.response?.data?.message || 'فشل إضافة المادة');
      throw error;
    }
  };

  const handleUpdateCourseResource = async (data: CreateResourceDTO) => {
    if (!editingCourseResource) return;
    try {
      const courseId = Array.isArray(params.id) ? params.id[0] : params.id;
      await api.put(`/courses/${courseId}/resources/${editingCourseResource.id}`, data);
      setEditingCourseResource(null);
      setShowCourseResourceForm(false);
      showSuccess(TOAST_MESSAGES.UPDATE_SUCCESS);
      loadData();
    } catch (error: any) {
      showError(error.response?.data?.message || 'فشل تحديث المادة');
      throw error;
    }
  };

  const handleDeleteCourseResource = async (resourceId: string) => {
    if (!confirm('هل أنت متأكد من حذف هذه المادة؟')) return;
    try {
      const courseId = Array.isArray(params.id) ? params.id[0] : params.id;
      await api.delete(`/courses/${courseId}/resources/${resourceId}`);
      showSuccess(TOAST_MESSAGES.DELETE_SUCCESS);
      loadData();
    } catch (error: any) {
      showError(error.response?.data?.message || 'فشل حذف المادة');
    }
  };

  const handleEditCourseResource = (resource: Resource) => {
    setEditingCourseResource(resource);
    setShowCourseResourceForm(true);
  };

  // Lesson Resource Handlers
  const handleAddLessonResource = async (lessonId: string, data: CreateResourceDTO) => {
    try {
      await api.post(`/lessons/${lessonId}/resources`, data);
      setShowLessonResourceForm(null);
      showSuccess(TOAST_MESSAGES.CREATE_SUCCESS);
      loadData();
    } catch (error: any) {
      showError(error.response?.data?.message || 'فشل إضافة المادة');
      throw error;
    }
  };

  const handleUpdateLessonResource = async (data: CreateResourceDTO) => {
    if (!editingLessonResource) return;
    try {
      await api.put(
        `/lessons/${editingLessonResource.lessonId}/resources/${editingLessonResource.resource.id}`,
        data
      );
      setEditingLessonResource(null);
      setShowLessonResourceForm(null);
      showSuccess(TOAST_MESSAGES.UPDATE_SUCCESS);
      loadData();
    } catch (error: any) {
      showError(error.response?.data?.message || 'فشل تحديث المادة');
      throw error;
    }
  };

  const handleDeleteLessonResource = async (lessonId: string, resourceId: string) => {
    if (!confirm('هل أنت متأكد من حذف هذه المادة؟')) return;
    try {
      await api.delete(`/lessons/${lessonId}/resources/${resourceId}`);
      showSuccess(TOAST_MESSAGES.DELETE_SUCCESS);
      loadData();
    } catch (error: any) {
      showError(error.response?.data?.message || 'فشل حذف المادة');
    }
  };

  const handleAddModule = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (!moduleFormData.title.trim()) {
        showError('عنوان الوحدة مطلوب');
        return;
      }

      const courseId = Array.isArray(params.id) ? params.id[0] : params.id;
      
      if (!courseId) {
        showError('معرف الدورة غير صحيح');
        return;
      }

      const response = await api.post('/modules', {
        courseId: courseId,
        title: moduleFormData.title.trim(),
      });
      
      setShowModuleForm(false);
      setModuleFormData({ title: '' });
      showSuccess(TOAST_MESSAGES.CREATE_SUCCESS);
      loadData();
    } catch (error: any) {
      console.error('Error adding module:', error);
      let errorMsg = 'فشل إضافة الوحدة';
      
      if (error.response?.data) {
        if (error.response.data.errors && Array.isArray(error.response.data.errors)) {
          errorMsg = error.response.data.errors.map((e: any) => e.message || e).join(', ');
        } else if (error.response.data.message) {
          errorMsg = error.response.data.message;
        }
      } else if (error.message) {
        errorMsg = error.message;
      }
      
      showError(errorMsg);
    }
  };

  const handleDeleteModule = async (moduleId: string) => {
    if (!confirm('هل أنت متأكد من حذف هذه الوحدة وجميع دروسها؟')) return;
    try {
      await api.delete(`/modules/${moduleId}`);
      showSuccess(TOAST_MESSAGES.DELETE_SUCCESS);
      loadData();
    } catch (error: any) {
      showError(error.response?.data?.message || 'فشل حذف الوحدة');
    }
  };

  const handleAddLesson = async (e: React.FormEvent, moduleId: string) => {
    e.preventDefault();
    try {
      if (!lessonFormData.title.trim()) {
        showError('عنوان الدرس مطلوب');
        return;
      }

      const lessonData: any = {
        moduleId,
        title: lessonFormData.title.trim(),
        type: lessonFormData.type,
        durationMinutes: lessonFormData.durationMinutes || undefined,
      };

      if (lessonFormData.type === 'VIDEO' || lessonFormData.type === 'LIVE') {
        if (!lessonFormData.youtubeUrl.trim()) {
          showError('رابط YouTube مطلوب');
          return;
        }
        lessonData.youtubeUrl = lessonFormData.youtubeUrl.trim();
      } else if (lessonFormData.type === 'PLAYLIST') {
        if (!lessonFormData.youtubeUrl.trim()) {
          showError('رابط قائمة التشغيل مطلوب');
          return;
        }
        lessonData.youtubeUrl = lessonFormData.youtubeUrl.trim();
        lessonData.youtubePlaylistId = extractPlaylistId(lessonFormData.youtubeUrl) || lessonFormData.youtubePlaylistId;
      } else if (lessonFormData.type === 'TEXT') {
        if (!lessonFormData.textContent.trim()) {
          showError('محتوى النص مطلوب');
          return;
        }
        lessonData.textContent = lessonFormData.textContent.trim();
      }

      await api.post('/lessons', lessonData);
      setShowLessonForm(null);
      setEditingLesson(null);
      resetLessonForm();
      showSuccess(TOAST_MESSAGES.CREATE_SUCCESS);
      loadData();
    } catch (error: any) {
      const errorMsg = error.response?.data?.message || error.response?.data?.errors?.[0]?.message || 'فشل إضافة الدرس';
      showError(errorMsg);
    }
  };

  const handleEditLesson = (moduleId: string, lesson: Lesson) => {
    setEditingLesson({ moduleId, lesson });
    setShowLessonForm(moduleId);
    setLessonFormData({
      title: lesson.title,
      type: lesson.type as 'VIDEO' | 'TEXT' | 'LIVE' | 'PLAYLIST',
      youtubeUrl: lesson.youtubeUrl || '',
      youtubePlaylistId: lesson.youtubePlaylistId || '',
      textContent: lesson.textContent || '',
      durationMinutes: lesson.durationMinutes || 0,
    });
  };

  const handleUpdateLesson = async (e: React.FormEvent) => {
    if (!editingLesson) return;
    e.preventDefault();
    try {
      if (!lessonFormData.title.trim()) {
        showError('عنوان الدرس مطلوب');
        return;
      }

      const lessonData: any = {
        title: lessonFormData.title.trim(),
        type: lessonFormData.type,
        durationMinutes: lessonFormData.durationMinutes || undefined,
      };

      if (lessonFormData.type === 'VIDEO' || lessonFormData.type === 'LIVE') {
        if (!lessonFormData.youtubeUrl.trim()) {
          showError('رابط YouTube مطلوب');
          return;
        }
        lessonData.youtubeUrl = lessonFormData.youtubeUrl.trim();
      } else if (lessonFormData.type === 'PLAYLIST') {
        if (!lessonFormData.youtubeUrl.trim()) {
          showError('رابط قائمة التشغيل مطلوب');
          return;
        }
        lessonData.youtubeUrl = lessonFormData.youtubeUrl.trim();
        lessonData.youtubePlaylistId = extractPlaylistId(lessonFormData.youtubeUrl) || lessonFormData.youtubePlaylistId;
      } else if (lessonFormData.type === 'TEXT') {
        if (!lessonFormData.textContent.trim()) {
          showError('محتوى النص مطلوب');
          return;
        }
        lessonData.textContent = lessonFormData.textContent.trim();
      }

      await api.put(`/lessons/${editingLesson.lesson.id}`, lessonData);
      setShowLessonForm(null);
      setEditingLesson(null);
      resetLessonForm();
      showSuccess(TOAST_MESSAGES.UPDATE_SUCCESS);
      loadData();
    } catch (error: any) {
      const errorMsg = error.response?.data?.message || error.response?.data?.errors?.[0]?.message || 'فشل تحديث الدرس';
      showError(errorMsg);
    }
  };

  const handleDeleteLesson = async (lessonId: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا الدرس؟')) return;
    try {
      await api.delete(`/lessons/${lessonId}`);
      showSuccess(TOAST_MESSAGES.DELETE_SUCCESS);
      loadData();
    } catch (error: any) {
      showError(error.response?.data?.message || 'فشل حذف الدرس');
    }
  };

  const resetLessonForm = () => {
    setLessonFormData({
      title: '',
      type: 'VIDEO',
      youtubeUrl: '',
      youtubePlaylistId: '',
      textContent: '',
      durationMinutes: 0,
    });
  };

  const extractYouTubeId = (url: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return match && match[2].length === 11 ? match[2] : null;
  };

  const extractPlaylistId = (url: string) => {
    // Extract playlist ID from URL like: https://www.youtube.com/watch?v=-3P8qEJlAZw&list=PLFx6fzJ-pragRAu1lrKy59RcfQiI0rq2_
    const match = url.match(/[?&]list=([^#&?]*)/);
    return match ? match[1] : null;
  };

  const getPlaylistEmbedUrl = (url: string) => {
    const playlistId = extractPlaylistId(url);
    if (playlistId) {
      return `https://www.youtube.com/embed/videoseries?list=${playlistId}`;
    }
    return null;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 bg-gray-50 min-h-screen">
      <div className="mb-6">
        <button
          onClick={() => router.back()}
          className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition mb-4"
        >
          ← العودة
        </button>
        <h1 className="text-3xl font-bold text-gray-800">تعديل الدورة</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Form */}
        <div className="lg:col-span-2 space-y-6">
          <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-lg p-8 space-y-6">
            <h2 className="text-2xl font-bold mb-4 text-gray-800">المعلومات الأساسية</h2>

            <div>
              <label className="block text-lg font-semibold mb-2 text-gray-800">عنوان الدورة <span className="text-red-500">*</span></label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
                className="w-full px-4 py-3 text-lg border-2 border-gray-300 rounded-lg focus:ring-4 focus:ring-primary focus:border-primary text-gray-800 bg-white"
                placeholder="مثال: مبادئ الفقه الإسلامي"
              />
            </div>

            <div>
              <label className="block text-lg font-semibold mb-2 text-gray-800">وصف الدورة <span className="text-red-500">*</span></label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                required
                rows={6}
                className="w-full px-4 py-3 text-lg border-2 border-gray-300 rounded-lg focus:ring-4 focus:ring-primary focus:border-primary text-gray-800 bg-white"
                placeholder="اكتب وصفاً شاملاً للدورة..."
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="relative w-full">
                <label className="block text-lg font-semibold mb-2 text-gray-800">الفئة <span className="text-red-500">*</span></label>
                <div className="relative w-full">
                  <button
                    type="button"
                    onClick={() => setCategoryDropdownOpen(!categoryDropdownOpen)}
                    className="w-full px-4 py-3 text-lg border-2 border-gray-300 rounded-lg focus:ring-4 focus:ring-primary focus:border-primary bg-white text-gray-800 font-medium text-right flex items-center justify-between"
                    style={{ minHeight: '56px' }}
                  >
                    <span className="flex-1 text-right">
                      {formData.categoryId 
                        ? categories.find(c => c.id === formData.categoryId)?.title || 'اختر الفئة'
                        : 'اختر الفئة'
                      }
                    </span>
                    <svg 
                      className={`w-5 h-5 transition-transform ${categoryDropdownOpen ? 'transform rotate-180' : ''}`}
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  
                  {categoryDropdownOpen && (
                    <>
                      <div 
                        className="fixed inset-0 z-10" 
                        onClick={() => setCategoryDropdownOpen(false)}
                      />
                      <div 
                        className="absolute z-20 w-full mt-1 bg-white border-2 border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto"
                        style={{ direction: 'rtl' }}
                      >
                        <button
                          type="button"
                          onClick={() => {
                            setFormData({ ...formData, categoryId: '' });
                            setCategoryDropdownOpen(false);
                          }}
                          className={`w-full text-right px-4 py-3 text-lg hover:bg-gray-100 transition ${
                            formData.categoryId === '' ? 'bg-primary text-white' : 'text-gray-800'
                          }`}
                        >
                          اختر الفئة
                        </button>
                        {categories.map((cat) => (
                          <button
                            key={cat.id}
                            type="button"
                            onClick={() => {
                              setFormData({ ...formData, categoryId: cat.id });
                              setCategoryDropdownOpen(false);
                            }}
                            className={`w-full text-right px-4 py-3 text-lg hover:bg-gray-100 transition border-t border-gray-200 ${
                              formData.categoryId === cat.id ? 'bg-primary text-white' : 'text-gray-800'
                            }`}
                          >
                            {cat.title}
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-lg font-semibold mb-2 text-gray-800">السعر (ر.س)</label>
                <input
                  type="number"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                  min="0"
                  step="0.01"
                  className="w-full px-4 py-3 text-lg border-2 border-gray-300 rounded-lg focus:ring-4 focus:ring-primary focus:border-primary text-gray-800 bg-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-lg font-semibold mb-2 text-gray-800">المساقات السابقة</label>
              <p className="text-sm text-gray-600 mb-3">
                لا يمكن للطالب التسجيل إلا بعد إكمال المساقات السابقة والنجاح بنسبة 60% على الأقل.
              </p>
              <div className="border-2 border-gray-200 rounded-lg p-4 max-h-56 overflow-y-auto bg-white">
                {availablePrerequisites.length === 0 ? (
                  <p className="text-gray-500 text-sm">لا توجد مساقات متاحة لإضافتها.</p>
                ) : (
                  <div className="space-y-2">
                    {availablePrerequisites.map((courseOption) => (
                      <label key={courseOption.id} className="flex items-center gap-3 text-gray-800">
                        <input
                          type="checkbox"
                          checked={selectedPrerequisites.includes(courseOption.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedPrerequisites([...selectedPrerequisites, courseOption.id]);
                            } else {
                              setSelectedPrerequisites(
                                selectedPrerequisites.filter((id) => id !== courseOption.id)
                              );
                            }
                          }}
                          className="h-4 w-4 text-primary border-gray-300 rounded"
                        />
                        <span>{courseOption.title}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div>
              <label className="block text-lg font-semibold mb-2 text-gray-800">رابط الصورة</label>
              <input
                type="url"
                value={formData.coverImage}
                onChange={(e) => setFormData({ ...formData, coverImage: e.target.value })}
                className="w-full px-4 py-3 text-lg border-2 border-gray-300 rounded-lg focus:ring-4 focus:ring-primary focus:border-primary text-gray-800 bg-white"
                placeholder="https://example.com/image.jpg"
              />
              {formData.coverImage && (
                <div className="mt-4">
                  <img
                    src={formData.coverImage}
                    alt="Preview"
                    className="w-full max-w-md h-48 object-cover rounded-lg border-2 border-gray-300"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                </div>
              )}
            </div>

            <div className="relative w-full">
              <label className="block text-lg font-semibold mb-2 text-gray-800">الحالة</label>
              <div className="relative w-full">
                <button
                  type="button"
                  onClick={() => setStatusDropdownOpen(!statusDropdownOpen)}
                  className="w-full px-4 py-3 text-lg border-2 border-gray-300 rounded-lg focus:ring-4 focus:ring-primary focus:border-primary bg-white text-gray-800 font-medium text-right flex items-center justify-between"
                  style={{ minHeight: '56px' }}
                >
                  <span className="flex-1 text-right">
                    {formData.status === 'DRAFT' ? 'مسودة' : 'منشور'}
                  </span>
                  <svg 
                    className={`w-5 h-5 transition-transform ${statusDropdownOpen ? 'transform rotate-180' : ''}`}
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                
                {statusDropdownOpen && (
                  <>
                    <div 
                      className="fixed inset-0 z-10" 
                      onClick={() => setStatusDropdownOpen(false)}
                    />
                    <div 
                      className="absolute z-20 w-full mt-1 bg-white border-2 border-gray-300 rounded-lg shadow-lg"
                      style={{ direction: 'rtl' }}
                    >
                      <button
                        type="button"
                        onClick={() => {
                          setFormData({ ...formData, status: 'DRAFT' });
                          setStatusDropdownOpen(false);
                        }}
                        className={`w-full text-right px-4 py-3 text-lg hover:bg-gray-100 transition ${
                          formData.status === 'DRAFT' ? 'bg-primary text-white' : 'text-gray-800'
                        }`}
                      >
                        مسودة
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setFormData({ ...formData, status: 'PUBLISHED' });
                          setStatusDropdownOpen(false);
                        }}
                        className={`w-full text-right px-4 py-3 text-lg hover:bg-gray-100 transition border-t border-gray-200 ${
                          formData.status === 'PUBLISHED' ? 'bg-primary text-white' : 'text-gray-800'
                        }`}
                      >
                        منشور
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Grading Method */}
            <div className="bg-blue-50 p-6 rounded-lg border-2 border-blue-300">
              <h3 className="text-xl font-bold mb-4 text-gray-800">طريقة التقييم</h3>
              <p className="text-sm text-gray-700 mb-4">حدد نسب التقييم (يجب أن يكون المجموع 100%)</p>
              <div className="space-y-4">
                <div>
                  <label className="block text-lg font-semibold mb-2 text-gray-800">
                    القراءة والمتابعة: {gradingMethod.reading}%
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={gradingMethod.reading}
                    onChange={(e) => {
                      const reading = parseInt(e.target.value);
                      const remaining = 100 - reading;
                      const homework = Math.min(gradingMethod.homework, remaining);
                      const exam = remaining - homework;
                      setGradingMethod({ reading, homework, exam });
                    }}
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="block text-lg font-semibold mb-2 text-gray-800">
                    الواجبات: {gradingMethod.homework}%
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={gradingMethod.homework}
                    onChange={(e) => {
                      const homework = parseInt(e.target.value);
                      const remaining = 100 - gradingMethod.reading;
                      const maxHomework = Math.min(homework, remaining);
                      const exam = remaining - maxHomework;
                      setGradingMethod({ ...gradingMethod, homework: maxHomework, exam });
                    }}
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="block text-lg font-semibold mb-2">
                    الامتحانات: {gradingMethod.exam}%
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={gradingMethod.exam}
                    onChange={(e) => {
                      const exam = parseInt(e.target.value);
                      const remaining = 100 - gradingMethod.reading - gradingMethod.homework;
                      const maxExam = Math.min(exam, remaining);
                      setGradingMethod({ ...gradingMethod, exam: maxExam });
                    }}
                    className="w-full"
                  />
                </div>
                <div className="mt-4 p-4 bg-white rounded-lg">
                  <p className="text-lg font-bold">
                    المجموع: {gradingMethod.reading + gradingMethod.homework + gradingMethod.exam}%
                    {gradingMethod.reading + gradingMethod.homework + gradingMethod.exam !== 100 && (
                      <span className="text-red-500 mr-2">(يجب أن يكون 100%)</span>
                    )}
                  </p>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full px-6 py-4 bg-primary text-white rounded-lg font-bold text-lg hover:bg-primary-dark transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'جاري الحفظ...' : 'حفظ التغييرات'}
            </button>
          </form>

          {/* Modules and Lessons */}
          <div className="bg-white rounded-lg shadow-lg p-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">الوحدات والدروس</h2>
              <button
                onClick={() => setShowModuleForm(true)}
                className="px-4 py-2 bg-primary text-white rounded-lg font-semibold hover:bg-primary-dark transition"
              >
                + إضافة وحدة
              </button>
            </div>

            {showModuleForm && (
              <form onSubmit={handleAddModule} className="mb-6 p-4 bg-gray-50 rounded-lg border-2 border-primary">
                <h3 className="text-xl font-bold mb-4 text-gray-800">وحدة جديدة</h3>
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={moduleFormData.title}
                    onChange={(e) => setModuleFormData({ title: e.target.value })}
                    required
                    placeholder="عنوان الوحدة"
                    className="flex-1 px-4 py-3 text-lg border-2 border-gray-300 rounded-lg focus:ring-4 focus:ring-primary text-gray-800 bg-white"
                  />
                  <button
                    type="submit"
                    className="px-6 py-3 bg-primary text-white rounded-lg font-semibold hover:bg-primary-dark transition"
                  >
                    إضافة
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowModuleForm(false)}
                    className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition"
                  >
                    إلغاء
                  </button>
                </div>
              </form>
            )}

            <div className="space-y-6">
              {course?.modules && course.modules.length === 0 ? (
                <p className="text-center py-8 text-gray-500">لا توجد وحدات بعد</p>
              ) : (
                course?.modules.map((module) => (
                  <div key={module.id} className="border-2 border-gray-200 rounded-lg p-6 bg-white">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-xl font-bold text-gray-800">{module.title}</h3>
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setShowLessonForm(module.id);
                            setEditingLesson(null);
                            resetLessonForm();
                          }}
                          className="px-4 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition font-semibold"
                        >
                          + إضافة درس
                        </button>
                        <button
                          onClick={() => handleDeleteModule(module.id)}
                          className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition font-semibold"
                        >
                          حذف الوحدة
                        </button>
                      </div>
                    </div>

                    {showLessonForm === module.id && (
                      <form
                        onSubmit={editingLesson ? handleUpdateLesson : (e) => handleAddLesson(e, module.id)}
                        className="mb-4 p-4 bg-blue-50 rounded-lg border-2 border-blue-300"
                      >
                        <h4 className="text-lg font-bold mb-3 text-gray-800">{editingLesson ? 'تعديل الدرس' : 'درس جديد'}</h4>
                        <div className="space-y-3">
                          <input
                            type="text"
                            value={lessonFormData.title}
                            onChange={(e) => setLessonFormData({ ...lessonFormData, title: e.target.value })}
                            required
                            placeholder="عنوان الدرس"
                            className="w-full px-4 py-3 text-lg border-2 border-gray-300 rounded-lg focus:ring-4 focus:ring-primary text-gray-800 bg-white"
                          />
                          <LessonTypeDropdown
                            value={lessonFormData.type}
                            onChange={(type) => setLessonFormData({ ...lessonFormData, type: type as 'VIDEO' | 'TEXT' | 'LIVE' | 'PLAYLIST' })}
                          />
                          {lessonFormData.type === 'VIDEO' && (
                            <>
                              <input
                                type="url"
                                value={lessonFormData.youtubeUrl}
                                onChange={(e) => setLessonFormData({ ...lessonFormData, youtubeUrl: e.target.value })}
                                required
                                placeholder="رابط YouTube (مثال: https://www.youtube.com/watch?v=...)"
                                className="w-full px-4 py-3 text-lg border-2 border-gray-300 rounded-lg focus:ring-4 focus:ring-primary text-gray-800 bg-white"
                              />
                              {lessonFormData.youtubeUrl && extractYouTubeId(lessonFormData.youtubeUrl) && (
                                <div className="mt-2">
                                  <iframe
                                    width="100%"
                                    height="200"
                                    src={`https://www.youtube.com/embed/${extractYouTubeId(lessonFormData.youtubeUrl)}`}
                                    frameBorder="0"
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                    allowFullScreen
                                    className="rounded-lg"
                                  ></iframe>
                                </div>
                              )}
                            </>
                          )}
                          {lessonFormData.type === 'PLAYLIST' && (
                            <>
                              <input
                                type="url"
                                value={lessonFormData.youtubeUrl}
                                onChange={(e) => setLessonFormData({ ...lessonFormData, youtubeUrl: e.target.value })}
                                required
                                placeholder="رابط قائمة التشغيل (مثال: https://www.youtube.com/watch?v=...&list=...)"
                                className="w-full px-4 py-3 text-lg border-2 border-gray-300 rounded-lg focus:ring-4 focus:ring-primary text-gray-800 bg-white"
                              />
                              {lessonFormData.youtubeUrl && getPlaylistEmbedUrl(lessonFormData.youtubeUrl) && (
                                <div className="mt-2">
                                  <iframe
                                    width="100%"
                                    height="300"
                                    src={getPlaylistEmbedUrl(lessonFormData.youtubeUrl)!}
                                    frameBorder="0"
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                    allowFullScreen
                                    className="rounded-lg"
                                  ></iframe>
                                  <p className="text-sm text-gray-600 mt-2">
                                    قائمة تشغيل: {extractPlaylistId(lessonFormData.youtubeUrl)}
                                  </p>
                                </div>
                              )}
                            </>
                          )}
                          {lessonFormData.type === 'TEXT' && (
                            <textarea
                              value={lessonFormData.textContent}
                              onChange={(e) => setLessonFormData({ ...lessonFormData, textContent: e.target.value })}
                              required
                              rows={6}
                              placeholder="محتوى النص"
                              className="w-full px-4 py-3 text-lg border-2 border-gray-300 rounded-lg focus:ring-4 focus:ring-primary text-gray-800 bg-white"
                            />
                          )}
                          {lessonFormData.type === 'LIVE' && (
                            <input
                              type="url"
                              value={lessonFormData.youtubeUrl}
                              onChange={(e) => setLessonFormData({ ...lessonFormData, youtubeUrl: e.target.value })}
                              required
                              placeholder="رابط البث المباشر"
                              className="w-full px-4 py-3 text-lg border-2 border-gray-300 rounded-lg focus:ring-4 focus:ring-primary text-gray-800 bg-white"
                            />
                          )}
                          <div className="flex gap-3">
                            <input
                              type="number"
                              value={lessonFormData.durationMinutes}
                              onChange={(e) =>
                                setLessonFormData({ ...lessonFormData, durationMinutes: parseInt(e.target.value) || 0 })
                              }
                              min="0"
                              placeholder="المدة بالدقائق (اختياري)"
                              className="flex-1 px-4 py-3 text-lg border-2 border-gray-300 rounded-lg focus:ring-4 focus:ring-primary"
                            />
                            <button
                              type="submit"
                              className="px-6 py-3 bg-primary text-white rounded-lg font-semibold hover:bg-primary-dark transition"
                            >
                              {editingLesson ? 'تحديث' : 'إضافة'}
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setShowLessonForm(null);
                                setEditingLesson(null);
                                resetLessonForm();
                              }}
                              className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition"
                            >
                              إلغاء
                            </button>
                          </div>
                        </div>
                      </form>
                    )}

                    <div className="space-y-3">
                      {module.lessons.length === 0 ? (
                        <p className="text-center py-4 text-gray-500">لا توجد دروس في هذه الوحدة</p>
                      ) : (
                        module.lessons.map((lesson) => (
                          <div key={lesson.id} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <h4 className="font-semibold text-lg text-gray-800">{lesson.title}</h4>
                                <div className="mt-2 text-sm text-gray-700">
                                  <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded">
                                    {lesson.type === 'VIDEO' ? 'فيديو' : lesson.type === 'PLAYLIST' ? 'قائمة تشغيل' : lesson.type === 'TEXT' ? 'نص' : 'بث مباشر'}
                                  </span>
                                  {lesson.durationMinutes && (
                                    <span className="mr-2">• {lesson.durationMinutes} دقيقة</span>
                                  )}
                                </div>
                                {lesson.youtubeUrl && lesson.type === 'VIDEO' && (
                                  <div className="mt-3">
                                    <iframe
                                      width="100%"
                                      height="200"
                                      src={
                                        lesson.youtubeUrl.includes('embed')
                                          ? lesson.youtubeUrl
                                          : `https://www.youtube.com/embed/${extractYouTubeId(lesson.youtubeUrl) || ''}`
                                      }
                                      frameBorder="0"
                                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                      allowFullScreen
                                      className="rounded-lg"
                                    ></iframe>
                                  </div>
                                )}
                                {lesson.youtubeUrl && lesson.type === 'PLAYLIST' && (
                                  <div className="mt-3">
                                    <iframe
                                      width="100%"
                                      height="300"
                                      src={
                                        lesson.youtubePlaylistId
                                          ? `https://www.youtube.com/embed/videoseries?list=${lesson.youtubePlaylistId}`
                                          : getPlaylistEmbedUrl(lesson.youtubeUrl) || ''
                                      }
                                      frameBorder="0"
                                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                      allowFullScreen
                                      className="rounded-lg"
                                    ></iframe>
                                    {lesson.youtubePlaylistId && (
                                      <p className="text-sm text-gray-600 mt-2">
                                        قائمة تشغيل: {lesson.youtubePlaylistId}
                                      </p>
                                    )}
                                  </div>
                                )}
                                
                                {/* Lesson Resources Section */}
                                <div className="mt-4 pt-4 border-t border-gray-200">
                                  <div className="flex justify-between items-center mb-3">
                                    <h5 className="text-sm font-bold text-gray-700">
                                      مواد الدرس {lesson.resources && lesson.resources.length > 0 && `(${lesson.resources.length})`}
                                    </h5>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setEditingLessonResource(null);
                                        setShowLessonResourceForm(lesson.id);
                                      }}
                                      className="px-3 py-1 bg-teal-100 text-teal-700 rounded hover:bg-teal-200 transition text-sm font-semibold"
                                    >
                                      + إضافة مادة
                                    </button>
                                  </div>
                                  
                                  {showLessonResourceForm === lesson.id && (
                                    <div className="mb-3">
                                      <ResourceForm
                                        initialData={editingLessonResource?.lessonId === lesson.id ? editingLessonResource.resource : undefined}
                                        onSubmit={
                                          editingLessonResource?.lessonId === lesson.id
                                            ? handleUpdateLessonResource
                                            : (data) => handleAddLessonResource(lesson.id, data)
                                        }
                                        onCancel={() => {
                                          setShowLessonResourceForm(null);
                                          setEditingLessonResource(null);
                                        }}
                                        isEditing={editingLessonResource?.lessonId === lesson.id}
                                      />
                                    </div>
                                  )}
                                  
                                  {lesson.resources && lesson.resources.length > 0 ? (
                                    <ResourceList
                                      resources={lesson.resources}
                                      showActions={true}
                                      onEdit={(resource) => {
                                        setEditingLessonResource({ lessonId: lesson.id, resource });
                                        setShowLessonResourceForm(lesson.id);
                                      }}
                                      onDelete={(resourceId) => handleDeleteLessonResource(lesson.id, resourceId)}
                                    />
                                  ) : (
                                    <p className="text-sm text-gray-500">لا توجد مواد لهذا الدرس</p>
                                  )}
                                </div>
                              </div>
                              <div className="flex gap-2">
                                <button
                                  onClick={() => handleEditLesson(module.id, lesson)}
                                  className="px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition text-sm font-semibold"
                                >
                                  تعديل
                                </button>
                                <button
                                  onClick={() => handleDeleteLesson(lesson.id)}
                                  className="px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 transition text-sm font-semibold"
                                >
                                  حذف
                                </button>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Exams Section */}
          <div className="bg-white rounded-lg shadow-lg p-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">الامتحانات</h2>
              <button
                onClick={() => setShowExamForm(true)}
                className="px-4 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition font-semibold"
              >
                + إضافة امتحان
              </button>
            </div>

            {showExamForm && (
              <form onSubmit={handleAddExam} className="mb-6 p-4 bg-purple-50 rounded-lg border-2 border-purple-300">
                <h3 className="text-xl font-bold mb-4 text-gray-800">امتحان جديد</h3>
                <div className="space-y-3">
                  <div>
                    <label htmlFor="exam-title" className="block text-sm font-semibold text-gray-700 mb-1">
                      عنوان الامتحان <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="exam-title"
                      value={examFormData.title}
                      onChange={(e) => setExamFormData({ ...examFormData, title: e.target.value })}
                      required
                      placeholder="عنوان الامتحان"
                      className="w-full px-4 py-3 text-lg border-2 border-gray-300 rounded-lg focus:ring-4 focus:ring-primary text-gray-800 bg-white"
                    />
                  </div>
                  <div>
                    <label htmlFor="exam-description" className="block text-sm font-semibold text-gray-700 mb-1">
                      وصف الامتحان (اختياري)
                    </label>
                    <textarea
                      id="exam-description"
                      value={examFormData.description}
                      onChange={(e) => setExamFormData({ ...examFormData, description: e.target.value })}
                      placeholder="وصف الامتحان (اختياري)"
                      rows={3}
                      className="w-full px-4 py-3 text-lg border-2 border-gray-300 rounded-lg focus:ring-4 focus:ring-primary text-gray-800 bg-white"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label htmlFor="exam-duration" className="block text-sm font-semibold text-gray-700 mb-1">
                        المدة بالدقائق <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        id="exam-duration"
                        value={examFormData.durationMinutes}
                        onChange={(e) => setExamFormData({ ...examFormData, durationMinutes: parseInt(e.target.value) || 60 })}
                        min="1"
                        placeholder="المدة بالدقائق"
                        className="px-4 py-3 text-lg border-2 border-gray-300 rounded-lg focus:ring-4 focus:ring-primary text-gray-800 bg-white"
                      />
                    </div>
                    <div>
                      <label htmlFor="exam-maxScore" className="block text-sm font-semibold text-gray-700 mb-1">
                        الدرجة الكاملة <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        id="exam-maxScore"
                        value={examFormData.maxScore}
                        onChange={(e) => setExamFormData({ ...examFormData, maxScore: parseInt(e.target.value) || 100 })}
                        min="1"
                        placeholder="الدرجة الكاملة"
                        className="px-4 py-3 text-lg border-2 border-gray-300 rounded-lg focus:ring-4 focus:ring-primary text-gray-800 bg-white"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label htmlFor="exam-startDate" className="block text-sm font-semibold text-gray-700 mb-1">
                        تاريخ البداية <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="datetime-local"
                        id="exam-startDate"
                        value={examFormData.startDate}
                        onChange={(e) => setExamFormData({ ...examFormData, startDate: e.target.value })}
                        required
                        className="px-4 py-3 text-lg border-2 border-gray-300 rounded-lg focus:ring-4 focus:ring-primary text-gray-800 bg-white"
                      />
                    </div>
                    <div>
                      <label htmlFor="exam-endDate" className="block text-sm font-semibold text-gray-700 mb-1">
                        تاريخ النهاية <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="datetime-local"
                        id="exam-endDate"
                        value={examFormData.endDate}
                        onChange={(e) => setExamFormData({ ...examFormData, endDate: e.target.value })}
                        required
                        className="px-4 py-3 text-lg border-2 border-gray-300 rounded-lg focus:ring-4 focus:ring-primary"
                      />
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <button
                      type="submit"
                      className="px-6 py-3 bg-primary text-white rounded-lg font-semibold hover:bg-primary-dark transition"
                    >
                      إضافة
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowExamForm(false)}
                      className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition"
                    >
                      إلغاء
                    </button>
                  </div>
                </div>
              </form>
            )}

            <div className="space-y-3">
              {exams.length === 0 ? (
                <p className="text-center py-8 text-gray-500">لا توجد امتحانات</p>
              ) : (
                exams.map((exam) => (
                  <div key={exam.id} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-semibold text-lg text-gray-800">{exam.title}</h4>
                        {exam.description && (
                          <p className="text-sm text-gray-700 mt-1">{exam.description}</p>
                        )}
                        <div className="mt-2 text-sm text-gray-700">
                          <span>الدرجة الكاملة: {exam.maxScore}</span>
                          <span className="mr-4">
                            • من {new Date(exam.startDate).toLocaleDateString('ar-SA')} {new Date(exam.startDate).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          <span>
                            إلى {new Date(exam.endDate).toLocaleDateString('ar-SA')} {new Date(exam.endDate).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Link
                          href={`/admin/exams/${exam.id}`}
                          className="px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition text-sm font-semibold"
                        >
                          إدارة
                        </Link>
                        <button
                          onClick={() => handleDeleteExam(exam.id)}
                          className="px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 transition text-sm font-semibold"
                        >
                          حذف
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Homework Section */}
          <div className="bg-white rounded-lg shadow-lg p-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800">الواجبات</h2>
              <button
                onClick={() => setShowHomeworkForm(true)}
                className="px-4 py-2 bg-orange-100 text-orange-700 rounded-lg hover:bg-orange-200 transition font-semibold"
              >
                + إضافة واجب
              </button>
            </div>

            {showHomeworkForm && (
              <form onSubmit={handleAddHomework} className="mb-6 p-4 bg-orange-50 rounded-lg border-2 border-orange-300">
                <h3 className="text-xl font-bold mb-4 text-gray-800">واجب جديد</h3>
                <div className="space-y-3">
                  <div>
                    <label htmlFor="homework-title" className="block text-sm font-semibold text-gray-700 mb-1">
                      عنوان الواجب <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="homework-title"
                      value={homeworkFormData.title}
                      onChange={(e) => setHomeworkFormData({ ...homeworkFormData, title: e.target.value })}
                      required
                      placeholder="عنوان الواجب"
                      className="w-full px-4 py-3 text-lg border-2 border-gray-300 rounded-lg focus:ring-4 focus:ring-primary text-gray-800 bg-white"
                    />
                  </div>
                  <div>
                    <label htmlFor="homework-description" className="block text-sm font-semibold text-gray-700 mb-1">
                      وصف الواجب <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      id="homework-description"
                      value={homeworkFormData.description}
                      onChange={(e) => setHomeworkFormData({ ...homeworkFormData, description: e.target.value })}
                      required
                      placeholder="وصف الواجب"
                      rows={4}
                      className="w-full px-4 py-3 text-lg border-2 border-gray-300 rounded-lg focus:ring-4 focus:ring-primary text-gray-800 bg-white"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label htmlFor="homework-dueDate" className="block text-sm font-semibold text-gray-700 mb-1">
                        تاريخ الإنتهاء <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="datetime-local"
                        id="homework-dueDate"
                        value={homeworkFormData.dueDate}
                        onChange={(e) => setHomeworkFormData({ ...homeworkFormData, dueDate: e.target.value })}
                        required
                        className="px-4 py-3 text-lg border-2 border-gray-300 rounded-lg focus:ring-4 focus:ring-primary text-gray-800 bg-white"
                      />
                    </div>
                    <div>
                      <label htmlFor="homework-maxScore" className="block text-sm font-semibold text-gray-700 mb-1">
                        الدرجة الكاملة <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        id="homework-maxScore"
                        value={homeworkFormData.maxScore}
                        onChange={(e) => setHomeworkFormData({ ...homeworkFormData, maxScore: parseInt(e.target.value) || 100 })}
                        min="1"
                        placeholder="الدرجة الكاملة"
                        className="px-4 py-3 text-lg border-2 border-gray-300 rounded-lg focus:ring-4 focus:ring-primary text-gray-800 bg-white"
                      />
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <button
                      type="submit"
                      className="px-6 py-3 bg-primary text-white rounded-lg font-semibold hover:bg-primary-dark transition"
                    >
                      إضافة
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowHomeworkForm(false)}
                      className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition"
                    >
                      إلغاء
                    </button>
                  </div>
                </div>
              </form>
            )}

            <div className="space-y-3">
              {homeworks.length === 0 ? (
                <p className="text-center py-8 text-gray-500">لا توجد واجبات</p>
              ) : (
                homeworks.map((homework) => (
                  <div key={homework.id} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-semibold text-lg">{homework.title}</h4>
                        <p className="text-sm text-gray-600 mt-1">{homework.description}</p>
                        <div className="mt-2 text-sm text-gray-600">
                          <span>الدرجة الكاملة: {homework.maxScore}</span>
                          <span className="mr-4">• تاريخ الاستحقاق: {new Date(homework.dueDate).toLocaleDateString('ar-SA')}</span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Link
                          href={`/admin/homework/${homework.id}/submissions`}
                          className="px-3 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200 transition text-sm font-semibold"
                        >
                          تصحيح
                        </Link>
                        <button
                          onClick={() => handleDeleteHomework(homework.id)}
                          className="px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 transition text-sm font-semibold"
                        >
                          حذف
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Course Resources Section */}
          <div className="bg-white rounded-lg shadow-lg p-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800">مواد الدورة</h2>
              <button
                onClick={() => {
                  setEditingCourseResource(null);
                  setShowCourseResourceForm(true);
                }}
                className="px-4 py-2 bg-teal-100 text-teal-700 rounded-lg hover:bg-teal-200 transition font-semibold"
              >
                + إضافة مادة
              </button>
            </div>

            {showCourseResourceForm && (
              <div className="mb-6">
                <ResourceForm
                  initialData={editingCourseResource || undefined}
                  onSubmit={editingCourseResource ? handleUpdateCourseResource : handleAddCourseResource}
                  onCancel={() => {
                    setShowCourseResourceForm(false);
                    setEditingCourseResource(null);
                  }}
                  isEditing={!!editingCourseResource}
                />
              </div>
            )}

            <ResourceList
              resources={courseResources}
              showActions={true}
              onEdit={handleEditCourseResource}
              onDelete={handleDeleteCourseResource}
              emptyMessage="لا توجد مواد للدورة"
            />
          </div>
        </div>

        {/* Sidebar - Course Info */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-lg p-6 sticky top-4 space-y-6">
            <div>
              <h3 className="text-xl font-bold mb-4 text-gray-800">معلومات الدورة</h3>
              <div className="space-y-3 text-sm">
                <div>
                  <span className="font-semibold text-gray-700">المدرس:</span>
                  <p className="text-gray-800">{course?.teacher?.name || 'غير محدد'}</p>
                </div>
                <div>
                  <span className="font-semibold text-gray-700">التسجيلات:</span>
                  <p className="text-gray-800">{course?._count?.enrollments || 0}</p>
                </div>
                <div>
                  <span className="font-semibold text-gray-700">الوحدات:</span>
                  <p className="text-gray-800">{course?.modules?.length || 0}</p>
                </div>
                <div>
                  <span className="font-semibold text-gray-700">الدروس:</span>
                  <p className="text-gray-800">
                    {course?.modules?.reduce((sum, m) => sum + (m.lessons?.length || 0), 0) || 0}
                  </p>
                </div>
                <div>
                  <span className="font-semibold text-gray-700">الامتحانات:</span>
                  <p className="text-gray-800">{exams.length}</p>
                </div>
                <div>
                  <span className="font-semibold text-gray-700">الواجبات:</span>
                  <p className="text-gray-800">{homeworks.length}</p>
                </div>
                <div>
                  <span className="font-semibold text-gray-700">المواد:</span>
                  <p className="text-gray-800">{courseResources.length}</p>
                </div>
                <div>
                  <span className="font-semibold text-gray-700">مواد الدروس:</span>
                  <p className="text-gray-800">
                    {course?.modules?.reduce(
                      (sum, m) => sum + m.lessons.reduce((lSum, l) => lSum + (l.resources?.length || 0), 0),
                      0
                    ) || 0}
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-gray-200">
              <h3 className="text-xl font-bold mb-4 text-gray-800">طريقة التقييم الحالية</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-700">القراءة:</span>
                  <span className="font-semibold text-gray-800">{gradingMethod.reading}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-700">الواجبات:</span>
                  <span className="font-semibold text-gray-800">{gradingMethod.homework}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-700">الامتحانات:</span>
                  <span className="font-semibold text-gray-800">{gradingMethod.exam}%</span>
                </div>
                <div className="pt-2 border-t border-gray-200">
                  <div className="flex justify-between font-bold">
                    <span className="text-gray-800">المجموع:</span>
                    <span>{gradingMethod.reading + gradingMethod.homework + gradingMethod.exam}%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
