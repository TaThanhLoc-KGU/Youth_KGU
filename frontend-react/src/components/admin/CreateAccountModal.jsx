import React, { useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQuery } from '@tanstack/react-query';
import { GENDER } from '../../constants/accountConstants';
import banService from '../../services/banService';
import chucVuService from '../../services/chucVuService';

const CreateAccountModal = ({
  isOpen,
  onClose,
  createAccountMutation,
}) => {
  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    reset,
  } = useForm({
    mode: 'onChange', // Validate on change to enable/disable button
    defaultValues: {
      username: '',
      email: '',
      password: '',
      hoTen: '',
      soDienThoai: '',
      ngaySinh: '',
      gioiTinh: '',
      vaiTro: '',
      banChuyenMon: '',
    },
  });

  // Fetch data for dropdowns
  const { data: banList = [] } = useQuery({
    queryKey: ['banList'],
    queryFn: () => banService.getAll(),
  });

  const { data: chucVuList = [] } = useQuery({
    queryKey: ['chucVuList'],
    queryFn: () => chucVuService.getAll(),
  });

  const banOptions = useMemo(
    () =>
      banList.map((ban) => ({
        value: ban.maBan,
        label: ban.tenBan,
      })),
    [banList]
  );

  const chucVuOptions = useMemo(
    () =>
      chucVuList.map((chucVu) => ({
        value: chucVu.maChucVu,
        label: chucVu.tenChucVu,
      })),
    [chucVuList]
  );

  const handleClose = () => {
    reset(); // Reset form state
    onClose();
  };
  
  const onSubmit = (data) => {
    createAccountMutation.mutate(data);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full p-6 my-8">
        <h2 className="text-2xl font-bold mb-6">Tạo tài khoản mới</h2>

        {createAccountMutation.isError && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg">
            {createAccountMutation.error.message || 'Lỗi tạo tài khoản'}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="grid grid-cols-2 gap-4 mb-4">
            {/* Username */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Tên đăng nhập *
              </label>
              <input
                {...register('username', {
                  required: 'Tên đăng nhập không được để trống',
                  pattern: {
                    value: /^[a-zA-Z0-9_]{3,50}$/,
                    message: 'Tên đăng nhập phải chứa 3-50 ký tự (chữ, số, dấu gạch dưới)',
                  },
                })}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.username ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="username"
              />
              {errors.username && (
                <p className="text-red-500 text-xs mt-1">{errors.username.message}</p>
              )}
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Email *
              </label>
              <input
                type="email"
                {...register('email', {
                  required: 'Email không được để trống',
                  pattern: {
                    value: /^[A-Za-z0-9+_.-]+@vnkgu\.edu\.vn$/i,
                    message: 'Email phải có dạng @vnkgu.edu.vn',
                  },
                })}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.email ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="user@vnkgu.edu.vn"
              />
              {errors.email && (
                <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Mật khẩu *
              </label>
              <input
                type="password"
                {...register('password', {
                  required: 'Mật khẩu không được để trống',
                  minLength: {
                    value: 6,
                    message: 'Mật khẩu phải có ít nhất 6 ký tự',
                  },
                })}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.password ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Nhập mật khẩu"
              />
              {errors.password && (
                <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>
              )}
            </div>

            {/* Full Name */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Họ tên *
              </label>
              <input
                {...register('hoTen', { required: 'Họ tên không được để trống' })}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.hoTen ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Họ và tên"
              />
              {errors.hoTen && (
                <p className="text-red-500 text-xs mt-1">{errors.hoTen.message}</p>
              )}
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Số điện thoại
              </label>
              <input
                type="tel"
                {...register('soDienThoai')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="0987654321"
              />
            </div>

            {/* Birth Date */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Ngày sinh
              </label>
              <input
                type="date"
                {...register('ngaySinh')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Gender */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Giới tính
              </label>
              <select
                {...register('gioiTinh')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Chọn giới tính</option>
                <option value={GENDER.MALE}>Nam</option>
                <option value={GENDER.FEMALE}>Nữ</option>
                <option value={GENDER.OTHER}>Khác</option>
              </select>
            </div>

            {/* Role (Chuc vu) */}
            <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Vai trò
                </label>
                <select
                  {...register('vaiTro')}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.vaiTro ? 'border-red-500' : 'border-gray-300'
                  }`}
                >
                  <option value="">Chọn vai trò</option>
                  {chucVuOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                {errors.vaiTro && (
                  <p className="text-red-500 text-xs mt-1">{errors.vaiTro.message}</p>
                )}
              </div>

            {/* Department (Ban) */}
            <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Ban chuyên môn
                </label>
                <select
                  {...register('banChuyenMon')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Chọn ban chuyên môn</option>
                  {banOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
          </div>

          <div className="flex gap-3 justify-end">
            <button
              type="button"
              onClick={handleClose}
              className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 font-semibold"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={!isValid || createAccountMutation.isPending}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-lg font-semibold"
            >
              {createAccountMutation.isPending ? 'Đang tạo...' : 'Tạo tài khoản'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateAccountModal;
