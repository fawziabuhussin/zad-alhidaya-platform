'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';

export default function CreateTeacherPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
  });
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    // Validation
    if (!formData.name || formData.name.length < 2) {
      setErrors({ name: 'الاسم يجب أن يكون على الأقل حرفين' });
      return;
    }
    if (!formData.email || !formData.email.includes('@')) {
      setErrors({ email: 'البريد الإلكتروني غير صحيح' });
      return;
    }
    if (!formData.password || formData.password.length < 6) {
      setErrors({ password: 'كلمة المرور يجب أن تكون على الأقل 6 أحرف' });
      return;
    }

    if (!confirm('هل أنت متأكد من إنشاء هذا المدرس؟')) {
      return;
    }

    setLoading(true);
    try {
      await api.post('/users/teachers', formData);
      alert('تم إنشاء المدرس بنجاح!');
      router.push('/admin/users');
    } catch (error: any) {
      alert(error.response?.data?.message || 'فشل إنشاء المدرس');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 bg-gray-50 min-h-screen p-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-800">إنشاء مدرس جديد</h1>
        <button
          onClick={() => router.back()}
          className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-semibold text-lg hover:bg-gray-300 transition"
        >
          ← العودة
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-lg p-8 max-w-2xl">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-lg font-semibold mb-2 text-gray-800">الاسم *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => {
                setFormData({ ...formData, name: e.target.value });
                if (errors.name) setErrors({ ...errors, name: '' });
              }}
              required
              className={`w-full px-4 py-3 text-lg border-2 rounded-lg focus:ring-4 focus:ring-primary focus:border-primary text-gray-800 bg-white ${
                errors.name ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="اسم المدرس"
            />
            {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
          </div>

          <div>
            <label className="block text-lg font-semibold mb-2 text-gray-800">البريد الإلكتروني *</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => {
                setFormData({ ...formData, email: e.target.value });
                if (errors.email) setErrors({ ...errors, email: '' });
              }}
              required
              className={`w-full px-4 py-3 text-lg border-2 rounded-lg focus:ring-4 focus:ring-primary focus:border-primary text-gray-800 bg-white ${
                errors.email ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="example@email.com"
            />
            {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
          </div>

          <div>
            <label className="block text-lg font-semibold mb-2 text-gray-800">كلمة المرور *</label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => {
                setFormData({ ...formData, password: e.target.value });
                if (errors.password) setErrors({ ...errors, password: '' });
              }}
              required
              className={`w-full px-4 py-3 text-lg border-2 rounded-lg focus:ring-4 focus:ring-primary focus:border-primary text-gray-800 bg-white ${
                errors.password ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="كلمة المرور (6 أحرف على الأقل)"
            />
            {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password}</p>}
          </div>

          <div className="flex gap-4 pt-4">
            <button
              type="submit"
              disabled={loading}
              className="px-8 py-4 bg-primary text-white rounded-lg font-bold text-lg hover:bg-primary-dark transition btn-large disabled:opacity-50"
            >
              {loading ? 'جاري الإنشاء...' : 'إنشاء المدرس'}
            </button>
            <button
              type="button"
              onClick={() => router.back()}
              className="px-8 py-4 bg-gray-200 text-gray-700 rounded-lg font-bold text-lg hover:bg-gray-300 transition btn-large"
            >
              إلغاء
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}




