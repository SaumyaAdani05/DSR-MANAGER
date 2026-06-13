import { forwardRef } from 'react';

const VARIANT_CLASSES = {
  primary:
    'bg-adani-red text-white hover:bg-adani-redDark focus-visible:ring-adani-red',
  secondary:
    'bg-white text-adani-navy border border-adani-border hover:bg-adani-navy/10 focus-visible:ring-adani-navy',
  danger:
    'bg-red-50 text-[#DC2626] hover:bg-red-100 focus-visible:ring-[#DC2626]',
  ghost:
    'bg-transparent text-adani-navy hover:bg-adani-lightGray focus-visible:ring-adani-navy',
};

/**
 * Reusable Button component with multiple visual variants.
 *
 * @param {'primary'|'secondary'|'danger'|'ghost'} variant - Visual style
 * @param {boolean}  loading  - Shows a spinner and disables interaction
 * @param {boolean}  disabled - Dims the button and blocks clicks
 * @param {string}   className - Extra Tailwind classes to merge
 */
const Button = forwardRef(function Button(
  {
    variant = 'primary',
    children,
    onClick,
    disabled = false,
    loading = false,
    className = '',
    type = 'button',
    ...rest
  },
  ref,
) {
  const isDisabled = disabled || loading;

  return (
    <button
      ref={ref}
      type={type}
      onClick={onClick}
      disabled={isDisabled}
      aria-label={typeof children === 'string' ? children : undefined}
      aria-busy={loading}
      className={[
        // Base
        'inline-flex items-center justify-center gap-2',
        'rounded-lg px-5 py-2.5',
        'text-sm font-semibold leading-none',
        'transition-all duration-150',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
        'select-none',
        // Active press
        'active:scale-[0.98]',
        // Variant
        VARIANT_CLASSES[variant] ?? VARIANT_CLASSES.primary,
        // Disabled / loading
        isDisabled && 'opacity-50 cursor-not-allowed pointer-events-none',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      {...rest}
    >
      {loading && (
        <svg
          className="h-4 w-4 animate-spin"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
          />
        </svg>
      )}
      {loading ? <span className="sr-only">Loading…</span> : children}
    </button>
  );
});

export default Button;
