import { useMemo, useState } from 'react';
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  BarChart, Bar, Legend,
} from 'recharts';
import { TrendingUp, TrendingDown, DollarSign, FileText, Users, Target, Download } from 'lucide-react';
import { type RFQ } from '../types/rfq';
import { type Quotation } from '../api/quotation';

interface RevenueReportProps {
  rfqs: RFQ[];
  quotations: Quotation[];
}

type Range = '3m' | '6m' | '1y' | 'all';

const fmt = (n: number) =>
  n >= 1_000_000_000
    ? `${(n / 1_000_000_000).toFixed(1)}tỷ`
    : n >= 1_000_000
    ? `${(n / 1_000_000).toFixed(1)}tr`
    : n.toLocaleString('vi-VN');

const fmtFull = (n: number) => n.toLocaleString('vi-VN') + 'đ';

function getStartDate(range: Range): Date {
  const now = new Date();
  if (range === '3m') return new Date(now.getFullYear(), now.getMonth() - 2, 1);
  if (range === '6m') return new Date(now.getFullYear(), now.getMonth() - 5, 1);
  if (range === '1y') return new Date(now.getFullYear(), 0, 1);
  return new Date(2020, 0, 1);
}

export default function RevenueReport({ rfqs, quotations }: RevenueReportProps) {
  const [range, setRange] = useState<Range>('1y');

  const startDate = getStartDate(range);

  const approved = useMemo(
    () => quotations.filter(q => q.status === 'approved' && new Date(q.createdAt) >= startDate),
    [quotations, range]
  );

  const sent = useMemo(
    () => quotations.filter(q => q.status === 'sent' && new Date(q.createdAt) >= startDate),
    [quotations, range]
  );

  const filteredRFQs = useMemo(
    () => rfqs.filter(r => new Date(r.createdAt) >= startDate),
    [rfqs, range]
  );

  // KPIs
  const totalRevenue = approved.reduce((s, q) => s + q.totalAmount, 0);
  const pipelineValue = sent.reduce((s, q) => s + q.totalAmount, 0);
  const winRate = (approved.length + sent.length) > 0
    ? Math.round((approved.length / (approved.length + sent.length)) * 100)
    : 0;
  const avgDeal = approved.length > 0 ? Math.round(totalRevenue / approved.length) : 0;

  // So sánh tháng này vs tháng trước
  const now = new Date();
  const thisMonthRev = approved
    .filter(q => {
      const d = new Date(q.createdAt);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    })
    .reduce((s, q) => s + q.totalAmount, 0);
  const lastMonthRev = approved
    .filter(q => {
      const d = new Date(q.createdAt);
      const last = new Date(now.getFullYear(), now.getMonth() - 1);
      return d.getMonth() === last.getMonth() && d.getFullYear() === last.getFullYear();
    })
    .reduce((s, q) => s + q.totalAmount, 0);
  const monthGrowth = lastMonthRev > 0
    ? Math.round(((thisMonthRev - lastMonthRev) / lastMonthRev) * 100)
    : null;

  // Doanh thu + RFQ theo tháng
  const monthlyData = useMemo(() => {
    const map = new Map<string, { month: string; revenue: number; pipeline: number; rfqs: number; won: number }>();

    const addMonth = (dateStr: string) => {
      const d = new Date(dateStr);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = d.toLocaleDateString('vi-VN', { month: 'short', year: '2-digit' });
      if (!map.has(key)) map.set(key, { month: label, revenue: 0, pipeline: 0, rfqs: 0, won: 0 });
      return key;
    };

    approved.forEach(q => {
      const key = addMonth(q.createdAt);
      map.get(key)!.revenue += q.totalAmount;
      map.get(key)!.won += 1;
    });
    sent.forEach(q => {
      const key = addMonth(q.createdAt);
      map.get(key)!.pipeline += q.totalAmount;
    });
    filteredRFQs.forEach(r => {
      const key = addMonth(r.createdAt);
      map.get(key)!.rfqs += 1;
    });

    return Array.from(map.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([, v]) => v);
  }, [approved, sent, filteredRFQs]);

  // Top khách hàng
  const topCustomers = useMemo(() => {
    const map = new Map<string, { name: string; revenue: number; deals: number }>();
    approved.forEach(q => {
      const name = q.requestId?.customerName || '—';
      const existing = map.get(name);
      if (existing) {
        existing.revenue += q.totalAmount;
        existing.deals += 1;
      } else {
        map.set(name, { name, revenue: q.totalAmount, deals: 1 });
      }
    });
    return Array.from(map.values()).sort((a, b) => b.revenue - a.revenue).slice(0, 6);
  }, [approved]);

  // Sản phẩm bán chạy (từ RFQ đã approved/completed)
  const topProducts = useMemo(() => {
    const map = new Map<string, { name: string; qty: number; deals: number }>();
    filteredRFQs
      .filter(r => ['approved', 'completed'].includes(r.status))
      .forEach(r => {
        r.items?.forEach(item => {
          const existing = map.get(item.productType);
          if (existing) {
            existing.qty += item.quantity;
            existing.deals += 1;
          } else {
            map.set(item.productType, { name: item.productType, qty: item.quantity, deals: 1 });
          }
        });
      });
    return Array.from(map.values()).sort((a, b) => b.qty - a.qty).slice(0, 6);
  }, [filteredRFQs]);

  const customTooltipRevenue = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-lg text-xs">
        <p className="font-bold text-slate-700 mb-2">{label}</p>
        {payload.map((p: any) => (
          <p key={p.dataKey} style={{ color: p.color }} className="font-medium">
            {p.name}: {fmtFull(p.value)}
          </p>
        ))}
      </div>
    );
  };

  const rangeOptions: { key: Range; label: string }[] = [
    { key: '3m', label: '3 tháng' },
    { key: '6m', label: '6 tháng' },
    { key: '1y', label: 'Năm nay' },
    { key: 'all', label: 'Tất cả' },
  ];

  return (
    <div className="space-y-8 pb-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Báo cáo Doanh thu</h1>
          <p className="text-slate-500 text-sm mt-1">Tổng quan hiệu suất kinh doanh theo thời gian</p>
        </div>
        <div className="flex items-center gap-2">
          {rangeOptions.map(o => (
            <button
              key={o.key}
              onClick={() => setRange(o.key)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition ${
                range === o.key
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {o.label}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white border border-slate-200 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-slate-500 text-sm">Tổng doanh thu</p>
            <div className="w-9 h-9 bg-emerald-50 rounded-xl flex items-center justify-center">
              <DollarSign size={18} className="text-emerald-600" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900">{fmt(totalRevenue)}đ</p>
          {monthGrowth !== null && (
            <div className={`flex items-center gap-1 mt-2 text-xs font-medium ${monthGrowth >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
              {monthGrowth >= 0 ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
              {monthGrowth >= 0 ? '+' : ''}{monthGrowth}% so với tháng trước
            </div>
          )}
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-slate-500 text-sm">Pipeline (chờ duyệt)</p>
            <div className="w-9 h-9 bg-amber-50 rounded-xl flex items-center justify-center">
              <Target size={18} className="text-amber-600" />
            </div>
          </div>
          <p className="text-2xl font-bold text-amber-600">{fmt(pipelineValue)}đ</p>
          <p className="text-xs text-slate-400 mt-2">{sent.length} báo giá đang chờ</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-slate-500 text-sm">Tỷ lệ chốt đơn</p>
            <div className="w-9 h-9 bg-blue-50 rounded-xl flex items-center justify-center">
              <FileText size={18} className="text-blue-600" />
            </div>
          </div>
          <p className="text-2xl font-bold text-blue-600">{winRate}%</p>
          <p className="text-xs text-slate-400 mt-2">{approved.length} / {approved.length + sent.length} báo giá</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-slate-500 text-sm">Giá trị đơn TB</p>
            <div className="w-9 h-9 bg-purple-50 rounded-xl flex items-center justify-center">
              <Users size={18} className="text-purple-600" />
            </div>
          </div>
          <p className="text-2xl font-bold text-purple-600">{fmt(avgDeal)}đ</p>
          <p className="text-xs text-slate-400 mt-2">{approved.length} đơn đã chốt</p>
        </div>
      </div>

      {/* Biểu đồ doanh thu theo tháng */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-bold text-slate-900">Doanh thu theo tháng</h3>
            <p className="text-xs text-slate-400 mt-0.5">Đã chốt vs Pipeline chờ duyệt</p>
          </div>
        </div>
        {monthlyData.length === 0 ? (
          <div className="h-64 flex items-center justify-center text-slate-400 text-sm">Chưa có dữ liệu trong khoảng thời gian này</div>
        ) : (
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyData}>
                <defs>
                  <linearGradient id="gRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gPipeline" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 700 }} dy={8} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11 }} tickFormatter={v => fmt(v)} />
                <Tooltip content={customTooltipRevenue} />
                <Legend formatter={(v) => v === 'revenue' ? 'Đã chốt' : 'Pipeline'} />
                <Area type="monotone" dataKey="revenue" name="revenue" stroke="#10b981" strokeWidth={2.5} fill="url(#gRevenue)" />
                <Area type="monotone" dataKey="pipeline" name="pipeline" stroke="#f59e0b" strokeWidth={2} strokeDasharray="4 2" fill="url(#gPipeline)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* RFQ mới vs Chốt theo tháng */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6">
        <div className="mb-6">
          <h3 className="text-lg font-bold text-slate-900">Yêu cầu mới vs Đơn chốt</h3>
          <p className="text-xs text-slate-400 mt-0.5">Số lượng RFQ và báo giá được duyệt theo tháng</p>
        </div>
        {monthlyData.length === 0 ? (
          <div className="h-52 flex items-center justify-center text-slate-400 text-sm">Chưa có dữ liệu</div>
        ) : (
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyData} barGap={4}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 700 }} dy={8} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11 }} allowDecimals={false} />
                <Tooltip contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)', fontSize: 12 }} />
                <Legend formatter={(v) => v === 'rfqs' ? 'RFQ mới' : 'Đã chốt'} />
                <Bar dataKey="rfqs" name="rfqs" fill="#e2e8f0" radius={[6, 6, 0, 0]} />
                <Bar dataKey="won" name="won" fill="#3b82f6" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Top khách hàng + Sản phẩm */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top khách hàng */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6">
          <h3 className="text-lg font-bold text-slate-900 mb-5">Top khách hàng</h3>
          {topCustomers.length === 0 ? (
            <div className="py-10 text-center text-slate-400 text-sm">Chưa có dữ liệu</div>
          ) : (
            <div className="space-y-3">
              {topCustomers.map((c, i) => {
                const pct = topCustomers[0].revenue > 0 ? (c.revenue / topCustomers[0].revenue) * 100 : 0;
                const colors = ['bg-blue-500', 'bg-emerald-500', 'bg-purple-500', 'bg-amber-500', 'bg-rose-500', 'bg-cyan-500'];
                return (
                  <div key={c.name}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span className={`w-5 h-5 ${colors[i]} rounded-full flex items-center justify-center text-white text-[10px] font-black shrink-0`}>{i + 1}</span>
                        <span className="text-sm font-medium text-slate-900 truncate max-w-[180px]">{c.name}</span>
                        <span className="text-xs text-slate-400">{c.deals} đơn</span>
                      </div>
                      <span className="text-sm font-bold text-emerald-600">{fmt(c.revenue)}đ</span>
                    </div>
                    <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div className={`h-full ${colors[i]} rounded-full transition-all duration-700`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Sản phẩm bán chạy */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6">
          <h3 className="text-lg font-bold text-slate-900 mb-5">Sản phẩm bán chạy</h3>
          {topProducts.length === 0 ? (
            <div className="py-10 text-center text-slate-400 text-sm">Chưa có dữ liệu</div>
          ) : (
            <div className="space-y-3">
              {topProducts.map((p, i) => {
                const pct = topProducts[0].qty > 0 ? (p.qty / topProducts[0].qty) * 100 : 0;
                const colors = ['bg-indigo-500', 'bg-teal-500', 'bg-orange-500', 'bg-pink-500', 'bg-lime-500', 'bg-sky-500'];
                return (
                  <div key={p.name}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span className={`w-5 h-5 ${colors[i]} rounded-full flex items-center justify-center text-white text-[10px] font-black shrink-0`}>{i + 1}</span>
                        <span className="text-sm font-medium text-slate-900 truncate max-w-[180px]">{p.name}</span>
                        <span className="text-xs text-slate-400">{p.deals} đơn</span>
                      </div>
                      <span className="text-sm font-bold text-slate-700">SL: {p.qty}</span>
                    </div>
                    <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div className={`h-full ${colors[i]} rounded-full transition-all duration-700`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
