const ShiftTabs = ({ activeShift, onShiftChange, shiftStatuses = [] }) => {
  const tabs = [1, 2, 3];

  return (
    <div className="flex border-b border-adani-border">
      {tabs.map((num) => {
        const status = shiftStatuses[num - 1] || {};
        const isActive = activeShift === num;

        return (
          <button
            key={num}
            onClick={() => onShiftChange(num)}
            className={`relative flex items-center justify-center gap-2 px-6 h-11 text-sm font-semibold transition-colors
              ${isActive
                ? 'bg-adani-navy text-white border-b-2 border-adani-red'
                : 'bg-adani-lightGray text-adani-gray hover:bg-gray-200'
              }
            `}
            aria-label={`Switch to Shift ${num}`}
            aria-selected={isActive}
            role="tab"
          >
            <span>SHIFT {num}</span>

            {/* Saved indicator - green dot */}
            {status.isSaved && !status.isLocked && (
              <span className="w-2 h-2 rounded-full bg-success" title="Saved (editable)" />
            )}

            {/* Locked indicator - lock icon */}
            {status.isLocked && (
              <span className="text-xs" title="Locked">🔒</span>
            )}
          </button>
        );
      })}
    </div>
  );
};

export default ShiftTabs;
