import { useState, useRef, useEffect } from 'react';
import { Search, FileText, X, ExternalLink, Loader2 } from 'lucide-react';
import newsService from '../../../services/newsService';

const LOAI_LABELS = {
  KE_HOACH: 'KH', CONG_VAN: 'CV', QUYET_DINH: 'QĐ',
  THONG_BAO: 'TB', BAO_CAO: 'BC', HUONG_DAN: 'HD',
  BIEN_BAN: 'BB', TO_TRINH: 'TT', KHAC: '?',
};

const formatSize = (bytes) => {
  if (!bytes) return '';
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)}KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
};

/**
 * Ô search văn bản với autocomplete (debounce 300ms).
 * Props: value (VanBanSearchResultDTO | null), onChange (fn)
 */
const VanBanSearchBox = ({ value, onChange }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const debounceRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleInput = (q) => {
    setQuery(q);
    clearTimeout(debounceRef.current);
    if (!q.trim()) { setResults([]); setOpen(false); return; }
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const data = await newsService.searchVanBan(q.trim());
        setResults(Array.isArray(data) ? data : (data?.content || []));
        setOpen(true);
      } finally {
        setLoading(false);
      }
    }, 300);
  };

  const handleSelect = (item) => {
    onChange(item);
    setQuery('');
    setResults([]);
    setOpen(false);
  };

  const handleClear = () => {
    onChange(null);
    setQuery('');
  };

  if (value) {
    return (
      <div className="border border-green-300 bg-green-50 rounded-xl p-3 flex items-start gap-3">
        <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center flex-shrink-0">
          <FileText className="w-4 h-4 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs text-green-600 font-semibold">✅ Văn bản đã chọn</p>
          <p className="text-sm font-medium text-gray-800 truncate">
            {value.soHieu && <span className="text-gray-500 mr-1">{value.soHieu} —</span>}
            {value.trichYeu}
          </p>
          {(value.tenFile || value.kichThuocFile) && (
            <p className="text-xs text-gray-400 mt-0.5">
              📎 {value.tenFile} {value.kichThuocFile && `· ${formatSize(value.kichThuocFile)}`}
            </p>
          )}
        </div>
        <button onClick={handleClear} className="p-1 hover:bg-green-100 rounded-lg transition-colors flex-shrink-0">
          <X className="w-4 h-4 text-gray-400" />
        </button>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          value={query}
          onChange={(e) => handleInput(e.target.value)}
          onFocus={() => results.length && setOpen(true)}
          placeholder="Tìm theo số hiệu hoặc trích yếu văn bản..."
          className="w-full pl-9 pr-9 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-red-400 focus:ring-1 focus:ring-red-400"
        />
        {loading && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 animate-spin" />
        )}
      </div>

      {open && (
        <div className="absolute z-30 top-full mt-1 left-0 right-0 bg-white border border-gray-200 rounded-xl shadow-xl max-h-72 overflow-y-auto">
          {results.length === 0 ? (
            <div className="p-4 text-sm text-gray-400 text-center">
              Không tìm thấy văn bản.{' '}
              <a href="/bch/van-ban/create" target="_blank" rel="noopener noreferrer" className="text-red-600 hover:underline inline-flex items-center gap-1">
                Upload văn bản mới <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          ) : (
            results.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => handleSelect(item)}
                className="w-full flex items-start gap-3 px-4 py-3 hover:bg-gray-50 text-left transition-colors border-b border-gray-50 last:border-0"
              >
                <span className="text-xs font-bold bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded mt-0.5 flex-shrink-0">
                  {LOAI_LABELS[item.loaiVanBan] || '?'}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-800 line-clamp-1">
                    {item.soHieu && <span className="text-gray-400 mr-1">{item.soHieu} —</span>}
                    {item.trichYeu}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5 text-xs text-gray-400">
                    {item.ngayBanHanh && <span>{new Date(item.ngayBanHanh).toLocaleDateString('vi-VN')}</span>}
                    {item.kichThuocFile && <span>{formatSize(item.kichThuocFile)}</span>}
                    {item.tenFile && <span className="uppercase font-medium">{item.loaiFile}</span>}
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default VanBanSearchBox;
