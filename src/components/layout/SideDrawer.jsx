import { useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';

/**
 * @typedef {Object} SideDrawerProps
 * @property {boolean}   isOpen         - Whether the drawer is visible
 * @property {Function}  onClose        - Handler to close the drawer
 * @property {Function}  [onExportDSR]  - Export DSR action
 * @property {Function}  [onMonthlyReport] - Monthly Report action
 * @property {Function}  [onLogout]     - Logout action
 */

/** Right-side slide-out drawer with navigation links. */
export default function SideDrawer({
  isOpen,
  onClose,
  onExportDSR,
  onMonthlyReport,
  onLogout,
}) {
  const overlayRef = useRef(null);

  // Close on Escape
  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === 'Escape') onClose();
    },
    [onClose],
  );

  useEffect(() => {
    if (!isOpen) return;
    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, handleKeyDown]);

  if (!isOpen) return null;

  const handleOverlayClick = (e) => {
    if (e.target === overlayRef.current) onClose();
  };

  /**
   * Menu item wrapper – calls the action and closes the drawer.
   */
  const handleAction = (action) => () => {
    action?.();
    onClose();
  };

  return (
    <div
      ref={overlayRef}
      onClick={handleOverlayClick}
      className="fixed inset-0 z-50 bg-black/50 animate-fade-in"
      aria-label="Navigation drawer overlay"
    >
      {/* Drawer panel */}
      <aside
        role="navigation"
        aria-label="Main navigation"
        className="absolute right-0 top-0 h-full w-[260px] bg-adani-navyDark shadow-lg animate-slide-in flex flex-col"
      >
        {/* Header */}
        <div className="flex h-16 items-center justify-between px-5">
          <span className="text-base font-bold text-white">DSR Manager</span>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close navigation menu"
            className="flex h-8 w-8 items-center justify-center rounded-md text-white transition-colors hover:bg-adani-navyLight focus:outline-none focus:ring-2 focus:ring-white/40"
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

        {/* Divider */}
        <div className="mx-4 border-t border-white/20" />

        {/* Menu items */}
        <nav className="mt-2 flex flex-col gap-0.5 px-2">
          {/* Export DSR */}
          <button
            type="button"
            onClick={handleAction(onExportDSR)}
            aria-label="Export DSR"
            className="flex h-12 items-center gap-3 rounded-md px-3 text-[15px] font-medium text-white transition-colors hover:bg-adani-navyLight focus:outline-none focus:ring-2 focus:ring-white/40"
          >
            <svg className="h-5 w-5 shrink-0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
            Export DSR
          </button>

          {/* Monthly Report */}
          <button
            type="button"
            onClick={handleAction(onMonthlyReport)}
            aria-label="Monthly Report"
            className="flex h-12 items-center gap-3 rounded-md px-3 text-[15px] font-medium text-white transition-colors hover:bg-adani-navyLight focus:outline-none focus:ring-2 focus:ring-white/40"
          >
            <svg className="h-5 w-5 shrink-0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <line x1="18" y1="20" x2="18" y2="10" />
              <line x1="12" y1="20" x2="12" y2="4" />
              <line x1="6" y1="20" x2="6" y2="14" />
            </svg>
            Monthly Report
          </button>

          {/* Settings */}
          <Link
            to="/settings"
            onClick={onClose}
            aria-label="Settings"
            className="flex h-12 items-center gap-3 rounded-md px-3 text-[15px] font-medium text-white transition-colors hover:bg-adani-navyLight focus:outline-none focus:ring-2 focus:ring-white/40"
          >
            <svg className="h-5 w-5 shrink-0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
            Settings
          </Link>

          {/* Logout */}
          <button
            type="button"
            onClick={handleAction(onLogout)}
            aria-label="Logout"
            className="flex h-12 items-center gap-3 rounded-md px-3 text-[15px] font-medium text-white transition-colors hover:bg-adani-navyLight focus:outline-none focus:ring-2 focus:ring-white/40"
          >
            <svg className="h-5 w-5 shrink-0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            Logout
          </button>
        </nav>
      </aside>
    </div>
  );
}
