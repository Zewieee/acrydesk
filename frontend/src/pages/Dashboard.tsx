// src/pages/Dashboard.tsx
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import toast from 'react-hot-toast';
import {
  Home,
  FileText,
  Users,
  Settings,
  LogOut,
  Bell,
  User,
  Plus,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  ChevronsUpDown,
  ChevronUp,
  ChevronDown,
  Download,
  Calendar,
  Eye,
  Edit,
  Trash2,
  Loader2,
  Send,
  DollarSign,
  X,
  Lock,
  RefreshCw,
  Activity,
  Menu,
  ShieldCheck,
  Megaphone,
  Box,
  TrendingUp,
  PieChart as PieChartIcon,
  BarChart3,
  MessageSquare,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
} from 'recharts';
import RFQModal from '../components/RFQModal';
import RFQDetail from '../components/RFQDetail';
import ChangePasswordModal from '../components/ChangePasswordModal';
import SettingsView from '../components/SettingsView';
import GlobalSearch from '../components/GlobalSearch';
import RevenueReport from '../components/RevenueReport';
import ProductionKanban from '../components/ProductionKanban';
import MessagesView from '../components/MessagesView';
import NotificationView from '../components/NotificationView';
import UsersManagementView from '../components/UsersManagementView';
import AnnouncementsManagementView from '../components/AnnouncementsManagementView';
import { type RFQ, statusConfig } from '../types/rfq';
import { getRFQsAPI, createRFQAPI, updateRFQAPI, deleteRFQAPI, updateProductionStageAPI } from '../api/rfq';
import { type Quotation, getQuotationsAPI, createQuotationAPI, sendQuotationAPI, deleteQuotationAPI } from '../api/quotation';
import { getNotificationsAPI, markAsReadAPI, type Notification } from '../api/notification';
import { getFileUrl } from '../utils/fileUrl';

interface DashboardProps {
  onLogout: () => void;
}

