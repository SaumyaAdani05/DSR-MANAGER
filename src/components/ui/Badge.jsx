const VARIANT_CLASSES = {
  success: 'bg-green-50 text-[#16A34A]',
  warning: 'bg-amber-50 text-[#D97706]',
  error: 'bg-red-50 text-[#DC2626]',
  info: 'bg-blue-50 text-adani-navy',
  locked: 'bg-gray-100 text-[#9CA3AF]',
};

/**
 * Small badge/pill component for status indicators.
 *
 * @param {string} text    - Display text
 * @param {'success'|'warning'|'error'|'info'|'locked'} variant - Color variant
 */
export default function Badge({ text, variant = 'info', className = '' }) {
  return (
    <span
      aria-label={text}
      className={[
        'inline-flex items-center rounded-full px-2.5 py-0.5',
        'text-xs font-medium leading-none whitespace-nowrap',
        VARIANT_CLASSES[variant] ?? VARIANT_CLASSES.info,
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {text}
    </span>
  );
}
