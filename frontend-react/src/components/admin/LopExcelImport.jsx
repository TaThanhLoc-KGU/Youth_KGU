import { useState, useRef } from 'react';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { Upload, Download, AlertCircle, Check, X } from 'lucide-react';
import lopService from '../../services/lopService';
import Button from '../common/Button';
import Card from '../common/Card';

const LopExcelImport = ({ onImportSuccess, onCancel }) => {
  const fileInputRef = useRef(null);
  const [fileName, setFileName] = useState(null);
  const [previewData, setPreviewData] = useState(null);
  const [confirmResult, setConfirmResult] = useState(null);
  const [uploadedFile, setUploadedFile] = useState(null);

  const previewMutation = useMutation({
    mutationFn: (file) => lopService.previewExcelImport(file),
    onSuccess: (result) => {
        setPreviewData(result);
        toast.success(`Tải preview thành công`);
    },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Lỗi tải preview');
    },
    }
  );

  const confirmMutation = useMutation({
    mutationFn: (file) => lopService.confirmExcelImport(file),
    onSuccess: (result) => {
        setConfirmResult(result);
        toast.success(
          `Nhập thành công ${result.successCount} lớp${
            result.failureCount > 0 ? `, thất bại ${result.failureCount}` : ''
          }`
        );
        if (result.successCount > 0) {
          onImportSuccess?.();
        }
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Lỗi nhập tệp');
    },
    }
  );

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = [
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ];

    if (!allowedTypes.includes(file.type)) {
      toast.error('Chỉ hỗ trợ file Excel (.xls, .xlsx)');
      return;
    }

    setFileName(file.name);
    setUploadedFile(file);
    setPreviewData(null);
    setConfirmResult(null);
    previewMutation.mutate(file);
  };

  const handleConfirmImport = () => {
    if (uploadedFile) {
      confirmMutation.mutate(uploadedFile);
    }
  };

  const handleReset = () => {
    setFileName(null);
    setPreviewData(null);
    setConfirmResult(null);
    setUploadedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      const blob = await lopService.downloadTemplate();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'template-lop.xlsx';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success('Đã tải template');
    } catch (error) {
      toast.error('Lỗi tải template');
    }
  };

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      {!previewData && !confirmResult && (
        <Card>
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Nhập danh sách lớp từ Excel
            </h3>

            <div className="space-y-4">
              {/* Template Download */}
              <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-center gap-2">
                  <Download className="w-5 h-5 text-blue-600" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      Tải template Excel
                    </p>
                    <p className="text-xs text-gray-600">
                      Tải file mẫu để xem cấu trúc dữ liệu
                    </p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDownloadTemplate}
                >
                  Tải Template
                </Button>
              </div>

              {/* File Input */}
              <div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xls,.xlsx"
                  onChange={handleFileSelect}
                  className="hidden"
                />

                <div
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                    previewMutation.isLoading
                      ? 'bg-gray-50 border-gray-300'
                      : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50'
                  }`}
                >
                  <Upload className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                  <p className="text-sm font-medium text-gray-900">
                    {fileName ? fileName : 'Chọn tệp Excel để nhập'}
                  </p>
                  <p className="text-xs text-gray-600 mt-1">
                    {previewMutation.isLoading
                      ? 'Đang xử lý...'
                      : 'Hoặc kéo thả tệp vào đây'}
                  </p>
                </div>
              </div>

              {/* Current Status */}
              {previewMutation.isLoading && (
                <div className="flex items-center gap-2 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                  <div className="animate-spin">
                    <Upload className="w-5 h-5 text-yellow-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      Đang xử lý tệp...
                    </p>
                    <p className="text-xs text-gray-600">
                      Vui lòng chờ trong khi chúng tôi kiểm tra dữ liệu
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </Card>
      )}

      {/* Preview Section */}
      {previewData && !confirmResult && (
        <>
          {/* Summary */}
          <Card>
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Xem trước dữ liệu
              </h3>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-sm text-gray-600">Tổng dòng</p>
                  <p className="text-2xl font-bold text-blue-600">{previewData.totalRows}</p>
                </div>
                <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                  <p className="text-sm text-gray-600">Dòng hợp lệ</p>
                  <p className="text-2xl font-bold text-green-600">{previewData.validRows}</p>
                </div>
                {previewData.errorRows > 0 && (
                  <div className="p-4 bg-red-50 rounded-lg border border-red-200 col-span-2">
                    <p className="text-sm text-gray-600">Lỗi: {previewData.errorRows} dòng</p>
                  </div>
                )}
              </div>
            </div>
          </Card>

          {/* Valid Data Preview */}
          {previewData.validData?.length > 0 && (
            <Card>
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Dữ liệu hợp lệ ({previewData.validRows})
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-200 bg-gray-50">
                        <th className="px-4 py-3 text-left font-medium text-gray-700">Mã lớp</th>
                        <th className="px-4 py-3 text-left font-medium text-gray-700">Tên lớp</th>
                        <th className="px-4 py-3 text-left font-medium text-gray-700">Mã ngành</th>
                        <th className="px-4 py-3 text-left font-medium text-gray-700">Mã khóa học</th>
                        <th className="px-4 py-3 text-left font-medium text-gray-700">Trạng thái</th>
                      </tr>
                    </thead>
                    <tbody>
                      {previewData.validData.map((row, idx) => (
                        <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="px-4 py-3 text-gray-900 font-medium">{row.maLop}</td>
                          <td className="px-4 py-3 text-gray-900">{row.tenLop}</td>
                          <td className="px-4 py-3 text-gray-700">{row.maNganh || '-'}</td>
                          <td className="px-4 py-3 text-gray-700">{row.maKhoahoc || '-'}</td>
                          <td className="px-4 py-3">
                            <span className="inline-block px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                              {row.isActive ? 'Hoạt động' : 'Ngừng'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </Card>
          )}

          {/* Error Details */}
          {previewData.errors?.length > 0 && (
            <Card>
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-red-600" />
                  Lỗi ({previewData.errorRows})
                </h3>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {previewData.errors.map((error, idx) => (
                    <div key={idx} className="text-xs p-3 bg-red-50 rounded border border-red-200">
                      <p className="font-medium text-red-900">
                        Dòng {error.rowNumber}
                      </p>
                      <p className="text-red-700 mt-1">
                        <strong>{error.field}:</strong> {error.errorMessage}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={handleReset}
              icon={X}
            >
              Hủy
            </Button>
            <Button
              onClick={handleConfirmImport}
              icon={Check}
              isLoading={confirmMutation.isLoading}
              disabled={confirmMutation.isLoading || previewData.errorRows > 0}
              title={previewData.errorRows > 0 ? 'Không thể nhập khi có lỗi' : ''}
            >
              Xác nhận nhập
            </Button>
          </div>
        </>
      )}

      {/* Confirmation Result */}
      {confirmResult && (
        <Card>
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Kết quả nhập
            </h3>

            {/* Success Summary */}
            {confirmResult.successCount > 0 && (
              <div className="flex items-start gap-3 p-4 bg-green-50 rounded-lg border border-green-200 mb-4">
                <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-green-900">
                    Nhập thành công {confirmResult.successCount} lớp
                  </p>
                </div>
              </div>
            )}

            {/* Error Summary */}
            {confirmResult.errorCount > 0 && (
              <div className="flex items-start gap-3 p-4 bg-yellow-50 rounded-lg border border-yellow-200 mb-4">
                <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-yellow-900">
                    Lỗi khi nhập {confirmResult.errorCount} lớp
                  </p>
                </div>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Close Button */}
      {confirmResult && (
        <div className="flex items-center justify-end gap-2 pt-4 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            icon={X}
          >
            Đóng
          </Button>
        </div>
      )}
    </div>
  );
};

export default LopExcelImport;
