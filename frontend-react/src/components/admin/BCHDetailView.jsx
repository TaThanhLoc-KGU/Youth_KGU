import { Edit, X } from 'lucide-react';
import Modal from '../../components/common/Modal';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';

const BCHDetailView = ({ isOpen, bch, onClose, onEdit }) => {
  if (!isOpen || !bch) return null;

  // Get display name
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
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <div className="space-y-6 max-w-2xl">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-2xl font-bold">{getDisplayName()}</h2>
            <div className="flex gap-2 mt-2">
              <Badge variant={loaiColor[bch.loaiThanhVien] || 'default'}>
                {getLoaiDisplay()}
              </Badge>
              <Badge variant={bch.isActive ? 'success' : 'danger'}>
                {bch.isActive ? 'Hoạt động' : 'Ngừng'}
              </Badge>
            </div>
          </div>
          <Button
            size="sm"
            icon={Edit}
            onClick={() => {
              onEdit();
              onClose();
            }}
          >
            Sửa
          </Button>
        </div>

        {/* Thông tin cá nhân */}
        <Card>
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Thông tin cá nhân</h3>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <label className="text-gray-600 font-medium">Mã BCH</label>
                <p className="mt-1 font-mono">{bch.maBch}</p>
              </div>
              <div>
                <label className="text-gray-600 font-medium">Email</label>
                <p className="mt-1">{bch.email || bch.sinhVien?.email || '-'}</p>
              </div>
              <div>
                <label className="text-gray-600 font-medium">SĐT</label>
                <p className="mt-1">{bch.soDienThoai || bch.sinhVien?.soDienThoai || '-'}</p>
              </div>
              <div>
                <label className="text-gray-600 font-medium">Đơn vị</label>
                <p className="mt-1">{bch.donVi || bch.tenLop || '-'}</p>
              </div>
              {bch.sinhVien && (
                <>
                  <div>
                    <label className="text-gray-600 font-medium">Khoa</label>
                    <p className="mt-1">{bch.sinhVien?.lop?.maKhoa?.tenKhoa || '-'}</p>
                  </div>
                  <div>
                    <label className="text-gray-600 font-medium">Giới tính</label>
                    <p className="mt-1">{bch.sinhVien?.gioiTinh || '-'}</p>
                  </div>
                  <div>
                    <label className="text-gray-600 font-medium">Ngày sinh</label>
                    <p className="mt-1">{bch.sinhVien?.ngaySinh || '-'}</p>
                  </div>
                </>
              )}
            </div>
          </div>
        </Card>

        {/* Thông tin nhiệm kỳ */}
        <Card>
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Thông tin nhiệm kỳ</h3>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <label className="text-gray-600 font-medium">Nhiệm kỳ</label>
                <p className="mt-1 font-medium">{bch.nhiemKy || '-'}</p>
              </div>
              <div>
                <label className="text-gray-600 font-medium">Ngày bắt đầu</label>
                <p className="mt-1">{bch.ngayBatDau || '-'}</p>
              </div>
              <div>
                <label className="text-gray-600 font-medium">Ngày kết thúc</label>
                <p className="mt-1">{bch.ngayKetThuc || '-'}</p>
              </div>
              {bch.hinhAnh && (
                <div>
                  <label className="text-gray-600 font-medium">Hình ảnh</label>
                  <a
                    href={bch.hinhAnh}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-1 text-blue-600 hover:underline text-sm"
                  >
                    Xem hình ảnh
                  </a>
                </div>
              )}
            </div>
          </div>
        </Card>

        {/* Chức vụ */}
        {bch.danhSachChucVu && bch.danhSachChucVu.length > 0 && (
          <Card>
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Chức vụ ({bch.danhSachChucVu.length})</h3>

              <div className="space-y-3">
                {bch.danhSachChucVu.map((cv) => (
                  <div key={cv.id} className="bg-gray-50 p-3 rounded-lg">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium">{cv.tenChucVu}</p>
                        {cv.tenBan && <p className="text-sm text-gray-600">Ban: {cv.tenBan}</p>}
                        <p className="text-xs text-gray-600 mt-1">
                          Ngày nhận: {cv.ngayNhanChuc}
                        </p>
                      </div>
                      {cv.isActive !== false && (
                        <Badge variant="success" size="sm">
                          Hoạt động
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        )}

        {/* Close Button */}
        <div className="flex justify-end gap-2 pt-4">
          <Button variant="outline" onClick={onClose} icon={X}>
            Đóng
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default BCHDetailView;
