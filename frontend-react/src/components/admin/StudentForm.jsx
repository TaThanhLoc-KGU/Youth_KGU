import { useForm } from 'react-hook-form';
import { useMutation } from 'react-query';
import { toast } from 'react-toastify';
import { Save, X } from 'lucide-react';
import studentService from '../../services/studentService';
import Input from '../common/Input';
import Select from '../common/Select';
import Button from '../common/Button';
import ImageUpload from '../common/ImageUpload';

const StudentForm = ({ initialData, mode = 'create', onSuccess, onCancel }) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm({
    defaultValues: initialData || {
      maSv: '',
      hoTen: '',
      email: '',
      sdt: '',
      maLop: '',
      isActive: true,
    },
  });

  const mutation = useMutation(
    (data) => {
      if (mode === 'create') {
        return studentService.create(data);
      } else {
        return studentService.update(initialData.maSv, data);
      }
    },
    {
      onSuccess: () => {
        toast.success(
          mode === 'create'
            ? 'Thêm sinh viên thành công!'
            : 'Cập nhật sinh viên thành công!'
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
              message: 'Số điện thoại phải có 10 chữ số',
            },
          })}
          error={errors.sdt?.message}
          placeholder="0123456789"
        />

        {/* Mã lớp */}
        <Input
          label="Mã lớp"
          {...register('maLop')}
          error={errors.maLop?.message}
          placeholder="VD: CNTT01"
        />

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

      {/* Ảnh đại diện */}
      <div>
        <ImageUpload
          label="Ảnh đại diện"
          value={watch('hinhAnh')}
          onChange={(file) => {
            if (file) {
              // Convert to base64 or upload to server
              const reader = new FileReader();
              reader.onloadend = () => {
                setValue('hinhAnh', reader.result);
              };
              reader.readAsDataURL(file);
            }
          }}
          helperText="Ảnh sẽ được sử dụng để nhận diện khuôn mặt"
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
          disabled={mutation.isLoading}
        >
          {mode === 'create' ? 'Thêm sinh viên' : 'Cập nhật'}
        </Button>
      </div>
    </form>
  );
};

export default StudentForm;
