import { useForm } from 'react-hook-form';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { Save, X } from 'lucide-react';
import activityService from '../../services/activityService';
import Input from '../common/Input';
import Select from '../common/Select';
import Button from '../common/Button';
import { ACTIVITY_TYPES, ACTIVITY_LEVELS } from '../../utils/constants';

const ActivityForm = ({ initialData, mode = 'create', onSuccess, onCancel }) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues: initialData || {
      maHoatDong: '',
      tenHoatDong: '',
      moTa: '',
      loaiHoatDong: 'KHAC',
      capDo: 'TRUONG',
      ngayToChuc: '',
      diaDiem: '',
      soNguoiDangKy: 0,
      soLuongToiDa: 100,
    },
  });

  const mutation = useMutation(
    (data) => {
      if (mode === 'create') {
        return activityService.create(data);
      } else {
        return activityService.update(initialData.maHoatDong, data);
      }
    },
    {
      onSuccess: () => {
        toast.success(
          mode === 'create'
            ? 'Tạo hoạt động thành công!'
            : 'Cập nhật hoạt động thành công!'
        );
        onSuccess();
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Có lỗi xảy ra!');
      },
    }
  );

  const onSubmit = (data) => {
    mutation.mutate(data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Mã hoạt động */}
        <Input
          label="Mã hoạt động"
          {...register('maHoatDong', {
            required: 'Mã hoạt động là bắt buộc',
          })}
          error={errors.maHoatDong?.message}
          disabled={mode === 'edit'}
          required
        />

        {/* Tên hoạt động */}
        <Input
          label="Tên hoạt động"
          {...register('tenHoatDong', {
            required: 'Tên hoạt động là bắt buộc',
          })}
          error={errors.tenHoatDong?.message}
          required
        />

        {/* Loại hoạt động */}
        <Select
          label="Loại hoạt động"
          {...register('loaiHoatDong')}
          options={Object.entries(ACTIVITY_TYPES).map(([key, value]) => ({
            value: key,
            label: value,
          }))}
        />

        {/* Cấp độ */}
        <Select
          label="Cấp độ"
          {...register('capDo')}
          options={Object.entries(ACTIVITY_LEVELS).map(([key, value]) => ({
            value: key,
            label: value,
          }))}
        />

        {/* Ngày tổ chức */}
        <Input
          label="Ngày tổ chức"
          type="datetime-local"
          {...register('ngayToChuc', {
            required: 'Ngày tổ chức là bắt buộc',
          })}
          error={errors.ngayToChuc?.message}
          required
        />

        {/* Địa điểm */}
        <Input
          label="Địa điểm"
          {...register('diaDiem')}
          error={errors.diaDiem?.message}
          placeholder="VD: Phòng A101"
        />

        {/* Số người tối đa */}
        <Input
          label="Số người tối đa"
          type="number"
          {...register('soLuongToiDa', {
            required: 'Số người tối đa là bắt buộc',
            min: { value: 1, message: 'Phải từ 1 người trở lên' },
          })}
          error={errors.soLuongToiDa?.message}
          required
        />
      </div>

      {/* Mô tả */}
      <div>
        <label className="form-label">Mô tả hoạt động</label>
        <textarea
          {...register('moTa')}
          className="form-input"
          rows="4"
          placeholder="Nhập mô tả chi tiết về hoạt động..."
        />
        {errors.moTa && <p className="form-error">{errors.moTa.message}</p>}
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-2 pt-4 border-t">
        <Button type="button" variant="outline" onClick={onCancel} icon={X}>
          Hủy
        </Button>
        <Button
          type="submit"
          icon={Save}
          isLoading={mutation.isLoading}
          disabled={mutation.isLoading}
        >
          {mode === 'create' ? 'Tạo hoạt động' : 'Cập nhật'}
        </Button>
      </div>
    </form>
  );
};

export default ActivityForm;
