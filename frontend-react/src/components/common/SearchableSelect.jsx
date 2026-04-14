import ReactSelect from 'react-select';
import clsx from 'clsx';

/**
 * SearchableSelect – dropdown vừa chọn vừa tìm kiếm
 *
 * Props:
 *  - label        : string – nhãn trên ô
 *  - options      : [{ value, label }]  hoặc [{ value, label, group }]
 *  - value        : string | number | null  (raw value, không phải option object)
 *  - onChange     : (rawValue) => void
 *  - placeholder  : string
 *  - isClearable  : boolean (default true)
 *  - isDisabled   : boolean
 *  - isLoading    : boolean
 *  - error        : string
 *  - helperText   : string
 *  - required     : boolean
 *  - className    : string (container)
 */
const SearchableSelect = ({
  label,
  labelClassName,
  options = [],
  value,
  onChange,
  placeholder = 'Tìm hoặc chọn...',
  isClearable = true,
  isDisabled = false,
  isLoading = false,
  error,
  helperText,
  required,
  className,
  noOptionsMessage = () => 'Không tìm thấy kết quả',
  ...rest
}) => {
  // Chuyển raw value → option object để react-select hiểu
  const selectedOption = options.find((o) => o.value === value) ?? null;

  const handleChange = (opt) => {
    onChange(opt ? opt.value : null);
  };

  // Custom styles – khớp với form-input của project (focus ring vàng)
  const customStyles = {
    control: (base, state) => ({
      ...base,
      minHeight: '38px',
      fontSize: '0.875rem',
      borderRadius: '0.5rem',
      borderColor: error
        ? '#ef4444'
        : state.isFocused
        ? '#eab308'
        : '#d1d5db',
      boxShadow: state.isFocused
        ? error
          ? '0 0 0 2px #fca5a5'
          : '0 0 0 2px #fef08a'
        : 'none',
      '&:hover': {
        borderColor: error ? '#ef4444' : '#eab308',
      },
      backgroundColor: isDisabled ? '#f9fafb' : '#ffffff',
      cursor: isDisabled ? 'not-allowed' : 'pointer',
    }),
    placeholder: (base) => ({
      ...base,
      color: '#9ca3af',
      fontSize: '0.875rem',
    }),
    singleValue: (base) => ({
      ...base,
      fontSize: '0.875rem',
      color: '#111827',
    }),
    input: (base) => ({
      ...base,
      fontSize: '0.875rem',
      color: '#111827',
    }),
    option: (base, state) => ({
      ...base,
      fontSize: '0.875rem',
      backgroundColor: state.isSelected
        ? '#eab308'
        : state.isFocused
        ? '#fef9c3'
        : '#ffffff',
      color: state.isSelected ? '#ffffff' : '#111827',
      cursor: 'pointer',
      '&:active': { backgroundColor: '#fde047' },
    }),
    menu: (base) => ({
      ...base,
      borderRadius: '0.5rem',
      boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
      zIndex: 9999,
    }),
    menuPortal: (base) => ({ ...base, zIndex: 9999 }),
    clearIndicator: (base) => ({
      ...base,
      color: '#9ca3af',
      '&:hover': { color: '#ef4444' },
      padding: '4px',
    }),
    dropdownIndicator: (base, state) => ({
      ...base,
      color: state.isFocused ? '#eab308' : '#9ca3af',
      '&:hover': { color: '#eab308' },
      padding: '4px',
    }),
    indicatorSeparator: (base) => ({
      ...base,
      backgroundColor: '#e5e7eb',
    }),
    loadingIndicator: (base) => ({ ...base, color: '#eab308' }),
  };

  return (
    <div className={clsx('w-full', className)}>
      {label && (
        <label className={clsx(labelClassName || 'block text-sm font-medium text-gray-700 mb-1')}>
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <ReactSelect
        options={options}
        value={selectedOption}
        onChange={handleChange}
        placeholder={placeholder}
        isClearable={isClearable}
        isDisabled={isDisabled}
        isLoading={isLoading}
        noOptionsMessage={noOptionsMessage}
        styles={customStyles}
        menuPortalTarget={document.body}
        menuPosition="fixed"
        classNamePrefix="ss"
        {...rest}
      />
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
      {helperText && !error && (
        <p className="mt-1 text-xs text-gray-500">{helperText}</p>
      )}
    </div>
  );
};

export default SearchableSelect;
