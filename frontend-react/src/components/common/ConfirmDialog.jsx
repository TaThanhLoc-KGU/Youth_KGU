import { AlertTriangle, Trash2, Loader2 } from 'lucide-react';

const ConfirmDialog = ({
  isOpen,
  onClose,
  onConfirm,
  title = 'Xác nhận xóa',
  description,
  confirmLabel = 'Xóa',
  cancelLabel = 'Hủy',
  variant = 'danger',
  isLoading = false,
}) => {
  if (!isOpen) return null;

  const isDanger = variant === 'danger';

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/40 backdrop-blur-[2px]"
      onClick={(e) => { if (e.target === e.currentTarget && !isLoading) onClose(); }}
    >
      <div
        className="bg-white rounded-2xl w-full max-w-sm animate-slide-up"
        style={{ boxShadow: '0 20px 60px -10px rgba(15,23,42,0.25), 0 0 0 1px rgba(15,23,42,0.06)' }}
      >
        <div className="p-5">
          {/* Icon */}
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 ring-1 ${
            isDanger
              ? 'bg-red-50 text-red-600 ring-red-100'
              : 'bg-amber-50 text-amber-600 ring-amber-100'
          }`}>
            {isDanger
              ? <Trash2 className="w-4.5 h-4.5" />
              : <AlertTriangle className="w-4.5 h-4.5" />
            }
          </div>

          <h3 className="text-[15px] font-semibold text-slate-900 mb-1.5">{title}</h3>
          {description && (
            <p className="text-sm text-slate-500 leading-relaxed">{description}</p>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2 px-5 pb-5">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="flex-1 h-9 px-4 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-all disabled:opacity-50 active:scale-[0.97]"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className={`flex-1 h-9 flex items-center justify-center gap-1.5 px-4 text-sm font-medium text-white rounded-lg transition-all shadow-sm disabled:opacity-60 active:scale-[0.97] ${
              isDanger
                ? 'bg-red-600 hover:bg-red-700'
                : 'bg-amber-500 hover:bg-amber-600'
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
