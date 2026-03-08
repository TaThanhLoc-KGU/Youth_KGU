import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  ClipboardCheck,
  Clock,
  Calendar,
  MapPin,
  Users,
  ChevronRight,
  CheckCircle2,
  Search,
  PieChart,
  AlertCircle,
  CheckCircle,
} from 'lucide-react';
import activityService from '../../services/activityService';
import attendanceService from '../../services/attendanceService';
import dangKyService from '../../services/dangKyService';
import { ROUTES } from '../../utils/constants';
import { formatDate } from '../../utils/dateFormat';
import Loading from '../../components/common/Loading';

// Sub-component: thống kê điểm danh của 1 hoạt động
const AttendanceStatCell = ({ maHoatDong }) => {
  const { data: stats = {} } = useQuery({
    queryKey: ['attendance-stats', maHoatDong],
    queryFn: () => attendanceService.getStatistics(maHoatDong),
    staleTime: 60 * 1000,
  });

  const total = stats?.tongDangKy ?? '—';
  const checked = stats?.daDiemDanh ?? '—';

  return (
    <span className="text-xs text-gray-600">
      <span className="font-semibold text-green-600">{checked}</span>
      {' / '}
      <span>{total}</span>
      {' đã điểm danh'}
    </span>
  );
};

// Sub-component: Thống kê đăng ký theo khoa
const RegistrationFacultyStats = ({ maHoatDong }) => {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['registration-faculty-stats', maHoatDong],
    queryFn: () => dangKyService.getFacultyStats(maHoatDong),
    staleTime: 60 * 1000,
  });

  if (isLoading) return <div className="h-4 w-24 bg-gray-100 animate-pulse rounded"></div>;
  if (!stats) return null;

  return (
    <div className="mt-4 space-y-4">
      {/* Khoa đã đăng ký */}
      <div>
        <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-2 flex items-center gap-1">
          <CheckCircle className="w-3 h-3 text-green-500" /> Khoa đã đăng ký ({stats.faculties?.length || 0})
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
          {stats.faculties?.map((f) => (
            <div key={f.maKhoa} className="bg-green-50 border border-green-100 rounded-lg p-2 flex justify-between items-center">
              <span className="text-xs font-medium text-green-800 truncate pr-2" title={f.tenKhoa}>
                {f.tenKhoa}
              </span>
              <span className="bg-green-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
                {f.count}
              </span>
            </div>
          ))}
          {(!stats.faculties || stats.faculties.length === 0) && (
            <p className="text-xs text-gray-400 italic">Chưa có khoa nào đăng ký</p>
          )}
        </div>
      </div>

      {/* Khoa chưa có đăng ký */}
      <div>
        <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-2 flex items-center gap-1">
          <AlertCircle className="w-3 h-3 text-amber-500" /> Khoa chưa có đăng ký ({stats.missingFaculties?.length || 0})
        </h4>
        <div className="flex flex-wrap gap-2">
          {stats.missingFaculties?.map((f) => (
            <span key={f.maKhoa} className="bg-gray-100 text-gray-600 text-[10px] px-2 py-1 rounded border border-gray-200">
              {f.tenKhoa}
            </span>
          ))}
          {(!stats.missingFaculties || stats.missingFaculties.length === 0) && (
            <p className="text-xs text-green-600 font-medium italic">Tất cả các khoa đều đã có sinh viên đăng ký!</p>
          )}
        </div>
      </div>
    </div>
  );
};

const BCHAttendance = () => {
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState('ongoing'); // 'ongoing' | 'all' | 'registration'

  const { data: ongoingActivities = [], isLoading: loadingOngoing } = useQuery({
    queryKey: ['attendance-ongoing'],
    queryFn: () => activityService.getOngoing(),
    staleTime: 60 * 1000,
  });

  const { data: allActivities = [], isLoading: loadingAll } = useQuery({
    queryKey: ['attendance-all'],
    queryFn: () => activityService.getAll(),
    staleTime: 3 * 60 * 1000,
    enabled: tab === 'all' || tab === 'registration',
  });

  const sourceList = tab === 'ongoing' ? ongoingActivities : allActivities;
  const isLoading = tab === 'ongoing' ? loadingOngoing : loadingAll;

  const filtered = sourceList.filter((a) =>
    !search || a.tenHoatDong?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Quản lý Điểm danh</h1>
        <p className="text-gray-500 text-sm mt-1">
          Chọn hoạt động để xem và quản lý điểm danh
        </p>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-1 bg-gray-100 p-1 rounded-xl w-fit">
        <button
          onClick={() => setTab('ongoing')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
            tab === 'ongoing'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <span className="flex items-center gap-2">
            <Clock className="w-4 h-4" /> Đang diễn ra
            {ongoingActivities.length > 0 && (
              <span className="bg-green-500 text-white text-xs rounded-full px-1.5 py-0.5">
                {ongoingActivities.length}
              </span>
            )}
          </span>
        </button>
        <button
          onClick={() => setTab('all')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
            tab === 'all'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Tất cả hoạt động
        </button>
        <button
          onClick={() => setTab('registration')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
            tab === 'registration'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <span className="flex items-center gap-2">
            <PieChart className="w-4 h-4" /> Tình hình đăng ký
          </span>
        </button>
      </div>

      {/* Search */}
      <div className="relative w-full max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="Tìm kiếm hoạt động..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
        />
      </div>

      {/* List */}
      {isLoading ? (
        <Loading />
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm py-16 text-center">
          <ClipboardCheck className="w-12 h-12 text-gray-200 mx-auto mb-3" />
          <p className="text-gray-400 text-sm">
            {tab === 'ongoing' ? 'Không có hoạt động đang diễn ra' : 'Không tìm thấy hoạt động'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((act) => (
            <div
              key={act.maHoatDong}
              className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 hover:shadow-md transition"
            >
              <div className="flex flex-col gap-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    {/* Status badge */}
                    <div className="mb-1">
                      {act.trangThai === 'DANG_DIEN_RA' ? (
                        <span className="inline-flex items-center gap-1 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">
                          <Clock className="w-3 h-3" /> Đang diễn ra
                        </span>
                      ) : act.trangThai === 'DA_KET_THUC' ? (
                        <span className="inline-flex items-center gap-1 text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-medium">
                          <CheckCircle2 className="w-3 h-3" /> Đã kết thúc
                        </span>
                      ) : (
                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full font-medium">
                          {act.trangThai}
                        </span>
                      )}
                    </div>

                    <h3 className="font-semibold text-gray-900">{act.tenHoatDong}</h3>

                    <div className="flex flex-wrap gap-4 mt-2 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" /> {formatDate(act.ngayToChuc)}
                      </span>
                      {act.diaDiem && (
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" /> {act.diaDiem}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        <AttendanceStatCell maHoatDong={act.maHoatDong} />
                      </span>
                    </div>
                  </div>

                  <Link
                    to={`${ROUTES.BCH}/activities/${act.maHoatDong}/attendance`}
                    className="flex-shrink-0 flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition"
                  >
                    <ClipboardCheck className="w-4 h-4" />
                    Điểm danh
                    <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>

                {/* Phần thống kê theo khoa - Chỉ hiện khi ở tab registration */}
                {tab === 'registration' && (
                  <div className="border-t border-gray-50 pt-2">
                    <RegistrationFacultyStats maHoatDong={act.maHoatDong} />
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default BCHAttendance;
