import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import accountService from '../services/accountService';
import {
  EMAIL_PATTERN,
  USERNAME_PATTERN,
  PHONE_PATTERN,
  GENDER,
  GENDER_LABELS,
  ERROR_MESSAGES
} from '../constants/accountConstants';
import { formatDate } from '../utils/dateFormat';

export default function RegisterPage() {
  const navigate = useNavigate();
  const [successMessage, setSuccessMessage] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch
  } = useForm({
    mode: 'onChange',
    defaultValues: {
      username: '',
      email: '',
      password: '',
      passwordConfirm: '',
      hoTen: '',
      soDienThoai: '',
      ngaySinh: '',
      gioiTinh: ''
    }
  });

  const password = watch('password');
  const passwordConfirm = watch('passwordConfirm');

  const registerMutation = useMutation({
    mutationFn: (data) =>
      accountService.register({
        username: data.username,
        email: data.email,
        password: data.password,
        hoTen: data.hoTen,
        soDienThoai: data.soDienThoai,
        ngaySinh: data.ngaySinh,
        gioiTinh: data.gioiTinh
      }),
    onSuccess: () => {
      setSuccessMessage(
        'Đăng ký tài khoản thành công! Vui lòng chờ quản trị viên phê duyệt tài khoản của bạn.'
      );
      setTimeout(() => {
        navigate('/');
      }, 3000);
    },
    onError: (error) => {
      console.error('Lỗi đăng ký:', error);
    }
  });

  const onSubmit = (data) => {
    registerMutation.mutate(data);
  };

  if (successMessage) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
          <div className="mb-4">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full">
              <svg
                className="w-8 h-8 text-green-500"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Đăng ký thành công!</h2>
          <p className="text-gray-600 mb-4">{successMessage}</p>
          <p className="text-sm text-gray-500">Đang chuyển hướng...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-800">Đăng ký tài khoản</h1>
            <p className="text-gray-600 mt-2">
              Tạo tài khoản mới để tham gia vào Hệ thống Quản lý Hoạt động Đoàn - Hội
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Row: Username and Email */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Username */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Tên đăng nhập *
                </label>
                <input
                  type="text"
                  placeholder="Ví dụ: nguyenvana"
                  {...register('username', {
                    required: 'Tên đăng nhập không được để trống',
                    pattern: {
                      value: USERNAME_PATTERN,
                      message: ERROR_MESSAGES.USERNAME_INVALID
                    }
                  })}
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.username ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.username && (
                  <p className="text-red-500 text-sm mt-1">{errors.username.message}</p>
                )}
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Email *
                </label>
                <input
                  type="email"
                  placeholder="example@vnkgu.edu.vn"
                  {...register('email', {
                    required: ERROR_MESSAGES.EMAIL_REQUIRED,
                    pattern: {
                      value: EMAIL_PATTERN,
                      message: ERROR_MESSAGES.EMAIL_INVALID
                    }
                  })}
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.email ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.email && (
                  <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>
                )}
              </div>
            </div>

            {/* Row: Password and Confirm Password */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Password */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Mật khẩu *
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Ít nhất 6 ký tự"
                    {...register('password', {
                      required: ERROR_MESSAGES.PASSWORD_REQUIRED,
                      minLength: {
                        value: 6,
                        message: ERROR_MESSAGES.PASSWORD_INVALID
                      }
                    })}
                    className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 pr-10 ${
                      errors.password ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? (
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                        <path
                          fillRule="evenodd"
                          d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path
                          fillRule="evenodd"
                          d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-14-14zM2 10a8 8 0 1111.313 7.387l-2.86-2.86A5.964 5.964 0 005.964 5.964L2.104 2.104A7.975 7.975 0 002 10zM18 10a8.001 8.001 0 01-11.313 7.387l2.86-2.86A5.964 5.964 0 0014.036 14.036l3.86 3.86A7.975 7.975 0 0018 10z"
                          clipRule="evenodd"
                        />
                      </svg>
                    )}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-red-500 text-sm mt-1">{errors.password.message}</p>
                )}
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Xác nhận mật khẩu *
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="Nhập lại mật khẩu"
                    {...register('passwordConfirm', {
                      required: 'Vui lòng xác nhận mật khẩu',
                      validate: (value) =>
                        value === password || ERROR_MESSAGES.PASSWORD_CONFIRM_MISMATCH
                    })}
                    className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 pr-10 ${
                      errors.passwordConfirm ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
                  >
                    {showConfirmPassword ? (
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                        <path
                          fillRule="evenodd"
                          d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path
                          fillRule="evenodd"
                          d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-14-14zM2 10a8 8 0 1111.313 7.387l-2.86-2.86A5.964 5.964 0 005.964 5.964L2.104 2.104A7.975 7.975 0 002 10zM18 10a8.001 8.001 0 01-11.313 7.387l2.86-2.86A5.964 5.964 0 0014.036 14.036l3.86 3.86A7.975 7.975 0 0018 10z"
                          clipRule="evenodd"
                        />
                      </svg>
                    )}
                  </button>
                </div>
                {errors.passwordConfirm && (
                  <p className="text-red-500 text-sm mt-1">{errors.passwordConfirm.message}</p>
                )}
              </div>
            </div>

            {/* Full Name */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Họ tên *
              </label>
              <input
                type="text"
                placeholder="Ví dụ: Nguyễn Văn A"
                {...register('hoTen', {
                  required: ERROR_MESSAGES.HO_TEN_REQUIRED
                })}
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.hoTen ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.hoTen && (
                <p className="text-red-500 text-sm mt-1">{errors.hoTen.message}</p>
              )}
            </div>

            {/* Row: Phone and Date of Birth */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Phone */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Số điện thoại
                </label>
                <input
                  type="tel"
                  placeholder="0xxxxxxxxx hoặc +84xxxxxxxxx"
                  {...register('soDienThoai', {
                    pattern: {
                      value: PHONE_PATTERN,
                      message: ERROR_MESSAGES.PHONE_INVALID
                    }
                  })}
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.soDienThoai ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.soDienThoai && (
                  <p className="text-red-500 text-sm mt-1">{errors.soDienThoai.message}</p>
                )}
              </div>

              {/* Date of Birth */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Ngày sinh
                </label>
                <input
                  type="date"
                  {...register('ngaySinh')}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Gender */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Giới tính
              </label>
              <select
                {...register('gioiTinh')}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">-- Chọn giới tính --</option>
                <option value={GENDER.MALE}>{GENDER_LABELS.NAM}</option>
                <option value={GENDER.FEMALE}>{GENDER_LABELS.NU}</option>
                <option value={GENDER.OTHER}>{GENDER_LABELS.KHAC}</option>
              </select>
            </div>

            {/* Info Message */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex gap-3">
                <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 5v8a2 2 0 01-2 2h-5l-5 4v-4H4a2 2 0 01-2-2V5a2 2 0 012-2h12a2 2 0 012 2zm-11-1a1 1 0 11-2 0 1 1 0 012 0zM8 8a1 1 0 000 2h6a1 1 0 000-2H8zm1 5a1 1 0 11-2 0 1 1 0 012 0z" clipRule="evenodd" />
                </svg>
                <div>
                  <h3 className="font-semibold text-blue-900">Lưu ý</h3>
                  <p className="text-sm text-blue-800">
                    Bạn cần sử dụng email @vnkgu.edu.vn để đăng ký. Tài khoản sẽ ở trạng thái chờ phê duyệt cho đến khi được quản trị viên xác nhận.
                  </p>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={registerMutation.isPending}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-3 rounded-lg transition duration-200"
            >
              {registerMutation.isPending ? (
                <div className="flex items-center justify-center gap-2">
                  <svg className="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  Đang xử lý...
                </div>
              ) : (
                'Đăng ký'
              )}
            </button>

            {registerMutation.isError && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-700 text-sm">
                  {registerMutation.error || 'Lỗi đăng ký tài khoản'}
                </p>
              </div>
            )}

            {/* Login Link */}
            <div className="text-center">
              <p className="text-gray-600">
                Đã có tài khoản?{' '}
                <a href="/login" className="text-blue-600 hover:text-blue-700 font-semibold">
                  Đăng nhập tại đây
                </a>
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
