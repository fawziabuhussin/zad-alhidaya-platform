'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';

interface Homework {
  id: string;
  title: string;
  description: string;
  dueDate: string;
  maxScore: number;
  course: { title: string; id: string };
}

export default function SubmitHomeworkPage() {
  const params = useParams();
  const router = useRouter();
  const [homework, setHomework] = useState<Homework | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    content: '',
    attachments: '',
  });

  useEffect(() => {
    loadHomework();
  }, [params.id]);

  const loadHomework = async () => {
    try {
      const homeworkId = Array.isArray(params.id) ? params.id[0] : params.id;
      const response = await api.get(`/homework/${homeworkId}`);
      setHomework(response.data);
    } catch (error: any) {
      console.error('Failed to load homework:', error);
      alert(error.response?.data?.message || 'فشل تحميل الواجب');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.content.trim()) {
      alert('يرجى إدخال محتوى الواجب');
      return;
    }

    setSubmitting(true);
    try {
      const homeworkId = Array.isArray(params.id) ? params.id[0] : params.id;
      await api.post(`/homework/${homeworkId}/submit`, {
        content: formData.content.trim(),
        attachments: formData.attachments.trim() || undefined,
      });
      alert('تم تسليم الواجب بنجاح!');
      router.push('/dashboard/homework');
    } catch (error: any) {
      console.error('Failed to submit homework:', error);
      alert(error.response?.data?.message || 'فشل تسليم الواجب');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-primary"></div>
      </div>
    );
  }

  if (!homework) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-lg p-8 text-center">
          <p className="text-xl text-gray-500 mb-6">الواجب غير موجود</p>
          <Link
            href="/dashboard/homework"
            className="inline-block px-8 py-4 bg-primary text-white rounded-lg font-bold text-lg hover:bg-primary-dark transition"
          >
            العودة للواجبات
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 bg-gray-50 min-h-screen">
      <div className="mb-6">
        <Link
          href="/dashboard/homework"
          className="text-primary hover:text-primary-dark font-semibold text-lg mb-4 inline-block"
        >
          ← العودة للواجبات
        </Link>
        <h1 className="text-3xl font-bold mb-2 text-gray-800">تسليم الواجب</h1>
        <p className="text-xl text-gray-700">{homework.course.title}</p>
      </div>

      <div className="bg-white rounded-lg shadow-lg p-8 mb-6">
        <h2 className="text-2xl font-bold mb-4 text-gray-800">{homework.title}</h2>
        <div className="mb-6">
          <p className="text-lg text-gray-800 leading-relaxed whitespace-pre-wrap">{homework.description}</p>
        </div>
        <div className="space-y-3 text-lg">
          <div className="flex justify-between items-center">
            <span className="font-semibold text-gray-800">تاريخ الاستحقاق:</span>
            <span className="text-gray-800">{new Date(homework.dueDate).toLocaleDateString('ar-SA')}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="font-semibold text-gray-800">الدرجة الكاملة:</span>
            <span className="text-gray-800">{homework.maxScore}</span>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-lg p-8">
        <h2 className="text-2xl font-bold mb-6 text-gray-800">إرسال الواجب</h2>
        
        <div className="mb-6">
          <label className="block text-lg font-semibold mb-2 text-gray-800">
            محتوى الواجب *
          </label>
          <textarea
            value={formData.content}
            onChange={(e) => setFormData({ ...formData, content: e.target.value })}
            required
            rows={12}
            className="w-full px-4 py-3 text-lg border-2 border-gray-300 rounded-lg focus:ring-4 focus:ring-primary focus:border-primary text-gray-800 bg-white"
            placeholder="اكتب إجابتك هنا..."
          />
        </div>

        <div className="mb-6">
          <label className="block text-lg font-semibold mb-2 text-gray-800">
            روابط المرفقات (اختياري)
          </label>
          <input
            type="text"
            value={formData.attachments}
            onChange={(e) => setFormData({ ...formData, attachments: e.target.value })}
            className="w-full px-4 py-3 text-lg border-2 border-gray-300 rounded-lg focus:ring-4 focus:ring-primary focus:border-primary text-gray-800 bg-white"
            placeholder="رابط ملف أو صورة (مثال: https://example.com/file.pdf)"
          />
          <p className="text-sm text-gray-600 mt-2">
            يمكنك إضافة روابط للملفات أو الصور
          </p>
        </div>

        <div className="flex gap-4">
          <button
            type="submit"
            disabled={submitting}
            className="px-8 py-4 bg-primary text-white rounded-lg font-bold text-lg hover:bg-primary-dark transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? 'جاري الإرسال...' : 'تسليم الواجب'}
          </button>
          <Link
            href="/dashboard/homework"
            className="px-8 py-4 bg-gray-200 text-gray-700 rounded-lg font-bold text-lg hover:bg-gray-300 transition"
          >
            إلغاء
          </Link>
        </div>
      </form>
    </div>
  );
}