export default function Dashboard({ onLogout }: DashboardProps) {
  const logoUrl = new URL('../assets/logo.png', import.meta.url).toString();

  // Đọc thông tin người dùng từ localStorage
  const storedUser = localStorage.getItem('user');
  const user = storedUser ? JSON.parse(storedUser) : null;
  const userName = user?.name || 'Người dùng';
  const userEmail = user?.email || '';
  const userInitials = userName
    .split(' ')
    .filter(Boolean)
    .map((w: string) => w[0])
    .slice(-2)
    .join('')
    .toUpperCase();

  const [activeMenu, setActiveMenu] = useState('requests');
  const [rfqs, setRfqs] = useState<RFQ[]>([]);
  const [totalRFQs, setTotalRFQs] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRFQ, setSelectedRFQ] = useState<RFQ | null>(null);
  const [activeChatRfqId, setActiveChatRfqId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [sortKey, setSortKey] = useState<'code' | 'customerName' | 'status' | 'createdAt' | 'expectedDate'>('createdAt');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const notificationDropdownRef = useRef<HTMLDivElement | null>(null);

  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement | null>(null);
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    ...(user?.role === 'manager' ? [{ id: 'users', label: 'Tài khoản', icon: ShieldCheck }] : []),
    { id: 'requests', label: 'Yêu cầu báo giá', icon: FileText },
    { id: 'notifications', label: 'Thông báo', icon: Bell },
    { id: 'customers', label: 'Khách hàng', icon: Users },
    { id: 'quotations', label: 'Báo giá', icon: FileText },
    { id: 'production', label: 'Tiến độ', icon: Activity },
    { id: 'reports', label: 'Báo cáo', icon: BarChart3 },
    { id: 'messages', label: 'Tin nhắn', icon: MessageSquare },
    { id: 'announcements', label: 'Thông báo chung', icon: Megaphone },
    { id: 'settings', label: 'Cài đặt', icon: Settings },
  ];

  // Fetch RFQs từ API
  const fetchRFQs = useCallback(async () => {
    setIsLoading(true);
    setApiError(null);
    try {
      const result = await getRFQsAPI({ page: 1, limit: 100 });
      setRfqs(result.rfqs);
      setTotalRFQs(result.total);
    } catch (error: any) {
      console.error('Lỗi khi tải danh sách RFQ:', error);
      setApiError(error.response?.data?.message || 'Không thể tải dữ liệu');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Gọi API khi component mount
  useEffect(() => {
    fetchRFQs();
  }, [fetchRFQs]);

  useEffect(() => {
    if (!isNotificationsOpen) return;

    const handleMouseDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (notificationDropdownRef.current && !notificationDropdownRef.current.contains(target)) {
        setIsNotificationsOpen(false);
      }
      if (profileMenuRef.current && !profileMenuRef.current.contains(target)) {
        setIsProfileMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleMouseDown);
    return () => document.removeEventListener('mousedown', handleMouseDown);
  }, [isNotificationsOpen, isProfileMenuOpen]);

  // Lọc danh sách RFQ
  const filteredRFQs = rfqs.filter(rfq => {
    const matchesSearch =
      rfq.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rfq.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rfq.items?.some(i => i.productType.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = statusFilter === 'all' || rfq.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Sort
  const handleSort = (key: typeof sortKey) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('asc'); }
    setCurrentPage(1);
  };

  const SortIcon = ({ col }: { col: typeof sortKey }) => {
    if (sortKey !== col) return <ChevronsUpDown size={14} className="text-slate-400" />;
    return sortDir === 'asc' ? <ChevronUp size={14} className="text-blue-600" /> : <ChevronDown size={14} className="text-blue-600" />;
  };

  const sortedRFQs = useMemo(() => [...filteredRFQs].sort((a, b) => {
    let aVal = '', bVal = '';
    if (sortKey === 'code')         { aVal = a.code;         bVal = b.code; }
    else if (sortKey === 'customerName') { aVal = a.customerName; bVal = b.customerName; }
    else if (sortKey === 'status')  { aVal = a.status;       bVal = b.status; }
    else if (sortKey === 'createdAt')   { aVal = a.createdAt;    bVal = b.createdAt; }
    else if (sortKey === 'expectedDate'){ aVal = a.expectedDate ?? ''; bVal = b.expectedDate ?? ''; }
    const cmp = aVal.localeCompare(bVal);
    return sortDir === 'asc' ? cmp : -cmp;
  }), [filteredRFQs, sortKey, sortDir]);

  // Deadline helper
  const getDeadlineInfo = (date?: string) => {
    if (!date) return null;
    const diff = new Date(date).getTime() - Date.now();
    const days = Math.ceil(diff / 86_400_000);
    if (days < 0)  return { label: `Trễ ${-days}d`, cls: 'bg-red-100 text-red-700 font-bold' };
    if (days === 0) return { label: 'Hôm nay!',      cls: 'bg-red-100 text-red-700 font-bold animate-pulse' };
    if (days <= 3)  return { label: `Còn ${days}d`,  cls: 'bg-amber-100 text-amber-700 font-bold' };
    return { label: new Date(date).toLocaleDateString('vi-VN'), cls: 'bg-slate-100 text-slate-600' };
  };

  // Export CSV
  const exportToCSV = () => {
    const headers = ['Mã RFQ','Khách hàng','SĐT','Email','Sản phẩm','Tổng SL','Trạng thái','Ngày tạo','Deadline'];
    const rows = sortedRFQs.map(r => [
      r.code, r.customerName, r.customerPhone, r.customerEmail,
      r.items?.map(i => i.productType).join('; ') || '',
      r.items?.reduce((s, i) => s + i.quantity, 0) || 0,
      statusConfig[r.status]?.label || r.status,
      new Date(r.createdAt).toLocaleDateString('vi-VN'),
      r.expectedDate ? new Date(r.expectedDate).toLocaleDateString('vi-VN') : '',
    ]);
    const csv = [headers, ...rows]
      .map(row => row.map(c => `"${String(c).replace(/"/g, '""')}"`).join(','))
      .join('\n');
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `RFQ_${new Date().toLocaleDateString('vi-VN').replace(/\//g, '-')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Phân trang (dùng sortedRFQs)
  const totalPages = Math.ceil(sortedRFQs.length / itemsPerPage);
  const paginatedRFQs = sortedRFQs.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleCreateRFQ = async (data: Partial<RFQ>) => {
    try {
      await createRFQAPI(data);
      await fetchRFQs(); // Refresh danh sách
    } catch (error: any) {
      console.error('Lỗi khi tạo RFQ:', error);
      alert(error.response?.data?.message || 'Tạo yêu cầu thất bại');
    }
  };

  const handleUpdateRFQ = async (data: Partial<RFQ>) => {
    if (selectedRFQ) {
      try {
        await updateRFQAPI(selectedRFQ.id, data);
        await fetchRFQs(); // Refresh danh sách
        setSelectedRFQ(null);
      } catch (error: any) {
        console.error('Lỗi khi cập nhật RFQ:', error);
        alert(error.response?.data?.message || 'Cập nhật thất bại');
      }
    }
  };

  const handleUpdateRFQFromDetail = async (updatedRFQ: RFQ) => {
    try {
      const updated = await updateRFQAPI(updatedRFQ.id, updatedRFQ);
      await fetchRFQs(); // Refresh danh sách
      setSelectedRFQ(updated);
    } catch (error: any) {
      console.error('Lỗi khi cập nhật RFQ:', error);
      alert(error.response?.data?.message || 'Cập nhật thất bại');
    }
  };

  const handleUpdateRFQStateOnly = async (updatedRFQ: RFQ) => {
    try {
      await updateRFQAPI(updatedRFQ.id, updatedRFQ);
      await fetchRFQs(); // Refresh danh sách
      // Do NOT set selectedRFQ here to avoid popping up the modal
    } catch (error: any) {
      console.error('Lỗi khi cập nhật trạng thái RFQ:', error);
      alert(error.response?.data?.message || 'Cập nhật thất bại');
    }
  };

  const handleDeleteRFQ = async (id: string) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa yêu cầu này?')) {
      try {
        await deleteRFQAPI(id);
        await fetchRFQs(); // Refresh danh sách
      } catch (error: any) {
        console.error('Lỗi khi xóa RFQ:', error);
        alert(error.response?.data?.message || 'Xóa thất bại');
      }
    }
  };

  // Process data for charts
  const chartData = useMemo(() => {
    // 1. Monthly Trend
    const monthlyMap = new Map();
    rfqs.forEach(rfq => {
      const date = new Date(rfq.createdAt);
      const month = date.toLocaleDateString('vi-VN', { month: 'short', year: '2-digit' });
      monthlyMap.set(month, (monthlyMap.get(month) || 0) + 1);
    });
    const monthlyTrend = Array.from(monthlyMap.entries()).map(([month, count]) => ({ month, count })).reverse();

    // 2. Status Distribution
    const statusData = Object.entries(statusConfig).map(([key, config]) => ({
      name: config.label,
      value: rfqs.filter(r => r.status === key).length,
      color: key === 'pending' ? '#f59e0b' : key === 'engineering' ? '#3b82f6' : key === 'approved' ? '#6366f1' : key === 'completed' ? '#10b981' : '#ef4444'
    })).filter(s => s.value > 0);

    // 3. Product Distribution
    const productMap = new Map();
    rfqs.forEach(rfq => {
      rfq.items?.forEach(item => {
        productMap.set(item.productType, (productMap.get(item.productType) || 0) + item.quantity);
      });
    });
    const productData = Array.from(productMap.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);

    return { monthlyTrend, statusData, productData };
  }, [rfqs]);

  // Render trang Dashboard
  const renderDashboardPage = () => (
    <div>
      <h1 className="text-3xl font-bold mb-8">Xin chào, {userName} 👋</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        <div className="bg-white border border-slate-200 rounded-3xl p-6 relative group">
          <p className="text-slate-500 text-sm">Tổng yêu cầu</p>
          <p className="text-4xl font-bold text-slate-900 mt-2">
            {totalRFQs}
          </p>
          <button 
            onClick={() => setActiveMenu('requests')}
            className="text-emerald-600 text-sm mt-4 hover:underline cursor-pointer font-medium block outline-none"
          >
            Tất cả yêu cầu báo giá
          </button>
        </div>
        <div 
          className="bg-white border border-slate-200 rounded-3xl p-6 cursor-pointer hover:border-amber-200 transition-colors"
          onClick={() => {
            setActiveMenu('requests');
            setStatusFilter('pending');
          }}
        >
          <p className="text-slate-500 text-sm">Báo giá đang chờ</p>
          <p className="text-4xl font-bold text-amber-600 mt-2">
            {rfqs.filter(rfq => rfq.status === 'pending' || rfq.status === 'engineering').length}
          </p>
          <p className="text-amber-500 text-xs mt-4 font-medium italic">Xem chi tiết cần xử lý →</p>
        </div>
        <div 
          className="bg-white border border-slate-200 rounded-3xl p-6 cursor-pointer hover:border-blue-200 transition-colors"
          onClick={() => {
            setActiveMenu('requests');
            setStatusFilter('approved');
          }}
        >
          <p className="text-slate-500 text-sm">Báo giá đã duyệt</p>
          <p className="text-4xl font-bold text-blue-600 mt-2">
            {rfqs.filter(rfq => rfq.status === 'approved').length}
          </p>
          <p className="text-blue-500 text-xs mt-4 font-medium italic">Xem danh sách đã duyệt →</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-3xl p-6">
          <p className="text-slate-500 text-sm">Tỷ lệ chuyển đổi</p>
          <p className="text-4xl font-bold text-emerald-600 mt-2">
            {rfqs.length > 0 ? Math.round((rfqs.filter(rfq => rfq.status === 'completed').length / rfqs.length) * 100) : 0}%
          </p>
        </div>
      </div>

      {/* Visual Analytics Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
        {/* Monthly Trend Chart */}
        <div className="bg-white border border-slate-200 rounded-[2rem] p-8 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-xl font-bold text-slate-900">Xu hướng RFQ</h3>
              <p className="text-slate-500 text-xs mt-1">Số lượng yêu cầu theo thời gian</p>
            </div>
            <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
              <TrendingUp size={20} />
            </div>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData.monthlyTrend}>
                <defs>
                  <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="month" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 700}}
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 700}}
                />
                <Tooltip 
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontWeight: 700 }}
                />
                <Area type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorCount)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Status Composition & Product Mix */}
        <div className="bg-white border border-slate-200 rounded-[2rem] p-8 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-xl font-bold text-slate-900">Cơ cấu Trạng thái</h3>
              <p className="text-slate-500 text-xs mt-1">Phân bổ giai đoạn xử lý</p>
            </div>
            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl">
              <PieChartIcon size={20} />
            </div>
          </div>
          <div className="flex flex-col md:flex-row items-center gap-8">
            <div className="h-[250px] w-full md:w-1/2">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData.statusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={8}
                    dataKey="value"
                  >
                    {chartData.statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                     contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontSize: '12px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="w-full md:w-1/2 space-y-4">
              {chartData.statusData.map((item, i) => (
                <div key={i} className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className="w-2.5 h-2.5 rounded-full" style={{backgroundColor: item.color}} />
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">{item.name}</span>
                  </div>
                  <span className="text-sm font-black text-slate-900">{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-3xl p-8">
        <h3 className="text-xl font-semibold mb-6">Yêu cầu báo giá gần đây</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-slate-200">
              <tr className="text-left text-slate-500 text-sm">
                <th className="pb-3">Mã RFQ</th>
                <th className="pb-3">Khách hàng</th>
                <th className="pb-3">Sản phẩm</th>
                <th className="pb-3">Trạng thái</th>
                <th className="pb-3">Ngày tạo</th>
              </tr>
            </thead>
            <tbody>
              {rfqs.slice(0, 5).map((rfq) => (
                <tr key={rfq.id} className="border-b border-slate-300">
                  <td className="py-3 text-slate-900">{rfq.code}</td>
                  <td className="py-3 text-slate-600">{rfq.customerName}</td>
                  <td className="py-3 text-slate-600">
                    {rfq.items?.length ? rfq.items.map(i => i.productType).join(', ') : '—'}
                  </td>
                  <td className="py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusConfig[rfq.status].bg} ${statusConfig[rfq.status].color}`}>
                      {statusConfig[rfq.status].label}
                    </span>
                  </td>
                  <td className="py-3 text-slate-600 text-sm">
                    {new Date(rfq.createdAt).toLocaleDateString('vi-VN')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  // Render trang quản lý yêu cầu báo giá
  const renderRFQPage = () => (
    <div>
      {/* Header với nút thêm mới */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Quản lý Yêu cầu Báo giá</h1>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchRFQs}
            disabled={isLoading}
            className="flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl transition disabled:opacity-50"
          >
            <RefreshCw size={20} className={isLoading ? "animate-spin" : ""} />
            Làm mới
          </button>
          <button
            onClick={exportToCSV}
            className="flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl transition"
            title="Xuất danh sách ra file CSV (mở được bằng Excel)"
          >
            <Download size={18} />
            Xuất Excel
          </button>
          <button
            onClick={() => {
              setSelectedRFQ(null);
              setIsModalOpen(true);
            }}
            className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition"
          >
            <Plus size={20} />
            Tạo yêu cầu mới
          </button>
        </div>
      </div>

      {/* Bộ lọc tìm kiếm */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500" size={18} />
            <input
              type="text"
              placeholder="Tìm kiếm theo tên khách hàng, mã yêu cầu, loại sản phẩm..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500"
            />
          </div>
          <div className="flex gap-2">
            <Filter size={20} className="text-slate-500 self-center" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-blue-500"
            >
              <option value="all">Tất cả trạng thái</option>
              {Object.entries(statusConfig).map(([key, { label }]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Bảng danh sách RFQ */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                {([
                  { key: 'code',         label: 'Mã RFQ' },
                  { key: 'customerName', label: 'Khách hàng' },
                  { key: null,           label: 'Sản phẩm' },
                  { key: null,           label: 'Số lượng' },
                  { key: 'status',       label: 'Trạng thái' },
                  { key: 'createdAt',    label: 'Ngày tạo' },
                  { key: 'expectedDate', label: 'Deadline' },
                  { key: null,           label: 'Thao tác' },
                ] as { key: typeof sortKey | null; label: string }[]).map(col => (
                  <th
                    key={col.label}
                    onClick={() => col.key && handleSort(col.key)}
                    className={`px-6 py-4 text-left text-sm font-semibold text-slate-600 ${col.key ? 'cursor-pointer hover:text-blue-600 select-none' : ''}`}
                  >
                    <div className="flex items-center gap-1">
                      {col.label}
                      {col.key && <SortIcon col={col.key} />}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-slate-500">
                    <div className="flex items-center justify-center gap-2">
                      <Loader2 size={20} className="animate-spin" />
                      Đang tải dữ liệu...
                    </div>
                  </td>
                </tr>
              ) : apiError ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-red-600">
                    {apiError}
                    <button onClick={fetchRFQs} className="ml-2 text-blue-600 hover:underline">Thử lại</button>
                  </td>
                </tr>
              ) : paginatedRFQs.length > 0 ? (
                paginatedRFQs.map((rfq) => (
                  <tr key={rfq.id} className="border-b border-slate-300 hover:bg-slate-50/50 transition">
                    <td className="px-6 py-4 text-slate-900 font-medium">{rfq.code}</td>
                    <td className="px-6 py-4 text-slate-600">{rfq.customerName}</td>
                    <td className="px-6 py-4 text-slate-600">
                      {rfq.items && rfq.items.length > 0 ? (
                        rfq.items.map(item => item.productType).join(', ')
                      ) : 'N/A'}
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      {rfq.items?.reduce((sum, item) => sum + item.quantity, 0) || 0}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusConfig[rfq.status].bg} ${statusConfig[rfq.status].color}`}>
                        {statusConfig[rfq.status].label}
                      </span>
                    </td>

                    <td className="px-6 py-4 text-slate-600 text-sm">
                      {new Date(rfq.createdAt).toLocaleDateString('vi-VN')}
                    </td>
                    <td className="px-6 py-4">
                      {(() => {
                        const dl = getDeadlineInfo(rfq.expectedDate);
                        if (!dl) return <span className="text-slate-300 text-xs">—</span>;
                        return (
                          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs ${dl.cls}`}>
                            <Calendar size={11} />{dl.label}
                          </span>
                        );
                      })()}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setSelectedRFQ(rfq);
                          }}
                          className="p-1.5 hover:bg-slate-100 rounded-lg transition"
                          title="Xem chi tiết"
                        >
                          <Eye size={18} className="text-blue-600" />
                        </button>
                        <button
                          onClick={() => {
                            setSelectedRFQ(rfq);
                            setIsModalOpen(true);
                          }}
                          className="p-1.5 hover:bg-slate-100 rounded-lg transition"
                          title="Chỉnh sửa"
                        >
                          <Edit size={18} className="text-amber-600" />
                        </button>
                        <button
                          onClick={() => handleDeleteRFQ(rfq.id)}
                          className="p-1.5 hover:bg-slate-100 rounded-lg transition"
                          title="Xóa"
                        >
                          <Trash2 size={18} className="text-red-600" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-slate-500">
                    Chưa có yêu cầu báo giá nào. Nhấn "Tạo yêu cầu mới" để bắt đầu!
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Phân trang */}
        {totalPages > 1 && (
          <div className="flex justify-between items-center p-4 border-t border-slate-200">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-2 hover:bg-slate-50 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft size={20} />
            </button>
            <span className="text-slate-500">
              Trang {currentPage} / {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-2 hover:bg-slate-50 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        )}
      </div>
    </div>
  );

  // Aggregate customers from RFQs
  const customers = useMemo(() => {
    const map = new Map<string, {
      name: string;
      phone: string;
      email: string;
      rfqCount: number;
      totalQuantity: number;
      lastRequestDate: string;
      rfqs: RFQ[];
    }>();

    rfqs.forEach(rfq => {
      const key = rfq.customerEmail || rfq.customerName;
      const existing = map.get(key);
      if (existing) {
        existing.rfqCount += 1;
        existing.totalQuantity += rfq.items?.reduce((sum, item) => sum + item.quantity, 0) || 0;
        if (rfq.createdAt > existing.lastRequestDate) {
          existing.lastRequestDate = rfq.createdAt;
        }
        existing.rfqs.push(rfq);
      } else {
        map.set(key, {
          name: rfq.customerName,
          phone: rfq.customerPhone,
          email: rfq.customerEmail,
          rfqCount: 1,
          totalQuantity: rfq.items?.reduce((sum, item) => sum + item.quantity, 0) || 0,
          lastRequestDate: rfq.createdAt,
          rfqs: [rfq],
        });
      }
    });

    return Array.from(map.values()).sort((a, b) =>
      new Date(b.lastRequestDate).getTime() - new Date(a.lastRequestDate).getTime()
    );
  }, [rfqs]);

  const [customerSearch, setCustomerSearch] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<typeof customers[0] | null>(null);

  const filteredCustomers = customers.filter(c =>
    c.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
    c.email.toLowerCase().includes(customerSearch.toLowerCase()) ||
    c.phone.includes(customerSearch)
  );

  // Render trang khách hàng
  const renderCustomersPage = () => (
    <div>
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Quản lý Khách hàng</h1>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-6">
        <div className="bg-white border border-slate-200 rounded-2xl p-5">
          <p className="text-slate-500 text-sm">Tổng khách hàng</p>
          <p className="text-3xl font-bold text-slate-900 mt-1">{customers.length}</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl p-5">
          <p className="text-slate-500 text-sm">Khách hàng mới (30 ngày)</p>
          <p className="text-3xl font-bold text-emerald-600 mt-1">
            {customers.filter(c => {
              const diff = Date.now() - new Date(c.lastRequestDate).getTime();
              return diff < 30 * 24 * 60 * 60 * 1000;
            }).length}
          </p>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl p-5">
          <p className="text-slate-500 text-sm">Tổng yêu cầu</p>
          <p className="text-3xl font-bold text-blue-600 mt-1">{rfqs.length}</p>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500" size={18} />
          <input
            type="text"
            placeholder="Tìm kiếm khách hàng theo tên, email, số điện thoại..."
            value={customerSearch}
            onChange={(e) => setCustomerSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500"
          />
        </div>
      </div>

      {/* Customers table */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-600">Khách hàng</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-600">Số điện thoại</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-600">Email</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-600">Số yêu cầu</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-600">Tổng SL</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-600">Yêu cầu gần nhất</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-600">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                    <div className="flex items-center justify-center gap-2">
                      <Loader2 size={20} className="animate-spin" />
                      Đang tải dữ liệu...
                    </div>
                  </td>
                </tr>
              ) : filteredCustomers.length > 0 ? (
                filteredCustomers.map((customer, idx) => {
                  const initials = customer.name
                    .split(' ')
                    .filter(Boolean)
                    .map(w => w[0])
                    .slice(-2)
                    .join('')
                    .toUpperCase();
                  const colors = ['bg-blue-600', 'bg-emerald-600', 'bg-purple-600', 'bg-amber-600', 'bg-rose-600', 'bg-cyan-600'];
                  const color = colors[idx % colors.length];

                  return (
                    <tr key={idx} className="border-b border-slate-300 hover:bg-slate-50/50 transition">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 ${color} rounded-xl flex items-center justify-center text-slate-900 text-sm font-semibold shrink-0`}>
                            {initials}
                          </div>
                          <span className="text-slate-900 font-medium">{customer.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-slate-600">{customer.phone || '—'}</td>
                      <td className="px-6 py-4 text-slate-600">{customer.email || '—'}</td>
                      <td className="px-6 py-4">
                        <span className="px-2.5 py-1 bg-blue-100 text-blue-600 rounded-full text-xs font-medium">
                          {customer.rfqCount} yêu cầu
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-600">{customer.totalQuantity}</td>
                      <td className="px-6 py-4 text-slate-600 text-sm">
                        {new Date(customer.lastRequestDate).toLocaleDateString('vi-VN')}
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => setSelectedCustomer(customer)}
                          className="p-1.5 hover:bg-slate-100 rounded-lg transition"
                          title="Xem lịch sử"
                        >
                          <Eye size={18} className="text-blue-600" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                    {customerSearch ? 'Không tìm thấy khách hàng phù hợp' : 'Chưa có khách hàng nào. Tạo yêu cầu báo giá để thêm khách hàng.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Customer Detail Modal */}
      {selectedCustomer && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-3xl max-h-[85vh] overflow-y-auto border border-slate-200">
            {/* Header */}
            <div className="sticky top-0 bg-white border-b border-slate-200 p-6 flex justify-between items-center">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white text-lg font-bold">
                  {selectedCustomer.name.split(' ').filter(Boolean).map(w => w[0]).slice(-2).join('').toUpperCase()}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900">{selectedCustomer.name}</h2>
                  <p className="text-slate-500 text-sm">{selectedCustomer.email} · {selectedCustomer.phone}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedCustomer(null)}
                className="p-2 hover:bg-slate-50 rounded-xl transition text-slate-500 hover:text-slate-900"
              >✕</button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 p-6">
              <div className="bg-slate-50 rounded-xl p-4 text-center">
                <p className="text-2xl font-bold text-slate-900">{selectedCustomer.rfqCount}</p>
                <p className="text-xs text-slate-500 mt-1">Yêu cầu</p>
              </div>
              <div className="bg-slate-50 rounded-xl p-4 text-center">
                <p className="text-2xl font-bold text-emerald-600">{selectedCustomer.totalQuantity}</p>
                <p className="text-xs text-slate-500 mt-1">Tổng số lượng</p>
              </div>
              <div className="bg-slate-50 rounded-xl p-4 text-center">
                <p className="text-2xl font-bold text-blue-600">
                  {selectedCustomer.rfqs.filter(r => r.status === 'completed' || r.status === 'approved').length}
                </p>
                <p className="text-xs text-slate-500 mt-1">Đã duyệt/Hoàn thành</p>
              </div>
            </div>

            {/* RFQ History */}
            <div className="px-6 pb-6">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Lịch sử yêu cầu báo giá</h3>
              <div className="space-y-3">
                {selectedCustomer.rfqs.map(rfq => (
                  <div key={rfq.id} className="bg-slate-50 rounded-xl p-4 flex items-center justify-between hover:bg-slate-750 transition">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1">
                        <span className="text-slate-900 font-medium">{rfq.code}</span>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusConfig[rfq.status].bg} ${statusConfig[rfq.status].color}`}>
                          {statusConfig[rfq.status].label}
                        </span>

                      </div>
                      <p className="text-sm text-slate-500 font-medium">{rfq.items?.length ? rfq.items.map(i => i.productType).join(', ') : 'N/A'}</p>
                      <p className="text-xs text-slate-400 mt-0.5">SL: {rfq.items?.reduce((sum, item) => sum + item.quantity, 0) || 0}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-slate-600">{new Date(rfq.createdAt).toLocaleDateString('vi-VN')}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  // === QUOTATION MANAGEMENT ===
  const [staffQuotations, setStaffQuotations] = useState<Quotation[]>([]);
  const [isQuotationFormOpen, setIsQuotationFormOpen] = useState(false);
  const [quotationTargetRFQ, setQuotationTargetRFQ] = useState<RFQ | null>(null);
  const [quotationItems, setQuotationItems] = useState<{ productName: string; quantity: number; unitPrice: number }[]>(
    [{ productName: '', quantity: 1, unitPrice: 0 }]
  );
  const [quotationTax, setQuotationTax] = useState(8);
  const [quotationDiscount, setQuotationDiscount] = useState(0);
  const [quotationNotes, setQuotationNotes] = useState('');
  const [quotationSearch, setQuotationSearch] = useState('');

  const fetchQuotations = useCallback(async () => {
    try {
      const data = await getQuotationsAPI();
      setStaffQuotations(data);
    } catch (e) { console.error(e); }
  }, []);

  useEffect(() => { fetchQuotations(); }, [fetchQuotations]);

  // === NOTIFICATIONS (API-based) ===
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchNotifications = useCallback(async () => {
    try {
      const data = await getNotificationsAPI();
      setNotifications(data.notifications);
      setUnreadCount(data.unreadCount);
    } catch (e) { /* silent */ }
  }, []);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 5000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  // Socket: nhận popup realtime cho staff
  useEffect(() => {
    const userId = user?.id || user?._id;
    if (!userId) return;

    const socket = io(import.meta.env.VITE_SOCKET_URL || 'http://localhost:3000', { withCredentials: true });
    socket.emit('joinRoom', userId);

    socket.on('new_message_popup', (data: { rfqId: string; rfqCode: string; senderName: string; preview: string }) => {
      toast(
        (t) => (
          <div
            onClick={() => {
              setActiveChatRfqId(data.rfqId);
              setActiveMenu('messages');
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

    socket.on('new_rfq_popup', (data: { rfqId: string; rfqCode: string; customerName: string }) => {
      toast(
        (t) => (
          <div
            onClick={() => {
              setActiveMenu('requests');
              fetchRFQs();
              toast.dismiss(t.id);
            }}
            className="cursor-pointer"
          >
            <p className="font-semibold text-slate-900">📋 Yêu cầu báo giá mới!</p>
            <p className="text-sm text-slate-600 mt-0.5">{data.customerName} — {data.rfqCode}</p>
            <p className="text-xs text-blue-600 mt-1 font-medium">Nhấn để xem →</p>
          </div>
        ),
        { duration: 7000, icon: '🆕', style: { maxWidth: 380 } }
      );
      fetchNotifications();
      fetchRFQs();
    });

    return () => {
      socket.emit('leaveRoom', userId);
      socket.disconnect();
    };
  }, [user?.id, user?._id]);

  const handleNotificationClick = (n: Notification) => {
    setIsNotificationsOpen(false);
    setNotifications(prev => prev.map(item => item.id === n.id ? { ...item, isRead: true } : item));

    if (n.type === 'new_rfq' || n.type === 'new_message') {
      setActiveMenu('requests');
      if (n.relatedId) {
        const targetRfq = rfqs.find(r => r.id === n.relatedId || (r as any)._id === n.relatedId);
        if (targetRfq) {
          setIsModalOpen(false);
          setSelectedRFQ(targetRfq);
        }
      }
    } else if (n.type === 'status_change' || n.type === 'status_changed' || n.type === 'quotation_approved') {
      setActiveMenu('quotations');
    } else if (n.type === 'announcement') {
      setActiveMenu('notifications');
    }
  };

  const handleMarkAllRead = async () => {
    await markAsReadAPI();
    setUnreadCount(0);
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  };

  // Quotation calculations
  const qSubTotal = quotationItems.reduce((s, i) => s + i.quantity * i.unitPrice, 0);
  const qTaxAmount = qSubTotal * (quotationTax / 100);
  const qTotal = qSubTotal + qTaxAmount - quotationDiscount;

  // RFQs that need quotation
  const rfqsNeedingQuotation = rfqs.filter(r => r.status === 'pending' || r.status === 'engineering');

  const openQuotationForm = (rfq: RFQ) => {
    setQuotationTargetRFQ(rfq);
    setQuotationItems(
      rfq && rfq.items && rfq.items.length > 0
        ? rfq.items.map(item => {
            const compiledName = `${item.productType || ''}${item.dimensions ? ` (${item.dimensions})` : ''}${item.material ? ` [${item.material}]` : ''}`.trim();
            return { 
              productName: compiledName || 'Chưa có tên sản phẩm', 
              quantity: item.quantity || 1, 
              unitPrice: 0 
            };
          })
        : [{ productName: 'Sản phẩm cũ (Không có tên)', quantity: 1, unitPrice: 0 }]
    );
    setQuotationTax(Number(localStorage.getItem('defaultTax') || 8));
    setQuotationDiscount(0);
    setQuotationNotes(localStorage.getItem('defaultTerms') || '');
    setIsQuotationFormOpen(true);
  };

  const handleCreateAndSendQuotation = async () => {
    if (!quotationTargetRFQ) return;
    try {
      const q = await createQuotationAPI({
        requestId: quotationTargetRFQ.id,
        items: quotationItems,
        tax: quotationTax,
        discount: quotationDiscount,
        notes: quotationNotes,
      });
      await sendQuotationAPI(q.id);
      setIsQuotationFormOpen(false);
      setQuotationTargetRFQ(null);
      await fetchRFQs();
      await fetchQuotations();
      alert('Báo giá đã được gửi cho khách hàng!');
    } catch (error: any) {
      alert(error.response?.data?.message || 'Có lỗi xảy ra');
    }
  };

  const handleDeleteQuotation = async (id: string) => {
    if (window.confirm('Xóa báo giá này?')) {
      await deleteQuotationAPI(id);
      await fetchQuotations();
    }
  };

  // Render trang báo giá
  const renderQuotationsPage = () => (
    <div>
      {/* Header & Search Bar */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <h1 className="text-2xl font-bold text-slate-900">Quản lý Báo giá</h1>
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text"
            placeholder="Tìm khách hàng, mã RFQ..."
            value={quotationSearch}
            onChange={(e) => setQuotationSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-500 shadow-sm transition-all"
          />
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-5 mb-6">
        <div className="bg-white border border-slate-200 rounded-2xl p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
              <FileText size={20} className="text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{rfqsNeedingQuotation.length}</p>
              <p className="text-xs text-slate-500">Chờ báo giá</p>
            </div>
          </div>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-500/10 rounded-xl flex items-center justify-center">
              <DollarSign size={20} className="text-purple-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-purple-400">{staffQuotations.length}</p>
              <p className="text-xs text-slate-500">Đã tạo báo giá</p>
            </div>
          </div>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
              <Send size={20} className="text-emerald-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-emerald-600">{staffQuotations.filter(q => q.status === 'sent').length}</p>
              <p className="text-xs text-slate-500">Đã gửi KH</p>
            </div>
          </div>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
              <DollarSign size={20} className="text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-blue-600">
                {staffQuotations.reduce((s, q) => s + q.totalAmount, 0).toLocaleString('vi-VN')}đ
              </p>
              <p className="text-xs text-slate-500">Tổng giá trị</p>
            </div>
          </div>
        </div>
      </div>

      {/* RFQs needing quotation */}
      {rfqsNeedingQuotation.filter(r => 
        r.customerName.toLowerCase().includes(quotationSearch.toLowerCase()) || 
        r.code.toLowerCase().includes(quotationSearch.toLowerCase())
      ).length > 0 && (
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-3">📋 Yêu cầu cần báo giá</h2>
          <div className="space-y-3">
            {rfqsNeedingQuotation
              .filter(r => 
                r.customerName.toLowerCase().includes(quotationSearch.toLowerCase()) || 
                r.code.toLowerCase().includes(quotationSearch.toLowerCase())
              )
              .map(rfq => (
              <div key={rfq.id} className="bg-white border border-slate-200 rounded-2xl p-5 flex items-center justify-between hover:border-slate-300 transition">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    <span className="text-slate-900 font-semibold">{rfq.code}</span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusConfig[rfq.status].bg} ${statusConfig[rfq.status].color}`}>
                      {statusConfig[rfq.status].label}
                    </span>

                  </div>
                  <p className="text-slate-600 text-sm">
                    {rfq.customerName} — {rfq.items && rfq.items.length > 0 ? (
                      rfq.items.length > 1 
                        ? `${rfq.items[0].productType} (+${rfq.items.length - 1} khác)` 
                        : rfq.items[0].productType
                    ) : 'N/A'} · TỔNG SL: {rfq.items?.reduce((sum, item) => sum + item.quantity, 0) || 0}
                  </p>
                </div>
                <button
                  onClick={() => openQuotationForm(rfq)}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition text-sm font-medium"
                >
                  <DollarSign size={16} />
                  Tạo báo giá
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Sent quotations list */}
      <h2 className="text-lg font-semibold text-slate-900 mb-3">📄 Báo giá đã tạo</h2>
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-600">Mã RFQ</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-600">Khách hàng</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-600">Sản phẩm</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-600">Tổng giá</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-600">Trạng thái</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-600">Ngày tạo</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-600">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {staffQuotations.filter(q => 
                (q.requestId?.customerName || '').toLowerCase().includes(quotationSearch.toLowerCase()) || 
                (q.requestId?.code || '').toLowerCase().includes(quotationSearch.toLowerCase())
              ).length > 0 ? (
                staffQuotations
                  .filter(q => 
                    (q.requestId?.customerName || '').toLowerCase().includes(quotationSearch.toLowerCase()) || 
                    (q.requestId?.code || '').toLowerCase().includes(quotationSearch.toLowerCase())
                  )
                  .map(q => (
                  <tr key={q.id} className="border-b border-slate-300 hover:bg-slate-50/50 transition">
                    <td className="px-6 py-4 text-slate-900 font-medium">{q.requestId?.code || '—'}</td>
                    <td className="px-6 py-4 text-slate-600">{q.requestId?.customerName || '—'}</td>
                    <td className="px-6 py-4 text-slate-600">
                      {q.requestId?.items && q.requestId.items.length > 0 ? (
                        q.requestId.items.map(i => i.productType).join(', ')
                      ) : q.requestId?.productType || '—'}
                    </td>
                    <td className="px-6 py-4 text-emerald-600 font-semibold">{q.totalAmount.toLocaleString('vi-VN')}đ</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${q.status === 'sent' ? 'bg-emerald-100 text-emerald-600' :
                          q.status === 'draft' ? 'bg-amber-100 text-amber-600' :
                            'bg-slate-400/10 text-slate-500'
                        }`}>
                        {q.status === 'sent' ? 'Đã gửi' : q.status === 'draft' ? 'Nháp' : q.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-600 text-sm">{new Date(q.createdAt).toLocaleDateString('vi-VN')}</td>
                    <td className="px-6 py-4">
                      <button onClick={() => handleDeleteQuotation(q.id)} className="p-1.5 hover:bg-slate-100 rounded-lg transition" title="Xóa">
                        <Trash2 size={16} className="text-red-600" />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                    Chưa có báo giá nào. Chọn "Tạo báo giá" trên yêu cầu phía trên.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quotation Form Modal */}
      {isQuotationFormOpen && quotationTargetRFQ && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-3xl max-h-[90vh] overflow-y-auto border border-slate-200">
            <div className="sticky top-0 bg-white border-b border-slate-200 p-6 flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold text-slate-900">Tạo Báo giá</h2>
                <p className="text-sm text-slate-500 mt-1">
                  {quotationTargetRFQ.code} — {quotationTargetRFQ.customerName}
                </p>
              </div>
              <button onClick={() => setIsQuotationFormOpen(false)} className="p-2 hover:bg-slate-50 rounded-xl transition">
                <X size={24} />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* RFQ Info */}
              <div className="bg-slate-50 rounded-xl p-4">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-sm font-semibold text-slate-600">Yêu cầu gốc</h3>
                  <div className="text-right">
                    <p className="text-sm font-bold text-slate-900">{quotationTargetRFQ.customerName}</p>
                    <p className="text-xs text-slate-500">{quotationTargetRFQ.customerEmail}</p>
                  </div>
                </div>
                {quotationTargetRFQ.description && (
                  <div className="p-3 bg-white border border-slate-200 rounded-lg text-sm text-slate-600 italic">
                    Ghi chú: "{quotationTargetRFQ.description}"
                  </div>
                )}
                {quotationTargetRFQ.attachments && quotationTargetRFQ.attachments.length > 0 && (
                  <div className="mt-3">
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">📎 Bản vẽ / Tài liệu đính kèm ({quotationTargetRFQ.attachments.length})</p>
                    <div className="flex flex-wrap gap-2">
                      {quotationTargetRFQ.attachments.map((url, idx) => {
                        const fullUrl = getFileUrl(url);
                        const fileName = decodeURIComponent(url.split('/').pop() || `File ${idx + 1}`);
                        const isImage = /\.(jpg|jpeg|png|gif|webp|bmp|svg)$/i.test(url);
                        return (
                          <a
                            key={idx}
                            href={fullUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="group flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-all text-xs"
                          >
                            {isImage ? (
                              <img src={fullUrl} alt={fileName} className="w-8 h-8 rounded object-cover border border-slate-200" />
                            ) : (
                              <FileText size={16} className="text-slate-400" />
                            )}
                            <span className="text-slate-600 group-hover:text-blue-600 max-w-[120px] truncate">{fileName}</span>
                          </a>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Items */}
              <div>
                <h3 className="text-lg font-semibold text-slate-900 mb-3">Hạng mục báo giá</h3>
                
                <div className="space-y-3">
                  {quotationItems.map((item, idx) => {
                    const originalItem = quotationTargetRFQ.items?.[idx] || null;
                    return (
                    <div key={idx} className="grid grid-cols-12 gap-3 items-center bg-slate-50/50 p-4 rounded-xl border border-slate-100">
                      <div className="col-span-5">
                        {idx === 0 && <label className="block text-xs font-black text-slate-400 uppercase mb-2">Sản phẩm yêu cầu</label>}
                        <div className="font-bold text-slate-900 text-sm break-words">
                          {originalItem ? originalItem.productType || 'Chưa có tên' : item.productName || 'Chưa có tên'}
                        </div>
                        {originalItem && (
                          <div className="mt-1 space-y-1">
                            <div className="flex flex-wrap gap-1 text-[11px] font-medium text-slate-500">
                              {originalItem.dimensions && <span className="bg-white px-1.5 py-0.5 rounded border border-slate-200">KT: {originalItem.dimensions}</span>}
                              {originalItem.material && <span className="bg-white px-1.5 py-0.5 rounded border border-slate-200">VL: {originalItem.material}</span>}
                            </div>
                            {originalItem.description && (
                              <p className="text-[11px] text-slate-400 italic line-clamp-2">Ghi chú: {originalItem.description}</p>
                            )}
                          </div>
                        )}
                      </div>
                      <div className="col-span-2">
                        {idx === 0 && <label className="block text-xs font-black text-slate-400 uppercase mb-2">SL</label>}
                        <div className="font-bold text-slate-700 text-sm bg-white border border-slate-200 px-3 py-1.5 rounded-lg text-center">
                          {item.quantity}
                        </div>
                      </div>
                      <div className="col-span-3">
                        {idx === 0 && <label className="block text-xs font-black text-slate-400 uppercase mb-2">Đơn giá (VNĐ)</label>}
                        <input
                          type="number" min="0"
                          value={item.unitPrice}
                          onChange={e => {
                            const copy = [...quotationItems];
                            copy[idx].unitPrice = parseFloat(e.target.value) || 0;
                            setQuotationItems(copy);
                          }}
                          className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-900 text-sm focus:outline-none focus:border-blue-500"
                        />
                      </div>
                      <div className="col-span-2">
                         {idx === 0 && <label className="block text-xs font-black text-slate-400 uppercase mb-2 text-right">Thành tiền</label>}
                         <div className="text-right text-sm text-emerald-600 font-bold whitespace-nowrap pt-1">
                           {(item.quantity * item.unitPrice).toLocaleString('vi-VN')}đ
                         </div>
                      </div>
                    </div>
                  )})}
                </div>
              </div>

              {/* Tax, Discount, Total */}
              <div className="bg-slate-50 rounded-xl p-4 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Tạm tính</span>
                  <span className="text-slate-900 font-medium">{qSubTotal.toLocaleString('vi-VN')}đ</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-500">VAT (%)</span>
                  <input
                    type="number" min="0" max="100" value={quotationTax}
                    onChange={e => setQuotationTax(parseFloat(e.target.value) || 0)}
                    className="w-20 px-2 py-1 bg-slate-100 border border-slate-300 rounded-lg text-slate-900 text-sm text-right focus:outline-none"
                  />
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-500">Giảm giá (VNĐ)</span>
                  <input
                    type="number" min="0" value={quotationDiscount}
                    onChange={e => setQuotationDiscount(parseFloat(e.target.value) || 0)}
                    className="w-32 px-2 py-1 bg-slate-100 border border-slate-300 rounded-lg text-slate-900 text-sm text-right focus:outline-none"
                  />
                </div>
                <div className="border-t border-slate-200 pt-3 flex justify-between">
                  <span className="text-slate-900 font-semibold">Tổng cộng</span>
                  <span className="text-2xl font-bold text-emerald-600">{qTotal.toLocaleString('vi-VN')}đ</span>
                </div>
              </div>

              {/* Notes */}
               <div>
                <label className="block text-sm text-slate-600 mb-1">Ghi chú cho khách hàng</label>
                <textarea
                  rows={3} value={quotationNotes}
                  onChange={e => setQuotationNotes(e.target.value)}
                  placeholder="VD: Giá đã bao gồm vận chuyển nội thành..."
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={handleCreateAndSendQuotation}
                  disabled={qTotal <= 0 || quotationItems.some(i => !i.productName)}
                  className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-100 disabled:text-slate-500 text-white font-semibold rounded-xl transition flex items-center justify-center gap-2"
                >
                  <Send size={18} />
                  Tạo & Gửi báo giá cho khách hàng
                </button>
                <button
                  onClick={() => setIsQuotationFormOpen(false)}
                  className="px-6 py-3 bg-slate-50 hover:bg-slate-100 text-slate-900 rounded-xl transition"
                >
                  Hủy
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  // Render trang cài đặt
  const renderSettingsPage = () => (
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

      {/* Sidebar bên trái */}
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
              <p className="text-xs text-slate-500 -mt-1">Quotation System</p>
            </div>
          </div>
        </div>

        {/* Menu điều hướng */}
        <nav className="flex-1 p-4">
          <ul className="space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeMenu === item.id;
              return (
                <li key={item.id}>
                  <button
                    onClick={() => {
                      setActiveMenu(item.id);
                      setCurrentPage(1);
                      setSearchTerm('');
                      setStatusFilter('all');
                      setIsMobileSidebarOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-5 py-3.5 rounded-2xl transition-all ${isActive
                        ? 'bg-blue-600 text-white shadow-lg'
                        : 'hover:bg-slate-50 text-slate-600'
                      }`}
                  >
                    <Icon size={20} />
                    <span className="font-medium">{item.label}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Thông tin người dùng */}
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
              <p className="text-xs text-slate-500">{user?.role === 'manager' ? 'Manager' : user?.role === 'engineer' ? 'Engineer' : 'Sales Executive'}</p>
            </div>
            <button
              onClick={onLogout}
              className="p-2 hover:bg-slate-100 rounded-xl transition"
            >
              <LogOut size={20} />
            </button>
          </div>
        </div>
      </div>

      {/* Khu vực nội dung chính */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* Header trên cùng */}
        <header className="h-16 bg-white border-b border-slate-200 px-4 md:px-8 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <button
              className="md:hidden p-2 text-slate-600 hover:bg-slate-50 rounded-xl"
              onClick={() => setIsMobileSidebarOpen(true)}
            >
              <Menu size={20} />
            </button>
            <h2 className="text-xl font-semibold text-slate-900 capitalize hidden md:block">
              {menuItems.find(m => m.id === activeMenu)?.label || 'Dashboard'}
            </h2>
          </div>

          <GlobalSearch
            rfqs={rfqs}
            quotations={staffQuotations}
            onNavigate={({ menu, rfq, customerKey }) => {
              setActiveMenu(menu);
              setStatusFilter('all');
              setSearchTerm('');
              if (rfq) {
                setTimeout(() => setSelectedRFQ(rfq), 50);
              }
              if (customerKey) {
                setTimeout(() => setCustomerSearch(customerKey), 50);
              }
            }}
          />

          <div className="flex items-center gap-6">
            {/* Thông báo */}
            <div className="relative" ref={notificationDropdownRef}>
              <button
                type="button"
                onClick={() => setIsNotificationsOpen(prev => !prev)}
                className="relative p-2 hover:bg-slate-50 rounded-xl transition"
                aria-label="Mở thông báo"
              >
                <Bell size={20} />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-[10px] rounded-full flex items-center justify-center">
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* Tin nhắn */}
              <button
                type="button"
                onClick={() => setActiveMenu('messages')}
                className={`relative p-2 hover:bg-slate-50 rounded-xl transition ${activeMenu === 'messages' ? 'bg-blue-50 text-blue-600' : 'text-slate-600'}`}
                aria-label="Mở tin nhắn"
              >
                <MessageSquare size={20} />
                <span className="absolute top-1 right-1 w-4 h-4 bg-emerald-500 text-[10px] text-white rounded-full flex items-center justify-center font-bold">
                  3
                </span>
              </button>

              {isNotificationsOpen && (
                <div className="absolute right-0 mt-2 w-96 bg-white border border-slate-200 rounded-2xl shadow-lg z-50 overflow-hidden">
                  <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between">
                    <span className="text-sm font-semibold text-slate-900">Thông báo</span>
                    <button
                      type="button"
                      onClick={handleMarkAllRead}
                      disabled={unreadCount === 0}
                      className="text-xs px-2 py-1 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed bg-slate-50 hover:bg-slate-100 text-slate-800"
                    >
                      Đã đọc tất cả
                    </button>
                  </div>

                  <div className="max-h-80 overflow-auto">
                    {notifications.length === 0 ? (
                      <div className="px-4 py-6 text-sm text-slate-500">
                        Không có thông báo mới.
                      </div>
                    ) : (
                      notifications.map((n) => (
                        <button
                          key={n.id}
                          type="button"
                          onClick={() => handleNotificationClick(n)}
                          className={`w-full text-left px-4 py-3 hover:bg-slate-50 transition ${n.isRead ? 'opacity-70' : 'opacity-100'
                            }`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <div className="text-xs font-medium text-blue-600">
                                {n.title}
                              </div>
                              <div className="text-sm text-slate-900 mt-1">
                                {n.message}
                              </div>
                              <div className="text-xs text-slate-500 mt-1">
                                {new Date(n.createdAt).toLocaleString('vi-VN')}
                              </div>
                            </div>

                            {!n.isRead && (
                              <span className="shrink-0 w-2 h-2 bg-blue-400 rounded-full mt-1" />
                            )}
                          </div>
                        </button>
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
                <div className="w-9 h-9 bg-blue-600 rounded-2xl flex items-center justify-center text-white font-semibold overflow-hidden border border-white/20 shadow-sm">
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
                      setActiveMenu('settings');
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

        {/* Nội dung chính */}
        <main className="flex-1 overflow-auto p-4 md:p-8 bg-slate-50 relative">
          {activeMenu === 'dashboard' && renderDashboardPage()}
          {activeMenu === 'requests' && renderRFQPage()}
          {activeMenu === 'customers' && renderCustomersPage()}
          {activeMenu === 'quotations' && renderQuotationsPage()}
          {activeMenu === 'production' && (
            <div className="h-full">
              <ProductionKanban
                rfqs={rfqs}
                onUpdateStage={async (rfq, newStage) => {
                  try {
                    await updateProductionStageAPI(rfq.id, newStage);
                    await fetchRFQs();
                  } catch (error: any) {
                    console.error('Lỗi cập nhật tiến độ:', error);
                    alert(error.response?.data?.message || 'Cập nhật tiến độ thất bại');
                  }
                }}
                onOpenChat={(id) => {
                  setActiveChatRfqId(id);
                  setActiveMenu('messages');
                }}
                onOpenDetail={(rfq) => {
                  setSelectedRFQ(rfq);
                }}
              />
            </div>
          )}
          {activeMenu === 'reports' && (
            <RevenueReport rfqs={rfqs} quotations={staffQuotations} />
          )}
          {activeMenu === 'messages' && (
            <MessagesView rfqs={rfqs} defaultSelectedId={activeChatRfqId} />
          )}
          {activeMenu === 'notifications' && (
            <NotificationView userRole={user?.role} />
          )}
          {activeMenu === 'settings' && renderSettingsPage()}
          {activeMenu === 'announcements' && <AnnouncementsManagementView />}
          {activeMenu === 'users' && <UsersManagementView />}
        </main>
      </div>

      {/* Modal thêm/sửa RFQ */}
      <RFQModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedRFQ(null);
        }}
        onSubmit={selectedRFQ ? handleUpdateRFQ : handleCreateRFQ}
        rfq={selectedRFQ}
      />

      {/* Modal xem chi tiết RFQ */}
      <RFQDetail
        rfq={selectedRFQ}
        onClose={() => {
          setSelectedRFQ(null);
        }}
        onUpdate={handleUpdateRFQFromDetail}
        onOpenChat={(id) => {
          setSelectedRFQ(null);
          setActiveChatRfqId(id);
          setActiveMenu('messages');
        }}
      />

      {/* Modal Đổi mật khẩu */}
      <ChangePasswordModal
        isOpen={isChangePasswordOpen}
        onClose={() => setIsChangePasswordOpen(false)}
      />
    </div>
  );
}