import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
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
  SlidersHorizontal,
  X,
  Loader2,
} from 'lucide-react';
import activityService from '../../services/activityService';
import dangKyService from '../../services/dangKyService';
import useAuthStore from '../../stores/authStore';
import { formatDate } from '../../utils/dateFormat';
import {
  TRANG_THAI_OPTIONS,
  LOAI_HOAT_DONG_OPTIONS,
  getLoaiHoatDongLabel,
  getTrangThaiLabel,
} from '../../constants/activityConstants';

/* ── Skeleton helpers ────────────────────────────────────────────── */
const SkeletonCard = () => (
  <div className="bg-white rounded-2xl border border-gray-100 p-4 mb-3 animate-pulse">
    <div className="flex gap-2 mb-2">
      <div className="h-5 w-20 bg-gray-200 rounded-full" />
      <div className="h-5 w-16 bg-gray-200 rounded-full ml-auto" />
    </div>
    <div className="h-4 bg-gray-200 rounded w-3/4 mb-1" />
    <div className="h-4 bg-gray-200 rounded w-1/2 mb-3" />
    <div className="h-3 bg-gray-100 rounded w-full mb-1" />
    <div className="h-3 bg-gray-100 rounded w-2/3" />
  </div>
);

/* ── Single activity card (student view) ────────────────────────── */
const StudentActivityCard = ({
  activity,
  registeredSet,
  registeringId,
  isFull,
  canRegister,
  onRegister,
}) => {
  const full = isFull(activity);
  const alreadyRegistered = registeredSet.has(activity.maHoatDong);
  const canReg = canRegister(activity);

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-3">
      {/* Top row: type badge + status badge */}
      <div className="flex items-center justify-between gap-2 mb-1">
        <span className="text-[10px] font-semibold bg-primary/10 text-primary px-2.5 py-1 rounded-full">
          {getLoaiHoatDongLabel(activity.loaiHoatDong)}
        </span>
        <span className={`text-[10px] font-semibold px-2.5 py-1 rounded-full border ${
          activity.trangThai === 'DANG_MO_DANG_KY'
            ? 'bg-green-50 text-green-700 border-green-200'
            : activity.trangThai === 'SAP_DIEN_RA'
            ? 'bg-blue-50 text-blue-700 border-blue-200'
            : 'bg-gray-100 text-gray-500 border-gray-200'
        }`}>
          {getTrangThaiLabel(activity.trangThai)}
        </span>
      </div>

      {/* Title */}
      <h3 className="font-semibold text-gray-900 mt-1 line-clamp-2 text-sm leading-snug">
        {activity.tenHoatDong}
      </h3>
      <p className="text-xs text-gray-400 mt-0.5">{activity.maHoatDong}</p>

      {/* Info row */}
      <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs text-gray-500">
        <span className="flex items-center gap-1">
          <Calendar className="w-3.5 h-3.5 text-gray-400" />
          {formatDate(activity.ngayToChuc)}
        </span>
        {activity.diaDiem && (
          <span className="flex items-center gap-1 max-w-[180px]">
            <MapPin className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
            <span className="truncate">{activity.diaDiem}</span>
          </span>
        )}
      </div>

      {/* Footer row */}
      <div className="flex items-center justify-between gap-3 mt-3 pt-3 border-t border-gray-50">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="flex items-center gap-1 text-xs text-gray-500">
            <Users className="w-3.5 h-3.5" />
            {activity.soNguoiDangKy || 0}/{activity.soLuongToiDa > 0 ? activity.soLuongToiDa : '∞'}
          </span>
          {activity.diemRenLuyen != null && (
            <span className="flex items-center gap-1 text-xs font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">
              <TrendingUp className="w-3 h-3" />
              +{activity.diemRenLuyen}đ
            </span>
          )}
        </div>

        {/* Register button */}
        {alreadyRegistered ? (
          <span className="flex items-center gap-1 text-xs text-green-700 font-semibold">
            <CheckCircle2 className="w-4 h-4" /> Đã đăng ký
          </span>
        ) : full ? (
          <span className="text-xs bg-gray-100 text-gray-400 px-3 py-1.5 rounded-lg font-medium">
            Hết chỗ
          </span>
        ) : activity.trangThai === 'SAP_DIEN_RA' ? (
          <span className="flex items-center gap-1 text-xs bg-blue-50 text-blue-500 px-3 py-1.5 rounded-lg font-medium">
            <Clock className="w-3.5 h-3.5" /> Chưa mở
          </span>
        ) : activity.trangThai !== 'DANG_MO_DANG_KY' ? (
          <span className="text-xs bg-gray-100 text-gray-400 px-3 py-1.5 rounded-lg font-medium">
            Không thể đăng ký
          </span>
        ) : (
          <button
            onClick={() => onRegister(activity)}
            disabled={registeringId === activity.maHoatDong}
            className="flex items-center gap-1.5 bg-primary text-white text-xs px-3 py-1.5 rounded-lg font-semibold hover:bg-primary/90 disabled:opacity-70 transition-colors"
          >
            {registeringId === activity.maHoatDong
              ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Đăng ký...</>
              : 'Đăng ký ngay'}
          </button>
        )}
      </div>
    </div>
  );
};

