import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import {
  FileCheck, Download, Trash2, ExternalLink, Search,
  Loader2, AlertTriangle, Users, User, Calendar,
  ChevronLeft, ChevronRight, X, Shield, Eye, EyeOff,
  RotateCcw, Ban,
} from 'lucide-react';
import apiClient from '../../services/api';
import banHanhService from '../../services/banHanhService';
import useAuthStore from '../../stores/authStore';

const fetchAllBanHanh = ({ page = 0, size = 20, search = '', includeRevoked = true }) =>
  apiClient.get('/api/ky-so/ban-hanh-all', { params: { page, size, search, includeRevoked } })
    .then(r => r.data.data || { content: [], totalElements: 0, totalPages: 0 });

const STATUS_BADGE = {
  HIEU_LUC: { label: 'Hiệu lực', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  DA_HUY:   { label: 'Đã hủy',   cls: 'bg-red-50 text-red-600 border-red-200' },
};

export default function AdminBanHanhPage() {
  const qc = useQueryClient();
  const { maKhoa, user } = useAuthStore();
  const isKhoaScoped = !!maKhoa;
  const currentUsername = user?.username ?? user?.taiKhoan ?? '';
  const [page,          setPage]          = useState(0);
  const [search,        setSearch]        = useState('');
  const [searchInput,   setSearchInput]   = useState('');
  const [showRevoked,   setShowRevoked]   = useState(true);
  const [confirmItem,   setConfirmItem]   = useState(null); // { item, action: 'huy' | 'xoa' }

  const { data, isLoading } = useQuery({
    queryKey: ['admin-ban-hanh-all', page, search, showRevoked],
    queryFn: () => fetchAllBanHanh({ page, search, includeRevoked: showRevoked }),
    keepPreviousData: true,
  });

  const list          = data?.content ?? [];
  const totalPages    = data?.totalPages ?? 0;
  const totalElements = data?.totalElements ?? 0;

  const refresh = () => qc.invalidateQueries({ queryKey: ['admin-ban-hanh-all'] });

  const huyMutation = useMutation({
    mutationFn: (id) => banHanhService.huyBanHanh(id),
    onSuccess: () => { toast.success('Đã hủy ban hành. File vẫn được lưu trữ.'); refresh(); setConfirmItem(null); },
    onError: (err) => toast.error('Lỗi: ' + (err?.response?.data?.message || err.message)),
  });

  const xoaMutation = useMutation({
    mutationFn: (id) => apiClient.delete(`/api/ky-so/ban-hanh/${id}/xoa-han`),
    onSuccess: () => { toast.success('Đã xóa hoàn toàn bản ban hành.'); refresh(); setConfirmItem(null); },
    onError: (err) => toast.error('Lỗi: ' + (err?.response?.data?.message || err.message)),
  });

  const handleSearch = (e) => { e.preventDefault(); setSearch(searchInput); setPage(0); };

  const isRevoked = (item) => item.trangThai === 'DA_HUY';

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-100 rounded-lg">
            <FileCheck className="w-6 h-6 text-emerald-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Quản lý danh sách ban hành</h1>
            <p className="text-gray-500 text-sm">Văn bản điểm danh đã ký số và ban hành chính thức</p>
          </div>
        </div>
        <button
          onClick={() => { setShowRevoked(v => !v); setPage(0); }}
          className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm border transition-colors ${
            showRevoked ? 'bg-red-50 text-red-600 border-red-200 hover:bg-red-100'
                        : 'text-gray-500 border-gray-200 hover:bg-gray-50'
          }`}>
          {showRevoked ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
          {showRevoked ? 'Ẩn bản đã hủy' : 'Hiện bản đã hủy'}
        </button>
      </div>

      {/* Search + Stats */}
      <div className="flex items-center justify-between gap-4 mb-5 flex-wrap">
        <form onSubmit={handleSearch} className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input type="text" value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
              placeholder="Tìm theo tên hoạt động, mã..."
              className="pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-400 focus:border-transparent w-72" />
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
          Tổng: <strong className="text-gray-800">{totalElements}</strong> bản
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
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">Hoạt động</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">Người ký / Lập</th>
                  <th className="px-4 py-3 text-center font-semibold text-gray-600">SV</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">Ngày ban hành</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">Trạng thái</th>
                  <th className="px-4 py-3 text-center font-semibold text-gray-600">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {list.map(item => {
                  const revoked = isRevoked(item);
                  const badge = STATUS_BADGE[item.trangThai] ?? STATUS_BADGE.HIEU_LUC;
                  // Chỉ người đã ban hành mới được hủy/xóa
                  const isOwner = item.nguoiBanHanh === currentUsername;
                  // Nếu scope khoa: còn cần đúng khoa
                  const canRevoke = isOwner && (!isKhoaScoped || (item.maKhoa && item.maKhoa === maKhoa));
                  return (
                    <tr key={item.id} className={`transition-colors ${revoked ? 'bg-gray-50 opacity-75' : 'hover:bg-gray-50'}`}>
                      <td className="px-4 py-3">
                        <div className={`font-medium line-clamp-2 max-w-xs ${revoked ? 'text-gray-500' : 'text-gray-900'}`}>
                          {item.tenHoatDong || item.maHoatDong}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-gray-400 font-mono">{item.maHoatDong}</span>
                          {!revoked && (
                            <a href={`/ban-hanh/${item.maHoatDong}`} target="_blank" rel="noopener noreferrer"
                              className="text-xs text-emerald-600 hover:text-emerald-700 flex items-center gap-0.5">
                              <ExternalLink className="w-3 h-3" />Public
                            </a>
                          )}
                          {item.coConDau && !revoked && (
                            <span className="text-xs bg-orange-50 text-orange-600 border border-orange-200 px-1.5 py-0.5 rounded">Có con dấu</span>
                          )}
                        </div>
                        {revoked && item.ngayHuy && (
                          <div className="text-xs text-red-400 mt-1">
                            Hủy: {new Date(item.ngayHuy).toLocaleDateString('vi-VN')} bởi {item.nguoiHuy || '—'}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className={`flex items-center gap-1 ${revoked ? 'text-gray-400' : 'text-gray-700'}`}>
                          <User className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
                          <span className="font-medium">{item.tenNguoiKy || '—'}</span>
                          <span className="text-xs text-gray-400 ml-1">({item.loaiKy})</span>
                        </div>
                        {item.tenNguoiLap && (
                          <div className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
                            <User className="w-3 h-3 text-gray-300" />
                            {item.tenNguoiLap}
                            {item.chucVuNguoiLap && <span>· {item.chucVuNguoiLap}</span>}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className={`flex items-center justify-center gap-1 font-semibold ${revoked ? 'text-gray-400' : 'text-gray-800'}`}>
                          <Users className="w-3.5 h-3.5 text-gray-400" />
                          {item.tongSv ?? 0}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className={`flex items-center gap-1 ${revoked ? 'text-gray-400' : 'text-gray-600'}`}>
                          <Calendar className="w-3.5 h-3.5 text-gray-400" />
                          {item.createdAt ? new Date(item.createdAt).toLocaleDateString('vi-VN') : '—'}
                        </div>
                        <div className="text-xs text-gray-400 mt-0.5">
                          {item.nguoiBanHanh || ''}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border font-medium ${badge.cls}`}>
                          {revoked && <Ban className="w-3 h-3" />}
                          {badge.label}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-1.5">
                          {!revoked && (
                            <a href={item.downloadUrl} target="_blank" rel="noopener noreferrer"
                              className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors" title="Tải PDF">
                              <Download className="w-4 h-4" />
                            </a>
                          )}
                          {!revoked && canRevoke && (
                            <button
                              onClick={() => setConfirmItem({ item, action: 'huy' })}
                              className="p-1.5 rounded-lg transition-colors text-amber-500 hover:bg-amber-50"
                              title="Hủy ban hành">
                              <RotateCcw className="w-4 h-4" />
                            </button>
                          )}
                          {revoked && canRevoke && (
                            <button
                              onClick={() => setConfirmItem({ item, action: 'xoa' })}
                              className="p-1.5 rounded-lg transition-colors text-red-500 hover:bg-red-50"
                              title="Xóa hẳn khỏi hệ thống">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <span className="text-sm text-gray-500">Trang {page + 1} / {totalPages}</span>
          <div className="flex items-center gap-2">
            <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}
              className="p-2 rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-gray-50">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1}
              className="p-2 rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-gray-50">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Confirm Dialog */}
      {confirmItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className={`p-2 rounded-lg ${confirmItem.action === 'xoa' ? 'bg-red-100' : 'bg-amber-100'}`}>
                <AlertTriangle className={`w-6 h-6 ${confirmItem.action === 'xoa' ? 'text-red-600' : 'text-amber-600'}`} />
              </div>
              <div>
                <h3 className="font-bold text-gray-900">
                  {confirmItem.action === 'huy' ? 'Xác nhận hủy ban hành' : 'Xóa hoàn toàn bản ban hành'}
                </h3>
                <p className="text-sm text-gray-500">
                  {confirmItem.action === 'huy'
                    ? 'Bản ban hành sẽ bị đánh dấu Đã Hủy, file vẫn còn trên server'
                    : 'File PDF sẽ bị xóa vĩnh viễn khỏi server'}
                </p>
              </div>
              <button onClick={() => setConfirmItem(null)}
                className="ml-auto p-1.5 rounded-lg text-gray-400 hover:bg-gray-100">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className={`border rounded-xl p-4 mb-5 text-sm ${
              confirmItem.action === 'xoa' ? 'bg-red-50 border-red-200' : 'bg-amber-50 border-amber-200'
            }`}>
              <p className="font-medium mb-1">{confirmItem.item.tenHoatDong || confirmItem.item.maHoatDong}</p>
              <p className="text-gray-600 text-xs font-mono">{confirmItem.item.tenFile}</p>
              {confirmItem.action === 'huy' ? (
                <p className="mt-2 text-amber-700 text-xs">
                  Link download sẽ trả về lỗi 410. Bạn có thể xóa hẳn sau nếu cần.
                </p>
              ) : (
                <p className="mt-2 text-red-700 text-xs font-medium">
                  ⚠️ Hành động này không thể hoàn tác. File PDF sẽ bị xóa vĩnh viễn.
                </p>
              )}
            </div>

            <div className="flex gap-3">
              <button onClick={() => setConfirmItem(null)}
                className="flex-1 py-2.5 border border-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors">
                Không, giữ lại
              </button>
              <button
                onClick={() => confirmItem.action === 'huy'
                  ? huyMutation.mutate(confirmItem.item.id)
                  : xoaMutation.mutate(confirmItem.item.id)
                }
                disabled={huyMutation.isPending || xoaMutation.isPending}
                className={`flex-1 py-2.5 text-white rounded-xl font-medium flex items-center justify-center gap-2 transition-colors disabled:opacity-50 ${
                  confirmItem.action === 'xoa' ? 'bg-red-600 hover:bg-red-700' : 'bg-amber-500 hover:bg-amber-600'
                }`}>
                {(huyMutation.isPending || xoaMutation.isPending)
                  ? <><Loader2 className="w-4 h-4 animate-spin" />Đang xử lý...</>
                  : confirmItem.action === 'huy'
                    ? <><RotateCcw className="w-4 h-4" />Hủy ban hành</>
                    : <><Trash2 className="w-4 h-4" />Xóa vĩnh viễn</>
                }
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
