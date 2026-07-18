import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  FileCheck, Download, Users, Clock, ChevronRight,
  AlertCircle, Eye, Search,
} from 'lucide-react';
import banHanhService from '../../services/banHanhService';
import { API_BASE_URL } from '../../services/api';

export default function DanhSachBanHanhListPage() {
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');

  const { data, isLoading, isError } = useQuery({
    queryKey: ['ban-hanh-tat-ca', page],
    queryFn: () => banHanhService.getTatCa(page, 20),
    staleTime: 2 * 60 * 1000,
    keepPreviousData: true,
  });

  const items = data?.content || [];
  const totalPages = data?.totalPages || 1;
  const totalElements = data?.totalElements || 0;

  // Client-side search filter
  const filtered = search
    ? items.filter(i =>
        i.tenHoatDong?.toLowerCase().includes(search.toLowerCase()) ||
        i.maHoatDong?.toLowerCase().includes(search.toLowerCase())
      )
    : items;

  return (
    <>
      <Helmet>
        <title>Danh sách ban hành | Youth KGU</title>
        <meta name="description" content="Danh sách điểm danh hoạt động đã được ban hành chính thức — Đoàn Trường Đại học Kiên Giang" />
      </Helmet>

      <div className="mb-5">
        <div className="flex items-center gap-2 mb-1">
          <FileCheck className="w-5 h-5 text-emerald-600" />
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Danh sách điểm danh đã ban hành</h1>
        </div>
        <p className="text-gray-500 text-sm">
          Các danh sách tham gia hoạt động đã được ban hành chính thức bằng chữ ký số
        </p>
      </div>

      {/* Search */}
      <form
        onSubmit={e => { e.preventDefault(); setSearch(searchInput); setPage(0); }}
        className="flex gap-2 mb-5"
      >
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={searchInput}
            onChange={e => setSearchInput(e.target.value)}
            placeholder="Tìm theo tên hoạt động, mã hoạt động..."
            className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-enews-400"
          />
        </div>
        <button
          type="submit"
          className="px-4 py-2.5 bg-emerald-600 text-white text-sm font-medium rounded-xl hover:bg-emerald-700 transition-colors flex-shrink-0"
        >
          Tìm
        </button>
        {search && (
          <button
            type="button"
            onClick={() => { setSearch(''); setSearchInput(''); }}
            className="px-3 py-2.5 border border-gray-200 text-gray-500 text-sm rounded-xl hover:bg-gray-50 transition-colors flex-shrink-0"
          >
            Xoá
          </button>
        )}
      </form>

      {/* Stats bar */}
      {!isLoading && totalElements > 0 && (
        <div className="flex items-center gap-2 mb-4 text-sm text-gray-500">
          <FileCheck className="w-4 h-4 text-emerald-500" />
          <span>
            <strong className="text-emerald-700 font-semibold">{totalElements}</strong> bản ban hành
          </span>
          {search && (
            <span className="text-amber-600">
              · hiện {filtered.length} kết quả cho "<strong>{search}</strong>"
            </span>
          )}
        </div>
      )}

      {/* Content */}
      {isLoading ? (
        <div className="space-y-3 animate-pulse">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-200 p-4 h-24" />
          ))}
        </div>
      ) : isError ? (
        <div className="text-center py-16 text-gray-400">
          <AlertCircle className="w-12 h-12 mx-auto mb-3 opacity-40 text-red-400" />
          <p className="font-medium text-red-500">Không thể tải danh sách</p>
          <p className="text-xs mt-1">Vui lòng thử lại sau</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <FileCheck className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="font-medium">
            {items.length === 0 ? 'Chưa có danh sách nào được ban hành' : 'Không tìm thấy kết quả phù hợp'}
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {filtered.map(item => (
            <BanHanhCard key={item.id} item={item} />
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && !search && (
        <div className="flex items-center justify-center gap-2 mt-6">
          <button
            onClick={() => setPage(p => Math.max(0, p - 1))}
            disabled={page === 0}
            className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-default transition-colors"
          >
            Trước
          </button>
          <span className="text-sm text-gray-500 px-2">
            Trang {page + 1} / {totalPages}
          </span>
          <button
            onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
            disabled={page === totalPages - 1}
            className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-default transition-colors"
          >
            Sau
          </button>
        </div>
      )}

      {/* Info box */}
      <div className="mt-8 bg-blue-50 rounded-xl border border-blue-200 p-4 flex items-start gap-3">
        <FileCheck className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-blue-700">
          <p className="font-medium mb-0.5">Tài liệu có chữ ký số</p>
          <p className="text-blue-600 text-xs">
            Mỗi danh sách đã được ký số điện tử. Tải về và mở bằng Adobe Acrobat Reader để xác minh chữ ký.
          </p>
        </div>
      </div>
    </>
  );
}

function BanHanhCard({ item }) {
  const downloadUrl = `${API_BASE_URL}/api/public/ban-hanh/${item.id}/download`;

  return (
    <div className="bg-white rounded-xl border border-gray-200 hover:border-emerald-300 hover:shadow-sm transition-all">
      <div className="flex items-stretch gap-0">
        <div className="w-1 rounded-l-xl flex-shrink-0 bg-emerald-500" />
        <div className="flex-1 min-w-0 px-4 py-3.5">
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                <span className="inline-flex items-center gap-1 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full font-medium">
                  <FileCheck className="w-3 h-3" />
                  Đã ban hành
                </span>
                <span className="text-xs text-gray-400 font-mono">{item.maHoatDong}</span>
              </div>
              <h3 className="font-semibold text-gray-900 text-sm sm:text-[15px] leading-snug line-clamp-2 mb-1.5">
                {item.tenHoatDong || item.maHoatDong}
              </h3>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-0.5 text-xs text-gray-500">
                <span className="flex items-center gap-1">
                  <Users className="w-3.5 h-3.5 text-blue-400" />
                  <strong className="text-gray-700">{item.tongSv}</strong> sinh viên
                </span>
                <span>{item.loaiKy} · {item.tenNguoiKy}</span>
                {item.createdAt && (
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    {new Date(item.createdAt).toLocaleDateString('vi-VN')}
                  </span>
                )}
                {item.soLuotTai > 0 && (
                  <span className="flex items-center gap-1 text-emerald-600">
                    <Download className="w-3.5 h-3.5" />
                    <strong>{item.soLuotTai}</strong> lượt tải
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              <Link
                to={`/ban-hanh/${item.maHoatDong}`}
                className="flex items-center gap-1 text-xs text-blue-600 font-medium hover:text-blue-700 px-2 py-1.5 rounded-lg hover:bg-blue-50 transition-colors border border-blue-100"
              >
                <Eye className="w-3.5 h-3.5" />
                Chi tiết
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
              <a
                href={downloadUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-xs text-emerald-600 font-medium hover:text-emerald-700 px-2 py-1.5 rounded-lg hover:bg-emerald-50 transition-colors border border-emerald-200"
              >
                <Download className="w-3.5 h-3.5" />
                Tải về
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
