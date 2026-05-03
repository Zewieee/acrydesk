import { useState } from 'react';
import { type RFQ, type ProductionStage, productionStageConfig, statusConfig } from '../types/rfq';
import { Package, ChevronLeft, ChevronRight, CheckCircle, Clock, Calendar, Settings, Layers, Sparkles, Box, Truck, Search, AlertCircle, Timer, MessageSquare, Paperclip, FileText, ExternalLink } from 'lucide-react';

interface ProductionKanbanProps {
  rfqs: RFQ[];
  onUpdateStage: (rfq: RFQ, newStage: ProductionStage | null) => void;
  onOpenChat?: (rfqId: string) => void;
  onOpenDetail?: (rfq: RFQ) => void;
  readOnly?: boolean;
}
export default function ProductionKanban({ rfqs, onUpdateStage, onOpenChat, onOpenDetail, readOnly = false }: ProductionKanbanProps) {
  const [searchTerm, setSearchTerm] = useState('');
  
  // Lọc các RFQ không bị từ chối và chưa xóa + filter theo tìm kiếm
  const productionRFQs = rfqs.filter(r => {
    const isNotRejected = r.status !== 'rejected';
    const matchesSearch = 
      r.code.toLowerCase().includes(searchTerm.toLowerCase()) || 
      r.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.items?.some(i => i.productType.toLowerCase().includes(searchTerm.toLowerCase()));
    return isNotRejected && matchesSearch;
  });

  // Tính toán số ngày từ lần cập nhật cuối
  const getDaysInStage = (updatedAt: string) => {
    const lastUpdate = new Date(updatedAt).getTime();
    const now = new Date().getTime();
    const diffDays = Math.floor((now - lastUpdate) / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  // Cấu trúc cột
  const columns = [
    { key: 'unstarted', label: 'Tiếp nhận', stage: null, icon: <Clock size={16} />, bgColor: 'bg-slate-100' },
    { key: 'design', label: 'Thiết kế & KT', stage: 'design', icon: <Settings size={16} />, bgColor: 'bg-cyan-50' },
    { key: 'materials_prep', label: 'Vật tư', stage: 'materials_prep', icon: <Package size={16} />, bgColor: 'bg-amber-50' },
    { key: 'machining', label: 'Cắt & Gia công', stage: 'machining', icon: <Layers size={16} />, bgColor: 'bg-blue-50' },
    { key: 'assembly', label: 'Lắp ráp', stage: 'assembly', icon: <Layers size={16} />, bgColor: 'bg-indigo-50' },
    { key: 'finishing', label: 'Hoàn thiện', stage: 'finishing', icon: <Sparkles size={16} />, bgColor: 'bg-rose-50' },
    { key: 'qc', label: 'Kiểm định (QC)', stage: 'qc', icon: <CheckCircle size={16} />, bgColor: 'bg-purple-50' },
    { key: 'packaging', label: 'Đóng gói', stage: 'packaging', icon: <Box size={16} />, bgColor: 'bg-orange-50' },
    { key: 'delivering', label: 'Giao hàng', stage: 'delivering', icon: <Truck size={16} />, bgColor: 'bg-sky-50' },
    { key: 'done', label: 'Hoàn tất', stage: 'done', icon: <CheckCircle size={16} />, bgColor: 'bg-emerald-50' }
  ];

  const getNextStage = (currentStage: ProductionStage | null): ProductionStage | null => {
    if (!currentStage) return 'design';
    const keys = Object.keys(productionStageConfig) as ProductionStage[];
    const index = keys.indexOf(currentStage);
    if (index >= 0 && index < keys.length - 1) return keys[index + 1];
    return currentStage;
  };

  const getPrevStage = (currentStage: ProductionStage | null): ProductionStage | null => {
    if (!currentStage) return null;
    if (currentStage === 'design') return null;
    const keys = Object.keys(productionStageConfig) as ProductionStage[];
    const index = keys.indexOf(currentStage);
    if (index > 0) return keys[index - 1];
    return currentStage;
  };
  return (
    <div className="flex flex-col w-max min-h-[calc(100vh-150px)]">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8 shrink-0 sticky left-0 w-[calc(100vw-350px)]">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Tiến độ sản xuất (Kanban)</h1>
          <p className="text-slate-500 text-sm mt-1">Quản lý quy trình từ tiếp nhận đến giao hàng</p>
        </div>
        
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Tìm mã RFQ, khách hàng..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium"
            />
          </div>
          <div className="bg-white border border-slate-200 px-4 py-2.5 rounded-xl text-sm font-bold text-slate-700 shadow-sm whitespace-nowrap">
            {productionRFQs.length} Đơn hàng
          </div>
        </div>
      </div>

      <div className="flex-1 w-full pb-4">
        <div className="flex gap-6 h-full items-start">
          {columns.map(col => {
            const columnRFQs = productionRFQs.filter(r => (r.productionStage || null) === col.stage);

            return (
              <div key={col.key} className="w-80 flex flex-col bg-slate-100 rounded-2xl h-full border border-slate-200 overflow-hidden shrink-0">
                {/* Column Header */}
                <div className="px-4 py-3 bg-slate-200/50 border-b border-slate-200 flex justify-between items-center shrink-0">
                  <h3 className="font-semibold text-slate-800">{col.label}</h3>
                  <span className="bg-white border border-slate-200 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-slate-600">
                    {columnRFQs.length}
                  </span>
                </div>

                {/* Column Body / Cards */}
                <div className="flex-1 p-4 overflow-y-auto space-y-4 scrollbar-thin scrollbar-thumb-slate-200">
                  {columnRFQs.map(rfq => {
                    const daysInStage = getDaysInStage(rfq.updatedAt);
                    const isDelayed = daysInStage >= 3 && col.stage === null;
                    
                    return (
                    <div key={rfq.id} className={`group bg-white rounded-2xl shadow-sm border-l-4 p-5 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 relative ${
                      isDelayed ? 'border-l-rose-500 bg-rose-50/20' : 'border-l-blue-400'
                    }`}>
                      {isDelayed && (
                        <div className="absolute -top-2 -right-2 bg-rose-500 text-white p-1 rounded-full shadow-lg animate-pulse z-10">
                          <AlertCircle size={14} />
                        </div>
                      )}
                      
                      <div className="flex justify-between items-start mb-3">
                         <div className="flex flex-col">
                            <div className="flex items-center gap-2">
                               <button 
                                 onClick={() => onOpenDetail?.(rfq)}
                                 className="font-black text-slate-800 text-sm tracking-tight hover:text-blue-600 hover:underline transition-colors"
                               >
                                 {rfq.code}
                               </button>
                               {isDelayed && (
                                 <span className="flex items-center gap-1 text-[10px] bg-rose-100 text-rose-600 px-1.5 py-0.5 rounded font-black uppercase">
                                   Chậm {daysInStage} ngày
                                 </span>
                               )}
                            </div>
                            <span className="text-[10px] text-slate-400 font-bold uppercase mt-0.5">{new Date(rfq.createdAt).toLocaleDateString('vi-VN')}</span>
                         </div>
                         
                         <div className="flex gap-1">
                            {rfq.attachments && rfq.attachments.length > 0 && (
                               <button 
                                 onClick={() => onOpenDetail?.(rfq)}
                                 className="p-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-600 hover:text-white transition-all shadow-sm"
                                 title="Xem bản vẽ/đính kèm"
                               >
                                 <Paperclip size={14} />
                               </button>
                            )}
                            <button 
                              onClick={() => onOpenChat?.(rfq.id)}
                              className="p-1.5 bg-slate-50 text-slate-600 rounded-lg hover:bg-slate-900 hover:text-white transition-all shadow-sm"
                              title="Nhắn tin trao đổi"
                            >
                              <MessageSquare size={14} />
                            </button>
                         </div>
                      </div>

                      <div className="mb-4">
                        <p className="text-sm font-bold text-slate-900 mb-2 truncate">{rfq.customerName}</p>
                        <div className="space-y-2">
                           <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 rounded-xl border border-slate-100">
                              <Package size={14} className="text-slate-400 shrink-0" />
                              <span className="text-xs text-slate-700 font-semibold leading-relaxed">
                                {rfq.items?.length ? rfq.items.map(i => i.productType).join(', ') : '—'}
                              </span>
                           </div>
                           <div className="flex items-center justify-between">
                              <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-wider shadow-sm border border-black/5 ${statusConfig[rfq.status]?.bg || ''} ${statusConfig[rfq.status]?.color || ''}`}>
                                 {statusConfig[rfq.status]?.label}
                              </span>
                              <div className="flex items-center gap-1 text-[11px] font-bold text-slate-600">
                                 <span className="text-slate-400 font-normal">SL:</span> {rfq.items?.reduce((sum, item) => sum + item.quantity, 0) || 0}
                              </div>
                           </div>
                        </div>
                      </div>

                      {/* Tương tác chuyển cột */}
                      <div className="flex justify-between items-center pt-4 mt-1 border-t border-slate-100">
                        {readOnly ? (
                          <div className="w-full text-center py-1">
                            {col.stage === 'done' ? (
                              <span className="text-emerald-600 flex justify-center items-center gap-1.5 text-xs font-black uppercase tracking-widest"><CheckCircle size={16} /> Hoàn tất</span>
                            ) : (
                               <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-400 font-medium">
                                  <Calendar size={12} /> {new Date(rfq.updatedAt).toLocaleDateString('vi-VN')}
                               </div>
                            )}
                          </div>
                        ) : (
                          <>
                            <button
                              onClick={() => {
                                const prev = getPrevStage(rfq.productionStage || null);
                                if (prev !== rfq.productionStage) onUpdateStage(rfq, prev);
                              }}
                              disabled={!rfq.productionStage}
                              className="w-10 h-10 flex items-center justify-center bg-slate-50 hover:bg-slate-200 text-slate-600 rounded-2xl disabled:opacity-20 disabled:cursor-not-allowed transition-all duration-300 shadow-inner group/btn"
                            >
                              <ChevronLeft size={18} className="group-hover/btn:-translate-x-0.5 transition-transform" />
                            </button>

                            <div className="flex-1 flex flex-col items-center justify-center">
                               {col.stage === 'done' ? (
                                 <div className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full flex items-center gap-1 text-[10px] font-black uppercase shadow-sm border border-emerald-100">
                                   <CheckCircle size={10} /> Xong
                                 </div>
                               ) : (
                                 <span className="text-[10px] text-slate-300 font-bold uppercase tracking-tighter">Cập nhật: {new Date(rfq.updatedAt).getDate()}/{new Date(rfq.updatedAt).getMonth() + 1}</span>
                               )}
                            </div>

                            <button
                              onClick={() => {
                                const next = getNextStage(rfq.productionStage || null);
                                if (next !== rfq.productionStage) onUpdateStage(rfq, next);
                              }}
                              disabled={col.stage === 'done'}
                              className="w-10 h-10 flex items-center justify-center bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white rounded-2xl disabled:opacity-20 disabled:cursor-not-allowed transition-all duration-300 shadow-md group/btn"
                            >
                              <ChevronRight size={18} className="group-hover/btn:translate-x-0.5 transition-transform" />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  )})}

                  {columnRFQs.length === 0 && (
                    <div className="h-32 border-2 border-dashed border-slate-200 rounded-[2rem] flex flex-col items-center justify-center text-slate-300 text-xs font-bold uppercase tracking-widest gap-2 opacity-50">
                       <Package size={24} />
                       Trống
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
