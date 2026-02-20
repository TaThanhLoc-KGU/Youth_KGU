import { useState } from 'react';
import { FileUp, FileText, Users } from 'lucide-react';
import Button from '../../common/Button';
import Alert from '../../common/Alert';
import ExcelUploader from './components/ExcelUploader';
import ManualInput from './components/ManualInput';
import BCHSelector from './components/BCHSelector';

const Step1DataSource = ({
  onNext,
  isLoading = false,
  initialSource = null,
}) => {
  const [source, setSource] = useState(initialSource || 'excel');
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  const handleSourceChange = (newSource) => {
    setSource(newSource);
    setData(null);
    setError(null);
  };

  const handleDataLoaded = (loadedData) => {
    setData(loadedData);
    setError(null);
  };

  const handleError = (errorMsg) => {
    setError(errorMsg);
  };

  const handleContinue = () => {
    if (!data) {
      setError('Vui lòng chọn hoặc nhập dữ liệu trước');
      return;
    }
    onNext?.(data);
  };

  return (
    <div className="space-y-6">
      {/* Source Selector */}
      <div>
        <p className="text-sm font-medium text-gray-700 mb-4">
          Chọn cách để nhập danh sách:
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Excel Upload */}
          <button
            onClick={() => handleSourceChange('excel')}
            className={`p-4 border-2 rounded-lg text-left transition-all ${
              source === 'excel'
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300 bg-white'
            }`}
            disabled={isLoading}
          >
            <FileUp className="w-6 h-6 mb-2" style={{ color: source === 'excel' ? '#1c6681' : '#6b7280' }} />
            <p className="font-medium text-gray-900">Upload File Excel</p>
            <p className="text-xs text-gray-600 mt-1">Tải file .xlsx hoặc .csv</p>
          </button>

          {/* Manual Input */}
          <button
            onClick={() => handleSourceChange('manual')}
            className={`p-4 border-2 rounded-lg text-left transition-all ${
              source === 'manual'
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300 bg-white'
            }`}
            disabled={isLoading}
          >
            <FileText className="w-6 h-6 mb-2" style={{ color: source === 'manual' ? '#1c6681' : '#6b7280' }} />
            <p className="font-medium text-gray-900">Nhập Danh Sách</p>
            <p className="text-xs text-gray-600 mt-1">Dán danh sách mã số</p>
          </button>

          {/* BCH Selection */}
          <button
            onClick={() => handleSourceChange('bch')}
            className={`p-4 border-2 rounded-lg text-left transition-all ${
              source === 'bch'
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300 bg-white'
            }`}
            disabled={isLoading}
          >
            <Users className="w-6 h-6 mb-2" style={{ color: source === 'bch' ? '#1c6681' : '#6b7280' }} />
            <p className="font-medium text-gray-900">Chọn từ BCH</p>
            <p className="text-xs text-gray-600 mt-1">Chọn từ danh sách Ban Chấp Hành</p>
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        {source === 'excel' && (
          <ExcelUploader
            onDataLoaded={handleDataLoaded}
            onError={handleError}
            isLoading={isLoading}
          />
        )}

        {source === 'manual' && (
          <ManualInput
            onDataLoaded={handleDataLoaded}
            onError={handleError}
            isLoading={isLoading}
          />
        )}

        {source === 'bch' && (
          <BCHSelector
            onDataLoaded={handleDataLoaded}
            onError={handleError}
            isLoading={isLoading}
          />
        )}
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="danger">
          {error}
        </Alert>
      )}

      {/* Data Info */}
      {data && !error && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-sm text-green-900">
            ✓ Đã tải {data.rowCount} bản ghi. Nhấn "Tiếp tục" để cấu hình tùy chọn.
          </p>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3 justify-end pt-6 border-t">
        <Button
          variant="outline"
          disabled={isLoading}
        >
          Hủy
        </Button>
        <Button
          onClick={handleContinue}
          disabled={!data || isLoading}
          isLoading={isLoading}
        >
          Tiếp tục →
        </Button>
      </div>
    </div>
  );
};

export default Step1DataSource;
