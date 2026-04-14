import { useState, useMemo, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { Calendar, MapPin, Users, Search, BookOpen, Clock } from 'lucide-react';
import activityService from '../../services/activityService';
import Button from '../../components/common/Button';
import SearchInput from '../../components/common/SearchInput';
import Select from '../../components/common/Select';
import Badge from '../../components/common/Badge';
import Modal from '../../components/common/Modal';
import ActivityRegistrationModal from '../../components/student/ActivityRegistrationModal';
import Loading from '../../components/common/Loading';
import { formatDate } from '../../utils/dateFormat';
import { ACTIVITY_TYPE_LABELS, ACTIVITY_LEVEL_LABELS } from '../../utils/constants';

// ─── Status mapping (khớp với TrangThaiHoatDongEnum trong backend) ─────────
const STATUS_OPTIONS = [
  { value: 'all',              label: 'Tất cả trạng thái' },
  { value: 'DANG_MO_DANG_KY', label: 'Đang mở đăng ký' },
  { value: 'SAP_DIEN_RA',     label: 'Sắp diễn ra' },
  { value: 'DANG_DIEN_RA',    label: 'Đang diễn ra' },
  { value: 'DA_KET_THUC',     label: 'Đã kết thúc' },
];

const STATUS_UI = {
  DANG_MO_DANG_KY: { label: 'Mở đăng ký',    variant: 'success', canRegister: true  },
  SAP_DIEN_RA:     { label: 'Sắp diễn ra',    variant: 'info',    canRegister: false },
  DANG_DIEN_RA:    { label: 'Đang diễn ra',   variant: 'warning', canRegister: false },
  DA_KET_THUC:     { label: 'Đã kết thúc',    variant: 'gray',    canRegister: false },
  DA_HOAN_THANH:   { label: 'Đã hoàn thành',  variant: 'gray',    canRegister: false },
  DA_HUY:          { label: 'Đã hủy',         variant: 'danger',  canRegister: false },
};

const HK_LABELS = { 1: 'Học kỳ 1', 2: 'Học kỳ 2', 3: 'Học kỳ hè' };

const StudentActivities = () => {
  const [search, setSearch]           = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter]   = useState('all');
  const [namHocFilter, setNamHocFilter] = useState('all');
  const [hocKyFilter, setHocKyFilter] = useState('all'); // 'all' | '1' | '2' | '3'
  const [hasSetDefault, setHasSetDefault] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState(null);
  const [isRegistrationModalOpen, setIsRegistrationModalOpen] = useState(false);

  // ── Lấy thông tin học kỳ / năm học hiện tại ───────────────────────────
  const { data: academicInfo } = useQuery({
    queryKey: ['academic-info'],
    queryFn: () => activityService.getCurrentAcademicInfo(),
    staleTime: 60 * 60 * 1000, // cache 1h
  });

  // ── Lấy danh sách tất cả hoạt động ────────────────────────────────────
  const { data: activities = [], isLoading } = useQuery({
    queryKey: ['student-activities'],
    queryFn: () => activityService.getAllNoPagination(),
    staleTime: 2 * 60 * 1000, // cache 2 phút
  });

  // Set mặc định khi data load xong (chỉ 1 lần):
  // Ưu tiên học kỳ hiện tại nếu có hoạt động, fallback sang kỳ mới nhất có dữ liệu
  useEffect(() => {
    if (hasSetDefault || activities.length === 0) return;
    setHasSetDefault(true);

    // Tập hợp tất cả năm học có trong danh sách (sắp xếp mới nhất trước)
    const allYears = [...new Set(activities.map((a) => a.maNamHoc).filter(Boolean))].sort(
      (a, b) => b.localeCompare(a),
    );
    if (!allYears.length) return; // không có maNamHoc → giữ 'all'

    // Ưu tiên năm học hiện tại (từ academicInfo), nếu không có thì lấy mới nhất
    const currentYear = academicInfo?.maNamHoc;
    const targetYear = currentYear && allYears.includes(currentYear) ? currentYear : allYears[0];
    setNamHocFilter(targetYear);

    // Học kỳ trong năm đó (sắp xếp giảm dần)
    const hksInYear = [...new Set(
      activities.filter((a) => a.maNamHoc === targetYear && a.soHocKy).map((a) => a.soHocKy),
    )].sort((a, b) => b - a);
    if (!hksInYear.length) return;

    // Ưu tiên học kỳ hiện tại nếu có trong năm đó, không thì lấy cao nhất
    const currentHK = academicInfo?.soHocKy ? String(academicInfo.soHocKy) : null;
    const targetHK =
      targetYear === currentYear && currentHK && hksInYear.map(String).includes(currentHK)
        ? currentHK
        : String(hksInYear[0]);
    setHocKyFilter(targetHK);
  }, [activities, academicInfo, hasSetDefault]);

  // ── Các năm học có trong danh sách hoạt động ─────────────────────────
  const availableNamHoc = useMemo(() => {
    const seen = new Set();
    const result = [];
    activities.forEach((a) => {
      if (a.maNamHoc && !seen.has(a.maNamHoc)) {
        seen.add(a.maNamHoc);
        result.push({ value: a.maNamHoc, label: a.tenNamHoc || a.maNamHoc });
      }
    });
    // Sắp xếp mới nhất lên đầu
    result.sort((a, b) => b.value.localeCompare(a.value));
    return [{ value: 'all', label: 'Tất cả năm học' }, ...result];
  }, [activities]);

  // ── Các học kỳ có trong danh sách (theo năm học đã chọn) ──────────────
  const availableHocKy = useMemo(() => {
    const seen = new Set();
    activities
      .filter((a) => namHocFilter === 'all' || !namHocFilter || a.maNamHoc === namHocFilter)
      .forEach((a) => { if (a.soHocKy) seen.add(a.soHocKy); });
    const list = [...seen].sort();
    return [
      { value: 'all', label: 'Tất cả học kỳ' },
      ...list.map((hk) => ({ value: String(hk), label: HK_LABELS[hk] || `Học kỳ ${hk}` })),
    ];
  }, [activities, namHocFilter]);

  // ── Lọc hoạt động ────────────────────────────────────────────────────
  const filteredActivities = useMemo(() => activities.filter((activity) => {
    if (search) {
      const q = search.toLowerCase();
      const matchSearch = activity.tenHoatDong?.toLowerCase().includes(q)
        || activity.maHoatDong?.toLowerCase().includes(q);
      if (!matchSearch) return false;
    }
    if (statusFilter !== 'all' && activity.trangThai !== statusFilter) return false;
    if (typeFilter !== 'all' && activity.loaiHoatDong !== typeFilter) return false;
    if (namHocFilter && namHocFilter !== 'all' && activity.maNamHoc !== namHocFilter) return false;
    if (hocKyFilter !== 'all' && String(activity.soHocKy) !== hocKyFilter) return false;
    return true;
  }), [activities, search, statusFilter, typeFilter, namHocFilter, hocKyFilter]);

  const handleRegisterClick = (activity) => {
    setSelectedActivity(activity);
    setIsRegistrationModalOpen(true);
  };

  const handleRegistrationSuccess = () => {
    setIsRegistrationModalOpen(false);
    setSelectedActivity(null);
    toast.success('Đăng ký hoạt động thành công!');
  };

  const getActivityStatus = (activity) => {
    const status = STATUS_UI[activity.trangThai];
    if (!status) return { label: activity.trangThai || 'Không xác định', variant: 'gray', canRegister: false };
    const isFull = activity.soLuongToiDa > 0 && (activity.soNguoiDangKy || 0) >= activity.soLuongToiDa;
    return { ...status, canRegister: status.canRegister && !isFull };
  };

  const isActivityFull = (activity) =>
    activity.soLuongToiDa > 0 && (activity.soNguoiDangKy || 0) >= activity.soLuongToiDa;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Các hoạt động</h1>
        <p className="text-gray-600 mt-1">
          Xem và đăng ký tham gia hoạt động Đoàn - Hội sinh viên
        </p>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="card-body space-y-3">
          {/* Row 1: Năm học + Học kỳ */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">
                <BookOpen className="w-3.5 h-3.5 inline mr-1" />Năm học
              </label>
              <Select
                options={availableNamHoc}
                value={namHocFilter || 'all'}
                onChange={(e) => {
                  setNamHocFilter(e.target.value);
                  setHocKyFilter('all'); // reset HK khi đổi năm học
                }}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">
                <Clock className="w-3.5 h-3.5 inline mr-1" />Học kỳ
              </label>
              <Select
                options={availableHocKy}
                value={hocKyFilter}
                onChange={(e) => setHocKyFilter(e.target.value)}
              />
            </div>
          </div>

          {/* Row 2: Search + Status + Type */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <SearchInput
              placeholder="Tìm kiếm hoạt động..."
              value={search}
              onSearch={setSearch}
              className="sm:col-span-2"
            />
            <Select
              options={STATUS_OPTIONS}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            />
            <Select
              options={[
                { value: 'all',                 label: 'Tất cả loại' },
                { value: 'HOI_THAO',            label: 'Hội thảo' },
                { value: 'CHUYEN_DE',           label: 'Chuyên đề' },
                { value: 'TINH_NGUYEN',         label: 'Tình nguyện' },
                { value: 'VAN_HOA_NGHE_THUAT',  label: 'Văn hóa - Nghệ thuật' },
                { value: 'THE_THAO',            label: 'Thể thao' },
              ]}
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
            />
          </div>

          {/* Summary */}
          <div className="flex items-center justify-between text-xs text-gray-400">
            <span>
              Hiển thị <strong className="text-gray-700">{filteredActivities.length}</strong> / {activities.length} hoạt động
              {namHocFilter && namHocFilter !== 'all' && (
                <span className="ml-1">
                  — <span className="text-blue-600 font-medium">
                    {availableNamHoc.find(n => n.value === namHocFilter)?.label}
                    {hocKyFilter !== 'all' ? ` · ${HK_LABELS[hocKyFilter] || `HK${hocKyFilter}`}` : ''}
                  </span>
                </span>
              )}
            </span>
            {/* Nút xem tất cả */}
            {(namHocFilter && namHocFilter !== 'all') && (
              <button
                className="text-blue-500 hover:text-blue-700 underline text-xs"
                onClick={() => { setNamHocFilter('all'); setHocKyFilter('all'); }}
              >
                Xem tất cả
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Activities Grid */}
      {isLoading ? (
        <Loading />
      ) : filteredActivities.length === 0 ? (
        <div className="text-center py-16">
          <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 text-lg font-medium">Không có hoạt động nào</p>
          <p className="text-gray-400 text-sm mt-1">
            {namHocFilter && namHocFilter !== 'all'
              ? 'Thử chọn "Xem tất cả" để xem các học kỳ khác'
              : 'Thử thay đổi bộ lọc để xem thêm'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredActivities.map((activity) => {
            const status = getActivityStatus(activity);
            const isFull = isActivityFull(activity);

            return (
              <div
                key={activity.maHoatDong}
                className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow overflow-hidden"
              >
                {/* Image Placeholder */}
                <div className="h-36 bg-gradient-to-r from-primary-100 to-primary-50 flex items-center justify-center relative">
                  <Calendar className="w-14 h-14 text-primary-300" />
                  {/* Học kỳ badge */}
                  {activity.soHocKy && (
                    <span className="absolute top-2 left-2 bg-white/80 text-gray-600 text-xs font-semibold px-2 py-0.5 rounded-full border">
                      {HK_LABELS[activity.soHocKy] || `HK${activity.soHocKy}`}
                      {activity.tenNamHoc ? ` · ${activity.tenNamHoc}` : ''}
                    </span>
                  )}
                </div>

                {/* Content */}
                <div className="p-4 space-y-3">
                  {/* Header */}
                  <div>
                    <h3 className="font-bold text-base text-gray-900 line-clamp-2">
                      {activity.tenHoatDong}
                    </h3>
                    <p className="text-xs text-gray-400 mt-0.5">{activity.maHoatDong}</p>
                  </div>

                  {/* Badges */}
                  <div className="flex flex-wrap gap-1.5">
                    <Badge variant={status.variant} size="sm">
                      {status.label}
                    </Badge>
                    {activity.loaiHoatDong && (
                      <Badge variant="info" size="sm" dot>
                        {ACTIVITY_TYPE_LABELS?.[activity.loaiHoatDong] || activity.loaiHoatDong}
                      </Badge>
                    )}
                    {activity.capDo && (
                      <Badge variant="warning" size="sm" dot>
                        {ACTIVITY_LEVEL_LABELS?.[activity.capDo] || activity.capDo}
                      </Badge>
                    )}
                  </div>

                  {/* Info */}
                  <div className="space-y-1.5 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 flex-shrink-0" />
                      <span>{formatDate(activity.ngayToChuc)}</span>
                      {activity.gioToChuc && (
                        <span className="text-gray-400 text-xs">{activity.gioToChuc}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 flex-shrink-0" />
                      <span className="line-clamp-1">{activity.diaDiem || 'Chưa xác định'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 flex-shrink-0" />
                      <span>
                        {activity.soNguoiDangKy || 0}
                        {activity.soLuongToiDa > 0 ? ` / ${activity.soLuongToiDa} chỗ` : ' người đăng ký'}
                      </span>
                      {isFull && (
                        <span className="text-xs text-red-600 font-semibold">Hết chỗ</span>
                      )}
                    </div>
                    {activity.diemRenLuyen > 0 && (
                      <div className="flex items-center gap-2">
                        <span className="text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded-full border border-green-100 font-medium">
                          +{activity.diemRenLuyen} điểm rèn luyện
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Description */}
                  {activity.moTa && (
                    <p className="text-sm text-gray-500 line-clamp-2">{activity.moTa}</p>
                  )}

                  {/* Actions */}
                  <div className="pt-1">
                    <Button
                      variant={status.canRegister ? 'primary' : 'outline'}
                      size="sm"
                      fullWidth
                      onClick={() => handleRegisterClick(activity)}
                      disabled={!status.canRegister}
                    >
                      {status.canRegister
                        ? 'Đăng ký tham gia'
                        : isFull
                          ? 'Hết chỗ'
                          : status.label === 'Đang diễn ra'
                            ? 'Đang diễn ra'
                            : 'Không thể đăng ký'}
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Registration Modal */}
      <Modal
        isOpen={isRegistrationModalOpen}
        onClose={() => setIsRegistrationModalOpen(false)}
        title="Đăng ký hoạt động"
        size="md"
      >
        <ActivityRegistrationModal
          activity={selectedActivity}
          onSuccess={handleRegistrationSuccess}
          onCancel={() => setIsRegistrationModalOpen(false)}
        />
      </Modal>
    </div>
  );
};

export default StudentActivities;
