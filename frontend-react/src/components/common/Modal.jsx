import { useEffect } from 'react';
import { X } from 'lucide-react';
import clsx from 'clsx';
import Button from './Button';

const Modal = ({
  isOpen,
  onClose,
  title,
  children,
  footer,
  size = 'md',
  showCloseButton = true,
  closeOnBackdropClick = true,
  closeOnEsc = true,
}) => {
  useEffect(() => {
    if (!isOpen) return;

    // Prevent body scroll when modal is open
    document.body.style.overflow = 'hidden';

    // Close on Escape key
    const handleEscape = (e) => {
      if (closeOnEsc && e.key === 'Escape') {
        onClose();
      }
    };

    if (closeOnEsc) {
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.body.style.overflow = '';
      if (closeOnEsc) {
        document.removeEventListener('keydown', handleEscape);
      }
    };
  }, [isOpen, onClose, closeOnEsc]);

  if (!isOpen) return null;

  const sizes = {
    sm: 'max-w-md',
    md: 'max-w-2xl',
    lg: 'max-w-4xl',
    xl: 'max-w-6xl',
    full: 'max-w-full mx-4',
  };

  const handleBackdropClick = (e) => {
    if (closeOnBackdropClick && e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 animate-fade-in"
      onClick={handleBackdropClick}
    >
      <div
        className={clsx(
          'modal-box w-full',
          sizes[size],
          'max-h-[90vh] flex flex-col animate-fade-in'
        )}
      >
        {/* Header */}
        {(title || showCloseButton) && (
          <div className="flex items-center justify-between">
            {title && <h2 className="text-xl font-bold">{title}</h2>}
            {showCloseButton && (
              <button
                onClick={onClose}
                className="btn btn-sm btn-circle btn-ghost"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        )}

        {/* Body */}
        <div className="flex-1 overflow-y-auto">{children}</div>

        {/* Footer */}
        {footer && (
          <div className="modal-action">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};

export default Modal;
