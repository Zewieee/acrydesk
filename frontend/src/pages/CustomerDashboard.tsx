// src/pages/CustomerDashboard.tsx
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import toast from 'react-hot-toast';
import {
  FileText,
  Plus,
  Search,
  Repeat,
  LogOut,
  User,
  Clock,
  CheckCircle,
  AlertCircle,
  Loader2,
  X,
  Eye,
  Edit,
  Trash2,
  Bell,
  DollarSign,
  Lock,
  Activity,
  Menu,
  Settings,
  MessageSquare,
  Home,
  TrendingUp,
  FileSearch,
  Star,
  Megaphone,
  Paperclip,
  Download,
} from 'lucide-react';
import { type RFQ, statusConfig } from '../types/rfq';
import { getRFQsAPI, createRFQAPI, updateRFQAPI, deleteRFQAPI, submitFeedbackAPI, reorderRFQAPI } from '../api/rfq';
import { getDocumentsAPI, type AcryDocument } from '../api/document';
import { type Quotation, getQuotationsAPI, acceptQuotationAPI, rejectQuotationAPI } from '../api/quotation';
import { getNotificationsAPI, markAsReadAPI, type Notification } from '../api/notification';
import { getAnnouncementsAPI, type Announcement } from '../api/announcement';
import ChangePasswordModal from '../components/ChangePasswordModal';
import RFQModal from '../components/RFQModal';
import { exportQuotationToPDF } from '../utils/pdfExport';
import ProductionTracker from '../components/ProductionTracker';
import ProductionKanban from '../components/ProductionKanban';
import SettingsView from '../components/SettingsView';
import MessagesView from '../components/MessagesView';
import NotificationView from '../components/NotificationView';
import { getFileUrl } from '../utils/fileUrl';

interface CustomerDashboardProps {
  onLogout: () => void;
}

type Tab = 'overview' | 'my-requests' | 'quotations' | 'production' | 'announcements' | 'settings' | 'messages' | 'notifications' | 'documents';

