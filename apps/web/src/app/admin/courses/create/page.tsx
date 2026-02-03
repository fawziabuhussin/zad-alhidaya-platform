'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import api from '@/lib/api';

interface Category {
  id: string;
  title: string;
}

export default function CreateCoursePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const categoryIdParam = searchParams.get('categoryId');
  const [loading, setLoading] = useState(false);
  const [loadingPlaylist, setLoadingPlaylist] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryDropdownOpen, setCategoryDropdownOpen] = useState(false);
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    coverImage: '',
    categoryId: '',
    price: 0,
    status: 'DRAFT' as 'DRAFT' | 'PUBLISHED',
  });
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [playlistUrl, setPlaylistUrl] = useState('');
  const [showPlaylistOption, setShowPlaylistOption] = useState(false);

  useEffect(() => {
    loadCategories();
  }, [categoryIdParam]);

  const loadCategories = async () => {
    try {
      const response = await api.get('/categories');
      const categoryList = response.data || [];
      setCategories(categoryList);
      setFormData((prev) => {
        const hasSelection = !!prev.categoryId && prev.categoryId.trim() !== '';
        const matchedCategory = categoryIdParam
          ? categoryList.find((cat: Category) => cat.id === categoryIdParam)
          : null;

        if (matchedCategory) {
          return { ...prev, categoryId: matchedCategory.id };
        }

        if (!hasSelection && categoryList.length > 0) {
          return { ...prev, categoryId: categoryList[0].id };
        }

        return prev;
      });
    } catch (error) {
      console.error('Failed to load categories:', error);
    }
  };

  const extractPlaylistId = (url: string) => {
    // Try multiple patterns to extract playlist ID
    const patterns = [
      /[?&]list=([^#&?]*)/,  // Standard: ?list=... or &list=...
      /\/playlist\?list=([^#&?]*)/,  // /playlist?list=...
      /list=([^#&?]*)/,  // Just list=...
    ];
    
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match && match[1]) {
        return match[1];
      }
    }
    return null;
  };

  const handleCreateFromPlaylist = async () => {
    if (!playlistUrl.trim()) {
      alert('يرجى إدخال رابط قائمة التشغيل');
      return;
    }

    const playlistId = extractPlaylistId(playlistUrl);
    if (!playlistId) {
      alert('رابط قائمة التشغيل غير صحيح');
      return;
    }

    if (!formData.title.trim()) {
      alert('يرجى إدخال عنوان الدورة');
      return;
    }

    if (!formData.categoryId) {
      alert('يرجى اختيار الفئة');
      return;
    }

    setLoadingPlaylist(true);

    try {
      // Create course first
      const courseData: any = {
        title: formData.title.trim(),
        description: formData.description.trim() || `دورة من قائمة تشغيل YouTube`,
        categoryId: formData.categoryId,
        price: formData.price || 0,
        status: formData.status,
      };

      if (formData.coverImage && formData.coverImage.trim()) {
        try {
          new URL(formData.coverImage.trim());
          courseData.coverImage = formData.coverImage.trim();
        } catch {
          // Invalid URL, skip it
        }
      }

      // Use the playlist API endpoint
      const response = await api.post('/playlists/create-course', {
        playlistUrl: playlistUrl.trim(),
        courseTitle: formData.title.trim(),
        courseDescription: formData.description.trim() || `دورة من قائمة تشغيل YouTube`,
        categoryId: formData.categoryId,
        coverImage: formData.coverImage && formData.coverImage.trim() ? formData.coverImage.trim() : undefined,
        price: formData.price || 0,
        status: formData.status,
      });

      const videosCount = response.data.videosCount || response.data.lessons?.length || 0;
      if (videosCount > 0) {
        alert(`تم إنشاء الدورة بنجاح مع ${videosCount} درس من قائمة التشغيل!`);
      } else {
        alert('تم إنشاء الدورة من قائمة التشغيل. سيتم استخدام قائمة التشغيل المدمجة.');
      }
      router.push(`/admin/courses/${response.data.course.id}/edit`);
    } catch (error: any) {
      console.error('Failed to create course from playlist:', error);
      if (error.response?.data?.errors) {
        const errorMessages = error.response.data.errors.map((e: any) => e.message).join('\n');
        alert(`أخطاء:\n${errorMessages}`);
      } else {
        alert(error.response?.data?.message || 'فشل إنشاء الدورة من قائمة التشغيل');
      }
    } finally {
      setLoadingPlaylist(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});

    try {
      // Validate
      if (!formData.title.trim()) {
        setErrors({ title: 'العنوان مطلوب' });
        setLoading(false);
        return;
      }
      if (!formData.description.trim()) {
        setErrors({ description: 'الوصف مطلوب' });
        setLoading(false);
        return;
      }
      if (!formData.categoryId) {
        setErrors({ categoryId: 'يجب اختيار الفئة' });
        setLoading(false);
        return;
      }

      const courseData: any = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        categoryId: formData.categoryId,
        price: formData.price || 0,
        status: formData.status,
      };

      if (formData.coverImage && formData.coverImage.trim()) {
        try {
          new URL(formData.coverImage.trim());
          courseData.coverImage = formData.coverImage.trim();
        } catch {
          // Invalid URL, skip it
        }
      }

      const response = await api.post('/courses', courseData);
      alert('تم إنشاء الدورة بنجاح!');
      router.push(`/admin/courses/${response.data.id}/edit`);
    } catch (error: any) {
      console.error('Failed to create course:', error);
      if (error.response?.data?.errors) {
        const errorMap: { [key: string]: string } = {};
        error.response.data.errors.forEach((err: any) => {
          errorMap[err.path[0]] = err.message;
        });
        setErrors(errorMap);
      } else {
        alert(error.response?.data?.message || 'فشل إنشاء الدورة');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 bg-gray-50 min-h-screen">
      <div className="mb-6">
        <button
          onClick={() => router.back()}
          className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition mb-4"
        >
          ← العودة
        </button>
        <h1 className="text-3xl font-bold text-gray-800">إنشاء دورة جديدة</h1>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-lg p-8 space-y-6">
        <h2 className="text-2xl font-bold mb-4 text-gray-800">إنشاء دورة يدوياً</h2>

        <div>
          <label className="block text-lg font-semibold mb-2 text-gray-800">عنوان الدورة *</label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => {
              setFormData({ ...formData, title: e.target.value });
              if (errors.title) setErrors({ ...errors, title: '' });
            }}
            required
            className={`w-full px-4 py-3 text-lg border-2 rounded-lg focus:ring-4 focus:ring-primary focus:border-primary text-gray-800 bg-white ${
              errors.title ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="مثال: مبادئ الفقه الإسلامي"
          />
          {errors.title && <p className="text-red-500 text-sm mt-1">{errors.title}</p>}
        </div>

        <div>
          <label className="block text-lg font-semibold mb-2 text-gray-800">وصف الدورة *</label>
          <textarea
            value={formData.description}
            onChange={(e) => {
              setFormData({ ...formData, description: e.target.value });
              if (errors.description) setErrors({ ...errors, description: '' });
            }}
            required
            rows={6}
            className={`w-full px-4 py-3 text-lg border-2 rounded-lg focus:ring-4 focus:ring-primary focus:border-primary text-gray-800 bg-white ${
              errors.description ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="اكتب وصفاً شاملاً للدورة..."
          />
          {errors.description && <p className="text-red-500 text-sm mt-1">{errors.description}</p>}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="relative w-full">
            <label className="block text-lg font-semibold mb-2 text-gray-800">الفئة *</label>
            <div className="relative w-full">
              <button
                type="button"
                onClick={() => setCategoryDropdownOpen(!categoryDropdownOpen)}
                className={`w-full px-4 py-3 text-lg border-2 rounded-lg focus:ring-4 focus:ring-primary focus:border-primary bg-white text-gray-800 font-medium text-right flex items-center justify-between ${
                  errors.categoryId ? 'border-red-500' : 'border-gray-300'
                }`}
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
                          if (errors.categoryId) setErrors({ ...errors, categoryId: '' });
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
            {errors.categoryId && <p className="text-red-500 text-sm mt-1">{errors.categoryId}</p>}
            {categories.length === 0 && (
              <p className="text-yellow-600 text-sm mt-1">جاري تحميل الفئات...</p>
            )}
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
          <label className="block text-lg font-semibold mb-2 text-gray-800">رابط الصورة (اختياري)</label>
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

        <div className="flex gap-4 pt-4">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 px-6 py-4 bg-primary text-white rounded-lg font-bold text-lg hover:bg-primary-dark transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'جاري الإنشاء...' : 'إنشاء الدورة'}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="px-6 py-4 bg-gray-200 text-gray-700 rounded-lg font-bold text-lg hover:bg-gray-300 transition"
          >
            إلغاء
          </button>
        </div>
      </form>

      {/* Playlist Option - Moved to bottom */}
      <div className="mt-6 bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-300 rounded-xl p-6 shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-800">إنشاء من قائمة تشغيل YouTube (اختياري)</h2>
          <button
            onClick={() => setShowPlaylistOption(!showPlaylistOption)}
            className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition font-semibold shadow-sm"
          >
            {showPlaylistOption ? 'إخفاء' : 'إظهار'}
          </button>
        </div>

        {showPlaylistOption && (
          <div className="space-y-4 animate-in fade-in-0 slide-in-from-top-2 duration-200">
            <div>
              <label className="block text-lg font-semibold mb-2 text-gray-800">رابط قائمة التشغيل</label>
              <input
                type="url"
                value={playlistUrl}
                onChange={(e) => setPlaylistUrl(e.target.value)}
                className="w-full px-4 py-3 text-lg border-2 border-gray-300 rounded-lg focus:ring-4 focus:ring-primary focus:border-primary text-gray-800 bg-white"
                placeholder="https://www.youtube.com/watch?v=...&list=..."
              />
              <p className="text-sm text-gray-700 mt-2">
                سيتم إنشاء دورة كاملة من قائمة التشغيل تلقائياً
              </p>
            </div>
            <button
              onClick={handleCreateFromPlaylist}
              disabled={loadingPlaylist}
              className="w-full px-6 py-4 bg-blue-600 text-white rounded-lg font-bold text-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
            >
              {loadingPlaylist ? 'جاري الإنشاء...' : 'إنشاء الدورة من قائمة التشغيل'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
