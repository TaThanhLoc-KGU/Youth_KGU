import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { History, ChevronLeft, ChevronRight, FileText, User, Clock, Monitor, CheckCircle, XCircle, Search } from 'lucide-react';
import kySoService from '../../services/kySoService';

const PAGE_SIZE = 20;

function Badge({ children, color = 'gray' }) {
  const colors = {
    blue:   'bg-blue-100 text-blue-700',
    green:  'bg-green-100 text-green-700',
    orange: 'bg-orange-100 text-orange-700',
    gray:   'bg-gray-100 text-gray-600',
    red:    'bg-red-100 text-red-700',
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${colors[color] || colors.gray}`}>
      {children}
    </span>
  );
}

export default function KySoLichSuPage() {
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState('');

  const { data, isLoading, isError } = useQuery({
    queryKey: ['ky-so-lich-su', page],
    queryFn:  () => kySoService.getLichSu(page, PAGE_SIZE),
    keepPreviousData: true,
  });

  const rows   = data?.content ?? [];
  const total  = data?.totalElements ?? 0;
  const pages  = data?.totalPages ?? 1;

  const filtered = search.trim()
    ? rows.filter(r =>
        r.maHoatDong?.toLowerCase().includes(search.toLowerCase()) ||
        r.tenHoatDong?.toLowerCase().includes(search.toLowerCase()) ||
        r.nguoiThucHien?.toLowerCase().includes(search.toLowerCase()) ||
        r.tenNguoiKy?.toLowerCase().includes(search.toLowerCase())
      )
    : rows;

  const fmt = (dt) => {
    if (!dt) return '—';
    const d = new Date(dt);
    return d.toLocaleString('vi-VN', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-100 rounded-xl">
            <History className="w-6 h-6 text-indigo-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Lịch sử ký số</h1>
            <p className="text-sm text-gray-500">
              Audit log — ghi nhận mỗi lần xuất danh sách PDF có ký số
            </p>
          </div>
        </div>
        {total > 0 && (
          <Badge color="blue">{total} bản ghi</Badge>
        )}
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="Tìm theo hoạt động, người ký…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        {isLoading && (
          <div className="flex items-center justify-center h-48 text-gray-400">
            <div className="w-6 h-6 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin mr-2" />
            Đang tải…
          </div>
        )}
        {isError && (
          <div className="flex items-center justify-center h-48 text-red-500 gap-2">
            <XCircle className="w-5 h-5" />
            Không thể tải dữ liệu
          </div>
        )}
        {!isLoading && !isError && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600 whitespace-nowrap">Thời gian</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">Hoạt động</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600 whitespace-nowrap">Loại ký</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600 whitespace-nowrap">Người ký</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600 whitespace-nowrap">Người lập</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600 whitespace-nowrap">Con dấu</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600 whitespace-nowrap">SV</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600 whitespace-nowrap">Người thực hiện</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600 whitespace-nowrap">IP</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-gray-400">
                      Chưa có lịch sử ký số nào
                    </td>
                  </tr>
                )}
                {filtered.map(r => (
                  <tr key={r.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 whitespace-nowrap text-gray-500">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 flex-shrink-0" />
                        {fmt(r.createdAt)}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900 truncate max-w-xs" title={r.tenHoatDong}>
                        {r.tenHoatDong || r.maHoatDong}
                      </div>
                      <div className="text-xs text-gray-400">{r.maHoatDong}</div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <Badge color={r.loaiKy === 'BÍ THƯ' ? 'blue' : 'orange'}>
                        {r.loaiKy}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-gray-400" />
                        {r.tenNguoiKy || '—'}
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-gray-700">
                      {r.tenNguoiLap || '—'}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-center">
                      {r.coConDau
                        ? <CheckCircle className="w-4 h-4 text-green-500 mx-auto" />
                        : <XCircle className="w-4 h-4 text-gray-300 mx-auto" />
                      }
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-center font-medium text-gray-700">
                      {r.tongSv ?? 0}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <Monitor className="w-3.5 h-3.5 text-gray-400" />
                        {r.nguoiThucHien || '—'}
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-gray-500 font-mono text-xs">
                      {r.ipAddress || '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {pages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t bg-gray-50">
            <span className="text-sm text-gray-500">
              Trang {page + 1} / {pages} ({total} bản ghi)
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage(p => Math.max(0, p - 1))}
                disabled={page === 0}
                className="p-2 rounded-lg hover:bg-gray-200 disabled:opacity-40"
              ><ChevronLeft className="w-4 h-4" /></button>
              <button
                onClick={() => setPage(p => Math.min(pages - 1, p + 1))}
                disabled={page >= pages - 1}
                className="p-2 rounded-lg hover:bg-gray-200 disabled:opacity-40"
              ><ChevronRight className="w-4 h-4" /></button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
