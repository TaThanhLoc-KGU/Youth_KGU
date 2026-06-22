import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Users, BookOpen, Search, ChevronRight, Building2, GraduationCap } from 'lucide-react';
import accountService from '../../services/accountService';
import useAuthStore from '../../stores/authStore';

const ROLES_KHOA = ['ADMIN', 'QUAN_LY_KHOA', 'PHO_QUAN_LY_KHOA'];
const ROLES_CHI_DOAN = ['QUAN_LY_CHI_DOAN', 'PHO_CHI_DOAN'];

export default function DoanVienKhoaPage() {
  const { user } = useAuthStore();
  const [selectedLop, setSelectedLop] = useState(null);
  const [search, setSearch] = useState('');

  const isKhoaLevel = user && ROLES_KHOA.includes(user.vaiTro);
  const isChiDoanLevel = user && ROLES_CHI_DOAN.includes(user.vaiTro);

  // Danh sách chi đoàn/lớp trong scope
  const { data: chiDoanList = [], isLoading: loadingChiDoan } = useQuery({
    queryKey: ['chiDoanInScope'],
    queryFn: accountService.getChiDoanInScope,
    enabled: isKhoaLevel,
  });

  // Sinh viên trong lớp được chọn (hoặc toàn khoa nếu chưa chọn)
  const { data: sinhVienList = [], isLoading: loadingSV } = useQuery({
    queryKey: ['svInScope', selectedLop],
    queryFn: () => accountService.getSinhVienInScope({
      maLop: isChiDoanLevel ? undefined : selectedLop,
    }),
    enabled: isChiDoanLevel || !!selectedLop || isKhoaLevel,
  });

  const filteredSV = sinhVienList.filter(sv =>
    !search || sv.hoTen?.toLowerCase().includes(search.toLowerCase())
              || sv.maSv?.toLowerCase().includes(search.toLowerCase())
  );

  if (!isKhoaLevel && !isChiDoanLevel) {
    return (
      <div className="p-8 text-center text-gray-500">
        Bạn không có quyền truy cập trang này.
      </div>
    );
  }

  return (
    <div className="flex h-full gap-0">
      {/* ─── Sidebar: Danh sách chi đoàn ─── */}
      {isKhoaLevel && (
        <div className="w-72 flex-shrink-0 border-r bg-gray-50 flex flex-col">
          <div className="p-4 border-b bg-white">
            <h2 className="font-semibold text-gray-800 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-blue-500" />
              Chi đoàn / Lớp
            </h2>
            {user?.tenKhoa && (
              <p className="text-xs text-gray-500 mt-1">📍 {user.tenKhoa}</p>
            )}
          </div>

          {/* Tuỳ chọn "Xem tất cả" */}
          <button
            onClick={() => setSelectedLop(null)}
            className={`flex items-center gap-2 px-4 py-3 text-sm transition-colors border-b ${
              !selectedLop
                ? 'bg-blue-50 text-blue-700 font-medium border-l-2 border-blue-500'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <Users className="w-4 h-4" />
            Tất cả đoàn viên
            <span className="ml-auto text-xs text-gray-400">
              {sinhVienList.length}
            </span>
          </button>

          {loadingChiDoan ? (
            <div className="p-4 text-sm text-gray-400">Đang tải...</div>
          ) : (
            <div className="flex-1 overflow-y-auto">
              {chiDoanList.map(lop => (
                <button
                  key={lop.maLop}
                  onClick={() => setSelectedLop(lop.maLop)}
                  className={`w-full flex items-center gap-2 px-4 py-3 text-sm text-left transition-colors border-b ${
                    selectedLop === lop.maLop
                      ? 'bg-blue-50 text-blue-700 font-medium border-l-2 border-blue-500'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <GraduationCap className="w-4 h-4 flex-shrink-0 text-gray-400" />
                  <div className="flex-1 min-w-0">
                    <p className="truncate font-medium">{lop.tenLop}</p>
                    <p className="text-xs text-gray-400 truncate">{lop.maLop}</p>
                  </div>
                  <div className="flex flex-col items-end flex-shrink-0">
                    <span className="text-xs text-gray-500">{lop.soLuongSV} SV</span>
                    {selectedLop === lop.maLop && <ChevronRight className="w-3 h-3 text-blue-500" />}
                  </div>
                </button>
              ))}
              {chiDoanList.length === 0 && (
                <p className="p-4 text-sm text-gray-400 text-center">Chưa có chi đoàn nào</p>
              )}
            </div>
          )}
        </div>
      )}

      {/* ─── Main: Danh sách sinh viên ─── */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <div className="p-4 border-b bg-white flex items-center justify-between gap-4">
          <div>
            <h1 className="font-semibold text-gray-900 flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-500" />
              {isChiDoanLevel
                ? `Chi đoàn: ${user?.tenLop || user?.maLop || 'Của tôi'}`
                : selectedLop
                  ? `Lớp: ${chiDoanList.find(l => l.maLop === selectedLop)?.tenLop || selectedLop}`
                  : 'Tất cả đoàn viên trong khoa'}
            </h1>
            <p className="text-xs text-gray-500 mt-0.5">
              {filteredSV.length} đoàn viên
              {user?.tenKhoa && ` · ${user.tenKhoa}`}
            </p>
          </div>

          {/* Search */}
          <div className="relative max-w-xs w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Tìm theo tên, mã SV..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
            />
          </div>
        </div>

        {/* Table */}
        <div className="flex-1 overflow-auto">
          {loadingSV ? (
            <div className="flex items-center justify-center py-16 text-gray-400">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent" />
            </div>
          ) : filteredSV.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-gray-400">
              <Users className="w-12 h-12 mb-3 text-gray-300" />
              <p>Không tìm thấy đoàn viên nào</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b sticky top-0">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Mã SV</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Họ tên</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Email</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Số điện thoại</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Giới tính</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Trạng thái</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredSV.map(sv => (
                  <tr key={sv.maSv} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-mono text-gray-700">{sv.maSv}</td>
                    <td className="px-4 py-3 font-medium text-gray-900">{sv.hoTen}</td>
                    <td className="px-4 py-3 text-gray-600">{sv.email || '—'}</td>
                    <td className="px-4 py-3 text-gray-600">{sv.sdt || '—'}</td>
                    <td className="px-4 py-3 text-gray-600">
                      {sv.gioiTinh === 'NAM' ? 'Nam' : sv.gioiTinh === 'NU' ? 'Nữ' : sv.gioiTinh || '—'}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                        sv.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'
                      }`}>
                        {sv.isActive ? 'Hoạt động' : 'Ngừng'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
