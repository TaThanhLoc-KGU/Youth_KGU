/**
 * Nén ảnh phía client trước khi upload.
 * - Resize về maxWidth (giữ tỷ lệ)
 * - Xuất ra JPEG với quality tùy chọn
 * - Trả về File mới (không thay đổi file gốc)
 *
 * @param {File} file         - File ảnh gốc
 * @param {number} maxWidth   - Chiều rộng tối đa (mặc định 1920)
 * @param {number} quality    - Chất lượng JPEG 0-1 (mặc định 0.82)
 * @returns {Promise<File>}
 */
export async function compressImage(file, maxWidth = 1920, quality = 0.82) {
  // Chỉ xử lý ảnh
  if (!file.type.startsWith('image/')) return file;

  return new Promise((resolve) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);

      let { width, height } = img;

      // Chỉ thu nhỏ nếu lớn hơn maxWidth
      if (width > maxWidth) {
        height = Math.round((height * maxWidth) / width);
        width = maxWidth;
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      // White background (tránh PNG transparent → đen trên JPEG)
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, width, height);
      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (!blob) { resolve(file); return; }
          // Nếu nén xong lại lớn hơn file gốc (ảnh nhỏ), giữ file gốc
          if (blob.size >= file.size) { resolve(file); return; }
          const compressed = new File(
            [blob],
            file.name.replace(/\.[^.]+$/, '') + '.jpg',
            { type: 'image/jpeg', lastModified: Date.now() }
          );
          resolve(compressed);
        },
        'image/jpeg',
        quality
      );
    };

    img.onerror = () => { URL.revokeObjectURL(objectUrl); resolve(file); };
    img.src = objectUrl;
  });
}
