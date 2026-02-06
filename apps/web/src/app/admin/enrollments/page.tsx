'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { UsersIcon, BookIcon, CalendarIcon, FilterIcon } from '@/components/Icons';
import { showSuccess, showError, TOAST_MESSAGES } from '@/lib/toast';
import { Pagination, PaginationInfo, PaginatedResponse } from '@/components/Pagination';

// Custom Status Filter Dropdown
function StatusFilterDropdown({ value, onChange }: { value: string, onChange: (value: string) => void }) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const options = [
    { value: '', label: 'جميع الحالات' },
    { value: 'ACTIVE', label: 'نشط' },
    { value: 'PENDING', label: 'قيد الانتظار' },
    { value: 'CANCELED', label: 'ملغي' },
  ];

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setDropdownOpen(!dropdownOpen)}
        className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary text-gray-800 bg-white text-right flex items-center justify-between min-w-[200px]"
      >
        <span>{options.find(o => o.value === value)?.label || 'جميع الحالات'}</span>
        <svg 
          className={`w-4 h-4 transition-transform ${dropdownOpen ? 'transform rotate-180' : ''}`}
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
            className="absolute z-20 mt-1 bg-white border-2 border-gray-300 rounded-lg shadow-lg min-w-[200px]"
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
                className={`w-full text-right px-4 py-2 text-sm hover:bg-gray-100 transition ${
                  value === option.value ? 'bg-primary text-white' : 'text-gray-800'
                } ${option.value !== '' ? 'border-t border-gray-200' : ''}`}
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

