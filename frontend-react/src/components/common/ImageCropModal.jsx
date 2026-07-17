/**
 * ImageCropModal — crop ảnh theo tỷ lệ quy định trước khi upload.
 *
 * Props:
 *  - isOpen: boolean
 *  - onClose: () => void
 *  - imageSrc: string (base64 hoặc blob URL)
 *  - onConfirm: (blob: Blob) => void
 *  - defaultAspect: number | undefined — e.g. 16/9, 1, 4/1
 *  - lockAspect: boolean — khóa tỷ lệ (default true)
 *  - title: string
 */
import { useState, useRef } from 'react';
import ReactCrop, { centerCrop, makeAspectCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { X, Crop } from 'lucide-react';

function centerAspectCrop(mediaWidth, mediaHeight, aspect) {
  return centerCrop(
    makeAspectCrop({ unit: '%', width: 90 }, aspect, mediaWidth, mediaHeight),
    mediaWidth,
    mediaHeight,
  );
}

const ASPECT_PRESETS = [
  { label: '16:9', value: 16 / 9 },
  { label: '4:3', value: 4 / 3 },
  { label: '1:1', value: 1 },
  { label: '4:1', value: 4 / 1 },
  { label: '3:4', value: 3 / 4 },
  { label: 'Tự do', value: undefined },
];

const ImageCropModal = ({
  isOpen,
  onClose,
  imageSrc,
  onConfirm,
  defaultAspect = 16 / 9,
  lockAspect = true,
  title = 'Điều chỉnh ảnh',
}) => {
  const [crop, setCrop] = useState();
  const [completedCrop, setCompletedCrop] = useState(null);
  const [aspect, setAspect] = useState(defaultAspect);
  const [applying, setApplying] = useState(false);
  const imgRef = useRef(null);

  function onImageLoad(e) {
    const { width, height } = e.currentTarget;
    const initialAspect = aspect ?? defaultAspect;
    if (initialAspect) {
      setCrop(centerAspectCrop(width, height, initialAspect));
    }
  }

  const handleConfirm = async () => {
    if (!completedCrop?.width || !completedCrop?.height || !imgRef.current) return;
    setApplying(true);
    const image = imgRef.current;
    const canvas = document.createElement('canvas');
    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;

    const MAX_OUTPUT = 1920;
    let outW = Math.round(completedCrop.width * scaleX);
    let outH = Math.round(completedCrop.height * scaleY);
    if (outW > MAX_OUTPUT) { outH = Math.round(outH * MAX_OUTPUT / outW); outW = MAX_OUTPUT; }

    canvas.width = outW;
    canvas.height = outH;

    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, outW, outH);
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(
      image,
      completedCrop.x * scaleX,
      completedCrop.y * scaleY,
      completedCrop.width * scaleX,
      completedCrop.height * scaleY,
      0, 0, outW, outH,
    );

    try {
      const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
      const res = await fetch(dataUrl);
      const blob = await res.blob();
      onConfirm(blob);
      onClose();
    } catch (e) {
      alert('Lỗi xử lý ảnh. Vui lòng thử lại.');
    } finally {
      setApplying(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/70 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col" style={{ maxHeight: '92vh' }}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b flex-shrink-0">
          <div className="flex items-center gap-2">
            <Crop className="w-5 h-5 text-blue-600" />
            <h3 className="font-semibold text-gray-900">{title}</h3>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Aspect ratio presets (khi không khóa tỷ lệ) */}
        {!lockAspect && (
          <div className="flex flex-wrap gap-2 px-5 py-3 border-b bg-gray-50 flex-shrink-0">
            <span className="text-sm font-medium text-gray-600 self-center">Tỷ lệ:</span>
            {ASPECT_PRESETS.map((p) => (
              <button
                key={p.label}
                onClick={() => {
                  setAspect(p.value);
                  if (imgRef.current && p.value) {
                    const { width, height } = imgRef.current;
                    setCrop(centerAspectCrop(width, height, p.value));
                  }
                }}
                className={`px-3 py-1 text-xs rounded-md border font-medium transition-colors ${
                  aspect === p.value
                    ? 'bg-blue-600 border-blue-600 text-white'
                    : 'bg-white border-gray-300 text-gray-600 hover:bg-gray-50'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        )}

        {/* Crop area */}
        <div className="flex-1 overflow-auto min-h-0 flex items-center justify-center bg-gray-900 p-3">
          {imageSrc && (
            <ReactCrop
              crop={crop}
              onChange={(c) => setCrop(c)}
              onComplete={(c) => setCompletedCrop(c)}
              aspect={aspect}
              minWidth={40}
              minHeight={40}
            >
              <img
                ref={imgRef}
                alt="Crop preview"
                src={imageSrc}
                onLoad={onImageLoad}
                style={{ maxWidth: '100%', maxHeight: '52vh', display: 'block' }}
              />
            </ReactCrop>
          )}
        </div>

        {/* Hint */}
        {lockAspect && defaultAspect && (
          <div className="px-5 py-2 bg-blue-50 text-xs text-blue-700 flex-shrink-0 border-t border-blue-100">
            Tỷ lệ được cố định theo yêu cầu. Kéo góc để điều chỉnh vùng cắt.
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-4 border-t flex-shrink-0">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">
            Hủy
          </button>
          <button
            onClick={handleConfirm}
            disabled={applying || !completedCrop?.width}
            className="flex items-center gap-2 px-5 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
          >
            {applying ? (
              <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="white" strokeWidth="4" opacity="0.25" />
                <path d="M12 2a10 10 0 0 1 10 10" stroke="white" strokeWidth="4" />
              </svg>
            ) : (
              <Crop className="w-4 h-4" />
            )}
            Xác nhận cắt ảnh
          </button>
        </div>
      </div>
    </div>
  );
};

export default ImageCropModal;
