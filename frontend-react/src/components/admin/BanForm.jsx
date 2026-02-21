import { useState, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import banService from '../../services/banService';
import Button from '../common/Button';
import Input from '../common/Input';
import Select from '../common/Select';
import Textarea from '../common/Textarea';

const LOAI_BAN_OPTIONS = [
  { value: 'DOAN', label: 'Đoàn' },
  { value: 'HOI', label: 'Hội' },
  { value: 'DOI', label: 'Đội' },
  { value: 'CLB', label: 'CLB' },
  { value: 'BAN', label: 'Ban' },
];

const BanForm = ({
  initialData = null,
  mode = 'create',
  onSuccess = () => {},
  onCancel = () => {},
}) => {
  const isEdit = mode === 'edit';

  const [formData, setFormData] = useState({
    maBan: '',
    tenBan: '',
    loaiBan: 'DOAN',
    moTa: '',
    isActive: true,
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    }
  }, [initialData]);

  // Create mutation
  const createMutation = useMutation({
    mutationFn: (data) => banService.create(data),
    onSuccess: () => {
        onSuccess();
    },
      onError: (error) => {
        const message = error.response?.data?.message || 'Tạo ban thất bại!';
        toast.error(message);
    },
    }
  );

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: (data) => banService.update(initialData.maBan, data),
    onSuccess: () => {
        onSuccess();
    },
      onError: (error) => {
        const message = error.response?.data?.message || 'Cập nhật ban thất bại!';
        toast.error(message);
    },
    }
  );

  const validate = () => {
    const newErrors = {};

    if (!formData.maBan?.trim()) {
      newErrors.maBan = 'Mã ban không được để trống';
    }

    if (!formData.tenBan?.trim()) {
      newErrors.tenBan = 'Tên ban không được để trống';
    }

    if (!formData.loaiBan) {
      newErrors.loaiBan = 'Vui lòng chọn loại ban';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    if (isEdit) {
      updateMutation.mutate(formData);
    } else {
      createMutation.mutate(formData);
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
          {isEdit ? 'Chỉnh sửa ban' : 'Tạo ban mới'}
        </h2>
      </div>

      {/* Mã ban */}
      <Input
        label="Mã ban *"
        name="maBan"
        value={formData.maBan}
        onChange={handleChange}
        placeholder="VD: BAN001"
        error={errors.maBan}
        disabled={isEdit}
      />

      {/* Tên ban */}
      <Input
        label="Tên ban *"
        name="tenBan"
        value={formData.tenBan}
        onChange={handleChange}
        placeholder="VD: Ban Truyền thông"
        error={errors.tenBan}
      />

      {/* Loại ban */}
      <Select
        label="Loại ban *"
        name="loaiBan"
        value={formData.loaiBan}
        onChange={handleChange}
        error={errors.loaiBan}
      >
        {LOAI_BAN_OPTIONS.map((opt) => (
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
        placeholder="Mô tả chi tiết về ban..."
        rows={4}
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

export default BanForm;
