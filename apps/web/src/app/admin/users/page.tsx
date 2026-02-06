'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import Modal from '@/components/Modal';
import { UsersIcon, PlusIcon, EditIcon, TrashIcon, EyeIcon, SearchIcon, FilterIcon } from '@/components/Icons';
import { showSuccess, showError, TOAST_MESSAGES } from '@/lib/toast';
import { formatDate } from '@/lib/utils';
import { Pagination, PaginationInfo, PaginatedResponse } from '@/components/Pagination';
import PageLoading from '@/components/PageLoading';
import DatePicker from '@/components/DatePicker';
import GenderSelect from '@/components/GenderSelect';

// Custom Role Filter Dropdown
function RoleFilterDropdown({ value, onChange }: { value: string, onChange: (value: string) => void }) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const options = [
    { value: '', label: 'جميع الأدوار' },
    { value: 'ADMIN', label: 'مشرف' },
    { value: 'TEACHER', label: 'مدرس' },
    { value: 'STUDENT', label: 'طالب' },
  ];

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setDropdownOpen(!dropdownOpen)}
        className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-gray-800 bg-white text-right flex items-center justify-between min-w-[150px]"
      >
        <span>{options.find(o => o.value === value)?.label || 'جميع الأدوار'}</span>
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
            className="absolute z-20 mt-1 bg-white border-2 border-gray-300 rounded-lg shadow-lg min-w-[150px]"
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

interface User {
  id: string;
  name: string;
  firstName?: string;
  fatherName?: string;
  familyName?: string;
  email: string;
  role: string;
  blocked: boolean;
  dateOfBirth?: string;
  phone?: string;
  profession?: string;
  gender?: string;
  idNumber?: string;
  createdAt: string;
  _count: {
    coursesTaught?: number;
    enrollments?: number;
  };
}

const ITEMS_PER_PAGE = 15;

