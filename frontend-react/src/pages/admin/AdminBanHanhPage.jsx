import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import {
  FileCheck, Download, Trash2, ExternalLink, Search,
  Loader2, AlertTriangle, Users, User, Calendar,
  ChevronLeft, ChevronRight, X, Shield
} from 'lucide-react';
import apiClient from '../../services/api';
import banHanhService from '../../services/banHanhService';

// Fetch all ban hanh (admin) — paginated
const fetchAllBanHanh = ({ page = 0, size = 20, search = '' }) =>
  apiClient.get('/api/ky-so/ban-hanh-all', { params: { page, size, search } })
    .then(r => r.data.data || { content: [], totalElements: 0, totalPages: 0 });

export default function AdminBanHanhPage() {
  const qc = useQueryClient();
  const [page, setPage]         = useState(0);
  const [search, setSearch]     = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [confirmId, setConfirmId] = useState(null); // ID đang xác nhận hủy
  const [confirmItem, setConfirmItem] = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-ban-hanh-all', page, search],
    queryFn: () => fetchAllBanHanh({ page, search }),
    keepPreviousData: true,
  });

  const list         = data?.content ?? [];
  const totalPages   = data?.totalPages ?? 0;
  const totalElements = data?.totalElements ?? 0;

  const huyMutation = useMutation({
    mutationFn: (id) => banHanhService.huyBanHanh(id),
    onSuccess: () => {
      toast.success('Đã hủy ban hành thành công');
      qc.invalidateQueries({ queryKey: ['admin-ban-hanh-all'] });
      setConfirmId(null);
      setConfirmItem(null);
    },
    onError: (err) => {
      toast.error('Lỗi: ' + (err?.response?.data?.message || err.message));
    },
  });

  const handleSearch = (e) => {
    e.preventDefault();
    setSearch(searchInput);
    setPage(0);
  };

  const openConfirm = (item) => {
    setConfirmId(item.id);
    setConfirmItem(item);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-1">
          <div className="p-2 bg-emerald-100 rounded-lg">
            <FileCheck className="w-6 h-6 text-emerald-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Quản lý danh sách ban hành</h1>
            <p className="text-gray-500 text-sm">Văn bản, danh sách điểm danh đã ký số và ban hành chính thức</p>
          </div>
        </div>
      </div>

      {/* Search + Stats */}
      <div className="flex items-center justify-between gap-4 mb-5 flex-wrap">
        <form onSubmit={handleSearch} className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
              placeholder="Tìm theo tên hoạt động, mã..."
              className="pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-400 focus:border-transparent w-72"
            />
          </div>
          <button type="submit"
            className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 transition-colors">
            Tìm kiếm
          </button>
          {search && (
            <button type="button" onClick={() => { setSearch(''); setSearchInput(''); setPage(0); }}
              className="px-3 py-2 text-gray-500 hover:text-gray-700 text-sm">
              Xóa bộ lọc
            </button>
          )}
        </form>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Shield className="w-4 h-4 text-emerald-500" />
          Tổng: <strong className="text-gray-800">{totalElements}</strong> bản ban hành
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
          </div>
        ) : list.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <FileCheck className="w-12 h-12 mx-auto mb-3 opacity-20" />
            <p className="font-medium">Chưa có danh sách ban hành nào</p>
            <p className="text-sm mt-1">Vào trang quản lý hoạt động → Ban Hành để tạo mới</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Hoạt động</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Người ký / Lập</th>
                <th className="px-4 py-3 text-center font-semibold text-gray-600">Số SV</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Ngày ban hành</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Người thực hiện</th>
                <th className="px-4 py-3 text-center font-semibold text-gray-600">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {list.map(item => (
                <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-900 line-clamp-2 max-w-xs">
                      {item.tenHoatDong || item.maHoatDong}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-gray-400 font-mono">{item.maHoatDong}</span>
                      <a
                        href={`/ban-hanh/${item.maHoatDong}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-emerald-600 hover:text-emerald-700 flex items-center gap-0.5"
                        title="Xem trang public"
                      >
                        <ExternalLink className="w-3 h-3" />
                        Public
                      </a>
                    </div>
                    {item.coConDau && (
                      <span className="text-xs bg-orange-50 text-orange-600 border border-orange-200 px-1.5 py-0.5 rounded mt-1 inline-block">
                        Có con dấu
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 text-gray-700">
                      <User className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
                      <span className="font-medium">{item.tenNguoiKy || '—'}</span>
                      <span className="text-xs text-gray-400 ml-1">({item.loaiKy})</span>
                    </div>
                    {item.tenNguoiLap && (
                      <div className="text-xs text-gray-500 mt-0.5 flex items-center gap-1">
                        <User className="w-3 h-3 text-gray-300" />
                        {item.tenNguoiLap}
                        {item.chucVuNguoiLap && <span className="text-gray-400">· {item.chucVuNguoiLap}</span>}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex items-center justify-center gap-1 font-semibold text-gray-800">
                      <Users className="w-3.5 h-3.5 text-gray-400" />
                      {item.tongSv ?? 0}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 text-gray-600">
                      <Calendar className="w-3.5 h-3.5 text-gray-400" />
                      {item.createdAt
                        ? new Date(item.createdAt).toLocaleDateString('vi-VN')
                        : '—'}
                    </div>
                    <div className="text-xs text-gray-400 mt-0.5">
                      {item.createdAt
                        ? new Date(item.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
                        : ''}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500">
                    {item.nguoiBanHanh || '—'}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-2">
                      <a
                        href={item.downloadUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                        title="Tải PDF"
                      >
                        <Download className="w-4 h-4" />
                      </a>
                      <button
                        onClick={() => openConfirm(item)}
                        className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        title="Hủy ban hành"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <span className="text-sm text-gray-500">
            Trang {page + 1} / {totalPages}
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage(p => Math.max(0, p - 1))}
              disabled={page === 0}
              className="p-2 rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-gray-50"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
              className="p-2 rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-gray-50"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Confirm Dialog */}
      {confirmId && confirmItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-red-100 rounded-lg">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900">Xác nhận hủy ban hành</h3>
                <p className="text-sm text-gray-500">Hành động này không thể hoàn tác</p>
              </div>
              <button onClick={() => { setConfirmId(null); setConfirmItem(null); }}
                className="ml-auto p-1.5 rounded-lg text-gray-400 hover:bg-gray-100">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-5 text-sm">
              <p className="font-medium text-red-800 mb-1">{confirmItem.tenHoatDong || confirmItem.maHoatDong}</p>
              <p className="text-red-600">File: <span className="font-mono text-xs">{confirmItem.tenFile}</span></p>
              <p className="text-red-600 mt-1">
                ⚠️ File PDF sẽ bị xóa vĩnh viễn khỏi server và link download sẽ không còn hoạt động.
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => { setConfirmId(null); setConfirmItem(null); }}
                className="flex-1 py-2.5 border border-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors"
              >
                Không, giữ lại
              </button>
              <button
                onClick={() => huyMutation.mutate(confirmId)}
                disabled={huyMutation.isPending}
                className="flex-1 py-2.5 bg-red-600 text-white rounded-xl font-medium hover:bg-red-700 disabled:opacity-50 flex items-center justify-center gap-2 transition-colors"
              >
                {huyMutation.isPending
                  ? <><Loader2 className="w-4 h-4 animate-spin" />Đang hủy...</>
                  : <><Trash2 className="w-4 h-4" />Hủy ban hành</>
                }
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
