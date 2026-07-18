import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Award, Download, Search, FileText, Calendar, CheckCircle2 } from 'lucide-react';
import chungNhanService from '../../services/chungNhanService';
import useAuthStore from '../../stores/authStore';
import { formatDate } from '../../utils/dateFormat';

const BASE = (import.meta.env.VITE_API_BASE_URL || 'https://tuoitre.vnkgu.edu.vn').replace(/\/$/, '');

const SkeletonItem = () => (
  <div className="bg-white rounded-2xl border border-gray-100 p-4 animate-pulse flex gap-4">
    <div className="w-12 h-12 bg-gray-200 rounded-xl flex-shrink-0" />
    <div className="flex-1 space-y-2">
      <div className="h-4 bg-gray-200 rounded w-3/4" />
      <div className="h-3 bg-gray-100 rounded w-1/2" />
      <div className="h-3 bg-gray-100 rounded w-1/3" />
    </div>
  </div>
);

const StudentCertificatesPage = () => {
  const { user } = useAuthStore();
  const maSv = user?.linkedEntityId || (user?.vaiTro === 'DOAN_VIEN' ? user?.username : null);
  const [search, setSearch] = useState('');

  const { data: certificates = [], isLoading, isError } = useQuery({
    queryKey: ['student-certificates', maSv],
    queryFn: () => chungNhanService.getByStudent(maSv),
    enabled: !!maSv,
    staleTime: 2 * 60 * 1000,
  });

  const filtered = certificates.filter((c) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      c.tenHoatDong?.toLowerCase().includes(q) ||
      c.maSoChungNhan?.toLowerCase().includes(q)
    );
  });

  const handleDownload = (cn) => {
    if (!cn.filePath) return;
    const url = cn.filePath.startsWith('http') ? cn.filePath : `${BASE}/${cn.filePath.replace(/^\//, '')}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="px-4 py-4 max-w-2xl mx-auto space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center flex-shrink-0">
          <Award className="w-5 h-5 text-amber-600" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-gray-900">Chứng nhận của tôi</h1>
          <p className="text-xs text-gray-500">
            {certificates.length > 0 ? `${certificates.length} chứng nhận` : 'Chưa có chứng nhận'}
          </p>
        </div>
      </div>

      {/* Search */}
      {certificates.length > 3 && (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm theo tên hoạt động..."
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-200 bg-white"
          />
        </div>
      )}

      {/* List */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <SkeletonItem key={i} />)}
        </div>
      ) : isError ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <p className="text-red-500 font-medium">Không thể tải danh sách chứng nhận</p>
          <p className="text-xs text-gray-400 mt-1">Vui lòng thử lại sau</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <FileText className="w-8 h-8 text-gray-300" />
          </div>
          <p className="text-gray-500 font-medium">
            {search ? 'Không tìm thấy chứng nhận' : 'Bạn chưa có chứng nhận nào'}
          </p>
          {!search && (
            <p className="text-xs text-gray-400 mt-1 max-w-xs">
              Chứng nhận sẽ được cấp sau khi bạn tham gia và điểm danh thành công các hoạt động
            </p>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((cn) => (
            <div
              key={cn.id}
              className="bg-white rounded-2xl border border-gray-100 p-4 flex gap-4 shadow-sm"
            >
              <div className="w-12 h-12 bg-amber-50 rounded-xl flex items-center justify-center flex-shrink-0">
                <Award className="w-6 h-6 text-amber-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900 text-sm leading-snug truncate">
                  {cn.tenHoatDong || 'Hoạt động'}
                </p>
                {cn.maChungNhan && (
                  <p className="text-xs text-gray-400 mt-0.5">Mã: {cn.maChungNhan}</p>
                )}
                <div className="flex items-center gap-3 mt-2 flex-wrap">
                  {cn.ngayCap && (
                    <span className="flex items-center gap-1 text-xs text-gray-500">
                      <Calendar className="w-3 h-3" />
                      {formatDate(cn.ngayCap)}
                    </span>
                  )}
                  <span className="flex items-center gap-1 text-xs text-emerald-600">
                    <CheckCircle2 className="w-3 h-3" />
                    Đã cấp
                  </span>
                </div>
              </div>
              {cn.filePath && (
                <button
                  onClick={() => handleDownload(cn)}
                  className="flex-shrink-0 w-9 h-9 bg-amber-50 hover:bg-amber-100 rounded-xl flex items-center justify-center transition-colors"
                  title="Tải chứng nhận"
                >
                  <Download className="w-4 h-4 text-amber-600" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default StudentCertificatesPage;
