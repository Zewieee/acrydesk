import { useEffect, useRef, useState, useCallback } from 'react';
import { Search, FileText, Users, DollarSign, X, ArrowRight, Command } from 'lucide-react';
import { type RFQ, statusConfig } from '../types/rfq';
import { type Quotation } from '../api/quotation';

interface SearchResult {
  id: string;
  type: 'rfq' | 'customer' | 'quotation';
  title: string;
  subtitle: string;
  badge?: string;
  badgeColor?: string;
  data: any;
}

interface GlobalSearchProps {
  rfqs: RFQ[];
  quotations: Quotation[];
  onNavigate: (action: {
    menu: string;
    rfq?: RFQ;
    customerKey?: string;
  }) => void;
}

export default function GlobalSearch({ rfqs, quotations, onNavigate }: GlobalSearchProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Ctrl+K / Cmd+K mở search
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(true);
      }
      if (e.key === 'Escape') setIsOpen(false);
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setQuery('');
      setActiveIndex(0);
    }
  }, [isOpen]);

  const results: SearchResult[] = (() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    const out: SearchResult[] = [];

    // RFQs
    rfqs.forEach(rfq => {
      const match =
        rfq.code.toLowerCase().includes(q) ||
        rfq.customerName.toLowerCase().includes(q) ||
        rfq.items?.some(i => i.productType.toLowerCase().includes(q));
      if (match) {
        const cfg = statusConfig[rfq.status];
        out.push({
          id: `rfq-${rfq.id}`,
          type: 'rfq',
          title: rfq.code,
          subtitle: `${rfq.customerName} · ${rfq.items?.map(i => i.productType).join(', ') || '—'}`,
          badge: cfg.label,
          badgeColor: `${cfg.bg} ${cfg.color}`,
          data: rfq,
        });
      }
    });

    // Khách hàng (dedup từ RFQs)
    const customerMap = new Map<string, { name: string; email: string; phone: string; count: number }>();
    rfqs.forEach(rfq => {
      const key = rfq.customerEmail || rfq.customerName;
      if (!customerMap.has(key)) {
        customerMap.set(key, { name: rfq.customerName, email: rfq.customerEmail, phone: rfq.customerPhone, count: 0 });
      }
      customerMap.get(key)!.count++;
    });
    customerMap.forEach((c, key) => {
      const match =
        c.name.toLowerCase().includes(q) ||
        c.email?.toLowerCase().includes(q) ||
        c.phone?.includes(q);
      if (match) {
        out.push({
          id: `customer-${key}`,
          type: 'customer',
          title: c.name,
          subtitle: `${c.email || '—'} · ${c.phone || '—'}`,
          badge: `${c.count} yêu cầu`,
          badgeColor: 'bg-slate-100 text-slate-600',
          data: key,
        });
      }
    });

    // Báo giá
    quotations.forEach(q2 => {
      const match =
        (q2.requestId?.code || '').toLowerCase().includes(q) ||
        (q2.requestId?.customerName || '').toLowerCase().includes(q);
      if (match) {
        out.push({
          id: `quotation-${q2.id}`,
          type: 'quotation',
          title: q2.requestId?.code || 'Báo giá',
          subtitle: `${q2.requestId?.customerName || '—'} · ${q2.totalAmount.toLocaleString('vi-VN')}đ`,
          badge: q2.status === 'sent' ? 'Đã gửi' : q2.status === 'draft' ? 'Nháp' : q2.status,
          badgeColor: q2.status === 'sent' ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600',
          data: q2,
        });
      }
    });

    return out.slice(0, 10);
  })();

  const handleSelect = useCallback((result: SearchResult) => {
    setIsOpen(false);
    setQuery('');
    if (result.type === 'rfq') {
      onNavigate({ menu: 'requests', rfq: result.data });
    } else if (result.type === 'customer') {
      onNavigate({ menu: 'customers', customerKey: result.data });
    } else if (result.type === 'quotation') {
      onNavigate({ menu: 'quotations' });
    }
  }, [onNavigate]);

  // Điều hướng bàn phím
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActiveIndex(i => Math.min(i + 1, results.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActiveIndex(i => Math.max(i - 1, 0));
      } else if (e.key === 'Enter' && results[activeIndex]) {
        handleSelect(results[activeIndex]);
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [isOpen, results, activeIndex, handleSelect]);

  useEffect(() => setActiveIndex(0), [query]);

  // Scroll active item vào view
  useEffect(() => {
    const el = listRef.current?.querySelector(`[data-index="${activeIndex}"]`);
    el?.scrollIntoView({ block: 'nearest' });
  }, [activeIndex]);

  const typeIcon = (type: SearchResult['type']) => {
    if (type === 'rfq') return <FileText size={16} className="text-blue-500" />;
    if (type === 'customer') return <Users size={16} className="text-purple-500" />;
    return <DollarSign size={16} className="text-emerald-500" />;
  };

  const typeLabel = (type: SearchResult['type']) => {
    if (type === 'rfq') return 'Yêu cầu báo giá';
    if (type === 'customer') return 'Khách hàng';
    return 'Báo giá';
  };

  const grouped = results.reduce<Record<string, SearchResult[]>>((acc, r) => {
    if (!acc[r.type]) acc[r.type] = [];
    acc[r.type].push(r);
    return acc;
  }, {});

  let flatIndex = 0;

  return (
    <>
      {/* Trigger button trong header */}
      <button
        onClick={() => setIsOpen(true)}
        className="hidden md:flex items-center gap-2 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-xl transition text-sm w-56"
      >
        <Search size={15} />
        <span className="flex-1 text-left">Tìm kiếm...</span>
        <kbd className="flex items-center gap-0.5 text-xs bg-white border border-slate-200 rounded px-1.5 py-0.5 text-slate-400">
          <Command size={10} />K
        </kbd>
      </button>

      {/* Mobile trigger */}
      <button
        onClick={() => setIsOpen(true)}
        className="md:hidden p-2 hover:bg-slate-50 rounded-xl text-slate-600"
      >
        <Search size={20} />
      </button>

      {/* Modal overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] flex items-start justify-center pt-[10vh] px-4"
          onClick={() => setIsOpen(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden border border-slate-200"
            onClick={e => e.stopPropagation()}
          >
            {/* Input */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-200">
              <Search size={20} className="text-slate-400 shrink-0" />
              <input
                ref={inputRef}
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Tìm mã RFQ, tên khách hàng, sản phẩm..."
                className="flex-1 text-slate-900 placeholder-slate-400 bg-transparent outline-none text-base"
              />
              {query && (
                <button onClick={() => setQuery('')} className="p-1 hover:bg-slate-100 rounded-lg transition">
                  <X size={16} className="text-slate-400" />
                </button>
              )}
              <kbd className="text-xs bg-slate-100 border border-slate-200 rounded px-2 py-1 text-slate-400">Esc</kbd>
            </div>

            {/* Results */}
            <div ref={listRef} className="max-h-[60vh] overflow-y-auto">
              {query.trim() === '' ? (
                <div className="px-4 py-10 text-center text-slate-400 text-sm">
                  <Search size={32} className="mx-auto mb-3 opacity-30" />
                  Nhập để tìm kiếm RFQ, khách hàng, báo giá...
                </div>
              ) : results.length === 0 ? (
                <div className="px-4 py-10 text-center text-slate-400 text-sm">
                  Không tìm thấy kết quả cho <span className="font-semibold text-slate-600">"{query}"</span>
                </div>
              ) : (
                <div className="py-2">
                  {(['rfq', 'customer', 'quotation'] as const).map(type => {
                    const group = grouped[type];
                    if (!group) return null;
                    return (
                      <div key={type}>
                        {/* Group header */}
                        <div className="px-4 py-2 flex items-center gap-2">
                          {typeIcon(type)}
                          <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                            {typeLabel(type)}
                          </span>
                          <span className="text-xs text-slate-300">{group.length}</span>
                        </div>

                        {group.map(result => {
                          const idx = flatIndex++;
                          const isActive = idx === activeIndex;
                          return (
                            <button
                              key={result.id}
                              data-index={idx}
                              onClick={() => handleSelect(result)}
                              onMouseEnter={() => setActiveIndex(idx)}
                              className={`w-full text-left px-4 py-3 flex items-center gap-3 transition ${
                                isActive ? 'bg-blue-50' : 'hover:bg-slate-50'
                              }`}
                            >
                              <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                                isActive ? 'bg-blue-100' : 'bg-slate-100'
                              }`}>
                                {typeIcon(type)}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-slate-900 truncate">{result.title}</p>
                                <p className="text-xs text-slate-500 truncate mt-0.5">{result.subtitle}</p>
                              </div>
                              {result.badge && (
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${result.badgeColor}`}>
                                  {result.badge}
                                </span>
                              )}
                              {isActive && <ArrowRight size={14} className="text-blue-400 shrink-0" />}
                            </button>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Footer */}
            {results.length > 0 && (
              <div className="px-4 py-2.5 border-t border-slate-100 flex items-center gap-4 text-xs text-slate-400">
                <span className="flex items-center gap-1"><kbd className="bg-slate-100 border border-slate-200 rounded px-1.5">↑↓</kbd> Di chuyển</span>
                <span className="flex items-center gap-1"><kbd className="bg-slate-100 border border-slate-200 rounded px-1.5">Enter</kbd> Chọn</span>
                <span className="flex items-center gap-1"><kbd className="bg-slate-100 border border-slate-200 rounded px-1.5">Esc</kbd> Đóng</span>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
