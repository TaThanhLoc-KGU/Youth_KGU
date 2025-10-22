import clsx from 'clsx';

const Badge = ({ children, variant = 'primary', size = 'md', className, dot = false }) => {
  const baseStyles = 'badge';

  const variants = {
    primary: 'badge-primary',
    success: 'badge-success',
    warning: 'badge-warning',
    danger: 'badge-error',
    info: 'badge-info',
    gray: 'badge-neutral',
  };

  const sizes = {
    sm: 'badge-sm',
    md: 'badge-md',
    lg: 'badge-lg',
  };

  const classes = clsx(baseStyles, variants[variant], sizes[size], className);

  return (
    <span className={classes}>
      {dot && <span className="inline-block w-2 h-2 mr-2 rounded-full bg-current" />}
      {children}
    </span>
  );
};

export default Badge;
