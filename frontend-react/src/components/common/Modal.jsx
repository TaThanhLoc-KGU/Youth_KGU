import { useEffect } from 'react';
import { X } from 'lucide-react';

const ICON_COLORS = {
  blue:   'bg-blue-50 text-blue-600 ring-1 ring-blue-100',
  red:    'bg-red-50 text-red-600 ring-1 ring-red-100',
  green:  'bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100',
  amber:  'bg-amber-50 text-amber-600 ring-1 ring-amber-100',
  primary:'bg-primary/10 text-primary ring-1 ring-primary/20',
};

const SIZES = {
  sm:   'max-w-sm',
  md:   'max-w-lg',
  lg:   'max-w-2xl',
  xl:   'max-w-4xl',
  full: 'max-w-full mx-4',
};

const Modal = ({
  isOpen, onClose, title, subtitle, children, footer,
  size = 'md', showCloseButton = true,
  closeOnBackdropClick = true, closeOnEsc = true,
  icon: Icon, iconColor = 'primary',
}) => {
  useEffect(() => {
    if (!isOpen) return;
    document.body.style.overflow = 'hidden';
    const handler = (e) => { if (closeOnEsc && e.key === 'Escape') onClose(); };
    if (closeOnEsc) document.addEventListener('keydown', handler);
    return () => {
      document.body.style.overflow = '';
      if (closeOnEsc) document.removeEventListener('keydown', handler);
    };
  }, [isOpen, onClose, closeOnEsc]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-[2px]"
      onClick={(e) => { if (closeOnBackdropClick && e.target === e.currentTarget) onClose(); }}
    >
      <div
        className={`bg-white rounded-2xl w-full flex flex-col animate-slide-up max-h-[92vh] ${SIZES[size]}`}
        style={{ boxShadow: '0 20px 60px -10px rgba(15,23,42,0.25), 0 0 0 1px rgba(15,23,42,0.06)' }}
      >
        {/* ── Header ────────────────────────────────────────────────────── */}
        {(title || showCloseButton) && (
          <div className="flex items-start justify-between px-5 pt-4 pb-3.5 border-b border-slate-100 flex-shrink-0">
            <div className="flex items-start gap-3 min-w-0">
              {Icon && (
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${ICON_COLORS[iconColor] ?? ICON_COLORS.primary}`}>
                  <Icon className="w-4 h-4" />
                </div>
              )}
              <div className="min-w-0 pt-0.5">
                {title && (
                  <h2 className="text-[15px] font-semibold text-slate-900 leading-snug">
                    {title}
                  </h2>
                )}
                {subtitle && (
                  <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>
                )}
              </div>
            </div>
            {showCloseButton && (
              <button
                onClick={onClose}
                className="ml-3 flex-shrink-0 p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        )}

        {/* ── Body ──────────────────────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto px-5 py-4 custom-scrollbar">
          {children}
        </div>

        {/* ── Footer ────────────────────────────────────────────────────── */}
        {footer && (
          <div className="flex-shrink-0 px-5 py-3.5 border-t border-slate-100 bg-slate-50/50 rounded-b-2xl flex items-center justify-end gap-2">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};

export default Modal;
