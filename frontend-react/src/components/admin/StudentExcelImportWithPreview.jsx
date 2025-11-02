import { useState, useRef } from 'react';
import { useMutation } from 'react-query';
import * as XLSX from 'xlsx';
import { toast } from 'react-toastify';
import { Upload, Download, AlertCircle, Check, X, Eye } from 'lucide-react';
import studentService from '../../services/studentService.js';
import Button from '../common/Button';
import Card from '../common/Card';
import Table from '../common/Table';

const StudentExcelImportWithPreview = ({ onImportSuccess, onCancel }) => {
    const fileInputRef = useRef(null);
    const [fileName, setFileName] = useState(null);
    const [previewData, setPreviewData] = useState([]);
    const [isPreviewMode, setIsPreviewMode] = useState(false);
    const [file, setFile] = useState(null);
    const [importResult, setImportResult] = useState(null);

    const importMutation = useMutation(
        (file) => studentService.importFromExcel(file),
        {
            onSuccess: (result) => {
                setImportResult(result);
                setIsPreviewMode(false);
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
            },
        }
    );

    const handleFileSelect = async (e) => {
        const selectedFile = e.target.files?.[0];
        if (!selectedFile) return;

        const allowedTypes = [
            'application/vnd.ms-excel',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        ];

        if (!allowedTypes.includes(selectedFile.type)) {
            toast.error('Chỉ hỗ trợ file Excel (.xls, .xlsx)');
            return;
        }

        setFileName(selectedFile.name);
        setFile(selectedFile);

        // Parse Excel để preview
        try {
            const data = await parseExcelFile(selectedFile);
            setPreviewData(data);
            setIsPreviewMode(true);
        } catch (error) {
            toast.error('Lỗi đọc file Excel');
        }
    };

    const parseExcelFile = (file) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const data = new Uint8Array(e.target.result);
                    const workbook = XLSX.read(data, { type: 'array' });
                    const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
                    const jsonData = XLSX.utils.sheet_to_json(firstSheet);
                    resolve(jsonData);
                } catch (error) {
                    reject(error);
                }
            };
            reader.onerror = reject;
            reader.readAsArrayBuffer(file);
        });
    };

    const handleConfirmImport = () => {
        if (!file) return;
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

    const previewColumns = [
        { header: 'Mã SV', accessor: 'Mã SV' },
        { header: 'Họ tên', accessor: 'Họ tên' },
        { header: 'Giới tính', accessor: 'Giới tính' },
        { header: 'Ngày sinh', accessor: 'Ngày sinh' },
        { header: 'Email', accessor: 'Email' },
        { header: 'SĐT', accessor: 'Số điện thoại' },
        { header: 'Lớp', accessor: 'Mã lớp' },
        { header: 'Trạng thái', accessor: 'Trạng thái' },
    ];

    return (
        <div className="space-y-4">
            {!isPreviewMode && !importResult && (
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
                                            File mẫu có sẵn dropdown cho các trường dữ liệu
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
                                    className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors border-gray-300 hover:border-blue-400 hover:bg-blue-50"
                                >
                                    <Upload className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                                    <p className="text-sm font-medium text-gray-900">
                                        Chọn tệp Excel để nhập
                                    </p>
                                    <p className="text-xs text-gray-600 mt-1">
                                        Sau khi chọn sẽ hiển thị preview để kiểm tra
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </Card>
            )}

            {/* Preview Mode */}
            {isPreviewMode && (
                <Card>
                    <div className="p-6">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                                <Eye className="w-5 h-5 text-blue-600" />
                                <h3 className="text-lg font-semibold text-gray-900">
                                    Xem trước dữ liệu ({previewData.length} dòng)
                                </h3>
                            </div>
                        </div>

                        <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                            <p className="text-sm text-yellow-800">
                                Vui lòng kiểm tra kỹ dữ liệu trước khi xác nhận import
                            </p>
                        </div>

                        <div className="max-h-96 overflow-auto">
                            <Table
                                columns={previewColumns}
                                data={previewData}
                                emptyMessage="Không có dữ liệu"
                            />
                        </div>

                        <div className="flex items-center justify-end gap-2 pt-4 border-t mt-4">
                            <Button
                                variant="outline"
                                onClick={() => {
                                    setIsPreviewMode(false);
                                    setPreviewData([]);
                                    setFile(null);
                                    setFileName(null);
                                }}
                            >
                                Hủy
                            </Button>
                            <Button
                                onClick={handleConfirmImport}
                                isLoading={importMutation.isLoading}
                            >
                                Xác nhận Import
                            </Button>
                        </div>
                    </div>
                </Card>
            )}

            {/* Import Result */}
            {importResult && (
                <Card>
                    <div className="p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">
                            Kết quả nhập
                        </h3>

                        {importResult.successCount > 0 && (
                            <div className="flex items-start gap-3 p-4 bg-green-50 rounded-lg border border-green-200 mb-4">
                                <Check className="w-5 h-5 text-green-600" />
                                <p className="text-sm font-medium text-green-900">
                                    Nhập thành công {importResult.successCount} sinh viên
                                </p>
                            </div>
                        )}

                        {importResult.failureDetails?.length > 0 && (
                            <div className="space-y-2">
                                <div className="flex items-start gap-3 p-4 bg-red-50 rounded-lg border border-red-200">
                                    <AlertCircle className="w-5 h-5 text-red-600" />
                                    <div className="flex-1">
                                        <p className="text-sm font-medium text-red-900 mb-2">
                                            Thất bại {importResult.failureCount} dòng
                                        </p>
                                        <div className="space-y-2 max-h-48 overflow-y-auto">
                                            {importResult.failureDetails.map((failure, idx) => (
                                                <div key={idx} className="text-xs p-2 bg-red-50 rounded">
                                                    <p className="font-medium text-red-900">
                                                        Dòng {failure.row}: {failure.maSv}
                                                    </p>
                                                    <p className="text-red-700 mt-1">
                                                        {failure.errors?.join(', ')}
                                                    </p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="flex justify-end pt-4 border-t mt-4">
                            <Button onClick={onCancel}>Đóng</Button>
                        </div>
                    </div>
                </Card>
            )}
        </div>
    );
};

export default StudentExcelImportWithPreview;