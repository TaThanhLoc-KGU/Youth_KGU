import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  Activity,
  ClipboardCheck,
  Users,
  Calendar,
  ChevronRight,
  Clock,
  CheckCircle2,
  AlertCircle,
  QrCode,
  Plus,
  Newspaper,
} from 'lucide-react';
import activityService from '../../services/activityService';
import attendanceService from '../../services/attendanceService';
import useAuthStore from '../../stores/authStore';
import { ROUTES, PERMISSIONS } from '../../utils/constants';
import { formatDate } from '../../utils/dateFormat';
import Loading from '../../components/common/Loading';

const STATUS_BADGE = {
  CHUA_MO_DANG_KY:  { label: 'Chưa mở ĐK',   cls: 'bg-gray-100 text-gray-700' },
  MO_DANG_KY:       { label: 'Mở đăng ký',    cls: 'bg-green-100 text-green-700' },
  DONG_DANG_KY:     { label: 'Đóng đăng ký',  cls: 'bg-yellow-100 text-yellow-700' },
  DANG_DIEN_RA:     { label: 'Đang diễn ra',  cls: 'bg-blue-100 text-blue-700' },
  DA_KET_THUC:      { label: 'Đã kết thúc',   cls: 'bg-purple-100 text-purple-700' },
  DA_HUY:           { label: 'Đã hủy',        cls: 'bg-red-100 text-red-700' },
};

