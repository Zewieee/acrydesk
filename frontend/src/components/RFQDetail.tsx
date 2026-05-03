// src/components/RFQDetail.tsx
import { useState } from 'react';
import { X, Calendar, User, Phone, Mail, Package, FileText, Edit2, Save, XCircle, CheckCircle, AlertCircle, MessageSquare, Star, Paperclip, Download } from 'lucide-react';
import { type RFQ, statusConfig, productionStageConfig, type RFQStatus, type ProductionStage } from '../types/rfq';
import { getFileUrl } from '../utils/fileUrl';

interface RFQDetailProps {
  rfq: RFQ | null;
  onClose: () => void;
  onUpdate: (updatedRFQ: RFQ) => Promise<void>;
  onOpenChat?: (rfqId: string) => void;
}

export default function RFQDetail({ rfq, onClose, onUpdate, onOpenChat }: RFQDetailProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedRFQ, setEditedRFQ] = useState<RFQ | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [phoneError, setPhoneError] = useState('');

  if (!rfq) return null;

  const handleEdit = () => {
    setEditedRFQ({ ...rfq });
    setIsEditing(true);
  };

  const handleSave = () => {
    if (editedRFQ?.customerPhone) {
      const cleanedPhone = editedRFQ.customerPhone.replace(/\s/g, '');
      if (!/^(?:\+84|0)(?:3|5|7|8|9)\d{8}$/.test(cleanedPhone)) {
        setPhoneError('Số điện thoại không hợp lệ (VD: 0909123456 hoặc +84909123456)');
        return;
      }
    }
    setPhoneError('');
    setShowConfirm(true);
  };

  const confirmSave = () => {
    if (editedRFQ) {
      onUpdate(editedRFQ);
      setIsEditing(false);
      setShowConfirm(false);
    }
  };

  const handleCancel = () => {
    setEditedRFQ(null);
    setIsEditing(false);
    setShowConfirm(false);
  };

  const handleChange = (field: keyof RFQ, value: any) => {
    if (editedRFQ) {
      if (field === 'customerPhone') {
        const cleaned = value.replace(/[^\d\s\+]/g, '').slice(0, 15);
        setEditedRFQ({ ...editedRFQ, [field]: cleaned });
        if (phoneError) setPhoneError('');
      } else {
        setEditedRFQ({ ...editedRFQ, [field]: value });
      }
    }
  };

  const getStatusIcon = (status: RFQStatus) => {
    switch (status) {
      case 'pending': return <AlertCircle size={16} className="text-amber-600" />;
      case 'approved': return <CheckCircle size={16} className="text-emerald-600" />;
      case 'rejected': return <XCircle size={16} className="text-red-600" />;
      default: return null;
    }
  };

  // Render view mode
  const renderViewMode = () => (
    <div className="space-y-6">
      {/* Status và Priority */}
      <div className="flex gap-3 flex-wrap">
        <div className={`px-3 py-1.5 rounded-full text-sm font-medium flex items-center gap-2 ${statusConfig[rfq.status].bg} ${statusConfig[rfq.status].color}`}>
          {getStatusIcon(rfq.status)}
          {statusConfig[rfq.status].label}
        </div>

        {rfq.productionStage && productionStageConfig[rfq.productionStage as ProductionStage] && (
          <div className="px-3 py-1.5 rounded-full text-sm font-medium bg-blue-50 text-blue-600 border border-blue-200">
            Tiến độ: {productionStageConfig[rfq.productionStage as ProductionStage].label}
          </div>
        )}
      </div>

      {/* Thông tin khách hàng */}
      <div className="bg-slate-50/50 rounded-2xl p-5">
        <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
          <User size={20} /> Thông tin khách hàng
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center gap-2 text-slate-600">
            <User size={16} className="text-slate-500" /> {rfq.customerName}
          </div>
          <div className="flex items-center gap-2 text-slate-600">
            <Phone size={16} className="text-slate-500" /> {rfq.customerPhone || 'Chưa cập nhật'}
          </div>
          <div className="flex items-center gap-2 text-slate-600">
            <Mail size={16} className="text-slate-500" /> {rfq.customerEmail || 'Chưa cập nhật'}
          </div>
        </div>
      </div>

      {/* Thông tin sản phẩm */}
      <div className="bg-slate-50/50 rounded-2xl p-5">
        <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
          <Package size={20} /> Thông tin sản phẩm
        </h3>
        <div className="space-y-4 pt-4 border-t border-slate-100">
          <h3 className="bg-slate-100 px-3 py-1.5 rounded-lg inline-block text-xs font-bold text-slate-600 uppercase tracking-widest">
            Danh sách sản phẩm ({rfq.items?.length || 0})
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {rfq.items?.map((item, idx) => (
              <div key={idx} className="bg-slate-50 border border-slate-100 rounded-2xl p-4">
                <div className="flex justify-between items-start mb-2">
                  <p className="text-slate-900 font-bold">{item.productType}</p>
                  <span className="bg-white border border-slate-200 px-2 py-1 rounded text-xs font-bold text-slate-700">SL: {item.quantity}</span>
                </div>
                <div className="space-y-2 mt-3 text-sm text-slate-600">
                  {item.dimensions && <p><span className="text-slate-400">Kích thước:</span> {item.dimensions}</p>}
                  {item.material && <p><span className="text-slate-400">Vật liệu:</span> {item.material}</p>}
                  {item.description && <p className="italic mt-2">"{item.description}"</p>}
                </div>
              </div>
            ))}
          </div>
          {rfq.description && (
            <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 mt-4">
              <p className="text-xs font-bold text-amber-600/60 uppercase tracking-widest mb-1">Ghi chú chung do khách nhập</p>
              <p className="text-sm text-amber-800">{rfq.description}</p>
            </div>
          )}
        </div>
      </div>

      {/* Bản vẽ / Tài liệu đính kèm */}
      {rfq.attachments && rfq.attachments.length > 0 && (
        <div className="bg-slate-50/50 rounded-2xl p-5">
          <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <Paperclip size={20} /> Bản vẽ / Tài liệu đính kèm ({rfq.attachments.length})
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {rfq.attachments.map((url, idx) => {
              const fullUrl = getFileUrl(url);
              const fileName = decodeURIComponent(url.split('/').pop() || `File ${idx + 1}`);
              const isImage = /\.(jpg|jpeg|png|gif|webp|bmp|svg)$/i.test(url);
              return (
                <a
                  key={idx}
                  href={fullUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group block bg-white border border-slate-200 rounded-xl overflow-hidden hover:border-blue-400 hover:shadow-md transition-all"
                >
                  {isImage ? (
                    <div className="aspect-video bg-slate-100 flex items-center justify-center overflow-hidden">
                      <img src={fullUrl} alt={fileName} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    </div>
                  ) : (
                    <div className="aspect-video bg-slate-50 flex flex-col items-center justify-center gap-2">
                      <FileText size={32} className="text-slate-400" />
                    </div>
                  )}
                  <div className="px-3 py-2 flex items-center justify-between gap-2">
                    <p className="text-xs text-slate-600 truncate flex-1" title={fileName}>{fileName}</p>
                    <Download size={14} className="text-slate-400 group-hover:text-blue-600 shrink-0" />
                  </div>
                </a>
              );
            })}
          </div>
        </div>
      )}

      {/* Ghi chú */}
      {(rfq.salesNotes || rfq.engineerNotes) && (
        <div className="bg-slate-50/50 rounded-2xl p-5">
          <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <FileText size={20} /> Ghi chú
          </h3>
          {rfq.salesNotes && (
            <div className="mb-4">
              <p className="text-blue-600 text-sm mb-2">📝 Ghi chú từ Sales:</p>
              <p className="text-slate-600 bg-slate-50 p-3 rounded-xl">{rfq.salesNotes}</p>
            </div>
          )}
          {rfq.engineerNotes && (
            <div>
              <p className="text-purple-400 text-sm mb-2">🔧 Ghi chú từ Kỹ thuật:</p>
              <p className="text-slate-600 bg-slate-50 p-3 rounded-xl">{rfq.engineerNotes}</p>
            </div>
          )}
        </div>
      )}

      {/* Customer Feedback */}
      {rfq.feedback && (
        <div className="bg-gradient-to-br from-amber-50 to-amber-100/50 rounded-2xl p-5 border border-amber-200 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-amber-200/20 rounded-full blur-2xl transform translate-x-10 -translate-y-10"></div>
          <h3 className="text-lg font-semibold text-amber-900 mb-4 flex items-center gap-2 relative z-10">
            <Star size={20} className="text-amber-500 fill-amber-500" /> Đánh giá từ Khách hàng
          </h3>
          <div className="relative z-10">
            <div className="flex gap-1 mb-3">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star 
                  key={star} 
                  size={20} 
                  className={star <= rfq.feedback!.rating ? 'text-amber-500 fill-amber-500' : 'text-amber-200/50 fill-amber-200/50'} 
                />
              ))}
            </div>
            {rfq.feedback.comment && (
              <p className="text-amber-900/80 italic font-medium bg-white/60 p-4 rounded-xl border border-amber-200/50 backdrop-blur-sm">"{rfq.feedback.comment}"</p>
            )}
            <p className="text-xs text-amber-700/60 mt-3 flex items-center gap-1">
              <Calendar size={12} /> Gửi lúc {new Date(rfq.feedback.createdAt).toLocaleString('vi-VN')}
            </p>
          </div>
        </div>
      )}

      {/* Thời gian */}
      <div className="flex justify-between text-sm text-slate-500 pt-4 border-t border-slate-200">
        <div className="flex items-center gap-1">
          <Calendar size={14} /> Tạo: {new Date(rfq.createdAt).toLocaleString('vi-VN')}
        </div>
        <div className="flex items-center gap-1">
          <Calendar size={14} /> Cập nhật: {new Date(rfq.updatedAt).toLocaleString('vi-VN')}
        </div>
      </div>
    </div>
  );

  // Render edit mode
  const renderEditMode = () => (
    <div className="space-y-6">
      {/* Status */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm text-slate-600 mb-2">Trạng thái</label>
          <select
            value={editedRFQ?.status}
            onChange={(e) => handleChange('status', e.target.value as RFQStatus)}
            className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-blue-500"
          >
            {Object.entries(statusConfig).map(([key, { label }]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
        </div>

        {['approved', 'completed'].includes(editedRFQ?.status || '') && (
          <div className="md:col-span-2">
            <label className="block text-sm text-slate-600 mb-2">Tiến độ sản xuất (Production Stage)</label>
            <select
              value={editedRFQ?.productionStage || ''}
              onChange={(e) => handleChange('productionStage', e.target.value ? e.target.value as ProductionStage : null)}
              className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-blue-500"
            >
              <option value="">-- Chưa bắt đầu --</option>
              {Object.entries(productionStageConfig).map(([key, config]) => (
                <option key={key} value={key}>{config.label}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Thông tin khách hàng */}
      <div className="bg-slate-50/50 rounded-2xl p-5">
        <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
          <User size={20} /> Thông tin khách hàng
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-slate-600 mb-2">Tên khách hàng *</label>
            <input
              type="text"
              value={editedRFQ?.customerName}
              onChange={(e) => handleChange('customerName', e.target.value)}
              className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm text-slate-600 mb-2">Số điện thoại</label>
            <input
              type="tel"
              value={editedRFQ?.customerPhone}
              onChange={(e) => handleChange('customerPhone', e.target.value)}
              className={`w-full px-4 py-2 bg-slate-50 border rounded-xl text-slate-900 focus:outline-none focus:border-blue-500 ${phoneError ? 'border-red-500' : 'border-slate-200'}`}
              placeholder="09xx xxx xxx"
            />
            {phoneError && <p className="text-red-500 text-[10px] mt-1 font-medium">{phoneError}</p>}
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm text-slate-600 mb-2">Email</label>
            <input
              type="email"
              value={editedRFQ?.customerEmail}
              onChange={(e) => handleChange('customerEmail', e.target.value)}
              className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Danh sách sản phẩm */}
      <div className="bg-slate-50/50 rounded-2xl p-5">
        <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
          <Package size={20} /> Danh sách sản phẩm ({editedRFQ?.items?.length || 0})
        </h3>
        <div className="space-y-6">
          {editedRFQ?.items?.map((item, idx) => (
            <div key={idx} className="p-4 bg-white border border-slate-200 rounded-2xl space-y-4">
              <p className="text-xs font-black text-blue-600 uppercase tracking-widest">Món #{idx + 1}</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1 tracking-wider uppercase">Loại sản phẩm *</label>
                  <input
                    type="text"
                    value={item.productType}
                    onChange={(e) => {
                      const newItems = [...(editedRFQ?.items || [])];
                      newItems[idx] = { ...newItems[idx], productType: e.target.value };
                      handleChange('items', newItems);
                    }}
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1 tracking-wider uppercase">Số lượng</label>
                  <input
                    type="number"
                    min="1"
                    value={item.quantity}
                    onChange={(e) => {
                      const newItems = [...(editedRFQ?.items || [])];
                      newItems[idx] = { ...newItems[idx], quantity: parseInt(e.target.value) || 1 };
                      handleChange('items', newItems);
                    }}
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1 tracking-wider uppercase">Kích thước</label>
                  <input
                    type="text"
                    value={item.dimensions || ''}
                    onChange={(e) => {
                      const newItems = [...(editedRFQ?.items || [])];
                      newItems[idx] = { ...newItems[idx], dimensions: e.target.value };
                      handleChange('items', newItems);
                    }}
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1 tracking-wider uppercase">Vật liệu</label>
                  <input
                    type="text"
                    value={item.material || ''}
                    onChange={(e) => {
                      const newItems = [...(editedRFQ?.items || [])];
                      newItems[idx] = { ...newItems[idx], material: e.target.value };
                      handleChange('items', newItems);
                    }}
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1 tracking-wider uppercase">Mô tả sản phẩm</label>
                <textarea
                  rows={2}
                  value={item.description || ''}
                  onChange={(e) => {
                    const newItems = [...(editedRFQ?.items || [])];
                    newItems[idx] = { ...newItems[idx], description: e.target.value };
                    handleChange('items', newItems);
                  }}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4 pt-4 border-t border-slate-200 grid grid-cols-1 md:grid-cols-2 gap-4">
           <div>
            <label className="block text-xs font-bold text-slate-500 mb-2 tracking-wider uppercase">Ghi chú chung của đơn</label>
            <textarea
              rows={2}
              value={editedRFQ?.description || ''}
              onChange={(e) => handleChange('description', e.target.value)}
              className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-blue-500 italic text-sm"
              placeholder="Ghi chú tổng quát..."
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-2 tracking-wider uppercase">Ngày dự kiến *</label>
            <input
              type="date"
              required
              min={new Date().toISOString().split('T')[0]}
              value={editedRFQ?.expectedDate || ''}
              onChange={(e) => handleChange('expectedDate', e.target.value)}
              className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Ghi chú */}
      <div className="bg-slate-50/50 rounded-2xl p-5">
        <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
          <FileText size={20} /> Ghi chú
        </h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-slate-600 mb-2">📝 Ghi chú từ Sales</label>
            <textarea
              rows={2}
              value={editedRFQ?.salesNotes || ''}
              onChange={(e) => handleChange('salesNotes', e.target.value)}
              placeholder="Ghi chú từ bộ phận Sales..."
              className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm text-slate-600 mb-2">🔧 Ghi chú từ Kỹ thuật</label>
            <textarea
              rows={2}
              value={editedRFQ?.engineerNotes || ''}
              onChange={(e) => handleChange('engineerNotes', e.target.value)}
              placeholder="Ghi chú từ bộ phận Kỹ thuật..."
              className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>
      </div>
    </div>
  );

  // Confirmation Modal
  const renderConfirmModal = () => (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl p-6 max-w-md w-full border border-slate-200">
        <h3 className="text-xl font-bold text-slate-900 mb-2">Xác nhận lưu thay đổi</h3>
        <p className="text-slate-500 mb-6">Bạn có chắc chắn muốn lưu các thay đổi này?</p>
        <div className="flex gap-3">
          <button
            onClick={confirmSave}
            className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition"
          >
            Lưu thay đổi
          </button>
          <button
            onClick={() => setShowConfirm(false)}
            className="flex-1 py-2 bg-slate-50 hover:bg-slate-100 text-slate-900 rounded-xl transition"
          >
            Hủy
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl w-full max-w-3xl max-h-[90vh] overflow-y-auto border border-slate-200">
          <div className="sticky top-0 bg-white border-b border-slate-200 p-6 flex justify-between items-center z-10">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">Chi tiết yêu cầu</h2>
              <p className="text-slate-500 text-sm mt-1">Mã: {rfq.code}</p>
            </div>
            <div className="flex gap-2">
              {!isEditing ? (
                <button
                  onClick={handleEdit}
                  className="p-2 hover:bg-slate-50 rounded-xl transition flex items-center gap-2"
                >
                  <Edit2 size={20} className="text-blue-600" />
                  <span className="text-blue-600 hidden sm:inline">Chỉnh sửa</span>
                </button>
              ) : (
                <>
                  <button
                    onClick={handleSave}
                    className="p-2 hover:bg-slate-50 rounded-xl transition flex items-center gap-2"
                  >
                    <Save size={20} className="text-emerald-600" />
                    <span className="text-emerald-600 hidden sm:inline">Lưu</span>
                  </button>
                  <button
                    onClick={handleCancel}
                    className="p-2 hover:bg-slate-50 rounded-xl transition flex items-center gap-2"
                  >
                    <X size={20} className="text-red-600" />
                    <span className="text-red-600 hidden sm:inline">Hủy</span>
                  </button>
                </>
              )}
              <button
                onClick={onClose}
                className="p-2 hover:bg-slate-50 rounded-xl transition"
              >
                <X size={24} />
              </button>
            </div>
          </div>

          <div className="p-6">
            {isEditing ? renderEditMode() : renderViewMode()}
            
            {/* Chat Box Transition Button */}
            <div className="mt-6 pt-6 border-t border-slate-200">
              <div className="bg-blue-50 border border-blue-100 rounded-2xl p-6 flex flex-col items-center justify-center text-center">
                <MessageSquare size={32} className="text-blue-500 mb-3" />
                <h3 className="font-semibold text-slate-900 mb-1">Trao đổi trực tiếp</h3>
                <p className="text-sm text-slate-600 mb-4">Các tin nhắn và trao đổi cho đơn hàng này đã được chuyển sang giao diện toàn màn hình.</p>
                <button
                  onClick={() => onOpenChat?.(rfq.id)}
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition shadow-sm"
                >
                  Mở tab Tin nhắn
                </button>
              </div>
            </div>
          </div>

          {/* Actions Footer */}
          <div className="sticky bottom-0 bg-white border-t border-slate-200 p-6 flex gap-3">
            {!isEditing ? (
              <>
                <button
                  onClick={handleEdit}
                  className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition flex items-center justify-center gap-2"
                >
                  <Edit2 size={20} />
                  Chỉnh sửa
                </button>
                <button
                  onClick={onClose}
                  className="flex-1 py-3 bg-slate-50 hover:bg-slate-100 text-slate-900 font-semibold rounded-xl transition"
                >
                  Đóng
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={handleSave}
                  className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl transition flex items-center justify-center gap-2"
                >
                  <Save size={20} />
                  Lưu thay đổi
                </button>
                <button
                  onClick={handleCancel}
                  className="flex-1 py-3 bg-slate-50 hover:bg-slate-100 text-slate-900 font-semibold rounded-xl transition"
                >
                  Hủy
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirm && renderConfirmModal()}
    </>
  );
}