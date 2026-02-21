import { useState } from 'react';
import { AlertCircle } from 'lucide-react';
import { toast } from 'react-toastify';
import Textarea from '../../../common/Textarea';
import Select from '../../../common/Select';
import Alert from '../../../common/Alert';

const ManualInput = ({ onDataLoaded, onError, isLoading = false }) => {
  const [userType, setUserType] = useState('SINH_VIEN');
  const [input, setInput] = useState('');
  const [parseError, setParseError] = useState(null);
  const [parseWarnings, setParseWarnings] = useState([]);

  const userTypeOptions = [
    { value: 'SINH_VIEN', label: 'Sinh viên' },
    { value: 'GIANG_VIEN', label: 'Giảng viên' },
    { value: 'CHUYEN_VIEN', label: 'Chuyên viên' }
  ];

  const handleParse = () => {
    setParseError(null);
    setParseWarnings([]);

    if (!input.trim()) {
      setParseError('Vui lòng nhập danh sách mã số');
      onError?.('Danh sách không được để trống');
      return;
    }

    try {
      // Parse input - split by comma, newline, or space
      const ids = input
        .split(/[,\n\s]+/)
        .map(id => id.trim().toUpperCase())
        .filter(id => id.length > 0);

      if (ids.length === 0) {
        setParseError('Không tìm thấy mã số hợp lệ');
        onError?.('Danh sách không hợp lệ');
        return;
      }

      // Check for duplicates
      const uniqueIds = new Set(ids);
      if (uniqueIds.size < ids.length) {
        const duplicateCount = ids.length - uniqueIds.size;
        setParseWarnings([`Phát hiện ${duplicateCount} mã số bị trùng lặp, sẽ loại bỏ`]);
      }

      // Max 500 records
      if (uniqueIds.size > 500) {
        setParseWarnings([`Danh sách có ${uniqueIds.size} mã số vượt quá 500, sẽ chỉ import 500 mã đầu tiên`]);
      }

      // Convert to row format
      const rows = Array.from(uniqueIds)
        .slice(0, 500)
        .map((maSo, idx) => ({
          maSo,
          loaiThanhVien: userType,
          hoTen: '',
          email: '',
          ghiChu: ''
        }));

      onDataLoaded?.({
        rows,
        fileName: `Manual_${userType}_${new Date().toISOString().split('T')[0]}`,
        rowCount: rows.length
      });

      toast.success(`Đã tạo ${rows.length} bản ghi từ danh sách mã số`);
    } catch (error) {
      console.error('Error parsing manual input:', error);
      setParseError('Lỗi xử lý danh sách: ' + error.message);
      onError?.(error.message);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Loại thành viên
        </label>
        <Select
          options={userTypeOptions}
          value={userType}
          onChange={(e) => setUserType(e.target.value)}
          disabled={isLoading}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Danh sách mã số
        </label>
        <p className="text-xs text-gray-600 mb-2">
          Nhập các mã số cách nhau bằng dấu phẩy, dòng mới, hoặc khoảng trắng
        </p>
        <Textarea
          value={input}
          onChange={(e) => {
            setInput(e.target.value);
            setParseError(null);
            setParseWarnings([]);
          }}
          placeholder="SV001, SV002, SV003&#10;hoặc&#10;SV001&#10;SV002&#10;SV003"
          rows={8}
          disabled={isLoading}
          className="font-mono text-sm"
        />
        <p className="text-xs text-gray-600 mt-2">
          VD: SV001, SV002, SV003 hoặc SV001 SV002 SV003
        </p>
      </div>

      {/* Error Alert */}
      {parseError && (
        <Alert variant="danger" icon={AlertCircle}>
          {parseError}
        </Alert>
      )}

      {/* Warnings Alert */}
      {parseWarnings.length > 0 && (
        <Alert variant="warning">
          {parseWarnings.map((warning, idx) => (
            <p key={idx} className="text-sm">{warning}</p>
          ))}
        </Alert>
      )}

      {/* Count Info */}
      {input.trim() && !parseError && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <p className="text-sm text-blue-900">
            Sẽ import {input.split(/[,\n\s]+/).filter(x => x.trim()).length} mã số
          </p>
        </div>
      )}
    </div>
  );
};

export default ManualInput;
