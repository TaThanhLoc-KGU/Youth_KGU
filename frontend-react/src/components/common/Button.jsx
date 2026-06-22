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

    const base = 'inline-flex items-center justify-center font-medium transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:pointer-events-none disabled:opacity-50 rounded-lg active:scale-[0.97]';

    const variants = {
      primary:        'bg-primary text-white hover:bg-primary-600 focus:ring-primary/40 shadow-sm',
      secondary:      'bg-slate-100 text-slate-700 hover:bg-slate-200 focus:ring-slate-300',
      outline:        'border border-slate-300 text-slate-700 bg-white hover:bg-slate-50 hover:border-slate-400 focus:ring-slate-300',
      danger:         'bg-red-600 text-white hover:bg-red-700 focus:ring-red-400 shadow-sm',
      success:        'bg-emerald-600 text-white hover:bg-emerald-700 focus:ring-emerald-400 shadow-sm',
      warning:        'bg-amber-500 text-white hover:bg-amber-600 focus:ring-amber-400 shadow-sm',
      ghost:          'text-slate-600 hover:bg-slate-100 hover:text-slate-900 focus:ring-slate-300',
      'danger-ghost': 'text-red-500 hover:bg-red-50 hover:text-red-700 focus:ring-red-300',
      'primary-ghost':'text-primary hover:bg-primary/10 focus:ring-primary/30',
    };

    const sizes = {
      xs: iconOnly ? 'p-1'     : 'h-6  px-2    text-[11px] gap-1',
      sm: iconOnly ? 'p-1.5'   : 'h-7  px-2.5  text-xs gap-1',
      md: iconOnly ? 'p-2'     : 'h-9  px-3.5  text-sm gap-1.5',
      lg: iconOnly ? 'p-2.5'   : 'h-10 px-5    text-sm gap-2',
    };

    const iconSize = {
      xs: 'w-3 h-3',
      sm: 'w-3.5 h-3.5',
      md: 'w-4 h-4',
      lg: 'w-4.5 h-4.5',
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={clsx(base, variants[variant] ?? variants.primary, sizes[size], fullWidth && 'w-full', className)}
        {...props}
      >
        {isLoading && <Loader2 className={clsx('animate-spin flex-shrink-0', iconSize[size])} />}
        {!isLoading && Icon && iconPosition === 'left' && (
          <Icon className={clsx('flex-shrink-0', iconSize[size])} />
        )}
        {children}
        {!isLoading && Icon && iconPosition === 'right' && (
          <Icon className={clsx('flex-shrink-0', iconSize[size])} />
        )}
      </button>
    );
  }
);
Button.displayName = 'Button';
export default Button;
