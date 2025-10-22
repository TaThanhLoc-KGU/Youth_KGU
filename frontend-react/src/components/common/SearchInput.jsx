import { useState } from 'react';
import { Search, X } from 'lucide-react';
import clsx from 'clsx';

const SearchInput = ({
  value,
  onChange,
  onSearch,
  placeholder = 'Tìm kiếm...',
  className,
  debounceMs = 300,
}) => {
  const [localValue, setLocalValue] = useState(value || '');

  const handleChange = (e) => {
    const newValue = e.target.value;
    setLocalValue(newValue);

    if (onChange) {
      onChange(newValue);
    }

    // Debounce search
    if (onSearch) {
      clearTimeout(window.searchTimeout);
      window.searchTimeout = setTimeout(() => {
        onSearch(newValue);
      }, debounceMs);
    }
  };

  const handleClear = () => {
    setLocalValue('');
    if (onChange) {
      onChange('');
    }
    if (onSearch) {
      onSearch('');
    }
  };

  return (
    <div className={clsx('relative', className)}>
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5" />
      <input
        type="text"
        value={localValue}
        onChange={handleChange}
        placeholder={placeholder}
        className="input input-bordered w-full pl-10 pr-10"
      />
      {localValue && (
        <button
          onClick={handleClear}
          className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};

export default SearchInput;
