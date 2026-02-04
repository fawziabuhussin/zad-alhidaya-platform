'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import { 
  AlertIcon, 
  CheckCircleIcon, 
  ClockIcon, 
  BookIcon,
  EyeIcon
} from '@/components/Icons';

interface Report {
  id: string;
  type: string;
  description: string;
  timestamp?: string;
  status: string;
  createdAt: string;
  reviewNote?: string;
  resolvedAt?: string;
  course: { id: string; title: string };
  lesson: { id: string; title: string; order: number; module: { order: number; title: string } };
}

const TYPE_LABELS: Record<string, string> = {
  VIDEO_ERROR: 'خطأ في الفيديو',
  TEXT_ERROR: 'خطأ في النص',
  AUDIO_ERROR: 'خطأ في الصوت',
  RESOURCE_ERROR: 'خطأ في المرفقات',
  CONTENT_MISSING: 'محتوى ناقص',
  OTHER: 'أخرى',
};

const STATUS_LABELS: Record<string, string> = {
  NEW: 'جديد',
  IN_REVIEW: 'قيد المراجعة',
  RESOLVED: 'تم الحل',
  DISMISSED: 'مرفوض',
};

const STATUS_STYLES: Record<string, string> = {
  NEW: 'bg-amber-50 text-amber-700 border-amber-200',
  IN_REVIEW: 'bg-sky-50 text-sky-700 border-sky-200',
  RESOLVED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  DISMISSED: 'bg-stone-100 text-stone-600 border-stone-200',
};

export default function StudentReportsPage() {
  const router = useRouter();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        router.push('/login');
        return;
      }

      const res = await api.get('/reports/my-reports');
      setReports(res.data || []);
    } catch (error: any) {
      console.error('Failed to load reports:', error);
      if (error.response?.status === 401) {
        router.push('/login');
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1a3a2f]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50">
      {/* Header */}
      <div className="bg-gradient-to-l from-[#1a3a2f] via-[#1f4a3d] to-[#0d2b24] text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center">
              <AlertIcon className="text-white" size={20} />
            </div>
            <div>
              <h1 className="text-xl font-bold">تبليغاتي</h1>
              <p className="text-white/70 text-sm">{reports.length} تبليغ</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Quick Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow-sm border border-stone-100 p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-stone-100 rounded-lg flex items-center justify-center">
                <AlertIcon className="text-stone-600" size={20} />
              </div>
              <div>
                <p className="text-2xl font-bold text-stone-800">{reports.length}</p>
                <p className="text-xs text-stone-500">إجمالي</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-stone-100 p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-50 rounded-lg flex items-center justify-center">
                <ClockIcon className="text-amber-600" size={20} />
              </div>
              <div>
                <p className="text-2xl font-bold text-stone-800">{reports.filter(r => r.status === 'NEW' || r.status === 'IN_REVIEW').length}</p>
                <p className="text-xs text-stone-500">قيد المعالجة</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-stone-100 p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-50 rounded-lg flex items-center justify-center">
                <CheckCircleIcon className="text-emerald-600" size={20} />
              </div>
              <div>
                <p className="text-2xl font-bold text-stone-800">{reports.filter(r => r.status === 'RESOLVED').length}</p>
                <p className="text-xs text-stone-500">تم الحل</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-stone-100 p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-stone-100 rounded-lg flex items-center justify-center">
                <AlertIcon className="text-stone-500" size={20} />
              </div>
              <div>
                <p className="text-2xl font-bold text-stone-800">{reports.filter(r => r.status === 'DISMISSED').length}</p>
                <p className="text-xs text-stone-500">مرفوض</p>
              </div>
            </div>
          </div>
        </div>

        {/* Reports List */}
        {reports.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-stone-100 p-12 text-center">
            <div className="w-16 h-16 bg-stone-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertIcon className="text-stone-400" size={32} />
            </div>
            <h3 className="text-xl font-bold text-stone-800 mb-2">لا توجد تبليغات</h3>
            <p className="text-stone-500 mb-4">لم تقم بإرسال أي تبليغ بعد</p>
            <p className="text-sm text-stone-400">
              يمكنك التبليغ عن أي خطأ في المحتوى من صفحة الدرس
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {reports.map((report) => (
              <div
                key={report.id}
                className="bg-white rounded-xl shadow-sm border border-stone-100 p-5"
              >
                <div className="flex flex-col lg:flex-row lg:items-start gap-4">
                  {/* Report Info */}
                  <div className="flex-1">
                    {/* Course & Lesson */}
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <BookIcon className="text-stone-400 shrink-0" size={16} />
                      <span className="font-medium text-stone-800">{report.course.title}</span>
                      <span className="text-stone-400">|</span>
                      <span className="text-stone-600">
                        الدرس {report.lesson.module.order}.{report.lesson.order}: {report.lesson.title}
                      </span>
                    </div>
                    
                    {/* Type & Status */}
                    <div className="flex items-center gap-2 mb-3 flex-wrap">
                      <span className="px-2 py-1 bg-stone-100 text-stone-600 rounded text-xs font-medium">
                        {TYPE_LABELS[report.type] || report.type}
                      </span>
                      {report.timestamp && (
                        <span className="px-2 py-1 bg-sky-50 text-sky-600 rounded text-xs font-medium flex items-center gap-1">
                          <ClockIcon size={12} /> {report.timestamp}
                        </span>
                      )}
                      <span className={`px-2 py-1 rounded text-xs font-medium border ${STATUS_STYLES[report.status]}`}>
                        {STATUS_LABELS[report.status] || report.status}
                      </span>
                    </div>
                    
                    {/* Description */}
                    <p className="text-stone-700 mb-3 whitespace-pre-wrap">{report.description}</p>
                    
                    {/* Review Note (if resolved or dismissed) */}
                    {report.reviewNote && (report.status === 'RESOLVED' || report.status === 'DISMISSED') && (
                      <div className="mb-3 p-3 bg-stone-50 rounded-lg border border-stone-100">
                        <p className="text-sm text-stone-600">
                          <span className="font-medium">رد المشرف:</span> {report.reviewNote}
                        </p>
                      </div>
                    )}
                    
                    {/* Meta */}
                    <div className="text-sm text-stone-500">
                      <span>تاريخ الإرسال: {new Date(report.createdAt).toLocaleDateString('ar-SA')}</span>
                      {report.resolvedAt && (
                        <span className="mr-4">
                          تاريخ الحل: {new Date(report.resolvedAt).toLocaleDateString('ar-SA')}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="shrink-0">
                    <Link
                      href={`/courses/${report.course.id}/lessons/${report.lesson.id}`}
                      className="px-3 py-2 bg-stone-100 text-stone-600 rounded-lg hover:bg-stone-200 transition flex items-center gap-1 text-sm"
                    >
                      <EyeIcon size={14} /> عرض الدرس
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
