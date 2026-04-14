import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { CheckCircle, Calendar, MapPin, Users, TrendingUp } from 'lucide-react';
import Button from '../common/Button';
import dangKyService from '../../services/dangKyService';
import useAuthStore from '../../stores/authStore';

const ActivityRegistrationModal = ({ activity, onSuccess, onCancel }) => {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [agreed, setAgreed] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);

  const mutation = useMutation({
    mutationFn: () => dangKyService.register(user?.linkedEntityId, activity?.maHoatDong),
    onSuccess: () => {
      setIsRegistered(true);
      queryClient.invalidateQueries(['student-registrations', user?.linkedEntityId]);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Đăng ký thất bại. Vui lòng thử lại!');
    },
  });

  const handleRegister = () => {
    if (!agreed) {
      toast.warning('Vui lòng đồng ý với các điều khoản');
      return;
    }
    mutation.mutate();
  };

  if (!activity) return null;

  if (isRegistered) {
    return (
      <div className="text-center py-8">
        <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
        <h3 className="text-xl font-bold text-gray-900 mb-2">Đăng ký thành công!</h3>
        <p className="text-gray-600 mb-2">
          Bạn đã đăng ký tham gia hoạt động{' '}
          <strong className="text-gray-900">{activity.tenHoatDong}</strong>
        </p>
        <p className="text-sm text-gray-500 mb-6">
          Vào mục "Hoạt động của tôi" để xem mã QR điểm danh
        </p>
        <Button onClick={onSuccess} fullWidth>
          Đóng
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Activity Info */}
      <div className="bg-gray-50 rounded-xl p-4">
        <h4 className="font-semibold text-gray-900 mb-3">{activity.tenHoatDong}</h4>
        <div className="space-y-2 text-sm text-gray-600">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-gray-400" />
            <span>
              {activity.ngayToChuc
                ? new Date(activity.ngayToChuc).toLocaleDateString('vi-VN')
                : 'Chưa xác định'}
            </span>
          </div>
          {activity.diaDiem && (
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-gray-400" />
              <span>{activity.diaDiem}</span>
            </div>
          )}
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-gray-400" />
            <span>
              {activity.soNguoiDangKy || 0} / {activity.soLuongToiDa || '∞'} người đăng ký
            </span>
          </div>
          {activity.diemRenLuyen != null && (
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-indigo-400" />
              <span className="text-indigo-700 font-medium">
                +{activity.diemRenLuyen} điểm rèn luyện
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Capacity Warning */}
      {activity.soLuongToiDa > 0 &&
        (activity.soNguoiDangKy || 0) > activity.soLuongToiDa * 0.8 && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-700">
            Hoạt động sắp đầy chỗ, hãy đăng ký sớm!
          </div>
        )}

      {/* Terms */}
      <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
        <h5 className="font-semibold text-blue-900 mb-2 text-sm">Điều khoản đăng ký</h5>
        <ul className="text-xs text-blue-800 space-y-1 list-disc list-inside">
          <li>Bạn cam kết tham gia đầy đủ hoạt động</li>
          <li>Mang theo thẻ sinh viên hoặc CCCD khi tham gia</li>
          <li>Tuân thủ nội quy, quy định của Ban tổ chức</li>
          <li>Cung cấp thông tin liên lạc chính xác</li>
        </ul>
      </div>

      {/* Checkbox */}
      <label className="flex items-start gap-3 cursor-pointer select-none">
        <input
          type="checkbox"
          checked={agreed}
          onChange={(e) => setAgreed(e.target.checked)}
          className="w-4 h-4 mt-0.5 accent-green-600"
        />
        <span className="text-sm text-gray-700">
          Tôi đã đọc và đồng ý với các điều khoản đăng ký
        </span>
      </label>

      {/* Actions */}
      <div className="flex flex-col-reverse sm:flex-row gap-2 sm:gap-3 pt-2 border-t border-gray-100">
        <Button
          variant="outline"
          onClick={onCancel}
          fullWidth
          disabled={mutation.isPending}
        >
          Hủy
        </Button>
        <Button
          onClick={handleRegister}
          fullWidth
          isLoading={mutation.isPending}
          disabled={!agreed || mutation.isPending}
        >
          Xác nhận đăng ký
        </Button>
      </div>
    </div>
  );
};

export default ActivityRegistrationModal;
