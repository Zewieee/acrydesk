import React, { useState, useEffect } from 'react';
import { Bell, Send, Megaphone, Loader2 } from 'lucide-react';
import { getNotificationsAPI, createAnnouncementAPI, type Notification } from '../api/notification';

interface NotificationViewProps {
  userRole: 'manager' | 'sales' | 'engineer' | 'customer';
}

export default function NotificationView({ userRole }: NotificationViewProps) {
  const isStaff = ['manager', 'sales', 'engineer'].includes(userRole);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  // Compose Announcement Form (for Staff)
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);

  const fetchDirectNotifications = async () => {
    setIsLoading(true);
    try {
      const data = await getNotificationsAPI();
      // Lọc các thông báo dạng announcement (hoặc hiển thị tất cả tùy nhu cầu)
      // Ở đây ta ưu tiên hiển thị các "Thông báo từ quản trị"
      setNotifications(data.notifications);
    } catch (error) {
      console.error('Failed to fetch notifications', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDirectNotifications();
  }, []);

  const handleSendAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !message) return;

    setIsSending(true);
    try {
      await createAnnouncementAPI({ title, message });
      alert('Đã gửi thông báo thành công cho tất cả khách hàng!');
      setTitle('');
      setMessage('');
      fetchDirectNotifications();
    } catch (error) {
      alert('Gửi thông báo thất bại');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* HEADER SECTION */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Trung tâm Thông báo</h2>
          <p className="text-slate-500">Xem và quản lý các thông báo quan trọng</p>
        </div>
        <div className="bg-blue-50 text-blue-600 p-3 rounded-2xl">
          <Bell size={24} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* COMPOSE SECTION (Only for Staff) */}
        {isStaff && (
          <div className="lg:col-span-12 xl:col-span-5 space-y-6">
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
                  <Megaphone size={20} />
                </div>
                <h3 className="font-bold text-slate-900">Tạo thông báo mới</h3>
              </div>

              <form onSubmit={handleSendAnnouncement} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Tiêu đề</label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Nhập tiêu đề thông báo..."
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Nội dung</label>
                  <textarea
                    rows={4}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Nhập nội dung chi tiết..."
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition resize-none"
                  />
                </div>
                
                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isSending}
                    className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20 disabled:opacity-50"
                  >
                    {isSending ? <Loader2 className="animate-spin" size={18} /> : <Send size={18} />}
                    Gửi thông báo tới KH
                  </button>
                </div>
                <p className="text-[10px] text-slate-400 text-center italic">
                  * Thông báo này sẽ được gửi tới tất cả tài khoản Khách hàng
                </p>
              </form>
            </div>
          </div>
        )}

        {/* LIST SECTION */}
        <div className={`lg:col-span-12 ${isStaff ? 'xl:col-span-7' : ''} space-y-4`}>
          <div className="flex items-center justify-between mb-2 px-2">
            <h3 className="font-bold text-slate-900">Lịch sử thông báo</h3>
            <button onClick={fetchDirectNotifications} className="text-sm text-blue-600 font-medium hover:underline">
              Làm mới
            </button>
          </div>

          <div className="space-y-4">
            {isLoading ? (
              <div className="py-20 text-center text-slate-400">
                <Loader2 size={32} className="animate-spin mx-auto mb-4" opacity={0.5} />
                <p>Đang tải thông báo...</p>
              </div>
            ) : notifications.length === 0 ? (
              <div className="bg-white border border-slate-200 border-dashed rounded-3xl py-20 text-center text-slate-400">
                <Bell size={48} className="mx-auto mb-4 opacity-10" />
                <p>Chưa có thông báo nào được ghi nhận</p>
              </div>
            ) : (
              notifications.map((n) => (
                <div 
                  key={n.id} 
                  className={`bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition relative overflow-hidden group
                    ${n.type === 'announcement' ? 'border-l-4 border-l-blue-500' : 'border-l-4 border-l-slate-300'}
                  `}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {n.type === 'announcement' ? (
                        <Megaphone size={16} className="text-blue-500" />
                      ) : (
                        <Bell size={16} className="text-slate-400" />
                      )}
                      <span className={`text-[10px] font-bold uppercase tracking-wider ${n.type === 'announcement' ? 'text-blue-600' : 'text-slate-500'}`}>
                        {n.type === 'announcement' ? 'CÔNG BỐ' : 'HỆ THỐNG'}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-400 italic">
                      {new Date(n.createdAt).toLocaleString('vi-VN')}
                    </span>
                  </div>
                  
                  <h4 className="font-bold text-slate-900 mb-1">{n.title}</h4>
                  <p className="text-sm text-slate-600 leading-relaxed">{n.message}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