const BCHDashboard = () => {
  const { user, hasPermission, danhSachChucVu } = useAuthStore();

  const { data: allActivities = [], isLoading: loadingAll } = useQuery({
    queryKey: ['bch-all-activities'],
    queryFn: () => activityService.getAll(),
    staleTime: 3 * 60 * 1000,
  });

  const { data: ongoingActivities = [], isLoading: loadingOngoing } = useQuery({
    queryKey: ['bch-ongoing'],
    queryFn: () => activityService.getOngoing(),
    staleTime: 60 * 1000,
  });

  const { data: upcomingActivities = [], isLoading: loadingUpcoming } = useQuery({
    queryKey: ['bch-upcoming'],
    queryFn: () => activityService.getUpcoming(),
    staleTime: 3 * 60 * 1000,
  });

  const { data: attendanceStats = {} } = useQuery({
    queryKey: ['bch-attendance-overview'],
    queryFn: () => attendanceService.getStatisticsOverview(),
    staleTime: 3 * 60 * 1000,
  });

  const isLoading = loadingAll || loadingOngoing || loadingUpcoming;

  // Stats tổng quan
  const statCards = [
    {
      title: 'Tổng hoạt động',
      value: allActivities.length,
      icon: Activity,
      color: 'bg-blue-500',
      bg: 'bg-blue-50',
      textColor: 'text-blue-600',
    },
    {
      title: 'Đang diễn ra',
      value: ongoingActivities.length,
      icon: Clock,
      color: 'bg-green-500',
      bg: 'bg-green-50',
      textColor: 'text-green-600',
    },
    {
      title: 'Sắp diễn ra',
      value: upcomingActivities.length,
      icon: Calendar,
      color: 'bg-indigo-500',
      bg: 'bg-indigo-50',
      textColor: 'text-indigo-600',
    },
    {
      title: 'Lượt điểm danh',
      value: attendanceStats?.tongDiemDanh ?? '—',
      icon: ClipboardCheck,
      color: 'bg-amber-500',
      bg: 'bg-amber-50',
      textColor: 'text-amber-600',
    },
  ];

  if (isLoading) return <Loading />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Xin chào, {user?.hoTen || user?.username}!
          </h1>
          <p className="text-gray-500 mt-1">
            {danhSachChucVu?.length > 0
              ? danhSachChucVu.map((cv) => cv.tenChucVu).join(' · ')
              : 'Ban Chấp hành Đoàn - Hội KGU'}
          </p>
        </div>

        {/* Quick actions */}
        <div className="flex flex-wrap gap-2">
          {hasPermission(PERMISSIONS.TAO_HOAT_DONG) && (
            <Link
              to={`${ROUTES.BCH}/activities/create`}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition"
            >
              <Plus className="w-4 h-4" /> Tạo hoạt động
            </Link>
          )}
          {hasPermission(PERMISSIONS.QUET_QR) && (
            <Link
              to={ROUTES.BCH_SCAN_QR}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition"
            >
              <QrCode className="w-4 h-4" /> Quét QR
            </Link>
          )}
          <Link
            to={ROUTES.BCH_NEWS}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 hover:border-gray-300 transition shadow-sm"
          >
            <Newspaper className="w-4 h-4" /> Tin tức
          </Link>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statCards.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <div key={i} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-medium text-gray-500">{stat.title}</p>
                <div className={`w-9 h-9 ${stat.color} rounded-lg flex items-center justify-center`}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
              </div>
              <p className={`text-3xl font-bold ${stat.textColor}`}>{stat.value}</p>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Hoạt động đang diễn ra */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <Clock className="w-4 h-4 text-green-500" /> Đang diễn ra
            </h3>
            <Link
              to={ROUTES.BCH_ATTENDANCE}
              className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1 font-medium"
            >
              Điểm danh <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="divide-y divide-gray-50">
            {ongoingActivities.length === 0 ? (
              <div className="py-10 text-center">
                <CheckCircle2 className="w-10 h-10 text-gray-200 mx-auto mb-2" />
                <p className="text-sm text-gray-400">Không có hoạt động đang diễn ra</p>
              </div>
            ) : (
              ongoingActivities.slice(0, 5).map((act) => (
                <div key={act.maHoatDong} className="px-5 py-3 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm text-gray-900 truncate">{act.tenHoatDong}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{act.diaDiem}</p>
                    </div>
                    <Link
                      to={`${ROUTES.BCH}/activities/${act.maHoatDong}/attendance`}
                      className="flex-shrink-0 text-xs bg-blue-50 text-blue-700 border border-blue-200 px-3 py-1 rounded-full font-medium hover:bg-blue-100"
                    >
                      Điểm danh
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Hoạt động sắp tới */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-indigo-500" /> Sắp diễn ra
            </h3>
            <Link
              to={ROUTES.BCH_ACTIVITIES}
              className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1 font-medium"
            >
              Xem tất cả <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="divide-y divide-gray-50">
            {upcomingActivities.length === 0 ? (
              <div className="py-10 text-center">
                <AlertCircle className="w-10 h-10 text-gray-200 mx-auto mb-2" />
                <p className="text-sm text-gray-400">Chưa có hoạt động nào sắp tới</p>
              </div>
            ) : (
              upcomingActivities.slice(0, 5).map((act) => {
                const badge = STATUS_BADGE[act.trangThai] || { label: act.trangThai, cls: 'bg-gray-100 text-gray-700' };
                return (
                  <div key={act.maHoatDong} className="px-5 py-3 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm text-gray-900 truncate">{act.tenHoatDong}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{formatDate(act.ngayToChuc)}</p>
                      </div>
                      <span className={`flex-shrink-0 text-xs px-2 py-0.5 rounded-full font-medium ${badge.cls}`}>
                        {badge.label}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Tất cả hoạt động gần đây */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-900">Hoạt động gần đây</h3>
          <Link
            to={ROUTES.BCH_ACTIVITIES}
            className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1 font-medium"
          >
            Quản lý <ChevronRight className="w-3 h-3" />
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-gray-500 border-b border-gray-100">
                <th className="text-left px-5 py-3 font-medium">Tên hoạt động</th>
                <th className="text-left px-5 py-3 font-medium">Ngày tổ chức</th>
                <th className="text-left px-5 py-3 font-medium">Địa điểm</th>
                <th className="text-left px-5 py-3 font-medium">Trạng thái</th>
                <th className="px-5 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {allActivities.slice(0, 8).map((act) => {
                const badge = STATUS_BADGE[act.trangThai] || { label: act.trangThai, cls: 'bg-gray-100 text-gray-700' };
                return (
                  <tr key={act.maHoatDong} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3 font-medium text-gray-900">{act.tenHoatDong}</td>
                    <td className="px-5 py-3 text-gray-500">{formatDate(act.ngayToChuc)}</td>
                    <td className="px-5 py-3 text-gray-500 truncate max-w-[150px]">{act.diaDiem || '—'}</td>
                    <td className="px-5 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${badge.cls}`}>
                        {badge.label}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right">
                      {act.trangThai === 'DANG_DIEN_RA' && hasPermission(PERMISSIONS.QUET_QR) && (
                        <Link
                          to={`${ROUTES.BCH}/activities/${act.maHoatDong}/attendance`}
                          className="text-xs text-blue-600 hover:underline"
                        >
                          Điểm danh
                        </Link>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {allActivities.length === 0 && (
            <div className="py-10 text-center text-sm text-gray-400">Chưa có hoạt động nào</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BCHDashboard;
