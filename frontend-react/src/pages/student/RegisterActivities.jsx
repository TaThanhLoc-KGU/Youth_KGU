import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import {
  Calendar,
  MapPin,
  Users,
  Search,
  RefreshCw,
  Clock,
  CheckCircle2,
  TrendingUp,
} from 'lucide-react';
import activityService from '../../services/activityService';
import dangKyService from '../../services/dangKyService';
import useAuthStore from '../../stores/authStore';
import { formatDate } from '../../utils/dateFormat';
import Badge from '../../components/common/Badge';
import Modal from '../../components/common/Modal';
import Loading from '../../components/common/Loading';
import {
  TRANG_THAI_OPTIONS,
  LOAI_HOAT_DONG_OPTIONS,
  getLoaiHoatDongLabel,
  getTrangThaiBadgeVariant,
  getTrangThaiLabel,
} from '../../constants/activityConstants';

const RegisterActivities = () => {
  const { user } = useAuthStore();
  // maSv: ưu tiên linkedEntityId, fallback sang username (vì username = maSv với tài khoản sinh viên)
  const maSv = user?.linkedEntityId || (user?.vaiTro === 'SINH_VIEN' ? user?.username : null);
  const queryClient = useQueryClient();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [selectedActivity, setSelectedActivity] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [agreed, setAgreed] = useState(false);

  // Fetch activities with pagination
  const { data: activitiesData, isLoading, refetch } = useQuery({
    queryKey: ['register-activities', statusFilter, typeFilter],
    queryFn: () => activityService.getAllWithPagination({ page: 0, size: 100 }),
    keepPreviousData: true,
  });

  // Fetch student's registrations to check already-registered
  const { data: myRegistrations = [] } = useQuery({
    queryKey: ['student-registrations', maSv],
    queryFn: () => dangKyService.getByStudent(maSv),
    enabled: !!maSv,
  });

  const registeredSet = new Set(myRegistrations.map((r) => r.maHoatDong));

  // Filter activities
  const activities = (activitiesData?.content || []).filter((a) => {
    const matchSearch =
      !search ||
      a.tenHoatDong?.toLowerCase().includes(search.toLowerCase()) ||
      a.maHoatDong?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = !statusFilter || a.trangThai === statusFilter;
    const matchType = !typeFilter || a.loaiHoatDong === typeFilter;
    return matchSearch && matchStatus && matchType;
  });

  // Register mutation
  const registerMutation = useMutation({
    mutationFn: () => dangKyService.register(maSv, selectedActivity?.maHoatDong),
    onSuccess: () => {
      toast.success('Đăng ký hoạt động thành công!');
      setModalOpen(false);
      setSelectedActivity(null);
      setAgreed(false);
      queryClient.invalidateQueries(['student-registrations', maSv]);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Đăng ký thất bại. Vui lòng thử lại!');
    },
  });

  const handleRegisterClick = (activity) => {
    if (!maSv) {
      toast.error('Không tìm thấy mã sinh viên. Vui lòng đăng xuất và đăng nhập lại!');
      return;
    }
    setSelectedActivity(activity);
    setAgreed(false);
    setModalOpen(true);
  };

  const handleConfirmRegister = () => {
    if (!maSv) {
      toast.error('Không tìm thấy mã sinh viên. Vui lòng đăng xuất và đăng nhập lại!');
      return;
    }
    if (!agreed) {
      toast.warning('Vui lòng đồng ý với điều khoản đăng ký');
      return;
    }
    registerMutation.mutate();
  };

  const isFull = (activity) =>
    activity.soLuongToiDa > 0 &&
    (activity.soNguoiDangKy || 0) >= activity.soLuongToiDa;

  const canRegister = (activity) =>
    activity.trangThai === 'DANG_MO_DANG_KY' &&
    !registeredSet.has(activity.maHoatDong) &&
    !isFull(activity);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Đăng ký hoạt động</h1>
        <p className="text-gray-500 mt-1">
          Xem và đăng ký tham gia các hoạt động Đoàn – Hội sinh viên KGU
        </p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="md:col-span-2 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Tìm kiếm tên hoạt động..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
          >
            <option value="">Tất cả trạng thái</option>
            {TRANG_THAI_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
          >
            <option value="">Tất cả loại</option>
            {LOAI_HOAT_DONG_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Results count */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-gray-500">
          Hiển thị <span className="font-medium text-gray-900">{activities.length}</span> hoạt động
        </p>
        <button
          onClick={() => refetch()}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700"
        >
          <RefreshCw className="w-4 h-4" /> Làm mới
        </button>
      </div>

      {/* Activity Grid */}
      {isLoading ? (
        <Loading />
      ) : activities.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm py-16 text-center">
          <Calendar className="w-12 h-12 text-gray-200 mx-auto mb-3" />
          <p className="text-gray-500">Không tìm thấy hoạt động nào</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {activities.map((activity) => {
            const full = isFull(activity);
            const alreadyRegistered = registeredSet.has(activity.maHoatDong);
            const canReg = canRegister(activity);

            return (
              <div
                key={activity.maHoatDong}
                className="bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow overflow-hidden flex flex-col"
              >
                {/* Color band */}
                <div className="h-2 bg-gradient-to-r from-green-400 to-emerald-500" />

                <div className="p-5 flex-1 flex flex-col gap-3">
                  {/* Title & status */}
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h3 className="font-semibold text-gray-900 text-sm leading-tight line-clamp-2 flex-1">
                        {activity.tenHoatDong}
                      </h3>
                      <Badge variant={getTrangThaiBadgeVariant(activity.trangThai)} size="sm">
                        {getTrangThaiLabel(activity.trangThai)}
                      </Badge>
                    </div>
                    <p className="text-xs text-gray-400">{activity.maHoatDong}</p>
                  </div>

                  {/* Meta info */}
                  <div className="space-y-1.5 text-xs text-gray-500 flex-1">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5 flex-shrink-0" />
                      <span>{formatDate(activity.ngayToChuc)}</span>
                    </div>
                    {activity.diaDiem && (
                      <div className="flex items-center gap-2">
                        <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                        <span className="truncate">{activity.diaDiem}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <Users className="w-3.5 h-3.5 flex-shrink-0" />
                      <span>
                        {activity.soNguoiDangKy || 0} /{' '}
                        {activity.soLuongToiDa > 0 ? activity.soLuongToiDa : '∞'} người đăng ký
                      </span>
                    </div>
                    {activity.diemRenLuyen != null && (
                      <div className="flex items-center gap-2">
                        <TrendingUp className="w-3.5 h-3.5 flex-shrink-0 text-indigo-400" />
                        <span className="text-indigo-600 font-medium">
                          +{activity.diemRenLuyen} điểm rèn luyện
                        </span>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full text-xs">
                        {getLoaiHoatDongLabel(activity.loaiHoatDong)}
                      </span>
                    </div>
                  </div>

                  {/* Description */}
                  {activity.moTa && (
                    <p className="text-xs text-gray-500 line-clamp-2">{activity.moTa}</p>
                  )}

                  {/* Action button */}
                  <div className="pt-2 border-t border-gray-50">
                    {alreadyRegistered ? (
                      <div className="flex items-center justify-center gap-2 py-2 text-sm text-green-600 font-medium">
                        <CheckCircle2 className="w-4 h-4" />
                        Đã đăng ký
                      </div>
                    ) : full ? (
                      <div className="text-center py-2 text-xs text-red-500 font-medium bg-red-50 rounded-lg">
                        Hết chỗ
                      </div>
                    ) : activity.trangThai === 'SAP_DIEN_RA' ? (
                      <div className="flex items-center justify-center gap-2 py-2 text-xs text-blue-500 font-medium bg-blue-50 rounded-lg border border-blue-100">
                        <Clock className="w-3.5 h-3.5" />
                        Chưa mở đăng ký
                      </div>
                    ) : activity.trangThai !== 'DANG_MO_DANG_KY' ? (
                      <div className="text-center py-2 text-xs text-gray-400 font-medium bg-gray-50 rounded-lg">
                        Không thể đăng ký
                      </div>
                    ) : (
                      <button
                        onClick={() => handleRegisterClick(activity)}
                        className="w-full py-2 text-sm font-medium rounded-lg transition-colors bg-green-600 text-white hover:bg-green-700"
                      >
                        Đăng ký tham gia
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Registration Confirmation Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setAgreed(false);
        }}
        title="Xác nhận đăng ký hoạt động"
        size="md"
      >
        {selectedActivity && (
          <div className="space-y-4">
            {/* Activity info */}
            <div className="bg-green-50 border border-green-100 rounded-xl p-4">
              <h4 className="font-semibold text-gray-900 mb-3">{selectedActivity.tenHoatDong}</h4>
              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-green-500" />
                  <span>{formatDate(selectedActivity.ngayToChuc)}</span>
                </div>
                {selectedActivity.diaDiem && (
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-green-500" />
                    <span>{selectedActivity.diaDiem}</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-green-500" />
                  <span>
                    {selectedActivity.soNguoiDangKy || 0} / {selectedActivity.soLuongToiDa} người đăng ký
                  </span>
                </div>
                {selectedActivity.diemRenLuyen != null && (
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-indigo-500" />
                    <span className="text-indigo-700 font-medium">
                      +{selectedActivity.diemRenLuyen} điểm rèn luyện
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Terms */}
            <div className="bg-gray-50 rounded-xl p-4 text-sm text-gray-600">
              <p className="font-semibold text-gray-800 mb-2">Điều khoản đăng ký:</p>
              <ul className="space-y-1 list-disc list-inside text-xs">
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
                Tôi đã đọc và đồng ý với các điều khoản trên
              </span>
            </label>

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => {
                  setModalOpen(false);
                  setAgreed(false);
                }}
                className="flex-1 py-2.5 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                disabled={registerMutation.isPending}
              >
                Hủy
              </button>
              <button
                onClick={handleConfirmRegister}
                disabled={!agreed || registerMutation.isPending}
                className="flex-1 py-2.5 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:bg-gray-100 disabled:text-gray-400 transition-colors"
              >
                {registerMutation.isPending ? 'Đang đăng ký...' : 'Xác nhận đăng ký'}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default RegisterActivities;
