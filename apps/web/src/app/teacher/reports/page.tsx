'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import { 
  AlertIcon, 
  CheckCircleIcon, 
  ClockIcon, 
  EyeIcon,
  FilterIcon,
  BookIcon,
  TrashIcon
} from '@/components/Icons';
import { showSuccess, showError, TOAST_MESSAGES } from '@/lib/toast';

interface Report {
  id: string;
  type: string;
  description: string;
  timestamp?: string;
  status: string;
  createdAt: string;
  reviewNote?: string;
  resolvedAt?: string;
  reporter: { id: string; name: string; email: string };
  course: { id: string; title: string; teacherId: string };
  lesson: { id: string; title: string; order: number; module: { order: number; title: string } };
  reviewer?: { id: string; name: string };
}

const STATUS_OPTIONS = [
  { value: '', label: 'جميع الحالات' },
  { value: 'NEW', label: 'جديد' },
  { value: 'IN_REVIEW', label: 'قيد المراجعة' },
  { value: 'RESOLVED', label: 'تم الحل' },
  { value: 'DISMISSED', label: 'مرفوض' },
];

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
  NEW: 'bg-red-50 text-red-700 border-red-200',
  IN_REVIEW: 'bg-amber-50 text-amber-700 border-amber-200',
  RESOLVED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  DISMISSED: 'bg-stone-100 text-stone-600 border-stone-200',
};

const POLLING_INTERVAL = 15000; // 15 seconds

