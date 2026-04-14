import { useState, useEffect, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  RefreshCw, Plus, Pencil, Trash2, LogIn, LogOut,
  Shield, Activity, User, Calendar, ChevronDown, ChevronUp,
  Database, Settings, BookOpen, GraduationCap, CheckSquare,
  Users, Layers
} from 'lucide-react';
import logsService from '../../services/logsService';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import Card from '../../components/common/Card';
import Modal from '../../components/common/Modal';
import { formatDateTime } from '../../utils/dateFormat';
import { toast } from 'react-toastify';

// =================== Mapping nhãn ===================

const MODULE_LABELS = {
  AUTHENTICATION: 'Xác thực',
  HOAT_DONG:      'Hoạt động',
  SINH_VIEN:      'Sinh viên',
  TAI_KHOAN:      'Tài khoản',
  GIANG_VIEN:     'Giảng viên',
  DIEM_DANH:      'Điểm danh',
  CHUC_VU:        'Chức vụ',
  BCH:            'BCH',
  BAN:            'Ban',
  KHOA:           'Khoa',
  LOP:            'Lớp',
  NGANH:          'Ngành',
  KHOA_HOC:       'Khóa học',
  CHUYEN_VIEN:    'Chuyên viên',
  PHAN_CONG:      'Phân công',
  DANG_KY:        'Đăng ký',
  CHUNG_NHAN:     'Chứng nhận',
  SETTINGS:       'Cài đặt',
  SYSTEM:         'Hệ thống',
};

const ACTION_LABELS = {
  CREATE:        'đã tạo mới',
  UPDATE:        'đã cập nhật',
  DELETE:        'đã xóa',
  LOGIN_SUCCESS: 'đã đăng nhập',
  LOGIN_FAILED:  'đăng nhập thất bại',
};

const ACTION_BADGE_VARIANT = {
  CREATE:        'success',
  UPDATE:        'info',
  DELETE:        'danger',
  LOGIN_SUCCESS: 'primary',
  LOGIN_FAILED:  'warning',
};

const MODULE_ICON_MAP = {
  AUTHENTICATION: Shield,
  HOAT_DONG:      Calendar,
  SINH_VIEN:      GraduationCap,
  TAI_KHOAN:      Users,
  GIANG_VIEN:     BookOpen,
  DIEM_DANH:      CheckSquare,
  CHUC_VU:        Layers,
  BCH:            Users,
  BAN:            Layers,
  SETTINGS:       Settings,
  SYSTEM:         Database,
};

function getModuleIcon(module) {
  const Icon = MODULE_ICON_MAP[module] || Activity;
  return <Icon className="w-4 h-4" />;
}

function getActionIcon(action) {
  const map = {
    CREATE:        <Plus      className="w-3.5 h-3.5" />,
    UPDATE:        <Pencil    className="w-3.5 h-3.5" />,
    DELETE:        <Trash2    className="w-3.5 h-3.5" />,
    LOGIN_SUCCESS: <LogIn     className="w-3.5 h-3.5" />,
    LOGIN_FAILED:  <LogOut    className="w-3.5 h-3.5" />,
  };
  return map[action] || <Activity className="w-3.5 h-3.5" />;
}

const ACTION_BG = {
  CREATE:        'bg-green-100 text-green-700',
  UPDATE:        'bg-blue-100 text-blue-700',
  DELETE:        'bg-red-100 text-red-700',
  LOGIN_SUCCESS: 'bg-purple-100 text-purple-700',
  LOGIN_FAILED:  'bg-orange-100 text-orange-700',
};

// =================== Detail Modal ===================

