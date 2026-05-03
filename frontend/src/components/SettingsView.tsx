import React, { useState, useEffect } from 'react';
import { User, Users, FileText, CheckCircle, Save, Lock } from 'lucide-react';
import { getStaffAllAPI, updateMyProfileAPI, type Staff } from '../api/user';
import { registerStaffAPI } from '../api/auth';

interface SettingsViewProps {
  user: any;
  onUserUpdate: (updatedUser: any) => void;
  openChangePassword: () => void;
}

export default function SettingsView({ user, onUserUpdate, openChangePassword }: SettingsViewProps) {
  const [activeTab, setActiveTab] = useState<'profile' | 'quote' | 'staff'>('profile');
  
  // Tab 1: Profile
  const [profileName, setProfileName] = useState(user?.name || '');
  const [profilePhone, setProfilePhone] = useState(user?.phone || '');
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Tab 2: Quote settings (stored in localStorage for simplicity right now)
  const [quoteTax, setQuoteTax] = useState(() => localStorage.getItem('defaultTax') || '8');
  const [quoteTerms, setQuoteTerms] = useState(() => localStorage.getItem('defaultTerms') || '1. Báo giá có giá trị trong 30 ngày.\n2. Thanh toán 50% khi đặt hàng, 50% trước khi giao hàng.');
  const [isSavingQuote, setIsSavingQuote] = useState(false);

  // Tab 3: Staff Management
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [isLoadingStaff, setIsLoadingStaff] = useState(false);
  
  // Register Staff Form
  const [isAddingStaff, setIsAddingStaff] = useState(false);
  const [newStaff, setNewStaff] = useState({ name: '', email: '', password: '', role: 'sales' });
  const [isRegistering, setIsRegistering] = useState(false);

  useEffect(() => {
    if (activeTab === 'staff' && user?.role === 'manager') {
      fetchStaff();
    }
  }, [activeTab]);

  const fetchStaff = async () => {
    setIsLoadingStaff(true);
    try {
      const data = await getStaffAllAPI();
      setStaffList(data);
    } catch(e) {
      console.error(e);
    } finally {
      setIsLoadingStaff(false);
    }
  };

  const handleSaveProfile = async () => {
    // Validate name
    if (!profileName.trim()) {
      alert('Vui lòng nhập họ và tên!');
      return;
    }

    // Validate phone number
    const vnf_regex = /((09|03|07|08|05)+([0-9]{8})\b)/g;
    if (profilePhone && !vnf_regex.test(profilePhone)) {
      alert('Số điện thoại không hợp lệ! Vui lòng nhập đúng định dạng số điện thoại Việt Nam (10 số, bắt đầu bằng 09, 03, 07, 08, 05).');
      return;
    }

    setIsSavingProfile(true);
    try {
      const res = await updateMyProfileAPI({ name: profileName, phone: profilePhone });
      onUserUpdate(res.user);
      alert('Cập nhật hồ sơ thành công!');
    } catch(e: any) {
      alert(e.response?.data?.message || 'Lỗi cập nhật');
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleSaveQuoteDefaults = () => {
    setIsSavingQuote(true);
    localStorage.setItem('defaultTax', quoteTax);
    localStorage.setItem('defaultTerms', quoteTerms);
    setTimeout(() => {
      setIsSavingQuote(false);
      alert('Đã lưu cấu hình báo giá mặc định!');
    }, 500);
  };

  const handleRegisterStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsRegistering(true);
    try {
      await registerStaffAPI(newStaff);
      alert('Đã tạo tài khoản nhân viên thành công!');
      setIsAddingStaff(false);
      setNewStaff({ name: '', email: '', password: '', role: 'sales' });
      fetchStaff();
    } catch (e: any) {
      alert(e.response?.data?.message || 'Có lỗi xảy ra khi tạo tải khoản');
    } finally {
      setIsRegistering(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex flex-col md:flex-row gap-8">
        {/* Settings Navigation */}
        <div className="w-full md:w-64 shrink-0">
          <div className="bg-white border border-slate-200 rounded-2xl p-3 flex flex-col gap-1">
            <button
              onClick={() => setActiveTab('profile')}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition ${activeTab === 'profile' ? 'bg-blue-50 text-blue-600 font-medium' : 'text-slate-600 hover:bg-slate-50'}`}
            >
              <User size={18} />
              Hồ sơ cá nhân
            </button>
            {user?.role !== 'customer' && (
              <button
                onClick={() => setActiveTab('quote')}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition ${activeTab === 'quote' ? 'bg-blue-50 text-blue-600 font-medium' : 'text-slate-600 hover:bg-slate-50'}`}
              >
                <FileText size={18} />
                Cấu hình Báo giá
              </button>
            )}
            {user?.role === 'manager' && (
              <button
                onClick={() => setActiveTab('staff')}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition ${activeTab === 'staff' ? 'bg-blue-50 text-blue-600 font-medium' : 'text-slate-600 hover:bg-slate-50'}`}
              >
                <Users size={18} />
                Quản lý Nhân sự
              </button>
            )}
          </div>
        </div>

        {/* Settings Content */}
        <div className="flex-1 min-w-0 bg-white border border-slate-200 rounded-3xl p-8">
          
          {/* TAB 1: PROFILE */}
          {activeTab === 'profile' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-bold text-slate-900">Hồ sơ cá nhân</h3>
                <p className="text-sm text-slate-500 mt-1">Cập nhật thông tin tài khoản của bạn</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-100">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Email đăng nhập</label>
                  <input
                    type="email" disabled value={user?.email}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-500 cursor-not-allowed"
                  />
                  <p className="text-xs text-slate-400 mt-1">Email không thể thay đổi</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Chức vụ (Role)</label>
                  <input
                    type="text" disabled value={user?.role?.toUpperCase()}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-500 font-semibold cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Họ và tên *</label>
                  <input
                    type="text" value={profileName} onChange={e => setProfileName(e.target.value)}
                    className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Số điện thoại</label>
                  <input
                    type="tel" 
                    value={profilePhone} 
                    onChange={e => setProfilePhone(e.target.value.replace(/[^0-9]/g, ''))}
                    placeholder="Ví dụ: 0912345678"
                    maxLength={11}
                    className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="flex items-center gap-4 pt-6 mt-4 border-t border-slate-100">
                <button
                  onClick={handleSaveProfile}
                  disabled={isSavingProfile}
                  className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium rounded-xl transition"
                >
                  <Save size={18} />
                  {isSavingProfile ? 'Đang lưu...' : 'Lưu thay đổi'}
                </button>
              </div>

              <div className="mt-12 bg-slate-50 rounded-2xl p-6 border border-slate-200">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-semibold text-slate-900">Bảo mật tài khoản</h4>
                    <p className="text-sm text-slate-500 mt-1">Bảo vệ tài khoản của bạn bằng mật khẩu mạnh.</p>
                  </div>
                  <button
                    onClick={openChangePassword}
                    className="flex items-center gap-2 px-5 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-medium rounded-xl transition shadow-sm"
                  >
                    <Lock size={16} />
                    Đổi mật khẩu
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: QUOTE DEFAULTS */}
          {activeTab === 'quote' && user?.role !== 'customer' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-bold text-slate-900">Cấu hình Báo giá mặc định</h3>
                <p className="text-sm text-slate-500 mt-1">Thiết lập các thông số sẽ tự động điền khi tạo báo giá mới</p>
              </div>

              <div className="pt-4 border-t border-slate-100 space-y-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Mức Thuế VAT mặc định (%)</label>
                  <input
                    type="number" min="0" max="100" value={quoteTax} onChange={e => setQuoteTax(e.target.value)}
                    className="w-32 px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:border-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Điều khoản & Giao hàng (Mặc định)</label>
                  <p className="text-xs text-slate-500 mb-2">Nội dung này sẽ xuất hiện ở phần Ghi chú/Điều khoản mẫu tin nhắn gửi cho khách hàng.</p>
                  <textarea
                    rows={5}
                    value={quoteTerms}
                    onChange={e => setQuoteTerms(e.target.value)}
                    className="w-full px-4 py-3 bg-white border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="pt-6 border-t border-slate-100">
                <button
                  onClick={handleSaveQuoteDefaults}
                  disabled={isSavingQuote}
                  className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium rounded-xl transition"
                >
                  <CheckCircle size={18} />
                  {isSavingQuote ? 'Đang lưu...' : 'Lưu cài đặt'}
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: STAFF MANAGEMENT */}
          {activeTab === 'staff' && user?.role === 'manager' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-xl font-bold text-slate-900">Quản lý Nhân sự</h3>
                  <p className="text-sm text-slate-500 mt-1">Quản lý danh sách tài khoản nội bộ (Sales, Engineer)</p>
                </div>
                {!isAddingStaff && (
                  <button
                    onClick={() => setIsAddingStaff(true)}
                    className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition shadow-sm"
                  >
                    + Thêm tài khoản
                  </button>
                )}
              </div>

              {isAddingStaff && (
                <div className="bg-slate-50 p-6 rounded-2xl border border-blue-200">
                  <h4 className="font-semibold text-slate-900 mb-4">Tạo tài khoản Cấp dưới</h4>
                  <form onSubmit={handleRegisterStaff} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Họ tên</label>
                      <input required type="text" value={newStaff.name} onChange={e=>setNewStaff({...newStaff, name: e.target.value})} className="w-full px-4 py-2 border border-slate-300 rounded-xl" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Email đăng nhập</label>
                      <input required type="email" value={newStaff.email} onChange={e=>setNewStaff({...newStaff, email: e.target.value})} className="w-full px-4 py-2 border border-slate-300 rounded-xl" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Mật khẩu</label>
                      <input required type="password" value={newStaff.password} onChange={e=>setNewStaff({...newStaff, password: e.target.value})} className="w-full px-4 py-2 border border-slate-300 rounded-xl" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Phân quyền</label>
                      <select value={newStaff.role} onChange={e=>setNewStaff({...newStaff, role: e.target.value})} className="w-full px-4 py-2 border border-slate-300 rounded-xl bg-white">
                        <option value="sales">Sales Executive (Bán hàng)</option>
                        <option value="engineer">Engineer (Kỹ sư)</option>
                        <option value="manager">Manager (Quản lý)</option>
                      </select>
                    </div>
                    <div className="md:col-span-2 flex gap-3 mt-2">
                      <button type="submit" disabled={isRegistering} className="px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-400 text-white rounded-xl font-medium">Lưu tài khoản</button>
                      <button type="button" onClick={() => setIsAddingStaff(false)} className="px-5 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-xl font-medium">Hủy</button>
                    </div>
                  </form>
                </div>
              )}

              <div className="border border-slate-200 rounded-2xl overflow-hidden mt-6">
                <table className="w-full">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-slate-600">Nhân viên</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-slate-600">Email</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-slate-600">Role</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-slate-600">Ngày tạo</th>
                    </tr>
                  </thead>
                  <tbody>
                    {isLoadingStaff ? (
                      <tr><td colSpan={4} className="p-8 text-center text-slate-500">Đang tải biểu mẫu...</td></tr>
                    ) : staffList.length === 0 ? (
                      <tr><td colSpan={4} className="p-8 text-center text-slate-500">Chưa có dữ liệu</td></tr>
                    ) : (
                      staffList.map(staff => (
                        <tr key={staff._id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                          <td className="px-4 py-3">
                            <div className="font-medium text-slate-900">{staff.name}</div>
                            {staff.phone && <div className="text-xs text-slate-500">{staff.phone}</div>}
                          </td>
                          <td className="px-4 py-3 text-slate-600 text-sm">{staff.email}</td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${staff.role === 'manager' ? 'bg-amber-100 text-amber-700' : staff.role === 'engineer' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'}`}>
                              {staff.role.toUpperCase()}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-slate-500 text-sm">{new Date(staff.createdAt).toLocaleDateString('vi-VN')}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
