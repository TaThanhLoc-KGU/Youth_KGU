import { useForm } from 'react-hook-form';
import { useMutation, useQuery } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { Save, X } from 'lucide-react';
import studentService from '../../services/studentService';
import lopService from '../../services/lopService';
import Input from '../common/Input';
import Select from '../common/Select';
import Button from '../common/Button';

const StudentForm = ({ initialData, mode = 'create', onSuccess, onCancel }) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues: initialData ? {
      ...initialData,
      isActive: initialData.isActive === true || initialData.isActive === 1,
    } : {
      maSv: '',
      hoTen: '',
      gioiTinh: '',
      ngaySinh: '',
      email: '',
      sdt: '',
      maLop: '',
      isActive: true,
    },
  });

  // Fetch danh sách lớp (raw để dùng cho datalist combobox)
  const { data: lopList = [] } = useQuery({
    queryKey: ['lop-all-raw'],
    queryFn: async () => {
      const data = await lopService.getAll();
      if (Array.isArray(data)) return data;
      return data?.data || data?.content || [];
    },
  });

  const mutation = useMutation({
    mutationFn: (data) => {
      if (mode === 'create') {
        return studentService.create(data);
      } else {
        return studentService.update(initialData.maSv, data);
      }
    },
    onSuccess: () => {
      toast.success(
        mode === 'create'
          ? 'Thêm sinh viên thành công!'
          : 'Cập nhật sinh viên thành công!'
      );
      onSuccess();
    },
    onError: (error) => {
      const msg =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        error?.message ||
        'Có lỗi xảy ra!';
      toast.error(msg);
    },
  });

  const onSubmit = (data) => {
    mutation.mutate(data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

        {/* Mã sinh viên */}
        <Input
          label="Mã sinh viên"
          {...register('maSv', {
            required: 'Mã sinh viên là bắt buộc',
            pattern: {
              value: /^[A-Z0-9]+$/,
              message: 'Mã sinh viên chỉ chứa chữ in hoa và số',
            },
          })}
          error={errors.maSv?.message}
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

        {/* Giới tính */}
        <Select
          label="Giới tính"
          {...register('gioiTinh', { required: 'Vui lòng chọn giới tính' })}
          options={[
            { value: '', label: '-- Chọn giới tính --' },
            { value: 'NAM', label: 'Nam' },
            { value: 'NU', label: 'Nữ' },
          ]}
          error={errors.gioiTinh?.message}
          required
        />

        {/* Ngày sinh */}
        <Input
          label="Ngày sinh"
          type="date"
          {...register('ngaySinh', { required: 'Ngày sinh là bắt buộc' })}
          error={errors.ngaySinh?.message}
          required
        />

        {/* Email */}
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
          error={errors.email?.message}
          required
        />

        {/* Số điện thoại */}
        <Input
          label="Số điện thoại"
          {...register('sdt', {
            pattern: {
              value: /^[0-9]{10}$/,
              message: 'Số điện thoại phải có đúng 10 chữ số',
            },
          })}
          error={errors.sdt?.message}
          placeholder="0123456789"
        />

        {/* Mã lớp — combobox (nhập hoặc chọn từ danh sách) */}
        <div className="col-span-1">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Mã lớp <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            list="lop-datalist"
            autoComplete="off"
            spellCheck={false}
            placeholder="Nhập hoặc chọn mã lớp..."
            {...register('maLop', { required: 'Vui lòng chọn hoặc nhập mã lớp' })}
            className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 transition-colors ${
              errors.maLop
                ? 'border-red-400 focus:ring-red-300 bg-red-50'
                : 'border-gray-300 focus:ring-blue-500'
            }`}
          />
          <datalist id="lop-datalist">
            {lopList.map((lop) => (
              <option key={lop.maLop} value={lop.maLop}>
                {lop.tenLop || lop.maLop}
              </option>
            ))}
          </datalist>
          {errors.maLop && (
            <p className="text-red-500 text-xs mt-1">{errors.maLop.message}</p>
          )}
          {lopList.length === 0 && (
            <p className="text-gray-400 text-xs mt-1">Đang tải danh sách lớp...</p>
          )}
        </div>

        {/* Trạng thái */}
        <Select
          label="Trạng thái"
          {...register('isActive')}
          options={[
            { value: true, label: 'Hoạt động' },
            { value: false, label: 'Ngừng hoạt động' },
          ]}
        />
      </div>

      {/* Actions */}
      <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-2 pt-4 border-t">
        <Button type="button" variant="outline" onClick={onCancel} icon={X}>
          Hủy
        </Button>
        <Button
          type="submit"
          icon={Save}
          isLoading={mutation.isPending}
          disabled={mutation.isPending}
        >
          {mode === 'create' ? 'Thêm sinh viên' : 'Cập nhật'}
        </Button>
      </div>
    </form>
  );
};

export default StudentForm;
