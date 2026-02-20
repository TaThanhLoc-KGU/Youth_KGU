import { useState, useRef } from 'react';
import { Upload, AlertCircle, CheckCircle } from 'lucide-react';
import { toast } from 'react-toastify';
import Button from '../../../common/Button';
import Alert from '../../../common/Alert';
import { parseExcelFile, normalizeExcelData, validateExcelData, downloadTemplate } from '../../../../utils/excelParser';

const ExcelUploader = ({ onDataLoaded, onError, isLoading = false }) => {
  const [file, setFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [parseError, setParseError] = useState(null);
  const [parseWarnings, setParseWarnings] = useState([]);
  const fileInputRef = useRef(null);

  const handleFileSelect = async (selectedFile) => {
    setParseError(null);
    setParseWarnings([]);

    // Validate file type
    if (!selectedFile.name.match(/\.(xlsx|xls|csv)$/i)) {
      setParseError('Chỉ chấp nhận file Excel (.xlsx, .xls) hoặc CSV');
      onError?.('File format không hợp lệ');
      return;
    }

    // Validate file size (max 5MB)
    if (selectedFile.size > 5 * 1024 * 1024) {
      setParseError('File quá lớn (max 5MB)');
      onError?.('File quá lớn');
      return;
    }

    setFile(selectedFile);

    try {
      // Parse Excel file
      const rows = await parseExcelFile(selectedFile);

      if (rows.length === 0) {
        setParseError('File Excel không chứa dữ liệu');
        onError?.('Không có dữ liệu');
        return;
      }

      // Normalize data
      const normalized = normalizeExcelData(rows);

      // Validate data
      const validation = validateExcelData(normalized);

      if (!validation.valid) {
        const errorMessages = validation.errors.join('\n');
        setParseError(errorMessages);
        onError?.(validation.errors[0] || 'Dữ liệu không hợp lệ');
        return;
      }

      // Show warnings if any
      if (validation.warnings.length > 0) {
        setParseWarnings(validation.warnings);
      }

      // Load data
      onDataLoaded?.({
        rows: normalized,
        fileName: selectedFile.name,
        rowCount: normalized.length
      });

      toast.success(`Đã tải ${normalized.length} bản ghi từ file`);
    } catch (error) {
      console.error('Error parsing file:', error);
      setParseError('Lỗi đọc file: ' + error.message);
      onError?.(error.message);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      handleFileSelect(droppedFile);
    }
  };

  const handleInputChange = (e) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      handleFileSelect(selectedFile);
    }
  };

  const handleClearFile = () => {
    setFile(null);
    setParseError(null);
    setParseWarnings([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer ${
          isDragging
            ? 'border-blue-500 bg-blue-50'
            : parseError
            ? 'border-red-300 bg-red-50'
            : file
            ? 'border-green-300 bg-green-50'
            : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
        }`}
        onClick={() => !file && fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx,.xls,.csv"
          onChange={handleInputChange}
          className="hidden"
          disabled={isLoading}
        />

        {file ? (
          <div className="space-y-2">
            <CheckCircle className="w-12 h-12 text-green-600 mx-auto" />
            <div>
              <p className="font-semibold text-gray-900">{file.name}</p>
              <p className="text-sm text-gray-600">
                {(file.size / 1024).toFixed(2)} KB
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <Upload className="w-12 h-12 text-gray-400 mx-auto" />
            <div>
              <p className="font-semibold text-gray-900">
                Kéo thả file Excel hoặc nhấp để chọn
              </p>
              <p className="text-sm text-gray-600">
                Hỗ trợ .xlsx, .xls, .csv (tối đa 5MB)
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Error Alert */}
      {parseError && (
        <Alert variant="danger" icon={AlertCircle} className="whitespace-pre-wrap">
          {parseError}
        </Alert>
      )}

      {/* Warnings Alert */}
      {parseWarnings.length > 0 && (
        <Alert variant="warning" className="whitespace-pre-wrap">
          <p className="font-semibold mb-2">Cảnh báo:</p>
          {parseWarnings.map((warning, idx) => (
            <p key={idx} className="text-sm">{warning}</p>
          ))}
        </Alert>
      )}

      {/* File Info */}
      {file && !parseError && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-900">
            ✓ File sẵn sàng. Nhấn "Tiếp tục" để xem trước dữ liệu.
          </p>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3 justify-end pt-4">
        <Button
          variant="outline"
          onClick={downloadTemplate}
          disabled={isLoading}
        >
          Tải template
        </Button>
        {file && (
          <Button
            variant="outline"
            onClick={handleClearFile}
            disabled={isLoading}
          >
            Xóa file
          </Button>
        )}
      </div>
    </div>
  );
};

export default ExcelUploader;
