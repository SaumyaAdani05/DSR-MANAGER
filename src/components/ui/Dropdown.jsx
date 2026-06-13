import { forwardRef, useId } from 'react';

/**
 * Reusable select dropdown styled to match the Input component.
 *
 * @param {string}   label           - Label text above the dropdown
 * @param {string}   value           - Currently selected value
 * @param {Function} onChange        - Change handler (receives event)
 * @param {{ id: string, name: string, isActive?: boolean }[]} options - Options list
 * @param {string}   placeholder     - Placeholder text for unselected state
 * @param {string}   error           - Error message shown below in red
 * @param {boolean}  disabled        - Disables the dropdown
 * @param {string[]} disabledOptions - Array of option ids to grey out
 */
const Dropdown = forwardRef(function Dropdown(
  {
    label,
    value,
    onChange,
    options = [],
    placeholder = 'Select…',
    error,
    disabled = false,
    disabledOptions = [],
    className = '',
    id: externalId,
    ...rest
  },
  ref,
) {
  const generatedId = useId();
  const selectId = externalId ?? generatedId;
  const errorId = error ? `${selectId}-error` : undefined;

  return (
    <div className={['flex flex-col gap-1', className].filter(Boolean).join(' ')}>
      {label && (
        <label
          htmlFor={selectId}
          className="text-xs font-medium text-adani-gray"
        >
          {label}
        </label>
      )}

      <div className="relative">
        <select
          ref={ref}
          id={selectId}
          value={value}
          onChange={onChange}
          disabled={disabled}
          aria-label={label ?? placeholder}
          aria-invalid={!!error}
          aria-describedby={errorId}
          className={[
            'h-10 w-full appearance-none rounded-md px-3 pr-8 text-sm',
            'border transition-all duration-150',
            'font-sans bg-white',
            // Value style – show placeholder color when nothing is selected
            !value ? 'text-[#9CA3AF]' : 'text-[#111827]',
            // Border states
            error
              ? 'border-[#DC2626] ring-2 ring-[#DC2626]/30'
              : 'border-adani-border',
            disabled
              ? 'bg-[#F3F4F6] text-adani-gray cursor-not-allowed'
              : '',
            // Focus
            !(disabled) && !error
              ? 'focus:border-adani-navy focus:ring-2 focus:ring-adani-navy/40 focus:outline-none'
              : 'focus:outline-none',
          ]
            .filter(Boolean)
            .join(' ')}
          {...rest}
        >
          {/* Placeholder option */}
          <option value="" disabled hidden>
            {placeholder}
          </option>

          {options.map((opt) => {
            const isOptDisabled = disabledOptions.includes(opt.id);
            return (
              <option
                key={opt.id}
                value={opt.id}
                disabled={isOptDisabled}
                className={isOptDisabled ? 'text-[#9CA3AF]' : ''}
              >
                {opt.name}
                {opt.isActive === false ? ' (inactive)' : ''}
              </option>
            );
          })}
        </select>

        {/* Chevron icon */}
        <span className="pointer-events-none absolute inset-y-0 right-2 flex items-center text-adani-gray">
          <svg
            className="h-4 w-4"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z"
              clipRule="evenodd"
            />
          </svg>
        </span>
      </div>

      {/* Error message */}
      {error && (
        <p
          id={errorId}
          role="alert"
          className="text-xs font-medium text-[#DC2626]"
        >
          {error}
        </p>
      )}
    </div>
  );
});

export default Dropdown;
