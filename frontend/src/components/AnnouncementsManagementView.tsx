import { useState, useEffect } from 'react';
import { Megaphone, Plus, Trash2, Edit, Save, X, Upload, Image as ImageIcon } from 'lucide-react';
import { getAnnouncementsAPI, createAnnouncementAPI, updateAnnouncementAPI, deleteAnnouncementAPI, type Announcement } from '../api/announcement';
import { uploadFilesAPI } from '../api/upload';
import { getFileUrl } from '../utils/fileUrl';

export default function AnnouncementsManagementView() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  // Form state
  const [formData, setFormData] = useState<Partial<Announcement>>({
    title: '',
    content: '',
    imageUrl: '',
    isActive: true
  });

  // Preview state (for newly selected file before upload)
  const [previewFile, setPreviewFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');

  const fetchAnnouncements = async () => {
    setIsLoading(true);
    try {
      const data = await getAnnouncementsAPI();
      setAnnouncements(data);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  // Clean up preview URL on unmount
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate image type
    if (!file.type.startsWith('image/')) {
      alert('Vui lòng chọn file hình ảnh!');
      return;
    }

    setPreviewFile(file);
    // Create local preview
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleRemoveImage = () => {
    setPreviewFile(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl('');
    setFormData({ ...formData, imageUrl: '' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      let imageUrl = formData.imageUrl || '';

      // Upload new image if selected
      if (previewFile) {
        setIsUploading(true);
        try {
          const res = await uploadFilesAPI([previewFile]);
          imageUrl = res.urls?.[0] || '';
        } catch {
          alert('Lỗi khi tải ảnh lên!');
          setIsUploading(false);
          return;
        }
        setIsUploading(false);
      }

      const payload = { ...formData, imageUrl };

      if (editingId) {
        await updateAnnouncementAPI(editingId, payload);
      } else {
        await createAnnouncementAPI(payload);
      }
      setIsAdding(false);
      setEditingId(null);
      setFormData({ title: '', content: '', imageUrl: '', isActive: true });
      setPreviewFile(null);
      setPreviewUrl('');
      fetchAnnouncements();
    } catch (e) {
      alert('Lỗi khi lưu thông báo');
    }
  };

  const handleEdit = (news: Announcement) => {
    setFormData({
      title: news.title,
      content: news.content,
      imageUrl: news.imageUrl,
      isActive: news.isActive
    });
    setEditingId(news._id);
    setIsAdding(true);
    setPreviewFile(null);
    setPreviewUrl('');
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Xóa thông báo này?')) {
      try {
        await deleteAnnouncementAPI(id);
        fetchAnnouncements();
      } catch (e) {
        alert('Lỗi khi xóa');
      }
    }
  };

  const handleCancel = () => {
    setIsAdding(false);
    setEditingId(null);
    setFormData({ title: '', content: '', imageUrl: '', isActive: true });
    setPreviewFile(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl('');
  };

  // Get the display image URL (either local preview or existing server URL)
  const displayImageUrl = previewUrl || (formData.imageUrl ? getFileUrl(formData.imageUrl) : '');

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Quản lý Thông báo</h2>
          <p className="text-slate-500">Tạo tin tức và thông báo chung cho toàn bộ khách hàng</p>
        </div>
        {!isAdding && (
          <button
            onClick={() => setIsAdding(true)}
            className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-xl font-bold hover:bg-blue-700 transition shadow-lg shadow-blue-200"
          >
            <Plus size={20} /> Tạo thông báo mới
          </button>
        )}
      </div>

      {isAdding && (
        <div className="bg-white border border-slate-200 rounded-[2rem] p-8 shadow-xl animate-in fade-in slide-in-from-top-4">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold text-slate-900">{editingId ? 'Chỉnh sửa thông báo' : 'Tạo thông báo mới'}</h3>
            <button onClick={handleCancel} className="p-2 hover:bg-slate-50 rounded-full transition text-slate-400">
              <X size={24} />
            </button>
          </div>
          <form onSubmit={handleSubmit} className="flex gap-8">
            {/* Left: Form fields */}
            <div className="flex-1 space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">Tiêu đề</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={e => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                  placeholder="Nhập tiêu đề thông báo..."
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">Hình ảnh</label>
                <div className="relative">
                  <label className="flex items-center gap-3 px-4 py-3 rounded-xl border-2 border-dashed border-slate-300 hover:border-blue-400 hover:bg-blue-50/50 transition cursor-pointer">
                    <Upload size={20} className="text-slate-400" />
                    <span className="text-sm text-slate-500">
                      {previewFile ? previewFile.name : 'Chọn ảnh để tải lên...'}
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">Nội dung</label>
                <textarea
                  required
                  rows={6}
                  value={formData.content}
                  onChange={e => setFormData({ ...formData, content: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none transition resize-none"
                  placeholder="Nhập nội dung thông báo kỹ chi tiết..."
                />
              </div>

              <div className="flex items-center gap-4 pt-4 border-t border-slate-50">
                <button
                  type="submit"
                  disabled={isUploading}
                  className="flex items-center gap-2 bg-blue-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-blue-700 transition disabled:bg-slate-300 disabled:shadow-none"
                >
                  <Save size={20} /> {isUploading ? 'Đang tải ảnh...' : (editingId ? 'Cập nhật' : 'Đăng thông báo')}
                </button>
                <button type="button" onClick={handleCancel} className="px-6 py-3 rounded-xl font-bold text-slate-500 hover:bg-slate-50 transition border border-transparent">
                  Hủy
                </button>
              </div>
            </div>

            {/* Right: Image preview */}
            <div className="w-72 shrink-0">
              <label className="text-sm font-bold text-slate-700 block mb-2">Xem trước</label>
              <div className="aspect-[4/3] rounded-2xl border-2 border-dashed border-slate-200 overflow-hidden bg-slate-50 flex items-center justify-center relative">
                {displayImageUrl ? (
                  <>
                    <img
                      src={displayImageUrl}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={handleRemoveImage}
                      className="absolute top-2 right-2 p-1.5 bg-black/50 hover:bg-black/70 text-white rounded-full transition"
                    >
                      <X size={14} />
                    </button>
                  </>
                ) : (
                  <div className="text-center p-4">
                    <ImageIcon size={40} className="text-slate-300 mx-auto mb-2" />
                    <p className="text-xs text-slate-400">Chưa có ảnh</p>
                  </div>
                )}
              </div>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4">
        {announcements.map(news => (
          <div key={news._id} className="bg-white border border-slate-200 rounded-2xl p-6 flex justify-between items-start gap-4 hover:shadow-md transition">
            <div className="flex gap-6 flex-1">
              {news.imageUrl && (
                <div className="w-24 h-24 rounded-xl overflow-hidden shrink-0">
                  <img src={getFileUrl(news.imageUrl)} alt="" className="w-full h-full object-cover" />
                </div>
              )}
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <span className="text-xs text-slate-400">{new Date(news.createdAt).toLocaleDateString('vi-VN')}</span>
                </div>
                <h4 className="font-bold text-slate-900 text-lg">{news.title}</h4>
                <p className="text-sm text-slate-500 line-clamp-2 mt-1">{news.content}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => handleEdit(news)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition">
                <Edit size={18} />
              </button>
              <button onClick={() => handleDelete(news._id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition">
                <Trash2 size={18} />
              </button>
            </div>
          </div>
        ))}

        {announcements.length === 0 && !isLoading && (
          <div className="text-center py-20 bg-slate-50 rounded-[2rem] border-2 border-dashed border-slate-200">
            <Megaphone className="mx-auto text-slate-300 mb-4" size={48} />
            <p className="text-slate-400 font-medium">Chưa có thông báo nào được tạo.</p>
          </div>
        )}
      </div>
    </div>
  );
}
