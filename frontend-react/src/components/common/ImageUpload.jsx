import { useState, useRef } from 'react';
import { Upload, X, Image as ImageIcon } from 'lucide-react';
import clsx from 'clsx';
import Button from './Button';

const ImageUpload = ({
  value,
  onChange,
  onRemove,
  maxSize = 5, // MB
  accept = 'image/*',
  label = 'Tải ảnh lên',
  helperText,
  error,
  preview = true,
  className,
}) => {
  const [dragActive, setDragActive] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(value || null);
  const inputRef = useRef(null);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = e.dataTransfer.files;
    if (files && files[0]) {
      handleFile(files[0]);
    }
  };

  const handleChange = (e) => {
    const files = e.target.files;
    if (files && files[0]) {
      handleFile(files[0]);
    }
  };

  const handleFile = (file) => {
    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Vui lòng chọn file ảnh!');
      return;
    }

    // Validate file size
    const sizeMB = file.size / 1024 / 1024;
    if (sizeMB > maxSize) {
      alert(`Kích thước file không được vượt quá ${maxSize}MB!`);
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result);
    };
    reader.readAsDataURL(file);

    // Call onChange with file
    if (onChange) {
      onChange(file);
    }
  };

  const handleRemove = () => {
    setPreviewUrl(null);
    if (inputRef.current) {
      inputRef.current.value = '';
    }
    if (onRemove) {
      onRemove();
    }
    if (onChange) {
      onChange(null);
    }
  };

  const handleClick = () => {
    inputRef.current?.click();
  };

  return (
    <div className={clsx('w-full', className)}>
      {label && <label className="form-label">{label}</label>}

      {previewUrl && preview ? (
        <div className="relative inline-block">
          <img
            src={previewUrl}
            alt="Preview"
            className="w-full max-w-md h-auto rounded-lg border-2 border-gray-300"
          />
          <button
            onClick={handleRemove}
            className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
            type="button"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <div
          onClick={handleClick}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          className={clsx(
            'border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all',
            dragActive
              ? 'border-primary bg-primary-50'
              : 'border-gray-300 hover:border-primary hover:bg-gray-50',
            error && 'border-red-500'
          )}
        >
          <input
            ref={inputRef}
            type="file"
            accept={accept}
            onChange={handleChange}
            className="hidden"
          />
          <div className="flex flex-col items-center gap-2">
            {previewUrl ? (
              <ImageIcon className="w-12 h-12 text-primary" />
            ) : (
              <Upload className="w-12 h-12 text-gray-400" />
            )}
            <div>
              <p className="text-sm font-medium text-gray-700">
                Nhấp để chọn hoặc kéo thả ảnh vào đây
              </p>
              <p className="text-xs text-gray-500 mt-1">
                PNG, JPG, GIF tối đa {maxSize}MB
              </p>
            </div>
          </div>
        </div>
      )}

      {error && <p className="form-error">{error}</p>}
      {helperText && !error && (
        <p className="mt-1 text-xs text-gray-500">{helperText}</p>
      )}
    </div>
  );
};

export default ImageUpload;
