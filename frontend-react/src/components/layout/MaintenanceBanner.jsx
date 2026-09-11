import { AlertTriangle } from 'lucide-react';
import usePublicSettings from '../../hooks/usePublicSettings';

/**
 * Thanh cảnh báo chế độ bảo trì — hiện khi feature-flag hethong.bao_tri = true.
 * Chỉ hiển thị; backend (MaintenanceModeFilter) mới là chỗ thực sự chặn API của user không phải admin.
 */
export default function MaintenanceBanner() {
  const { isOn, getVal } = usePublicSettings();
  if (!isOn('hethong.bao_tri')) return null;

  return (
    <div className="sticky top-0 z-50 bg-amber-500 text-white text-sm px-4 py-2 flex items-center justify-center gap-2 shadow">
      <AlertTriangle className="w-4 h-4 shrink-0" />
      <span className="font-medium">
        {getVal('hethong.bao_tri_thong_bao', 'Hệ thống đang bảo trì.')}
      </span>
    </div>
  );
}
