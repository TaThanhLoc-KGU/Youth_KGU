import { forwardRef } from 'react';
import clsx from 'clsx';

const Input = forwardRef(
  (
    {
      label,
      error,
      helperText,
      leftIcon: LeftIcon,
      rightIcon: RightIcon,
      className,
      containerClassName,
      ...props
    },
    ref
  ) => {
    return (
      <div className={clsx('w-full', containerClassName)}>
        {label && (
          <label htmlFor={props.id} className="form-label">
            {label}
            {props.required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}
        <div className="relative">
          {LeftIcon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
              <LeftIcon className="w-5 h-5" />
            </div>
          )}
          <input
            ref={ref}
            className={clsx(
              'form-input',
              LeftIcon && 'pl-10',
              RightIcon && 'pr-10',
              error && 'border-red-500 focus:border-red-500 focus:ring-red-500',
              className
            )}
            {...props}
          />
          {RightIcon && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
              <RightIcon className="w-5 h-5" />
            </div>
          )}
        </div>
        {error && <p className="form-error">{error}</p>}
        {helperText && !error && (
          <p className="mt-1 text-xs text-gray-500">{helperText}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;
