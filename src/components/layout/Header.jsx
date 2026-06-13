import SyncIndicator from './SyncIndicator';

/**
 * App header bar — navy gradient background, 64px height.
 * Left: sync status, Center: app title, Right: hamburger menu button.
 *
 * @param {string}   stationName - Name of the gas station
 * @param {Function} onMenuClick - Toggle side menu callback
 */
export default function Header({ stationName = '', onMenuClick }) {
  return (
    <header className="sticky top-0 z-40 flex h-16 items-center justify-between header-gradient px-4 shadow-md">
      {/* Left – Sync status & Station name */}
      <div className="flex items-center gap-3">
        <SyncIndicator />
        <span className="text-sm font-semibold text-white/80 truncate max-w-[160px] hidden sm:block">
          {stationName}
        </span>
      </div>

      {/* Center – App title */}
      <h1 className="absolute left-1/2 -translate-x-1/2 text-lg sm:text-xl font-bold text-white whitespace-nowrap tracking-tight">
        DSR Manager
      </h1>

      {/* Right – Hamburger */}
      <button
        type="button"
        onClick={onMenuClick}
        aria-label="Open navigation menu"
        className="flex h-10 w-10 items-center justify-center rounded-lg text-white/90 transition-all duration-150 hover:bg-white/15 hover:text-white focus:outline-none focus:ring-2 focus:ring-white/40 active:scale-95"
      >
        <svg
          className="h-6 w-6"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M4 6h16M4 12h16M4 18h16"
          />
        </svg>
      </button>

      {/* Bottom accent bar */}
      <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-adani-red via-adani-red/60 to-transparent" />
    </header>
  );
}
