/**
 * App header bar — navy background, 64px height.
 * Left: station name, Center: app title, Right: hamburger menu button.
 *
 * @param {string}   stationName - Name of the gas station
 * @param {Function} onMenuClick - Handler for the hamburger menu button
 */
export default function Header({ stationName = '', onMenuClick }) {
  return (
    <header className="sticky top-0 z-40 flex h-16 items-center justify-between bg-adani-navy px-4 shadow-md">
      {/* Left – Station name */}
      <span className="text-base font-semibold text-white truncate max-w-[200px]">
        {stationName}
      </span>

      {/* Center – App title */}
      <h1 className="absolute left-1/2 -translate-x-1/2 text-xl font-bold text-white whitespace-nowrap">
        DSR Manager
      </h1>

      {/* Right – Hamburger */}
      <button
        type="button"
        onClick={onMenuClick}
        aria-label="Open navigation menu"
        className="flex h-10 w-10 items-center justify-center rounded-md text-white transition-colors hover:bg-adani-navyLight focus:outline-none focus:ring-2 focus:ring-white/40"
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
    </header>
  );
}
