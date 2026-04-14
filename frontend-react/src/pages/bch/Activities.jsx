import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import {
  Plus,
  Search,
  Filter,
  Calendar,
  MapPin,
  Users,
  ChevronRight,
  Eye,
  ClipboardCheck,
  Edit,
  Trash2,
  PlayCircle,
  XCircle,
} from 'lucide-react';
import { toast } from 'react-toastify';
import activityService from '../../services/activityService';
import useAuthStore from '../../stores/authStore';
import { ROUTES, PERMISSIONS, ACTIVITY_STATUS_LABELS, ACTIVITY_STATUS_COLORS } from '../../utils/constants';
import { formatDate } from '../../utils/dateFormat';
import Loading from '../../components/common/Loading';
import ConfirmDialog from '../../components/common/ConfirmDialog';

const BCHActivities = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { hasPermission } = useAuthStore();

  const [confirmState, setConfirmState] = useState(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const { data: activities = [], isLoading } = useQuery({
    queryKey: ['bch-activities-list'],
    queryFn: () => activityService.getAll(),
    staleTime: 2 * 60 * 1000,
  });

  // Mutations
  const startMutation = useMutation({
    mutationFn: (id) => activityService.start(id),
    onSuccess: () => { toast.success('Đã bắt đầu hoạt động'); queryClient.invalidateQueries({ queryKey: ['bch-activities-list'] }); },
    onError: () => toast.error('Không thể bắt đầu hoạt động'),
  });

  const openRegMutation = useMutation({
    mutationFn: (id) => activityService.openRegistration(id),
    onSuccess: () => { toast.success('Đã mở đăng ký'); queryClient.invalidateQueries({ queryKey: ['bch-activities-list'] }); },
    onError: () => toast.error('Không thể mở đăng ký'),
  });

  const closeRegMutation = useMutation({
    mutationFn: (id) => activityService.closeRegistration(id),
    onSuccess: () => { toast.success('Đã đóng đăng ký'); queryClient.invalidateQueries({ queryKey: ['bch-activities-list'] }); },
    onError: () => toast.error('Không thể đóng đăng ký'),
  });

  const completeMutation = useMutation({
    mutationFn: (id) => activityService.complete(id),
    onSuccess: () => { toast.success('Đã kết thúc hoạt động'); queryClient.invalidateQueries({ queryKey: ['bch-activities-list'] }); },
    onError: () => toast.error('Không thể kết thúc hoạt động'),
  });

  const cancelMutation = useMutation({
    mutationFn: (id) => activityService.cancel(id, 'Hủy bởi BCH'),
    onSuccess: () => { toast.success('Đã hủy hoạt động'); queryClient.invalidateQueries({ queryKey: ['bch-activities-list'] }); },
    onError: () => toast.error('Không thể hủy hoạt động'),
  });

  const filtered = activities.filter((a) => {
    const matchSearch = !search || a.tenHoatDong?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = !statusFilter || a.trangThai === statusFilter;
    return matchSearch && matchStatus;
  });

  if (isLoading) return <Loading />;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Quản lý Hoạt động</h1>
          <p className="text-gray-500 text-sm mt-1">{activities.length} hoạt động trong hệ thống</p>
        </div>
        {hasPermission(PERMISSIONS.TAO_HOAT_DONG) && (
          <Link
            to={`${ROUTES.BCH}/activities/create`}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition"
          >
            <Plus className="w-4 h-4" /> Tạo hoạt động
          </Link>
        )}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex gap-3 flex-wrap">
        <div className="flex-1 min-w-[200px] relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Tìm kiếm hoạt động..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Tất cả trạng thái</option>
          {Object.entries(ACTIVITY_STATUS_LABELS).map(([val, label]) => (
            <option key={val} value={val}>{label}</option>
          ))}
        </select>
      </div>

      {/* Activities List */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm py-16 text-center">
            <Calendar className="w-12 h-12 text-gray-200 mx-auto mb-3" />
            <p className="text-gray-400">Không tìm thấy hoạt động nào</p>
          </div>
        ) : (
          filtered.map((act) => {
            const statusCls = ACTIVITY_STATUS_COLORS[act.trangThai] || 'bg-gray-100 text-gray-700';
            const statusLabel = ACTIVITY_STATUS_LABELS[act.trangThai] || act.trangThai;

            return (
              <div
                key={act.maHoatDong}
                className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 hover:shadow-md transition"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusCls}`}>
                        {statusLabel}
                      </span>
                    </div>
                    <h3 className="font-semibold text-gray-900 text-base">{act.tenHoatDong}</h3>
                    <div className="flex flex-wrap gap-4 mt-2 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" /> {formatDate(act.ngayToChuc)}
                      </span>
                      {act.diaDiem && (
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" /> {act.diaDiem}
                        </span>
                      )}
                      {act.soLuongToiDa && (
                        <span className="flex items-center gap-1">
                          <Users className="w-3 h-3" /> Tối đa {act.soLuongToiDa}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="flex flex-wrap items-center gap-2 flex-shrink-0">
                    {/* Điểm danh - khi đang diễn ra */}
                    {act.trangThai === 'DANG_DIEN_RA' && hasPermission(PERMISSIONS.QUET_QR) && (
                      <Link
                        to={`${ROUTES.BCH}/activities/attendance?ma=${encodeURIComponent(act.maHoatDong)}`}
                        className="flex items-center gap-1 px-3 py-1.5 bg-green-50 text-green-700 border border-green-200 rounded-lg text-xs font-medium hover:bg-green-100 transition"
                      >
                        <ClipboardCheck className="w-3.5 h-3.5" /> Điểm danh
                      </Link>
                    )}

                    {/* Mở đăng ký */}
                    {act.trangThai === 'CHUA_MO_DANG_KY' && hasPermission(PERMISSIONS.SUA_HOAT_DONG) && (
                      <button
                        onClick={() => openRegMutation.mutate(act.maHoatDong)}
                        className="px-3 py-1.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-lg text-xs font-medium hover:bg-blue-100 transition"
                      >
                        Mở ĐK
                      </button>
                    )}

                    {/* Đóng đăng ký */}
                    {act.trangThai === 'MO_DANG_KY' && hasPermission(PERMISSIONS.SUA_HOAT_DONG) && (
                      <button
                        onClick={() => closeRegMutation.mutate(act.maHoatDong)}
                        className="px-3 py-1.5 bg-yellow-50 text-yellow-700 border border-yellow-200 rounded-lg text-xs font-medium hover:bg-yellow-100 transition"
                      >
                        Đóng ĐK
                      </button>
                    )}

                    {/* Bắt đầu */}
                    {act.trangThai === 'DONG_DANG_KY' && hasPermission(PERMISSIONS.SUA_HOAT_DONG) && (
                      <button
                        onClick={() => startMutation.mutate(act.maHoatDong)}
                        className="flex items-center gap-1 px-3 py-1.5 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-lg text-xs font-medium hover:bg-indigo-100 transition"
                      >
                        <PlayCircle className="w-3.5 h-3.5" /> Bắt đầu
                      </button>
                    )}

                    {/* Kết thúc */}
                    {act.trangThai === 'DANG_DIEN_RA' && hasPermission(PERMISSIONS.SUA_HOAT_DONG) && (
                      <button
                        onClick={() => completeMutation.mutate(act.maHoatDong)}
                        className="px-3 py-1.5 bg-purple-50 text-purple-700 border border-purple-200 rounded-lg text-xs font-medium hover:bg-purple-100 transition"
                      >
                        Kết thúc
                      </button>
                    )}

                    {/* Hủy */}
                    {['CHUA_MO_DANG_KY', 'MO_DANG_KY', 'DONG_DANG_KY'].includes(act.trangThai) && hasPermission(PERMISSIONS.SUA_HOAT_DONG) && (
                      <button
                        onClick={() => setConfirmState({ id: act.maHoatDong, name: act.tenHoatDong })}
                        className="flex items-center gap-1 px-3 py-1.5 bg-red-50 text-red-700 border border-red-200 rounded-lg text-xs font-medium hover:bg-red-100 transition"
                      >
                        <XCircle className="w-3.5 h-3.5" /> Hủy
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      <ConfirmDialog
        isOpen={!!confirmState}
        onClose={() => setConfirmState(null)}
        onConfirm={() => { cancelMutation.mutate(confirmState?.id); setConfirmState(null); }}
        title="Hủy hoạt động"
        description={`Bạn có chắc muốn hủy hoạt động "${confirmState?.name}"?`}
        isLoading={cancelMutation.isPending}
        variant="warning"
      />
    </div>
  );
};

export default BCHActivities;
