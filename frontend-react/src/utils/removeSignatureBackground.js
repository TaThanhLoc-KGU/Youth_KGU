/**
 * Tự động xóa nền cho ảnh chữ ký (chụp/scan trên giấy trắng) → PNG nền trong suốt.
 * Thuật toán: lấy màu nền bằng cách lấy trung bình 4 góc ảnh (xử lý được nền hơi ngả vàng/xám,
 * không chỉ trắng tinh), sau đó với mỗi pixel tính khoảng cách màu tới nền — pixel càng gần màu
 * nền càng trong suốt, pixel càng khác biệt (nét mực) càng giữ nguyên độ đậm. Alpha giảm dần mượt
 * theo ngưỡng thay vì cắt nhị phân để nét chữ ký không bị răng cưa.
 *
 * @param {File} file       - File ảnh chữ ký gốc (JPG/PNG chụp trên nền giấy)
 * @param {number} threshold - Ngưỡng khoảng cách màu bắt đầu trong suốt hoàn toàn (mặc định 40)
 * @param {number} feather   - Độ rộng vùng chuyển mượt quanh ngưỡng (mặc định 35)
 * @returns {Promise<File>} File PNG mới nền trong suốt (không đổi file gốc nếu lỗi)
 */
export async function removeSignatureBackground(file, threshold = 40, feather = 35) {
  if (!file.type.startsWith('image/')) return file;

  return new Promise((resolve) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);

      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0);

      let imageData;
      try {
        imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      } catch {
        // Ảnh cross-origin hoặc canvas bị "tainted" — không xử lý được, trả về file gốc
        resolve(file);
        return;
      }

      const { data, width, height } = imageData;

      // ── Ước lượng màu nền: trung bình các pixel ở 4 góc (mỗi góc lấy khối 5x5) ──
      const sampleCorner = (sx, sy) => {
        let r = 0, g = 0, b = 0, n = 0;
        for (let dy = 0; dy < 5; dy++) {
          for (let dx = 0; dx < 5; dx++) {
            const x = Math.min(width - 1, sx + dx);
            const y = Math.min(height - 1, sy + dy);
            const i = (y * width + x) * 4;
            r += data[i]; g += data[i + 1]; b += data[i + 2]; n++;
          }
        }
        return [r / n, g / n, b / n];
      };
      const corners = [
        sampleCorner(0, 0),
        sampleCorner(Math.max(0, width - 5), 0),
        sampleCorner(0, Math.max(0, height - 5)),
        sampleCorner(Math.max(0, width - 5), Math.max(0, height - 5)),
      ];
      const bg = corners.reduce((acc, c) => [acc[0] + c[0] / 4, acc[1] + c[1] / 4, acc[2] + c[2] / 4], [0, 0, 0]);

      // ── Xóa nền: pixel gần màu nền → trong suốt, pixel khác biệt (nét mực) → giữ nguyên ──
      const lower = threshold;
      const upper = threshold + feather;
      for (let i = 0; i < data.length; i += 4) {
        const dr = data[i] - bg[0];
        const dg = data[i + 1] - bg[1];
        const db = data[i + 2] - bg[2];
        const dist = Math.sqrt(dr * dr + dg * dg + db * db);

        let alpha;
        if (dist <= lower) alpha = 0;
        else if (dist >= upper) alpha = 255;
        else alpha = Math.round(((dist - lower) / (upper - lower)) * 255);

        data[i + 3] = Math.min(data[i + 3], alpha);
      }

      ctx.putImageData(imageData, 0, 0);

      canvas.toBlob((blob) => {
        if (!blob) { resolve(file); return; }
        const processed = new File(
          [blob],
          file.name.replace(/\.[^.]+$/, '') + '.png',
          { type: 'image/png', lastModified: Date.now() }
        );
        resolve(processed);
      }, 'image/png');
    };

    img.onerror = () => { URL.revokeObjectURL(objectUrl); resolve(file); };
    img.src = objectUrl;
  });
}
