import { AlertTriangle, Trash2, Loader2 } from 'lucide-react';

/**
 * ConfirmDialog — dùng thay window.confirm() cho thao tác xóa/nguy hiểm.
 *
 * Usage:
 *   const [confirmState, setConfirmState] = useState(null);
 *
 *   // Trigger:
 *   setConfirmState({ id: row.id, name: row.name });
 *
 *   // In JSX:
 *   <ConfirmDialog
 *     isOpen={!!confirmState}
 *     onClose={() => setConfirmState(null)}
 *     onConfirm={() => { deleteMutation.mutate(confirmState.id); setConfirmState(null); }}
 *     title="Xóa sinh viên"
 *     description={`Bạn có chắc chắn muốn xóa "${confirmState?.name}"? Hành động này không thể hoàn tác.`}
 *     isLoading={deleteMutation.isPending}
 *   />
 */
const ConfirmDialog = ({
  isOpen,
  onClose,
  onConfirm,
  title = 'Xác nhận xóa',
  description,
  confirmLabel = 'Xóa',
  cancelLabel = 'Hủy',
  variant = 'danger',   // 'danger' | 'warning'
  isLoading = false,
}) => {
  if (!isOpen) return null;

  const isDanger = variant === 'danger';

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget && !isLoading) onClose(); }}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm animate-slide-up">
        <div className="p-5">
          {/* Icon */}
          <div className={`w-11 h-11 rounded-full flex items-center justify-center mb-4 ${
            isDanger ? 'bg-red-50' : 'bg-amber-50'
          }`}>
            {isDanger
              ? <Trash2 className="w-5 h-5 text-red-600" />
              : <AlertTriangle className="w-5 h-5 text-amber-600" />
            }
          </div>

          {/* Text */}
          <h3 className="text-base font-semibold text-gray-900 mb-1.5">{title}</h3>
          {description && <p className="text-sm text-gray-500 leading-relaxed">{description}</p>}
        </div>

        {/* Actions */}
        <div className="flex gap-2.5 px-5 pb-5">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className={`flex-1 flex items-center justify-center gap-1.5 px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors disabled:opacity-60 ${
              isDanger ? 'bg-red-600 hover:bg-red-700' : 'bg-amber-500 hover:bg-amber-600'
            }`}
          >
            {isLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;
