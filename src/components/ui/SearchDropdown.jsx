import { useState, useRef, useEffect } from 'react';

export default function SearchDropdown({
  options = [], // Array of { id, name, disabled }
  value = '',
  onChange,
  placeholder = 'Select option...',
  disabled = false,
  className = '',
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const containerRef = useRef(null);
  const searchInputRef = useRef(null);

  const selectedOption = options.find((opt) => opt.id === value);

  const filteredOptions = options.filter((opt) =>
    opt.name.toLowerCase().includes(search.toLowerCase())
  );

  useEffect(() => {
    if (isOpen) {
      searchInputRef.current?.focus();
      setHighlightedIndex(-1);
    } else {
      setSearch('');
    }
  }, [isOpen]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleKeyDown = (e) => {
    if (disabled) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (!isOpen) {
        setIsOpen(true);
      } else {
        setHighlightedIndex((prev) =>
          prev < filteredOptions.length - 1 ? prev + 1 : prev
        );
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : prev));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (isOpen && highlightedIndex >= 0 && highlightedIndex < filteredOptions.length) {
        const option = filteredOptions[highlightedIndex];
        if (!option.disabled) {
          onChange(option.id);
          setIsOpen(false);
        }
      } else if (!isOpen) {
        setIsOpen(true);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  const handleSelect = (option) => {
    if (option.disabled) return;
    onChange(option.id);
    setIsOpen(false);
  };

  return (
    <div
      ref={containerRef}
      onKeyDown={handleKeyDown}
      className={`relative inline-block w-full ${className}`}
    >
      {/* Trigger Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen((prev) => !prev)}
        className={`w-full h-10 px-3 text-left text-sm text-gray-900 bg-white
                   border border-adani-border rounded-md shadow-sm
                   focus:outline-none focus:ring-2 focus:ring-adani-navy focus:border-adani-navy
                   disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed
                   flex items-center justify-between transition-all duration-150`}
      >
        <span className={selectedOption ? 'font-medium' : 'text-gray-400'}>
          {selectedOption ? selectedOption.name : placeholder}
        </span>
        <svg
          className={`h-4 w-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-1.5 bg-white border border-gray-200 rounded-md shadow-lg overflow-hidden animate-scale-in">
          {/* Search Input */}
          <div className="p-2 border-b border-gray-100 bg-gray-50">
            <input
              ref={searchInputRef}
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search..."
              className="w-full h-8 px-2 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-adani-navy focus:border-adani-navy"
            />
          </div>

          {/* Options List */}
          <ul className="max-h-60 overflow-y-auto py-1 text-sm text-gray-700">
            {filteredOptions.length === 0 ? (
              <li className="px-3 py-2 text-xs text-gray-400 italic text-center">
                No options found
              </li>
            ) : (
              filteredOptions.map((opt, i) => {
                const isSelected = opt.id === value;
                const isHighlighted = i === highlightedIndex;
                return (
                  <li
                    key={opt.id}
                    onClick={() => handleSelect(opt)}
                    onMouseEnter={() => setHighlightedIndex(i)}
                    className={`px-3 py-2 cursor-pointer flex items-center justify-between
                               ${isHighlighted ? 'bg-blue-50 text-adani-navy' : ''}
                               ${isSelected ? 'font-semibold text-adani-navy bg-blue-50/50' : ''}
                               ${opt.disabled ? 'opacity-40 cursor-not-allowed bg-gray-50' : ''}`}
                  >
                    <span>{opt.name}</span>
                    {isSelected && (
                      <svg className="h-4 w-4 text-adani-navy" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </li>
                );
              })
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
