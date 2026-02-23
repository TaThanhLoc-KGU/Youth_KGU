import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ScrollText, Search, Filter, RefreshCw, Download } from 'lucide-react';
import api from '../../services/api';

const LOG_LEVELS = ['INFO', 'WARN', 'ERROR', 'DEBUG', 'FATAL'];
const MODULES = ['AUTHENTICATION', 'TAI_KHOAN', 'HOAT_DONG', 'DIEM_DANH', 'PHAN_QUYEN', 'SYSTEM', 'SINH_VIEN', 'GIANG_VIEN'];

const LEVEL_COLORS = {
  INFO: 'bg-blue-100 text-blue-700',
  WARN: 'bg-yellow-100 text-yellow-700',
  ERROR: 'bg-red-100 text-red-700',
  DEBUG: 'bg-gray-100 text-gray-600',
  FATAL: 'bg-red-200 text-red-900 font-bold',
};

const STATUS_COLORS = {
  SUCCESS: 'text-green-600',
  FAILED: 'text-red-600',
  ERROR: 'text-red-600',
};

export default function SystemLogPage() {
  const [filters, setFilters] = useState({
    module: '', action: '', userId: '', logLevel: '', status: '', from: '', to: '', page: 0, size: 50
  });
  const [applied, setApplied] = useState(filters);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['systemLogs', applied],
    queryFn: () => api.get('/api/admin/logs', { params: applied }).then(r => r.data?.data),
  });

  const logs = data?.content || [];
  const totalPages = data?.totalPages || 0;
  const totalElements = data?.totalElements || 0;

  const handleSearch = () => setApplied({ ...filters, page: 0 });
  const handlePageChange = (p) => setApplied(prev => ({ ...prev, page: p }));

  return (
    <div className="p-4 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <ScrollText className="w-7 h-7 text-blue-600" />
          <div>
            <h1 className="text-2xl font-bold text-gray-800">System Log</h1>
            <p className="text-gray-500 text-sm">Nhật ký hành vi người dùng và hệ thống</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={() => refetch()} className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-gray-50">
            <RefreshCw className="w-4 h-4" /> Làm mới
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border p-4 mb-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
          <select value={filters.module} onChange={e => setFilters(f => ({...f, module: e.target.value}))}
            className="px-3 py-2 border rounded-lg text-sm">
            <option value="">Tất cả module</option>
            {MODULES.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
          <select value={filters.logLevel} onChange={e => setFilters(f => ({...f, logLevel: e.target.value}))}
            className="px-3 py-2 border rounded-lg text-sm">
            <option value="">Tất cả mức log</option>
            {LOG_LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
          </select>
          <select value={filters.status} onChange={e => setFilters(f => ({...f, status: e.target.value}))}
            className="px-3 py-2 border rounded-lg text-sm">
            <option value="">Tất cả trạng thái</option>
            <option value="SUCCESS">SUCCESS</option>
            <option value="FAILED">FAILED</option>
            <option value="ERROR">ERROR</option>
          </select>
          <input type="text" placeholder="Tìm user ID..." value={filters.userId}
            onChange={e => setFilters(f => ({...f, userId: e.target.value}))}
            className="px-3 py-2 border rounded-lg text-sm" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <input type="datetime-local" value={filters.from}
            onChange={e => setFilters(f => ({...f, from: e.target.value}))}
            className="px-3 py-2 border rounded-lg text-sm" />
          <input type="datetime-local" value={filters.to}
            onChange={e => setFilters(f => ({...f, to: e.target.value}))}
            className="px-3 py-2 border rounded-lg text-sm" />
          <input type="text" placeholder="Tìm hành động..." value={filters.action}
            onChange={e => setFilters(f => ({...f, action: e.target.value}))}
            className="px-3 py-2 border rounded-lg text-sm" />
          <button onClick={handleSearch}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold">
            <Search className="w-4 h-4" /> Tìm kiếm
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="text-sm text-gray-500 mb-3">
        Tổng <strong>{totalElements}</strong> bản ghi · Trang {applied.page + 1}/{totalPages || 1}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                {['Thời gian','Module','Hành động','Người dùng','Thông báo','Mức','Trạng thái','IP'].map(h => (
                  <th key={h} className="px-4 py-3 text-left font-semibold text-gray-600 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={8} className="text-center py-10 text-gray-400">Đang tải...</td></tr>
              ) : logs.length === 0 ? (
                <tr><td colSpan={8} className="text-center py-10 text-gray-400">Không có dữ liệu</td></tr>
              ) : logs.map(log => (
                <tr key={log.id} className="border-t hover:bg-gray-50">
                  <td className="px-4 py-2 whitespace-nowrap text-gray-500 font-mono text-xs">
                    {log.createdAt ? new Date(log.createdAt).toLocaleString('vi-VN') : '—'}
                  </td>
                  <td className="px-4 py-2">
                    <span className="px-2 py-0.5 bg-gray-100 rounded text-xs font-mono">{log.module}</span>
                  </td>
                  <td className="px-4 py-2 font-mono text-xs text-purple-700">{log.action}</td>
                  <td className="px-4 py-2">
                    <div className="font-medium">{log.userName || '—'}</div>
                    <div className="text-xs text-gray-400">{log.userId}</div>
                  </td>
                  <td className="px-4 py-2 max-w-xs truncate" title={log.message}>{log.message}</td>
                  <td className="px-4 py-2">
                    <span className={`px-2 py-0.5 rounded text-xs font-semibold ${LEVEL_COLORS[log.logLevel] || 'bg-gray-100'}`}>
                      {log.logLevel}
                    </span>
                  </td>
                  <td className={`px-4 py-2 font-semibold text-xs ${STATUS_COLORS[log.status] || 'text-gray-500'}`}>
                    {log.status || '—'}
                  </td>
                  <td className="px-4 py-2 font-mono text-xs text-gray-400">{log.ipAddress || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center gap-2 p-4 border-t">
            <button onClick={() => handlePageChange(applied.page - 1)} disabled={applied.page === 0}
              className="px-3 py-1 border rounded disabled:opacity-40">‹</button>
            {Array.from({length: Math.min(totalPages, 10)}, (_, i) => i).map(p => (
              <button key={p} onClick={() => handlePageChange(p)}
                className={`px-3 py-1 border rounded ${applied.page === p ? 'bg-blue-600 text-white' : 'hover:bg-gray-50'}`}>
                {p + 1}
              </button>
            ))}
            <button onClick={() => handlePageChange(applied.page + 1)} disabled={applied.page >= totalPages - 1}
              className="px-3 py-1 border rounded disabled:opacity-40">›</button>
          </div>
        )}
      </div>
    </div>
  );
}
