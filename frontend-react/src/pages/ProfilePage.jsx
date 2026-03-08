import React, { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, Controller } from 'react-hook-form';
import accountService from '../services/accountService';
import authService from '../services/authService'; // Import authService
import banService from '../services/banService';
import ImageUpload from '../components/common/ImageUpload';
import Modal from '../components/common/Modal'; // Import Modal
import {
  ROLE_LABELS,
  GENDER_LABELS,
  PHONE_PATTERN,
} from '../constants/accountConstants';
import { formatDate } from '../utils/dateFormat';
import useAuthStore from '../stores/authStore';
import { toast } from 'react-toastify';
import { Lock, Key } from 'lucide-react'; // Import icons

export default function ProfilePage() {
  const { user: authUser, setUser: setAuthUser } = useAuthStore();
  const userId = authUser?.id;
  const queryClient = useQueryClient();

  const [isEditing, setIsEditing] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false); // State for password modal

  // Query: Get Current User (dùng /api/accounts/me để không cần quyền XEM_TAI_KHOAN)
  const { data: user, isLoading } = useQuery({
    queryKey: ['userProfile', userId],
    queryFn: () => accountService.getMyProfile(),
    enabled: !!userId,
  });

  // Query: Get Ban List
  const { data: banList = [] } = useQuery({
    queryKey: ['banList'],
    queryFn: () => banService.getAll(),
    enabled: isEditing,
  });

  // Form for Profile Update
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
    reset,
    watch,
  } = useForm({
    defaultValues: user || {},
    values: user, // Update form values when user data changes
  });

  // Form for Password Change
  const {
    register: registerPassword,
    handleSubmit: handleSubmitPassword,
    formState: { errors: passwordErrors },
    reset: resetPassword,
    watch: watchPassword,
  } = useForm();

  // Mutation: Update Profile
  const updateMutation = useMutation({
    mutationFn: (data) => accountService.updateProfile(userId, data),
    onSuccess: (updatedData) => {
      toast.success('Cập nhật hồ sơ thành công!');
      setIsEditing(false);
      queryClient.invalidateQueries({ queryKey: ['userProfile', userId] });
      // Assuming updatedData is the response object, check structure if needed
      // If updateProfile returns data directly like getAccount, use updatedData
      // If it returns full response, use updatedData.data
      // Based on accountService.updateProfile, it returns response.data.data
      setAuthUser({ ...authUser, ...updatedData });
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Lỗi cập nhật hồ sơ');
    },
  });

  // Mutation: Change Password
  const changePasswordMutation = useMutation({
    mutationFn: (data) => authService.changePassword(data),
    onSuccess: () => {
      toast.success('Đổi mật khẩu thành công!');
      setIsPasswordModalOpen(false);
      resetPassword();
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Đổi mật khẩu thất bại');
    },
  });

  const onSubmit = (data) => {
    if (data.banChuyenMon === '') {
      data.banChuyenMon = null;
    }
    updateMutation.mutate(data);
  };

  const onSubmitPassword = (data) => {
    changePasswordMutation.mutate({
      username: user.username,
      oldPassword: data.currentPassword,
      newPassword: data.newPassword,
      confirmPassword: data.confirmPassword
    });
  };

  const avatarValue = watch('avatar');
  const newPasswordValue = watchPassword('newPassword');

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <svg
            className="w-12 h-12 animate-spin mx-auto mb-4 text-blue-600"
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

  if (!userId || !user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center text-red-600">
          Không tìm thấy thông tin người dùng. Vui lòng đăng nhập lại.
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
          <div className="flex flex-wrap justify-between items-start gap-3">
            <div>
              <h1 className="text-xl sm:text-3xl font-bold text-gray-800">Hồ sơ cá nhân</h1>
              <p className="text-gray-600 mt-1 text-sm sm:text-base">Quản lý thông tin tài khoản của bạn</p>
            </div>
            <button
              onClick={() => {
                setIsEditing(!isEditing);
                if (!isEditing) {
                  reset(user);
                }
              }}
              className={`px-4 sm:px-6 py-2 rounded-lg font-semibold transition text-sm sm:text-base flex-shrink-0 ${
                isEditing
                  ? 'bg-gray-300 hover:bg-gray-400 text-gray-800'
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
            >
              {isEditing ? 'Hủy' : 'Chỉnh sửa'}
            </button>
          </div>
        </div>

        {/* Profile Content */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Avatar Section */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold mb-4">Ảnh đại diện</h2>
            <div className="flex flex-col md:flex-row gap-6 items-start">
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

              {isEditing && (
                <div className="flex-1">
                  <Controller
                    name="avatar"
                    control={control}
                    render={({ field }) => (
                      <ImageUpload
                        label="Tải ảnh lên (URL hoặc Base64)"
                        value={field.value || ''}
                        onChange={(value) => field.onChange(value)}
                        containerClassName="mb-0"
                      />
                    )}
                  />
                </div>
              )}

              {!isEditing && (
                <div className="flex-1 pt-2">
                  <p className="text-gray-600">
                    Bạn có thể thay đổi ảnh đại diện bằng cách nhấn nút "Chỉnh sửa".
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Basic Information */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold mb-4">Thông tin cơ bản</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Họ tên {isEditing && <span className="text-red-500">*</span>}
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    {...register('hoTen', {
                      required: 'Họ tên không được để trống'
                    })}
                    className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.hoTen ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                ) : (
                  <p className="text-gray-900 text-lg">{user.hoTen || 'Chưa cập nhật'}</p>
                )}
                {errors.hoTen && (
                  <p className="text-red-500 text-sm mt-1">{errors.hoTen.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Số điện thoại {isEditing && <span className="text-red-500">*</span>}
                </label>
                {isEditing ? (
                  <input
                    type="tel"
                    {...register('soDienThoai', {
                      required: 'Số điện thoại không được để trống',
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
                  <p className="text-gray-900">{user.soDienThoai || 'Chưa cập nhật'}</p>
                )}
                {errors.soDienThoai && (
                  <p className="text-red-500 text-sm mt-1">{errors.soDienThoai.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Ngày sinh {isEditing && <span className="text-red-500">*</span>}
                </label>
                {isEditing ? (
                  <input
                    type="date"
                    lang="vi"
                    {...register('ngaySinh', {
                      required: 'Ngày sinh không được để trống'
                    })}
                    className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.ngaySinh ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                ) : (
                  <p className="text-gray-900">{user.ngaySinh ? formatDate(user.ngaySinh) : 'Chưa cập nhật'}</p>
                )}
                {errors.ngaySinh && (
                  <p className="text-red-500 text-sm mt-1">{errors.ngaySinh.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Giới tính {isEditing && <span className="text-red-500">*</span>}
                </label>
                {isEditing ? (
                  <select
                    {...register('gioiTinh', {
                      required: 'Vui lòng chọn giới tính'
                    })}
                    className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.gioiTinh ? 'border-red-500' : 'border-gray-300'
                    }`}
                  >
                    <option value="">-- Chọn giới tính --</option>
                    <option value="NAM">Nam</option>
                    <option value="NU">Nữ</option>
                    <option value="KHAC">Khác</option>
                  </select>
                ) : (
                  <p className="text-gray-900">
                    {user.gioiTinh ? GENDER_LABELS[user.gioiTinh] : 'Chưa cập nhật'}
                  </p>
                )}
                {errors.gioiTinh && (
                  <p className="text-red-500 text-sm mt-1">{errors.gioiTinh.message}</p>
                )}
              </div>
            </div>
          </div>

          {/* Role & Organization Information */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold mb-4">Thông tin vai trò</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Vai trò
                </label>
                <p className="text-gray-900">{ROLE_LABELS[user.vaiTro] || user.vaiTro || 'Chưa cấp'}</p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Ban chuyên môn
                </label>
                {isEditing ? (
                  <select
                    {...register('banChuyenMon')}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">-- Không thuộc ban nào --</option>
                    {banList.map(ban => (
                      <option key={ban.maBan} value={ban.maBan}>
                        {ban.tenBan}
                      </option>
                    ))}
                  </select>
                ) : (
                  <p className="text-gray-900">{user.tenBanChuyenMon || 'Chưa cập nhật'}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Trạng thái phê duyệt
                </label>
                <p className={`font-semibold ${user.trangThaiPheDuyet === 'DA_PHE_DUYET' ? 'text-green-600' : 'text-yellow-600'}`}>
                  {user.trangThaiPheDuyet === 'CHO_PHE_DUYET'
                    ? 'Chờ phê duyệt'
                    : user.trangThaiPheDuyet === 'DA_PHE_DUYET'
                    ? 'Đã phê duyệt'
                    : 'Từ chối'}
                </p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Trạng thái tài khoản
                </label>
                <p className={`font-semibold ${user.isActive ? 'text-green-600' : 'text-red-600'}`}>
                  {user.isActive ? 'Hoạt động' : 'Vô hiệu hóa'}
                </p>
              </div>
            </div>
          </div>

          {/* Security Section */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <Lock className="w-5 h-5 text-gray-500" /> Bảo mật
                </h2>
                <p className="text-gray-600 mt-1 text-sm">
                  Đổi mật khẩu và quản lý bảo mật tài khoản
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  resetPassword();
                  setIsPasswordModalOpen(true);
                }}
                className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition flex items-center gap-2"
              >
                <Key className="w-4 h-4" /> Đổi mật khẩu
              </button>
            </div>
          </div>

          {/* Metadata */}
          <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Thông tin hệ thống</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
              <div>
                <p className="font-semibold">Ngày tạo tài khoản:</p>
                <p>{user.createdAt ? formatDateTime(user.createdAt) : 'N/A'}</p>
              </div>
              <div>
                <p className="font-semibold">Cập nhật lần cuối:</p>
                <p>{user.updatedAt ? formatDateTime(user.updatedAt) : 'N/A'}</p>
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
        </form>
      </div>

      {/* Change Password Modal */}
      <Modal
        isOpen={isPasswordModalOpen}
        onClose={() => setIsPasswordModalOpen(false)}
        title="Đổi mật khẩu"
      >
        <form onSubmit={handleSubmitPassword(onSubmitPassword)} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Mật khẩu hiện tại <span className="text-red-500">*</span>
            </label>
            <input
              type="password"
              {...registerPassword('currentPassword', {
                required: 'Vui lòng nhập mật khẩu hiện tại',
              })}
              className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                passwordErrors.currentPassword ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Nhập mật khẩu hiện tại"
            />
            {passwordErrors.currentPassword && (
              <p className="text-red-500 text-sm mt-1">
                {passwordErrors.currentPassword.message}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Mật khẩu mới <span className="text-red-500">*</span>
            </label>
            <input
              type="password"
              {...registerPassword('newPassword', {
                required: 'Vui lòng nhập mật khẩu mới',
                minLength: {
                  value: 6,
                  message: 'Mật khẩu phải có ít nhất 6 ký tự',
                },
              })}
              className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                passwordErrors.newPassword ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Nhập mật khẩu mới"
            />
            {passwordErrors.newPassword && (
              <p className="text-red-500 text-sm mt-1">
                {passwordErrors.newPassword.message}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Xác nhận mật khẩu mới <span className="text-red-500">*</span>
            </label>
            <input
              type="password"
              {...registerPassword('confirmPassword', {
                required: 'Vui lòng xác nhận mật khẩu mới',
                validate: (val) =>
                  val === newPasswordValue || 'Mật khẩu xác nhận không khớp',
              })}
              className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                passwordErrors.confirmPassword ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Nhập lại mật khẩu mới"
            />
            {passwordErrors.confirmPassword && (
              <p className="text-red-500 text-sm mt-1">
                {passwordErrors.confirmPassword.message}
              </p>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t mt-6">
            <button
              type="button"
              onClick={() => setIsPasswordModalOpen(false)}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={changePasswordMutation.isPending}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg font-medium transition flex items-center gap-2"
            >
              {changePasswordMutation.isPending && (
                <svg
                  className="w-4 h-4 animate-spin"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
              )}
              Lưu mật khẩu
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

// Helper to format date and time
const formatDateTime = (isoString) => {
  if (!isoString) return 'N/A';
  try {
    return new Date(isoString).toLocaleString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch (error) {
    return 'Invalid Date';
  }
};
