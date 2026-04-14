import { useState, useMemo, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import QRCode from 'react-qr-code';
import {
  Calendar,
  QrCode,
  CheckCircle2,
  Clock,
  Search,
  Trash2,
  BookOpen,
  X,
  MapPin,
  AlertCircle,
} from 'lucide-react';
import dangKyService from '../../services/dangKyService';
import activityService from '../../services/activityService';
import useAuthStore from '../../stores/authStore';
import { formatDate } from '../../utils/dateFormat';
import Modal from '../../components/common/Modal';

const HK_LABELS = { 1: 'Học kỳ 1', 2: 'Học kỳ 2', 3: 'Học kỳ hè' };

const STATUS_CONFIG = {
  attended: {
    label: 'Đã tham gia',
    icon: CheckCircle2,
    className: 'bg-green-50 text-green-700 border-green-200',
    iconColor: 'text-green-500',
    accentColor: 'bg-green-400',
  },
  confirmed: {
    label: 'Đã xác nhận',
    icon: CheckCircle2,
    className: 'bg-blue-50 text-blue-700 border-blue-200',
    iconColor: 'text-blue-500',
    accentColor: 'bg-blue-400',
  },
  pending: {
    label: 'Chờ xác nhận',
    icon: Clock,
    className: 'bg-amber-50 text-amber-700 border-amber-200',
    iconColor: 'text-amber-500',
    accentColor: 'bg-amber-300',
  },
};

const getRegStatus = (reg) => {
  if (reg.daDiemDanh) return 'attended';
  if (reg.daXacNhan) return 'confirmed';
  return 'pending';
};

/* ── Skeleton ────────────────────────────────────────────────────── */
const SkeletonItem = () => (
  <div className="bg-white rounded-2xl border border-gray-100 mb-3 overflow-hidden flex animate-pulse">
    <div className="w-1 bg-gray-200 flex-shrink-0" />
    <div className="flex-1 p-4">
      <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
      <div className="h-3 bg-gray-100 rounded w-1/2 mb-3" />
      <div className="h-3 bg-gray-100 rounded w-2/3" />
    </div>
  </div>
);

const MyActivities = () => {
  const { user } = useAuthStore();
  const maSv = user?.linkedEntityId || (user?.vaiTro === 'SINH_VIEN' ? user?.username : null);
  const queryClient = useQueryClient();

  const [search, setSearch] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [filterAttended, setFilterAttended] = useState('all');
  const [namHocFilter, setNamHocFilter] = useState('all');
  const [hocKyFilter, setHocKyFilter] = useState('all');
  const [hasSetDefault, setHasSetDefault] = useState(false);
  const [selectedReg, setSelectedReg] = useState(null);
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [gpsStatus, setGpsStatus] = useState('idle'); // idle | requesting | granted | denied
  const gpsWatchRef = useRef(null);

  // ── Thông tin học kỳ hiện tại ─────────────────────────────────────────
  const { data: academicInfo } = useQuery({
    queryKey: ['academic-info'],
    queryFn: () => activityService.getCurrentAcademicInfo(),
    staleTime: 60 * 60 * 1000,
  });

  // ── Fetch đăng ký của sinh viên ───────────────────────────────────────
  const { data: registrations = [], isLoading, refetch } = useQuery({
    queryKey: ['student-registrations', maSv],
    queryFn: () => dangKyService.getByStudent(maSv),
    enabled: !!maSv,
  });

  // Set mặc định khi data load xong (chỉ 1 lần):
  useEffect(() => {
    if (hasSetDefault || registrations.length === 0) return;
    setHasSetDefault(true);

    const allYears = [...new Set(registrations.map((r) => r.maNamHoc).filter(Boolean))].sort(
      (a, b) => b.localeCompare(a),
    );
    if (!allYears.length) return;

    const currentYear = academicInfo?.maNamHoc;
    const targetYear = currentYear && allYears.includes(currentYear) ? currentYear : allYears[0];
    setNamHocFilter(targetYear);

    const hksInYear = [...new Set(
      registrations.filter((r) => r.maNamHoc === targetYear && r.soHocKy).map((r) => r.soHocKy),
    )].sort((a, b) => b - a);
    if (!hksInYear.length) return;

    const currentHK = academicInfo?.soHocKy ? String(academicInfo.soHocKy) : null;
    const targetHK =
      targetYear === currentYear && currentHK && hksInYear.map(String).includes(currentHK)
        ? currentHK
        : String(hksInYear[0]);
    setHocKyFilter(targetHK);
  }, [registrations, academicInfo, hasSetDefault]);

  // ── Cancel mutation ──────────────────────────────────────────────────
  const cancelMutation = useMutation({
    mutationFn: ({ maSv, maHoatDong }) => dangKyService.cancel(maSv, maHoatDong),
    onSuccess: () => {
      toast.success('Hủy đăng ký thành công!');
      queryClient.invalidateQueries({ queryKey: ['student-registrations', maSv] });
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Không thể hủy đăng ký!');
    },
  });

  // ── Năm học có trong danh sách ────────────────────────────────────────
  const availableNamHoc = useMemo(() => {
    const seen = new Set();
    const result = [];
    registrations.forEach((r) => {
      if (r.maNamHoc && !seen.has(r.maNamHoc)) {
        seen.add(r.maNamHoc);
        result.push({ value: r.maNamHoc, label: r.tenNamHoc || r.maNamHoc });
      }
    });
    result.sort((a, b) => b.value.localeCompare(a.value));
    return [{ value: 'all', label: 'Tất cả năm học' }, ...result];
  }, [registrations]);

  // ── Học kỳ có trong danh sách (theo năm học đã chọn) ──────────────────
  const availableHocKy = useMemo(() => {
    const seen = new Set();
    registrations
      .filter((r) => namHocFilter === 'all' || r.maNamHoc === namHocFilter)
      .forEach((r) => { if (r.soHocKy) seen.add(r.soHocKy); });
    const list = [...seen].sort();
    return [
      { value: 'all', label: 'Tất cả HK' },
      ...list.map((hk) => ({ value: String(hk), label: HK_LABELS[hk] || `HK${hk}` })),
    ];
  }, [registrations, namHocFilter]);

  // ── Filter ────────────────────────────────────────────────────────────
  const filtered = useMemo(() => registrations.filter((reg) => {
    if (search) {
      const q = search.toLowerCase();
      if (!reg.tenHoatDong?.toLowerCase().includes(q) && !reg.maHoatDong?.toLowerCase().includes(q))
        return false;
    }
    if (filterAttended === 'attended' && !reg.daDiemDanh) return false;
    if (filterAttended === 'not_attended' && reg.daDiemDanh) return false;
    if (namHocFilter !== 'all' && reg.maNamHoc !== namHocFilter) return false;
    if (hocKyFilter !== 'all' && String(reg.soHocKy) !== hocKyFilter) return false;
    return true;
  }), [registrations, search, filterAttended, namHocFilter, hocKyFilter]);

  // ── GPS: yêu cầu quyền và gửi vị trí khi QR modal mở ───────────────
  useEffect(() => {
    if (!qrModalOpen || !selectedReg?.maQR) {
      // Dọn dẹp khi đóng modal
      if (gpsWatchRef.current != null) {
        navigator.geolocation?.clearWatch(gpsWatchRef.current);
        gpsWatchRef.current = null;
      }
      setGpsStatus('idle');
      return;
    }

    if (!navigator.geolocation) {
      setGpsStatus('denied');
      return;
    }

    setGpsStatus('requesting');

    const sendLocation = (lat, lng) => {
      dangKyService.submitCheckInLocation(selectedReg.maQR, lat, lng).catch(() => {});
    };

    // Lần đầu lấy vị trí → hiển thị popup xin quyền GPS
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGpsStatus('granted');
        sendLocation(pos.coords.latitude, pos.coords.longitude);
      },
      () => setGpsStatus('denied'),
      { enableHighAccuracy: true, timeout: 10000 },
    );

    // Theo dõi liên tục để cập nhật vị trí mới nhất
    gpsWatchRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        setGpsStatus('granted');
        sendLocation(pos.coords.latitude, pos.coords.longitude);
      },
      () => {},
      { enableHighAccuracy: true },
    );

    return () => {
      if (gpsWatchRef.current != null) {
        navigator.geolocation.clearWatch(gpsWatchRef.current);
        gpsWatchRef.current = null;
      }
    };
  }, [qrModalOpen, selectedReg?.maQR]);

  const handleShowQR = (reg) => { setSelectedReg(reg); setQrModalOpen(true); };

  const handleCancel = (reg) => {
    if (reg.daDiemDanh) { toast.error('Không thể hủy đăng ký hoạt động đã tham gia!'); return; }
    if (window.confirm(`Bạn có chắc muốn hủy đăng ký "${reg.tenHoatDong}"?`)) {
      cancelMutation.mutate({ maSv, maHoatDong: reg.maHoatDong });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ── Stats chips row ──────────────────────────────────────────── */}
      <div className="flex gap-3 px-4 py-3 overflow-x-auto no-scrollbar">
        {[
          { label: 'Tổng đăng ký', value: registrations.length, color: 'text-gray-900', bg: 'bg-white border-gray-200' },
          { label: 'Đã tham gia', value: registrations.filter(r => r.daDiemDanh).length, color: 'text-green-700', bg: 'bg-green-50 border-green-200' },
          { label: 'Chờ tham gia', value: registrations.filter(r => !r.daDiemDanh).length, color: 'text-amber-700', bg: 'bg-amber-50 border-amber-200' },
        ].map((s) => (
          <div key={s.label} className={`flex-shrink-0 ${s.bg} border rounded-2xl px-4 py-2.5 text-center min-w-[100px]`}>
            <p className={`text-xl font-bold ${s.color} leading-none`}>{s.value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* ── Compact filter bar ───────────────────────────────────────── */}
      <div className="px-4 pb-2">
        <div className="flex items-center gap-2">
          {/* Horizontal scrollable filter chips */}
          <div className="flex gap-2 overflow-x-auto no-scrollbar flex-1">
            {/* Nam hoc chips */}
            {availableNamHoc.map((o) => (
              <button
                key={o.value}
                onClick={() => { setNamHocFilter(o.value); if (o.value !== namHocFilter) setHocKyFilter('all'); }}
                className={`flex-shrink-0 text-xs px-3 py-1.5 rounded-full border font-medium transition-colors ${
                  namHocFilter === o.value
                    ? 'bg-primary text-white border-primary'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
                }`}
              >
                {o.label}
              </button>
            ))}
          </div>
          {/* Search icon */}
          <button
            onClick={() => setSearchOpen(v => !v)}
            className={`flex-shrink-0 p-2 rounded-xl border transition-colors ${
              searchOpen || search ? 'bg-primary text-white border-primary' : 'bg-white text-gray-600 border-gray-200'
            }`}
          >
            <Search className="w-4 h-4" />
          </button>
        </div>

        {/* HocKy chips row */}
        {namHocFilter !== 'all' && availableHocKy.length > 1 && (
          <div className="flex gap-2 overflow-x-auto no-scrollbar mt-2">
            {availableHocKy.map((o) => (
              <button
                key={o.value}
                onClick={() => setHocKyFilter(o.value)}
                className={`flex-shrink-0 text-xs px-3 py-1.5 rounded-full border font-medium transition-colors ${
                  hocKyFilter === o.value
                    ? 'bg-indigo-600 text-white border-indigo-600'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
                }`}
              >
                {o.label}
              </button>
            ))}
            {/* Status filter chips */}
            {[
              { value: 'all', label: 'Tất cả' },
              { value: 'attended', label: 'Đã tham gia' },
              { value: 'not_attended', label: 'Chưa tham gia' },
            ].map((o) => (
              <button
                key={o.value}
                onClick={() => setFilterAttended(o.value)}
                className={`flex-shrink-0 text-xs px-3 py-1.5 rounded-full border font-medium transition-colors ${
                  filterAttended === o.value
                    ? 'bg-gray-800 text-white border-gray-800'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
                }`}
              >
                {o.label}
              </button>
            ))}
          </div>
        )}

        {/* Inline search */}
        {searchOpen && (
          <div className="relative mt-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              autoFocus
              placeholder="Tìm kiếm hoạt động..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-white rounded-xl pl-9 pr-9 py-2.5 text-sm border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-colors"
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2">
                <X className="w-4 h-4 text-gray-400" />
              </button>
            )}
          </div>
        )}

        {/* Summary */}
        <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
          <span>
            <strong className="text-gray-700">{filtered.length}</strong> / {registrations.length} hoạt động
          </span>
          {namHocFilter !== 'all' && (
            <button
              className="text-primary underline"
              onClick={() => { setNamHocFilter('all'); setHocKyFilter('all'); }}
            >
              Xem tất cả
            </button>
          )}
        </div>
      </div>

      {/* ── Activity list ────────────────────────────────────────────── */}
      <div className="px-4 pb-4">
        {isLoading ? (
          <>
            <SkeletonItem />
            <SkeletonItem />
            <SkeletonItem />
          </>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 py-16 text-center">
            <Calendar className="w-12 h-12 text-gray-200 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">Không có hoạt động nào</p>
            <p className="text-sm text-gray-400 mt-1">
              {namHocFilter !== 'all'
                ? 'Thử nhấn "Xem tất cả" để xem các học kỳ khác'
                : 'Hãy đăng ký tham gia các hoạt động mới!'}
            </p>
          </div>
        ) : (
          filtered.map((reg) => {
            const statusKey = getRegStatus(reg);
            const status = STATUS_CONFIG[statusKey];
            const Icon = status.icon;

            // QR logic: hiện khi hoạt động đang diễn ra (trangThaiHoatDong) HOẶC đúng ngày
            const today = new Date();
            const actDate = reg.ngayToChuc ? new Date(reg.ngayToChuc) : null;
            const isEventDay = actDate &&
              today.getFullYear() === actDate.getFullYear() &&
              today.getMonth() === actDate.getMonth() &&
              today.getDate() === actDate.getDate();
            const isRunning = reg.trangThaiHoatDong === 'DANG_DIEN_RA';
            const isFuture = actDate && today < actDate && !isRunning;
            const qrDisabled = !isEventDay && !isRunning;
            const qrTitle = isRunning
              ? 'Xem QR điểm danh'
              : isFuture
              ? `QR mở vào ngày ${formatDate(reg.ngayToChuc)}`
              : isEventDay ? 'Xem QR điểm danh' : 'Sự kiện đã kết thúc';

            return (
              <div
                key={`${reg.maSv}-${reg.maHoatDong}`}
                className="bg-white rounded-2xl border border-gray-100 mb-3 overflow-hidden flex min-h-[72px]"
              >
                {/* Left accent bar */}
                <div className={`w-1 flex-shrink-0 ${status.accentColor}`} />

                {/* Content */}
                <div className="flex-1 p-4 min-w-0">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-gray-900 text-sm leading-snug line-clamp-2">
                        {reg.tenHoatDong}
                      </h4>
                      <p className="text-xs text-gray-400 mt-0.5">{reg.maHoatDong}</p>

                      {/* Học kỳ + năm học */}
                      {(reg.soHocKy || reg.maNamHoc) && (
                        <span className="inline-flex items-center gap-1 mt-1 text-xs bg-indigo-50 text-indigo-600 border border-indigo-100 px-2 py-0.5 rounded-full">
                          <BookOpen className="w-3 h-3" />
                          {reg.soHocKy ? (HK_LABELS[reg.soHocKy] || `HK${reg.soHocKy}`) : ''}
                          {reg.tenNamHoc ? ` · ${reg.tenNamHoc}` : reg.maNamHoc ? ` · ${reg.maNamHoc}` : ''}
                        </span>
                      )}

                      {/* Date / check-in */}
                      <div className="flex flex-wrap gap-3 mt-1.5 text-xs text-gray-500">
                        {reg.ngayToChuc && (
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5" />
                            {formatDate(reg.ngayToChuc)}
                          </span>
                        )}
                        {reg.thoiGianDiemDanh && (
                          <span className="flex items-center gap-1 text-green-600">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            {new Date(reg.thoiGianDiemDanh).toLocaleString('vi-VN')}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Right: status + actions */}
                    <div className="flex flex-col items-end gap-2 flex-shrink-0">
                      <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border ${status.className}`}>
                        <Icon className={`w-3 h-3 ${status.iconColor}`} />
                        {status.label}
                      </span>

                      <div className="flex items-center gap-1.5">
                        {/* QR button */}
                        {reg.maQR && (
                          <button
                            onClick={() => !qrDisabled && handleShowQR(reg)}
                            disabled={qrDisabled}
                            title={qrTitle}
                            className={`flex items-center gap-1 text-xs px-2.5 py-1.5 border rounded-xl transition-colors ${
                              qrDisabled
                                ? 'bg-gray-50 text-gray-400 border-gray-200 cursor-not-allowed'
                                : 'bg-primary/10 text-primary border-primary/20 hover:bg-primary/20'
                            }`}
                          >
                            <QrCode className="w-3.5 h-3.5" />
                            QR
                          </button>
                        )}

                        {/* Cancel button */}
                        {!reg.daDiemDanh && (
                          <button
                            onClick={() => handleCancel(reg)}
                            disabled={cancelMutation.isPending}
                            title="Hủy đăng ký"
                            className="flex items-center gap-1 text-xs px-2.5 py-1.5 bg-red-50 text-red-600 border border-red-200 rounded-xl hover:bg-red-100 transition-colors disabled:opacity-50"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* ── QR Code Modal ────────────────────────────────────────────── */}
      <Modal
        isOpen={qrModalOpen}
        onClose={() => setQrModalOpen(false)}
        title="Mã QR điểm danh"
        size="sm"
      >
        {selectedReg && (
          <div className="text-center space-y-4 py-2">
            <div>
              <p className="font-semibold text-gray-900">{selectedReg.tenHoatDong}</p>
              <p className="text-sm text-gray-500 mt-1">
                Mã SV: <span className="font-medium">{selectedReg.maSv}</span>
              </p>
              {selectedReg.soHocKy && (
                <p className="text-xs text-indigo-600 mt-0.5">
                  {HK_LABELS[selectedReg.soHocKy] || `HK${selectedReg.soHocKy}`}
                  {selectedReg.tenNamHoc ? ` · ${selectedReg.tenNamHoc}` : ''}
                </p>
              )}
            </div>

            <div className="flex justify-center p-4 bg-white border-2 border-gray-100 rounded-2xl mx-auto">
              <QRCode value={selectedReg.maQR} size={200} level="M" />
            </div>

            <div className="bg-gray-50 rounded-xl p-3">
              <p className="text-xs text-gray-500 mb-1">Mã QR:</p>
              <p className="font-mono text-sm font-medium text-gray-800 break-all">{selectedReg.maQR}</p>
            </div>

            {selectedReg.daDiemDanh ? (
              <div className="flex items-center justify-center gap-2 text-sm text-green-600 bg-green-50 border border-green-200 rounded-xl p-3">
                <CheckCircle2 className="w-4 h-4" />
                <span>Bạn đã check-in thành công hoạt động này</span>
              </div>
            ) : (
              <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 space-y-2">
                <p className="text-xs text-blue-600">
                  Trình mã QR này cho BCH để được điểm danh tham gia hoạt động.
                </p>
                {/* GPS status */}
                {gpsStatus === 'requesting' && (
                  <div className="flex items-center gap-2 text-xs text-amber-600">
                    <MapPin className="w-3.5 h-3.5 animate-pulse" />
                    <span>Đang yêu cầu quyền GPS…</span>
                  </div>
                )}
                {gpsStatus === 'granted' && (
                  <div className="flex items-center gap-2 text-xs text-green-600">
                    <MapPin className="w-3.5 h-3.5" />
                    <span>Vị trí đang được chia sẻ với BCH</span>
                  </div>
                )}
                {gpsStatus === 'denied' && (
                  <div className="flex items-center gap-2 text-xs text-red-500">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>Không lấy được GPS — vui lòng cấp quyền vị trí cho trình duyệt</span>
                  </div>
                )}
              </div>
            )}

            <button
              onClick={() => setQrModalOpen(false)}
              className="w-full py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Đóng
            </button>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default MyActivities;
