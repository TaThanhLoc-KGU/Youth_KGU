import { useState, useRef } from 'react';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { Upload, Download, AlertCircle, CheckCircle, XCircle, X, Check, UserMinus } from 'lucide-react';
import studentService from '../../services/studentService';
import Button from '../common/Button';
import Card from '../common/Card';

const StudentGraduateModal = ({ onSuccess, onCancel }) => {
  const fileInputRef = useRef(null);
  const [fileName, setFileName] = useState(null);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [previewData, setPreviewData] = useState(null);
  const [result, setResult] = useState(null);

  const previewMutation = useMutation({
    mutationFn: (file) => studentService.previewBulkDeactivate(file),
    onSuccess: (data) => {
      setPreviewData(data);
    },
    onError: (err) => {
      toast.error(err.response?.data?.error || 'Lỗi đọc file');
    },
  });

  const confirmMutation = useMutation({
    mutationFn: (file) => studentService.confirmBulkDeactivate(file),
    onSuccess: (data) => {
      setResult(data);
      toast.success(`Đã xử lý ${data.deactivated} sinh viên tốt nghiệp`);
      if (data.deactivated > 0) onSuccess?.();
    },
    onError: (err) => {
      toast.error(err.response?.data?.error || 'Lỗi xác nhận');
    },
  });

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const allowed = ['application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'];
    if (!allowed.includes(file.type)) {
      toast.error('Chỉ hỗ trợ file Excel (.xls, .xlsx)');
      return;
    }
    setFileName(file.name);
    setUploadedFile(file);
    setPreviewData(null);
    setResult(null);
    previewMutation.mutate(file);
  };

  const handleReset = () => {
    setFileName(null);
    setUploadedFile(null);
    setPreviewData(null);
    setResult(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDownloadTemplate = async () => {
    try {
      const blob = await studentService.downloadTotNghiepTemplate();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'template-tot-nghiep.xlsx';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success('Đã tải template');
    } catch {
      toast.error('Lỗi tải template');
    }
  };

  return (
    <div className="space-y-4">
      {/* Upload section */}
      {!previewData && !result && (
        <Card>
          <div className="p-6 space-y-4">
            <div className="flex items-center gap-2 p-4 bg-amber-50 rounded-lg border border-amber-200">
              <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0" />
              <p className="text-sm text-amber-800">
                Thao tác này sẽ <strong>vô hiệu hóa</strong> (không xóa vĩnh viễn) các sinh viên trong danh sách.
                Có thể kích hoạt lại sau.
              </p>
            </div>

            {/* Template download */}
            <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center gap-2">
                <Download className="w-5 h-5 text-blue-600" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Tải template Excel</p>
                  <p className="text-xs text-gray-600">File mẫu chỉ cần cột Mã SV (MSSV)</p>
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={handleDownloadTemplate}>
                Tải Template
              </Button>
            </div>

            {/* File input */}
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
                className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors border-gray-300 hover:border-red-400 hover:bg-red-50"
              >
                <Upload className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                <p className="text-sm font-medium text-gray-900">
                  {fileName || 'Chọn file Excel danh sách tốt nghiệp'}
                </p>
                <p className="text-xs text-gray-600 mt-1">
                  {previewMutation.isPending ? 'Đang xử lý...' : 'File chỉ cần chứa cột Mã SV'}
                </p>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Preview section */}
      {previewData && !result && (
        <>
          {/* Stats */}
          <Card>
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Xem trước</h3>
              <div className="grid grid-cols-3 gap-4">
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200 text-center">
                  <p className="text-2xl font-bold text-blue-600">{previewData.totalRows}</p>
                  <p className="text-xs text-gray-600 mt-1">Tổng dòng</p>
                </div>
                <div className="p-4 bg-green-50 rounded-lg border border-green-200 text-center">
                  <p className="text-2xl font-bold text-green-600">{previewData.foundCount}</p>
                  <p className="text-xs text-gray-600 mt-1">Tìm thấy</p>
                </div>
                <div className="p-4 bg-red-50 rounded-lg border border-red-200 text-center">
                  <p className="text-2xl font-bold text-red-600">{previewData.notFoundCount}</p>
                  <p className="text-xs text-gray-600 mt-1">Không tìm thấy</p>
                </div>
              </div>
            </div>
          </Card>

          {/* Found list */}
          {previewData.found?.length > 0 && (
            <Card>
              <div className="p-6">
                <h3 className="text-base font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  Sẽ bị vô hiệu hóa ({previewData.foundCount})
                </h3>
                <div className="overflow-x-auto max-h-64 overflow-y-auto">
                  <table className="w-full text-sm">
                    <thead className="sticky top-0 bg-gray-50">
                      <tr className="border-b border-gray-200">
                        <th className="px-3 py-2 text-left font-medium text-gray-700">Mã SV</th>
                        <th className="px-3 py-2 text-left font-medium text-gray-700">Họ tên</th>
                        <th className="px-3 py-2 text-left font-medium text-gray-700">Lớp</th>
                        <th className="px-3 py-2 text-left font-medium text-gray-700">Trạng thái hiện tại</th>
                      </tr>
                    </thead>
                    <tbody>
                      {previewData.found.map((sv, i) => (
                        <tr key={i} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="px-3 py-2 text-gray-900 font-mono">{sv.maSv}</td>
                          <td className="px-3 py-2 text-gray-900">{sv.hoTen}</td>
                          <td className="px-3 py-2 text-gray-600">{sv.tenLop || sv.maLop || '-'}</td>
                          <td className="px-3 py-2">
                            <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                              sv.isActive
                                ? 'bg-green-100 text-green-700'
                                : 'bg-gray-100 text-gray-600'
                            }`}>
                              {sv.isActive ? 'Đang hoạt động' : 'Đã ngừng'}
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

          {/* Not found list */}
          {previewData.notFound?.length > 0 && (
            <Card>
              <div className="p-6">
                <h3 className="text-base font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <XCircle className="w-4 h-4 text-red-600" />
                  Không tìm thấy trong hệ thống ({previewData.notFoundCount})
                </h3>
                <div className="space-y-1 max-h-40 overflow-y-auto">
                  {previewData.notFound.map((item, i) => (
                    <div key={i} className="flex items-center gap-2 px-3 py-2 bg-red-50 rounded text-sm">
                      <span className="font-mono text-red-800">{item.maSv}</span>
                      <span className="text-red-600 text-xs">— {item.reason}</span>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          )}

          {/* Actions */}
          <div className="flex items-center justify-between pt-4 border-t">
            <Button variant="outline" onClick={handleReset} icon={X}>
              Chọn file khác
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" onClick={onCancel}>Hủy</Button>
              <Button
                variant="danger"
                onClick={() => confirmMutation.mutate(uploadedFile)}
                isLoading={confirmMutation.isPending}
                disabled={confirmMutation.isPending || previewData.foundCount === 0}
                icon={UserMinus}
              >
                Xác nhận vô hiệu hóa {previewData.foundCount} sinh viên
              </Button>
            </div>
          </div>
        </>
      )}

      {/* Result */}
      {result && (
        <Card>
          <div className="p-6 space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Kết quả</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                <p className="text-2xl font-bold text-green-600">{result.deactivated}</p>
                <p className="text-sm text-gray-600 mt-1">Đã vô hiệu hóa thành công</p>
              </div>
              {result.alreadyInactive > 0 && (
                <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <p className="text-2xl font-bold text-gray-500">{result.alreadyInactive}</p>
                  <p className="text-sm text-gray-600 mt-1">Đã ngừng hoạt động trước đó</p>
                </div>
              )}
              {result.notFound > 0 && (
                <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                  <p className="text-2xl font-bold text-red-600">{result.notFound}</p>
                  <p className="text-sm text-gray-600 mt-1">Không tìm thấy</p>
                </div>
              )}
            </div>
            {result.failedIds?.length > 0 && (
              <div className="p-3 bg-red-50 rounded border border-red-200">
                <p className="text-xs font-medium text-red-800 mb-1">Không xử lý được:</p>
                {result.failedIds.map((id, i) => (
                  <p key={i} className="text-xs text-red-700 font-mono">{id}</p>
                ))}
              </div>
            )}
            <div className="flex justify-end pt-2 border-t">
              <Button variant="outline" onClick={onCancel} icon={X}>Đóng</Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};

export default StudentGraduateModal;
