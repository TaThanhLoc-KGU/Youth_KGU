import clsx from 'clsx';

const VARIANTS = {
  primary: 'bg-primary/10 text-primary ring-1 ring-inset ring-primary/20',
  success: 'bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/20',
  warning: 'bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-600/20',
  danger:  'bg-red-50 text-red-700 ring-1 ring-inset ring-red-600/20',
  info:    'bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-600/20',
  gray:    'bg-slate-100 text-slate-600 ring-1 ring-inset ring-slate-400/20',
  purple:  'bg-purple-50 text-purple-700 ring-1 ring-inset ring-purple-600/20',
};

const DOT_COLORS = {
  primary: 'bg-primary',
  success: 'bg-emerald-500',
  warning: 'bg-amber-500',
  danger:  'bg-red-500',
  info:    'bg-blue-500',
  gray:    'bg-slate-400',
  purple:  'bg-purple-500',
};

const SIZES = {
  sm: 'px-1.5 py-px text-[10px]',
  md: 'px-2 py-0.5 text-xs',
  lg: 'px-2.5 py-1 text-sm',
};

const Badge = ({ children, variant = 'primary', size = 'md', className, dot = false }) => (
  <span className={clsx(
    'inline-flex items-center rounded-md font-semibold',
    VARIANTS[variant] ?? VARIANTS.gray,
    SIZES[size],
    className,
  )}>
    {dot && (
      <span className={clsx('w-1.5 h-1.5 rounded-full mr-1.5 flex-shrink-0', DOT_COLORS[variant] ?? DOT_COLORS.gray)} />
    )}
    {children}
  </span>
);

export default Badge;
