import { AlertCircle, CheckCircle, Info, XCircle, X } from 'lucide-react';
import clsx from 'clsx';

const Alert = ({
  variant = 'info',
  title,
  children,
  onClose,
  className,
}) => {
  const icons = {
    success: CheckCircle,
    error: XCircle,
    warning: AlertCircle,
    info: Info,
  };

  const styles = {
    success: 'bg-emerald-50 border-emerald-200/60 text-emerald-800 ring-1 ring-inset ring-emerald-600/10',
    error:   'bg-red-50 border-red-200/60 text-red-800 ring-1 ring-inset ring-red-600/10',
    warning: 'bg-amber-50 border-amber-200/60 text-amber-800 ring-1 ring-inset ring-amber-600/10',
    info:    'bg-blue-50 border-blue-200/60 text-blue-800 ring-1 ring-inset ring-blue-600/10',
  };

  const Icon = icons[variant];

  return (
    <div
      className={clsx(
        'border rounded-xl p-4 flex items-start gap-3',
        styles[variant],
        className
      )}
      role="alert"
    >
      <Icon className="w-5 h-5 flex-shrink-0 mt-0.5" />
      <div className="flex-1">
        {title && <div className="font-medium mb-1">{title}</div>}
        <div className="text-sm">{children}</div>
      </div>
      {onClose && (
        <button
          onClick={onClose}
          className="flex-shrink-0 p-1 hover:bg-black/5 rounded transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};

export default Alert;
