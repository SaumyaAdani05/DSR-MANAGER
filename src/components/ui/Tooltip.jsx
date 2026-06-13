import { useState, useRef, useEffect } from 'react';

/**
 * Simple tooltip component triggered by hover/focus.
 *
 * @param {string}          text      — Tooltip content
 * @param {'top'|'bottom'}  position  — Tooltip direction
 * @param {React.ReactNode} children  — Trigger element
 */
export default function Tooltip({
  text,
  position = 'top',
  children,
  className = '',
}) {
  const [visible, setVisible] = useState(false);
  const timeoutRef = useRef(null);

  const show = () => {
    clearTimeout(timeoutRef.current);
    setVisible(true);
  };

  const hide = () => {
    timeoutRef.current = setTimeout(() => setVisible(false), 100);
  };

  useEffect(() => () => clearTimeout(timeoutRef.current), []);

  const posClasses =
    position === 'bottom'
      ? 'top-full mt-2 left-1/2 -translate-x-1/2'
      : 'bottom-full mb-2 left-1/2 -translate-x-1/2';

  return (
    <span
      className={`relative inline-flex ${className}`}
      onMouseEnter={show}
      onMouseLeave={hide}
      onFocus={show}
      onBlur={hide}
    >
      {children}
      {visible && text && (
        <span
          role="tooltip"
          className={`absolute z-50 whitespace-nowrap rounded-md bg-gray-900 px-2.5 py-1.5 text-xs font-medium text-white shadow-lg pointer-events-none animate-fade-in ${posClasses}`}
        >
          {text}
          {/* Arrow */}
          <span
            className={`absolute left-1/2 -translate-x-1/2 h-0 w-0 border-x-4 border-x-transparent ${
              position === 'bottom'
                ? '-top-1 border-b-4 border-b-gray-900'
                : '-bottom-1 border-t-4 border-t-gray-900'
            }`}
          />
        </span>
      )}
    </span>
  );
}
