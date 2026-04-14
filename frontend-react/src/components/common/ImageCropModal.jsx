import { useState, useRef, useEffect } from 'react';
import ReactCrop, { centerCrop, makeAspectCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import Modal from './Modal';
import Button from './Button';

/**
 * ImageCropModal - Component dùng chung để crop ảnh
 * 
 * Props:
 * - isOpen: boolean
 * - onClose: function
 * - imageSrc: string (base64 hoặc blob URL)
 * - onConfirm: function(blob) - trả về blob của ảnh đã crop
 * - defaultAspect: number | undefined - tỉ lệ mặc định (ví dụ: 16/9, 1, 4/3)
 * - lockAspect: boolean - có khóa tỉ lệ không
 */
const ImageCropModal = ({
  isOpen,
  onClose,
  imageSrc,
  onConfirm,
  defaultAspect = 16 / 9,
  lockAspect = true,
  title = 'Điều chỉnh ảnh'
}) => {
  const [crop, setCrop] = useState();
  const [completedCrop, setCompletedCrop] = useState(null);
  const [aspect, setAspect] = useState(defaultAspect);
  const imgRef = useRef(null);

  function onImageLoad(e) {
    const { width, height } = e.currentTarget;
    const initialCrop = centerCrop(
      makeAspectCrop(
        {
          unit: '%',
          width: 90,
        },
        aspect,
        width,
        height
      ),
      width,
      height
    );
    setCrop(initialCrop);
  }

  const handleConfirm = async () => {
    if (!completedCrop || !imgRef.current) return;
    if (!completedCrop.width || !completedCrop.height) return;

    const image = imgRef.current;
    const canvas = document.createElement('canvas');
    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;

    canvas.width = Math.round(completedCrop.width * scaleX);
    canvas.height = Math.round(completedCrop.height * scaleY);

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(
      image,
      completedCrop.x * scaleX,
      completedCrop.y * scaleY,
      completedCrop.width * scaleX,
      completedCrop.height * scaleY,
      0,
      0,
      canvas.width,
      canvas.height
    );

    try {
      // Dùng toDataURL + fetch thay vì toBlob để tránh lỗi null trên một số browser
      const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
      const res = await fetch(dataUrl);
      const blob = await res.blob();
      onConfirm(blob);
      onClose();
    } catch (e) {
      console.error('Failed to process image:', e);
      alert('Lỗi xử lý ảnh. Vui lòng thử lại.');
    }
  };

  const aspectPresets = [
    { label: '16:9', value: 16 / 9 },
    { label: '4:3', value: 4 / 3 },
    { label: '1:1', value: 1 },
    { label: '3:4', value: 3 / 4 },
    { label: 'Tự do', value: undefined },
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="lg"
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>Hủy</Button>
          <Button onClick={handleConfirm}>Xác nhận</Button>
        </div>
      }
    >
      <div className="space-y-4">
        <div className="flex flex-wrap gap-2 mb-4">
          <span className="text-sm font-medium text-gray-700 self-center">Tỷ lệ:</span>
          {aspectPresets.map((preset) => (
            <button
              key={preset.label}
              onClick={() => {
                setAspect(preset.value);
                if (imgRef.current && preset.value) {
                  const { width, height } = imgRef.current;
                  setCrop(centerCrop(
                    makeAspectCrop({ unit: '%', width: 90 }, preset.value, width, height),
                    width, height
                  ));
                }
              }}
              className={`px-3 py-1 text-sm rounded-md border ${
                aspect === preset.value
                  ? 'bg-blue-50 border-blue-500 text-blue-600'
                  : 'bg-white border-gray-300 text-gray-600 hover:bg-gray-50'
              }`}
            >
              {preset.label}
            </button>
          ))}
        </div>

        <div className="flex justify-center bg-gray-100 rounded-lg overflow-hidden max-h-[500px]">
          {imageSrc && (
            <ReactCrop
              crop={crop}
              onChange={(c) => setCrop(c)}
              onComplete={(c) => setCompletedCrop(c)}
              aspect={aspect}
            >
              <img
                ref={imgRef}
                alt="Crop preview"
                src={imageSrc}
                onLoad={onImageLoad}
                style={{ maxWidth: '100%', maxHeight: '500px' }}
              />
            </ReactCrop>
          )}
        </div>
      </div>
    </Modal>
  );
};

export default ImageCropModal;
