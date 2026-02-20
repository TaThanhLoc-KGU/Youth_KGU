import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AlertCircle } from 'lucide-react';
import { toast } from 'react-toastify';
import Select from '../../../common/Select';
import Alert from '../../../common/Alert';
import Loading from '../../../common/Loading';
import bulkAccountService from '../../../../services/bulkAccountService';

const BCHSelector = ({ onDataLoaded, onError, isLoading = false }) => {
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [parseError, setParseError] = useState(null);

  // Fetch BCH members
  const { data: bchMembers = [], isLoading: isBCHLoading } = useQuery({
    queryKey: ['bch-members'],
    queryFn: () => bulkAccountService.getBCHMembers(),
  });

  // Handle selection
  const handleToggleMember = (member) => {
    const isSelected = selectedMembers.some(m => m.id === member.id);
    if (isSelected) {
      setSelectedMembers(selectedMembers.filter(m => m.id !== member.id));
    } else {
      setSelectedMembers([...selectedMembers, member]);
    }
    setParseError(null);
  };

  // Convert selected members to rows
  const handleConfirm = () => {
    setParseError(null);

    if (selectedMembers.length === 0) {
      setParseError('Vui lòng chọn ít nhất một thành viên BCH');
      onError?.('Chưa chọn thành viên');
      return;
    }

    try {
      const rows = selectedMembers.map(member => ({
        maSo: member.maSv || member.maSinhVien || member.id,
        loaiThanhVien: 'SINH_VIEN',
        hoTen: member.hoTen || member.tenSinhVien,
        email: member.email,
        ghiChu: member.chucVu || 'BCH',
        chucVu: member.chucVu || ''
      }));

      onDataLoaded?.({
        rows,
        fileName: `BCH_${new Date().toISOString().split('T')[0]}`,
        rowCount: rows.length,
        assignRoleFromBCH: true
      });

      toast.success(`Đã chọn ${rows.length} thành viên BCH`);
    } catch (error) {
      console.error('Error processing BCH members:', error);
      setParseError('Lỗi xử lý dữ liệu: ' + error.message);
      onError?.(error.message);
    }
  };

  if (isBCHLoading) {
    return <Loading text="Đang tải danh sách BCH..." />;
  }

  if (bchMembers.length === 0) {
    return (
      <Alert variant="warning" icon={AlertCircle}>
        Không có dữ liệu Ban Chấp Hành trong hệ thống
      </Alert>
    );
  }

  return (
    <div className="space-y-4">
      {parseError && (
        <Alert variant="danger" icon={AlertCircle}>
          {parseError}
        </Alert>
      )}

      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <div className="grid grid-cols-1 gap-3 max-h-96 overflow-y-auto">
          {bchMembers.map(member => (
            <label
              key={member.id}
              className="flex items-start gap-3 p-3 bg-white border border-gray-200 rounded cursor-pointer hover:bg-blue-50 transition-colors"
            >
              <input
                type="checkbox"
                checked={selectedMembers.some(m => m.id === member.id)}
                onChange={() => handleToggleMember(member)}
                disabled={isLoading || isBCHLoading}
                className="mt-1"
              />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 truncate">
                  {member.hoTen || member.tenSinhVien}
                </p>
                <p className="text-sm text-gray-600">
                  {member.maSv || member.maSinhVien}
                </p>
                {member.chucVu && (
                  <p className="text-xs text-blue-600 font-medium">
                    {member.chucVu}
                  </p>
                )}
              </div>
            </label>
          ))}
        </div>
      </div>

      {selectedMembers.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-900">
            ✓ Đã chọn {selectedMembers.length} thành viên BCH
          </p>
        </div>
      )}

      <div className="flex gap-3 justify-end pt-4 border-t">
        <button
          onClick={() => setSelectedMembers([])}
          disabled={isLoading || isBCHLoading || selectedMembers.length === 0}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Bỏ chọn tất cả
        </button>
        <button
          onClick={handleConfirm}
          disabled={isLoading || isBCHLoading || selectedMembers.length === 0}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Xác nhận chọn
        </button>
      </div>
    </div>
  );
};

export default BCHSelector;
