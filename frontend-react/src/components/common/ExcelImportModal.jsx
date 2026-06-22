import { useState, useRef } from 'react';
import { Upload, FileDown, AlertCircle, CheckCircle2, XCircle, Info } from 'lucide-react';
import { toast } from 'react-toastify';
import Modal from './Modal';
import Button from './Button';
import Badge from './Badge';

const ExcelImportModal = ({ 
  isOpen, 
  onClose, 
  title = "Nhập dữ liệu từ Excel",
  onDownloadTemplate,
  onPreview,
  onImport,
  onSuccess,
  entityName = "bản ghi"
}) => {
  const [file, setFile] = useState(null);
  const [previewData, setPreviewData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState(1); // 1: Upload, 2: Preview & Confirm
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      if (!selectedFile.name.match(/\.(xlsx|xls)$/)) {
        toast.error('Vui lòng chọn file Excel (.xlsx hoặc .xls)');
        return;
      }
      setFile(selectedFile);
      handlePreview(selectedFile);
    }
  };

  const handlePreview = async (selectedFile) => {
    setIsLoading(true);
    try {
      const data = await onPreview(selectedFile);
      setPreviewData(data);
      setStep(2);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Lỗi đọc file Excel');
      setFile(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleImport = async () => {
    if (!previewData || previewData.validData.length === 0) {
      toast.warn('Không có dữ liệu hợp lệ để nhập');
      return;
    }

    setIsLoading(true);
    try {
      await onImport(previewData.validData);
      toast.success(`Đã nhập thành công ${previewData.validData.length} ${entityName}`);
      onSuccess?.();
      handleClose();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Lỗi khi nhập dữ liệu');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setFile(null);
    setPreviewData(null);
    setStep(1);
    setIsLoading(false);
    onClose();
  };

  const resetFile = () => {
    setFile(null);
    setPreviewData(null);
    setStep(1);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={title} size="xl">
      <div className="space-y-6">
        {step === 1 ? (
          <div className="space-y-6">
            <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl flex gap-3">
              <Info className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-700">
                <p className="font-semibold mb-1">Hướng dẫn nhập liệu:</p>
                <ul className="list-disc ml-4 space-y-1">
                  <li>Sử dụng đúng file template được cung cấp.</li>
                  <li>Không thay đổi tên hoặc thứ tự các cột.</li>
                  <li>Các trường đánh dấu (*) là bắt buộc.</li>
                  <li>Hệ thống sẽ tự động cập nhật nếu mã đã tồn tại.</li>
                </ul>
              </div>
            </div>

            <div className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-2xl p-10 hover:border-blue-400 hover:bg-blue-50 transition-all cursor-pointer group"
                 onClick={() => fileInputRef.current?.click()}>
              <input 
                type="file" 
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden" 
                accept=".xlsx, .xls"
              />
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Upload className="w-8 h-8 text-blue-600" />
              </div>
              <p className="text-lg font-semibold text-gray-700">Click để chọn file hoặc kéo thả</p>
              <p className="text-sm text-gray-500 mt-1">Hỗ trợ file Excel (.xlsx, .xls)</p>
            </div>

            <div className="flex justify-between items-center">
              <Button variant="outline" icon={FileDown} onClick={onDownloadTemplate}>
                Tải file mẫu
              </Button>
              <Button variant="ghost" onClick={handleClose}>
                Hủy bỏ
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                <div className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-1">Tổng số dòng</div>
                <div className="text-2xl font-bold text-gray-900">{previewData?.totalRows || 0}</div>
              </div>
              <div className="bg-green-50 p-4 rounded-xl border border-green-100">
                <div className="text-xs text-green-600 uppercase font-bold tracking-wider mb-1">Hợp lệ (Sẵn sàng)</div>
                <div className="text-2xl font-bold text-green-700">{previewData?.validRows || 0}</div>
              </div>
              <div className="bg-red-50 p-4 rounded-xl border border-red-100">
                <div className="text-xs text-red-600 uppercase font-bold tracking-wider mb-1">Bị lỗi (Bỏ qua)</div>
                <div className="text-2xl font-bold text-red-700">{previewData?.errorRows || 0}</div>
              </div>
            </div>

            {/* Error Details */}
            {previewData?.errors?.length > 0 && (
              <div className="border border-red-200 rounded-xl overflow-hidden">
                <div className="bg-red-50 px-4 py-2 border-b border-red-200 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-600" />
                  <span className="text-sm font-bold text-red-700">Chi tiết lỗi ({previewData.errors.length})</span>
                </div>
                <div className="max-h-48 overflow-y-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 text-gray-600 sticky top-0">
                      <tr>
                        <th className="px-4 py-2 text-left font-medium">Dòng</th>
                        <th className="px-4 py-2 text-left font-medium">Cột/Trường</th>
                        <th className="px-4 py-2 text-left font-medium">Nội dung lỗi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {previewData.errors.map((error, idx) => (
                        <tr key={idx} className="hover:bg-red-50/30 transition-colors">
                          <td className="px-4 py-2 font-mono text-gray-500">{error.rowNumber}</td>
                          <td className="px-4 py-2 font-medium text-gray-700">{error.field}</td>
                          <td className="px-4 py-2 text-red-600">{error.errorMessage}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-between items-center pt-4 border-t">
              <div className="flex gap-2">
                <Button variant="outline" onClick={resetFile}>
                  Chọn file khác
                </Button>
              </div>
              <div className="flex gap-2">
                <Button variant="ghost" onClick={handleClose}>
                  Hủy
                </Button>
                <Button 
                  onClick={handleImport} 
                  loading={isLoading}
                  disabled={!previewData || previewData.validRows === 0}
                  icon={CheckCircle2}
                >
                  Xác nhận nhập dữ liệu
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default ExcelImportModal;
