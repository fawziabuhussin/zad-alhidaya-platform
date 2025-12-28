'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';

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

export default function AdminUsersPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const action = searchParams.get('action');
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
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
  }, []);

  const loadUsers = async () => {
    try {
      const response = await api.get('/users');
      setUsers(response.data || []);
    } catch (error) {
      console.error('Failed to load users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBlock = async (id: string, blocked: boolean) => {
    try {
      await api.patch(`/users/${id}`, { blocked: !blocked });
      setUsers(users.map(u => u.id === id ? { ...u, blocked: !blocked } : u));
    } catch (error: any) {
      alert(error.response?.data?.message || 'فشل تحديث المستخدم');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا المستخدم؟')) return;

    try {
      await api.delete(`/users/${id}`);
      setUsers(users.filter(u => u.id !== id));
    } catch (error: any) {
      alert(error.response?.data?.message || 'فشل حذف المستخدم');
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
      alert('تم تحديث بيانات المستخدم بنجاح!');
    } catch (error: any) {
      alert(error.response?.data?.message || 'فشل تحديث بيانات المستخدم');
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
      
      alert('تم إنشاء المستخدم بنجاح!');
      setShowCreateForm(false);
      setCreateFormData({ name: '', email: '', password: '', role: 'STUDENT' });
      router.push('/admin/users');
      loadUsers();
    } catch (error: any) {
      alert(error.response?.data?.message || 'فشل إنشاء المستخدم');
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
      alert('فشل تحميل الملف الشخصي');
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 bg-gray-50 min-h-screen p-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">إدارة المستخدمين</h1>
        <button
          onClick={() => {
            setShowCreateForm(true);
            router.push('/admin/users?action=create');
          }}
          className="px-6 py-3 bg-primary text-white rounded-lg font-bold text-lg hover:bg-primary-dark transition"
        >
          + إنشاء مستخدم جديد
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-md p-4 flex gap-4">
        <input
          type="text"
          placeholder="ابحث عن مستخدم..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-gray-800 bg-white"
        />
        <RoleFilterDropdown
          value={roleFilter}
          onChange={(value) => setRoleFilter(value)}
        />
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {filteredUsers.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">لا يوجد مستخدمين</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">المستخدم</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">الدور</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">الحالة</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">الإحصائيات</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50 bg-white">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-primary to-primary-light rounded-full flex items-center justify-center text-white font-bold">
                          {user.name.charAt(0)}
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-800">{user.name}</h3>
                          <p className="text-sm text-gray-600">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs ${
                        user.role === 'ADMIN' 
                          ? 'bg-purple-100 text-purple-800'
                          : user.role === 'TEACHER'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {user.role === 'ADMIN' ? 'أدمن' : user.role === 'TEACHER' ? 'مدرس' : 'طالب'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs ${
                        user.blocked 
                          ? 'bg-red-100 text-red-800' 
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {user.blocked ? 'محظور' : 'نشط'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-800">
                      {user.role === 'TEACHER' && (
                        <span>دورات: {user._count?.coursesTaught || 0}</span>
                      )}
                      {user.role === 'STUDENT' && (
                        <span>تسجيلات: {user._count?.enrollments || 0}</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2 flex-wrap">
                        <button
                          onClick={() => handleViewProfile(user)}
                          className="px-3 py-1 bg-purple-100 text-purple-700 rounded hover:bg-purple-200 transition text-sm"
                        >
                          ملف شخصي
                        </button>
                        <button
                          onClick={() => handleEdit(user)}
                          className="px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition text-sm"
                        >
                          تعديل
                        </button>
                        <button
                          onClick={() => handleBlock(user.id, user.blocked)}
                          className={`px-3 py-1 rounded text-sm transition ${
                            user.blocked
                              ? 'bg-green-100 text-green-700 hover:bg-green-200'
                              : 'bg-red-100 text-red-700 hover:bg-red-200'
                          }`}
                        >
                          {user.blocked ? 'إلغاء الحظر' : 'حظر'}
                        </button>
                        <button
                          onClick={() => handleDelete(user.id)}
                          className="px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 transition text-sm"
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
        )}
      </div>

      {/* Edit User Modal */}
      {editingUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800">تعديل بيانات المستخدم</h2>
              <button
                onClick={() => {
                  setEditingUser(null);
                  setEditFormData({ name: '', password: '' });
                }}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ×
              </button>
            </div>
            
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
          </div>
        </div>
      )}

      {/* Create User Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800">إنشاء مستخدم جديد</h2>
              <button
                onClick={() => {
                  setShowCreateForm(false);
                  router.push('/admin/users');
                  setCreateFormData({ name: '', email: '', password: '', role: 'STUDENT' });
                  setCreateErrors({});
                }}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ×
              </button>
            </div>
            
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
          </div>
        </div>
      )}

      {/* View Profile Modal */}
      {viewingProfile && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-800">الملف الشخصي</h2>
              <button
                onClick={() => {
                  setViewingProfile(null);
                  setProfileData(null);
                }}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ×
              </button>
            </div>

            {profileLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-primary"></div>
              </div>
            ) : profileData ? (
              <div className="p-6 space-y-6">
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
          </div>
        </div>
      )}
    </div>
  );
}

