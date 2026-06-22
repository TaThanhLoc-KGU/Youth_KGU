import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  TrendingUp,
  Award,
  CheckCircle2,
  BookOpen,
  Star,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
} from 'recharts';
import dangKyService from '../../services/dangKyService';
import activityService from '../../services/activityService';
import useAuthStore from '../../stores/authStore';
import { formatDate } from '../../utils/dateFormat';
import { DIEM_REN_LUYEN_CRITERIA } from '../../constants/renLuyenCriteria';

const CATEGORY_COLORS = {
  I: '#6366f1',
  II: '#22c55e',
  III: '#f59e0b',
  IV: '#3b82f6',
  V: '#ec4899',
  VI: '#14b8a6',
};

const XEPLOAI_CONFIG = [
  { label: 'Xuất sắc', min: 90, max: 100, color: 'text-purple-600 bg-purple-50 border-purple-200', bar: '#9333ea' },
  { label: 'Giỏi',     min: 80, max: 89,  color: 'text-blue-600 bg-blue-50 border-blue-200',       bar: '#2563eb' },
  { label: 'Khá',      min: 65, max: 79,  color: 'text-green-600 bg-green-50 border-green-200',     bar: '#16a34a' },
  { label: 'Trung bình',min: 50, max: 64, color: 'text-amber-600 bg-amber-50 border-amber-200',     bar: '#d97706' },
  { label: 'Yếu',      min: 35, max: 49,  color: 'text-orange-600 bg-orange-50 border-orange-200', bar: '#ea580c' },
  { label: 'Kém',      min: 0,  max: 34,  color: 'text-red-600 bg-red-50 border-red-200',           bar: '#dc2626' },
];

const getXepLoai = (diem) =>
  XEPLOAI_CONFIG.find((c) => diem >= c.min && diem <= c.max) || XEPLOAI_CONFIG[5];

/* ── Skeleton ────────────────────────────────────────────────────── */
const SkeletonBox = ({ className }) => (
  <div className={`animate-pulse bg-gray-200 rounded-2xl ${className}`} />
);

