import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Calendar, MapPin, Users, Search, ChevronRight,
  CheckCircle, Clock, XCircle, RefreshCw, UserCheck,
} from 'lucide-react';
import activityService from '../../services/activityService';
import Modal from '../../components/common/Modal';
import Badge from '../../components/common/Badge';
import {
  getLoaiHoatDongLabel,
  getLoaiHoatDongColor,
  getTrangThaiLabel,
  getTrangThaiBadgeVariant,
} from '../../constants/activityConstants';
import { formatDate, formatDateTime } from '../../utils/dateFormat';

// ─── Badge điểm danh ─────────────────────────────────────────────────────────
const AttendanceBadge = ({ daDiemDanh }) => {
  if (daDiemDanh) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-50 text-green-700 border border-green-200">
        <CheckCircle className="w-3 h-3" /> Đã tham gia
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-gray-50 text-gray-500 border border-gray-200">
      <Clock className="w-3 h-3" /> Đã đăng ký
    </span>
  );
};

// ─── Item một hoạt động ───────────────────────────────────────────────────────
const ActivityListItem = ({ activity, onViewParticipants }) => {
  const typeColor = getLoaiHoatDongColor(activity.loaiHoatDong);

  return (
    <div
      className="bg-white rounded-xl border border-gray-200 hover:border-indigo-300 hover:shadow-md transition-all duration-200 cursor-pointer group"
      onClick={() => onViewParticipants(activity)}
    >
      <div className="p-4 sm:p-5">
        <div className="flex items-start justify-between gap-3">
          {/* Left — color indicator + info */}
          <div className="flex items-start gap-3 flex-1 min-w-0">
            {/* Màu loại hoạt động */}
            <div
              className="w-1 self-stretch rounded-full flex-shrink-0 mt-0.5"
              style={{ backgroundColor: typeColor, minHeight: '40px' }}
            />

            <div className="flex-1 min-w-0">
              {/* Tên */}
              <h3 className="font-semibold text-gray-900 text-sm sm:text-base leading-snug group-hover:text-indigo-700 transition-colors truncate">
                {activity.tenHoatDong}
              </h3>

              {/* Loại & Cấp độ */}
              <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                <span
                  className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium text-white"
                  style={{ backgroundColor: typeColor }}
                >
                  {getLoaiHoatDongLabel(activity.loaiHoatDong)}
                </span>
                {activity.capDo && (
                  <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                    {activity.capDo}
                  </span>
                )}
                <Badge variant={getTrangThaiBadgeVariant(activity.trangThai)}>
                  {getTrangThaiLabel(activity.trangThai)}
                </Badge>
              </div>

              {/* Meta: ngày & địa điểm */}
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-xs text-gray-500">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 flex-shrink-0" />
                  {formatDate(activity.ngayToChuc)}
                  {activity.thoiGianBatDau && (
                    <span className="text-gray-400">
                      {' '}· {activity.thoiGianBatDau?.slice(0, 5)}
                      {activity.thoiGianKetThuc && ` – ${activity.thoiGianKetThuc?.slice(0, 5)}`}
                    </span>
                  )}
                </span>
                {activity.diaDiem && (
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                    {activity.diaDiem}
                  </span>
                )}
                {activity.soLuongDangKy != null && (
                  <span className="flex items-center gap-1">
                    <Users className="w-3.5 h-3.5 flex-shrink-0" />
                    {activity.soLuongDangKy} người đăng ký
                  </span>
                )}
                {activity.diemRenLuyen != null && (
                  <span className="font-medium text-indigo-600">
                    +{activity.diemRenLuyen} điểm RL
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Right — arrow */}
          <div className="flex items-center gap-2 flex-shrink-0 self-center">
            <span className="text-xs text-indigo-600 font-medium hidden sm:inline opacity-0 group-hover:opacity-100 transition-opacity">
              Xem danh sách
            </span>
            <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-indigo-500 group-hover:translate-x-0.5 transition-all" />
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Main Page ────────────────────────────────────────────────────────────────
const HoatDongListPage = () => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedActivity, setSelectedActivity] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [participantSearch, setParticipantSearch] = useState('');

  // Fetch all activities
  const { data: activities = [], isLoading, refetch } = useQuery({
    queryKey: ['hoat-dong-public-list'],
    queryFn: activityService.getAll,
    staleTime: 2 * 60 * 1000,
  });

  // Fetch danh sách sinh viên đăng ký hoạt động được chọn
  const { data: registrations = [], isLoading: isLoadingParticipants } = useQuery({
    queryKey: ['registrations-by-activity', selectedActivity?.maHoatDong],
    queryFn: () => activityService.getRegistrationsByActivity(selectedActivity.maHoatDong),
    enabled: !!selectedActivity?.maHoatDong,
    staleTime: 60 * 1000,
  });

  // Lọc & sắp xếp mới nhất lên đầu
  const filteredActivities = useMemo(() => {
    return [...activities]
      .sort((a, b) => {
        const da = a.ngayToChuc ? new Date(a.ngayToChuc) : new Date(0);
        const db = b.ngayToChuc ? new Date(b.ngayToChuc) : new Date(0);
        return db - da;
      })
      .filter((act) => {
        const matchStatus = statusFilter === 'all' || act.trangThai === statusFilter;
        const matchSearch =
          !search ||
          act.tenHoatDong?.toLowerCase().includes(search.toLowerCase()) ||
          act.maHoatDong?.toLowerCase().includes(search.toLowerCase()) ||
          act.diaDiem?.toLowerCase().includes(search.toLowerCase());
        return matchStatus && matchSearch;
      });
  }, [activities, search, statusFilter]);

  // Lọc sinh viên trong modal
  const filteredParticipants = useMemo(() => {
    if (!participantSearch) return registrations;
    const kw = participantSearch.toLowerCase();
    return registrations.filter(
      (r) =>
        r.hoTenSinhVien?.toLowerCase().includes(kw) ||
        r.maSv?.toLowerCase().includes(kw) ||
        r.tenLop?.toLowerCase().includes(kw)
    );
  }, [registrations, participantSearch]);

  const attended = registrations.filter((r) => r.daDiemDanh);

  const handleOpenModal = (activity) => {
    setSelectedActivity(activity);
    setParticipantSearch('');
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedActivity(null);
    setParticipantSearch('');
  };

  // Stats
  const total = activities.length;
  const completed = activities.filter((a) =>
    ['DA_HOAN_THANH', 'DA_KET_THUC'].includes(a.trangThai)
  ).length;
  const ongoing = activities.filter((a) => a.trangThai === 'DANG_DIEN_RA').length;
  const upcoming = activities.filter((a) =>
    ['SAP_DIEN_RA', 'DANG_MO_DANG_KY'].includes(a.trangThai)
  ).length;

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Danh sách Hoạt động</h1>
          <p className="text-gray-500 text-sm mt-0.5">
            Toàn bộ hoạt động đã và đang diễn ra · Nhấn vào để xem danh sách sinh viên tham gia
          </p>
        </div>
        <button
          onClick={() => refetch()}
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-indigo-600 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Làm mới
        </button>
      </div>

      {/* ── Stats ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Tổng hoạt động', value: total, color: 'text-indigo-600', bg: 'bg-indigo-50', border: 'border-indigo-100' },
          { label: 'Đã hoàn thành', value: completed, color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-100' },
          { label: 'Đang diễn ra', value: ongoing, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-100' },
          { label: 'Sắp diễn ra', value: upcoming, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-100' },
        ].map((s) => (
          <div key={s.label} className={`rounded-xl border ${s.border} ${s.bg} p-4`}>
            <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
            <div className="text-xs text-gray-500 mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {/* ── Filters ── */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Tìm theo tên, mã, địa điểm..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400"
            />
          </div>

          {/* Status filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="sm:w-52 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white"
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="SAP_DIEN_RA">Sắp diễn ra</option>
            <option value="DANG_MO_DANG_KY">Đang mở đăng ký</option>
            <option value="DANG_DIEN_RA">Đang diễn ra</option>
            <option value="DA_HOAN_THANH">Đã hoàn thành</option>
            <option value="DA_KET_THUC">Đã kết thúc</option>
            <option value="DA_HUY">Đã hủy</option>
          </select>
        </div>

        {(search || statusFilter !== 'all') && (
          <div className="mt-2 text-xs text-gray-500">
            Tìm thấy <strong className="text-gray-700">{filteredActivities.length}</strong> hoạt động
          </div>
        )}
      </div>

      {/* ── List ── */}
      {isLoading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-200 p-5 animate-pulse">
              <div className="flex gap-3">
                <div className="w-1 rounded-full bg-gray-200 min-h-[50px]" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-2/3" />
                  <div className="h-3 bg-gray-100 rounded w-1/3" />
                  <div className="h-3 bg-gray-100 rounded w-1/2" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : filteredActivities.length === 0 ? (
        <div className="bg-white rounded-xl border border-dashed border-gray-300 p-12 text-center">
          <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">Không tìm thấy hoạt động nào</p>
          <p className="text-gray-400 text-sm mt-1">Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {filteredActivities.map((activity) => (
            <ActivityListItem
              key={activity.maHoatDong}
              activity={activity}
              onViewParticipants={handleOpenModal}
            />
          ))}
        </div>
      )}

      {/* ── Modal danh sách sinh viên ── */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title="Danh sách sinh viên tham gia"
        size="xl"
      >
        {selectedActivity && (
          <div className="space-y-4">
            {/* Info hoạt động */}
            <div className="bg-indigo-50 border border-indigo-100 rounded-lg p-4">
              <h3 className="font-semibold text-indigo-900 text-base leading-snug">
                {selectedActivity.tenHoatDong}
              </h3>
              <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-sm text-indigo-700">
                <span className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  {formatDate(selectedActivity.ngayToChuc)}
                </span>
                {selectedActivity.diaDiem && (
                  <span className="flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    {selectedActivity.diaDiem}
                  </span>
                )}
              </div>
            </div>

            {/* Summary chips */}
            {!isLoadingParticipants && (
              <div className="flex flex-wrap gap-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm bg-gray-100 text-gray-700">
                  <Users className="w-4 h-4" />
                  <strong>{registrations.length}</strong> đã đăng ký
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm bg-green-100 text-green-700">
                  <UserCheck className="w-4 h-4" />
                  <strong>{attended.length}</strong> đã tham gia
                </span>
                {registrations.length > 0 && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm bg-indigo-100 text-indigo-700">
                    Tỉ lệ tham gia:{' '}
                    <strong>{Math.round((attended.length / registrations.length) * 100)}%</strong>
                  </span>
                )}
              </div>
            )}

            {/* Tìm kiếm trong modal */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Tìm sinh viên theo tên, MSSV, lớp..."
                value={participantSearch}
                onChange={(e) => setParticipantSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-300"
              />
            </div>

            {/* Bảng sinh viên */}
            {isLoadingParticipants ? (
              <div className="space-y-2">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="h-10 bg-gray-100 rounded animate-pulse" />
                ))}
              </div>
            ) : filteredParticipants.length === 0 ? (
              <div className="text-center py-10 text-gray-400">
                <Users className="w-10 h-10 mx-auto mb-2 opacity-40" />
                <p className="text-sm">
                  {participantSearch ? 'Không tìm thấy sinh viên phù hợp' : 'Chưa có sinh viên đăng ký'}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-lg border border-gray-200">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      <th className="text-left px-4 py-3 font-medium text-gray-600 text-xs uppercase tracking-wider w-8">#</th>
                      <th className="text-left px-4 py-3 font-medium text-gray-600 text-xs uppercase tracking-wider">MSSV</th>
                      <th className="text-left px-4 py-3 font-medium text-gray-600 text-xs uppercase tracking-wider">Họ và tên</th>
                      <th className="text-left px-4 py-3 font-medium text-gray-600 text-xs uppercase tracking-wider hidden sm:table-cell">Lớp</th>
                      <th className="text-left px-4 py-3 font-medium text-gray-600 text-xs uppercase tracking-wider hidden md:table-cell">Ngày đăng ký</th>
                      <th className="text-left px-4 py-3 font-medium text-gray-600 text-xs uppercase tracking-wider">Trạng thái</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredParticipants.map((reg, idx) => (
                      <tr key={reg.maSv} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3 text-gray-400 text-xs">{idx + 1}</td>
                        <td className="px-4 py-3 font-mono font-medium text-gray-800 text-xs">{reg.maSv}</td>
                        <td className="px-4 py-3">
                          <span className="font-medium text-gray-900">{reg.hoTenSinhVien || '—'}</span>
                        </td>
                        <td className="px-4 py-3 text-gray-500 hidden sm:table-cell">{reg.tenLop || '—'}</td>
                        <td className="px-4 py-3 text-gray-500 text-xs hidden md:table-cell">
                          {reg.ngayDangKy ? formatDateTime(reg.ngayDangKy) : '—'}
                        </td>
                        <td className="px-4 py-3">
                          <AttendanceBadge daDiemDanh={reg.daDiemDanh} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default HoatDongListPage;