export default function CustomerDashboard({ onLogout }: CustomerDashboardProps) {
  const logoUrl = new URL('../assets/logo.png', import.meta.url).toString();

  // User info
  const storedUser = localStorage.getItem('user');
  const user = storedUser ? JSON.parse(storedUser) : null;
  const userName = user?.name || 'Khách hàng';
  const userEmail = user?.email || '';
  const userInitials = userName
    .split(' ')
    .filter(Boolean)
    .map((w: string) => w[0])
    .slice(-2)
    .join('')
    .toUpperCase();

  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [rfqs, setRfqs] = useState<RFQ[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingRFQ, setEditingRFQ] = useState<RFQ | null>(null);
  const [viewingRFQ, setViewingRFQ] = useState<RFQ | null>(null);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);

  const [initialData, setInitialData] = useState<Partial<RFQ> | null>(null);

  // Thêm state cho feedback
  const [feedbackRating, setFeedbackRating] = useState(0);
  const [feedbackComment, setFeedbackComment] = useState('');
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);

  // Announcements
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const fetchAnnouncements = useCallback(async () => {
    try {
      const data = await getAnnouncementsAPI();
      setAnnouncements(data);
    } catch (e) { /* silent */ }
  }, []);

  const fetchRFQs = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await getRFQsAPI({ page: 1, limit: 100 });
      setRfqs(result.rfqs);
    } catch (error) {
      console.error('Lỗi tải dữ liệu:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRFQs();
    fetchAnnouncements();
  }, [fetchRFQs, fetchAnnouncements]);

  // Filtered data
  const myRequests = useMemo(() =>
    rfqs.filter(r =>
      r.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.items?.some(i => i.productType.toLowerCase().includes(searchTerm.toLowerCase()))
    ), [rfqs, searchTerm]);

  const quotationRFQs = useMemo(() =>
    rfqs.filter(r => ['quotation', 'approved', 'completed'].includes(r.status)),
    [rfqs]);

  // Quotation details from API
  const [customerQuotations, setCustomerQuotations] = useState<Quotation[]>([]);
  const fetchQuotations = useCallback(async () => {
    try {
      const data = await getQuotationsAPI();
      setCustomerQuotations(data);
    } catch (e) { /* silent */ }
  }, []);
  useEffect(() => { fetchQuotations(); }, [fetchQuotations]);

  // Notifications
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isNotiOpen, setIsNotiOpen] = useState(false);
  const notiRef = useRef<HTMLDivElement>(null);

  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement | null>(null);
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const fetchNotifications = useCallback(async () => {
    try {
      const data = await getNotificationsAPI();
      setNotifications(data.notifications);
      setUnreadCount(data.unreadCount);
    } catch (e) { /* silent */ }
  }, []);

  // Documents
  const [documents, setDocuments] = useState<AcryDocument[]>([]);
  const [isDocsLoading, setIsDocsLoading] = useState(false);
  const fetchDocuments = useCallback(async () => {
    setIsDocsLoading(true);
    try {
      const data = await getDocumentsAPI();
      setDocuments(data);
    } catch (e) {
      console.error('Lỗi tải tài liệu:', e);
    } finally {
      setIsDocsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 5000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  // Lắng nghe socket để nhận thông báo tiến độ realtime
  useEffect(() => {
    const userId = user?.id || user?._id;
    if (!userId) return;

    const socket = io(import.meta.env.VITE_SOCKET_URL || 'http://localhost:3000', { withCredentials: true });
    socket.emit('joinRoom', userId);

    socket.on('production_stage_updated', (data: { rfqCode: string; stageLabel: string; title: string; message: string }) => {
      toast(
        (t) => (
          <div onClick={() => { setActiveTab('production'); toast.dismiss(t.id); }} className="cursor-pointer">
            <p className="font-semibold text-slate-900">{data.title}</p>
            <p className="text-sm text-slate-600 mt-0.5">{data.message}</p>
            <p className="text-xs text-blue-600 mt-1 font-medium">Nhấn để xem tiến độ →</p>
          </div>
        ),
        { duration: 6000, icon: '🏭', style: { maxWidth: 360 } }
      );
      fetchNotifications();
      fetchRFQs();
    });

    socket.on('new_message_popup', (data: { rfqId: string; rfqCode: string; senderName: string; preview: string }) => {
      toast(
        (t) => (
          <div
            onClick={() => {
              setActiveChatId(data.rfqId);
              setActiveTab('messages');
              toast.dismiss(t.id);
            }}
            className="cursor-pointer"
          >
            <p className="font-semibold text-slate-900">💬 Tin nhắn mới — {data.rfqCode}</p>
            <p className="text-sm text-slate-600 mt-0.5">{data.senderName}: "{data.preview}"</p>
            <p className="text-xs text-blue-600 mt-1 font-medium">Nhấn để mở chat →</p>
          </div>
        ),
        { duration: 6000, style: { maxWidth: 380 } }
      );
      fetchNotifications();
    });

    return () => {
      socket.emit('leaveRoom', userId);
      socket.disconnect();
    };
  }, [user?.id, user?._id, fetchNotifications, fetchRFQs]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (isNotiOpen && notiRef.current && !notiRef.current.contains(e.target as Node)) {
        setIsNotiOpen(false);
      }
      if (isProfileMenuOpen && profileMenuRef.current && !profileMenuRef.current.contains(e.target as Node)) {
        setIsProfileMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [isNotiOpen, isProfileMenuOpen]);

  const handleMarkAllRead = async () => {
    await markAsReadAPI();
    setUnreadCount(0);
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  };

  const handleNotificationClick = (n: Notification) => {
    setIsNotiOpen(false);

    // Đánh dấu đã đọc cục bộ (nếu backend hỗ trợ API đọc từng cái thì gọi thêm ở đây)
    setNotifications(prev => prev.map(item => item.id === n.id ? { ...item, isRead: true } : item));

    if (n.type === 'quotation_sent') {
      setActiveTab('quotations');
    } else if (n.type === 'production_stage') {
      setActiveTab('production');
    } else if (n.type === 'new_message') {
      if (n.relatedId) {
        const targetRfq = rfqs.find(r => r.id === n.relatedId || (r as any)._id === n.relatedId);
        if (targetRfq) {
          setActiveChatId(targetRfq.id);
          setActiveTab('messages');
        }
      }
    } else if (n.type === 'announcement') {
      setActiveTab('notifications');
    }
  };

  // Stats
  const pendingCount = rfqs.filter(r => r.status === 'pending').length;
  const processingCount = rfqs.filter(r => r.status === 'engineering' || r.status === 'quotation').length;
  const completedCount = rfqs.filter(r => r.status === 'approved' || r.status === 'completed').length;

  // Handlers
  const handleSubmitRFQ = async (formData: Partial<RFQ>) => {
    try {
      if (editingRFQ) {
        await updateRFQAPI(editingRFQ.id, formData);
      } else {
        await createRFQAPI(formData);
      }
      setIsFormOpen(false);
      setEditingRFQ(null);
      setInitialData(null);
      await fetchRFQs();
      await fetchDocuments();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Có lỗi xảy ra');
    }
  };

  const handleAcceptQuotation = async (id: string) => {
    if (window.confirm('Bạn đồng ý chấp nhận báo giá này?')) {
      try {
        await acceptQuotationAPI(id);
        alert('Đã chấp nhận báo giá thành công!');
        await fetchQuotations();
        await fetchRFQs(); // cập nhật trạng thái
      } catch (error: any) {
        alert(error.response?.data?.message || 'Đã có lỗi xảy ra');
      }
    }
  };

  const handleRejectQuotation = async (id: string) => {
    if (window.confirm('Bạn muốn từ chối báo giá này?')) {
      try {
        await rejectQuotationAPI(id);
        alert('Đã từ chối báo giá!');
        await fetchQuotations();
        await fetchRFQs();
      } catch (error: any) {
        alert(error.response?.data?.message || 'Đã có lỗi xảy ra');
      }
    }
  };

  const handleSubmitFeedback = async (id: string) => {
    if (feedbackRating === 0) {
      alert('Vui lòng chọn số sao để đánh giá!');
      return;
    }
    setIsSubmittingFeedback(true);
    try {
      await submitFeedbackAPI(id, { rating: feedbackRating, comment: feedbackComment });
      setFeedbackRating(0);
      setFeedbackComment('');
      alert('Cảm ơn bạn đã đánh giá dịch vụ!');
      await fetchRFQs();
      // Update viewingRFQ locally
      const updatedRfqs = await getRFQsAPI({ page: 1, limit: 100 });
      setRfqs(updatedRfqs.rfqs);
      const updatedRfq = updatedRfqs.rfqs.find(r => r.id === id);
      if (updatedRfq) setViewingRFQ(updatedRfq);
    } catch (error: any) {
      alert(error.response?.data?.message || 'Không thể gửi đánh giá');
    } finally {
      setIsSubmittingFeedback(false);
    }
  };

  const handleDeleteRFQ = async (id: string) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa yêu cầu này?')) {
      try {
        await deleteRFQAPI(id);
        await fetchRFQs();
      } catch (error: any) {
        alert(error.response?.data?.message || 'Không thể xóa');
      }
    }
  };

  const openEdit = (rfq: RFQ) => {
    setEditingRFQ(rfq);
    setIsFormOpen(true);
  };

  const openCreate = () => {
    setEditingRFQ(null);
    setInitialData({
      customerName: userName,
      customerPhone: user?.phone || '',
      customerEmail: userEmail,
    });
    setIsFormOpen(true);
  };

  const handleReorder = async (rfq: RFQ) => {
    if (!rfq || !rfq.id) return;

    // Sử dụng setTimeout để đảm bảo sự kiện bubble hoàn tất trước khi hiện dialog
    setTimeout(async () => {
      const confirmed = confirm(`Bạn muốn đặt lại nhanh đơn hàng ${rfq.code}? Một yêu cầu mới sẽ được tạo với cùng thông tin sản phẩm.`);
      
      if (confirmed) {
        try {
          setIsLoading(true);
          const newRfq = await reorderRFQAPI(rfq.id);
          alert(`Đã tạo yêu cầu mới thành công: ${newRfq.code}`);
          await fetchRFQs();
          setActiveTab('my-requests');
        } catch (error: any) {
          console.error('Reorder error:', error);
          const msg = error.response?.data?.message || 'Không thể đặt lại đơn hàng. Vui lòng thử lại sau.';
          alert(msg);
        } finally {
          setIsLoading(false);
        }
      }
    }, 10);
  };

  const handleDuplicate = (rfq: RFQ) => {
    setEditingRFQ(null);
    setInitialData({
      items: rfq.items,
      description: rfq.description,
    });
    setIsFormOpen(true);
  };

  const totalSpending = customerQuotations
    .filter(q => (q.status as string) === 'approved' || (q.status as string) === 'completed')
    .reduce((sum, q) => sum + q.totalAmount, 0);

  const activeOrdersCount = rfqs.filter(r => ['engineering', 'quotation', 'approved'].includes(r.status)).length;

  const renderOverviewPage = () => (
    <div className="space-y-8 pb-8">
      {/* Welcome & Quick Summary */}
      <div className="flex flex-col lg:flex-row gap-6">
        <div className="flex-1 bg-gradient-to-br from-blue-600 to-indigo-800 rounded-[2.5rem] p-8 md:p-10 text-white shadow-2xl shadow-blue-500/20 relative overflow-hidden">
          <div className="relative z-10">
            <h3 className="text-blue-100 font-medium mb-1">Cài đặt & Theo dõi,</h3>
            <h2 className="text-3xl md:text-4xl font-bold mb-8">Chào {userName}! 👋</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6 max-w-2xl">
              <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-5 border border-white/10">
                <p className="text-blue-100 text-xs mb-2 uppercase tracking-widest font-bold">Tổng chi tiêu</p>
                <p className="text-2xl md:text-3xl font-extrabold">{totalSpending.toLocaleString('vi-VN')}đ</p>
                <div className="mt-2 text-[10px] text-blue-200 flex items-center gap-1">
                  <TrendingUp size={12} /> Giá trị đơn đã duyệt
                </div>
              </div>
              <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-5 border border-white/10">
                <p className="text-blue-100 text-xs mb-2 uppercase tracking-widest font-bold">Yêu cầu đang chạy</p>
                <p className="text-2xl md:text-3xl font-extrabold">{activeOrdersCount}</p>
                <div className="mt-2 text-[10px] text-blue-200 flex items-center gap-1">
                  <Activity size={12} /> Tiến độ sản xuất & báo giá
                </div>
              </div>
            </div>
          </div>
          {/* Abstract elements */}
          <div className="absolute top-[-50%] right-[-10%] w-96 h-96 bg-white/10 rounded-full blur-[100px]"></div>
          <div className="absolute bottom-[-20%] left-[-5%] w-64 h-64 bg-indigo-400/20 rounded-full blur-[80px]"></div>
        </div>

        <div className="w-full lg:w-80 grid grid-cols-2 lg:grid-cols-1 gap-4">
          <button
            onClick={openCreate}
            className="bg-white border border-slate-200 rounded-[2rem] p-6 flex flex-col items-center justify-center gap-4 hover:border-blue-500 hover:shadow-xl transition-all duration-300 group active:scale-95"
          >
            <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-all duration-500 transform group-hover:rotate-12 shadow-inner">
              <Plus size={28} />
            </div>
            <span className="font-bold text-slate-800 text-sm">Gửi yêu cầu mới</span>
          </button>
          <button
            onClick={() => setActiveTab('messages')}
            className="bg-white border border-slate-200 rounded-[2rem] p-6 flex flex-col items-center justify-center gap-4 hover:border-emerald-500 hover:shadow-xl transition-all duration-300 group active:scale-95"
          >
            <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-all duration-500 transform group-hover:-rotate-12 shadow-inner">
              <MessageSquare size={28} />
            </div>
            <span className="font-bold text-slate-800 text-sm">Liên hệ hỗ trợ</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        {/* Recent Requests */}
        <div className="bg-white border border-slate-100 rounded-[2rem] p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6 px-2">
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
                <FileSearch size={18} />
              </div>
              Yêu cầu gần đây
            </h3>
            <button onClick={() => setActiveTab('my-requests')} className="text-xs font-bold text-blue-600 hover:text-blue-800 uppercase tracking-wider">Tất cả {">"}</button>
          </div>
          <div className="space-y-3">
            {rfqs.slice(0, 4).map(rfq => (
              <div key={rfq.id} className="p-4 rounded-2xl border border-slate-50 hover:bg-slate-50 transition-colors flex items-center justify-between group cursor-pointer" onClick={() => setViewingRFQ(rfq)}>
                <div className="flex items-center gap-4 min-w-0">
                  <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-500 group-hover:bg-white group-hover:text-blue-600 transition shadow-inner">
                    <FileText size={18} />
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-slate-900 leading-tight truncate">{rfq.code}</p>
                    {rfq.items?.length ? (
                    <p className="text-[11px] text-slate-500 font-medium uppercase mt-0.5">
                      {rfq.items.length > 1 ? `${rfq.items[0].productType} (+${rfq.items.length - 1})` : rfq.items[0].productType}
                    </p>
                  ) : null}</div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`px-2.5 py-1 rounded-lg text-[10px] font-extrabold uppercase tracking-tight ${statusConfig[rfq.status]?.bg || ''} ${statusConfig[rfq.status]?.color || ''} shadow-sm border border-black/5`}>
                    {statusConfig[rfq.status]?.label || rfq.status}
                  </span>
                </div>
              </div>
            ))}
            {rfqs.length === 0 && (
              <div className="text-center py-10 border-2 border-dashed border-slate-100 rounded-3xl">
                <p className="text-sm text-slate-400">Bạn chưa có yêu cầu nào gửi đi.</p>
              </div>
            )}
          </div>
        </div>

        {/* Recent Quotations */}
        <div className="bg-white border border-slate-100 rounded-[2rem] p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6 px-2">
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
                <TrendingUp size={18} />
              </div>
              Báo giá cần duyệt
            </h3>
            <button onClick={() => setActiveTab('quotations')} className="text-xs font-bold text-emerald-600 hover:text-emerald-800 uppercase tracking-wider">Tất cả {">"}</button>
          </div>
          <div className="space-y-3">
            {customerQuotations.filter(q => q.status === 'sent').slice(0, 4).map(q => (
              <div key={q.id} className="p-4 rounded-2xl border border-slate-50 hover:bg-slate-50 transition-colors flex items-center justify-between group">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600 group-hover:bg-white transition shadow-inner">
                    <DollarSign size={18} />
                  </div>
                  <div>
                    <p className="font-bold text-slate-900 leading-tight">{q.requestId?.code || 'Báo giá'}</p>
                    <p className="text-[13px] text-emerald-600 font-extrabold">{q.totalAmount.toLocaleString('vi-VN')}đ</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-slate-400 font-bold mb-1">{new Date(q.createdAt).toLocaleDateString('vi-VN')}</p>
                  <button
                    onClick={() => setActiveTab('quotations')}
                    className="text-[10px] font-black text-white bg-blue-600 px-3 py-1 rounded-lg hover:bg-blue-700 transition"
                  >
                    XEM NGAY
                  </button>
                </div>
              </div>
            ))}
            {customerQuotations.filter(q => q.status === 'sent').length === 0 && (
              <div className="text-center py-10 border-2 border-dashed border-slate-100 rounded-3xl">
                <p className="text-sm text-slate-400">Không có báo giá mới cần xử lý.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  const renderAnnouncementsPage = () => (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-2">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">Thông báo & Tin tức</h2>
          <p className="text-slate-500 font-medium">Cập nhật những thông tin mới nhất từ bộ phận nhân sự và vận hành.</p>
        </div>
      </div>

      {announcements.length > 0 ? (
        <div className="grid grid-cols-1 gap-8">
          {announcements.map((news, idx) => (
            <div key={news._id} className={`bg-white rounded-[2.5rem] overflow-hidden border border-slate-100 shadow-sm hover:shadow-xl transition-all duration-500 group ${idx === 0 ? 'ring-2 ring-blue-500/20' : ''}`}>
              <div className="flex flex-col lg:flex-row">
                {news.imageUrl && (
                  <div className="lg:w-1/3 h-64 lg:h-auto relative overflow-hidden">
                    <img src={getFileUrl(news.imageUrl)} alt={news.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent lg:hidden"></div>
                  </div>
                )}
                <div className={`p-8 md:p-10 flex-1 ${!news.imageUrl ? 'w-full' : ''}`}>
                  <div className="flex flex-wrap items-center gap-3 mb-4">
                    <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-blue-100 text-blue-600">
                      TIN MỚI
                    </span>
                    <span className="text-slate-400 text-xs font-bold flex items-center gap-1">
                      <Clock size={14} /> {new Date(news.createdAt).toLocaleDateString('vi-VN', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </span>
                  </div>
                  <h3 className="text-2xl md:text-3xl font-black text-slate-900 mb-4 leading-tight group-hover:text-blue-600 transition-colors">
                    {news.title}
                  </h3>
                  <div className="prose prose-slate max-w-none text-slate-600 line-clamp-4 md:line-clamp-none mb-6 text-lg leading-relaxed">
                    {news.content.split('\n').map((para, i) => (
                      <p key={i} className="mb-2">{para}</p>
                    ))}
                  </div>
                  <div className="flex items-center gap-3 pt-6 border-t border-slate-50">
                    <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold">
                      {news.createdBy?.name?.charAt(0) || 'A'}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-900">{news.createdBy?.name || 'Ban điều hành'}</p>
                      <p className="text-[11px] text-slate-400 font-bold uppercase tracking-tighter">Đã đăng thông báo</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white border-2 border-dashed border-slate-200 rounded-[3rem] p-20 text-center">
          <Megaphone size={64} className="text-slate-200 mx-auto mb-6" />
          <h3 className="text-xl font-bold text-slate-400">Chưa có thông báo nào</h3>
          <p className="text-slate-400">Các tin tức quan trọng sẽ được hiển thị tại đây.</p>
        </div>
      )}
    </div>
  );

  const DocumentsView = () => (
    <div className="space-y-6 overflow-y-auto max-h-[calc(100vh-180px)] pr-2 custom-scrollbar">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-3xl font-black text-slate-900 mb-1">Kho tài liệu</h2>
          <p className="text-slate-500">Tất cả bản vẽ, hợp đồng và file đính kèm của bạn</p>
        </div>
        <button 
          onClick={fetchDocuments}
          className="p-3 bg-white border border-slate-200 rounded-2xl hover:bg-slate-50 transition shadow-sm"
          title="Làm mới"
        >
          <Repeat size={20} className={isDocsLoading ? 'animate-spin' : ''} />
        </button>
      </div>

      {isDocsLoading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 size={48} className="text-blue-600 animate-spin mb-4" />
          <p className="text-slate-500 font-medium">Đang tổng hợp tài liệu...</p>
        </div>
      ) : documents.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-10">
          {documents.map((doc) => (
            <div key={doc.id} className="bg-white border border-slate-200 rounded-[2.5rem] p-6 hover:shadow-xl hover:border-blue-400 transition-all group flex flex-col h-full">
              <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-blue-50 transition-colors">
                <FileText size={32} className="text-slate-400 group-hover:text-blue-500" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-slate-900 mb-2 line-clamp-2 leading-tight h-10">
                  {doc.name}
                </h3>
                <div className="flex items-center gap-2 mb-4">
                  <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase tracking-wider ${
                    doc.type === 'request' ? 'bg-purple-100 text-purple-600' : 'bg-orange-100 text-orange-600'
                  }`}>
                    {doc.type === 'request' ? 'Từ Yêu cầu' : 'Từ Tin nhắn'}
                  </span>
                  <span className="text-[11px] text-slate-400 font-bold uppercase">
                    Mã: {doc.rfqCode}
                  </span>
                </div>
                <div className="text-xs text-slate-500 flex items-center gap-1.5 font-medium">
                  <Clock size={12} /> {new Date(doc.createdAt).toLocaleDateString('vi-VN')}
                </div>
              </div>
              <div className="mt-6 pt-6 border-t border-slate-50 flex gap-2">
                <a 
                  href={getFileUrl(doc.url)} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex-1 py-2.5 bg-slate-900 hover:bg-blue-600 text-white rounded-xl font-bold transition text-xs flex items-center justify-center gap-2"
                >
                  <Eye size={14} /> Xem / Tải về
                </a>
                <button 
                  onClick={() => {
                    const target = rfqs.find(r => r.id === doc.rfqId);
                    if (target) {
                      setViewingRFQ(target);
                      setActiveTab('my-requests');
                    }
                  }}
                  className="w-10 h-10 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-xl transition flex items-center justify-center"
                  title="Đi tới đơn hàng"
                >
                  <Activity size={18} />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white border-2 border-dashed border-slate-200 rounded-[3rem] p-20 text-center">
          <FileSearch size={64} className="text-slate-200 mx-auto mb-6" />
          <h3 className="text-xl font-bold text-slate-400">Chưa có tài liệu nào</h3>
          <p className="text-slate-400">Tất cả file đính kèm bạn gửi hoặc nhận sẽ hiển thị tại đây.</p>
        </div>
      )}
    </div>
  );

  return (
    <div className="flex h-screen bg-slate-50 text-slate-800 overflow-hidden relative">

      {/* Mobile Backdrop */}
      {isMobileSidebarOpen && (
        <div
          className="md:hidden fixed inset-0 bg-slate-900/50 z-40 transition-opacity"
          onClick={() => setIsMobileSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed md:static inset-y-0 left-0 z-50 w-72 bg-white border-r border-slate-200 flex flex-col shrink-0
        transform transition-transform duration-300 ease-in-out md:translate-x-0
        ${isMobileSidebarOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'}
      `}>
        {/* Logo */}
        <div className="p-6 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-center overflow-hidden">
              <img src={logoUrl} alt="Logo" className="w-10 h-10 object-contain" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">OPEP</h1>
              <p className="text-xs text-slate-500 -mt-1">Khách hàng</p>
            </div>
          </div>
        </div>

        {/* Menu */}
        <nav className="flex-1 p-4">
          <ul className="space-y-1">
            <li>
              <button
                onClick={() => {
                  setActiveTab('overview');
                  setIsMobileSidebarOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-5 py-3.5 rounded-2xl transition-all ${activeTab === 'overview'
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'hover:bg-slate-50 text-slate-600'
                  }`}
              >
                <Home size={20} />
                <span className="font-medium">Tổng quan</span>
              </button>
            </li>
            <li>
              <button
                onClick={() => {
                  setActiveTab('my-requests');
                  setIsMobileSidebarOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-5 py-3.5 rounded-2xl transition-all ${activeTab === 'my-requests'
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'hover:bg-slate-50 text-slate-600'
                  }`}
              >
                <FileText size={20} />
                <span className="font-medium">Yêu cầu của tôi</span>
                {pendingCount > 0 && (
                  <span className="ml-auto px-2 py-0.5 bg-amber-100 text-amber-600 rounded-full text-xs font-medium">
                    {pendingCount}
                  </span>
                )}
              </button>
            </li>
            <li>
              <button
                onClick={() => {
                  setActiveTab('announcements');
                  setIsMobileSidebarOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-5 py-3.5 rounded-2xl transition-all ${activeTab === 'announcements'
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'hover:bg-slate-50 text-slate-600'
                  }`}
              >
                <Megaphone size={20} />
                <span className="font-medium">Tin tức chung</span>
                {announcements.length > 0 && (
                  <span className="ml-auto px-2 py-0.5 bg-red-100 text-red-600 rounded-full text-[10px] font-black uppercase tracking-tighter">
                    NEW
                  </span>
                )}
              </button>
            </li>
            <li>
              <button
                onClick={() => {
                  setActiveTab('notifications');
                  setIsMobileSidebarOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-5 py-3.5 rounded-2xl transition-all ${activeTab === 'notifications'
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'hover:bg-slate-50 text-slate-600'
                  }`}
              >
                <Bell size={20} />
                <span className="font-medium">Thông báo</span>
              </button>
            </li>
            <li>
              <button
                onClick={() => {
                  setActiveTab('documents');
                  fetchDocuments();
                  setIsMobileSidebarOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-5 py-3.5 rounded-2xl transition-all ${activeTab === 'documents'
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'hover:bg-slate-50 text-slate-600'
                  }`}
              >
                <Paperclip size={20} />
                <span className="font-medium">Kho tài liệu</span>
              </button>
            </li>
            <li>
              <button
                onClick={() => {
                  setActiveTab('quotations');
                  setIsMobileSidebarOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-5 py-3.5 rounded-2xl transition-all ${activeTab === 'quotations'
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'hover:bg-slate-50 text-slate-600'
                  }`}
              >
                <CheckCircle size={20} />
                <span className="font-medium">Báo giá nhận được</span>
                {quotationRFQs.length > 0 && (
                  <span className="ml-auto px-2 py-0.5 bg-emerald-100 text-emerald-600 rounded-full text-xs font-medium">
                    {quotationRFQs.length}
                  </span>
                )}
              </button>
            </li>
            <li>
              <button
                onClick={() => {
                  setActiveTab('production');
                  setIsMobileSidebarOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-5 py-3.5 rounded-2xl transition-all ${activeTab === 'production'
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'hover:bg-slate-50 text-slate-600'
                  }`}
              >
                <Activity size={20} />
                <span className="font-medium">Tiến độ đơn hàng</span>
              </button>
            </li>
            <li>
              <button
                onClick={() => {
                  setActiveTab('messages');
                  setIsMobileSidebarOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-5 py-3.5 rounded-2xl transition-all ${activeTab === 'messages'
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'hover:bg-slate-50 text-slate-600'
                  }`}
              >
                <MessageSquare size={20} />
                <span className="font-medium">Tin nhắn</span>
              </button>
            </li>
            <li>
              <button
                onClick={() => {
                  setActiveTab('settings');
                  setIsMobileSidebarOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-5 py-3.5 rounded-2xl transition-all ${activeTab === 'settings'
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'hover:bg-slate-50 text-slate-600'
                  }`}
              >
                <Settings size={20} />
                <span className="font-medium">Cài đặt & Hồ sơ</span>
              </button>
            </li>
          </ul>
        </nav>

        {/* User info */}
        <div className="p-4 border-t border-slate-200">
          <div className="flex items-center gap-3 px-4 py-3 bg-slate-50 rounded-2xl shadow-sm border border-slate-100">
            <div className="w-10 h-10 bg-slate-200 rounded-xl flex items-center justify-center overflow-hidden border border-white shadow-inner">
              {user?.avatar ? (
                <img src={getFileUrl(user.avatar)} alt={userName} className="w-full h-full object-cover" />
              ) : (
                <User size={20} className="text-slate-500" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-slate-900 truncate">{userName}</p>
              <p className="text-xs text-slate-500">Khách hàng</p>
            </div>
            <button onClick={onLogout} className="p-2 hover:bg-slate-100 rounded-xl transition">
              <LogOut size={20} />
            </button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="h-16 bg-white border-b border-slate-200 px-4 md:px-8 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <button
              className="md:hidden p-2 text-slate-600 hover:bg-slate-50 rounded-xl"
              onClick={() => setIsMobileSidebarOpen(true)}
            >
              <Menu size={20} />
            </button>
            <h2 className="text-xl font-semibold text-slate-900 truncate">
              {activeTab === 'overview' ? 'Tổng quan Dashboard' : 
               activeTab === 'my-requests' ? 'Yêu cầu báo giá' : 
               activeTab === 'quotations' ? 'Báo giá nhận được' : 
               activeTab === 'production' ? 'Tiến độ đơn hàng' : 
               activeTab === 'messages' ? 'Trao đổi' : 
               activeTab === 'notifications' ? 'Thông báo' : 
               activeTab === 'documents' ? 'Kho tài liệu' :
               'Cài đặt'}
            </h2>
          </div>
          <div className="flex items-center gap-2 md:gap-4">
            {/* Notification bell */}
            <div className="relative" ref={notiRef}>
              <button onClick={() => setIsNotiOpen(p => !p)} className="relative p-2 hover:bg-slate-50 rounded-xl transition">
                <Bell size={20} />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-[10px] rounded-full flex items-center justify-center">
                    {unreadCount}
                  </span>
                )}
              </button>
              {isNotiOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white border border-slate-200 rounded-2xl shadow-lg z-50 overflow-hidden">
                  <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between">
                    <span className="text-sm font-semibold text-slate-900">Thông báo</span>
                    <button onClick={handleMarkAllRead} disabled={unreadCount === 0} className="text-xs px-2 py-1 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-800 disabled:opacity-50">
                      Đã đọc tất cả
                    </button>
                  </div>
                  <div className="max-h-72 overflow-auto">
                    {notifications.length === 0 ? (
                      <p className="px-4 py-6 text-sm text-slate-500">Không có thông báo mới.</p>
                    ) : (
                      notifications.map(n => (
                        <div
                          key={n.id}
                          className={`px-4 py-3 border-b border-slate-300 hover:bg-slate-50 transition cursor-pointer ${n.isRead ? 'opacity-60' : ''}`}
                          onClick={() => handleNotificationClick(n)}
                        >
                          <div className="flex justify-between items-start mb-1">
                            <p className="text-xs text-blue-600 font-medium">{n.title}</p>
                            {!n.isRead && <div className="w-2 h-2 rounded-full bg-blue-500"></div>}
                          </div>
                          <p className="text-sm text-slate-900 mt-1">{n.message}</p>
                          <p className="text-xs text-slate-500 mt-1">{new Date(n.createdAt).toLocaleString('vi-VN')}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
            {/* Avatar người dùng */}
            <div className="relative" ref={profileMenuRef}>
              <button
                onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                className="flex items-center gap-3 p-1 hover:bg-slate-50 rounded-2xl transition"
              >
                <div className="text-right hidden sm:block">
                  <p className="text-sm font-medium text-slate-900">{userName}</p>
                  <p className="text-xs text-slate-500">{userEmail}</p>
                </div>
                <div className="w-9 h-9 bg-emerald-600 rounded-2xl flex items-center justify-center text-white font-semibold overflow-hidden border border-white/20 shadow-sm">
                  {user?.avatar ? (
                    <img src={getFileUrl(user.avatar)} alt={userName} className="w-full h-full object-cover" />
                  ) : (
                    userInitials
                  )}
                </div>
              </button>

              {isProfileMenuOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 overflow-hidden py-2">
                  <button
                    onClick={() => {
                      setIsProfileMenuOpen(false);
                      setActiveTab('settings');
                    }}
                    className="w-full text-left px-4 py-2.5 hover:bg-slate-50 transition flex items-center gap-3 text-slate-600 hover:text-slate-900 border-b border-slate-50"
                  >
                    <User size={16} />
                    <span className="text-sm font-medium">Hồ sơ cá nhân</span>
                  </button>
                  <button
                    onClick={() => {
                      setIsProfileMenuOpen(false);
                      setIsChangePasswordOpen(true);
                    }}
                    className="w-full text-left px-4 py-2.5 hover:bg-slate-50 transition flex items-center gap-3 text-slate-600 hover:text-slate-900"
                  >
                    <Lock size={16} />
                    <span className="text-sm">Đổi mật khẩu</span>
                  </button>
                  <button
                    onClick={() => {
                      setIsProfileMenuOpen(false);
                      onLogout();
                    }}
                    className="w-full text-left px-4 py-2.5 hover:bg-slate-50 transition flex items-center gap-3 text-red-600 hover:bg-red-500/10"
                  >
                    <LogOut size={16} />
                    <span className="text-sm">Đăng xuất</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Content area */}
        <main className="flex-1 overflow-auto p-4 md:p-8 bg-slate-50 relative">
          {activeTab === 'overview' && renderOverviewPage()}
          {activeTab === 'notifications' && (
            <div className="h-full">
              <NotificationView userRole={user?.role} />
            </div>
          )}

          {activeTab === 'documents' && (
            <div className="h-full">
              <DocumentsView />
            </div>
          )}

          {activeTab === 'messages' && (
            <div className="h-full">
              <MessagesView 
                rfqs={rfqs} 
                defaultSelectedId={activeChatId} 
                onMessageSent={fetchDocuments}
              />
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="flex-1 max-w-full">
              <SettingsView
                user={user}
                onUserUpdate={(updated) => {
                  localStorage.setItem('user', JSON.stringify(updated));
                  window.location.reload();
                }}
                openChangePassword={() => setIsChangePasswordOpen(true)}
              />
            </div>
          )}

          {activeTab === 'production' && (
            <div className="h-full">
              <ProductionKanban
                rfqs={rfqs}
                onUpdateStage={() => { }}
                readOnly={true}
                onOpenChat={(rfqId) => {
                  setActiveTab('messages');
                  setActiveChatId(rfqId);
                }}
                onOpenDetail={(rfq) => {
                  setViewingRFQ(rfq);
                }}
              />
            </div>
          )}

          {activeTab === 'my-requests' && (
            <div>
              {/* Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-6">
                <div className="bg-white border border-slate-200 rounded-2xl p-5 flex items-center gap-4">
                  <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
                    <Clock size={24} className="text-amber-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-slate-900">{pendingCount}</p>
                    <p className="text-xs text-slate-500">Đang chờ xử lý</p>
                  </div>
                </div>
                <div className="bg-white border border-slate-200 rounded-2xl p-5 flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center">
                    <AlertCircle size={24} className="text-blue-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-slate-900">{processingCount}</p>
                    <p className="text-xs text-slate-500">Đang xử lý</p>
                  </div>
                </div>
                <div className="bg-white border border-slate-200 rounded-2xl p-5 flex items-center gap-4">
                  <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
                    <CheckCircle size={24} className="text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-slate-900">{completedCount}</p>
                    <p className="text-xs text-slate-500">Đã hoàn thành</p>
                  </div>
                </div>
              </div>

              {/* Actions bar */}
              <div className="flex flex-col md:flex-row gap-4 mb-6">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500" size={18} />
                  <input
                    type="text"
                    placeholder="Tìm kiếm yêu cầu..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <button
                  onClick={openCreate}
                  className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition font-medium"
                >
                  <Plus size={20} />
                  Tạo yêu cầu mới
                </button>
              </div>

              {/* Requests list */}
              <div className="space-y-3">
                {isLoading ? (
                  <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-slate-500">
                    <Loader2 size={24} className="animate-spin mx-auto mb-2" />
                    Đang tải dữ liệu...
                  </div>
                ) : myRequests.length > 0 ? (
                  myRequests.map(rfq => (
                    <div
                      key={rfq.id}
                      className="bg-white border border-slate-200 rounded-2xl p-5 hover:border-slate-300 transition cursor-pointer"
                      onClick={() => setViewingRFQ(rfq)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <span className="text-slate-900 font-semibold">{rfq.code}</span>
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusConfig[rfq.status]?.bg || ''} ${statusConfig[rfq.status]?.color || ''}`}>
                              {statusConfig[rfq.status]?.label || rfq.status}
                            </span>

                          </div>
                          <p className="text-slate-900 font-bold">
                            {rfq.items && rfq.items.length > 0 ? (
                              rfq.items.length > 1 
                                ? `${rfq.items[0].productType} (+${rfq.items.length - 1} khác)` 
                                : rfq.items[0].productType
                            ) : 'N/A'}
                          </p>
                          {rfq.description && (
                            <p className="text-sm text-slate-500 mt-1 line-clamp-1 italic">"{rfq.description}"</p>
                          )}
                          <div className="flex items-center gap-4 mt-2 text-xs text-slate-500 font-bold uppercase tracking-tighter">
                            <span>TỔNG SL: {rfq.items?.reduce((sum, item) => sum + item.quantity, 0) || 0}</span>
                            <span>{new Date(rfq.createdAt).toLocaleDateString('vi-VN')}</span>
                          </div>
                        </div>
                        <div className="flex gap-1 ml-4" onClick={e => e.stopPropagation()}>
                          <button 
                            onClick={() => setViewingRFQ(rfq)} 
                            className="w-9 h-9 flex items-center justify-center hover:bg-slate-50 rounded-lg transition" 
                            title="Xem"
                          >
                            <Eye size={18} className="text-blue-600" />
                          </button>
                          {rfq.status === 'pending' && (
                            <div className="flex items-center gap-1">
                              <button 
                                onClick={() => openEdit(rfq)} 
                                className="w-9 h-9 flex items-center justify-center hover:bg-slate-50 rounded-lg transition" 
                                title="Sửa"
                              >
                                <Edit size={18} className="text-amber-600" />
                              </button>
                              <button 
                                onClick={() => handleDeleteRFQ(rfq.id)} 
                                className="w-9 h-9 flex items-center justify-center hover:bg-slate-50 rounded-lg transition" 
                                title="Xóa"
                              >
                                <Trash2 size={18} className="text-red-600" />
                              </button>
                            </div>
                          )}
                          {['completed', 'approved', 'rejected'].includes(rfq.status) && (
                            <div className="flex items-center gap-1">
                              <button 
                                onClick={() => handleReorder(rfq)} 
                                className="w-9 h-9 flex items-center justify-center hover:bg-slate-50 rounded-lg transition text-emerald-600" 
                                title="Đặt lại nhanh (Reorder)"
                              >
                                <Repeat size={18} />
                              </button>
                              <button 
                                onClick={() => handleDuplicate(rfq)} 
                                className="w-9 h-9 flex items-center justify-center hover:bg-slate-50 rounded-lg transition text-slate-600" 
                                title="Sao chép & Chỉnh sửa"
                              >
                                <Plus size={18} />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center">
                    <FileText size={48} className="text-slate-600 mx-auto mb-4" />
                    <p className="text-slate-500 mb-2">Chưa có yêu cầu nào</p>
                    <p className="text-sm text-slate-500">Nhấn "Tạo yêu cầu mới" để gửi yêu cầu báo giá đầu tiên</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'quotations' && (
            <div>
              {customerQuotations.length > 0 ? (
                <div className="space-y-4">
                  {customerQuotations.map(q => (
                    <div key={q.id} className="bg-white border border-slate-200 rounded-2xl p-5 hover:border-slate-300 transition">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <DollarSign size={20} className="text-emerald-600" />
                          <span className="text-slate-900 font-semibold">{q.requestId?.code || 'Báo giá'}</span>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${q.status === 'approved' ? 'bg-blue-100 text-blue-600' :
                              q.status === 'rejected' ? 'bg-red-100 text-red-600' :
                                'bg-emerald-100 text-emerald-600'
                            }`}>
                            {q.status === 'approved' ? 'Đã chấp nhận' :
                              q.status === 'rejected' ? 'Đã từ chối' : 'Đã nhận báo giá'}
                          </span>
                        </div>
                        <span className="text-xs text-slate-500">{new Date(q.createdAt).toLocaleDateString('vi-VN')}</span>
                      </div>

                      {/* Items table */}
                      <div className="bg-slate-50 rounded-xl overflow-hidden mb-3">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b border-slate-200">
                              <th className="px-4 py-2 text-left text-slate-500">Hạng mục</th>
                              <th className="px-4 py-2 text-right text-slate-500">SL</th>
                              <th className="px-4 py-2 text-right text-slate-500">Đơn giá</th>
                              <th className="px-4 py-2 text-right text-slate-500">Thành tiền</th>
                            </tr>
                          </thead>
                          <tbody>
                            {q.items.map((item, i) => (
                              <tr key={i} className="border-b border-slate-200/50">
                                <td className="px-4 py-2 text-slate-900">{item.productName}</td>
                                <td className="px-4 py-2 text-right text-slate-600">{item.quantity}</td>
                                <td className="px-4 py-2 text-right text-slate-600">{item.unitPrice.toLocaleString('vi-VN')}đ</td>
                                <td className="px-4 py-2 text-right text-slate-900 font-medium">{item.totalPrice.toLocaleString('vi-VN')}đ</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      {/* Totals */}
                      <div className="bg-slate-50 rounded-xl p-4 space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-500">Tạm tính</span>
                          <span className="text-slate-900">{q.subTotal.toLocaleString('vi-VN')}đ</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-500">VAT ({q.tax}%)</span>
                          <span className="text-slate-900">{(q.subTotal * q.tax / 100).toLocaleString('vi-VN')}đ</span>
                        </div>
                        {q.discount > 0 && (
                          <div className="flex justify-between text-sm">
                            <span className="text-slate-500">Giảm giá</span>
                            <span className="text-red-600">-{q.discount.toLocaleString('vi-VN')}đ</span>
                          </div>
                        )}
                        <div className="border-t border-slate-200 pt-2 flex justify-between">
                          <span className="text-slate-900 font-semibold">Tổng cộng</span>
                          <span className="text-xl font-bold text-emerald-600">{q.totalAmount.toLocaleString('vi-VN')}đ</span>
                        </div>
                      </div>

                      {q.notes && (
                        <div className="mt-3 bg-blue-500/5 border border-blue-500/20 rounded-xl p-3">
                          <p className="text-xs text-blue-600 font-semibold mb-1">💬 Ghi chú từ nhân viên</p>
                          <p className="text-sm text-blue-300">{q.notes}</p>
                        </div>
                      )}

                      {/* Action buttons */}
                      {q.status === 'sent' && (
                        <div className="mt-4 flex gap-3 justify-end items-center border-t border-slate-200 pt-4">
                          <button
                            onClick={() => handleRejectQuotation(q.id)}
                            className="px-5 py-2.5 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 font-medium transition"
                          >
                            Từ chối báo giá
                          </button>
                          <button
                            onClick={() => handleAcceptQuotation(q.id)}
                            className="px-5 py-2.5 rounded-xl bg-blue-600 text-white hover:bg-blue-700 font-medium transition"
                          >
                            Chấp nhận báo giá
                          </button>
                        </div>
                      )}

                      {/* Download PDF button when approved */}
                      {q.status === 'approved' && (
                        <div className="mt-4 flex justify-end items-center border-t border-slate-200 pt-4">
                          <button
                            onClick={() => exportQuotationToPDF(q)}
                            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 font-medium transition"
                          >
                            <FileText size={18} />
                            Tải Hợp Đồng/Báo Giá (PDF)
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center">
                  <CheckCircle size={48} className="text-slate-600 mx-auto mb-4" />
                  <p className="text-slate-500 mb-2">Chưa có báo giá nào</p>
                  <p className="text-sm text-slate-500">Báo giá sẽ hiển thị khi nhân viên xử lý yêu cầu của bạn</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'announcements' && renderAnnouncementsPage()}
        </main>
      </div>

      <RFQModal
        isOpen={isFormOpen}
        onClose={() => { setIsFormOpen(false); setEditingRFQ(null); setInitialData(null); }}
        onSubmit={handleSubmitRFQ}
        rfq={editingRFQ}
        initialData={initialData}
      />

      {/* View RFQ Detail Modal */}
      {viewingRFQ && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[85vh] overflow-y-auto border border-slate-200">
            <div className="sticky top-0 bg-white border-b border-slate-200 p-6 flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold text-slate-900">{viewingRFQ.code}</h2>
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusConfig[viewingRFQ.status]?.bg || ''} ${statusConfig[viewingRFQ.status]?.color || ''}`}>
                  {statusConfig[viewingRFQ.status]?.label || viewingRFQ.status}
                </span>
              </div>
              <button onClick={() => setViewingRFQ(null)} className="p-2 hover:bg-slate-50 rounded-xl transition text-slate-500 hover:text-slate-900">
                <X size={24} />
              </button>
            </div>

            <div className="p-6 space-y-5">
              {['approved', 'completed'].includes(viewingRFQ.status) && (
                <div className="bg-slate-50 border border-slate-200 rounded-2xl mb-6">
                  <div className="px-4 py-3 border-b border-slate-200">
                    <h3 className="font-semibold text-slate-800">Tiến độ sản xuất</h3>
                  </div>
                  <ProductionTracker currentStage={viewingRFQ.productionStage} />
                </div>
              )}
              
              <div className="flex gap-4 mb-4 border-b border-slate-100 pb-4">
                {viewingRFQ.items?.map((item, idx) => (
                  <div key={idx} className="flex-1 bg-white border border-slate-200 rounded-xl p-4">
                    <p className="text-xs text-slate-500 uppercase tracking-widest font-black mb-1">Món {idx + 1}</p>
                    <p className="text-slate-900 font-medium">{item.productType}</p>
                    <div className="flex gap-2 text-sm text-slate-500 mt-1">
                      <span className="font-bold">SL: {item.quantity}</span>
                      {item.dimensions && <span>| KT: {item.dimensions}</span>}
                      {item.material && <span>| VL: {item.material}</span>}
                    </div>
                    {item.description && <p className="text-sm mt-2 italic line-clamp-2">"{item.description}"</p>}
                  </div>
                ))}
              </div>

              {viewingRFQ.description && (
                <div className="mb-4">
                  <p className="text-xs text-slate-500 uppercase tracking-widest font-black mb-1">Ghi chú chung</p>
                  <p className="text-slate-700 bg-slate-50 p-4 rounded-2xl">{viewingRFQ.description}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                {viewingRFQ.expectedDate && (
                  <div>
                    <p className="text-xs text-slate-500 mb-1">Ngày cần giao</p>
                    <p className="text-slate-900">{new Date(viewingRFQ.expectedDate).toLocaleDateString('vi-VN')}</p>
                  </div>
                )}
                <div>
                  <p className="text-xs text-slate-500 mb-1">Ngày tạo yêu cầu</p>
                  <p className="text-slate-900 font-medium">
                    {new Date(viewingRFQ.createdAt).toLocaleDateString('vi-VN')} lúc {new Date(viewingRFQ.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>

              {/* Bản vẽ / Tài liệu đính kèm */}
              {viewingRFQ.attachments && viewingRFQ.attachments.length > 0 && (
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-widest font-black mb-2 flex items-center gap-2">
                    <Paperclip size={14} /> Bản vẽ / Tài liệu ({viewingRFQ.attachments.length})
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {viewingRFQ.attachments.map((url, idx) => {
                      const fullUrl = getFileUrl(url);
                      const fileName = decodeURIComponent(url.split('/').pop() || `File ${idx + 1}`);
                      const isImage = /\.(jpg|jpeg|png|gif|webp|bmp|svg)$/i.test(url);
                      return (
                        <a
                          key={idx}
                          href={fullUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="group block bg-slate-50 border border-slate-200 rounded-2xl overflow-hidden hover:border-blue-400 hover:shadow-md transition-all p-3"
                        >
                          <div className="flex items-center gap-3">
                            {isImage ? (
                              <div className="w-10 h-10 rounded-lg bg-slate-200 overflow-hidden shrink-0">
                                <img src={fullUrl} alt={fileName} className="w-full h-full object-cover" />
                              </div>
                            ) : (
                              <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                                <FileText size={20} className="text-slate-400" />
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="text-xs text-slate-900 font-bold truncate" title={fileName}>{fileName}</p>
                              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-tighter">Click để xem</p>
                            </div>
                            <Download size={14} className="text-slate-400 group-hover:text-blue-600 shrink-0" />
                          </div>
                        </a>
                      );
                    })}
                  </div>
                </div>
              )}

              {viewingRFQ.description && (
                <div>
                  <p className="text-xs text-slate-500 mb-1">Mô tả</p>
                  <p className="text-slate-600 bg-slate-50 rounded-xl p-3 text-sm">{viewingRFQ.description}</p>
                </div>
              )}

              {viewingRFQ.engineerNotes && (
                <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-4">
                  <p className="text-xs text-emerald-600 mb-1 font-semibold">💬 Phản hồi từ nhân viên</p>
                  <p className="text-emerald-300 text-sm">{viewingRFQ.engineerNotes}</p>
                </div>
              )}

              {viewingRFQ.salesNotes && (
                <div>
                  <p className="text-xs text-slate-500 mb-1">Ghi chú của bạn</p>
                  <p className="text-slate-600 bg-slate-50 rounded-xl p-3 text-sm">{viewingRFQ.salesNotes}</p>
                </div>
              )}

              {/* Feedback Section */}
              {(viewingRFQ.status === 'completed' || viewingRFQ.status === 'approved') && (
                <div className="mt-6 pt-6 border-t border-slate-200">
                  <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
                    <Star className="text-amber-400 fill-amber-400" size={20} />
                    Đánh giá dịch vụ
                  </h3>

                  {viewingRFQ.feedback ? (
                    <div className="bg-amber-50 border border-amber-100 rounded-2xl p-5">
                      <div className="flex gap-1 mb-3">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            size={20}
                            className={star <= viewingRFQ.feedback!.rating ? 'text-amber-400 fill-amber-400' : 'text-amber-200 fill-amber-200'}
                          />
                        ))}
                      </div>
                      {viewingRFQ.feedback.comment && (
                        <p className="text-sm text-slate-700 italic bg-white/50 p-3 rounded-xl border border-amber-500/10">"{viewingRFQ.feedback.comment}"</p>
                      )}
                      <p className="text-xs text-slate-400 mt-3 text-right">
                        Đã gửi lúc {new Date(viewingRFQ.feedback.createdAt).toLocaleString('vi-VN')}
                      </p>
                    </div>
                  ) : (
                    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
                      <p className="text-sm text-slate-600 mb-4">Cảm ơn bạn đã tin tưởng dịch vụ. Vui lòng để lại đánh giá để chúng tôi phục vụ tốt hơn!</p>
                      <div className="flex gap-2 mb-4 justify-center">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            onClick={() => setFeedbackRating(star)}
                            className={`p-2 rounded-full transition-all duration-300 transform hover:scale-110 ${feedbackRating >= star ? 'text-amber-400' : 'text-slate-300 hover:text-amber-300'}`}
                          >
                            <Star size={32} className={feedbackRating >= star ? 'fill-amber-400' : ''} />
                          </button>
                        ))}
                      </div>
                      <textarea
                        value={feedbackComment}
                        onChange={(e) => setFeedbackComment(e.target.value)}
                        placeholder="Nhận xét của bạn (không bắt buộc)..."
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-shadow resize-none mb-4"
                        rows={3}
                      />
                      <button
                        onClick={() => handleSubmitFeedback(viewingRFQ.id)}
                        disabled={isSubmittingFeedback || feedbackRating === 0}
                        className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-medium transition disabled:bg-slate-300 disabled:cursor-not-allowed"
                      >
                        {isSubmittingFeedback ? 'Đang gửi...' : 'Gửi Đánh Giá'}
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Re-order Button in Detail Modal */}
              {['completed', 'approved', 'rejected'].includes(viewingRFQ.status) && (
                <div className="flex gap-3 mt-4">
                  <button
                    onClick={() => handleReorder(viewingRFQ)}
                    className="flex-1 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold transition flex items-center justify-center gap-2 text-sm shadow-sm"
                  >
                    <Repeat size={20} /> Đặt lại nhanh
                  </button>
                  <button
                    onClick={() => handleDuplicate(viewingRFQ)}
                    className="flex-1 py-3.5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl font-bold transition flex items-center justify-center gap-2 text-sm shadow-sm"
                  >
                    <Plus size={20} /> Sao chép & Sửa
                  </button>
                </div>
              )}

              {/* Chat Integration Transition Button */}
              <div className="mt-6 pt-6 border-t border-slate-200">
                <div className="bg-blue-50 border border-blue-100 rounded-2xl p-6 flex flex-col items-center justify-center text-center">
                  <MessageSquare size={32} className="text-blue-500 mb-3" />
                  <h3 className="font-semibold text-slate-900 mb-1">Trao đổi trực tiếp</h3>
                  <p className="text-sm text-slate-600 mb-4">Các tin nhắn và trao đổi cho đơn hàng này đã được chuyển sang giao diện toàn màn hình.</p>
                  <button
                    onClick={() => {
                      setViewingRFQ(null);
                      setActiveChatId(viewingRFQ.id);
                      setActiveTab('messages');
                    }}
                    className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition shadow-sm"
                  >
                    Mở tab Tin nhắn
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Đổi mật khẩu */}
      <ChangePasswordModal
        isOpen={isChangePasswordOpen}
        onClose={() => setIsChangePasswordOpen(false)}
      />
    </div>
  );
}
