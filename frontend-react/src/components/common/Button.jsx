import { forwardRef } from 'react';
import { Loader2 } from 'lucide-react';
import clsx from 'clsx';

const Button = forwardRef(
  (
    {
      children,
      variant = 'primary',
      size = 'md',
      isLoading = false,
      disabled = false,
      icon: Icon,
      iconPosition = 'left',
      fullWidth = false,
      className,
      ...props
    },
    ref
  ) => {
    const baseStyles = 'btn';

    const variants = {
      primary: 'btn-primary',
      secondary: 'btn-secondary',
      outline: 'btn-outline',
      danger: 'btn-error',
      success: 'btn-success',
      warning: 'btn-warning',
      ghost: 'btn-ghost',
    };

    const sizes = {
      sm: 'btn-sm',
      md: 'btn-md',
      lg: 'btn-lg',
      xl: 'btn-lg',
    };

    const classes = clsx(
      baseStyles,
      variants[variant],
      sizes[size],
      fullWidth && 'w-full',
      (disabled || isLoading) && 'opacity-50 cursor-not-allowed',
      className
    );

    return (
      <button
        ref={ref}
        className={classes}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading && (
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
        )}
        {Icon && iconPosition === 'left' && !isLoading && (
          <Icon className="w-4 h-4 mr-2" />
        )}
        {children}
        {Icon && iconPosition === 'right' && !isLoading && (
          <Icon className="w-4 h-4 ml-2" />
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';

export default Button;
