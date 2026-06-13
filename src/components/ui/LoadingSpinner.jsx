/**
 * Reusable branded loading spinner.
 *
 * @param {'sm'|'md'|'lg'} size  — Spinner diameter
 * @param {string}         label — Screen-reader text
 */
const SIZE_MAP = {
  sm: 'h-5 w-5',
  md: 'h-10 w-10',
  lg: 'h-14 w-14',
};

export default function LoadingSpinner({
  size = 'md',
  label = 'Loading…',
  className = '',
}) {
  return (
    <div
      role="status"
      aria-label={label}
      className={`flex items-center justify-center ${className}`}
    >
      <svg
        className={`animate-spin ${SIZE_MAP[size] ?? SIZE_MAP.md} text-adani-navy`}
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <circle
          className="opacity-20"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        />
        <path
          className="opacity-80"
          fill="currentColor"
          d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
        />
      </svg>
      <span className="sr-only">{label}</span>
    </div>
  );
}
