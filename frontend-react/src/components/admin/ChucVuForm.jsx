import { useState, useEffect } from 'react';
import { useMutation } from 'react-query';
import { toast } from 'react-toastify';
import chucVuService from '../../services/chucVuService';
import Button from '../common/Button';
import Input from '../common/Input';
import Select from '../common/Select';
import Textarea from '../common/Textarea';

const THUOC_BAN_OPTIONS = [
  { value: 'DOAN', label: 'Đoàn' },
  { value: 'HOI', label: 'Hội' },
  { value: 'DOI', label: 'Đội' },
  { value: 'CLB', label: 'CLB' },
  { value: 'BAN', label: 'Ban' },
];

const ChucVuForm = ({
  initialData = null,
  mode = 'create',
  onSuccess = () => {},
  onCancel = () => {},
}) => {
  const isEdit = mode === 'edit';

  const [formData, setFormData] = useState({
    maChucVu: '',
    tenChucVu: '',
    thuocBan: 'DOAN',
    moTa: '',
    thuTu: '',
    isActive: true,
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    }
  }, [initialData]);

  // Create mutation
  const createMutation = useMutation(
    (data) => chucVuService.create(data),
    {
      onSuccess: () => {
        onSuccess();
      },
      onError: (error) => {
        const message = error.response?.data?.message || 'Tạo chức vụ thất bại!';
        toast.error(message);
      },
    }
  );

  // Update mutation
  const updateMutation = useMutation(
    (data) => chucVuService.update(initialData.maChucVu, data),
    {
      onSuccess: () => {
        onSuccess();
      },
      onError: (error) => {
        const message = error.response?.data?.message || 'Cập nhật chức vụ thất bại!';
        toast.error(message);
      },
    }
  );

  const validate = () => {
    const newErrors = {};

    if (!formData.maChucVu?.trim()) {
      newErrors.maChucVu = 'Mã chức vụ không được để trống';
    }

    if (!formData.tenChucVu?.trim()) {
      newErrors.tenChucVu = 'Tên chức vụ không được để trống';
    }

    if (!formData.thuocBan) {
      newErrors.thuocBan = 'Vui lòng chọn thuộc ban';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    const submitData = {
      ...formData,
      thuTu: formData.thuTu ? parseInt(formData.thuTu) : null,
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
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-6">
          {isEdit ? 'Chỉnh sửa chức vụ' : 'Tạo chức vụ mới'}
        </h2>
      </div>

      {/* Mã chức vụ */}
      <Input
        label="Mã chức vụ *"
        name="maChucVu"
        value={formData.maChucVu}
        onChange={handleChange}
        placeholder="VD: CV001"
        error={errors.maChucVu}
        disabled={isEdit}
      />

      {/* Tên chức vụ */}
      <Input
        label="Tên chức vụ *"
        name="tenChucVu"
        value={formData.tenChucVu}
        onChange={handleChange}
        placeholder="VD: Bí thư Đoàn"
        error={errors.tenChucVu}
      />

      {/* Thuộc ban */}
      <Select
        label="Thuộc ban *"
        name="thuocBan"
        value={formData.thuocBan}
        onChange={handleChange}
        error={errors.thuocBan}
      >
        {THUOC_BAN_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </Select>

      {/* Mô tả */}
      <Textarea
        label="Mô tả"
        name="moTa"
        value={formData.moTa || ''}
        onChange={handleChange}
        placeholder="Mô tả chi tiết về chức vụ..."
        rows={4}
      />

      {/* Thứ tự */}
      <Input
        label="Thứ tự"
        name="thuTu"
        type="number"
        value={formData.thuTu || ''}
        onChange={handleChange}
        placeholder="Để trống nếu không cần"
      />

      {/* Trạng thái */}
      <div className="flex items-center">
        <input
          type="checkbox"
          id="isActive"
          name="isActive"
          checked={formData.isActive}
          onChange={handleChange}
          className="w-4 h-4 text-primary rounded border-gray-300"
        />
        <label htmlFor="isActive" className="ml-2 text-sm text-gray-700">
          Hoạt động
        </label>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isLoading}
        >
          Hủy
        </Button>
        <Button
          type="submit"
          isLoading={isLoading}
        >
          {isEdit ? 'Cập nhật' : 'Tạo'}
        </Button>
      </div>
    </form>
  );
};

export default ChucVuForm;
