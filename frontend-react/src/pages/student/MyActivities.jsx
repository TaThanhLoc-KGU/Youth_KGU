import { useState, useMemo, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import QRCode from 'react-qr-code';
import {
  Calendar,
  MapPin,
  QrCode,
  CheckCircle2,
  Clock,
  Search,
  RefreshCw,
  Trash2,
  BookOpen,
} from 'lucide-react';
import dangKyService from '../../services/dangKyService';
import activityService from '../../services/activityService';
import useAuthStore from '../../stores/authStore';
import { formatDate } from '../../utils/dateFormat';
import Modal from '../../components/common/Modal';
import Loading from '../../components/common/Loading';

const HK_LABELS = { 1: 'Học kỳ 1', 2: 'Học kỳ 2', 3: 'Học kỳ hè' };

const STATUS_CONFIG = {
  attended: {
    label: 'Đã tham gia',
    icon: CheckCircle2,
    className: 'bg-green-50 text-green-700 border-green-200',
    iconColor: 'text-green-500',
  },
  confirmed: {
    label: 'Đã xác nhận',
    icon: CheckCircle2,
    className: 'bg-blue-50 text-blue-700 border-blue-200',
    iconColor: 'text-blue-500',
  },
  pending: {
    label: 'Chờ xác nhận',
    icon: Clock,
    className: 'bg-amber-50 text-amber-700 border-amber-200',
    iconColor: 'text-amber-500',
  },
};

const getRegStatus = (reg) => {
  if (reg.daDiemDanh) return 'attended';
  if (reg.daXacNhan) return 'confirmed';
  return 'pending';
};

const MyActivities = () => {
  const { user } = useAuthStore();
  const maSv = user?.linkedEntityId || (user?.vaiTro === 'SINH_VIEN' ? user?.username : null);
  const queryClient = useQueryClient();

  const [search, setSearch] = useState('');
  const [filterAttended, setFilterAttended] = useState('all');
  const [namHocFilter, setNamHocFilter] = useState('all');
  const [hocKyFilter, setHocKyFilter] = useState('all');
  const [hasSetDefault, setHasSetDefault] = useState(false);
  const [selectedReg, setSelectedReg] = useState(null);
  const [qrModalOpen, setQrModalOpen] = useState(false);

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
  // Ưu tiên học kỳ hiện tại nếu có đăng ký, fallback sang kỳ mới nhất có dữ liệu
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
      { value: 'all', label: 'Tất cả học kỳ' },
      ...list.map((hk) => ({ value: String(hk), label: HK_LABELS[hk] || `Học kỳ ${hk}` })),
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

  const handleShowQR = (reg) => { setSelectedReg(reg); setQrModalOpen(true); };

  const handleCancel = (reg) => {
    if (reg.daDiemDanh) { toast.error('Không thể hủy đăng ký hoạt động đã tham gia!'); return; }
    if (window.confirm(`Bạn có chắc muốn hủy đăng ký "${reg.tenHoatDong}"?`)) {
      cancelMutation.mutate({ maSv, maHoatDong: reg.maHoatDong });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Hoạt động của tôi</h1>
        <p className="text-gray-500 mt-1">
          Danh sách hoạt động bạn đã đăng ký và trạng thái tham gia
        </p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Tổng đăng ký',   value: registrations.length,                     color: 'text-gray-900',  bg: 'bg-gray-50'  },
          { label: 'Đã tham gia',    value: registrations.filter((r) => r.daDiemDanh).length, color: 'text-green-600', bg: 'bg-green-50' },
          { label: 'Chờ tham gia',   value: registrations.filter((r) => !r.daDiemDanh).length, color: 'text-amber-600', bg: 'bg-amber-50'  },
        ].map((s) => (
          <div key={s.label} className={`${s.bg} rounded-xl p-4 text-center`}>
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-gray-500 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 space-y-3">
        {/* Row 1: Năm học + Học kỳ */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-gray-400 mb-1 uppercase tracking-wide">
              <BookOpen className="w-3 h-3 inline mr-1" />Năm học
            </label>
            <select
              value={namHocFilter}
              onChange={(e) => { setNamHocFilter(e.target.value); setHocKyFilter('all'); }}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
            >
              {availableNamHoc.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-400 mb-1 uppercase tracking-wide">
              <Clock className="w-3 h-3 inline mr-1" />Học kỳ
            </label>
            <select
              value={hocKyFilter}
              onChange={(e) => setHocKyFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
            >
              {availableHocKy.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Row 2: Search + Status + Refresh */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Tìm kiếm hoạt động..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
            />
          </div>
          <select
            value={filterAttended}
            onChange={(e) => setFilterAttended(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="attended">Đã tham gia</option>
            <option value="not_attended">Chưa tham gia</option>
          </select>
          <button
            onClick={() => refetch()}
            className="flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50"
          >
            <RefreshCw className="w-4 h-4" /> Làm mới
          </button>
        </div>

        {/* Summary + Xem tất cả */}
        <div className="flex items-center justify-between text-xs text-gray-400">
          <span>
            Hiển thị <strong className="text-gray-700">{filtered.length}</strong> / {registrations.length} hoạt động
            {namHocFilter !== 'all' && (
              <span className="ml-1 text-indigo-600 font-medium">
                — {availableNamHoc.find((n) => n.value === namHocFilter)?.label}
                {hocKyFilter !== 'all' ? ` · ${HK_LABELS[hocKyFilter] || `HK${hocKyFilter}`}` : ''}
              </span>
            )}
          </span>
          {namHocFilter !== 'all' && (
            <button
              className="text-indigo-500 hover:text-indigo-700 underline"
              onClick={() => { setNamHocFilter('all'); setHocKyFilter('all'); }}
            >
              Xem tất cả
            </button>
          )}
        </div>
      </div>

      {/* List */}
      {isLoading ? (
        <Loading />
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm py-16 text-center">
          <Calendar className="w-12 h-12 text-gray-200 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">Không có hoạt động nào</p>
          <p className="text-sm text-gray-400 mt-1">
            {namHocFilter !== 'all'
              ? 'Thử nhấn "Xem tất cả" để xem các học kỳ khác'
              : 'Hãy đăng ký tham gia các hoạt động mới!'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((reg) => {
            const statusKey = getRegStatus(reg);
            const status = STATUS_CONFIG[statusKey];
            const Icon = status.icon;

            return (
              <div
                key={`${reg.maSv}-${reg.maHoatDong}`}
                className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 hover:border-gray-200 transition-colors"
              >
                <div className="flex items-start justify-between gap-4">
                  {/* Left: Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start gap-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${reg.daDiemDanh ? 'bg-green-100' : 'bg-amber-100'}`}>
                        <Icon className={`w-5 h-5 ${reg.daDiemDanh ? 'text-green-500' : 'text-amber-500'}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-gray-900 text-sm leading-tight">
                          {reg.tenHoatDong}
                        </h4>
                        <p className="text-xs text-gray-400 mt-0.5">{reg.maHoatDong}</p>

                        {/* Học kỳ + năm học badge */}
                        {(reg.soHocKy || reg.maNamHoc) && (
                          <span className="inline-flex items-center gap-1 mt-1 text-xs bg-indigo-50 text-indigo-600 border border-indigo-100 px-2 py-0.5 rounded-full">
                            <BookOpen className="w-3 h-3" />
                            {reg.soHocKy ? (HK_LABELS[reg.soHocKy] || `HK${reg.soHocKy}`) : ''}
                            {reg.tenNamHoc ? ` · ${reg.tenNamHoc}` : reg.maNamHoc ? ` · ${reg.maNamHoc}` : ''}
                          </span>
                        )}

                        <div className="flex flex-wrap gap-3 mt-2 text-xs text-gray-500">
                          {reg.ngayToChuc && (
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3.5 h-3.5" />
                              {formatDate(reg.ngayToChuc)}
                            </span>
                          )}
                          {reg.thoiGianDiemDanh && (
                            <span className="flex items-center gap-1 text-green-600">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              Check-in: {new Date(reg.thoiGianDiemDanh).toLocaleString('vi-VN')}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right: Status + Actions */}
                  <div className="flex flex-col items-end gap-2 flex-shrink-0">
                    <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border ${status.className}`}>
                      <Icon className={`w-3.5 h-3.5 ${status.iconColor}`} />
                      {status.label}
                    </span>

                    <div className="flex items-center gap-2">
                      {/* QR Code button — chỉ active đúng ngày sự kiện */}
                      {reg.maQR && (() => {
                        const today = new Date();
                        const actDate = reg.ngayToChuc ? new Date(reg.ngayToChuc) : null;
                        const isEventDay = actDate &&
                          today.getFullYear() === actDate.getFullYear() &&
                          today.getMonth() === actDate.getMonth() &&
                          today.getDate() === actDate.getDate();
                        const isFuture = actDate && today < actDate;
                        const qrDisabled = !isEventDay;
                        const qrTitle = isFuture
                          ? `QR mở vào ngày ${formatDate(reg.ngayToChuc)}`
                          : isEventDay ? 'Xem QR điểm danh' : 'Sự kiện đã kết thúc';
                        return (
                          <button
                            onClick={() => !qrDisabled && handleShowQR(reg)}
                            disabled={qrDisabled}
                            className={`flex items-center gap-1.5 text-xs px-3 py-1.5 border rounded-lg transition-colors ${
                              qrDisabled
                                ? 'bg-gray-50 text-gray-400 border-gray-200 cursor-not-allowed'
                                : 'bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100'
                            }`}
                            title={qrTitle}
                          >
                            <QrCode className="w-3.5 h-3.5" />
                            QR Code
                          </button>
                        );
                      })()}

                      {/* Cancel button */}
                      {!reg.daDiemDanh && (
                        <button
                          onClick={() => handleCancel(reg)}
                          disabled={cancelMutation.isPending}
                          className="flex items-center gap-1.5 text-xs px-3 py-1.5 bg-red-50 text-red-600 border border-red-200 rounded-lg hover:bg-red-100 transition-colors disabled:opacity-50"
                          title="Hủy đăng ký"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          Hủy
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* QR Code Modal */}
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

            <div className="flex justify-center p-4 bg-white border-2 border-gray-100 rounded-xl inline-block mx-auto">
              <QRCode value={selectedReg.maQR} size={200} level="M" />
            </div>

            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs text-gray-500 mb-1">Mã QR:</p>
              <p className="font-mono text-sm font-medium text-gray-800 break-all">{selectedReg.maQR}</p>
            </div>

            {selectedReg.daDiemDanh ? (
              <div className="flex items-center justify-center gap-2 text-sm text-green-600 bg-green-50 border border-green-200 rounded-lg p-3">
                <CheckCircle2 className="w-4 h-4" />
                <span>Bạn đã check-in thành công hoạt động này</span>
              </div>
            ) : (
              <div className="bg-blue-50 border border-blue-100 rounded-lg p-3">
                <p className="text-xs text-blue-600">
                  Trình mã QR này cho BCH để được điểm danh tham gia hoạt động.
                </p>
              </div>
            )}

            <button
              onClick={() => setQrModalOpen(false)}
              className="w-full py-2.5 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
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