// Custom Status Dropdown for table
function StatusDropdown({ value, onChange }: { value: string, onChange: (value: string) => void }) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const options = [
    { value: 'ACTIVE', label: 'نشط' },
    { value: 'PENDING', label: 'قيد الانتظار' },
    { value: 'CANCELED', label: 'إلغاء' },
  ];

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setDropdownOpen(!dropdownOpen)}
        className="px-3 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-primary text-gray-800 bg-white text-right flex items-center justify-between min-w-[120px]"
      >
        <span>{options.find(o => o.value === value)?.label || value}</span>
        <svg 
          className={`w-3 h-3 transition-transform ${dropdownOpen ? 'transform rotate-180' : ''}`}
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
            className="absolute z-20 mt-1 bg-white border-2 border-gray-300 rounded-lg shadow-lg min-w-[120px]"
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
                className={`w-full text-right px-3 py-1 text-sm hover:bg-gray-100 transition ${
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

interface Enrollment {
  id: string;
  status: string;
  enrolledAt: string;
  user: { name: string; email: string };
  course: { title: string };
}

const ITEMS_PER_PAGE = 15;

export default function AdminEnrollmentsPage() {
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalEnrollments, setTotalEnrollments] = useState(0);

  useEffect(() => {
    loadEnrollments();
  }, [currentPage]);

  const loadEnrollments = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/enrollments?page=${currentPage}&limit=${ITEMS_PER_PAGE}`);
      const data = response.data as PaginatedResponse<Enrollment>;
      setEnrollments(data.data || []);
      setTotalPages(data.pagination?.totalPages || 1);
      setTotalEnrollments(data.pagination?.total || 0);
    } catch (error) {
      console.error('Failed to load enrollments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      await api.patch(`/enrollments/${id}`, { status: newStatus });
      setEnrollments(enrollments.map(e => 
        e.id === id ? { ...e, status: newStatus } : e
      ));
      showSuccess(TOAST_MESSAGES.UPDATE_SUCCESS);
    } catch (error: any) {
      showError(error.response?.data?.message || 'فشل تحديث التسجيل');
    }
  };

  const filteredEnrollments = enrollments.filter(e => 
    !statusFilter || e.status === statusFilter
  );

  // Stats based on current page (for accurate stats, would need separate API endpoint)
  const stats = {
    total: totalEnrollments,
    active: enrollments.filter(e => e.status === 'ACTIVE').length,
    pending: enrollments.filter(e => e.status === 'PENDING').length,
    canceled: enrollments.filter(e => e.status === 'CANCELED').length,
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center">
              <UsersIcon size={24} />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-bold">إدارة التسجيلات</h1>
              <p className="text-white/70 text-sm">{stats.total} تسجيل</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl p-4 shadow-sm border border-stone-100">
            <p className="text-2xl font-bold text-[#1a3a2f]">{stats.total}</p>
            <p className="text-sm text-stone-500">إجمالي التسجيلات</p>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-stone-100">
            <p className="text-2xl font-bold text-emerald-600">{stats.active}</p>
            <p className="text-sm text-stone-500">نشطة</p>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-stone-100">
            <p className="text-2xl font-bold text-amber-600">{stats.pending}</p>
            <p className="text-sm text-stone-500">قيد الانتظار</p>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-stone-100">
            <p className="text-2xl font-bold text-red-600">{stats.canceled}</p>
            <p className="text-sm text-stone-500">ملغية</p>
          </div>
        </div>

        {/* Filter */}
        <div className="bg-white rounded-xl shadow-sm border border-stone-100 p-4 mb-6">
          <div className="flex items-center gap-2">
            <FilterIcon size={18} className="text-stone-400" />
            <StatusFilterDropdown
              value={statusFilter}
              onChange={(value) => setStatusFilter(value)}
            />
          </div>
        </div>

        {/* Enrollments Table */}
        <div className="bg-white rounded-xl shadow-sm border border-stone-100 overflow-hidden">
          {filteredEnrollments.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-stone-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <UsersIcon size={32} className="text-stone-400" />
              </div>
              <p className="text-stone-500 text-lg">لا توجد تسجيلات</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-stone-50 border-b border-stone-200">
                    <tr>
                      <th className="px-6 py-4 text-right text-xs font-semibold text-stone-600 uppercase tracking-wider">الطالب</th>
                      <th className="px-6 py-4 text-right text-xs font-semibold text-stone-600 uppercase tracking-wider hidden md:table-cell">الدورة</th>
                      <th className="px-6 py-4 text-right text-xs font-semibold text-stone-600 uppercase tracking-wider">الحالة</th>
                      <th className="px-6 py-4 text-right text-xs font-semibold text-stone-600 uppercase tracking-wider hidden sm:table-cell">تاريخ التسجيل</th>
                      <th className="px-6 py-4 text-right text-xs font-semibold text-stone-600 uppercase tracking-wider">الإجراءات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {filteredEnrollments.map((enrollment) => (
                      <tr key={enrollment.id} className="hover:bg-stone-50/50 transition-colors">
                        <td className="px-6 py-4">
                          <div>
                            <h3 className="font-semibold text-stone-800">{enrollment.user.name}</h3>
                            <p className="text-sm text-stone-500">{enrollment.user.email}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-stone-600 hidden md:table-cell">{enrollment.course.title}</td>
                        <td className="px-6 py-4">
                          <span className={`px-3 py-1.5 rounded-lg text-xs font-medium ${
                            enrollment.status === 'ACTIVE'
                              ? 'bg-emerald-100 text-emerald-700'
                              : enrollment.status === 'PENDING'
                              ? 'bg-amber-100 text-amber-700'
                              : 'bg-red-100 text-red-700'
                          }`}>
                            {enrollment.status === 'ACTIVE' ? 'نشط' : 
                             enrollment.status === 'PENDING' ? 'قيد الانتظار' : 'ملغي'}
                          </span>
                        </td>
                        <td className="px-6 py-4 hidden sm:table-cell">
                          <div className="flex items-center gap-1 text-stone-500 text-sm">
                            <CalendarIcon size={14} />
                            {new Date(enrollment.enrolledAt).toLocaleDateString('ar-SA')}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <select
                            value={enrollment.status}
                            onChange={(e) => handleStatusChange(enrollment.id, e.target.value)}
                            className="px-3 py-1.5 border border-stone-200 rounded-lg text-sm focus:ring-2 focus:ring-[#1a3a2f]/20 focus:border-[#1a3a2f] text-stone-700 bg-white"
                          >
                            <option value="ACTIVE">نشط</option>
                            <option value="PENDING">قيد الانتظار</option>
                            <option value="CANCELED">إلغاء</option>
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="px-6 py-4 border-t border-stone-100 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <PaginationInfo
                    currentPage={currentPage}
                    limit={ITEMS_PER_PAGE}
                    total={totalEnrollments}
                    itemName="تسجيل"
                  />
                  <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={handlePageChange}
                  />
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