const RegisterActivities = () => {
  const { user } = useAuthStore();
  // maSv: ưu tiên linkedEntityId, fallback sang username (vì username = maSv với tài khoản sinh viên)
  const maSv = user?.linkedEntityId || (user?.vaiTro === 'SINH_VIEN' ? user?.username : null);
  const queryClient = useQueryClient();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  // Tính toán HK/Năm học mặc định theo logic riêng của hệ thống
  const now = new Date();
  const month = now.getMonth() + 1;
  const day = now.getDate();
  const year = now.getFullYear();

  let defaultSemester;
  if (month >= 8 && month <= 11) {
    defaultSemester = 1;
  } else if (month === 12 || month === 1 || month === 2 || (month === 3 && day < 15)) {
    defaultSemester = 2;
  } else {
    defaultSemester = 3;
  }

  const startYear = month >= 8 ? year : year - 1;
  const defaultAcademicYear = `NH${startYear}-${startYear + 1}`;

  const [semesterFilter, setSemesterFilter] = useState('all');
  const [yearFilter, setYearFilter] = useState('all');
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);

  const navigate = useNavigate();
  const [registeringId, setRegisteringId] = useState(null);

  // Lấy thông tin năm học từ hệ thống
  const { data: academicInfo } = useQuery({
    queryKey: ['academic-info-register'],
    queryFn: () => activityService.getCurrentAcademicInfo(),
    staleTime: 30 * 60 * 1000,
  });

  // Fetch activities with pagination
  const { data: activitiesData, isLoading, refetch } = useQuery({
    queryKey: ['register-activities'],
    queryFn: () => activityService.getAllWithPagination({ page: 0, size: 200 }),
    keepPreviousData: true,
  });

  // Fetch student's registrations to check already-registered
  const { data: myRegistrations = [] } = useQuery({
    queryKey: ['student-registrations', maSv],
    queryFn: () => dangKyService.getByStudent(maSv),
    enabled: !!maSv,
  });

  const registeredSet = new Set(myRegistrations.map((r) => r.maHoatDong));

  // Filter + sort activities (mới nhất ở đầu)
  const activities = (activitiesData?.content || [])
    .filter((a) => {
      const matchSearch =
        !search ||
        a.tenHoatDong?.toLowerCase().includes(search.toLowerCase()) ||
        a.maHoatDong?.toLowerCase().includes(search.toLowerCase());
      const matchStatus = !statusFilter || a.trangThai === statusFilter;
      const matchType = !typeFilter || a.loaiHoatDong === typeFilter;
      const matchSemester = semesterFilter === 'all' || String(a.soHocKy) === semesterFilter;
      const matchYear = yearFilter === 'all' || a.maNamHoc === yearFilter;
      return matchSearch && matchStatus && matchType && matchSemester && matchYear;
    })
    .sort((a, b) => {
      // Sort theo ngày tạo mới nhất lên trước
      const da = a.createdAt ? new Date(a.createdAt) : new Date(0);
      const db = b.createdAt ? new Date(b.createdAt) : new Date(0);
      return db - da;
    });

  // Phân nhóm: Đoàn trường (maKhoa = null) vs Đoàn Khoa
  const doanTruong = activities.filter((a) => !a.maKhoa);
  const doanKhoa = activities.filter((a) => !!a.maKhoa);
  // Group Đoàn Khoa theo tenKhoa
  const doanKhoaGroups = doanKhoa.reduce((acc, a) => {
    const key = a.tenKhoa || a.maKhoa || 'Khoa khác';
    if (!acc[key]) acc[key] = [];
    acc[key].push(a);
    return acc;
  }, {});
  const hasSections = doanTruong.length > 0 || doanKhoa.length > 0;

  // Register mutation
  const registerMutation = useMutation({
    mutationFn: (maHoatDong) => dangKyService.register(maSv, maHoatDong),
    onSuccess: () => {
      toast.success('Đăng ký thành công! Xem QR tại tab "Của tôi".');
      queryClient.invalidateQueries(['student-registrations', maSv]);
      setRegisteringId(null);
      navigate('/student/my-activities');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Đăng ký thất bại. Vui lòng thử lại!');
      setRegisteringId(null);
    },
  });

  const handleRegisterClick = (activity) => {
    if (!maSv) {
      toast.error('Không tìm thấy mã sinh viên. Vui lòng đăng xuất và đăng nhập lại!');
      return;
    }
    setRegisteringId(activity.maHoatDong);
    registerMutation.mutate(activity.maHoatDong);
  };

  const isFull = (activity) =>
    activity.soLuongToiDa > 0 &&
    (activity.soNguoiDangKy || 0) >= activity.soLuongToiDa;

  const canRegister = (activity) =>
    activity.trangThai === 'DANG_MO_DANG_KY' &&
    !registeredSet.has(activity.maHoatDong) &&
    !isFull(activity);

  const activeFilterCount = [statusFilter, typeFilter, semesterFilter !== 'all' ? semesterFilter : '', yearFilter !== 'all' ? yearFilter : ''].filter(Boolean).length;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ── Sticky search bar ───────────────────────────────────────── */}
      <div className="sticky top-0 z-20 bg-gray-50 border-b border-gray-100 px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Tìm kiếm hoạt động..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-white rounded-xl pl-9 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:bg-white border border-gray-200 transition-colors"
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2">
                <X className="w-4 h-4 text-gray-400" />
              </button>
            )}
          </div>
          <button
            onClick={() => setFilterDrawerOpen(true)}
            className={`relative flex-shrink-0 p-3 rounded-xl border transition-colors ${
              activeFilterCount > 0
                ? 'bg-primary text-white border-primary'
                : 'bg-white text-gray-600 border-gray-200'
            }`}
          >
            <SlidersHorizontal className="w-5 h-5" />
            {activeFilterCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-[9px] font-bold text-white flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
          </button>
          <button
            onClick={() => refetch()}
            className="flex-shrink-0 p-3 bg-white rounded-xl border border-gray-200 text-gray-500 hover:bg-gray-50 transition-colors"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
        </div>

        {/* Result count */}
        <p className="text-xs text-gray-500 mt-2">
          <span className="font-semibold text-gray-700">{activities.length}</span> hoạt động
          {doanTruong.length > 0 && doanKhoa.length > 0 && (
            <span className="ml-1 text-gray-400">
              ({doanTruong.length} Đoàn trường · {doanKhoa.length} Đoàn Khoa)
            </span>
          )}
          {activeFilterCount > 0 && (
            <button
              onClick={() => { setStatusFilter(''); setTypeFilter(''); setSemesterFilter('all'); setYearFilter('all'); }}
              className="ml-2 text-primary underline"
            >
              Xóa bộ lọc
            </button>
          )}
        </p>
      </div>

      {/* ── Activity list ────────────────────────────────────────────── */}
      <div className="px-4 py-3">
        {isLoading ? (
          <>
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </>
        ) : activities.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 py-16 text-center mt-2">
            <Calendar className="w-12 h-12 text-gray-200 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">Không tìm thấy hoạt động nào</p>
            <p className="text-sm text-gray-400 mt-1">Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm</p>
          </div>
        ) : (
          <>
            {/* ── Section: Đoàn trường ── */}
            {doanTruong.length > 0 && (
              <div className="mb-5">
                <div className="flex items-center gap-2 mb-3">
                  <div className="flex-shrink-0 w-1 h-5 bg-blue-500 rounded-full" />
                  <h2 className="text-sm font-bold text-blue-700 uppercase tracking-wide">
                    Đoàn trường
                  </h2>
                  <span className="text-[10px] bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full font-semibold">
                    {doanTruong.length}
                  </span>
                </div>
                {doanTruong.map((activity) => (
                  <StudentActivityCard
                    key={activity.maHoatDong}
                    activity={activity}
                    registeredSet={registeredSet}
                    registeringId={registeringId}
                    isFull={isFull}
                    canRegister={canRegister}
                    onRegister={handleRegisterClick}
                  />
                ))}
              </div>
            )}

            {/* ── Section: Đoàn Khoa ── */}
            {Object.entries(doanKhoaGroups).map(([tenKhoa, list]) => (
              <div key={tenKhoa} className="mb-5">
                <div className="flex items-center gap-2 mb-3">
                  <div className="flex-shrink-0 w-1 h-5 bg-emerald-500 rounded-full" />
                  <h2 className="text-sm font-bold text-emerald-700 uppercase tracking-wide">
                    Đoàn {tenKhoa}
                  </h2>
                  <span className="text-[10px] bg-emerald-100 text-emerald-600 px-2 py-0.5 rounded-full font-semibold">
                    {list.length}
                  </span>
                </div>
                {list.map((activity) => (
                  <StudentActivityCard
                    key={activity.maHoatDong}
                    activity={activity}
                    registeredSet={registeredSet}
                    registeringId={registeringId}
                    isFull={isFull}
                    canRegister={canRegister}
                    onRegister={handleRegisterClick}
                  />
                ))}
              </div>
            ))}
          </>
        )}
      </div>

      {/* ── Filter bottom drawer ─────────────────────────────────────── */}
      {filterDrawerOpen && (
        <div className="fixed inset-0 z-50 bg-black/40" onClick={() => setFilterDrawerOpen(false)}>
          <div
            className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl shadow-2xl animate-slide-up"
            onClick={e => e.stopPropagation()}
          >
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 bg-gray-300 rounded-full" />
            </div>

            <div className="px-5 pb-8 pt-2">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900">Bộ lọc</h3>
                <button onClick={() => setFilterDrawerOpen(false)} className="p-1">
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5">Năm học</label>
                  <select
                    value={yearFilter}
                    onChange={(e) => setYearFilter(e.target.value)}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 bg-gray-50"
                  >
                    <option value="all">Tất cả năm học</option>
                    {academicInfo?.danhSachNamHoc?.map(nh => (
                      <option key={nh.maNamHoc} value={nh.maNamHoc}>{nh.tenNamHoc}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5">Học kỳ</label>
                  <select
                    value={semesterFilter}
                    onChange={(e) => setSemesterFilter(e.target.value)}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 bg-gray-50"
                  >
                    <option value="all">Tất cả học kỳ</option>
                    <option value="1">Học kỳ 1</option>
                    <option value="2">Học kỳ 2</option>
                    <option value="3">Học kỳ 3</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5">Loại hoạt động</label>
                  <select
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value)}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 bg-gray-50"
                  >
                    <option value="">Tất cả loại</option>
                    {LOAI_HOAT_DONG_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5">Trạng thái</label>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 bg-gray-50"
                  >
                    <option value="">Tất cả trạng thái</option>
                    {TRANG_THAI_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => { setStatusFilter(''); setTypeFilter(''); setSemesterFilter('all'); setYearFilter('all'); }}
                  className="flex-1 py-3 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Đặt lại
                </button>
                <button
                  onClick={() => setFilterDrawerOpen(false)}
                  className="flex-1 py-3 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-primary/90 transition-colors"
                >
                  Áp dụng
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default RegisterActivities;
