'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { UserIcon } from '@/components/Icons';
import DatePicker from '@/components/DatePicker';
import GenderSelect from '@/components/GenderSelect';
import { showSuccess, showError } from '@/lib/toast';

export default function CreateTeacherPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    fatherName: '',
    familyName: '',
    email: '',
    password: '',
    dateOfBirth: null as Date | null,
    phone: '',
    profession: '',
    gender: '' as 'MALE' | 'FEMALE' | '',
    idNumber: '',
  });
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    // Validation
    const newErrors: { [key: string]: string } = {};

    if (!formData.firstName || formData.firstName.length < 2) {
      newErrors.firstName = 'الاسم الشخصي يجب أن يكون حرفين على الأقل';
    }
    if (!formData.fatherName || formData.fatherName.length < 2) {
      newErrors.fatherName = 'اسم الوالد يجب أن يكون حرفين على الأقل';
    }
    if (!formData.familyName || formData.familyName.length < 2) {
      newErrors.familyName = 'اسم العائلة يجب أن يكون حرفين على الأقل';
    }
    if (!formData.email || !formData.email.includes('@')) {
      newErrors.email = 'البريد الإلكتروني غير صحيح';
    }
    if (!formData.password || formData.password.length < 6) {
      newErrors.password = 'كلمة المرور يجب أن تكون على الأقل 6 أحرف';
    }
    if (!formData.dateOfBirth) {
      newErrors.dateOfBirth = 'تاريخ الولادة مطلوب';
    }
    if (!formData.phone || formData.phone.length < 7 || formData.phone.length > 10) {
      newErrors.phone = 'رقم الهاتف يجب أن يكون بين 7 و 10 أرقام';
    } else if (!/^[0-9]+$/.test(formData.phone)) {
      newErrors.phone = 'رقم الهاتف يجب أن يحتوي على أرقام فقط';
    }
    if (!formData.profession || formData.profession.length < 2) {
      newErrors.profession = 'المهنة مطلوبة';
    }
    if (!formData.gender) {
      newErrors.gender = 'يرجى اختيار الجنس';
    }
    if (!formData.idNumber || formData.idNumber.length !== 9) {
      newErrors.idNumber = 'رقم الهوية يجب أن يكون 9 أرقام بالضبط';
    } else if (!/^[0-9]+$/.test(formData.idNumber)) {
      newErrors.idNumber = 'رقم الهوية يجب أن يحتوي على أرقام فقط';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    if (!confirm('هل أنت متأكد من إنشاء هذا المدرس؟')) {
      return;
    }

    setLoading(true);
    try {
      await api.post('/users/teachers', {
        firstName: formData.firstName,
        fatherName: formData.fatherName,
        familyName: formData.familyName,
        email: formData.email,
        password: formData.password,
        dateOfBirth: formData.dateOfBirth?.toISOString(),
        phone: formData.phone,
        profession: formData.profession,
        gender: formData.gender,
        idNumber: formData.idNumber,
      });
      showSuccess('تم إنشاء المدرس بنجاح!');
      router.push('/admin/users');
    } catch (error: any) {
      showError(error.response?.data?.message || 'فشل إنشاء المدرس');
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
            {/* Name fields in 3-column grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-sm font-medium mb-2 text-stone-700">
                  الاسم الشخصي <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.firstName}
                  onChange={(e) => {
                    setFormData({ ...formData, firstName: e.target.value });
                    if (errors.firstName) setErrors({ ...errors, firstName: '' });
                  }}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#1a3a2f] text-stone-800 ${
                    errors.firstName ? 'border-red-500' : 'border-stone-200'
                  }`}
                  placeholder="الاسم"
                />
                {errors.firstName && <p className="text-red-500 text-xs mt-1">{errors.firstName}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 text-stone-700">
                  اسم الوالد <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.fatherName}
                  onChange={(e) => {
                    setFormData({ ...formData, fatherName: e.target.value });
                    if (errors.fatherName) setErrors({ ...errors, fatherName: '' });
                  }}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#1a3a2f] text-stone-800 ${
                    errors.fatherName ? 'border-red-500' : 'border-stone-200'
                  }`}
                  placeholder="الوالد"
                />
                {errors.fatherName && <p className="text-red-500 text-xs mt-1">{errors.fatherName}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 text-stone-700">
                  اسم العائلة <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.familyName}
                  onChange={(e) => {
                    setFormData({ ...formData, familyName: e.target.value });
                    if (errors.familyName) setErrors({ ...errors, familyName: '' });
                  }}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#1a3a2f] text-stone-800 ${
                    errors.familyName ? 'border-red-500' : 'border-stone-200'
                  }`}
                  placeholder="العائلة"
                />
                {errors.familyName && <p className="text-red-500 text-xs mt-1">{errors.familyName}</p>}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-stone-700">
                البريد الإلكتروني <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => {
                  setFormData({ ...formData, email: e.target.value });
                  if (errors.email) setErrors({ ...errors, email: '' });
                }}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#1a3a2f] text-stone-800 ${
                  errors.email ? 'border-red-500' : 'border-stone-200'
                }`}
                placeholder="example@email.com"
              />
              {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-stone-700">
                كلمة المرور <span className="text-red-500">*</span>
              </label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => {
                  setFormData({ ...formData, password: e.target.value });
                  if (errors.password) setErrors({ ...errors, password: '' });
                }}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#1a3a2f] text-stone-800 ${
                  errors.password ? 'border-red-500' : 'border-stone-200'
                }`}
                placeholder="كلمة المرور (6 أحرف على الأقل)"
              />
              {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
            </div>

            {/* Profile section */}
            <div className="border-t border-stone-200 pt-4 mt-4">
              <h3 className="text-lg font-bold text-stone-800 mb-4">البيانات الشخصية</h3>

              <DatePicker
                label="تاريخ الولادة"
                value={formData.dateOfBirth}
                onChange={(date) => {
                  setFormData({ ...formData, dateOfBirth: date });
                  if (errors.dateOfBirth) setErrors({ ...errors, dateOfBirth: '' });
                }}
                maxDate={new Date()}
                minDate={new Date('1900-01-01')}
                placeholder="اختر تاريخ الولادة"
                error={errors.dateOfBirth}
                required
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                <div>
                  <label className="block text-sm font-medium mb-2 text-stone-700">
                    الهاتف <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '');
                      setFormData({ ...formData, phone: value });
                      if (errors.phone) setErrors({ ...errors, phone: '' });
                    }}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#1a3a2f] text-stone-800 ${
                      errors.phone ? 'border-red-500' : 'border-stone-200'
                    }`}
                    placeholder="05xxxxxxxx"
                    maxLength={10}
                  />
                  {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 text-stone-700">
                    المهنة <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.profession}
                    onChange={(e) => {
                      setFormData({ ...formData, profession: e.target.value });
                      if (errors.profession) setErrors({ ...errors, profession: '' });
                    }}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#1a3a2f] text-stone-800 ${
                      errors.profession ? 'border-red-500' : 'border-stone-200'
                    }`}
                    placeholder="المهنة"
                  />
                  {errors.profession && <p className="text-red-500 text-xs mt-1">{errors.profession}</p>}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                <GenderSelect
                  label="الجنس"
                  value={formData.gender}
                  onChange={(value) => {
                    setFormData({ ...formData, gender: value });
                    if (errors.gender) setErrors({ ...errors, gender: '' });
                  }}
                  error={errors.gender}
                  required
                />
                <div>
                  <label className="block text-sm font-medium mb-2 text-stone-700">
                    رقم الهوية <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.idNumber}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '');
                      setFormData({ ...formData, idNumber: value });
                      if (errors.idNumber) setErrors({ ...errors, idNumber: '' });
                    }}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#1a3a2f] text-stone-800 ${
                      errors.idNumber ? 'border-red-500' : 'border-stone-200'
                    }`}
                    placeholder="رقم الهوية (9 أرقام)"
                    maxLength={9}
                  />
                  {errors.idNumber && <p className="text-red-500 text-xs mt-1">{errors.idNumber}</p>}
                </div>
              </div>
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
