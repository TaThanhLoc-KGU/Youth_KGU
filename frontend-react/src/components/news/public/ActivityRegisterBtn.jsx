import { useNavigate, useLocation } from 'react-router-dom';
import { CalendarX, Clock, Users, LogIn } from 'lucide-react';
import useAuthStore from '../../../stores/authStore';

/**
 * Nút đăng ký hoạt động hiển thị trong bài viết chi tiết.
 * Props: hoatDongId, trangThaiHoatDong, hanDangKy, soChoConLai
 */
const ActivityRegisterBtn = ({ hoatDongId, trangThaiHoatDong, hanDangKy, soChoConLai }) => {
  const { isAuthenticated } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  if (!hoatDongId) return null;

  // Đã hủy
  if (trangThaiHoatDong === 'DA_HUY') {
    return (
      <div className="flex items-center gap-2 bg-enews-50 border border-enews-200 text-enews-700 rounded-xl px-4 py-3 text-sm font-medium">
        <CalendarX className="w-4 h-4 flex-shrink-0" />
        Hoạt động này đã bị hủy
      </div>
    );
  }

  // Đã qua hạn đăng ký
  const isExpired = hanDangKy && new Date(hanDangKy) < new Date();
  if (trangThaiHoatDong === 'DONG_DANG_KY' || isExpired) {
    return (
      <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 text-gray-600 rounded-xl px-4 py-3 text-sm font-medium">
        <Clock className="w-4 h-4 flex-shrink-0" />
        Đã đóng đăng ký
        {hanDangKy && (
          <span className="text-xs text-gray-400 ml-1">
            (hạn {new Date(hanDangKy).toLocaleDateString('vi-VN')})
          </span>
        )}
      </div>
    );
  }

  // Hết chỗ
  if (soChoConLai === 0) {
    return (
      <div className="flex items-center gap-2 bg-orange-50 border border-orange-200 text-orange-700 rounded-xl px-4 py-3 text-sm font-medium">
        <Users className="w-4 h-4 flex-shrink-0" />
        Đã hết chỗ
      </div>
    );
  }

  const handleClick = () => {
    if (!isAuthenticated) {
      navigate(`/login?redirect=${encodeURIComponent(location.pathname)}`);
      return;
    }
    navigate(`/student/activities/${hoatDongId}/register`);
  };

  return (
    <div className="bg-green-50 border border-green-200 rounded-xl p-4">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <p className="font-semibold text-green-800 text-sm">Hoạt động đang mở đăng ký</p>
          <div className="flex items-center gap-3 mt-0.5 text-xs text-green-600">
            {hanDangKy && (
              <span>Hạn: {new Date(hanDangKy).toLocaleDateString('vi-VN')}</span>
            )}
            {soChoConLai != null && soChoConLai > 0 && (
              <span className="flex items-center gap-1">
                <Users className="w-3 h-3" /> Còn {soChoConLai} chỗ
              </span>
            )}
          </div>
        </div>
        <button
          onClick={handleClick}
          className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors"
        >
          {!isAuthenticated && <LogIn className="w-4 h-4" />}
          {isAuthenticated ? 'Đăng ký tham gia' : 'Đăng nhập để đăng ký'}
        </button>
      </div>
    </div>
  );
};

export default ActivityRegisterBtn;
