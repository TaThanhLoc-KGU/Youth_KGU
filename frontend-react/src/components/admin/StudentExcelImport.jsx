import { useState, useRef } from 'react';
import { useMutation } from 'react-query';
import { toast } from 'react-toastify';
import { Upload, Download, AlertCircle, Check, X } from 'lucide-react';
import studentService from '../../services/studentService';
import Button from '../common/Button';
import Card from '../common/Card';

const StudentExcelImport = ({ onImportSuccess, onCancel }) => {
  const fileInputRef = useRef(null);
  const [fileName, setFileName] = useState(null);
  const [importResult, setImportResult] = useState(null);

  const importMutation = useMutation(
    (file) => studentService.importFromExcel(file),
    {
      onSuccess: (result) => {
        setImportResult(result);
        toast.success(
          `Nhập thành công ${result.successCount} sinh viên${
            result.failureCount > 0 ? `, thất bại ${result.failureCount}` : ''
          }`
        );
        if (result.successCount > 0) {
          onImportSuccess?.();
        }
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Lỗi nhập tệp');
        setImportResult({
          errors: [error.response?.data?.message || 'Lỗi nhập tệp'],
        });
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
    setImportResult(null);
    importMutation.mutate(file);
  };

  const handleDownloadTemplate = async () => {
    try {
      const blob = await studentService.downloadTemplate();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'template-sinh-vien.xlsx';
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
      <Card>
        <div className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Nhập danh sách sinh viên từ Excel
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
                  importMutation.isLoading
                    ? 'bg-gray-50 border-gray-300'
                    : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50'
                }`}
              >
                <Upload className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                <p className="text-sm font-medium text-gray-900">
                  {fileName ? fileName : 'Chọn tệp Excel để nhập'}
                </p>
                <p className="text-xs text-gray-600 mt-1">
                  {importMutation.isLoading
                    ? 'Đang xử lý...'
                    : 'Hoặc kéo thả tệp vào đây'}
                </p>
              </div>
            </div>

            {/* Current Status */}
            {importMutation.isLoading && (
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

      {/* Import Result */}
      {importResult && (
        <Card>
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Kết quả nhập
            </h3>

            {/* Success Summary */}
            {importResult.successCount > 0 && (
              <div className="flex items-start gap-3 p-4 bg-green-50 rounded-lg border border-green-200 mb-4">
                <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-green-900">
                    Nhập thành công {importResult.successCount} sinh viên
                  </p>
                </div>
              </div>
            )}

            {/* Error Details */}
            {(importResult.errors?.length > 0 ||
              importResult.failureDetails?.length > 0) && (
              <div className="space-y-2">
                <div className="flex items-start gap-3 p-4 bg-red-50 rounded-lg border border-red-200 mb-4">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-red-900 mb-2">
                      {importResult.errors?.length > 0
                        ? 'Lỗi chung'
                        : `Thất bại ${importResult.failureCount} dòng`}
                    </p>
                    {importResult.errors?.map((error, idx) => (
                      <p
                        key={idx}
                        className="text-xs text-red-700 mb-1 last:mb-0"
                      >
                        • {error}
                      </p>
                    ))}
                  </div>
                </div>

                {/* Failure Details per Row */}
                {importResult.failureDetails?.length > 0 && (
                  <div className="mt-4">
                    <h4 className="text-sm font-medium text-gray-900 mb-3">
                      Chi tiết lỗi theo dòng:
                    </h4>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {importResult.failureDetails.map((failure, idx) => (
                        <div
                          key={idx}
                          className="text-xs p-2 bg-red-50 rounded border border-red-200"
                        >
                          <p className="font-medium text-red-900">
                            Dòng {failure.row}
                            {failure.maSv && ` (${failure.maSv})`}
                          </p>
                          <p className="text-red-700 mt-1">
                            {failure.errors
                              ?.map((e) => `• ${e}`)
                              .join('\n')}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Actions */}
      <div className="flex items-center justify-end gap-2 pt-4 border-t">
        <Button type="button" variant="outline" onClick={onCancel} icon={X}>
          Đóng
        </Button>
      </div>
    </div>
  );
};

export default StudentExcelImport;
