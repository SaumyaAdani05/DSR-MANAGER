import { useEffect, useCallback, useRef } from 'react';

/**
 * Reusable Modal / Popup with backdrop blur, close-on-outside-click, and Escape key.
 *
 * @param {boolean}  isOpen   - Whether the modal is visible
 * @param {Function} onClose  - Callback to close the modal
 * @param {string}   title    - Header text (18px bold navy)
 * @param {string}   maxWidth - Max width of the modal card (default "480px")
 * @param {React.ReactNode} children - Modal body content
 */
export default function Modal({
  isOpen,
  onClose,
  title,
  children,
  maxWidth = '480px',
}) {
  const overlayRef = useRef(null);

  // Close on Escape key
  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === 'Escape') onClose();
    },
    [onClose],
  );

  useEffect(() => {
    if (!isOpen) return;

    document.addEventListener('keydown', handleKeyDown);
    // Prevent body scroll while modal is open
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, handleKeyDown]);

  if (!isOpen) return null;

  // Close when clicking the backdrop (not the card itself)
  const handleBackdropClick = (e) => {
    if (e.target === overlayRef.current) onClose();
  };

  return (
    <div
      ref={overlayRef}
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onClick={handleBackdropClick}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-[3px] p-4 animate-fade-in"
    >
      <div
        style={{ maxWidth }}
        className="relative w-full rounded-2xl bg-white p-8 shadow-xl animate-modal-in ring-1 ring-black/5"
      >
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-lg font-bold text-adani-navy tracking-tight">{title}</h2>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-adani-gray transition-all duration-150 hover:bg-adani-lightGray hover:text-adani-navy focus:outline-none focus:ring-2 focus:ring-adani-navy/40 active:scale-90"
          >
            <svg
              className="h-5 w-5"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Body */}
        {children}
      </div>
    </div>
  );
}