const LogDetailModal = ({ log, isOpen, onClose }) => {
  if (!log) return null;
  const badgeVariant = ACTION_BADGE_VARIANT[log.action] || 'gray';
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Chi tiết thao tác" size="md">
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-full ${ACTION_BG[log.action] || 'bg-gray-100 text-gray-600'}`}>
            {getActionIcon(log.action)}
          </div>
          <div>
            <p className="font-semibold text-gray-900">
              {log.userName || log.userId || 'Hệ thống'}
            </p>
            <div className="flex items-center gap-2 mt-0.5">
              <Badge variant={badgeVariant} size="sm">
                {ACTION_LABELS[log.action] || log.action}
              </Badge>
              <span className="text-xs text-gray-500">
                {MODULE_LABELS[log.module] || log.module}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-gray-50 rounded-lg p-3 space-y-2 text-sm">
          <div className="flex gap-2">
            <span className="text-gray-500 w-28 shrink-0">Mô tả:</span>
            <span className="text-gray-900 font-medium">{log.message}</span>
          </div>
          <div className="flex gap-2">
            <span className="text-gray-500 w-28 shrink-0">Thời gian:</span>
            <span className="text-gray-900">{formatDateTime(log.createdAt)}</span>
          </div>
          {log.userId && (
            <div className="flex gap-2">
              <span className="text-gray-500 w-28 shrink-0">Tài khoản:</span>
              <span className="text-gray-900">@{log.userId}</span>
            </div>
          )}
          {log.ipAddress && (
            <div className="flex gap-2">
              <span className="text-gray-500 w-28 shrink-0">Địa chỉ IP:</span>
              <span className="text-gray-900 font-mono text-xs">{log.ipAddress}</span>
            </div>
          )}
        </div>

        {log.errorDetails && (
          <div>
            <p className="text-xs font-semibold text-red-600 mb-1">CHI TIẾT LỖI</p>
            <div className="bg-red-50 rounded p-3 text-xs text-red-800 max-h-40 overflow-auto font-mono whitespace-pre-wrap">
              {log.errorDetails}
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};

// =================== Main Component ===================

const Logs = () => {
  const [search,       setSearch]       = useState('');
  const [moduleFilter, setModuleFilter] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [selectedLog,  setSelectedLog]  = useState(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [showCleanup,  setShowCleanup]  = useState(false);

  // Debounced search
  const [debouncedSearch, setDebouncedSearch] = useState('');
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(t);
  }, [search]);

  const buildParams = useCallback(() => {
    const p = {};
    if (moduleFilter)    p.module  = moduleFilter;
    if (actionFilter)    p.action  = actionFilter;
    if (debouncedSearch) p.keyword = debouncedSearch;
    p.size = 200;
    return p;
  }, [moduleFilter, actionFilter, debouncedSearch]);

  const { data: logsData, isLoading, refetch } = useQuery({
    queryKey: ['logs', moduleFilter, actionFilter, debouncedSearch],
    queryFn:  () => {
      const p = buildParams();
      const hasFilter = p.module || p.action || p.keyword;
      return hasFilter ? logsService.search(p) : logsService.getAll({ size: 200 });
    },
    keepPreviousData: true,
  });

  // Ensure logs is always an array
  const logs = Array.isArray(logsData) ? logsData : (logsData?.content || []);

  const { data: stats = {} } = useQuery({
    queryKey: ['logs-stats'],
    queryFn:  () => logsService.getStatistics(),
  });

  const handleCleanup = async (days) => {
    try {
      await logsService.deleteOlderThan(days);
      toast.success(`Đã xóa nhật ký cũ hơn ${days} ngày`);
      refetch();
      setShowCleanup(false);
    } catch {
      toast.error('Xóa nhật ký thất bại');
    }
  };

  const resetFilters = () => {
    setSearch('');
    setModuleFilter('');
    setActionFilter('');
  };

  const moduleOptions = [
    { value: '', label: 'Tất cả module' },
    ...Object.entries(MODULE_LABELS).map(([v, l]) => ({ value: v, label: l })),
  ];

  const actionOptions = [
    { value: '',             label: 'Tất cả thao tác' },
    { value: 'CREATE',       label: '✦ Tạo mới' },
    { value: 'UPDATE',       label: '✎ Cập nhật' },
    { value: 'DELETE',       label: '✕ Xóa' },
    { value: 'LOGIN_SUCCESS',label: '→ Đăng nhập' },
    { value: 'LOGIN_FAILED', label: '✗ Đăng nhập thất bại' },
  ];

  return (
    <div className="space-y-6 p-1">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Nhật ký thao tác</h1>
          <p className="text-gray-500 mt-1">
            Theo dõi các hoạt động của người dùng trong hệ thống
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" icon={RefreshCw} onClick={() => refetch()}>
            Làm mới
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowCleanup(!showCleanup)}
          >
            {showCleanup ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            &nbsp;Dọn dẹp
          </Button>
        </div>
      </div>

      {/* Cleanup panel */}
      {showCleanup && (
        <Card>
          <div className="p-4 flex items-center gap-3">
            <span className="text-sm text-gray-600">Xóa nhật ký cũ hơn:</span>
            {[7, 30, 90].map(d => (
              <Button key={d} variant="danger" size="sm" onClick={() => handleCleanup(d)}>
                {d} ngày
              </Button>
            ))}
          </div>
        </Card>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card padding={false}>
          <div className="p-4">
            <p className="text-xs text-gray-500">Tổng thao tác</p>
            <p className="text-2xl font-bold text-gray-900">{stats.totalLogs ?? 0}</p>
          </div>
        </Card>
        <Card padding={false}>
          <div className="p-4">
            <p className="text-xs text-gray-500">Hôm nay</p>
            <p className="text-2xl font-bold text-blue-600">{stats.logsToday ?? 0}</p>
          </div>
        </Card>
        <Card padding={false}>
          <div className="p-4">
            <p className="text-xs text-gray-500">Tuần này</p>
            <p className="text-2xl font-bold text-green-600">{stats.logsLastWeek ?? 0}</p>
          </div>
        </Card>
        <Card padding={false}>
          <div className="p-4">
            <p className="text-xs text-gray-500">Thất bại (24h)</p>
            <p className="text-2xl font-bold text-red-500">{stats.failedLast24h ?? 0}</p>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card padding={false}>
        <div className="p-4 flex flex-wrap gap-3 items-center">
          <input
            type="text"
            placeholder="Tìm theo nội dung, tên người dùng..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="input input-bordered input-sm w-full sm:flex-1 sm:min-w-48"
          />
          <select
            className="select select-bordered select-sm w-full sm:w-auto"
            value={moduleFilter}
            onChange={e => setModuleFilter(e.target.value)}
          >
            {moduleOptions.map(o => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
          <select
            className="select select-bordered select-sm w-full sm:w-auto"
            value={actionFilter}
            onChange={e => setActionFilter(e.target.value)}
          >
            {actionOptions.map(o => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
          {(search || moduleFilter || actionFilter) && (
            <Button variant="outline" size="sm" onClick={resetFilters}>
              Xóa bộ lọc
            </Button>
          )}
          <span className="text-xs text-gray-400 ml-auto">
            {logs.length} kết quả
          </span>
        </div>
      </Card>

      {/* Activity Feed */}
      <Card padding={false}>
        <div className="divide-y divide-gray-100">
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <span className="loading loading-spinner loading-md text-primary" />
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <Activity className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p>Không có nhật ký nào</p>
            </div>
          ) : (
            logs.map(log => (
              <LogRow
                key={log.id}
                log={log}
                onClick={() => { setSelectedLog(log); setIsDetailOpen(true); }}
              />
            ))
          )}
        </div>
      </Card>

      <LogDetailModal
        log={selectedLog}
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
      />
    </div>
  );
};

// =================== Log Row ===================

const LogRow = ({ log, onClick }) => {
  const actionBg      = ACTION_BG[log.action] || 'bg-gray-100 text-gray-500';
  const badgeVariant  = ACTION_BADGE_VARIANT[log.action] || 'gray';
  const moduleName    = MODULE_LABELS[log.module] || log.module || '—';
  const actorName     = log.userName || log.userId || 'Hệ thống';

  return (
    <div
      onClick={onClick}
      className="flex items-start gap-3 px-4 py-3 hover:bg-gray-50 cursor-pointer transition-colors"
    >
      {/* Action icon */}
      <div className={`mt-0.5 p-1.5 rounded-full shrink-0 ${actionBg}`}>
        {getActionIcon(log.action)}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center flex-wrap gap-1.5 mb-0.5">
          <span className="font-semibold text-sm text-gray-900">{actorName}</span>
          <Badge variant={badgeVariant} size="sm">
            {ACTION_LABELS[log.action] || log.action}
          </Badge>
          <span className="inline-flex items-center gap-1 text-xs text-gray-500">
            {getModuleIcon(log.module)}
            {moduleName}
          </span>
        </div>
        <p className="text-sm text-gray-700 truncate">{log.message}</p>
      </div>

      {/* Time */}
      <div className="shrink-0 text-right">
        <span className="text-xs text-gray-400 whitespace-nowrap">
          {log.timeAgo || ''}
        </span>
        {log.status === 'FAILED' && (
          <div className="mt-0.5">
            <Badge variant="danger" size="sm">Thất bại</Badge>
          </div>
        )}
      </div>
    </div>
  );
};

export default Logs;
