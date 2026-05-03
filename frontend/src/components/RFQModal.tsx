// src/components/RFQModal.tsx
import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { type RFQ } from '../types/rfq';
import { uploadFilesAPI } from '../api/upload';

interface RFQModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (rfq: Partial<RFQ>) => void;
  rfq?: RFQ | null;
  initialData?: Partial<RFQ> | null;
}

const predefinedProductTypes = [
  'Bồn Bể Nhựa PP, PVC, FRP',
  'Thiết Bị Xử Lý Khí Thải, Nước Thải',
  'Quạt Hút Ly Tâm Chịu Hóa Chất A Xít',
  'Nhựa Kỹ Thuật',
  'Bồn Bể Nhựa PE',
  'Tủ Hút Khí Độc',
  'Trang Thiết Bị Phòng Thí Nghiệm',
  'Sản Phẩm Bằng Acrylic',
];
const predefinedDimensions = ['1000x500x300mm', '1500x1000x500mm', '2000x1000x1000mm', '2500x1500x1000mm', '3000x2000x1500mm'];
const predefinedMaterials = ['HDPE', 'PP', 'PVC', 'FRP', 'Acrylic', 'PE', 'PTFE'];

export default function RFQModal({ isOpen, onClose, onSubmit, rfq, initialData }: RFQModalProps) {
  const [formData, setFormData] = useState<Partial<RFQ>>({
    customerName: '',
    customerPhone: '',
    customerEmail: '',
    items: [{ productType: '', quantity: 1, dimensions: '', material: '', description: '' }],
    description: '',
    expectedDate: '',
    status: 'pending',
    attachments: [],
  });

  const [files, setFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [phoneError, setPhoneError] = useState('');

  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    setPhoneError('');
    if (rfq) {
      setFormData(rfq);
    } else {
      setFiles([]);
      setFormData({
        customerName: initialData?.customerName || '',
        customerPhone: initialData?.customerPhone || '',
        customerEmail: initialData?.customerEmail || '',
        items: initialData?.items || [{ productType: '', quantity: 1, dimensions: '', material: '', description: '' }],
        description: initialData?.description || '',
        expectedDate: initialData?.expectedDate || '',
        status: 'pending',
        attachments: [],
      });
    }
  }, [rfq, initialData, isOpen]);

  const handleAddItem = () => {
    const newItems = [...(formData.items || []), { productType: '', quantity: 1, dimensions: '', material: '', description: '' }];
    setFormData({ ...formData, items: newItems });
  };

  const handleRemoveItem = (index: number) => {
    if ((formData.items?.length || 0) <= 1) return;
    const newItems = formData.items?.filter((_, i) => i !== index);
    setFormData({ ...formData, items: newItems });
  };

  const handleItemChange = (index: number, field: keyof NonNullable<RFQ['items']>[0], value: any) => {
    const newItems = [...(formData.items || [])];
    newItems[index] = { ...newItems[index], [field]: value };
    setFormData({ ...formData, items: newItems });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.customerPhone) {
      const cleanedPhone = formData.customerPhone.replace(/\s/g, '');
      if (!/^(?:\+84|0)(?:3|5|7|8|9)\d{8}$/.test(cleanedPhone)) {
        setPhoneError('Số điện thoại không hợp lệ (VD: 0909123456 hoặc +84909123456)');
        return;
      }
    }
    setPhoneError('');

    // Kiểm tra sản phẩm tùy chỉnh đã được nhập tên chưa
    if (formData.items?.some(item => !item.productType || item.productType === '__custom__')) {
      alert('Vui lòng nhập tên sản phẩm tùy chỉnh!');
      return;
    }

    // Kiểm tra kích thước tùy chỉnh đã được nhập đủ chưa
    if (formData.items?.some(item => !item.dimensions || item.dimensions === '__custom__')) {
      alert('Vui lòng nhập đầy đủ kích thước!');
      return;
    }

    let uploadedUrls: string[] = [];
    if (files.length > 0) {
      setIsUploading(true);
      try {
        const res = await uploadFilesAPI(files);
        uploadedUrls = res.urls || [];
      } catch (err) {
        alert('Lỗi khi tải file lên!');
        setIsUploading(false);
        return;
      }
      setIsUploading(false);
    }

    onSubmit({
      ...formData,
      attachments: uploadedUrls.length > 0 ? [...(formData.attachments || []), ...uploadedUrls] : formData.attachments
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-y-auto border border-slate-200 shadow-2xl">
        <div className="sticky top-0 bg-white border-b border-slate-200 p-6 flex justify-between items-center z-10">
          <h2 className="text-2xl font-bold text-slate-900">
            {rfq ? 'Cập nhật yêu cầu' : 'Tạo yêu cầu báo giá mới'}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl transition">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-8">
          {/* Section 1: Thông tin khách hàng */}
          <div className="bg-slate-50/50 p-6 rounded-2xl border border-slate-200">
            <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
              <span className="w-8 h-8 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center text-sm">1</span>
              Thông tin khách hàng
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Tên khách hàng *</label>
                <input
                  type="text" required
                  value={formData.customerName}
                  onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                  className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-blue-500"
                  placeholder="Nhập tên khách hàng"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Số điện thoại *</label>
                <input
                  type="tel" required
                  value={formData.customerPhone}
                  onChange={(e) => {
                    const val = e.target.value.replace(/[^\d\s\+]/g, '').slice(0, 15);
                    setFormData({ ...formData, customerPhone: val });
                    if (phoneError) setPhoneError('');
                  }}
                  className={`w-full px-4 py-2 bg-white border rounded-xl text-slate-900 focus:outline-none focus:border-blue-500 ${phoneError ? 'border-red-500' : 'border-slate-200'}`}
                  placeholder="09xx xxx xxx"
                />
                {phoneError && <p className="text-red-500 text-[10px] mt-1 font-medium">{phoneError}</p>}
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Email liên hệ *</label>
                <input
                  type="email" required
                  value={formData.customerEmail}
                  onChange={(e) => setFormData({ ...formData, customerEmail: e.target.value })}
                  className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-blue-500"
                  placeholder="customer@company.com"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Danh sách sản phẩm */}
          <div className="bg-slate-50/50 p-6 rounded-2xl border border-slate-200">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <span className="w-8 h-8 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center text-sm">2</span>
                Mặt hàng cần báo giá
              </h3>
              <button
                type="button" onClick={handleAddItem}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-xl transition-all text-sm font-bold shadow-md shadow-blue-200"
              >
                + Thêm sản phẩm
              </button>
            </div>
            
            <div className="space-y-6">
              {formData.items?.map((item, index) => (
                <div key={index} className="relative p-6 bg-white rounded-2xl border border-slate-200 shadow-sm group">
                  {(formData.items?.length || 0) > 1 && (
                    <button
                      type="button" onClick={() => handleRemoveItem(index)}
                      className="absolute -top-3 -right-3 p-1.5 bg-white border border-slate-200 text-red-500 hover:bg-red-50 hover:text-red-600 rounded-full shadow-sm transition-all"
                    >
                      <X size={16} />
                    </button>
                  )}
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="md:col-span-2 lg:col-span-1">
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Sản phẩm *</label>
                      <select
                        required={!item.productType || item.productType === '__custom__'}
                        value={predefinedProductTypes.includes(item.productType) ? item.productType : (item.productType ? '__custom__' : '')}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val === '__custom__') {
                            handleItemChange(index, 'productType', '__custom__');
                          } else {
                            handleItemChange(index, 'productType', val);
                          }
                        }}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-blue-500 font-medium text-sm"
                      >
                        <option value="">Chọn loại sp</option>
                        {predefinedProductTypes.map(pt => <option key={pt} value={pt}>{pt}</option>)}
                        <option value="__custom__">Khác / Tùy chỉnh</option>
                      </select>
                      {!predefinedProductTypes.includes(item.productType) && item.productType !== '' && (
                        <input
                          type="text"
                          required
                          value={item.productType === '__custom__' ? '' : item.productType}
                          onChange={(e) => handleItemChange(index, 'productType', e.target.value || '__custom__')}
                          placeholder="Nhập tên sản phẩm tùy chỉnh..."
                          className="w-full mt-2 px-3 py-2 bg-white border border-blue-300 rounded-xl text-slate-900 focus:outline-none focus:border-blue-500 font-medium text-sm"
                        />
                      )}
                    </div>
                    
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Số lượng *</label>
                      <input
                        type="number" min="1" required
                        value={item.quantity}
                        onChange={(e) => handleItemChange(index, 'quantity', parseInt(e.target.value) || 1)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-blue-500 font-medium text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Kích thước *</label>
                      <select
                        required={!item.dimensions || item.dimensions === '__custom__'}
                        value={predefinedDimensions.includes(item.dimensions || '') ? item.dimensions : (item.dimensions ? '__custom__' : '')}
                        onChange={(e) => {
                          const val = e.target.value;
                          handleItemChange(index, 'dimensions', val === '__custom__' ? '__custom__' : val);
                        }}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-blue-500 font-medium text-sm"
                      >
                        <option value="">Chọn kích thước</option>
                        {predefinedDimensions.map(d => <option key={d} value={d}>{d}</option>)}
                        <option value="__custom__">Khác / Tùy chỉnh</option>
                      </select>
                      {!predefinedDimensions.includes(item.dimensions || '') && item.dimensions != null && item.dimensions !== '' && (
                        <input
                          type="text"
                          required
                          value={item.dimensions === '__custom__' ? '' : item.dimensions}
                          onChange={(e) => {
                            const val = e.target.value.replace(/[^0-9xX×.]/g, '').replace(/[X×]/g, 'x');
                            handleItemChange(index, 'dimensions', val || '__custom__');
                          }}
                          placeholder="VD: 1200x500x300"
                          className="w-full mt-2 px-4 py-3 bg-white border border-blue-300 rounded-xl text-slate-900 focus:outline-none focus:border-blue-500 font-medium text-sm"
                        />
                      )}
                    </div>

                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Vật liệu *</label>
                      <select
                        required
                        value={item.material || ''}
                        onChange={(e) => handleItemChange(index, 'material', e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-blue-500 font-medium text-sm"
                      >
                        <option value="">Chọn vật liệu</option>
                        {predefinedMaterials.map(m => <option key={m} value={m}>{m}</option>)}
                      </select>
                    </div>
                  </div>

                  <div className="mt-4">
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Yêu cầu chi tiết sản phẩm này *</label>
                    <textarea
                      required rows={2}
                      value={item.description || ''}
                      onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-blue-500 font-medium text-sm"
                      placeholder="Mô tả kỹ thuật cho riêng sản phẩm này..."
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section 3: Ghi chú & Đính kèm */}
          <div className="bg-slate-50/50 p-6 rounded-2xl border border-slate-200">
             <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
              <span className="w-8 h-8 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center text-sm">3</span>
              Ghi chú chung & Đính kèm
            </h3>
            <div className="space-y-6">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Đính kèm bản vẽ / tài liệu (Tùy chọn)</label>
                <div className="p-4 bg-white border border-slate-200 border-dashed rounded-2xl hover:border-blue-400 transition-all">
                  <input
                    type="file" multiple
                    onChange={(e) => {
                      if (e.target.files) setFiles(Array.from(e.target.files));
                    }}
                    className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  />
                  {files.length > 0 && (
                    <ul className="text-xs text-slate-500 mt-2 list-disc pl-5">
                      {files.map((f, i) => <li key={i}>{f.name}</li>)}
                    </ul>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Ngày dự kiến lấy hàng *</label>
                  <input
                    type="date"
                    required
                    min={today}
                    value={formData.expectedDate}
                    onChange={(e) => setFormData({ ...formData, expectedDate: e.target.value })}
                    className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Ghi chú chung cho toàn bộ đơn hàng</label>
                <textarea
                  rows={2}
                  value={formData.description || ''}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-blue-500 italic"
                  placeholder="Yêu cầu chung về vận chuyển, đóng gói..."
                />
              </div>
            </div>
          </div>

          <div className="pt-4 flex gap-4">
            <button
              type="button" onClick={onClose}
              className="flex-1 py-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-2xl transition"
            >
              Hủy bỏ
            </button>
            <button
              type="submit" disabled={isUploading}
              className="flex-[2] py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl transition shadow-xl shadow-blue-200 disabled:bg-slate-300 disabled:shadow-none"
            >
              {isUploading ? 'Đang xử lý...' : (rfq ? 'Cập nhật' : 'Gửi yêu cầu báo giá')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}