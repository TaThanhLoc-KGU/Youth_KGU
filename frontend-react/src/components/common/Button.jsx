import { forwardRef } from 'react';
import { Loader2 } from 'lucide-react';
import clsx from 'clsx';

const Button = forwardRef(
  ({
    children, variant = 'primary', size = 'md',
    isLoading = false, disabled = false,
    icon: Icon, iconPosition = 'left',
    fullWidth = false, className, ...props
  }, ref) => {
    const hasChildren = children !== undefined && children !== null && children !== '';
    const iconOnly = Icon && !hasChildren && !isLoading;

    const base = 'inline-flex items-center justify-center font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:pointer-events-none disabled:opacity-50 rounded-lg';

    const variants = {
      primary:        'bg-primary text-white hover:bg-primary-600 focus:ring-primary/40',
      secondary:      'bg-gray-100 text-gray-800 hover:bg-gray-200 focus:ring-gray-300',
      outline:        'border border-primary text-primary hover:bg-primary hover:text-white focus:ring-primary/40',
      danger:         'bg-red-600 text-white hover:bg-red-700 focus:ring-red-400',
      success:        'bg-green-600 text-white hover:bg-green-700 focus:ring-green-400',
      warning:        'bg-amber-500 text-white hover:bg-amber-600 focus:ring-amber-400',
      ghost:          'bg-transparent text-gray-600 hover:bg-gray-100 hover:text-gray-900 focus:ring-gray-300',
      'danger-ghost': 'bg-transparent text-red-500 hover:bg-red-50 hover:text-red-700 focus:ring-red-300',
    };

    const sizes = {
      xs: iconOnly ? 'p-1'     : 'px-2 py-1 text-xs',
      sm: iconOnly ? 'p-1.5'   : 'px-3 py-1.5 text-xs',
      md: iconOnly ? 'p-2'     : 'px-4 py-2 text-sm',
      lg: iconOnly ? 'p-2.5'   : 'px-5 py-2.5 text-base',
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={clsx(base, variants[variant] ?? variants.primary, sizes[size], fullWidth && 'w-full', className)}
        {...props}
      >
        {isLoading && <Loader2 className={clsx('animate-spin', hasChildren ? 'mr-1.5' : '', 'w-4 h-4')} />}
        {!isLoading && Icon && iconPosition === 'left' && (
          <Icon className={clsx('w-4 h-4', hasChildren && 'mr-1.5')} />
        )}
        {children}
        {!isLoading && Icon && iconPosition === 'right' && (
          <Icon className={clsx('w-4 h-4', hasChildren && 'ml-1.5')} />
        )}
      </button>
    );
  }
);
Button.displayName = 'Button';
export default Button;
