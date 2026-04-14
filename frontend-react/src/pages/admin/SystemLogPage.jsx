import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  ScrollText, Search, RefreshCw, X, ChevronDown, ChevronUp,
  LogIn, LogOut, User, ShieldAlert, Activity, AlertTriangle
} from 'lucide-react';
import api from '../../services/api';

const LOG_LEVELS = ['INFO', 'WARN', 'ERROR', 'DEBUG', 'FATAL'];

const ALL_MODULES = [
  'AUTHENTICATION', 'TAI_KHOAN', 'HOAT_DONG', 'DIEM_DANH', 'DANG_KY',
  'SINH_VIEN', 'GIANG_VIEN', 'TIN_TUC', 'VAN_BAN', 'BIEU_MAU',
  'CHUYEN_MUC', 'CUOC_THI', 'PHAN_QUYEN', 'THONG_BAO', 'SYSTEM',
  'SETTINGS', 'NAM_HOC', 'HOC_KY', 'LOP', 'KHOA', 'NGANH',
  'CHUC_VU', 'BAN', 'BCH', 'CHUNG_NHAN', 'PHAN_CONG',
];

const LEVEL_COLORS = {
  INFO:  'bg-blue-100 text-blue-700',
  WARN:  'bg-yellow-100 text-yellow-700',
  ERROR: 'bg-red-100 text-red-700',
  DEBUG: 'bg-gray-100 text-gray-600',
  FATAL: 'bg-red-200 text-red-900 font-bold',
  TRACE: 'bg-purple-100 text-purple-700',
};

const STATUS_COLORS = {
  SUCCESS: 'text-green-600 font-semibold',
  FAILED:  'text-red-500 font-semibold',
  ERROR:   'text-red-600 font-semibold',
};

const MODULE_VI = {
  AUTHENTICATION: 'Xác thực',
  TAI_KHOAN: 'Tài khoản',
  HOAT_DONG: 'Hoạt động',
  DIEM_DANH: 'Điểm danh',
  DANG_KY: 'Đăng ký',
  SINH_VIEN: 'Sinh viên',
  GIANG_VIEN: 'Giảng viên',
  TIN_TUC: 'Tin tức',
  VAN_BAN: 'Văn bản',
  BIEU_MAU: 'Biểu mẫu',
  CHUYEN_MUC: 'Chuyên mục',
  CUOC_THI: 'Cuộc thi',
  THONG_BAO: 'Thông báo',
  SYSTEM: 'Hệ thống',
  SETTINGS: 'Cài đặt',
};

/* ── Action icon helper ── */
function ActionIcon({ action }) {
  if (!action) return null;
  const a = action.toUpperCase();
  if (a.includes('LOGIN'))  return <LogIn className="w-3.5 h-3.5 inline mr-1 text-blue-500" />;
  if (a.includes('LOGOUT')) return <LogOut className="w-3.5 h-3.5 inline mr-1 text-gray-400" />;
  if (a.includes('CREATE') || a.includes('REGISTER') || a.includes('ADD'))
    return <span className="inline-block w-2 h-2 rounded-full bg-green-500 mr-1" />;
  if (a.includes('DELETE') || a.includes('CANCEL'))
    return <span className="inline-block w-2 h-2 rounded-full bg-red-500 mr-1" />;
  if (a.includes('UPDATE')) return <span className="inline-block w-2 h-2 rounded-full bg-yellow-500 mr-1" />;
  return null;
}

