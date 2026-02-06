'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import Modal from '@/components/Modal';
import { UsersIcon, PlusIcon, EditIcon, TrashIcon, EyeIcon, SearchIcon, FilterIcon } from '@/components/Icons';
import { showSuccess, showError, TOAST_MESSAGES } from '@/lib/toast';
import { Pagination, PaginationInfo, PaginatedResponse } from '@/components/Pagination';
import PageLoading from '@/components/PageLoading';

// Custom Role Filter Dropdown
function RoleFilterDropdown({ value, onChange }: { value: string, onChange: (value: string) => void }) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const options = [
    { value: '', label: 'جميع الأدوار' },
    { value: 'ADMIN', label: 'أدمن' },
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
  email: string;
  role: string;
  blocked: boolean;
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
  const [editFormData, setEditFormData] = useState({ name: '', password: '' });
  const [showCreateForm, setShowCreateForm] = useState(action === 'create');
  const [createFormData, setCreateFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'STUDENT' as 'ADMIN' | 'TEACHER' | 'STUDENT',
  });
  const [createErrors, setCreateErrors] = useState<{ [key: string]: string }>({});
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
    setEditFormData({ name: user.name, password: '' });
  };

  const handleSaveEdit = async () => {
    if (!editingUser) return;

    // Double confirmation
    if (!confirm('هل أنت متأكد من تحديث بيانات هذا المستخدم؟')) return;
    if (editFormData.password && !confirm('هل أنت متأكد من تغيير كلمة المرور؟')) return;

    try {
      const updateData: any = { name: editFormData.name };
      if (editFormData.password) {
        updateData.password = editFormData.password;
      }
      
      await api.put(`/users/${editingUser.id}`, updateData);
      setUsers(users.map(u => u.id === editingUser.id ? { ...u, name: editFormData.name } : u));
      setEditingUser(null);
      setEditFormData({ name: '', password: '' });
      showSuccess(TOAST_MESSAGES.UPDATE_SUCCESS);
    } catch (error: any) {
      showError(error.response?.data?.message || 'فشل تحديث بيانات المستخدم');
    }
  };

  const handleCreateUser = async () => {
    setCreateErrors({});

    // Validation
    if (!createFormData.name || createFormData.name.length < 2) {
      setCreateErrors({ name: 'الاسم يجب أن يكون على الأقل حرفين' });
      return;
    }
    if (!createFormData.email || !createFormData.email.includes('@')) {
      setCreateErrors({ email: 'البريد الإلكتروني غير صحيح' });
      return;
    }
    if (!createFormData.password || createFormData.password.length < 6) {
      setCreateErrors({ password: 'كلمة المرور يجب أن تكون على الأقل 6 أحرف' });
      return;
    }

    if (!confirm('هل أنت متأكد من إنشاء هذا المستخدم؟')) return;

    try {
      if (createFormData.role === 'TEACHER') {
        await api.post('/users/teachers', {
          name: createFormData.name,
          email: createFormData.email,
          password: createFormData.password,
        });
      } else {
        await api.post('/auth/register', {
          name: createFormData.name,
          email: createFormData.email,
          password: createFormData.password,
        });
        // Then update role if needed
        const usersRes = await api.get('/users');
        const allUsers = usersRes.data || [];
        const newUser = allUsers.find((u: User) => u.email === createFormData.email);
        if (newUser && createFormData.role !== 'STUDENT') {
          await api.put(`/users/${newUser.id}`, { role: createFormData.role });
        }
      }
      
      showSuccess(TOAST_MESSAGES.CREATE_SUCCESS);
      setShowCreateForm(false);
      setCreateFormData({ name: '', email: '', password: '', role: 'STUDENT' });
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
                            className="p-2 bg-violet-50 text-violet-600 rounded-lg hover:bg-violet-100 transition"
                            title="ملف شخصي"
                          >
                            <EyeIcon size={16} />
                          </button>
                          <button
                            onClick={() => handleEdit(user)}
                            className="p-2 bg-sky-50 text-sky-600 rounded-lg hover:bg-sky-100 transition"
                            title="تعديل"
                          >
                            <EditIcon size={16} />
                          </button>
                          <button
                            onClick={() => handleBlock(user.id, user.blocked)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                              user.blocked
                                ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
                                : 'bg-amber-50 text-amber-600 hover:bg-amber-100'
                            }`}
                          >
                            {user.blocked ? 'تفعيل' : 'حظر'}
                          </button>
                          <button
                            onClick={() => handleDelete(user.id)}
                            className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition"
                            title="حذف"
                          >
                            <TrashIcon size={16} />
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
          setEditFormData({ name: '', password: '' });
        }}
        title="تعديل بيانات المستخدم"
        size="md"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-lg font-semibold mb-2 text-gray-800">الاسم</label>
            <input
              type="text"
              value={editFormData.name}
              onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
              className="w-full px-4 py-3 text-lg border-2 border-gray-300 rounded-lg focus:ring-4 focus:ring-primary focus:border-primary text-gray-800 bg-white"
            />
          </div>
          
          <div>
            <label className="block text-lg font-semibold mb-2 text-gray-800">كلمة المرور الجديدة (اختياري)</label>
            <input
              type="password"
              value={editFormData.password}
              onChange={(e) => setEditFormData({ ...editFormData, password: e.target.value })}
              className="w-full px-4 py-3 text-lg border-2 border-gray-300 rounded-lg focus:ring-4 focus:ring-primary focus:border-primary text-gray-800 bg-white"
              placeholder="اتركه فارغاً للاحتفاظ بكلمة المرور الحالية"
            />
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
                setEditFormData({ name: '', password: '' });
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
          setCreateFormData({ name: '', email: '', password: '', role: 'STUDENT' });
          setCreateErrors({});
        }}
        title="إنشاء مستخدم جديد"
        size="md"
      >
        <div className="space-y-4">
              <div>
                <label className="block text-lg font-semibold mb-2 text-gray-800">الاسم *</label>
                <input
                  type="text"
                  value={createFormData.name}
                  onChange={(e) => {
                    setCreateFormData({ ...createFormData, name: e.target.value });
                    if (createErrors.name) setCreateErrors({ ...createErrors, name: '' });
                  }}
                  required
                  className={`w-full px-4 py-3 text-lg border-2 rounded-lg focus:ring-4 focus:ring-primary focus:border-primary text-gray-800 bg-white ${
                    createErrors.name ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="اسم المستخدم"
                />
                {createErrors.name && <p className="text-red-500 text-sm mt-1">{createErrors.name}</p>}
              </div>

              <div>
                <label className="block text-lg font-semibold mb-2 text-gray-800">البريد الإلكتروني *</label>
                <input
                  type="email"
                  value={createFormData.email}
                  onChange={(e) => {
                    setCreateFormData({ ...createFormData, email: e.target.value });
                    if (createErrors.email) setCreateErrors({ ...createErrors, email: '' });
                  }}
                  required
                  className={`w-full px-4 py-3 text-lg border-2 rounded-lg focus:ring-4 focus:ring-primary focus:border-primary text-gray-800 bg-white ${
                    createErrors.email ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="example@email.com"
                />
                {createErrors.email && <p className="text-red-500 text-sm mt-1">{createErrors.email}</p>}
              </div>

              <div>
                <label className="block text-lg font-semibold mb-2 text-gray-800">كلمة المرور *</label>
                <input
                  type="password"
                  value={createFormData.password}
                  onChange={(e) => {
                    setCreateFormData({ ...createFormData, password: e.target.value });
                    if (createErrors.password) setCreateErrors({ ...createErrors, password: '' });
                  }}
                  required
                  minLength={6}
                  className={`w-full px-4 py-3 text-lg border-2 rounded-lg focus:ring-4 focus:ring-primary focus:border-primary text-gray-800 bg-white ${
                    createErrors.password ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="كلمة المرور (6 أحرف على الأقل)"
                />
                {createErrors.password && <p className="text-red-500 text-sm mt-1">{createErrors.password}</p>}
              </div>

              <div>
                <label className="block text-lg font-semibold mb-2 text-gray-800">الدور *</label>
                <select
                  value={createFormData.role}
                  onChange={(e) => setCreateFormData({ ...createFormData, role: e.target.value as 'ADMIN' | 'TEACHER' | 'STUDENT' })}
                  className="w-full px-4 py-3 text-lg border-2 border-gray-300 rounded-lg focus:ring-4 focus:ring-primary focus:border-primary text-gray-800 bg-white"
                >
                  <option value="STUDENT">طالب</option>
                  <option value="TEACHER">مدرس</option>
                  <option value="ADMIN">أدمن</option>
                </select>
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
                    setCreateFormData({ name: '', email: '', password: '', role: 'STUDENT' });
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
                        {profileData.role === 'ADMIN' ? 'أدمن' : profileData.role === 'TEACHER' ? 'مدرس' : 'طالب'}
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
                            تاريخ التسجيل: {new Date(enrollment.enrolledAt).toLocaleDateString('ar-SA')}
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
                    <p><span className="font-semibold">تاريخ الإنشاء:</span> {new Date(profileData.createdAt).toLocaleDateString('ar-SA')}</p>
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

