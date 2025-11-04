import React, { useState, useRef } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useForm, Controller } from 'react-hook-form';
import accountService from '../services/accountService';
import ImageUpload from '../components/common/ImageUpload';
import {
  ROLE_LABELS,
  DEPARTMENT_LABELS,
  GENDER_LABELS,
  PHONE_PATTERN
} from '../constants/accountConstants';
import { formatDate } from '../utils/dateFormat';

export default function ProfilePage() {
  const userId = 1; // Lấy từ auth context trong thực tế
  const [isEditing, setIsEditing] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const fileInputRef = useRef(null);

  // Query: Get Current User
  const { data: user = {}, isLoading } = useQuery({
    queryKey: ['userProfile', userId],
    queryFn: () => accountService.getAccount(userId)
  });

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
    reset,
    watch
  } = useForm({
    defaultValues: user,
    values: user
  });

  // Mutation: Update Profile
  const updateMutation = useMutation({
    mutationFn: (data) => accountService.updateProfile(userId, data),
    onSuccess: () => {
      setSuccessMessage('Cập nhật hồ sơ thành công!');
      setIsEditing(false);
      setTimeout(() => setSuccessMessage(''), 3000);
    }
  });

  const onSubmit = (data) => {
    updateMutation.mutate(data);
  };

  const avatarValue = watch('avatar');

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <svg
            className="w-12 h-12 animate-spin mx-auto mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 10V3L4 14h7v7l9-11h-7z"
            />
          </svg>
          <p className="text-gray-600">Đang tải hồ sơ...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">Hồ sơ cá nhân</h1>
              <p className="text-gray-600 mt-1">Quản lý thông tin tài khoản của bạn</p>
            </div>
            <button
              onClick={() => setIsEditing(!isEditing)}
              className={`px-6 py-2 rounded-lg font-semibold transition ${
                isEditing
                  ? 'bg-gray-300 hover:bg-gray-400 text-gray-800'
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
            >
              {isEditing ? 'Hủy' : 'Chỉnh sửa'}
            </button>
          </div>
        </div>

        {/* Success Message */}
        {successMessage && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
            <p className="text-green-800">{successMessage}</p>
          </div>
        )}

        {/* Profile Content */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Avatar Section */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold mb-4">Ảnh đại diện</h2>
            <div className="flex flex-col md:flex-row gap-6 items-start">
              {/* Current Avatar */}
              <div className="flex-shrink-0">
                {avatarValue ? (
                  <img
                    src={avatarValue}
                    alt="Avatar"
                    className="w-32 h-32 rounded-lg object-cover border-2 border-gray-200"
                  />
                ) : (
                  <div className="w-32 h-32 rounded-lg bg-gray-200 flex items-center justify-center border-2 border-gray-300">
                    <svg
                      className="w-16 h-16 text-gray-400"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                )}
              </div>

              {/* Upload Section */}
              {isEditing && (
                <div className="flex-1">
                  <Controller
                    name="avatar"
                    control={control}
                    render={({ field }) => (
                      <ImageUpload
                        label="Tải ảnh lên"
                        value={field.value}
                        onChange={(e) =>
                          field.onChange(e.target.value)
                        }
                        containerClassName="mb-0"
                      />
                    )}
                  />
                </div>
              )}

              {/* Display Existing */}
              {!isEditing && (
                <div className="flex-1">
                  <p className="text-gray-600">
                    Bạn có thể thay đổi ảnh đại diện bằng cách nhấn nút "Chỉnh sửa"
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Basic Information */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold mb-4">Thông tin cơ bản</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Username (Read-only) */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Tên đăng nhập
                </label>
                <input
                  type="text"
                  value={user.username || ''}
                  disabled
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600 cursor-not-allowed"
                />
              </div>

              {/* Email (Read-only) */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={user.email || ''}
                  disabled
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600 cursor-not-allowed"
                />
              </div>

              {/* Full Name */}
              <div className={`${isEditing ? '' : 'md:col-span-2'}`}>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Họ tên {isEditing && '*'}
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    {...register('hoTen', {
                      required: isEditing ? 'Họ tên không được để trống' : false
                    })}
                    className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.hoTen ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                ) : (
                  <input
                    type="text"
                    value={user.hoTen || ''}
                    disabled
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600"
                  />
                )}
                {errors.hoTen && (
                  <p className="text-red-500 text-sm mt-1">{errors.hoTen.message}</p>
                )}
              </div>

              {/* Phone */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Số điện thoại
                </label>
                {isEditing ? (
                  <input
                    type="tel"
                    {...register('soDienThoai', {
                      pattern: {
                        value: PHONE_PATTERN,
                        message: 'Số điện thoại không hợp lệ'
                      }
                    })}
                    className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.soDienThoai ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                ) : (
                  <input
                    type="text"
                    value={user.soDienThoai || 'Chưa cập nhật'}
                    disabled
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600"
                  />
                )}
                {errors.soDienThoai && (
                  <p className="text-red-500 text-sm mt-1">{errors.soDienThoai.message}</p>
                )}
              </div>

              {/* Date of Birth */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Ngày sinh
                </label>
                {isEditing ? (
                  <input
                    type="date"
                    {...register('ngaySinh')}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                ) : (
                  <input
                    type="text"
                    value={user.ngaySinh ? formatDate(user.ngaySinh) : 'Chưa cập nhật'}
                    disabled
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600"
                  />
                )}
              </div>

              {/* Gender */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Giới tính
                </label>
                {isEditing ? (
                  <select
                    {...register('gioiTinh')}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">-- Chọn giới tính --</option>
                    <option value="NAM">Nam</option>
                    <option value="NU">Nữ</option>
                    <option value="KHAC">Khác</option>
                  </select>
                ) : (
                  <input
                    type="text"
                    value={
                      user.gioiTinh
                        ? GENDER_LABELS[user.gioiTinh]
                        : 'Chưa cập nhật'
                    }
                    disabled
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600"
                  />
                )}
              </div>
            </div>
          </div>

          {/* Role & Organization Information */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold mb-4">Thông tin vai trò</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Role */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Vai trò
                </label>
                <input
                  type="text"
                  value={ROLE_LABELS[user.vaiTro] || user.vaiTro || 'Chưa cấp'}
                  disabled
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600"
                />
              </div>

              {/* Department */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Ban chuyên môn
                </label>
                {isEditing ? (
                  <select
                    {...register('banChuyenMon')}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">-- Chọn ban chuyên môn --</option>
                    {Object.entries(DEPARTMENT_LABELS).map(([key, label]) => (
                      <option key={key} value={key}>
                        {label}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    value={
                      user.banChuyenMon
                        ? DEPARTMENT_LABELS[user.banChuyenMon]
                        : 'Chưa cập nhật'
                    }
                    disabled
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600"
                  />
                )}
              </div>

              {/* Approval Status */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Trạng thái phê duyệt
                </label>
                <input
                  type="text"
                  value={
                    user.trangThaiPheDuyet === 'CHO_PHE_DUYET'
                      ? 'Chờ phê duyệt'
                      : user.trangThaiPheDuyet === 'DA_PHE_DUYET'
                      ? 'Đã phê duyệt'
                      : 'Từ chối'
                  }
                  disabled
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600"
                />
              </div>

              {/* Account Status */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Trạng thái tài khoản
                </label>
                <input
                  type="text"
                  value={user.isActive ? 'Hoạt động' : 'Vô hiệu hóa'}
                  disabled
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600"
                />
              </div>
            </div>
          </div>

          {/* Metadata */}
          <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Thông tin hệ thống</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
              <div>
                <p className="font-semibold">Ngày tạo tài khoản:</p>
                <p>{user.createdAt ? formatDate(user.createdAt) : 'N/A'}</p>
              </div>
              <div>
                <p className="font-semibold">Cập nhật lần cuối:</p>
                <p>{user.updatedAt ? formatDate(user.updatedAt) : 'N/A'}</p>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          {isEditing && (
            <div className="flex gap-4">
              <button
                type="submit"
                disabled={updateMutation.isPending}
                className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-3 rounded-lg transition"
              >
                {updateMutation.isPending ? 'Đang lưu...' : 'Lưu thay đổi'}
              </button>
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 font-semibold py-3 rounded-lg transition"
              >
                Hủy
              </button>
            </div>
          )}

          {updateMutation.isError && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-700">
                {updateMutation.error || 'Lỗi cập nhật hồ sơ'}
              </p>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
