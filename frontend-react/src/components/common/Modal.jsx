import { useEffect } from 'react';
import { X } from 'lucide-react';

const ICON_COLORS = {
  blue:  'bg-blue-50 text-blue-600',
  red:   'bg-red-50 text-red-600',
  green: 'bg-green-50 text-green-600',
  amber: 'bg-amber-50 text-amber-600',
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
  icon: Icon, iconColor = 'blue',
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
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={(e) => { if (closeOnBackdropClick && e.target === e.currentTarget) onClose(); }}
    >
      <div className={`bg-white rounded-2xl shadow-2xl w-full flex flex-col animate-slide-up max-h-[92vh] ${SIZES[size]}`}>

        {/* Header */}
        {(title || showCloseButton) && (
          <div className="flex items-start justify-between px-5 pt-4 pb-3.5 border-b border-gray-100 flex-shrink-0">
            <div className="flex items-start gap-3 min-w-0">
              {Icon && (
                <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${ICON_COLORS[iconColor]}`}>
                  <Icon className="w-4.5 h-4.5" />
                </div>
              )}
              <div className="min-w-0">
                {title && <h2 className="text-base font-semibold text-gray-900 leading-snug">{title}</h2>}
                {subtitle && <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>}
              </div>
            </div>
            {showCloseButton && (
              <button
                onClick={onClose}
                className="ml-3 flex-shrink-0 p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        )}

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-4">{children}</div>

        {/* Footer */}
        {footer && (
          <div className="flex-shrink-0 px-5 py-3.5 border-t border-gray-100 bg-gray-50/50 rounded-b-2xl flex items-center justify-end gap-2.5">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};

export default Modal;
