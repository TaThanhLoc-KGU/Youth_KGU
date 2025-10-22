import { useState } from 'react';
import { useMutation } from 'react-query';
import { toast } from 'react-toastify';
import { CheckCircle, AlertCircle } from 'lucide-react';
import Button from '../common/Button';
import Alert from '../common/Alert';

const ActivityRegistrationModal = ({ activity, onSuccess, onCancel }) => {
  const [agreed, setAgreed] = useState(false);
  const [isConfirmed, setIsConfirmed] = useState(false);

  const mutation = useMutation(
    async () => {
      // TODO: Call API to register for activity
      // await activityService.register(activity.maHoatDong);
      // For now, simulate API call
      return new Promise((resolve) => setTimeout(resolve, 1000));
    },
    {
      onSuccess: () => {
        toast.success('Đăng ký hoạt động thành công!');
        onSuccess();
      },
      onError: (error) => {
        toast.error(error.message || 'Có lỗi xảy ra!');
      },
    }
  );

  const handleRegister = () => {
    if (!agreed) {
      toast.error('Vui lòng đồng ý với các điều khoản');
      return;
    }
    mutation.mutate();
  };

  if (!activity) return null;

  if (isConfirmed) {
    return (
      <div className="text-center py-8">
        <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
        <h3 className="text-xl font-bold text-gray-900 mb-2">Đăng ký thành công!</h3>
        <p className="text-gray-600 mb-6">
          Bạn đã đăng ký tham gia hoạt động <strong>{activity.tenHoatDong}</strong>
        </p>
        <p className="text-sm text-gray-500 mb-6">
          Vui lòng kiểm tra email để nhận thêm thông tin chi tiết
        </p>
        <Button onClick={onCancel} fullWidth>
          Đóng
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Activity Info */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h4 className="font-semibold text-gray-900 mb-3">{activity.tenHoatDong}</h4>
        <div className="space-y-2 text-sm text-gray-600">
          <p>
            <span className="font-medium">Ngày tổ chức:</span>{' '}
            {new Date(activity.ngayToChuc).toLocaleString('vi-VN')}
          </p>
          <p>
            <span className="font-medium">Địa điểm:</span> {activity.diaDiem || 'Chưa xác định'}
          </p>
          <p>
            <span className="font-medium">Số người đã đăng ký:</span> {activity.soNguoiDangKy || 0} /{' '}
            {activity.soNguoiToiDa}
          </p>
        </div>
      </div>

      {/* Capacity Warning */}
      {activity.soNguoiToiDa > 0 && (activity.soNguoiDangKy || 0) > activity.soNguoiToiDa * 0.8 && (
        <Alert variant="warning" title="Chỉ còn vài chỗ">
          Hoạt động sắp kín chỗ, hãy đăng ký sớm!
        </Alert>
      )}

      {/* Terms */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h5 className="font-semibold text-blue-900 mb-2">Điều khoản đăng ký</h5>
        <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
          <li>Bạn sẽ tham gia đầy đủ hoạt động</li>
          <li>Mang theo giấy tờ tùy thân khi tham gia</li>
          <li>Tuân theo các quy định của tổ chức</li>
          <li>Cung cấp thông tin liên lạc chính xác</li>
        </ul>
      </div>

      {/* Checkbox */}
      <label className="flex items-start gap-3 cursor-pointer">
        <input
          type="checkbox"
          checked={agreed}
          onChange={(e) => setAgreed(e.target.checked)}
          className="w-5 h-5 mt-1 rounded border-gray-300 text-primary focus:ring-primary"
        />
        <span className="text-sm text-gray-700">
          Tôi đồng ý với các điều khoản đăng ký và cam kết sẽ tham gia hoạt động
        </span>
      </label>

      {/* Actions */}
      <div className="flex gap-2 pt-4 border-t">
        <Button
          variant="outline"
          onClick={onCancel}
          fullWidth
          disabled={mutation.isLoading}
        >
          Hủy
        </Button>
        <Button
          onClick={handleRegister}
          fullWidth
          isLoading={mutation.isLoading}
          disabled={!agreed || mutation.isLoading}
        >
          Xác nhận đăng ký
        </Button>
      </div>
    </div>
  );
};

export default ActivityRegistrationModal;
