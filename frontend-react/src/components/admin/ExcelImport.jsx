import { useState } from 'react';
import { Upload, AlertCircle, CheckCircle, Download } from 'lucide-react';
import { toast } from 'react-toastify';
import excelService from '../../services/excelService';
import Button from '../common/Button';
import Alert from '../common/Alert';
import Modal from '../common/Modal';
import Card from '../common/Card';
import Table from '../common/Table';

const ExcelImport = ({ onImportSuccess, onCancel }) => {
  const [file, setFile] = useState(null);
  const [importedData, setImportedData] = useState(null);
  const [validationResult, setValidationResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState('upload'); // 'upload' | 'preview' | 'confirm'

  const handleFileChange = (e) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    // Validate file type
    if (
      !selectedFile.name.endsWith('.xlsx') &&
      !selectedFile.name.endsWith('.xls') &&
      !selectedFile.type.includes('spreadsheet')
    ) {
      toast.error('Vui lòng chọn file Excel (.xlsx hoặc .xls)');
      return;
    }

    setFile(selectedFile);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();

    const droppedFile = e.dataTransfer?.files?.[0];
    if (droppedFile) {
      const input = document.querySelector('input[type="file"]');
      const dataTransfer = new DataTransfer();
      dataTransfer.items.add(droppedFile);
      input.files = dataTransfer.files;
      handleFileChange({ target: input });
    }
  };

  const handleUpload = async () => {
    if (!file) {
      toast.error('Vui lòng chọn file');
      return;
    }

    setIsLoading(true);
    try {
      // Read Excel file
      const rawData = await excelService.readExcelFile(file);

      if (rawData.length === 0) {
        toast.error('File Excel không chứa dữ liệu');
        return;
      }

      // Validate data
      const validation = excelService.validateStudentData(rawData);
      setValidationResult(validation);

      if (validation.errors.length > 0) {
        toast.error(`Có ${validation.errors.length} lỗi trong dữ liệu`);
        setCurrentStep('preview');
        setImportedData(rawData);
        return;
      }

      if (validation.warnings.length > 0) {
        toast.warning(`Có ${validation.warnings.length} cảnh báo, vui lòng kiểm tra`);
      }

      // Format data
      const formattedData = excelService.formatStudentData(rawData);
      setImportedData(formattedData);
      setCurrentStep('preview');
    } catch (error) {
      toast.error('Lỗi khi đọc file: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmImport = async () => {
    if (!importedData) return;

    setIsLoading(true);
    try {
      await onImportSuccess(importedData);
    } catch (error) {
      toast.error('Lỗi khi nhập dữ liệu: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadTemplate = () => {
    excelService.generateStudentTemplate();
    toast.success('Đã tải template Excel');
  };

  // Step 1: Upload
  if (currentStep === 'upload') {
    return (
      <div className="space-y-4">
        <Alert variant="info" title="Hướng dẫn nhập Excel">
          <div className="space-y-2 text-sm">
            <p>1. Tải template Excel bằng nút bên dưới</p>
            <p>2. Điền dữ liệu sinh viên theo mẫu</p>
            <p>3. Chọn file Excel để tải lên</p>
            <p>4. Kiểm tra dữ liệu preview</p>
            <p>5. Nhấn Đồng ý để hoàn thành</p>
          </div>
        </Alert>

        {/* Download Template */}
        <Button
          variant="outline"
          icon={Download}
          onClick={handleDownloadTemplate}
          fullWidth
        >
          Tải Template Excel
        </Button>

        {/* File Upload */}
        <div
          onDragEnter={handleDrop}
          onDragOver={handleDrop}
          onDragLeave={handleDrop}
          onDrop={handleDrop}
          className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-primary hover:bg-primary-50 transition-colors cursor-pointer"
        >
          <input
            type="file"
            accept=".xlsx,.xls"
            onChange={handleFileChange}
            className="hidden"
            id="excel-file-input"
          />
          <label htmlFor="excel-file-input" className="cursor-pointer">
            <Upload className="w-12 h-12 text-gray-400 mx-auto mb-2" />
            <p className="text-gray-700 font-medium">
              Nhấp để chọn hoặc kéo thả file Excel vào đây
            </p>
            <p className="text-sm text-gray-500 mt-1">
              {file ? file.name : 'Chỉ hỗ trợ file .xlsx hoặc .xls'}
            </p>
          </label>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <Button variant="outline" onClick={onCancel} fullWidth>
            Hủy
          </Button>
          <Button
            onClick={handleUpload}
            isLoading={isLoading}
            disabled={!file || isLoading}
            fullWidth
          >
            Tiếp tục
          </Button>
        </div>
      </div>
    );
  }

  // Step 2: Preview & Validation
  if (currentStep === 'preview') {
    const columns = [
      { header: 'Mã SV', accessor: 'maSv', width: '100px' },
      { header: 'Họ tên', accessor: 'hoTen', width: '150px' },
      { header: 'Giới tính', accessor: 'gioiTinh', width: '80px' },
      { header: 'Ngày sinh', accessor: 'ngaySinh', width: '100px' },
      { header: 'Email', accessor: 'email', width: '150px' },
      { header: 'Số ĐT', accessor: 'sdt', width: '100px' },
      { header: 'Lớp', accessor: 'maLop', width: '80px' },
      {
        header: 'Trạng thái',
        accessor: 'isActive',
        width: '80px',
        render: (value) => (value ? 'Hoạt động' : 'Ngừng'),
      },
    ];

    return (
      <div className="space-y-4 max-h-[80vh] overflow-y-auto">
        {validationResult && (
          <div className="space-y-2">
            {validationResult.errors.length > 0 && (
              <Alert variant="error" title={`${validationResult.errors.length} lỗi`}>
                <ul className="text-sm space-y-1">
                  {validationResult.errors.slice(0, 5).map((error, idx) => (
                    <li key={idx}>• {error}</li>
                  ))}
                  {validationResult.errors.length > 5 && (
                    <li>• ... và {validationResult.errors.length - 5} lỗi khác</li>
                  )}
                </ul>
              </Alert>
            )}

            {validationResult.warnings.length > 0 && (
              <Alert variant="warning" title={`${validationResult.warnings.length} cảnh báo`}>
                <ul className="text-sm space-y-1">
                  {validationResult.warnings.slice(0, 5).map((warning, idx) => (
                    <li key={idx}>• {warning}</li>
                  ))}
                  {validationResult.warnings.length > 5 && (
                    <li>• ... và {validationResult.warnings.length - 5} cảnh báo khác</li>
                  )}
                </ul>
              </Alert>
            )}

            {validationResult.isValid && (
              <Alert variant="success" title="Dữ liệu hợp lệ">
                Sẵn sàng nhập {importedData?.length} sinh viên vào hệ thống
              </Alert>
            )}
          </div>
        )}

        {/* Data Preview Table */}
        <Card>
          <Card.Header>
            <h3 className="font-semibold">
              Preview dữ liệu ({importedData?.length} sinh viên)
            </h3>
          </Card.Header>
          <div className="overflow-x-auto">
            <Table columns={columns} data={importedData || []} />
          </div>
        </Card>

        {/* Actions */}
        <div className="flex gap-2 sticky bottom-0 bg-white pt-4 border-t">
          <Button
            variant="outline"
            onClick={() => {
              setCurrentStep('upload');
              setFile(null);
              setImportedData(null);
              setValidationResult(null);
            }}
            fullWidth
          >
            Quay lại
          </Button>
          <Button
            onClick={() => {
              if (validationResult?.isValid) {
                setCurrentStep('confirm');
              } else {
                toast.error('Vui lòng sửa các lỗi trước khi tiếp tục');
              }
            }}
            disabled={!validationResult?.isValid}
            fullWidth
          >
            Tiếp tục
          </Button>
        </div>
      </div>
    );
  }

  // Step 3: Confirm
  if (currentStep === 'confirm') {
    return (
      <div className="space-y-4">
        <Alert variant="info" title="Xác nhận nhập dữ liệu">
          <p>
            Bạn sắp nhập <strong>{importedData?.length} sinh viên</strong> vào hệ thống.
          </p>
          <p className="mt-2 text-sm">
            Hành động này không thể hoàn tác. Vui lòng kiểm tra kỹ trước khi xác nhận.
          </p>
        </Alert>

        {/* Summary */}
        <Card>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600">Tổng số sinh viên:</span>
              <span className="font-semibold">{importedData?.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">File:</span>
              <span className="font-semibold text-sm truncate">{file?.name}</span>
            </div>
          </div>
        </Card>

        {/* Actions */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setCurrentStep('preview')}
            fullWidth
          >
            Quay lại
          </Button>
          <Button
            onClick={handleConfirmImport}
            isLoading={isLoading}
            disabled={isLoading}
            fullWidth
          >
            Đồng ý & Nhập dữ liệu
          </Button>
        </div>
      </div>
    );
  }
};

export default ExcelImport;
