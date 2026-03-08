import { useState, useRef, useEffect } from 'react';
import { Search, Calendar, X, Loader2, CheckCircle } from 'lucide-react';
import activityService from '../../../services/activityService';

const STATUS_LABELS = {
  SAP_DIEN_RA:   'Sắp diễn ra',
  MO_DANG_KY:    'Mở đăng ký',
  DONG_DANG_KY:  'Đóng đăng ký',
  DANG_DIEN_RA:  'Đang diễn ra',
  KET_THUC:      'Đã kết thúc',
  DA_HUY:        'Đã hủy',
};
const STATUS_COLORS = {
  SAP_DIEN_RA:  'bg-blue-100 text-blue-700',
  MO_DANG_KY:   'bg-green-100 text-green-700',
  DONG_DANG_KY: 'bg-gray-100 text-gray-600',
  DANG_DIEN_RA: 'bg-green-100 text-green-700',
  KET_THUC:     'bg-gray-100 text-gray-500',
  DA_HUY:       'bg-red-100 text-red-600',
};

/**
 * HoatDongSearchBox — Autocomplete tìm kiếm hoạt động với debounce 300ms.
 *
 * Props:
 *  - value   : { maHoatDong, tenHoatDong, ... } | null
 *  - onChange : fn(activity | null)
 */
const HoatDongSearchBox = ({ value, onChange }) => {
  const [query, setQuery]     = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen]       = useState(false);
  const debounceRef  = useRef(null);
  const containerRef = useRef(null);

  // Close dropdown on outside click
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
        const data = await activityService.search(q.trim());
        setResults(Array.isArray(data) ? data.slice(0, 8) : []);
        setOpen(true);
      } catch {
        setResults([]);
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

  // ── Đã chọn → hiển thị card ──────────────────────────────────────────────
  if (value) {
    return (
      <div className="border border-blue-300 bg-blue-50 rounded-xl p-3 flex items-start gap-3">
        <CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <p className="text-xs text-blue-600 font-semibold">✅ Hoạt động đã chọn</p>
          <p className="text-sm font-medium text-gray-800 truncate">{value.tenHoatDong}</p>
          <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-gray-500">
            <span className="font-mono text-blue-700">{value.maHoatDong}</span>
            {value.ngayToChuc && (
              <span className="flex items-center gap-0.5">
                <Calendar className="w-3 h-3" />
                {new Date(value.ngayToChuc).toLocaleDateString('vi-VN')}
              </span>
            )}
            {value.trangThai && (
              <span className={`px-1.5 py-0.5 rounded text-xs ${STATUS_COLORS[value.trangThai] || 'bg-gray-100 text-gray-600'}`}>
                {STATUS_LABELS[value.trangThai] || value.trangThai}
              </span>
            )}
          </div>
        </div>
        <button
          type="button"
          onClick={handleClear}
          className="p-1 hover:bg-blue-100 rounded-lg transition-colors flex-shrink-0"
          title="Bỏ chọn"
        >
          <X className="w-4 h-4 text-gray-400" />
        </button>
      </div>
    );
  }

  // ── Chưa chọn → ô search ─────────────────────────────────────────────────
  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          value={query}
          onChange={(e) => handleInput(e.target.value)}
          onFocus={() => results.length > 0 && setOpen(true)}
          placeholder="Tìm tên hoặc mã hoạt động..."
          className="w-full pl-9 pr-9 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 focus:bg-white transition-colors"
        />
        {loading && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 animate-spin" />
        )}
      </div>

      {open && (
        <div className="absolute z-30 top-full mt-1 left-0 right-0 bg-white border border-gray-200 rounded-xl shadow-xl max-h-64 overflow-y-auto">
          {results.length === 0 ? (
            <div className="p-4 text-sm text-gray-400 text-center">
              Không tìm thấy hoạt động phù hợp.
            </div>
          ) : (
            results.map((item) => (
              <button
                key={item.maHoatDong}
                type="button"
                onClick={() => handleSelect(item)}
                className="w-full flex items-start gap-3 px-4 py-3 hover:bg-blue-50 text-left transition-colors border-b border-gray-50 last:border-0"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 line-clamp-1">{item.tenHoatDong}</p>
                  <div className="flex flex-wrap items-center gap-2 mt-0.5 text-xs text-gray-400">
                    <span className="font-mono text-blue-600 font-semibold">{item.maHoatDong}</span>
                    {item.ngayToChuc && (
                      <span className="flex items-center gap-0.5">
                        <Calendar className="w-3 h-3" />
                        {new Date(item.ngayToChuc).toLocaleDateString('vi-VN')}
                      </span>
                    )}
                    {item.trangThai && (
                      <span className={`px-1.5 py-0.5 rounded ${STATUS_COLORS[item.trangThai] || 'bg-gray-100 text-gray-600'}`}>
                        {STATUS_LABELS[item.trangThai] || item.trangThai}
                      </span>
                    )}
                    {item.diaDiem && (
                      <span className="truncate max-w-[120px]">📍 {item.diaDiem}</span>
                    )}
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

export default HoatDongSearchBox;
