import { useState, useEffect } from 'react';
import { Search, Shield, Mail, Phone, Calendar, Loader2, UserCog, Trash2, Edit } from 'lucide-react';
import { getAllUsersAPI, type Staff } from '../api/user';

export default function UsersManagementView() {
  const [users, setUsers] = useState<Staff[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const data = await getAllUsersAPI();
      setUsers(data);
    } catch (error) {
      console.error('Failed to fetch users:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const getRoleBadge = (role: string) => {
    const configs: Record<string, { bg: string, color: string, label: string }> = {
      manager: { bg: 'bg-rose-100', color: 'text-rose-700', label: 'Quản lý' },
      sales: { bg: 'bg-blue-100', color: 'text-blue-700', label: 'Kinh doanh' },
      engineer: { bg: 'bg-purple-100', color: 'text-purple-700', label: 'Kỹ thuật' },
      customer: { bg: 'bg-amber-100', color: 'text-amber-700', label: 'Khách hàng' },
    };
    const config = configs[role] || { bg: 'bg-slate-100', color: 'text-slate-700', label: role };
    return (
      <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${config.bg} ${config.color}`}>
        {config.label}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Quản lý tài khoản</h1>
          <p className="text-slate-500 text-sm mt-1">Quản lý và cập nhật quyền hạn cho tất cả thành viên trên hệ thống.</p>
        </div>
        <div className="bg-blue-600 text-white px-5 py-2.5 rounded-xl font-semibold flex items-center gap-2 shadow-lg shadow-blue-600/20 w-fit">
          <UserCog size={18} />
          Tổng: {users.length} tài khoản
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 border border-slate-200 rounded-3xl flex flex-col md:flex-row gap-4 shadow-sm">
        <div className="flex-1 relative">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Tìm theo tên hoặc email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition shadow-sm"
          />
        </div>
        <div className="flex gap-2">
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition cursor-pointer shadow-sm"
          >
            <option value="all">Tất cả vai trò</option>
            <option value="manager">Quản lý</option>
            <option value="sales">Kinh doanh</option>
            <option value="engineer">Kỹ thuật</option>
            <option value="customer">Khách hàng</option>
          </select>
          <button 
             onClick={fetchUsers}
             className="p-2.5 text-slate-500 hover:bg-slate-100 rounded-2xl transition border border-slate-200 bg-white shadow-sm"
             title="Làm mới"
          >
            <Shield size={20} />
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto px-1">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50/80 border-b border-slate-200">
              <tr>
                <th className="px-6 py-5 text-[11px] font-bold text-slate-500 uppercase tracking-widest">Người dùng</th>
                <th className="px-6 py-5 text-[11px] font-bold text-slate-500 uppercase tracking-widest text-center">Vai trò</th>
                <th className="px-6 py-5 text-[11px] font-bold text-slate-500 uppercase tracking-widest">Liên hệ</th>
                <th className="px-6 py-5 text-[11px] font-bold text-slate-500 uppercase tracking-widest text-center">Ngày tạo</th>
                <th className="px-6 py-5 text-[11px] font-bold text-slate-500 uppercase tracking-widest text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <Loader2 size={40} className="animate-spin text-blue-600" />
                      <span className="text-slate-500 text-sm font-medium">Đang đồng bộ dữ liệu...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-20 text-center text-slate-400">
                    <div className="flex flex-col items-center gap-2">
                       <Search size={40} className="opacity-20 mb-2" />
                       <span className="text-sm">Không tìm thấy tài khoản phù hợp</span>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user._id} className="hover:bg-slate-50/80 transition-all duration-200 group">
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-4 max-w-xs">
                        <div className="w-11 h-11 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 font-bold shrink-0 shadow-sm">
                          {user.name[0]?.toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <div className="font-bold text-slate-900 truncate" title={user.name}>{user.name}</div>
                          <div className="text-xs text-slate-500 truncate" title={user.email}>{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5 text-center">
                      {getRoleBadge(user.role)}
                    </td>
                    <td className="px-6 py-5">
                      <div className="space-y-1.5 min-w-[150px]">
                        <div className="flex items-center gap-2 text-xs text-slate-600 font-medium">
                          <Phone size={13} className="text-slate-400" />
                          {user.phone || 'Chưa cập nhật'}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-slate-500">
                          <Mail size={13} className="text-slate-400" />
                          <span className="truncate">{user.email}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5 text-center">
                       <div className="inline-flex items-center gap-2 text-[13px] text-slate-600 bg-slate-50 px-3 py-1 rounded-full border border-slate-100">
                        <Calendar size={13} className="text-slate-400" />
                        {new Date(user.createdAt).toLocaleDateString('vi-VN')}
                       </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300">
                        <button className="p-2.5 bg-white border border-slate-200 rounded-xl text-slate-500 hover:text-blue-600 transition shadow-sm hover:shadow-md active:scale-90">
                          <Edit size={16} />
                        </button>
                        <button className="p-2.5 bg-white border border-slate-200 rounded-xl text-slate-500 hover:text-red-600 transition shadow-sm hover:shadow-md active:scale-90">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