export default function TeacherReportsPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [newCount, setNewCount] = useState(0);
  const [updating, setUpdating] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  const loadReports = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.append('status', statusFilter);
      
      const [reportsRes, countRes] = await Promise.all([
        api.get(`/reports?${params.toString()}`),
        api.get('/reports/count/new'),
      ]);
      
      setReports(reportsRes.data || []);
      setNewCount(countRes.data?.count || 0);
    } catch (error) {
      console.error('Failed to load reports:', error);
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  // Initial load
  useEffect(() => {
    loadReports();
  }, [loadReports]);

  // Polling for real-time updates
  useEffect(() => {
    const interval = setInterval(loadReports, POLLING_INTERVAL);
    return () => clearInterval(interval);
  }, [loadReports]);

  const updateStatus = async (reportId: string, status: string, reviewNote?: string) => {
    setUpdating(reportId);
    try {
      await api.patch(`/reports/${reportId}`, { status, reviewNote });
      showSuccess(TOAST_MESSAGES.UPDATE_SUCCESS);
      loadReports(); // Refresh list
    } catch (error: any) {
      showError(error.response?.data?.message || 'فشل تحديث الحالة');
    } finally {
      setUpdating(null);
    }
  };

  const deleteReport = async (reportId: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا التبليغ؟')) return;
    
    setDeleting(reportId);
    try {
      await api.delete(`/reports/${reportId}`);
      showSuccess(TOAST_MESSAGES.DELETE_SUCCESS);
      loadReports(); // Refresh list
    } catch (error: any) {
      showError(error.response?.data?.message || 'فشل حذف التبليغ');
    } finally {
      setDeleting(null);
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
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center">
                <AlertIcon className="text-white" size={20} />
              </div>
              <div>
                <h1 className="text-xl font-bold">تبليغات الطلاب</h1>
                <p className="text-white/70 text-sm">{reports.length} تبليغ على دوراتي</p>
              </div>
            </div>
            
            {/* New Reports Badge */}
            {newCount > 0 && (
              <div className="flex items-center gap-2 px-4 py-2 bg-red-500 rounded-lg animate-pulse">
                <span className="font-bold">{newCount}</span>
                <span className="text-sm">تبليغات جديدة</span>
              </div>
            )}
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
                <p className="text-xs text-stone-500">إجمالي التبليغات</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-stone-100 p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-red-50 rounded-lg flex items-center justify-center">
                <AlertIcon className="text-red-600" size={20} />
              </div>
              <div>
                <p className="text-2xl font-bold text-stone-800">{reports.filter(r => r.status === 'NEW').length}</p>
                <p className="text-xs text-stone-500">جديد</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-stone-100 p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-50 rounded-lg flex items-center justify-center">
                <ClockIcon className="text-amber-600" size={20} />
              </div>
              <div>
                <p className="text-2xl font-bold text-stone-800">{reports.filter(r => r.status === 'IN_REVIEW').length}</p>
                <p className="text-xs text-stone-500">قيد المراجعة</p>
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
        </div>

        {/* Filter */}
        <div className="bg-white rounded-xl shadow-sm border border-stone-100 p-4 mb-6">
          <div className="flex items-center gap-3">
            <FilterIcon className="text-stone-400" size={18} />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="flex-1 px-4 py-2 border border-stone-200 rounded-lg focus:ring-2 focus:ring-[#1a3a2f]/20 focus:border-[#1a3a2f] text-stone-800 bg-white"
            >
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Reports List */}
        {reports.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-stone-100 p-12 text-center">
            <div className="w-16 h-16 bg-stone-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircleIcon className="text-stone-600" size={32} />
            </div>
            <h3 className="text-xl font-bold text-stone-800 mb-2">لا توجد تبليغات</h3>
            <p className="text-stone-500">جميع محتويات دوراتك سليمة</p>
          </div>
        ) : (
          <div className="space-y-4">
            {reports.map((report) => (
              <div
                key={report.id}
                className={`bg-white rounded-xl shadow-sm border-r-4 p-5 transition-all ${
                  report.status === 'NEW' ? 'border-red-500' : 
                  report.status === 'IN_REVIEW' ? 'border-amber-500' :
                  report.status === 'RESOLVED' ? 'border-emerald-500' :
                  'border-stone-200'
                }`}
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
                    
                    {/* Review Note */}
                    {report.reviewNote && (
                      <div className="mb-3 p-3 bg-stone-50 rounded-lg border border-stone-100">
                        <p className="text-sm text-stone-600">
                          <span className="font-medium">ملاحظة المراجعة:</span> {report.reviewNote}
                        </p>
                      </div>
                    )}
                    
                    {/* Meta */}
                    <div className="flex items-center gap-4 text-sm text-stone-500 flex-wrap">
                      <span>من: <span className="font-medium text-stone-700">{report.reporter.name}</span></span>
                      <span>{new Date(report.createdAt).toLocaleDateString('ar-SA')}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap gap-2 shrink-0">
                    <Link
                      href={`/teacher/courses/${report.course.id}/edit`}
                      className="px-3 py-2 bg-stone-100 text-stone-600 rounded-lg hover:bg-stone-200 transition flex items-center gap-1 text-sm"
                    >
                      <EyeIcon size={14} /> تحرير الدورة
                    </Link>
                    
                    {report.status === 'NEW' && (
                      <button
                        onClick={() => updateStatus(report.id, 'IN_REVIEW')}
                        disabled={updating === report.id}
                        className="px-3 py-2 bg-amber-50 text-amber-700 rounded-lg hover:bg-amber-100 transition text-sm disabled:opacity-50"
                      >
                        {updating === report.id ? '...' : 'بدء المراجعة'}
                      </button>
                    )}
                    
                    {report.status === 'IN_REVIEW' && (
                      <>
                        <button
                          onClick={() => updateStatus(report.id, 'RESOLVED')}
                          disabled={updating === report.id}
                          className="px-3 py-2 bg-emerald-50 text-emerald-700 rounded-lg hover:bg-emerald-100 transition text-sm disabled:opacity-50"
                        >
                          {updating === report.id ? '...' : 'تم الحل'}
                        </button>
                        <button
                          onClick={() => updateStatus(report.id, 'DISMISSED')}
                          disabled={updating === report.id}
                          className="px-3 py-2 bg-stone-100 text-stone-600 rounded-lg hover:bg-stone-200 transition text-sm disabled:opacity-50"
                        >
                          {updating === report.id ? '...' : 'رفض'}
                        </button>
                      </>
                    )}
                    
                    {/* Delete button - available for all statuses */}
                    <button
                      onClick={() => deleteReport(report.id)}
                      disabled={deleting === report.id}
                      className="px-3 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition text-sm disabled:opacity-50 flex items-center gap-1"
                    >
                      <TrashIcon size={14} />
                      {deleting === report.id ? '...' : 'حذف'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Polling indicator */}
        <div className="mt-6 text-center text-sm text-stone-400">
          يتم تحديث البيانات تلقائياً كل 15 ثانية
        </div>
      </div>
    </div>
  );
}
