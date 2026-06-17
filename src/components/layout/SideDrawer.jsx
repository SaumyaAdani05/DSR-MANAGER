import { useEffect, useCallback, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';

/**
 * Right-side slide-out drawer with navigation links.
 * Features active-page highlighting and smooth transitions.
 */
export default function SideDrawer({
  isOpen,
  onClose,
  onExportDSR,
  onMonthlyReport,
  onLogout,
}) {
  const overlayRef = useRef(null);
  const location = useLocation();

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

  const handleOverlayClick = (e) => {
    if (e.target === overlayRef.current) onClose();
  };

  const handleAction = (action) => () => {
    action?.();
    onClose();
  };

  const menuItems = [
    {
      type: 'link',
      label: 'Calendar',
      to: '/calendar',
      icon: (
        <svg className="h-5 w-5 shrink-0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
          <line x1="16" y1="2" x2="16" y2="6" />
          <line x1="8" y1="2" x2="8" y2="6" />
          <line x1="3" y1="10" x2="21" y2="10" />
        </svg>
      ),
    },
    {
      type: 'link',
      label: 'Attendance & Payroll',
      to: '/attendance',
      icon: (
        <svg className="h-5 w-5 shrink-0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      ),
    },
    {
      type: 'link',
      label: 'Credit Bills',
      to: '/bills',
      icon: (
        <svg className="h-5 w-5 shrink-0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <line x1="12" y1="1" x2="12" y2="23" />
          <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
        </svg>
      ),
    },
    {
      type: 'link',
      label: 'Credit Parties',
      to: '/parties',
      icon: (
        <svg className="h-5 w-5 shrink-0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      ),
    },
    {
      type: 'button',
      label: 'Export DSR',
      action: onExportDSR,
      icon: (
        <svg className="h-5 w-5 shrink-0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="17 8 12 3 7 8" />
          <line x1="12" y1="3" x2="12" y2="15" />
        </svg>
      ),
    },
    {
      type: 'button',
      label: 'Monthly Report',
      action: onMonthlyReport,
      icon: (
        <svg className="h-5 w-5 shrink-0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <line x1="18" y1="20" x2="18" y2="10" />
          <line x1="12" y1="20" x2="12" y2="4" />
          <line x1="6" y1="20" x2="6" y2="14" />
        </svg>
      ),
    },
    {
      type: 'link',
      label: 'Settings',
      to: '/settings',
      icon: (
        <svg className="h-5 w-5 shrink-0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
        </svg>
      ),
    },
  ];

  const baseItemClass =
    'flex h-12 items-center gap-3 rounded-lg px-3 text-[15px] font-medium text-white/90 transition-all duration-150 hover:bg-white/10 hover:text-white focus:outline-none focus:ring-2 focus:ring-white/30';

  const activeItemClass =
    'flex h-12 items-center gap-3 rounded-lg px-3 text-[15px] font-medium text-white bg-white/15 transition-all duration-150 hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white/30';

  return (
    <>
      {/* Backdrop */}
      <div
        ref={overlayRef}
        onClick={handleOverlayClick}
        className={`fixed inset-0 z-50 bg-black/50 backdrop-blur-[2px] transition-opacity duration-250 ${
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        aria-label="Navigation drawer overlay"
      />

      {/* Drawer panel */}
      <aside
        role="navigation"
        aria-label="Main navigation"
        className={`fixed right-0 top-0 z-50 h-full w-[280px] header-gradient shadow-2xl flex flex-col transition-transform duration-300 ease-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex h-16 items-center justify-between px-5">
          <span className="text-base font-bold text-white tracking-tight">DSR Manager</span>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close navigation menu"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-white/80 transition-all duration-150 hover:bg-white/15 hover:text-white focus:outline-none focus:ring-2 focus:ring-white/40 active:scale-90"
          >
            <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Divider */}
        <div className="mx-4 border-t border-white/15" />

        {/* Menu items */}
        <nav className="mt-3 flex flex-col gap-1 px-3">
          {menuItems.map((item) =>
            item.type === 'link' ? (
              <Link
                key={item.label}
                to={item.to}
                onClick={onClose}
                aria-label={item.label}
                className={location.pathname === item.to ? activeItemClass : baseItemClass}
              >
                {item.icon}
                {item.label}
                {location.pathname === item.to && (
                  <span className="ml-auto w-1.5 h-1.5 rounded-full bg-adani-red animate-pulse-dot" />
                )}
              </Link>
            ) : (
              <button
                key={item.label}
                type="button"
                onClick={handleAction(item.action)}
                aria-label={item.label}
                className={baseItemClass}
              >
                {item.icon}
                {item.label}
              </button>
            ),
          )}
        </nav>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Logout at bottom */}
        <div className="px-3 pb-6">
          <div className="mx-1 mb-3 border-t border-white/15" />
          <button
            type="button"
            onClick={handleAction(onLogout)}
            aria-label="Logout"
            className="flex h-12 w-full items-center gap-3 rounded-lg px-3 text-[15px] font-medium text-red-300 transition-all duration-150 hover:bg-red-500/15 hover:text-red-200 focus:outline-none focus:ring-2 focus:ring-red-400/30"
          >
            <svg className="h-5 w-5 shrink-0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            Logout
          </button>
        </div>
      </aside>
    </>
  );
}
