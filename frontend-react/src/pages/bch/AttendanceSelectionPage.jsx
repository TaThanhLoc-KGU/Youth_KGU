import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  QrCode,
  ClipboardCheck,
  MapPin,
  Clock,
  Users,
  CheckCircle2,
  RefreshCw,
  Search,
  Calendar,
  Activity,
  AlertCircle,
  ChevronRight,
  Loader2,
  Timer,
} from 'lucide-react';
import diemDanhService from '../../services/diemDanhService';
import useAuthStore from '../../stores/authStore';
import { PERMISSIONS, ROUTES } from '../../utils/constants';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const STATUS_CONFIG = {
  DANG_DIEN_RA:    { label: 'Đang diễn ra',       color: 'bg-green-100 text-green-800 border-green-200' },
  SAP_DIEN_RA:     { label: 'Sắp diễn ra',         color: 'bg-blue-100 text-blue-800 border-blue-200' },
  DANG_MO_DANG_KY: { label: 'Đang mở đăng ký',    color: 'bg-indigo-100 text-indigo-800 border-indigo-200' },
  DA_KET_THUC:     { label: 'Đã kết thúc',         color: 'bg-gray-100 text-gray-600 border-gray-200' },
  DA_HOAN_THANH:   { label: 'Đã hoàn thành',       color: 'bg-purple-100 text-purple-700 border-purple-200' },
  DA_HUY:          { label: 'Đã hủy',              color: 'bg-red-100 text-red-700 border-red-200' },
};

const CHE_DO_CONFIG = {
  CHECKIN_CHECKOUT: { label: 'Check-in & Check-out', color: 'bg-orange-100 text-orange-700' },
  CHECKIN_ONLY:     { label: 'Chỉ Check-in',          color: 'bg-yellow-100 text-yellow-700' },
  CHECKOUT_ONLY:    { label: 'Chỉ Check-out',          color: 'bg-teal-100 text-teal-700' },
  AUTO_FULL:        { label: 'Tự động',               color: 'bg-gray-100 text-gray-600' },
};

const TABS = [
  { key: 'hom_nay',      label: 'Hôm nay' },
  { key: 'dang_dien_ra', label: 'Đang diễn ra' },
  { key: 'sap_bat_dau',  label: 'Sắp bắt đầu' },
  { key: 'tat_ca',       label: 'Tất cả' },
];

function formatTime(time) {
  if (!time) return '--:--';
  if (typeof time === 'string') return time.substring(0, 5);
  return '--:--';
}

