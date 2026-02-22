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
  RadialBarChart,
  RadialBar,
  ResponsiveContainer,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Cell,
} from 'recharts';
import dangKyService from '../../services/dangKyService';
import activityService from '../../services/activityService';
import useAuthStore from '../../stores/authStore';
import { formatDate } from '../../utils/dateFormat';
import Loading from '../../components/common/Loading';
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
  { label: 'Xuất sắc', min: 90, max: 100, color: 'text-purple-600 bg-purple-50 border-purple-200' },
  { label: 'Giỏi', min: 80, max: 89, color: 'text-blue-600 bg-blue-50 border-blue-200' },
  { label: 'Khá', min: 65, max: 79, color: 'text-green-600 bg-green-50 border-green-200' },
  { label: 'Trung bình', min: 50, max: 64, color: 'text-amber-600 bg-amber-50 border-amber-200' },
  { label: 'Yếu', min: 35, max: 49, color: 'text-orange-600 bg-orange-50 border-orange-200' },
  { label: 'Kém', min: 0, max: 34, color: 'text-red-600 bg-red-50 border-red-200' },
];

const getXepLoai = (diem) => {
  return XEPLOAI_CONFIG.find((c) => diem >= c.min && diem <= c.max) || XEPLOAI_CONFIG[5];
};

const TrainingPoints = () => {
  const { user } = useAuthStore();
  // maSv: ưu tiên linkedEntityId, fallback sang username (vì username = maSv với tài khoản sinh viên)
  const maSv = user?.linkedEntityId || (user?.vaiTro === 'SINH_VIEN' ? user?.username : null);

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
      name: `Mục ${dm.id}`,
      key: dm.id,
      value: pointsByCategory[dm.id] || 0,
      max: dm.tongDiemToiDa,
      label: dm.danhMuc,
    }));
  }, [pointsByCategory]);

  const xepLoai = getXepLoai(Math.min(totalPoints, 100));

  if (isLoading) return <Loading />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Điểm rèn luyện</h1>
        <p className="text-gray-500 mt-1">
          Tổng hợp điểm rèn luyện từ các hoạt động đã tham gia
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Total points */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 col-span-1">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-indigo-600" />
            </div>
            <p className="text-sm font-medium text-gray-500">Tổng điểm rèn luyện</p>
          </div>
          <p className="text-5xl font-bold text-indigo-600">{totalPoints}</p>
          <p className="text-xs text-gray-400 mt-1">/ 100 điểm (tối đa)</p>

          {/* Progress bar */}
          <div className="mt-4 bg-gray-100 rounded-full h-2.5 overflow-hidden">
            <div
              className="h-full rounded-full bg-indigo-500 transition-all"
              style={{ width: `${Math.min(100, totalPoints)}%` }}
            />
          </div>
        </div>

        {/* Classification */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
              <Star className="w-5 h-5 text-amber-600" />
            </div>
            <p className="text-sm font-medium text-gray-500">Xếp loại rèn luyện</p>
          </div>
          <span
            className={`inline-block text-xl font-bold px-4 py-2 rounded-xl border ${xepLoai.color}`}
          >
            {xepLoai.label}
          </span>
          <p className="text-xs text-gray-400 mt-3">
            {xepLoai.min}–{xepLoai.max} điểm
          </p>
        </div>

        {/* Attended count */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
            </div>
            <p className="text-sm font-medium text-gray-500">Hoạt động đã tham gia</p>
          </div>
          <p className="text-5xl font-bold text-green-600">{attendedWithDetails.length}</p>
          <p className="text-xs text-gray-400 mt-1">hoạt động có điểm rèn luyện</p>
        </div>
      </div>

      {/* Category breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bar chart */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-indigo-500" />
            Điểm theo danh mục
          </h3>
          {chartData.every((d) => d.value === 0) ? (
            <div className="text-center py-8 text-gray-400 text-sm">
              Chưa có điểm rèn luyện
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
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
                    <Cell
                      key={entry.key}
                      fill={CATEGORY_COLORS[entry.key] || '#6366f1'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Category table */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Award className="w-4 h-4 text-indigo-500" />
            Chi tiết từng danh mục
          </h3>
          <div className="space-y-3">
            {DIEM_REN_LUYEN_CRITERIA.map((dm) => {
              const pts = pointsByCategory[dm.id] || 0;
              const pct = Math.min(100, (pts / dm.tongDiemToiDa) * 100);
              return (
                <div key={dm.id}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium text-gray-700">
                      Mục {dm.id} – {dm.danhMuc}
                    </span>
                    <span
                      className="text-xs font-semibold"
                      style={{ color: CATEGORY_COLORS[dm.id] }}
                    >
                      {pts}/{dm.tongDiemToiDa}
                    </span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${pct}%`,
                        backgroundColor: CATEGORY_COLORS[dm.id] || '#6366f1',
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Attended activities table */}
      {attendedWithDetails.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h3 className="font-semibold text-gray-900">
              Chi tiết hoạt động đã tham gia ({attendedWithDetails.length})
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-xs text-gray-500 font-medium">
                  <th className="text-left px-5 py-3">Hoạt động</th>
                  <th className="text-left px-5 py-3">Ngày</th>
                  <th className="text-left px-5 py-3">Danh mục</th>
                  <th className="text-right px-5 py-3">Điểm RL</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {attendedWithDetails.map((r) => {
                  const a = r.activityDetails;
                  return (
                    <tr
                      key={`${r.maSv}-${r.maHoatDong}`}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-5 py-3">
                        <p className="font-medium text-gray-900 line-clamp-1">{a.tenHoatDong}</p>
                        <p className="text-xs text-gray-400">{a.maHoatDong}</p>
                      </td>
                      <td className="px-5 py-3 text-gray-500">
                        {formatDate(a.ngayToChuc)}
                      </td>
                      <td className="px-5 py-3">
                        {a.maTieuChiRenLuyen ? (
                          <span
                            className="text-xs px-2 py-0.5 rounded-full font-medium"
                            style={{
                              backgroundColor: `${CATEGORY_COLORS[a.maDanhMucRenLuyen]}20`,
                              color: CATEGORY_COLORS[a.maDanhMucRenLuyen] || '#6366f1',
                            }}
                          >
                            TC {a.maTieuChiRenLuyen}
                          </span>
                        ) : (
                          <span className="text-gray-400 text-xs">–</span>
                        )}
                      </td>
                      <td className="px-5 py-3 text-right">
                        {a.diemRenLuyen != null ? (
                          <span className="font-semibold text-indigo-600">+{a.diemRenLuyen}đ</span>
                        ) : (
                          <span className="text-gray-400">–</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="bg-indigo-50 font-semibold">
                  <td colSpan={3} className="px-5 py-3 text-sm text-gray-700">
                    Tổng điểm rèn luyện
                  </td>
                  <td className="px-5 py-3 text-right text-indigo-700 text-base">
                    {totalPoints}đ
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {attendedWithDetails.length === 0 && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm py-16 text-center">
          <TrendingUp className="w-12 h-12 text-gray-200 mx-auto mb-3" />
          <p className="text-gray-500">Chưa có điểm rèn luyện</p>
          <p className="text-sm text-gray-400 mt-1">
            Tham gia các hoạt động để tích lũy điểm rèn luyện
          </p>
        </div>
      )}
    </div>
  );
};

export default TrainingPoints;