/* ── Detail modal ── */
function LogDetailModal({ log, onClose }) {
  if (!log) return null;
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b sticky top-0 bg-white">
          <h2 className="font-bold text-gray-800 text-lg">Chi tiết Log #{log.id}</h2>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <Field label="Thời gian" value={log.createdAt ? new Date(log.createdAt).toLocaleString('vi-VN') : '—'} />
            <Field label="Trạng thái" value={
              <span className={STATUS_COLORS[log.status] || 'text-gray-600'}>{log.status || '—'}</span>
            } />
            <Field label="Module" value={
              <span className="font-mono bg-gray-100 px-2 py-0.5 rounded text-xs">{log.module}</span>
            } />
            <Field label="Hành động" value={
              <span className="font-mono text-purple-700">{log.action}</span>
            } />
            <Field label="Người dùng" value={log.userName || log.userId || '—'} />
            <Field label="User ID" value={log.userId || '—'} />
            <Field label="Mức log" value={
              <span className={`px-2 py-0.5 rounded text-xs font-semibold ${LEVEL_COLORS[log.logLevel] || 'bg-gray-100'}`}>
                {log.logLevel}
              </span>
            } />
            <Field label="IP Address" value={<span className="font-mono text-xs">{log.ipAddress || '—'}</span>} />
            <Field label="HTTP Method" value={log.requestMethod || '—'} />
            <Field label="URL" value={<span className="font-mono text-xs break-all">{log.requestUrl || '—'}</span>} />
            {log.entityType && <Field label="Loại thực thể" value={log.entityType} />}
            {log.entityId && <Field label="ID thực thể" value={log.entityId} />}
          </div>

          {log.message && (
            <div>
              <div className="text-xs font-semibold text-gray-500 uppercase mb-1">Thông báo</div>
              <div className="bg-gray-50 rounded-lg p-3 text-sm text-gray-700 whitespace-pre-wrap">{log.message}</div>
            </div>
          )}

          {log.userAgent && (
            <div>
              <div className="text-xs font-semibold text-gray-500 uppercase mb-1">User Agent</div>
              <div className="bg-gray-50 rounded-lg p-3 text-xs text-gray-500 break-all">{log.userAgent}</div>
            </div>
          )}

          {log.oldValue && (
            <div>
              <div className="text-xs font-semibold text-gray-500 uppercase mb-1">Giá trị cũ</div>
              <pre className="bg-gray-50 rounded-lg p-3 text-xs text-gray-700 overflow-x-auto">{log.oldValue}</pre>
            </div>
          )}

          {log.newValue && (
            <div>
              <div className="text-xs font-semibold text-gray-500 uppercase mb-1">Giá trị mới</div>
              <pre className="bg-gray-50 rounded-lg p-3 text-xs text-gray-700 overflow-x-auto">{log.newValue}</pre>
            </div>
          )}

          {log.errorDetails && (
            <div>
              <div className="text-xs font-semibold text-red-500 uppercase mb-1">Chi tiết lỗi</div>
              <pre className="bg-red-50 rounded-lg p-3 text-xs text-red-700 overflow-x-auto whitespace-pre-wrap max-h-48">
                {log.errorDetails}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Field({ label, value }) {
  return (
    <div>
      <div className="text-xs text-gray-400 mb-0.5">{label}</div>
      <div className="text-sm text-gray-800">{value}</div>
    </div>
  );
}

/* ── Stats card ── */
function StatCard({ icon: Icon, label, value, color }) {
  return (
    <div className="bg-white rounded-xl border p-4 flex items-center gap-3">
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${color}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <div className="text-2xl font-bold text-gray-800">{value ?? '—'}</div>
        <div className="text-xs text-gray-500">{label}</div>
      </div>
    </div>
  );
}

/* ── Main Page ── */
export default function SystemLogPage() {
  const [filters, setFilters] = useState({
    module: '', action: '', userId: '', logLevel: '', status: '', from: '', to: '', page: 0, size: 50
  });
  const [applied, setApplied] = useState(filters);
  const [selected, setSelected] = useState(null);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['systemLogs', applied],
    queryFn: () => api.get('/api/admin/logs', { params: applied }).then(r => r.data?.data),
  });

  const { data: statsData } = useQuery({
    queryKey: ['systemLogStats'],
    queryFn: () => api.get('/api/admin/logs/stats').then(r => r.data?.data),
    refetchInterval: 60_000,
  });

  const logs = data?.content || [];
  const totalPages = data?.totalPages || 0;
  const totalElements = data?.totalElements || 0;

  const handleSearch = () => setApplied({ ...filters, page: 0 });
  const handlePageChange = (p) => setApplied(prev => ({ ...prev, page: p }));
  const handleReset = () => {
    const reset = { module: '', action: '', userId: '', logLevel: '', status: '', from: '', to: '', page: 0, size: 50 };
    setFilters(reset);
    setApplied(reset);
  };

  return (
    <div className="p-4 sm:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <ScrollText className="w-7 h-7 text-blue-600" />
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-800">System Log</h1>
            <p className="text-gray-500 text-sm">Nhật ký hành vi người dùng và hệ thống</p>
          </div>
        </div>
        <button onClick={() => { refetch(); }} className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-gray-50 text-sm">
          <RefreshCw className="w-4 h-4" /> Làm mới
        </button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-6">
        <StatCard icon={Activity}     label="Tổng log 24h"    value={statsData?.total24h}  color="bg-blue-50 text-blue-600" />
        <StatCard icon={LogIn}        label="Đăng nhập 24h"   value={statsData?.logins24h} color="bg-green-50 text-green-600" />
        <StatCard icon={AlertTriangle} label="Thất bại 24h"   value={statsData?.failed24h} color="bg-yellow-50 text-yellow-600" />
        <StatCard icon={ShieldAlert}  label="Lỗi 24h"         value={statsData?.errors24h} color="bg-red-50 text-red-600" />
        <StatCard icon={Activity}     label="Hoạt động 1h"    value={statsData?.total1h}   color="bg-purple-50 text-purple-600" />
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border p-4 mb-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-3">
          <select value={filters.module} onChange={e => setFilters(f => ({...f, module: e.target.value}))}
            className="px-3 py-2 border rounded-lg text-sm">
            <option value="">Tất cả module</option>
            {ALL_MODULES.map(m => (
              <option key={m} value={m}>{MODULE_VI[m] || m}</option>
            ))}
          </select>
          <select value={filters.logLevel} onChange={e => setFilters(f => ({...f, logLevel: e.target.value}))}
            className="px-3 py-2 border rounded-lg text-sm">
            <option value="">Tất cả mức log</option>
            {LOG_LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
          </select>
          <select value={filters.status} onChange={e => setFilters(f => ({...f, status: e.target.value}))}
            className="px-3 py-2 border rounded-lg text-sm">
            <option value="">Tất cả trạng thái</option>
            <option value="SUCCESS">✅ SUCCESS</option>
            <option value="FAILED">❌ FAILED</option>
            <option value="ERROR">🔴 ERROR</option>
          </select>
          <input type="text" placeholder="Tìm user (username)..." value={filters.userId}
            onChange={e => setFilters(f => ({...f, userId: e.target.value}))}
            onKeyDown={e => e.key === 'Enter' && handleSearch()}
            className="px-3 py-2 border rounded-lg text-sm" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <input type="datetime-local" value={filters.from}
            onChange={e => setFilters(f => ({...f, from: e.target.value}))}
            className="px-3 py-2 border rounded-lg text-sm" />
          <input type="datetime-local" value={filters.to}
            onChange={e => setFilters(f => ({...f, to: e.target.value}))}
            className="px-3 py-2 border rounded-lg text-sm" />
          <input type="text" placeholder="Tìm hành động (LOGIN_SUCCESS...)..." value={filters.action}
            onChange={e => setFilters(f => ({...f, action: e.target.value}))}
            onKeyDown={e => e.key === 'Enter' && handleSearch()}
            className="px-3 py-2 border rounded-lg text-sm" />
          <div className="flex gap-2">
            <button onClick={handleSearch}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold text-sm">
              <Search className="w-4 h-4" /> Tìm
            </button>
            <button onClick={handleReset}
              className="px-3 py-2 border rounded-lg hover:bg-gray-50 text-sm text-gray-600">
              Reset
            </button>
          </div>
        </div>
      </div>

      {/* Summary */}
      <div className="text-sm text-gray-500 mb-3">
        Tìm thấy <strong className="text-gray-800">{totalElements.toLocaleString('vi-VN')}</strong> bản ghi
        · Trang {applied.page + 1}/{totalPages || 1}
        · <span className="text-blue-600 cursor-pointer hover:underline" onClick={() => setSelected(logs[0])}>
          click vào hàng để xem chi tiết
        </span>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-gray-600 whitespace-nowrap">Thời gian</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600 whitespace-nowrap hidden sm:table-cell">Module</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600 whitespace-nowrap">Hành động</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600 whitespace-nowrap">Người dùng</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600 whitespace-nowrap hidden md:table-cell">Thông báo</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600 whitespace-nowrap hidden lg:table-cell">Mức</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600 whitespace-nowrap">Trạng thái</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600 whitespace-nowrap hidden lg:table-cell">IP</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={8} className="text-center py-10 text-gray-400">
                  <RefreshCw className="w-5 h-5 animate-spin inline mr-2" />Đang tải...
                </td></tr>
              ) : logs.length === 0 ? (
                <tr><td colSpan={8} className="text-center py-10 text-gray-400">
                  <ScrollText className="w-8 h-8 mx-auto mb-2 opacity-40" />
                  Không có dữ liệu
                </td></tr>
              ) : logs.map(log => (
                <tr
                  key={log.id}
                  className="border-t hover:bg-blue-50 cursor-pointer transition-colors"
                  onClick={() => setSelected(log)}
                >
                  <td className="px-4 py-2 whitespace-nowrap text-gray-500 font-mono text-xs">
                    {log.createdAt ? new Date(log.createdAt).toLocaleString('vi-VN') : '—'}
                  </td>
                  <td className="px-4 py-2 hidden sm:table-cell">
                    <span className="px-2 py-0.5 bg-gray-100 rounded text-xs font-mono">
                      {MODULE_VI[log.module] || log.module}
                    </span>
                  </td>
                  <td className="px-4 py-2 font-mono text-xs text-purple-700 whitespace-nowrap">
                    <ActionIcon action={log.action} />
                    {log.action}
                  </td>
                  <td className="px-4 py-2">
                    <div className="font-medium text-xs">{log.userName || '—'}</div>
                    {log.userId && log.userId !== log.userName &&
                      <div className="text-xs text-gray-400">{log.userId}</div>
                    }
                  </td>
                  <td className="px-4 py-2 max-w-xs truncate hidden md:table-cell text-xs text-gray-600"
                      title={log.message}>{log.message}</td>
                  <td className="px-4 py-2 hidden lg:table-cell">
                    <span className={`px-2 py-0.5 rounded text-xs font-semibold ${LEVEL_COLORS[log.logLevel] || 'bg-gray-100'}`}>
                      {log.logLevel}
                    </span>
                  </td>
                  <td className={`px-4 py-2 text-xs ${STATUS_COLORS[log.status] || 'text-gray-500'}`}>
                    {log.status || '—'}
                  </td>
                  <td className="px-4 py-2 font-mono text-xs text-gray-400 hidden lg:table-cell">
                    {log.ipAddress || '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-1 p-4 border-t flex-wrap">
            <button onClick={() => handlePageChange(0)} disabled={applied.page === 0}
              className="px-3 py-1 border rounded text-xs disabled:opacity-40 hover:bg-gray-50">«</button>
            <button onClick={() => handlePageChange(applied.page - 1)} disabled={applied.page === 0}
              className="px-3 py-1 border rounded text-xs disabled:opacity-40 hover:bg-gray-50">‹</button>
            {Array.from({length: Math.min(totalPages, 10)}, (_, i) => {
              const start = Math.max(0, Math.min(applied.page - 4, totalPages - 10));
              return start + i;
            }).map(p => (
              <button key={p} onClick={() => handlePageChange(p)}
                className={`px-3 py-1 border rounded text-xs ${applied.page === p ? 'bg-blue-600 text-white border-blue-600' : 'hover:bg-gray-50'}`}>
                {p + 1}
              </button>
            ))}
            <button onClick={() => handlePageChange(applied.page + 1)} disabled={applied.page >= totalPages - 1}
              className="px-3 py-1 border rounded text-xs disabled:opacity-40 hover:bg-gray-50">›</button>
            <button onClick={() => handlePageChange(totalPages - 1)} disabled={applied.page >= totalPages - 1}
              className="px-3 py-1 border rounded text-xs disabled:opacity-40 hover:bg-gray-50">»</button>
          </div>
        )}
      </div>

      {/* Detail modal */}
      {selected && <LogDetailModal log={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}