function formatDate(date) {
  if (!date) return '';
  const d = new Date(date);
  return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

/** Tính countdown đến giờ bắt đầu hoặc giờ kết thúc */
function useCountdown(activity) {
  const [label, setLabel] = useState('');

  const compute = useCallback(() => {
    if (!activity) return;
    const today = new Date();
    const actDate = new Date(activity.ngayToChuc);

    // Xác định ngày hôm nay so với ngày hoạt động
    const todayStr = today.toISOString().split('T')[0];
    const actDateStr = actDate.toISOString().split('T')[0];
    if (todayStr !== actDateStr) {
      setLabel('');
      return;
    }

    const parseTime = (t) => {
      if (!t) return null;
      const [h, m] = t.split(':').map(Number);
      const dt = new Date(today);
      dt.setHours(h, m, 0, 0);
      return dt;
    };

    const startTime = parseTime(activity.thoiGianBatDau || activity.gioToChuc);
    const endTime   = parseTime(activity.thoiGianKetThuc);

    const now = today.getTime();

    if (startTime && now < startTime.getTime()) {
      const diff = Math.floor((startTime.getTime() - now) / 1000);
      const h = Math.floor(diff / 3600);
      const m = Math.floor((diff % 3600) / 60);
      const s = diff % 60;
      if (h > 0) setLabel(`Bắt đầu sau ${h}g${m}p`);
      else if (m > 0) setLabel(`Bắt đầu sau ${m}p${s}s`);
      else setLabel(`Bắt đầu sau ${s}s`);
    } else if (endTime && now < endTime.getTime()) {
      const diff = Math.floor((endTime.getTime() - now) / 1000);
      const h = Math.floor(diff / 3600);
      const m = Math.floor((diff % 3600) / 60);
      const s = diff % 60;
      if (h > 0) setLabel(`Kết thúc sau ${h}g${m}p`);
      else if (m > 0) setLabel(`Kết thúc sau ${m}p${s}s`);
      else setLabel(`Kết thúc sau ${s}s`);
    } else {
      setLabel('');
    }
  }, [activity]);

  useEffect(() => {
    compute();
    const id = setInterval(compute, 1000);
    return () => clearInterval(id);
  }, [compute]);

  return label;
}

// ─── ActivityCard ──────────────────────────────────────────────────────────────

function ActivityCard({ activity, onScanQR, onManage, canScanQR, canManage }) {
  const countdown = useCountdown(activity);
  const statusCfg  = STATUS_CONFIG[activity.trangThai] || { label: activity.trangThai, color: 'bg-gray-100 text-gray-600 border-gray-200' };
  const cheDoLabel = CHE_DO_CONFIG[activity.cheDoDiemDanh]?.label || activity.cheDoDiemDanh || '';
  const cheDoColor = CHE_DO_CONFIG[activity.cheDoDiemDanh]?.color || 'bg-gray-100 text-gray-600';

  const pct = activity.soLuongDangKy > 0
    ? Math.min(100, Math.round((activity.soLuongDaDiemDanh / activity.soLuongDangKy) * 100))
    : 0;

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow p-5 flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900 text-base leading-snug line-clamp-2">
            {activity.tenHoatDong}
          </h3>
          <p className="text-xs text-gray-400 mt-0.5 font-mono">{activity.maHoatDong}</p>
        </div>
        <span className={`flex-shrink-0 text-xs px-2 py-1 rounded-full border font-medium ${statusCfg.color}`}>
          {statusCfg.label}
        </span>
      </div>

      {/* Info row */}
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-600">
        <span className="flex items-center gap-1">
          <Calendar className="w-3.5 h-3.5 text-gray-400" />
          {formatDate(activity.ngayToChuc)}
        </span>
        <span className="flex items-center gap-1">
          <Clock className="w-3.5 h-3.5 text-gray-400" />
          {formatTime(activity.thoiGianBatDau || activity.gioToChuc)}
          {activity.thoiGianKetThuc && ` – ${formatTime(activity.thoiGianKetThuc)}`}
        </span>
        {activity.diaDiem && (
          <span className="flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5 text-gray-400" />
            <span className="truncate max-w-[160px]">{activity.diaDiem}</span>
          </span>
        )}
      </div>

      {/* Chế độ điểm danh */}
      <div className="flex items-center gap-2">
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${cheDoColor}`}>
          {cheDoLabel}
        </span>
        {activity.diemRenLuyen != null && (
          <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-50 text-yellow-700 font-medium">
            +{activity.diemRenLuyen} điểm rèn luyện
          </span>
        )}
        {countdown && (
          <span className="ml-auto flex items-center gap-1 text-xs text-orange-600 font-semibold">
            <Timer className="w-3.5 h-3.5" />
            {countdown}
          </span>
        )}
      </div>

      {/* Attendance progress */}
      <div>
        <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
          <span className="flex items-center gap-1">
            <Users className="w-3.5 h-3.5" />
            Đã điểm danh
          </span>
          <span className="font-semibold text-gray-800">
            {activity.soLuongDaDiemDanh}
            <span className="font-normal text-gray-400"> / {activity.soLuongDangKy} đăng ký</span>
          </span>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
          <div
            className={`h-2 rounded-full transition-all duration-500 ${
              pct >= 80 ? 'bg-green-500' : pct >= 40 ? 'bg-blue-500' : 'bg-gray-400'
            }`}
            style={{ width: `${pct}%` }}
          />
        </div>
        <p className="text-right text-xs text-gray-400 mt-0.5">{pct}%</p>
      </div>

      {/* Actions */}
      <div className="flex gap-2 pt-1">
        {canScanQR && (
          <button
            onClick={() => onScanQR(activity)}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            <QrCode className="w-4 h-4" />
            Quét QR
          </button>
        )}
        {canManage && (
          <button
            onClick={() => onManage(activity)}
            className={`flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              canScanQR
                ? 'border border-gray-300 text-gray-700 hover:bg-gray-50'
                : 'flex-1 bg-primary text-white hover:bg-primary/90'
            }`}
          >
            <ClipboardCheck className="w-4 h-4" />
            Quản lý
          </button>
        )}
        {!canScanQR && !canManage && (
          <span className="text-xs text-gray-400 italic">Không có quyền thao tác</span>
        )}
      </div>
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

const AttendanceSelectionPage = () => {
  const navigate = useNavigate();
  const { hasPermission } = useAuthStore();

  const canScanQR  = hasPermission(PERMISSIONS.QUET_QR);
  const canManage  = hasPermission(PERMISSIONS.XEM_DIEM_DANH);

  const [activeTab, setActiveTab]   = useState('hom_nay');
  const [searchText, setSearchText] = useState('');

  const {
    data: activities = [],
    isLoading,
    isError,
    refetch,
    dataUpdatedAt,
  } = useQuery({
    queryKey: ['activities-attendance-overview', activeTab],
    queryFn: () => diemDanhService.getActivitiesOverview(activeTab),
    refetchInterval: 30_000,   // auto-refresh mỗi 30 giây
    staleTime: 20_000,
  });

  // Filter by search text
  const filtered = activities.filter((a) => {
    if (!searchText.trim()) return true;
    const q = searchText.toLowerCase();
    return (
      a.tenHoatDong?.toLowerCase().includes(q) ||
      a.maHoatDong?.toLowerCase().includes(q) ||
      a.diaDiem?.toLowerCase().includes(q)
    );
  });

  const handleScanQR = (activity) => {
    navigate(`${ROUTES.BCH_SCAN_QR}?activity=${activity.maHoatDong}`);
  };

  const handleManage = (activity) => {
    navigate(`/admin/activities/attendance?ma=${encodeURIComponent(activity.maHoatDong)}`);
  };

  const lastUpdated = dataUpdatedAt
    ? new Date(dataUpdatedAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    : '--:--:--';

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Activity className="w-6 h-6 text-primary" />
            Chọn hoạt động điểm danh
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Chọn hoạt động để bắt đầu quét QR hoặc quản lý điểm danh
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-400 flex-shrink-0">
          <Clock className="w-3.5 h-3.5" />
          <span>Cập nhật lúc {lastUpdated}</span>
          <button
            onClick={() => refetch()}
            className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors text-gray-500"
            title="Làm mới danh sách"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-1 bg-gray-100 rounded-lg p-1 mb-5 w-full sm:w-fit">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex-1 sm:flex-none px-3 sm:px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
              activeTab === tab.key
                ? 'bg-white text-primary shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Search bar */}
      <div className="relative mb-5">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="Tìm kiếm theo tên, mã hoạt động, địa điểm..."
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
        />
        {searchText && (
          <button
            onClick={() => setSearchText('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            ×
          </button>
        )}
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex items-center justify-center py-24 text-gray-400">
          <Loader2 className="w-8 h-8 animate-spin mr-3" />
          <span className="text-base">Đang tải danh sách hoạt động...</span>
        </div>
      ) : isError ? (
        <div className="flex flex-col items-center justify-center py-24 text-gray-400 gap-3">
          <AlertCircle className="w-10 h-10 text-red-400" />
          <p className="text-base font-medium text-red-500">Không thể tải danh sách hoạt động</p>
          <button
            onClick={() => refetch()}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-sm font-medium transition-colors"
          >
            <RefreshCw className="w-4 h-4" /> Thử lại
          </button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-gray-400 gap-3">
          <Calendar className="w-12 h-12 text-gray-300" />
          <p className="text-base font-medium">
            {searchText
              ? 'Không tìm thấy hoạt động phù hợp'
              : activeTab === 'hom_nay'
                ? 'Hôm nay không có hoạt động nào'
                : 'Không có hoạt động nào'}
          </p>
          {searchText && (
            <button
              onClick={() => setSearchText('')}
              className="text-sm text-primary hover:underline"
            >
              Xóa bộ lọc
            </button>
          )}
        </div>
      ) : (
        <>
          <p className="text-sm text-gray-500 mb-4">
            Tìm thấy <span className="font-semibold text-gray-800">{filtered.length}</span> hoạt động
            {searchText && ` cho "${searchText}"`}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {filtered.map((activity) => (
              <ActivityCard
                key={activity.maHoatDong}
                activity={activity}
                onScanQR={handleScanQR}
                onManage={handleManage}
                canScanQR={canScanQR}
                canManage={canManage}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default AttendanceSelectionPage;
