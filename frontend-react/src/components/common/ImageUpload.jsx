import { useState, useRef } from 'react';
import { Upload, X } from 'lucide-react';
import clsx from 'clsx';

const ImageUpload = ({
  label = 'Hình ảnh',
  value = '',
  onChange = () => {},
  error = '',
  accept = 'image/*',
  containerClassName = '',
}) => {
  const fileInputRef = useRef(null);
  const [preview, setPreview] = useState(value || '');
  const [fileName, setFileName] = useState('');

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      alert('Kích thước file không được vượt quá 5MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64String = event.target?.result;
      setPreview(base64String);
      setFileName(file.name);
      onChange({
        target: {
          name: 'hinhAnhPoster',
          value: base64String,
        },
      });
    };
    reader.readAsDataURL(file);
  };

  const handleRemove = () => {
    setPreview('');
    setFileName('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onChange({
      target: {
        name: 'hinhAnhPoster',
        value: '',
      },
    });
  };

  return (
    <div className={clsx('w-full', containerClassName)}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label}
        </label>
      )}

      {preview ? (
        <div className="relative rounded-lg overflow-hidden border border-gray-200 bg-gray-50">
          <img
            src={preview}
            alt="Preview"
            className="w-full h-48 object-cover"
          />
          <button
            type="button"
            onClick={handleRemove}
            className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors shadow-lg"
          >
            <X className="w-5 h-5" />
          </button>
          {fileName && (
            <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-xs p-2 truncate">
              {fileName}
            </div>
          )}
        </div>
      ) : (
        <div
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-colors"
        >
          <Upload className="w-10 h-10 text-gray-400 mx-auto mb-2" />
          <p className="text-sm font-medium text-gray-700">Tải lên hình ảnh</p>
          <p className="text-xs text-gray-500 mt-1">Nhấp để chọn hoặc kéo thả file</p>
          <p className="text-xs text-gray-400 mt-1">Tối đa 5MB</p>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={handleFileSelect}
        className="hidden"
      />

      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
};

export default ImageUpload;
