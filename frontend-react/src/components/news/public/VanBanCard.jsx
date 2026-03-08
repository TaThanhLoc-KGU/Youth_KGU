import { FileText, Download, Eye, Calendar } from 'lucide-react';
import vanBanService from '../../../services/vanBanService';

const LOAI_LABELS = {
  KE_HOACH: 'Kế hoạch', CONG_VAN: 'Công văn', QUYET_DINH: 'Quyết định',
  THONG_BAO: 'Thông báo', BAO_CAO: 'Báo cáo', HUONG_DAN: 'Hướng dẫn',
  BIEN_BAN: 'Biên bản', TO_TRINH: 'Tờ trình', KHAC: 'Khác',
};

const LOAI_COLORS = {
  KE_HOACH: 'bg-blue-50 text-blue-700', CONG_VAN: 'bg-green-50 text-green-700',
  QUYET_DINH: 'bg-purple-50 text-purple-700', THONG_BAO: 'bg-yellow-50 text-yellow-700',
  BAO_CAO: 'bg-orange-50 text-orange-700', HUONG_DAN: 'bg-teal-50 text-teal-700',
  BIEN_BAN: 'bg-gray-50 text-gray-700', TO_TRINH: 'bg-indigo-50 text-indigo-700',
  KHAC: 'bg-gray-50 text-gray-600',
};

const formatSize = (bytes) => {
  if (!bytes) return '';
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const VanBanCard = ({ vanBan }) => {
  const handleDownload = async () => {
    try {
      const blob = await vanBanService.taiVe(vanBan.id);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = vanBan.tenFile || `van-ban-${vanBan.id}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      /* handled by api interceptor */
    }
  };

  const handleView = () => {
    window.open(vanBanService.getXemUrl(vanBan.id), '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="flex items-start gap-4 bg-white rounded-xl border border-gray-100 shadow-sm p-4 hover:shadow-md transition-shadow">
      <div className="flex-shrink-0 w-10 h-10 bg-enews-50 rounded-lg flex items-center justify-center">
        <FileText className="w-5 h-5 text-enews-500" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2 flex-wrap">
          <div className="min-w-0">
            {vanBan.soHieu && (
              <span className="text-xs font-mono text-gray-500 mr-2">{vanBan.soHieu}</span>
            )}
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${LOAI_COLORS[vanBan.loaiVanBan] || 'bg-gray-50 text-gray-600'}`}>
              {LOAI_LABELS[vanBan.loaiVanBan] || vanBan.loaiVanBan}
            </span>
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            {vanBan.tenFile && (
              <button
                onClick={handleView}
                className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                title="Xem online"
              >
                <Eye className="w-4 h-4" />
              </button>
            )}
            {vanBan.tenFile && (
              <button
                onClick={handleDownload}
                className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                title="Tải về"
              >
                <Download className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
        <h3 className="mt-1 text-sm font-semibold text-gray-800 line-clamp-2">{vanBan.trichYeu}</h3>
        <div className="mt-1.5 flex items-center gap-3 text-xs text-gray-400 flex-wrap">
          {vanBan.ngayBanHanh && (
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {new Date(vanBan.ngayBanHanh).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })}
            </span>
          )}
          {vanBan.kichThuocFile && (
            <span>{formatSize(vanBan.kichThuocFile)}</span>
          )}
          {vanBan.tenFile && (
            <span className="uppercase font-medium text-gray-500">{vanBan.loaiFile}</span>
          )}
        </div>
      </div>
    </div>
  );
};

export default VanBanCard;
