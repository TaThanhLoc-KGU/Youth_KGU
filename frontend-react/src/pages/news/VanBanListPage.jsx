import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { useQuery } from '@tanstack/react-query';
import { Search, ChevronLeft, ChevronRight } from 'lucide-react';
import vanBanService from '../../services/vanBanService';
import VanBanCard from '../../components/news/public/VanBanCard';

const LOAI_OPTIONS = [
  { value: '', label: 'Tất cả loại' },
  { value: 'KE_HOACH', label: 'Kế hoạch' }, { value: 'CONG_VAN', label: 'Công văn' },
  { value: 'QUYET_DINH', label: 'Quyết định' }, { value: 'THONG_BAO', label: 'Thông báo' },
  { value: 'BAO_CAO', label: 'Báo cáo' }, { value: 'HUONG_DAN', label: 'Hướng dẫn' },
  { value: 'BIEN_BAN', label: 'Biên bản' }, { value: 'TO_TRINH', label: 'Tờ trình' },
  { value: 'KHAC', label: 'Khác' },
];
const PAGE_SIZE = 12;

const VanBanListPage = () => {
  const [page, setPage] = useState(0);
  const [loai, setLoai] = useState('');
  const [keyword, setKeyword] = useState('');
  const [search, setSearch] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['van-ban-public', loai, search, page],
    queryFn: () => vanBanService.getDanhSach({ loai: loai || undefined, keyword: search || undefined, page, size: PAGE_SIZE }),
    staleTime: 5 * 60 * 1000,
  });

  const items = data?.content || [];
  const totalPages = data?.totalPages || 0;

  return (
    <>
      <Helmet>
        <title>Văn bản – Kế hoạch | Youth KGU</title>
        <meta name="description" content="Kho văn bản, kế hoạch, công văn của Đoàn Thanh niên – Hội Sinh viên KGU" />
      </Helmet>

      <div className="mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1">Văn bản – Kế hoạch</h1>
        <p className="text-gray-500">Kho lưu trữ văn bản, kế hoạch và công văn của Đoàn – Hội KGU</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <form onSubmit={(e) => { e.preventDefault(); setSearch(keyword); setPage(0); }} className="flex-1 flex gap-2">
          <div className="relative flex-1 min-w-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input value={keyword} onChange={(e) => setKeyword(e.target.value)}
              placeholder="Tìm theo số hiệu hoặc trích yếu..."
              className="w-full sm:w-64 lg:w-80 pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-enews-400" />
          </div>
          <button type="submit" className="px-4 py-2.5 bg-enews-600 text-white text-sm font-medium rounded-xl hover:bg-enews-700 transition-colors">
            Tìm
          </button>
        </form>
        <select value={loai} onChange={(e) => { setLoai(e.target.value); setPage(0); }}
          className="w-full sm:w-auto border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-enews-400 bg-white">
          {LOAI_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </div>

      {isLoading ? (
        <div className="space-y-3 animate-pulse">
          {[...Array(6)].map((_, i) => <div key={i} className="bg-gray-200 rounded-xl h-20" />)}
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-16 text-gray-400">Không tìm thấy văn bản nào.</div>
      ) : (
        <div className="space-y-3">
          {items.map((vb) => <VanBanCard key={vb.id} vanBan={vb} />)}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-8">
          <button onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0}
            className="p-2 border border-gray-200 rounded-xl hover:bg-gray-50 disabled:opacity-40 transition-colors">
            <ChevronLeft className="w-4 h-4" />
          </button>
          {[...Array(Math.min(totalPages, 7))].map((_, i) => (
            <button key={i} onClick={() => setPage(i)}
              className={`w-9 h-9 rounded-xl text-sm font-medium transition-colors ${
                i === page ? 'bg-enews-600 text-white' : 'border border-gray-200 hover:bg-gray-50 text-gray-700'
              }`}>{i + 1}</button>
          ))}
          <button onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))} disabled={page === totalPages - 1}
            className="p-2 border border-gray-200 rounded-xl hover:bg-gray-50 disabled:opacity-40 transition-colors">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </>
  );
};

export default VanBanListPage;
