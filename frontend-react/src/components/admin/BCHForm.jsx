import { useForm } from 'react-hook-form';
import { useMutation, useQuery } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { Save, X, Check, AlertCircle, Loader } from 'lucide-react';
import bchService from '../../services/bchService';
import { useEmailValidation } from '../../hooks/useEmailValidation';
import Input from '../common/Input';
import Select from '../common/Select';
import Button from '../common/Button';

const BCHForm = ({ initialData, mode = 'create', onSuccess, onCancel }) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm({
    defaultValues: initialData || {
      maBch: '',
      hoTen: '',
      email: '',
      soDienThoai: '',
      chucVu: '',
      maKhoa: '',
      nhiemKy: '',
      ngayBatDau: '',
      ngayKetThuc: '',
      isActive: true,
    },
  });

  const emailValue = watch('email');
  const { isValid: isEmailValid, isDuplicate, isLoading: isEmailLoading, isEmailOk } = useEmailValidation(
    emailValue,
    mode === 'edit' ? initialData?.maBch : null
  );

  // Fetch departments (khoa)
  const { data: departments = [] } = useQuery(
    'khoa-list',
    async () => {
      try {
        // This would call the khoa API, returning a list of departments
        // For now, mock data - replace with actual API call
        return [
          { maKhoa: 'CNTT', tenKhoa: 'Công nghệ thông tin' },
          { maKhoa: 'KT', tenKhoa: 'Kỹ thuật' },
          { maKhoa: 'QL', tenKhoa: 'Quản lý' },
          { maKhoa: 'KN', tenKhoa: 'Kinh tế' },
          { maKhoa: 'NN', tenKhoa: 'Ngoại ngữ' },
        ];
      } catch (error) {
        console.error('Error fetching departments:', error);
        return [];
      }
    },
    { staleTime: Infinity }
  );

  const mutation = useMutation(
    (data) => {
      if (mode === 'create') {
        return bchService.create(data);
      } else {
        return bchService.update(initialData.maBch, data);
      }
    },
    {
      onSuccess: () => {
        toast.success(
          mode === 'create'
            ? 'Thêm thành viên BCH thành công!'
            : 'Cập nhật thành viên BCH thành công!'
        );
        onSuccess();
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Có lỗi xảy ra!');
      },
    }
  );

  const onSubmit = (data) => {
    // Validate email before submitting
    if (emailValue && !isEmailOk) {
      if (!isEmailValid) {
        toast.error('Email không hợp lệ');
      } else if (isDuplicate) {
        toast.error('Email đã tồn tại trong hệ thống');
      }
      return;
    }

    // Prepare data - convert string booleans if needed
    const submitData = {
      ...data,
      isActive: data.isActive === 'true' || data.isActive === true,
    };

    mutation.mutate(submitData);
  };

  const chucVuOptions = [
    { value: '', label: '-- Chọn chức vụ --' },
    { value: 'Chủ tịch', label: 'Chủ tịch' },
    { value: 'Phó chủ tịch', label: 'Phó chủ tịch' },
    { value: 'Tuyên truyền', label: 'Tuyên truyền' },
    { value: 'Ngoại ngữ', label: 'Ngoại ngữ' },
    { value: 'Văn hóa - Thể thao', label: 'Văn hóa - Thể thao' },
    { value: 'Học tập', label: 'Học tập' },
    { value: 'Công tác xã hội', label: 'Công tác xã hội' },
  ];

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Mã BCH */}
        <Input
          label="Mã BCH"
          {...register('maBch', {
            required: 'Mã BCH là bắt buộc',
            pattern: {
              value: /^[A-Z0-9]+$/,
              message: 'Mã BCH chỉ chứa chữ in hoa và số',
            },
          })}
          error={errors.maBch?.message}
          disabled={mode === 'edit'}
          required
        />

        {/* Họ và tên */}
        <Input
          label="Họ và tên"
          {...register('hoTen', {
            required: 'Họ tên là bắt buộc',
            minLength: {
              value: 2,
              message: 'Họ tên phải có ít nhất 2 ký tự',
            },
          })}
          error={errors.hoTen?.message}
          required
        />

        {/* Email */}
        <div className="relative">
          <Input
            label="Email"
            type="email"
            {...register('email', {
              required: 'Email là bắt buộc',
              pattern: {
                value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                message: 'Email không hợp lệ',
              },
            })}
            error={
              errors.email?.message ||
              (emailValue && !isEmailValid && !isEmailLoading
                ? 'Email không hợp lệ'
                : null) ||
              (emailValue && isDuplicate ? 'Email đã tồn tại' : null)
            }
            required
          />
          {emailValue && (
            <div className="absolute right-3 top-[38px] flex items-center">
              {isEmailLoading && (
                <Loader className="w-5 h-5 text-gray-400 animate-spin" />
              )}
              {!isEmailLoading && isEmailOk && (
                <div className="flex items-center gap-1">
                  <Check className="w-5 h-5 text-green-500" />
                  <span className="text-xs text-green-600 font-medium">Hợp lệ</span>
                </div>
              )}
              {!isEmailLoading && isDuplicate && (
                <div className="flex items-center gap-1">
                  <AlertCircle className="w-5 h-5 text-red-500" />
                  <span className="text-xs text-red-600 font-medium">Trùng lặp</span>
                </div>
              )}
              {!isEmailLoading && emailValue && !isEmailValid && (
                <AlertCircle className="w-5 h-5 text-yellow-500" />
              )}
            </div>
          )}
        </div>

        {/* Số điện thoại */}
        <Input
          label="Số điện thoại"
          {...register('soDienThoai', {
            pattern: {
              value: /^[0-9]{10}$/,
              message: 'Số điện thoại phải có 10 chữ số',
            },
          })}
          error={errors.soDienThoai?.message}
          placeholder="0123456789"
        />

        {/* Chức vụ */}
        <Select
          label="Chức vụ"
          {...register('chucVu', {
            required: 'Chức vụ là bắt buộc',
          })}
          options={chucVuOptions}
          error={errors.chucVu?.message}
          required
        />

        {/* Khoa */}
        <Select
          label="Khoa/Bộ môn"
          {...register('maKhoa', {
            required: 'Khoa là bắt buộc',
          })}
          options={[
            { value: '', label: '-- Chọn khoa --' },
            ...departments.map((dept) => ({
              value: dept.maKhoa,
              label: dept.tenKhoa,
            })),
          ]}
          error={errors.maKhoa?.message}
          required
        />

        {/* Nhiệm kỳ */}
        <Input
          label="Nhiệm kỳ"
          {...register('nhiemKy')}
          placeholder="Ví dụ: 2023-2024"
          error={errors.nhiemKy?.message}
        />

        {/* Ngày bắt đầu */}
        <Input
          label="Ngày bắt đầu"
          type="date"
          {...register('ngayBatDau')}
          error={errors.ngayBatDau?.message}
        />

        {/* Ngày kết thúc */}
        <Input
          label="Ngày kết thúc"
          type="date"
          {...register('ngayKetThuc')}
          error={errors.ngayKetThuc?.message}
        />

        {/* Trạng thái */}
        <Select
          label="Trạng thái"
          {...register('isActive')}
          options={[
            { value: 'true', label: 'Hoạt động' },
            { value: 'false', label: 'Ngừng hoạt động' },
          ]}
        />
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
          disabled={
            mutation.isLoading ||
            isEmailLoading ||
            (emailValue && !isEmailOk)
          }
          title={
            emailValue && !isEmailOk
              ? isDuplicate
                ? 'Email đã tồn tại'
                : 'Email không hợp lệ'
              : undefined
          }
        >
          {mode === 'create' ? 'Thêm BCH' : 'Cập nhật'}
        </Button>
      </div>
    </form>
  );
};

export default BCHForm;
