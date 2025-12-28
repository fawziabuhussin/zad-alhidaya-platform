'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';

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

export default function AdminEnrollmentsPage() {
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    loadEnrollments();
  }, []);

  const loadEnrollments = async () => {
    try {
      const response = await api.get('/enrollments');
      setEnrollments(response.data || []);
    } catch (error) {
      console.error('Failed to load enrollments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      await api.patch(`/enrollments/${id}`, { status: newStatus });
      setEnrollments(enrollments.map(e => 
        e.id === id ? { ...e, status: newStatus } : e
      ));
    } catch (error: any) {
      alert(error.response?.data?.message || 'فشل تحديث التسجيل');
    }
  };

  const filteredEnrollments = enrollments.filter(e => 
    !statusFilter || e.status === statusFilter
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 bg-gray-50 min-h-screen p-6">
      <h1 className="text-2xl font-bold text-gray-800">إدارة التسجيلات</h1>

      {/* Filter */}
      <div className="bg-white rounded-lg shadow-md p-4">
        <StatusFilterDropdown
          value={statusFilter}
          onChange={(value) => setStatusFilter(value)}
        />
      </div>

      {/* Enrollments Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {filteredEnrollments.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">لا توجد تسجيلات</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">الطالب</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">الدورة</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">الحالة</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">تاريخ التسجيل</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {filteredEnrollments.map((enrollment) => (
                  <tr key={enrollment.id} className="hover:bg-gray-50 bg-white">
                    <td className="px-6 py-4">
                      <div>
                        <h3 className="font-semibold text-gray-800">{enrollment.user.name}</h3>
                        <p className="text-sm text-gray-600">{enrollment.user.email}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-800">{enrollment.course.title}</td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs ${
                        enrollment.status === 'ACTIVE'
                          ? 'bg-green-100 text-green-800'
                          : enrollment.status === 'PENDING'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {enrollment.status === 'ACTIVE' ? 'نشط' : 
                         enrollment.status === 'PENDING' ? 'قيد الانتظار' : 'ملغي'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-800">
                      {new Date(enrollment.enrolledAt).toLocaleDateString('ar-SA')}
                    </td>
                    <td className="px-6 py-4">
                      <select
                        value={enrollment.status}
                        onChange={(e) => handleStatusChange(enrollment.id, e.target.value)}
                        className="px-3 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-primary text-gray-800 bg-white"
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
        )}
      </div>
    </div>
  );
}

