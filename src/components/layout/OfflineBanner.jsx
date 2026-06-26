/**
 * Full-width banner displayed when the user is offline.
 * Amber background, white text, fixed at the very top of the viewport.
 */
export default function OfflineBanner() {
  return (
    <div
      role="alert"
      aria-live="assertive"
      className="relative z-[60] flex items-center justify-center gap-2 bg-[#D97706] px-4 py-2 text-sm font-medium text-white shadow-md animate-fade-in"
    >
      {/* Warning icon */}
      <svg
        className="h-4 w-4 shrink-0"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
        <line x1="12" y1="9" x2="12" y2="13" />
        <line x1="12" y1="17" x2="12.01" y2="17" />
      </svg>

      <span>No Internet Connection — Running Offline (Changes Saved Locally)</span>
    </div>
  );
}