const TrainingPoints = () => {
  const { user } = useAuthStore();
  // maSv: ưu tiên linkedEntityId, fallback sang username (vì username = maSv với tài khoản sinh viên)
  const maSv = user?.linkedEntityId || (user?.vaiTro === 'DOAN_VIEN' ? user?.username : null);

  // Student's registrations (contains daDiemDanh info)
  const { data: registrations = [], isLoading: loadingRegs } = useQuery({
    queryKey: ['student-registrations', maSv],
    queryFn: () => dangKyService.getByStudent(maSv),
    enabled: !!maSv,
  });

  // All activities (for diemRenLuyen lookup)
  const { data: activitiesPage, isLoading: loadingActivities } = useQuery({
    queryKey: ['all-activities-map'],
    queryFn: () => activityService.getAllWithPagination({ page: 0, size: 500 }),
    staleTime: 10 * 60 * 1000,
  });

  const isLoading = loadingRegs || loadingActivities;

  // Build activity lookup map
  const activityMap = useMemo(() => {
    const map = {};
    (activitiesPage?.content || []).forEach((a) => {
      map[a.maHoatDong] = a;
    });
    return map;
  }, [activitiesPage]);

  // Attended registrations with activity details
  const attendedWithDetails = useMemo(() => {
    return registrations
      .filter((r) => r.daDiemDanh === true)
      .map((r) => ({
        ...r,
        activityDetails: activityMap[r.maHoatDong] || null,
      }))
      .filter((r) => r.activityDetails != null);
  }, [registrations, activityMap]);

  // Total training points
  const totalPoints = useMemo(() => {
    return attendedWithDetails.reduce(
      (sum, r) => sum + (r.activityDetails?.diemRenLuyen || 0),
      0
    );
  }, [attendedWithDetails]);

  // Points by category
  const pointsByCategory = useMemo(() => {
    const cats = {};
    attendedWithDetails.forEach((r) => {
      const cat = r.activityDetails?.maDanhMucRenLuyen;
      const pts = r.activityDetails?.diemRenLuyen || 0;
      if (cat) {
        cats[cat] = (cats[cat] || 0) + pts;
      }
    });
    return cats;
  }, [attendedWithDetails]);

  // Chart data (by category)
  const chartData = useMemo(() => {
    return DIEM_REN_LUYEN_CRITERIA.map((dm) => ({
      name: `M.${dm.id}`,
      key: dm.id,
      value: pointsByCategory[dm.id] || 0,
      max: dm.tongDiemToiDa,
      label: dm.danhMuc,
    }));
  }, [pointsByCategory]);

  const xepLoai = getXepLoai(Math.min(totalPoints, 100));
  const progressPct = Math.min(100, totalPoints);

  /* ── Loading skeleton ────────────────────────────────────────────── */
  if (isLoading) {
    return (
      <div className="space-y-4 py-4 px-4">
        <SkeletonBox className="h-32" />
        <div className="grid grid-cols-2 gap-3">
          <SkeletonBox className="h-24" />
          <SkeletonBox className="h-24" />
        </div>
        <SkeletonBox className="h-56" />
        <SkeletonBox className="h-48" />
      </div>
    );
  }

  return (
    <div className="space-y-4 py-4">
      {/* ── Score hero card ──────────────────────────────────────────── */}
      <div className="px-4">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center gap-4">
            {/* Radial-style score circle */}
            <div className="relative w-20 h-20 flex-shrink-0">
              <svg viewBox="0 0 80 80" className="w-20 h-20 -rotate-90">
                <circle cx="40" cy="40" r="32" fill="none" stroke="#f3f4f6" strokeWidth="8" />
                <circle
                  cx="40" cy="40" r="32" fill="none"
                  stroke={xepLoai.bar}
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray={`${2 * Math.PI * 32}`}
                  strokeDashoffset={`${2 * Math.PI * 32 * (1 - progressPct / 100)}`}
                  className="transition-all duration-700"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-2xl font-bold text-gray-900">{totalPoints}</span>
              </div>
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-xs text-gray-500 mb-1">Tổng điểm rèn luyện</p>
              <p className="text-xs text-gray-400 mb-2">/ 100 điểm tối đa</p>
              <span className={`inline-block text-sm font-bold px-3 py-1 rounded-xl border ${xepLoai.color}`}>
                {xepLoai.label}
              </span>
              <p className="text-xs text-gray-400 mt-1">{xepLoai.min}–{xepLoai.max} điểm</p>
            </div>
          </div>

          {/* Progress bar */}
          <div className="mt-4 bg-gray-100 rounded-full h-2 overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{ width: `${progressPct}%`, backgroundColor: xepLoai.bar }}
            />
          </div>
        </div>
      </div>

      {/* ── Stats row ────────────────────────────────────────────────── */}
      <div className="px-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-green-50 border border-green-100 rounded-2xl p-4 flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-green-700 leading-none">{attendedWithDetails.length}</p>
              <p className="text-xs text-gray-500 mt-0.5">Hoạt động tham gia</p>
            </div>
          </div>
          <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <Star className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-amber-700 leading-none">{xepLoai.label}</p>
              <p className="text-xs text-gray-500 mt-0.5">Xếp loại rèn luyện</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Category progress cards — 2 columns ─────────────────────── */}
      <div className="px-4">
        <h2 className="font-semibold text-gray-900 text-sm mb-3 flex items-center gap-2">
          <Award className="w-4 h-4 text-indigo-500" /> Chi tiết từng danh mục
        </h2>
        <div className="grid grid-cols-2 gap-3">
          {DIEM_REN_LUYEN_CRITERIA.map((dm) => {
            const pts = pointsByCategory[dm.id] || 0;
            const pct = Math.min(100, (pts / dm.tongDiemToiDa) * 100);
            const color = CATEGORY_COLORS[dm.id] || '#6366f1';
            return (
              <div key={dm.id} className="bg-white rounded-2xl border border-gray-100 p-3 shadow-sm">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-gray-700">Mục {dm.id}</span>
                  <span className="text-xs font-semibold" style={{ color }}>
                    {pts}/{dm.tongDiemToiDa}
                  </span>
                </div>
                <p className="text-[10px] text-gray-400 mb-2 line-clamp-1">{dm.danhMuc}</p>
                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${pct}%`, backgroundColor: color }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Bar chart ────────────────────────────────────────────────── */}
      {!chartData.every((d) => d.value === 0) && (
        <div className="px-4">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
            <h2 className="font-semibold text-gray-900 text-sm mb-3 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-indigo-500" /> Điểm theo danh mục rèn luyện
            </h2>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={chartData} margin={{ top: 5, right: 10, left: -15, bottom: 5 }}>
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip
                  formatter={(value, name, props) => [
                    `${value}/${props.payload.max} điểm`,
                    props.payload.label,
                  ]}
                  contentStyle={{ fontSize: 12, borderRadius: 8 }}
                />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {chartData.map((entry) => (
                    <Cell key={entry.key} fill={CATEGORY_COLORS[entry.key] || '#6366f1'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* ── Activity history list ────────────────────────────────────── */}
      {attendedWithDetails.length > 0 && (
        <div className="px-4">
          <h2 className="font-semibold text-gray-900 text-sm mb-3 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-indigo-500" />
            Chi tiết hoạt động đã tham gia ({attendedWithDetails.length})
          </h2>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            {attendedWithDetails.map((r, idx) => {
              const a = r.activityDetails;
              const catColor = CATEGORY_COLORS[a.maDanhMucRenLuyen] || '#6366f1';
              return (
                <div
                  key={`${r.maSv}-${r.maHoatDong}`}
                  className={`flex items-center gap-3 px-4 py-3 ${
                    idx < attendedWithDetails.length - 1 ? 'border-b border-gray-50' : ''
                  }`}
                >
                  {/* Category dot */}
                  <div
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ backgroundColor: catColor }}
                  />
                  {/* Activity name */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{a.tenHoatDong}</p>
                    <p className="text-xs text-gray-400 hidden sm:block">{formatDate(a.ngayToChuc)}</p>
                  </div>
                  {/* Points */}
                  {a.diemRenLuyen != null ? (
                    <span className="flex-shrink-0 text-sm font-bold" style={{ color: catColor }}>
                      +{a.diemRenLuyen}đ
                    </span>
                  ) : (
                    <span className="flex-shrink-0 text-xs text-gray-400">–</span>
                  )}
                </div>
              );
            })}
            {/* Footer total */}
            <div className="flex items-center justify-between px-4 py-3 bg-indigo-50 border-t border-indigo-100">
              <span className="text-sm font-semibold text-gray-700">Tổng điểm rèn luyện</span>
              <span className="text-base font-bold text-indigo-700">{totalPoints}đ</span>
            </div>
          </div>
        </div>
      )}

      {/* Empty state */}
      {attendedWithDetails.length === 0 && (
        <div className="px-4">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm py-16 text-center">
            <TrendingUp className="w-12 h-12 text-gray-200 mx-auto mb-3" />
            <p className="text-gray-500">Chưa có điểm rèn luyện</p>
            <p className="text-sm text-gray-400 mt-1">
              Tham gia các hoạt động để tích lũy điểm rèn luyện
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default TrainingPoints;
