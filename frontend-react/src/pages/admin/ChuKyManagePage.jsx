import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { Upload, Trash2, Star, PenLine, Wand2 } from 'lucide-react';
import kySoService from '../../services/kySoService';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import { removeSignatureBackground } from '../../utils/removeSignatureBackground';

const CHECKER_BG = "bg-[url('data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%2216%22 height=%2216%22%3E%3Crect width=%228%22 height=%228%22 fill=%22%23e5e7eb%22/%3E%3Crect x=%228%22 y=%228%22 width=%228%22 height=%228%22 fill=%22%23e5e7eb%22/%3E%3C/svg%3E')]";

export default function ChuKyManagePage() {
  const qc = useQueryClient();
  const fileRef = useRef(null);

  const [form, setForm] = useState({
    tenNguoiKy: '',
    chucVu: '',
    laMacDinh: false,
    originalFile: null,
    file: null,
    preview: null,
    autoRemoveBg: true,
  });
  const [uploading, setUploading] = useState(false);
  const [processingBg, setProcessingBg] = useState(false);

  const { data: list = [], isLoading } = useQuery({
    queryKey: ['chu-ky'],
    queryFn: kySoService.getAllChuKy,
  });

  const deleteMut = useMutation({
    mutationFn: (id) => kySoService.deleteChuKy(id),
    onSuccess: () => {
      toast.success('Đã xóa chữ ký');
      qc.invalidateQueries({ queryKey: ['chu-ky'] });
    },
    onError: () => toast.error('Xóa thất bại'),
  });

  const previewFile = (file) => new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (ev) => resolve(ev.target.result);
    reader.readAsDataURL(file);
  });

  const applyFile = async (originalFile, autoRemoveBg) => {
    setProcessingBg(autoRemoveBg);
    const finalFile = autoRemoveBg ? await removeSignatureBackground(originalFile) : originalFile;
    const preview = await previewFile(finalFile);
    setForm((f) => ({ ...f, originalFile, file: finalFile, preview }));
    setProcessingBg(false);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    applyFile(file, form.autoRemoveBg);
  };

  const handleToggleAutoRemoveBg = (checked) => {
    setForm((f) => ({ ...f, autoRemoveBg: checked }));
    if (form.originalFile) applyFile(form.originalFile, checked);
  };

  const handleUpload = async () => {
    if (!form.file) { toast.error('Vui lòng chọn file ảnh chữ ký'); return; }
    if (!form.tenNguoiKy.trim()) { toast.error('Vui lòng nhập tên người ký'); return; }
    setUploading(true);
    try {
      await kySoService.uploadChuKy(form.file, form.tenNguoiKy, form.chucVu, form.laMacDinh);
      toast.success('Tải chữ ký thành công');
      qc.invalidateQueries({ queryKey: ['chu-ky'] });
      setForm({ tenNguoiKy: '', chucVu: '', laMacDinh: false, originalFile: null, file: null, preview: null, autoRemoveBg: true });
      if (fileRef.current) fileRef.current.value = '';
    } catch {
      toast.error('Tải chữ ký thất bại');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <PenLine className="w-5 h-5 text-blue-600" />
          Quản lý Chữ ký
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          Upload ảnh chữ ký để sử dụng khi xuất danh sách PDF — nền giấy sẽ được tự động xóa, chỉ giữ lại nét ký.
        </p>
      </div>

      {/* Form upload */}
      <Card className="mb-6">
        <h2 className="font-semibold text-gray-800 mb-4">Thêm chữ ký mới</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Preview */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              File ảnh chữ ký <span className="text-red-500">*</span>
            </label>
            <div
              className={`border-2 border-dashed border-gray-300 rounded-lg p-4 text-center cursor-pointer hover:border-blue-400 transition-colors min-h-[120px] flex flex-col items-center justify-center ${form.preview ? CHECKER_BG : ''}`}
              onClick={() => fileRef.current?.click()}
            >
              {processingBg ? (
                <span className="text-sm text-gray-500">Đang xóa nền...</span>
              ) : form.preview ? (
                <img src={form.preview} alt="preview" className="max-h-24 object-contain" />
              ) : (
                <>
                  <Upload className="w-8 h-8 text-gray-400 mb-2" />
                  <span className="text-sm text-gray-500">Click để chọn ảnh PNG/JPG</span>
                  <span className="text-xs text-gray-400 mt-1">Nền sẽ được tự động xóa</span>
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
            <label className="flex items-center gap-2 cursor-pointer mt-2">
              <input
                type="checkbox"
                className="checkbox checkbox-primary checkbox-sm"
                checked={form.autoRemoveBg}
                onChange={(e) => handleToggleAutoRemoveBg(e.target.checked)}
              />
              <span className="text-sm text-gray-700 flex items-center gap-1">
                <Wand2 className="w-3.5 h-3.5 text-gray-400" /> Tự động xóa nền
              </span>
            </label>
          </div>

          {/* Thông tin */}
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tên người ký <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                className="input input-bordered input-sm w-full"
                placeholder="VD: Nguyễn Thị Kim Phước"
                value={form.tenNguoiKy}
                onChange={(e) => setForm((f) => ({ ...f, tenNguoiKy: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Chức vụ</label>
              <input
                type="text"
                className="input input-bordered input-sm w-full"
                placeholder="VD: BÍ THƯ, PHÓ BÍ THƯ"
                value={form.chucVu}
                onChange={(e) => setForm((f) => ({ ...f, chucVu: e.target.value }))}
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
        <h2 className="font-semibold text-gray-800 mb-4">Danh sách chữ ký ({list.length})</h2>
        {isLoading ? (
          <div className="flex justify-center py-8">
            <span className="loading loading-spinner loading-md text-primary" />
          </div>
        ) : list.length === 0 ? (
          <p className="text-center text-gray-400 py-8">Chưa có chữ ký nào</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {list.map((ck) => (
              <div key={ck.id} className="border rounded-lg p-3 relative group hover:shadow-md transition-shadow bg-white">
                {ck.laMacDinh && (
                  <span className="absolute top-2 right-2 flex items-center gap-1 text-xs text-yellow-600 bg-yellow-50 px-1.5 py-0.5 rounded">
                    <Star className="w-3 h-3 fill-yellow-500 text-yellow-500" /> Mặc định
                  </span>
                )}
                {/* Ảnh chữ ký trên nền checker */}
                <div className="bg-[url('data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%2216%22 height=%2216%22%3E%3Crect width=%228%22 height=%228%22 fill=%22%23e5e7eb%22/%3E%3Crect x=%228%22 y=%228%22 width=%228%22 height=%228%22 fill=%22%23e5e7eb%22/%3E%3C/svg%3E')] rounded mb-2 flex items-center justify-center h-20 overflow-hidden">
                  <img
                    src={`http://localhost:8080${ck.duongDan}`}
                    alt={ck.tenNguoiKy}
                    className="max-h-full max-w-full object-contain"
                    onError={(e) => { e.target.style.display = 'none'; }}
                  />
                </div>
                <p className="font-medium text-sm text-gray-900 truncate">{ck.tenNguoiKy}</p>
                {ck.chucVu && <p className="text-xs text-gray-500">{ck.chucVu}</p>}
                <button
                  className="mt-2 w-full flex items-center justify-center gap-1 text-xs text-red-500 hover:bg-red-50 rounded py-1 transition-colors"
                  onClick={() => {
                    if (window.confirm(`Xóa chữ ký của "${ck.tenNguoiKy}"?`)) {
                      deleteMut.mutate(ck.id);
                    }
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
