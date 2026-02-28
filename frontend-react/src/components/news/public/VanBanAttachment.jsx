import { FileText, Download, Eye } from 'lucide-react';
import vanBanService from '../../../services/vanBanService';

const formatSize = (bytes) => {
  if (!bytes) return '';
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

/**
 * Khối văn bản đính kèm hiển thị trong bài viết chi tiết.
 */
const VanBanAttachment = ({ vanBan }) => {
  if (!vanBan) return null;

  const handleDownload = async () => {
    try {
      const blob = await vanBanService.taiVe(vanBan.id);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = vanBan.tenFile || `van-ban-${vanBan.id}`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      /* handled globally */
    }
  };

  return (
    <div className="mt-6 border border-blue-200 bg-blue-50 rounded-xl p-4">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
          <FileText className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-blue-500 uppercase tracking-wide mb-0.5">
            Văn bản đính kèm
          </p>
          {vanBan.soHieu && (
            <p className="text-xs text-gray-500 font-mono">{vanBan.soHieu}</p>
          )}
          <p className="font-medium text-gray-900 text-sm mt-0.5">{vanBan.trichYeu}</p>
          {vanBan.tenFile && (
            <p className="text-xs text-gray-400 mt-1">
              📎 {vanBan.tenFile}
              {vanBan.kichThuocFile && ` · ${formatSize(vanBan.kichThuocFile)}`}
            </p>
          )}
        </div>
        {vanBan.tenFile && (
          <div className="flex items-center gap-1 flex-shrink-0">
            <button
              onClick={() => window.open(vanBanService.getXemUrl(vanBan.id), '_blank')}
              className="flex items-center gap-1.5 text-xs bg-white border border-blue-300 text-blue-700 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors font-medium"
            >
              <Eye className="w-3.5 h-3.5" /> Xem
            </button>
            <button
              onClick={handleDownload}
              className="flex items-center gap-1.5 text-xs bg-blue-600 text-white hover:bg-blue-700 px-3 py-1.5 rounded-lg transition-colors font-medium"
            >
              <Download className="w-3.5 h-3.5" /> Tải về
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default VanBanAttachment;
