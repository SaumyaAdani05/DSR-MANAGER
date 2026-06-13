import { forwardRef, useId } from 'react';

/**
 * Reusable Input component with label, error, icon, and auto-fill styling.
 *
 * @param {string}   label       - Label text shown above input
 * @param {string}   error       - Error message shown below in red
 * @param {boolean}  autoFilled  - Renders value in grey italic (carryover style)
 * @param {React.ReactNode} icon      - Left icon element
 * @param {React.ReactNode} rightIcon - Right icon element (e.g. show/hide password)
 */
const Input = forwardRef(function Input(
  {
    label,
    value,
    onChange,
    onBlur,
    type = 'text',
    placeholder,
    error,
    disabled = false,
    readOnly = false,
    className = '',
    icon,
    rightIcon,
    autoFilled = false,
    id: externalId,
    ...rest
  },
  ref,
) {
  const generatedId = useId();
  const inputId = externalId ?? generatedId;
  const errorId = error ? `${inputId}-error` : undefined;

  const isNumber = type === 'number';

  return (
    <div className={['flex flex-col gap-1', className].filter(Boolean).join(' ')}>
      {label && (
        <label
          htmlFor={inputId}
          className="text-xs font-medium text-adani-gray"
        >
          {label}
        </label>
      )}

      <div className="relative">
        {/* Left icon */}
        {icon && (
          <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-adani-gray">
            {icon}
          </span>
        )}

        <input
          ref={ref}
          id={inputId}
          type={type}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          placeholder={placeholder}
          disabled={disabled}
          readOnly={readOnly}
          aria-label={label ?? placeholder}
          aria-invalid={!!error}
          aria-describedby={errorId}
          className={[
            // Base sizing
            'h-10 w-full rounded-md px-3 text-sm',
            'border transition-all duration-150',
            'placeholder:text-[#9CA3AF]',
            'font-sans',
            // Icon padding
            icon ? 'pl-9' : '',
            rightIcon ? 'pr-9' : '',
            // Number right-align
            isNumber ? 'text-right' : '',
            // Auto-filled carryover style
            autoFilled ? 'italic text-adani-gray' : 'text-[#111827]',
            // States
            error
              ? 'border-[#DC2626] ring-2 ring-[#DC2626]/30'
              : 'border-adani-border',
            disabled || readOnly
              ? 'bg-[#F3F4F6] text-adani-gray cursor-not-allowed'
              : 'bg-white',
            // Focus (only when not disabled/readOnly and no error)
            !(disabled || readOnly) && !error
              ? 'focus:border-adani-navy focus:ring-2 focus:ring-adani-navy/40 focus:outline-none'
              : 'focus:outline-none',
          ]
            .filter(Boolean)
            .join(' ')}
          {...rest}
        />

        {/* Right icon */}
        {rightIcon && (
          <span className="absolute inset-y-0 right-3 flex items-center text-adani-gray">
            {rightIcon}
          </span>
        )}
      </div>

      {/* Error message */}
      {error && (
        <p
          id={errorId}
          role="alert"
          className="text-xs font-medium text-[#DC2626]"
        >
          {error}
        </p>
      )}
    </div>
  );
});

export default Input;
