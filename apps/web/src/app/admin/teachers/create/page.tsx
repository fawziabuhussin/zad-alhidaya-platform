'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { UserIcon } from '@/components/Icons';

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
    <div className="min-h-screen bg-stone-50">
      {/* Header */}
      <div className="bg-gradient-to-l from-[#1a3a2f] via-[#1f4a3d] to-[#0d2b24] text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center">
                <UserIcon className="text-white" size={20} />
              </div>
              <div>
                <h1 className="text-xl font-bold">إنشاء مدرس جديد</h1>
                <p className="text-white/70 text-sm">إضافة مدرس للمنصة</p>
              </div>
            </div>
            <button
              onClick={() => router.back()}
              className="px-4 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition text-sm"
            >
              العودة
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-white rounded-xl border border-stone-200 p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2 text-stone-700">الاسم</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => {
                  setFormData({ ...formData, name: e.target.value });
                  if (errors.name) setErrors({ ...errors, name: '' });
                }}
                required
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#1a3a2f] text-stone-800 ${
                  errors.name ? 'border-red-500' : 'border-stone-200'
                }`}
                placeholder="اسم المدرس"
              />
              {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-stone-700">البريد الإلكتروني</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => {
                  setFormData({ ...formData, email: e.target.value });
                  if (errors.email) setErrors({ ...errors, email: '' });
                }}
                required
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#1a3a2f] text-stone-800 ${
                  errors.email ? 'border-red-500' : 'border-stone-200'
                }`}
                placeholder="example@email.com"
              />
              {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-stone-700">كلمة المرور</label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => {
                  setFormData({ ...formData, password: e.target.value });
                  if (errors.password) setErrors({ ...errors, password: '' });
                }}
                required
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#1a3a2f] text-stone-800 ${
                  errors.password ? 'border-red-500' : 'border-stone-200'
                }`}
                placeholder="كلمة المرور (6 أحرف على الأقل)"
              />
              {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-6 py-3 bg-[#1a3a2f] text-white rounded-lg font-medium hover:bg-[#2d5a4a] transition disabled:opacity-50"
              >
                {loading ? 'جاري الإنشاء...' : 'إنشاء المدرس'}
              </button>
              <button
                type="button"
                onClick={() => router.back()}
                className="px-6 py-3 bg-stone-100 text-stone-700 rounded-lg hover:bg-stone-200 transition"
              >
                إلغاء
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