export default function AdminUsersPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const action = searchParams.get('action');
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editFormData, setEditFormData] = useState({
    firstName: '',
    fatherName: '',
    familyName: '',
    dateOfBirth: null as Date | null,
    phone: '',
    profession: '',
    gender: '' as 'MALE' | 'FEMALE' | '',
    idNumber: '',
    password: '',
  });
  const [showCreateForm, setShowCreateForm] = useState(action === 'create');
  const [createFormData, setCreateFormData] = useState({
    firstName: '',
    fatherName: '',
    familyName: '',
    email: '',
    password: '',
    role: 'STUDENT' as 'ADMIN' | 'TEACHER' | 'STUDENT',
    dateOfBirth: null as Date | null,
    phone: '',
    profession: '',
    gender: '' as 'MALE' | 'FEMALE' | '',
    idNumber: '',
  });
  const [createErrors, setCreateErrors] = useState<{ [key: string]: string }>({});
  const [editErrors, setEditErrors] = useState<{ [key: string]: string }>({});
  const [viewingProfile, setViewingProfile] = useState<User | null>(null);
  const [profileData, setProfileData] = useState<any>(null);
  const [profileLoading, setProfileLoading] = useState(false);

  useEffect(() => {
    loadUsers();
  }, [currentPage]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/users?page=${currentPage}&limit=${ITEMS_PER_PAGE}`);
      const data = response.data as PaginatedResponse<User>;
      setUsers(data.data || []);
      setTotalPages(data.pagination?.totalPages || 1);
      setTotalUsers(data.pagination?.total || 0);
    } catch (error) {
      console.error('Failed to load users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleBlock = async (id: string, blocked: boolean) => {
    try {
      await api.patch(`/users/${id}`, { blocked: !blocked });
      setUsers(users.map(u => u.id === id ? { ...u, blocked: !blocked } : u));
      showSuccess(blocked ? 'تم إلغاء الحظر' : 'تم حظر المستخدم');
    } catch (error: any) {
      showError(error.response?.data?.message || 'فشل تحديث المستخدم');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا المستخدم؟')) return;

    try {
      await api.delete(`/users/${id}`);
      showSuccess(TOAST_MESSAGES.DELETE_SUCCESS);
      loadUsers(); // Reload current page
    } catch (error: any) {
      showError(error.response?.data?.message || 'فشل حذف المستخدم');
    }
  };

  const handleEdit = (user: User) => {
    setEditingUser(user);
    setEditFormData({
      firstName: user.firstName || '',
      fatherName: user.fatherName || '',
      familyName: user.familyName || '',
      dateOfBirth: user.dateOfBirth ? new Date(user.dateOfBirth) : null,
      phone: user.phone || '',
      profession: user.profession || '',
      gender: (user.gender as 'MALE' | 'FEMALE' | '') || '',
      idNumber: user.idNumber || '',
      password: '',
    });
    setEditErrors({});
  };

  const handleSaveEdit = async () => {
    if (!editingUser) return;

    // Validation
    const errors: { [key: string]: string } = {};
    if (!editFormData.firstName || editFormData.firstName.length < 2) {
      errors.firstName = 'الاسم الشخصي يجب أن يكون حرفين على الأقل';
    }
    if (!editFormData.fatherName || editFormData.fatherName.length < 2) {
      errors.fatherName = 'اسم الوالد يجب أن يكون حرفين على الأقل';
    }
    if (!editFormData.familyName || editFormData.familyName.length < 2) {
      errors.familyName = 'اسم العائلة يجب أن يكون حرفين على الأقل';
    }
    if (!editFormData.dateOfBirth) {
      errors.dateOfBirth = 'تاريخ الولادة مطلوب';
    }
    if (!editFormData.phone || editFormData.phone.length < 7 || editFormData.phone.length > 10) {
      errors.phone = 'رقم الهاتف يجب أن يكون بين 7 و 10 أرقام';
    } else if (!/^[0-9]+$/.test(editFormData.phone)) {
      errors.phone = 'رقم الهاتف يجب أن يحتوي على أرقام فقط';
    }
    if (!editFormData.profession || editFormData.profession.length < 2) {
      errors.profession = 'المهنة مطلوبة';
    }
    if (!editFormData.gender) {
      errors.gender = 'يرجى اختيار الجنس';
    }
    if (!editFormData.idNumber || editFormData.idNumber.length !== 9) {
      errors.idNumber = 'رقم الهوية يجب أن يكون 9 أرقام بالضبط';
    } else if (!/^[0-9]+$/.test(editFormData.idNumber)) {
      errors.idNumber = 'رقم الهوية يجب أن يحتوي على أرقام فقط';
    }
    if (editFormData.password && editFormData.password.length < 6) {
      errors.password = 'كلمة المرور يجب أن تكون على الأقل 6 أحرف';
    }

    if (Object.keys(errors).length > 0) {
      setEditErrors(errors);
      return;
    }

    // Double confirmation
    if (!confirm('هل أنت متأكد من تحديث بيانات هذا المستخدم؟')) return;
    if (editFormData.password && !confirm('هل أنت متأكد من تغيير كلمة المرور؟')) return;

    try {
      const updateData: any = {
        firstName: editFormData.firstName,
        fatherName: editFormData.fatherName,
        familyName: editFormData.familyName,
        dateOfBirth: editFormData.dateOfBirth?.toISOString(),
        phone: editFormData.phone,
        profession: editFormData.profession,
        gender: editFormData.gender,
        idNumber: editFormData.idNumber,
      };
      if (editFormData.password) {
        updateData.password = editFormData.password;
      }

      await api.put(`/users/${editingUser.id}`, updateData);
      const newName = `${editFormData.firstName} ${editFormData.fatherName} ${editFormData.familyName}`;
      setUsers(users.map(u => u.id === editingUser.id ? { ...u, name: newName } : u));
      setEditingUser(null);
      setEditFormData({
        firstName: '',
        fatherName: '',
        familyName: '',
        dateOfBirth: null,
        phone: '',
        profession: '',
        gender: '',
        idNumber: '',
        password: '',
      });
      setEditErrors({});
      showSuccess(TOAST_MESSAGES.UPDATE_SUCCESS);
    } catch (error: any) {
      showError(error.response?.data?.message || 'فشل تحديث بيانات المستخدم');
    }
  };

  const handleCreateUser = async () => {
    setCreateErrors({});

    // Validation
    const errors: { [key: string]: string } = {};

    if (!createFormData.firstName || createFormData.firstName.length < 2) {
      errors.firstName = 'الاسم الشخصي يجب أن يكون حرفين على الأقل';
    }
    if (!createFormData.fatherName || createFormData.fatherName.length < 2) {
      errors.fatherName = 'اسم الوالد يجب أن يكون حرفين على الأقل';
    }
    if (!createFormData.familyName || createFormData.familyName.length < 2) {
      errors.familyName = 'اسم العائلة يجب أن يكون حرفين على الأقل';
    }
    if (!createFormData.email || !createFormData.email.includes('@')) {
      errors.email = 'البريد الإلكتروني غير صحيح';
    }
    if (!createFormData.password || createFormData.password.length < 6) {
      errors.password = 'كلمة المرور يجب أن تكون على الأقل 6 أحرف';
    }
    if (!createFormData.dateOfBirth) {
      errors.dateOfBirth = 'تاريخ الولادة مطلوب';
    }
    if (!createFormData.phone || createFormData.phone.length < 7 || createFormData.phone.length > 10) {
      errors.phone = 'رقم الهاتف يجب أن يكون بين 7 و 10 أرقام';
    } else if (!/^[0-9]+$/.test(createFormData.phone)) {
      errors.phone = 'رقم الهاتف يجب أن يحتوي على أرقام فقط';
    }
    if (!createFormData.profession || createFormData.profession.length < 2) {
      errors.profession = 'المهنة مطلوبة';
    }
    if (!createFormData.gender) {
      errors.gender = 'يرجى اختيار الجنس';
    }
    if (!createFormData.idNumber || createFormData.idNumber.length !== 9) {
      errors.idNumber = 'رقم الهوية يجب أن يكون 9 أرقام بالضبط';
    } else if (!/^[0-9]+$/.test(createFormData.idNumber)) {
      errors.idNumber = 'رقم الهوية يجب أن يحتوي على أرقام فقط';
    }

    if (Object.keys(errors).length > 0) {
      setCreateErrors(errors);
      return;
    }

    if (!confirm('هل أنت متأكد من إنشاء هذا المستخدم؟')) return;

    try {
      await api.post('/users', {
        firstName: createFormData.firstName,
        fatherName: createFormData.fatherName,
        familyName: createFormData.familyName,
        email: createFormData.email,
        password: createFormData.password,
        role: createFormData.role,
        dateOfBirth: createFormData.dateOfBirth?.toISOString(),
        phone: createFormData.phone,
        profession: createFormData.profession,
        gender: createFormData.gender,
        idNumber: createFormData.idNumber,
      });

      showSuccess(TOAST_MESSAGES.CREATE_SUCCESS);
      setShowCreateForm(false);
      setCreateFormData({
        firstName: '',
        fatherName: '',
        familyName: '',
        email: '',
        password: '',
        role: 'STUDENT',
        dateOfBirth: null,
        phone: '',
        profession: '',
        gender: '',
        idNumber: '',
      });
      router.push('/admin/users');
      loadUsers();
    } catch (error: any) {
      showError(error.response?.data?.message || 'فشل إنشاء المستخدم');
    }
  };

  const handleViewProfile = async (user: User) => {
    setViewingProfile(user);
    setProfileLoading(true);
    
    try {
      const response = await api.get(`/users/${user.id}/profile`);
      setProfileData(response.data);
    } catch (error) {
      console.error('Failed to load profile:', error);
      showError('فشل تحميل الملف الشخصي');
    } finally {
      setProfileLoading(false);
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(search.toLowerCase()) ||
                         user.email.toLowerCase().includes(search.toLowerCase());
    const matchesRole = !roleFilter || user.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  // Stats based on current page (for accurate stats, would need separate API endpoint)
  const stats = {
    total: totalUsers,
    admins: users.filter(u => u.role === 'ADMIN').length,
    teachers: users.filter(u => u.role === 'TEACHER').length,
    students: users.filter(u => u.role === 'STUDENT').length,
  };

  if (loading && users.length === 0) {
    return <PageLoading title="المستخدمين" icon={<UsersIcon size={24} />} />;
  }

  return (
    <div className="min-h-screen bg-stone-50">
      {/* Header */}
      <div className="bg-gradient-to-l from-[#1a3a2f] via-[#1f4a3d] to-[#0d2b24] text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center">
                <UsersIcon size={24} />
              </div>
              <div>
                <h1 className="text-xl md:text-2xl font-bold">إدارة المستخدمين</h1>
                <p className="text-white/70 text-sm">{stats.total} مستخدم مسجل</p>
              </div>
            </div>
            <button
              onClick={() => {
                setShowCreateForm(true);
                router.push('/admin/users?action=create');
              }}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#c9a227] text-white rounded-xl font-bold hover:bg-[#b08f20] transition-all shadow-lg"
            >
              <PlusIcon size={18} />
              إنشاء مستخدم جديد
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl p-4 shadow-sm border border-stone-100">
            <p className="text-2xl font-bold text-[#1a3a2f]">{stats.total}</p>
            <p className="text-sm text-stone-500">إجمالي المستخدمين</p>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-stone-100">
            <p className="text-2xl font-bold text-violet-600">{stats.admins}</p>
            <p className="text-sm text-stone-500">المشرفون</p>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-stone-100">
            <p className="text-2xl font-bold text-sky-600">{stats.teachers}</p>
            <p className="text-sm text-stone-500">المدرسون</p>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-stone-100">
            <p className="text-2xl font-bold text-emerald-600">{stats.students}</p>
            <p className="text-sm text-stone-500">الطلاب</p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-stone-100 p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <SearchIcon size={18} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-stone-400" />
              <input
                type="text"
                placeholder="ابحث عن مستخدم..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pr-10 pl-4 py-2.5 border border-stone-200 rounded-lg focus:ring-2 focus:ring-[#1a3a2f]/20 focus:border-[#1a3a2f] text-stone-800 bg-white transition-all"
              />
            </div>
            <RoleFilterDropdown
              value={roleFilter}
              onChange={(value) => setRoleFilter(value)}
            />
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white rounded-xl shadow-sm border border-stone-100 overflow-hidden">
          {filteredUsers.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-stone-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <UsersIcon size={32} className="text-stone-400" />
              </div>
              <p className="text-stone-500 text-lg">لا يوجد مستخدمين</p>
            </div>
          ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-stone-50 border-b border-stone-200">
                  <tr>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-stone-600 uppercase tracking-wider">المستخدم</th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-stone-600 uppercase tracking-wider">الدور</th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-stone-600 uppercase tracking-wider">الحالة</th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-stone-600 uppercase tracking-wider hidden md:table-cell">الإحصائيات</th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-stone-600 uppercase tracking-wider">الإجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {filteredUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-stone-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-[#1a3a2f] to-[#2d5a4a] rounded-full flex items-center justify-center text-white font-bold text-sm">
                            {user.name.charAt(0)}
                          </div>
                          <div>
                            <h3 className="font-semibold text-stone-800">{user.name}</h3>
                            <p className="text-sm text-stone-500">{user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1.5 rounded-lg text-xs font-medium ${
                          user.role === 'ADMIN' 
                            ? 'bg-violet-100 text-violet-700'
                            : user.role === 'TEACHER'
                            ? 'bg-sky-100 text-sky-700'
                            : 'bg-emerald-100 text-emerald-700'
                        }`}>
                          {user.role === 'ADMIN' ? 'مشرف' : user.role === 'TEACHER' ? 'مدرس' : 'طالب'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1.5 rounded-lg text-xs font-medium ${
                          user.blocked 
                            ? 'bg-red-100 text-red-700' 
                            : 'bg-emerald-100 text-emerald-700'
                        }`}>
                          {user.blocked ? 'محظور' : 'نشط'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-stone-600 hidden md:table-cell">
                        {user.role === 'TEACHER' && (
                          <span className="font-medium">{user._count?.coursesTaught || 0} دورة</span>
                        )}
                        {user.role === 'STUDENT' && (
                          <span className="font-medium">{user._count?.enrollments || 0} تسجيل</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2 flex-wrap">
                          <button
                            onClick={() => handleViewProfile(user)}
                            className="px-3 py-1.5 bg-violet-50 text-violet-600 rounded-lg hover:bg-violet-100 transition text-sm font-medium"
                          >
                            عرض
                          </button>
                          <button
                            onClick={() => handleEdit(user)}
                            className="px-3 py-1.5 bg-sky-50 text-sky-600 rounded-lg hover:bg-sky-100 transition text-sm font-medium"
                          >
                            تعديل
                          </button>
                          <button
                            onClick={() => handleBlock(user.id, user.blocked)}
                            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                              user.blocked
                                ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
                                : 'bg-amber-50 text-amber-600 hover:bg-amber-100'
                            }`}
                          >
                            {user.blocked ? 'تفعيل' : 'حظر'}
                          </button>
                          <button
                            onClick={() => handleDelete(user.id)}
                            className="px-3 py-1.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition text-sm font-medium"
                          >
                            حذف
                          </button>
                        </div>
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
                  total={totalUsers}
                  itemName="مستخدم"
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

      {/* Edit User Modal */}
      <Modal
        isOpen={!!editingUser}
        onClose={() => {
          setEditingUser(null);
          setEditFormData({
            firstName: '',
            fatherName: '',
            familyName: '',
            dateOfBirth: null,
            phone: '',
            profession: '',
            gender: '',
            idNumber: '',
            password: '',
          });
          setEditErrors({});
        }}
        title="تعديل بيانات المستخدم"
        size="lg"
      >
        <div className="space-y-4 max-h-[70vh] overflow-y-auto px-1">
          {/* Name fields in 3-column grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-sm font-semibold mb-2 text-gray-800">
                الاسم الشخصي <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={editFormData.firstName}
                onChange={(e) => {
                  setEditFormData({ ...editFormData, firstName: e.target.value });
                  if (editErrors.firstName) setEditErrors({ ...editErrors, firstName: '' });
                }}
                className={`w-full px-4 py-3 border-2 rounded-lg focus:ring-4 focus:ring-primary focus:border-primary text-gray-800 bg-white ${
                  editErrors.firstName ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="الاسم"
              />
              {editErrors.firstName && <p className="text-red-500 text-xs mt-1">{editErrors.firstName}</p>}
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2 text-gray-800">
                اسم الوالد <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={editFormData.fatherName}
                onChange={(e) => {
                  setEditFormData({ ...editFormData, fatherName: e.target.value });
                  if (editErrors.fatherName) setEditErrors({ ...editErrors, fatherName: '' });
                }}
                className={`w-full px-4 py-3 border-2 rounded-lg focus:ring-4 focus:ring-primary focus:border-primary text-gray-800 bg-white ${
                  editErrors.fatherName ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="الوالد"
              />
              {editErrors.fatherName && <p className="text-red-500 text-xs mt-1">{editErrors.fatherName}</p>}
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2 text-gray-800">
                اسم العائلة <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={editFormData.familyName}
                onChange={(e) => {
                  setEditFormData({ ...editFormData, familyName: e.target.value });
                  if (editErrors.familyName) setEditErrors({ ...editErrors, familyName: '' });
                }}
                className={`w-full px-4 py-3 border-2 rounded-lg focus:ring-4 focus:ring-primary focus:border-primary text-gray-800 bg-white ${
                  editErrors.familyName ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="العائلة"
              />
              {editErrors.familyName && <p className="text-red-500 text-xs mt-1">{editErrors.familyName}</p>}
            </div>
          </div>

          {/* Profile section */}
          <div className="border-t border-gray-200 pt-4 mt-4">
            <h3 className="text-lg font-bold text-gray-800 mb-4">البيانات الشخصية</h3>

            <DatePicker
              label="تاريخ الولادة"
              value={editFormData.dateOfBirth}
              onChange={(date) => {
                setEditFormData({ ...editFormData, dateOfBirth: date });
                if (editErrors.dateOfBirth) setEditErrors({ ...editErrors, dateOfBirth: '' });
              }}
              maxDate={new Date()}
              minDate={new Date('1900-01-01')}
              placeholder="اختر تاريخ الولادة"
              error={editErrors.dateOfBirth}
              required
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
              <div>
                <label className="block text-sm font-semibold mb-2 text-gray-800">
                  الهاتف <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  value={editFormData.phone}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '');
                    setEditFormData({ ...editFormData, phone: value });
                    if (editErrors.phone) setEditErrors({ ...editErrors, phone: '' });
                  }}
                  className={`w-full px-4 py-3 border-2 rounded-lg focus:ring-4 focus:ring-primary focus:border-primary text-gray-800 bg-white ${
                    editErrors.phone ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="05xxxxxxxx"
                  maxLength={10}
                />
                {editErrors.phone && <p className="text-red-500 text-xs mt-1">{editErrors.phone}</p>}
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2 text-gray-800">
                  المهنة <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={editFormData.profession}
                  onChange={(e) => {
                    setEditFormData({ ...editFormData, profession: e.target.value });
                    if (editErrors.profession) setEditErrors({ ...editErrors, profession: '' });
                  }}
                  className={`w-full px-4 py-3 border-2 rounded-lg focus:ring-4 focus:ring-primary focus:border-primary text-gray-800 bg-white ${
                    editErrors.profession ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="المهنة"
                />
                {editErrors.profession && <p className="text-red-500 text-xs mt-1">{editErrors.profession}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
              <GenderSelect
                label="الجنس"
                value={editFormData.gender}
                onChange={(value) => {
                  setEditFormData({ ...editFormData, gender: value });
                  if (editErrors.gender) setEditErrors({ ...editErrors, gender: '' });
                }}
                error={editErrors.gender}
                required
              />
              <div>
                <label className="block text-sm font-semibold mb-2 text-gray-800">
                  رقم الهوية <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={editFormData.idNumber}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '');
                    setEditFormData({ ...editFormData, idNumber: value });
                    if (editErrors.idNumber) setEditErrors({ ...editErrors, idNumber: '' });
                  }}
                  className={`w-full px-4 py-3 border-2 rounded-lg focus:ring-4 focus:ring-primary focus:border-primary text-gray-800 bg-white ${
                    editErrors.idNumber ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="رقم الهوية (9 أرقام)"
                  maxLength={9}
                />
                {editErrors.idNumber && <p className="text-red-500 text-xs mt-1">{editErrors.idNumber}</p>}
              </div>
            </div>
          </div>

          {/* Password section */}
          <div className="border-t border-gray-200 pt-4 mt-4">
            <div>
              <label className="block text-sm font-semibold mb-2 text-gray-800">كلمة المرور الجديدة (اختياري)</label>
              <input
                type="password"
                value={editFormData.password}
                onChange={(e) => {
                  setEditFormData({ ...editFormData, password: e.target.value });
                  if (editErrors.password) setEditErrors({ ...editErrors, password: '' });
                }}
                className={`w-full px-4 py-3 border-2 rounded-lg focus:ring-4 focus:ring-primary focus:border-primary text-gray-800 bg-white ${
                  editErrors.password ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="اتركه فارغاً للاحتفاظ بكلمة المرور الحالية"
              />
              {editErrors.password && <p className="text-red-500 text-xs mt-1">{editErrors.password}</p>}
            </div>
          </div>

          <div className="flex gap-4 pt-4">
            <button
              onClick={handleSaveEdit}
              className="flex-1 px-6 py-3 bg-primary text-white rounded-lg font-bold text-lg hover:bg-primary-dark transition"
            >
              حفظ
            </button>
            <button
              onClick={() => {
                setEditingUser(null);
                setEditFormData({
                  firstName: '',
                  fatherName: '',
                  familyName: '',
                  dateOfBirth: null,
                  phone: '',
                  profession: '',
                  gender: '',
                  idNumber: '',
                  password: '',
                });
                setEditErrors({});
              }}
              className="flex-1 px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-bold text-lg hover:bg-gray-300 transition"
            >
              إلغاء
            </button>
          </div>
        </div>
      </Modal>

      {/* Create User Modal */}
      <Modal
        isOpen={showCreateForm}
        onClose={() => {
          setShowCreateForm(false);
          router.push('/admin/users');
          setCreateFormData({
            firstName: '',
            fatherName: '',
            familyName: '',
            email: '',
            password: '',
            role: 'STUDENT',
            dateOfBirth: null,
            phone: '',
            profession: '',
            gender: '',
            idNumber: '',
          });
          setCreateErrors({});
        }}
        title="إنشاء مستخدم جديد"
        size="lg"
      >
        <div className="space-y-4 max-h-[70vh] overflow-y-auto px-1">
          {/* Name fields in 3-column grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-sm font-semibold mb-2 text-gray-800">
                الاسم الشخصي <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={createFormData.firstName}
                onChange={(e) => {
                  setCreateFormData({ ...createFormData, firstName: e.target.value });
                  if (createErrors.firstName) setCreateErrors({ ...createErrors, firstName: '' });
                }}
                className={`w-full px-4 py-3 border-2 rounded-lg focus:ring-4 focus:ring-primary focus:border-primary text-gray-800 bg-white ${
                  createErrors.firstName ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="الاسم"
              />
              {createErrors.firstName && <p className="text-red-500 text-xs mt-1">{createErrors.firstName}</p>}
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2 text-gray-800">
                اسم الوالد <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={createFormData.fatherName}
                onChange={(e) => {
                  setCreateFormData({ ...createFormData, fatherName: e.target.value });
                  if (createErrors.fatherName) setCreateErrors({ ...createErrors, fatherName: '' });
                }}
                className={`w-full px-4 py-3 border-2 rounded-lg focus:ring-4 focus:ring-primary focus:border-primary text-gray-800 bg-white ${
                  createErrors.fatherName ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="الوالد"
              />
              {createErrors.fatherName && <p className="text-red-500 text-xs mt-1">{createErrors.fatherName}</p>}
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2 text-gray-800">
                اسم العائلة <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={createFormData.familyName}
                onChange={(e) => {
                  setCreateFormData({ ...createFormData, familyName: e.target.value });
                  if (createErrors.familyName) setCreateErrors({ ...createErrors, familyName: '' });
                }}
                className={`w-full px-4 py-3 border-2 rounded-lg focus:ring-4 focus:ring-primary focus:border-primary text-gray-800 bg-white ${
                  createErrors.familyName ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="العائلة"
              />
              {createErrors.familyName && <p className="text-red-500 text-xs mt-1">{createErrors.familyName}</p>}
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2 text-gray-800">
              البريد الإلكتروني <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              value={createFormData.email}
              onChange={(e) => {
                setCreateFormData({ ...createFormData, email: e.target.value });
                if (createErrors.email) setCreateErrors({ ...createErrors, email: '' });
              }}
              className={`w-full px-4 py-3 border-2 rounded-lg focus:ring-4 focus:ring-primary focus:border-primary text-gray-800 bg-white ${
                createErrors.email ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="example@email.com"
            />
            {createErrors.email && <p className="text-red-500 text-xs mt-1">{createErrors.email}</p>}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold mb-2 text-gray-800">
                كلمة المرور <span className="text-red-500">*</span>
              </label>
              <input
                type="password"
                value={createFormData.password}
                onChange={(e) => {
                  setCreateFormData({ ...createFormData, password: e.target.value });
                  if (createErrors.password) setCreateErrors({ ...createErrors, password: '' });
                }}
                className={`w-full px-4 py-3 border-2 rounded-lg focus:ring-4 focus:ring-primary focus:border-primary text-gray-800 bg-white ${
                  createErrors.password ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="6 أحرف على الأقل"
              />
              {createErrors.password && <p className="text-red-500 text-xs mt-1">{createErrors.password}</p>}
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2 text-gray-800">
                الدور <span className="text-red-500">*</span>
              </label>
              <select
                value={createFormData.role}
                onChange={(e) => setCreateFormData({ ...createFormData, role: e.target.value as 'ADMIN' | 'TEACHER' | 'STUDENT' })}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-4 focus:ring-primary focus:border-primary text-gray-800 bg-white"
              >
                <option value="STUDENT">طالب</option>
                <option value="TEACHER">مدرس</option>
                <option value="ADMIN">مشرف</option>
              </select>
            </div>
          </div>

          {/* Profile section */}
          <div className="border-t border-gray-200 pt-4 mt-4">
            <h3 className="text-lg font-bold text-gray-800 mb-4">البيانات الشخصية</h3>

            <DatePicker
              label="تاريخ الولادة"
              value={createFormData.dateOfBirth}
              onChange={(date) => {
                setCreateFormData({ ...createFormData, dateOfBirth: date });
                if (createErrors.dateOfBirth) setCreateErrors({ ...createErrors, dateOfBirth: '' });
              }}
              maxDate={new Date()}
              minDate={new Date('1900-01-01')}
              placeholder="اختر تاريخ الولادة"
              error={createErrors.dateOfBirth}
              required
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
              <div>
                <label className="block text-sm font-semibold mb-2 text-gray-800">
                  الهاتف <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  value={createFormData.phone}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '');
                    setCreateFormData({ ...createFormData, phone: value });
                    if (createErrors.phone) setCreateErrors({ ...createErrors, phone: '' });
                  }}
                  className={`w-full px-4 py-3 border-2 rounded-lg focus:ring-4 focus:ring-primary focus:border-primary text-gray-800 bg-white ${
                    createErrors.phone ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="05xxxxxxxx"
                  maxLength={10}
                />
                {createErrors.phone && <p className="text-red-500 text-xs mt-1">{createErrors.phone}</p>}
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2 text-gray-800">
                  المهنة <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={createFormData.profession}
                  onChange={(e) => {
                    setCreateFormData({ ...createFormData, profession: e.target.value });
                    if (createErrors.profession) setCreateErrors({ ...createErrors, profession: '' });
                  }}
                  className={`w-full px-4 py-3 border-2 rounded-lg focus:ring-4 focus:ring-primary focus:border-primary text-gray-800 bg-white ${
                    createErrors.profession ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="المهنة"
                />
                {createErrors.profession && <p className="text-red-500 text-xs mt-1">{createErrors.profession}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
              <GenderSelect
                label="الجنس"
                value={createFormData.gender}
                onChange={(value) => {
                  setCreateFormData({ ...createFormData, gender: value });
                  if (createErrors.gender) setCreateErrors({ ...createErrors, gender: '' });
                }}
                error={createErrors.gender}
                required
              />
              <div>
                <label className="block text-sm font-semibold mb-2 text-gray-800">
                  رقم الهوية <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={createFormData.idNumber}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '');
                    setCreateFormData({ ...createFormData, idNumber: value });
                    if (createErrors.idNumber) setCreateErrors({ ...createErrors, idNumber: '' });
                  }}
                  className={`w-full px-4 py-3 border-2 rounded-lg focus:ring-4 focus:ring-primary focus:border-primary text-gray-800 bg-white ${
                    createErrors.idNumber ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="رقم الهوية (9 أرقام)"
                  maxLength={9}
                />
                {createErrors.idNumber && <p className="text-red-500 text-xs mt-1">{createErrors.idNumber}</p>}
              </div>
            </div>
          </div>

          <div className="flex gap-4 pt-4">
            <button
              onClick={handleCreateUser}
              className="flex-1 px-6 py-3 bg-primary text-white rounded-lg font-bold text-lg hover:bg-primary-dark transition"
            >
              إنشاء
            </button>
            <button
              onClick={() => {
                setShowCreateForm(false);
                router.push('/admin/users');
                setCreateFormData({
                  firstName: '',
                  fatherName: '',
                  familyName: '',
                  email: '',
                  password: '',
                  role: 'STUDENT',
                  dateOfBirth: null,
                  phone: '',
                  profession: '',
                  gender: '',
                  idNumber: '',
                });
                setCreateErrors({});
              }}
              className="flex-1 px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-bold text-lg hover:bg-gray-300 transition"
            >
              إلغاء
            </button>
          </div>
        </div>
      </Modal>

      {/* View Profile Modal */}
      <Modal
        isOpen={!!viewingProfile}
        onClose={() => {
          setViewingProfile(null);
          setProfileData(null);
        }}
        title="الملف الشخصي"
        size="lg"
      >
        {profileLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-primary"></div>
          </div>
        ) : profileData ? (
          <div className="space-y-6">
                {/* User Info */}
                <div className="flex items-center gap-6 pb-6 border-b border-gray-200">
                  <div className="w-20 h-20 bg-gradient-to-br from-primary to-primary-light rounded-full flex items-center justify-center text-white font-bold text-3xl">
                    {profileData.name?.charAt(0) || 'A'}
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-gray-800">{profileData.name}</h3>
                    <p className="text-lg text-gray-600">{profileData.email}</p>
                    <div className="flex gap-2 mt-2">
                      <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                        profileData.role === 'ADMIN' 
                          ? 'bg-purple-100 text-purple-800'
                          : profileData.role === 'TEACHER'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {profileData.role === 'ADMIN' ? 'مشرف' : profileData.role === 'TEACHER' ? 'مدرس' : 'طالب'}
                      </span>
                      {profileData.provider && (
                        <span className="px-3 py-1 rounded-full text-sm font-semibold bg-gray-100 text-gray-800">
                          {profileData.provider === 'GOOGLE' ? 'Google' : profileData.provider === 'APPLE' ? 'Apple' : 'Email'}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Statistics */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {profileData.role === 'STUDENT' && (
                    <>
                      <div className="bg-blue-50 p-4 rounded-lg border-2 border-blue-200">
                        <p className="text-sm text-blue-600 font-semibold">التسجيلات</p>
                        <p className="text-2xl font-bold text-blue-800">{profileData._count?.enrollments || 0}</p>
                      </div>
                      <div className="bg-green-50 p-4 rounded-lg border-2 border-green-200">
                        <p className="text-sm text-green-600 font-semibold">الامتحانات</p>
                        <p className="text-2xl font-bold text-green-800">{profileData._count?.examAttempts || 0}</p>
                      </div>
                      <div className="bg-yellow-50 p-4 rounded-lg border-2 border-yellow-200">
                        <p className="text-sm text-yellow-600 font-semibold">الواجبات</p>
                        <p className="text-2xl font-bold text-yellow-800">{profileData._count?.homeworkSubmissions || 0}</p>
                      </div>
                      <div className="bg-purple-50 p-4 rounded-lg border-2 border-purple-200">
                        <p className="text-sm text-purple-600 font-semibold">التقييمات</p>
                        <p className="text-2xl font-bold text-purple-800">{profileData._count?.grades || 0}</p>
                      </div>
                    </>
                  )}
                  {profileData.role === 'TEACHER' && (
                    <>
                      <div className="bg-blue-50 p-4 rounded-lg border-2 border-blue-200">
                        <p className="text-sm text-blue-600 font-semibold">الدورات</p>
                        <p className="text-2xl font-bold text-blue-800">{profileData._count?.coursesTaught || 0}</p>
                      </div>
                    </>
                  )}
                </div>

                {/* Enrollments (for Students) */}
                {profileData.role === 'STUDENT' && profileData.enrollments && profileData.enrollments.length > 0 && (
                  <div>
                    <h4 className="text-xl font-bold text-gray-800 mb-4">الدورات المسجلة</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {profileData.enrollments.map((enrollment: any) => (
                        <div key={enrollment.id} className="bg-gray-50 p-4 rounded-lg border-2 border-gray-200">
                          <h5 className="font-semibold text-gray-800">{enrollment.course.title}</h5>
                          <p className="text-sm text-gray-600 mt-1">
                            تاريخ التسجيل: {formatDate(enrollment.enrolledAt)}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Courses Taught (for Teachers) */}
                {profileData.role === 'TEACHER' && profileData.coursesTaught && profileData.coursesTaught.length > 0 && (
                  <div>
                    <h4 className="text-xl font-bold text-gray-800 mb-4">الدورات التي أدرسها</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {profileData.coursesTaught.map((course: any) => (
                        <div key={course.id} className="bg-gray-50 p-4 rounded-lg border-2 border-gray-200">
                          <h5 className="font-semibold text-gray-800">{course.title}</h5>
                          <p className="text-sm text-gray-600 mt-1">
                            الطلاب: {course._count?.enrollments || 0}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Recent Grades */}
                {profileData.grades && profileData.grades.length > 0 && (
                  <div>
                    <h4 className="text-xl font-bold text-gray-800 mb-4">آخر التقييمات</h4>
                    <div className="space-y-2">
                      {profileData.grades.map((grade: any) => (
                        <div key={grade.id} className="bg-gray-50 p-4 rounded-lg border-2 border-gray-200 flex justify-between items-center">
                          <div>
                            <p className="font-semibold text-gray-800">{grade.course.title}</p>
                            <p className="text-sm text-gray-600">
                              {grade.type === 'EXAM' ? 'امتحان' : grade.type === 'HOMEWORK' ? 'واجب' : 'تقييم'}
                            </p>
                          </div>
                          <div className="text-left">
                            <p className="text-lg font-bold text-gray-800">
                              {grade.score} / {grade.maxScore}
                            </p>
                            <p className="text-sm text-gray-600">{grade.letterGrade}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Account Info */}
                <div className="pt-6 border-t border-gray-200">
                  <h4 className="text-lg font-bold text-gray-800 mb-3">معلومات الحساب</h4>
                  <div className="space-y-2 text-gray-700">
                    <p><span className="font-semibold">تاريخ الإنشاء:</span> {formatDate(profileData.createdAt)}</p>
                    <p><span className="font-semibold">الحالة:</span> {profileData.blocked ? 'محظور' : 'نشط'}</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-6 text-center text-gray-500">
                <p>فشل تحميل بيانات الملف الشخصي</p>
              </div>
            )}
      </Modal>
    </div>
  );
}

