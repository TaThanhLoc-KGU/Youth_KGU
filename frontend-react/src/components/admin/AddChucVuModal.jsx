import { useState, useEffect } from 'react';
import { useMutation } from 'react-query';
import { toast } from 'react-toastify';
import { Trash2 } from 'lucide-react';
import { useQuery } from 'react-query';
import chucVuService from '../../services/chucVuService';
import banService from '../../services/banService';
import bchService from '../../services/bchService';
import Button from '../common/Button';
import Input from '../common/Input';
import Select from '../common/Select';
import Modal from '../common/Modal';
import Badge from '../common/Badge';

const AddChucVuModal = ({
  isOpen,
  maBch,
  onClose,
  onSuccess,
}) => {
  const [chucVuList, setChucVuList] = useState([]);
  const [selectedChucVu, setSelectedChucVu] = useState(null);
  const [selectedBan, setSelectedBan] = useState(null);
  const [ngayNhanChuc, setNgayNhanChuc] = useState('');
  const [showBanSelect, setShowBanSelect] = useState(false);

  // Fetch chuc vu list
  const { data: allChucVu = [] } = useQuery('chuc-vu-all', chucVuService.getAll);

  // Fetch ban list
  const { data: allBan = [] } = useQuery('ban-all', banService.getAll);

  // Fetch current chuc vu of BCH
  const { data: currentChucVu = [] } = useQuery(
    ['bch-chuc-vu', maBch],
    () => (maBch ? bchService.getChucVuByBCH(maBch) : []),
    { enabled: !!maBch }
  );

  // Add chuc vu mutation
  const addChucVuMutation = useMutation(
    (data) => bchService.addChucVu(maBch, data),
    {
      onSuccess: () => {
        toast.success('Thêm chức vụ thành công!');
        setSelectedChucVu(null);
        setSelectedBan(null);
        setNgayNhanChuc('');
        onSuccess?.();
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Thêm chức vụ thất bại!');
      },
    }
  );

  // Remove chuc vu mutation
  const removeChucVuMutation = useMutation(
    (id) => bchService.removeChucVu(id),
    {
      onSuccess: () => {
        toast.success('Xóa chức vụ thành công!');
        onSuccess?.();
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Xóa chức vụ thất bại!');
      },
    }
  );

  useEffect(() => {
    if (selectedChucVu) {
      const chucVu = allChucVu.find(cv => cv.maChucVu === selectedChucVu);
      // Chỉ hiện select ban khi chức vụ thuộc ban phục vụ
      setShowBanSelect(chucVu?.thuocBan === 'BAN_PHUC_VU');
    }
  }, [selectedChucVu, allChucVu]);

  const handleAddChucVu = () => {
    if (!selectedChucVu) {
      toast.error('Vui lòng chọn chức vụ');
      return;
    }

    if (!ngayNhanChuc) {
      toast.error('Vui lòng chọn ngày nhận chức');
      return;
    }

    // Check if BCH already has this position
    if (currentChucVu.some(cv => cv.maChucVu === selectedChucVu)) {
      toast.error('BCH đã có chức vụ này');
      return;
    }

    const data = {
      maChucVu: selectedChucVu,
      maBan: showBanSelect ? selectedBan : null,
      ngayNhanChuc: ngayNhanChuc,
    };

    addChucVuMutation.mutate(data);
  };

  const handleRemoveChucVu = (id) => {
    if (confirm('Bạn chắc chắn muốn xóa chức vụ này?')) {
      removeChucVuMutation.mutate(id);
    }
  };

  // Get list of available chuc vu (not already added)
  const availableChucVu = allChucVu.filter(
    cv => !currentChucVu.some(cur => cur.maChucVu === cv.maChucVu)
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="space-y-6 max-w-2xl">
        <h2 className="text-2xl font-bold text-gray-900">Quản lý chức vụ</h2>

        {/* Section 1: Add new chuc vu */}
        <div className="border rounded-lg p-4 bg-gray-50">
          <h3 className="font-semibold mb-4">Thêm chức vụ mới</h3>

          <Select
            label="Chọn chức vụ *"
            value={selectedChucVu || ''}
            onChange={(e) => setSelectedChucVu(e.target.value)}
            className="mb-4"
          >
            <option value="">-- Chọn chức vụ --</option>
            {availableChucVu.map((cv) => (
              <option key={cv.maChucVu} value={cv.maChucVu}>
                {cv.tenChucVu}
              </option>
            ))}
          </Select>

          {showBanSelect && (
            <Select
              label="Chọn ban"
              value={selectedBan || ''}
              onChange={(e) => setSelectedBan(e.target.value)}
              className="mb-4"
            >
              <option value="">-- Không chọn ban --</option>
              {allBan.map((b) => (
                <option key={b.maBan} value={b.maBan}>
                  {b.tenBan}
                </option>
              ))}
            </Select>
          )}

          <Input
            label="Ngày nhận chức *"
            type="date"
            value={ngayNhanChuc}
            onChange={(e) => setNgayNhanChuc(e.target.value)}
            className="mb-4"
          />

          <Button
            onClick={handleAddChucVu}
            isLoading={addChucVuMutation.isLoading}
            className="w-full"
          >
            Thêm chức vụ
          </Button>
        </div>

        {/* Section 2: Current chuc vu list */}
        <div className="border rounded-lg p-4">
          <h3 className="font-semibold mb-4">Danh sách chức vụ hiện tại</h3>

          {currentChucVu.length === 0 ? (
            <p className="text-gray-500 text-center py-4">Chưa có chức vụ nào</p>
          ) : (
            <div className="space-y-3">
              {currentChucVu.map((cv) => (
                <div
                  key={cv.id}
                  className="flex items-center justify-between bg-gray-50 p-3 rounded-lg"
                >
                  <div className="flex-1">
                    <h4 className="font-semibold">{cv.tenChucVu}</h4>
                    {cv.tenBan && (
                      <p className="text-sm text-gray-600">Ban: {cv.tenBan}</p>
                    )}
                    <p className="text-xs text-gray-500">
                      Từ: {new Date(cv.ngayNhanChuc).toLocaleDateString('vi-VN')}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-red-600 hover:bg-red-50"
                    icon={Trash2}
                    onClick={() => handleRemoveChucVu(cv.id)}
                    isLoading={removeChucVuMutation.isLoading}
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Close button */}
        <div className="flex justify-end">
          <Button variant="outline" onClick={onClose}>
            Đóng
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default AddChucVuModal;
