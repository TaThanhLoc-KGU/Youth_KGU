import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { Upload, Trash2, Star, Stamp } from 'lucide-react';
import kySoService from '../../services/kySoService';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';

export default function ConDauManagePage() {
  const qc = useQueryClient();
  const fileRef = useRef(null);

  const [form, setForm] = useState({
    ten: '',
    laMacDinh: false,
    file: null,
    preview: null,
  });
  const [uploading, setUploading] = useState(false);

  const { data: list = [], isLoading } = useQuery({
    queryKey: ['con-dau'],
    queryFn: kySoService.getAllConDau,
  });

  const deleteMut = useMutation({
    mutationFn: (id) => kySoService.deleteConDau(id),
    onSuccess: () => {
      toast.success('Đã xóa con dấu');
      qc.invalidateQueries({ queryKey: ['con-dau'] });
    },
    onError: () => toast.error('Xóa thất bại'),
  });

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setForm((f) => ({ ...f, file, preview: ev.target.result }));
    reader.readAsDataURL(file);
  };

  const handleUpload = async () => {
    if (!form.file) { toast.error('Vui lòng chọn file ảnh con dấu'); return; }
    if (!form.ten.trim()) { toast.error('Vui lòng nhập tên con dấu'); return; }
    setUploading(true);
    try {
      await kySoService.uploadConDau(form.file, form.ten, form.laMacDinh);
      toast.success('Tải con dấu thành công');
      qc.invalidateQueries({ queryKey: ['con-dau'] });
      setForm({ ten: '', laMacDinh: false, file: null, preview: null });
      if (fileRef.current) fileRef.current.value = '';
    } catch {
      toast.error('Tải con dấu thất bại');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <Stamp className="w-5 h-5 text-red-600" />
          Quản lý Con dấu
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          Upload ảnh con dấu (PNG nền trong suốt) để đóng dấu trên PDF xuất danh sách.
        </p>
      </div>

      {/* Form upload */}
      <Card className="mb-6">
        <h2 className="font-semibold text-gray-800 mb-4">Thêm con dấu mới</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Preview */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              File ảnh con dấu <span className="text-red-500">*</span>
            </label>
            <div
              className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center cursor-pointer hover:border-red-400 transition-colors min-h-[140px] flex flex-col items-center justify-center"
              onClick={() => fileRef.current?.click()}
            >
              {form.preview ? (
                <img src={form.preview} alt="preview" className="max-h-28 object-contain" />
              ) : (
                <>
                  <Stamp className="w-10 h-10 text-gray-300 mb-2" />
                  <span className="text-sm text-gray-500">Click để chọn ảnh PNG/JPG</span>
                  <span className="text-xs text-gray-400 mt-1">Khuyến nghị: PNG nền trong suốt (con dấu tròn)</span>
                </>
              )}
            </div>
            <input
              ref={fileRef}
              type="file"
              accept="image/png,image/jpeg"
              className="hidden"
              onChange={handleFileChange}
            />
          </div>

          {/* Thông tin */}
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tên con dấu <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                className="input input-bordered input-sm w-full"
                placeholder="VD: Con dấu Đoàn trường ĐH Kiên Giang"
                value={form.ten}
                onChange={(e) => setForm((f) => ({ ...f, ten: e.target.value }))}
              />
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                className="checkbox checkbox-primary checkbox-sm"
                checked={form.laMacDinh}
                onChange={(e) => setForm((f) => ({ ...f, laMacDinh: e.target.checked }))}
              />
              <span className="text-sm text-gray-700">Đặt làm mặc định</span>
            </label>
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-700">
              <strong>Lưu ý:</strong> Con dấu sẽ được in chồng lên vị trí ký của BTV Đoàn trường
              ở trang cuối danh sách. Khuyến nghị dùng ảnh PNG nền trong suốt để đẹp hơn.
            </div>
            <Button
              variant="primary"
              size="sm"
              onClick={handleUpload}
              isLoading={uploading}
              className="w-full"
            >
              <Upload className="w-4 h-4 mr-1" /> Tải lên
            </Button>
          </div>
        </div>
      </Card>

      {/* Danh sách */}
      <Card>
        <h2 className="font-semibold text-gray-800 mb-4">Danh sách con dấu ({list.length})</h2>
        {isLoading ? (
          <div className="flex justify-center py-8">
            <span className="loading loading-spinner loading-md text-primary" />
          </div>
        ) : list.length === 0 ? (
          <p className="text-center text-gray-400 py-8">Chưa có con dấu nào</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {list.map((cd) => (
              <div key={cd.id} className="border rounded-lg p-3 relative hover:shadow-md transition-shadow bg-white">
                {cd.laMacDinh && (
                  <span className="absolute top-2 right-2 flex items-center gap-1 text-xs text-yellow-600 bg-yellow-50 px-1.5 py-0.5 rounded">
                    <Star className="w-3 h-3 fill-yellow-500 text-yellow-500" /> Mặc định
                  </span>
                )}
                <div className="bg-[url('data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%2216%22 height=%2216%22%3E%3Crect width=%228%22 height=%228%22 fill=%22%23e5e7eb%22/%3E%3Crect x=%228%22 y=%228%22 width=%228%22 height=%228%22 fill=%22%23e5e7eb%22/%3E%3C/svg%3E')] rounded mb-2 flex items-center justify-center h-24 overflow-hidden">
                  <img
                    src={`http://localhost:8080${cd.duongDan}`}
                    alt={cd.ten}
                    className="max-h-full max-w-full object-contain"
                    onError={(e) => { e.target.style.display = 'none'; }}
                  />
                </div>
                <p className="font-medium text-sm text-gray-900 truncate">{cd.ten}</p>
                <button
                  className="mt-2 w-full flex items-center justify-center gap-1 text-xs text-red-500 hover:bg-red-50 rounded py-1 transition-colors"
                  onClick={() => {
                    if (window.confirm(`Xóa con dấu "${cd.ten}"?`)) deleteMut.mutate(cd.id);
                  }}
                >
                  <Trash2 className="w-3 h-3" /> Xóa
                </button>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
