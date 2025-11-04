import { useState, useEffect } from 'react';
import { useMutation } from 'react-query';
import { toast } from 'react-toastify';
import Input from '../common/Input';
import Select from '../common/Select';
import Textarea from '../common/Textarea';
import Button from '../common/Button';
import Card from '../common/Card';
import ImageUpload from '../common/ImageUpload';
import activityService from '../../services/activityService';
import {
  LOAI_HOAT_DONG_OPTIONS,
  CAP_DO_OPTIONS,
  TRANG_THAI_OPTIONS,
} from '../../constants/activityConstants';

const ActivityForm = ({
  initialData = null,
  mode = 'create',
  onSuccess = () => {},
  onCancel = () => {},
  khoas = [],
}) => {
  const isEdit = mode === 'edit';

  const [formData, setFormData] = useState({
    maHoatDong: '',
    tenHoatDong: '',
    moTa: '',
    loaiHoatDong: 'HOI_THAO',
    capDo: 'KHOA',
    ngayToChuc: '',
    gioToChuc: '',
    thoiGianBatDau: '07:00',
    thoiGianKetThuc: '17:00',
    thoiGianTreToiDa: 15,
    thoiGianToiThieu: 120,
    choPhepCheckInSom: 30,
    yeuCauCheckOut: false,
    diaDiem: '',
    soLuongToiDa: '',
    diemRenLuyen: '',
    maKhoa: '',
    hanDangKy: '',
    hinhAnhPoster: '',
    ghiChu: '',
    yeuCauDiemDanh: true,
    choPhepDangKy: true,
    trangThai: 'SAP_DIEN_RA',
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (initialData) {
      setFormData({
        ...formData,
        ...initialData,
      });
    }
  }, [initialData]);

  const createMutation = useMutation(
    (data) => activityService.create(data),
    {
      onSuccess: () => {
        toast.success('Tạo hoạt động thành công!');
        onSuccess();
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Tạo hoạt động thất bại!');
      },
    }
  );

  const updateMutation = useMutation(
    (data) => activityService.update(initialData.maHoatDong, data),
    {
      onSuccess: () => {
        toast.success('Cập nhật hoạt động thành công!');
        onSuccess();
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Cập nhật hoạt động thất bại!');
      },
    }
  );

  const validate = () => {
    const newErrors = {};

    if (!formData.maHoatDong?.trim() && !isEdit) {
      newErrors.maHoatDong = 'Mã hoạt động không được để trống';
    }
    if (!formData.tenHoatDong?.trim()) {
      newErrors.tenHoatDong = 'Tên hoạt động không được để trống';
    }
    if (!formData.ngayToChuc) {
      newErrors.ngayToChuc = 'Vui lòng chọn ngày tổ chức';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;

    const submitData = {
      ...formData,
      thoiGianTreToiDa: formData.thoiGianTreToiDa ? parseInt(formData.thoiGianTreToiDa) : null,
      thoiGianToiThieu: formData.thoiGianToiThieu ? parseInt(formData.thoiGianToiThieu) : null,
      choPhepCheckInSom: formData.choPhepCheckInSom ? parseInt(formData.choPhepCheckInSom) : 30,
      soLuongToiDa: formData.soLuongToiDa ? parseInt(formData.soLuongToiDa) : null,
      diemRenLuyen: formData.diemRenLuyen ? parseInt(formData.diemRenLuyen) : null,
    };

    if (isEdit) {
      updateMutation.mutate(submitData);
    } else {
      createMutation.mutate(submitData);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const isLoading = createMutation.isLoading || updateMutation.isLoading;

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-4xl">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          {isEdit ? 'Chỉnh sửa hoạt động' : 'Tạo hoạt động mới'}
        </h2>
        <p className="text-gray-600 text-sm">
          {isEdit ? 'Cập nhật thông tin hoạt động' : 'Nhập thông tin hoạt động'}
        </p>
      </div>

      {/* Basic Information */}
      <Card>
        <div className="space-y-4">
          <h3 className="font-semibold text-lg text-gray-900">Thông tin cơ bản</h3>

          <div className="grid grid-cols-2 gap-4">
            {!isEdit && (
              <Input
                label="Mã hoạt động *"
                name="maHoatDong"
                value={formData.maHoatDong}
                onChange={handleChange}
                placeholder="VD: HD001"
                error={errors.maHoatDong}
              />
            )}
            <Input
              label="Tên hoạt động *"
              name="tenHoatDong"
              value={formData.tenHoatDong}
              onChange={handleChange}
              placeholder="VD: Hội thảo công nghệ"
              error={errors.tenHoatDong}
              className={!isEdit ? '' : 'col-span-2'}
            />
          </div>

          <Textarea
            label="Mô tả"
            name="moTa"
            value={formData.moTa || ''}
            onChange={handleChange}
            placeholder="Mô tả chi tiết về hoạt động..."
            rows={3}
          />

          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Loại hoạt động *"
              name="loaiHoatDong"
              value={formData.loaiHoatDong}
              onChange={handleChange}
            >
              {LOAI_HOAT_DONG_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </Select>
            <Select
              label="Cấp độ *"
              name="capDo"
              value={formData.capDo}
              onChange={handleChange}
            >
              {CAP_DO_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </Select>
          </div>
        </div>
      </Card>

      {/* Date & Time */}
      <Card>
        <div className="space-y-4">
          <h3 className="font-semibold text-lg text-gray-900">Thời gian & Địa điểm</h3>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Ngày tổ chức *"
              type="date"
              name="ngayToChuc"
              value={formData.ngayToChuc}
              onChange={handleChange}
              error={errors.ngayToChuc}
            />
            <Input
              label="Giờ tổ chức"
              type="time"
              name="gioToChuc"
              value={formData.gioToChuc}
              onChange={handleChange}
            />
          </div>

          <Input
            label="Địa điểm"
            name="diaDiem"
            value={formData.diaDiem}
            onChange={handleChange}
            placeholder="VD: Tòa nhà A, Phòng 101"
          />
        </div>
      </Card>

      {/* Check-in Settings */}
      <Card>
        <div className="space-y-4">
          <h3 className="font-semibold text-lg text-gray-900">Cài đặt Check-in</h3>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Thời gian bắt đầu"
              type="time"
              name="thoiGianBatDau"
              value={formData.thoiGianBatDau}
              onChange={handleChange}
            />
            <Input
              label="Thời gian kết thúc"
              type="time"
              name="thoiGianKetThuc"
              value={formData.thoiGianKetThuc}
              onChange={handleChange}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Cho phép check-in sớm (phút)"
              type="number"
              name="choPhepCheckInSom"
              value={formData.choPhepCheckInSom}
              onChange={handleChange}
              min="0"
            />
            <Input
              label="Thời gian trễ tối đa (phút)"
              type="number"
              name="thoiGianTreToiDa"
              value={formData.thoiGianTreToiDa}
              onChange={handleChange}
              min="0"
            />
          </div>

          <Input
            label="Thời gian tham gia tối thiểu (phút)"
            type="number"
            name="thoiGianToiThieu"
            value={formData.thoiGianToiThieu}
            onChange={handleChange}
            min="0"
          />

          <div className="flex items-center">
            <input
              type="checkbox"
              id="yeuCauCheckOut"
              name="yeuCauCheckOut"
              checked={formData.yeuCauCheckOut}
              onChange={handleChange}
              className="w-4 h-4 text-primary rounded border-gray-300"
            />
            <label htmlFor="yeuCauCheckOut" className="ml-2 text-sm text-gray-700">
              Yêu cầu check-out
            </label>
          </div>
        </div>
      </Card>

      {/* Capacity & Points */}
      <Card>
        <div className="space-y-4">
          <h3 className="font-semibold text-lg text-gray-900">Quy mô & Điểm</h3>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Số lượng tối đa"
              type="number"
              name="soLuongToiDa"
              value={formData.soLuongToiDa}
              onChange={handleChange}
              min="0"
            />
            <Input
              label="Điểm rèn luyện"
              type="number"
              name="diemRenLuyen"
              value={formData.diemRenLuyen}
              onChange={handleChange}
              min="0"
            />
          </div>
        </div>
      </Card>

      {/* Registration & Status */}
      <Card>
        <div className="space-y-4">
          <h3 className="font-semibold text-lg text-gray-900">Đăng ký & Trạng thái</h3>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Hạn đăng ký"
              type="datetime-local"
              name="hanDangKy"
              value={formData.hanDangKy}
              onChange={handleChange}
            />
            <Select
              label="Trạng thái"
              name="trangThai"
              value={formData.trangThai}
              onChange={handleChange}
            >
              {TRANG_THAI_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </Select>
          </div>

          <div className="flex gap-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                name="choPhepDangKy"
                checked={formData.choPhepDangKy}
                onChange={handleChange}
                className="w-4 h-4 text-primary rounded border-gray-300"
              />
              <span className="ml-2 text-sm text-gray-700">Cho phép đăng ký</span>
            </label>
            <label className="flex items-center">
              <input
                type="checkbox"
                name="yeuCauDiemDanh"
                checked={formData.yeuCauDiemDanh}
                onChange={handleChange}
                className="w-4 h-4 text-primary rounded border-gray-300"
              />
              <span className="ml-2 text-sm text-gray-700">Yêu cầu điểm danh</span>
            </label>
          </div>
        </div>
      </Card>

      {/* Additional Info */}
      <Card>
        <div className="space-y-4">
          <h3 className="font-semibold text-lg text-gray-900">Thông tin bổ sung</h3>

          <ImageUpload
            label="Hình ảnh poster"
            value={formData.hinhAnhPoster}
            onChange={handleChange}
            error={errors.hinhAnhPoster}
          />

          <Textarea
            label="Ghi chú"
            name="ghiChu"
            value={formData.ghiChu || ''}
            onChange={handleChange}
            placeholder="Ghi chú thêm về hoạt động..."
            rows={3}
          />
        </div>
      </Card>

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-4 border-t">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isLoading}
        >
          Hủy
        </Button>
        <Button type="submit" isLoading={isLoading}>
          {isEdit ? 'Cập nhật' : 'Tạo'}
        </Button>
      </div>
    </form>
  );
};

export default ActivityForm;
