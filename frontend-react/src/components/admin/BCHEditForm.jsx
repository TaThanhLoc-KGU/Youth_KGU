import { useState } from 'react';
import { useMutation, useQueryClient } from 'react-query';
import { toast } from 'react-toastify';
import { Settings, Trash2 } from 'lucide-react';
import bchService from '../../services/bchService';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import Modal from '../../components/common/Modal';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import AddChucVuModal from './AddChucVuModal';

const BCHEditForm = ({ isOpen, bch, onClose, onSuccess }) => {
  const queryClient = useQueryClient();
  const [isChucVuModalOpen, setIsChucVuModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    nhiemKy: bch?.nhiemKy || '',
    ngayBatDau: bch?.ngayBatDau || '',
    ngayKetThuc: bch?.ngayKetThuc || '',
    hinhAnh: bch?.hinhAnh || '',
    isActive: bch?.isActive !== false,
  });
  const [errors, setErrors] = useState({});

  // Update mutation
  const updateMutation = useMutation(
    (data) => bchService.update(bch?.maBch, data),
    {
      onSuccess: () => {
        toast.success('Cập nhật BCH thành công!');
        queryClient.invalidateQueries('bch');
        queryClient.invalidateQueries('bch-statistics');
        onSuccess?.();
        onClose?.();
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Cập nhật BCH thất bại!');
      },
    }
  );

  const validateForm = () => {
    const newErrors = {};
    if (!formData.nhiemKy) newErrors.nhiemKy = 'Vui lòng nhập nhiệm kỳ';
    if (!formData.ngayBatDau) newErrors.ngayBatDau = 'Vui lòng chọn ngày bắt đầu';
    if (!formData.ngayKetThuc) newErrors.ngayKetThuc = 'Vui lòng chọn ngày kết thúc';
    if (
      formData.ngayBatDau &&
      formData.ngayKetThuc &&
      formData.ngayBatDau >= formData.ngayKetThuc
    ) {
      newErrors.ngayKetThuc = 'Ngày kết thúc phải sau ngày bắt đầu';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
    if (errors[field]) {
      setErrors({ ...errors, [field]: '' });
    }
  };

  const handleSubmit = () => {
    if (!validateForm()) return;

    const submitData = {
      nhiemKy: formData.nhiemKy,
      ngayBatDau: formData.ngayBatDau,
      ngayKetThuc: formData.ngayKetThuc,
      hinhAnh: formData.hinhAnh,
      isActive: formData.isActive,
    };

    updateMutation.mutate(submitData);
  };

  if (!isOpen || !bch) return null;

  // Get display name and type
  const getDisplayName = () => {
    if (bch.loaiThanhVien === 'SINH_VIEN') {
      return bch.hoTen || bch.sinhVien?.hoTen || '-';
    }
    return bch.hoTen || bch.giang_vien?.hoTen || bch.chuyen_vien?.hoTen || '-';
  };

  const getLoaiDisplay = () => {
    if (bch.loaiThanhVien === 'SINH_VIEN') return 'Sinh viên';
    if (bch.loaiThanhVien === 'GIANG_VIEN') return 'Giảng viên';
    if (bch.loaiThanhVien === 'CHUYEN_VIEN') return 'Chuyên viên';
    return '-';
  };

  const loaiColor = {
    SINH_VIEN: 'info',
    GIANG_VIEN: 'success',
    CHUYEN_VIEN: 'warning',
  };

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} size="lg">
        <div className="space-y-6 max-w-2xl">
          <div>
            <h2 className="text-2xl font-bold">Chỉnh sửa BCH</h2>
            <p className="text-gray-600 text-sm mt-1">
              {bch.maBch} • {getLoaiDisplay()}
            </p>
          </div>

          {/* Thông tin cá nhân - Read only */}
          <Card>
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Thông tin cá nhân</h3>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">Loại thành viên</label>
                  <div className="mt-2">
                    <Badge variant={loaiColor[bch.loaiThanhVien] || 'default'}>
                      {getLoaiDisplay()}
                    </Badge>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Mã BCH</label>
                  <p className="mt-1 font-mono font-medium">{bch.maBch}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Họ tên</label>
                  <p className="mt-1 font-medium">{getDisplayName()}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Email</label>
                  <p className="mt-1">{bch.email || bch.sinhVien?.email || '-'}</p>
                </div>
                {bch.donVi && (
                  <div>
                    <label className="text-sm font-medium text-gray-700">Đơn vị</label>
                    <p className="mt-1">{bch.donVi}</p>
                  </div>
                )}
              </div>

              <div className="bg-blue-50 p-3 rounded-lg text-xs text-gray-600">
                <p>Thông tin cá nhân không thể chỉnh sửa. Để thay đổi, vui lòng tạo BCH mới.</p>
              </div>
            </div>
          </Card>

          {/* Thông tin nhiệm kỳ - Editable */}
          <Card>
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Thông tin nhiệm kỳ</h3>

              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Nhiệm kỳ"
                  placeholder="VD: 2023-2024"
                  value={formData.nhiemKy}
                  onChange={(e) => handleInputChange('nhiemKy', e.target.value)}
                  error={errors.nhiemKy}
                  required
                />
                <Input
                  label="Ngày bắt đầu"
                  type="date"
                  value={formData.ngayBatDau}
                  onChange={(e) => handleInputChange('ngayBatDau', e.target.value)}
                  error={errors.ngayBatDau}
                  required
                />
              </div>

              <Input
                label="Ngày kết thúc"
                type="date"
                value={formData.ngayKetThuc}
                onChange={(e) => handleInputChange('ngayKetThuc', e.target.value)}
                error={errors.ngayKetThuc}
                required
              />

              <Input
                label="Hình ảnh (URL)"
                placeholder="https://example.com/image.jpg"
                value={formData.hinhAnh}
                onChange={(e) => handleInputChange('hinhAnh', e.target.value)}
              />

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) => handleInputChange('isActive', e.target.checked)}
                  className="rounded"
                />
                <label htmlFor="isActive" className="text-sm font-medium text-gray-700">
                  Đang hoạt động
                </label>
              </div>
            </div>
          </Card>

          {/* Quản lý chức vụ */}
          {bch.danhSachChucVu && bch.danhSachChucVu.length > 0 ? (
            <Card>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="font-semibold text-lg">Chức vụ hiện tại ({bch.danhSachChucVu.length})</h3>
                  <Button
                    size="sm"
                    icon={Settings}
                    onClick={() => setIsChucVuModalOpen(true)}
                  >
                    Quản lý
                  </Button>
                </div>

                <div className="flex flex-wrap gap-2">
                  {bch.danhSachChucVu.map((cv) => (
                    <Badge key={cv.id} variant="info">
                      {cv.tenChucVu}
                      {cv.tenBan && ` (${cv.tenBan})`}
                    </Badge>
                  ))}
                </div>
              </div>
            </Card>
          ) : (
            <Card className="bg-yellow-50 border border-yellow-200">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm font-medium text-yellow-900">Chưa có chức vụ</p>
                  <p className="text-xs text-yellow-700 mt-1">
                    Vui lòng thêm ít nhất 1 chức vụ
                  </p>
                </div>
                <Button
                  size="sm"
                  icon={Settings}
                  onClick={() => setIsChucVuModalOpen(true)}
                >
                  Thêm
                </Button>
              </div>
            </Card>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={onClose}>
              Hủy
            </Button>
            <Button
              onClick={handleSubmit}
              loading={updateMutation.isLoading}
            >
              Lưu thay đổi
            </Button>
          </div>
        </div>
      </Modal>

      {/* Manage Positions Modal */}
      <AddChucVuModal
        isOpen={isChucVuModalOpen}
        maBch={bch?.maBch}
        onClose={() => setIsChucVuModalOpen(false)}
        onSuccess={() => {
          queryClient.invalidateQueries('bch');
          queryClient.invalidateQueries('bch-statistics');
        }}
      />
    </>
  );
};

export default BCHEditForm;
