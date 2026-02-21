import clsx from 'clsx';

const Badge = ({ children, variant = 'primary', size = 'md', className, dot = false }) => {
  const baseStyles = 'badge';

  const variants = {
    primary: 'badge-primary',
    success: 'badge-success',
    warning: 'badge-warning',
    danger: 'badge-danger',
    info: 'badge-info',
    gray: 'bg-gray-100 text-gray-800',
  };

  const sizes = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-0.5 text-xs',
    lg: 'px-3 py-1 text-sm',
  };

  const classes = clsx(baseStyles, variants[variant], sizes[size], className);

  return (
    <span className={classes}>
      {dot && (
        <span
          className={clsx(
            'w-1.5 h-1.5 rounded-full mr-1.5 inline-block',
            variant === 'success' && 'bg-green-600',
            variant === 'warning' && 'bg-yellow-600',
            variant === 'danger' && 'bg-red-600',
            variant === 'info' && 'bg-blue-600',
            variant === 'primary' && 'bg-primary-600',
            variant === 'gray' && 'bg-gray-600'
          )}
        />
      )}
      {children}
    </span>
  );
};

export default Badge;
