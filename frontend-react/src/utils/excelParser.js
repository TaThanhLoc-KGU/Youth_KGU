/**
 * Excel Parser Utility
 * Xử lý parse Excel file và validate data
 */

/**
 * Parse Excel file sử dụng FileReader API
 * @param {File} file - Excel file to parse
 * @returns {Promise<Array>} Array of rows
 */
export const parseExcelFile = async (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = async (e) => {
      try {
        // Tạm thời chúng ta sẽ chờ xlsx library được import
        // Đối với thử nghiệm, chúng ta sử dụng một module CDN hoặc nhúng
        const data = new Uint8Array(e.target.result);

        // Động import xlsx nếu có
        try {
          const XLSX = window.XLSX || (await import('xlsx')).default;

          const workbook = XLSX.read(data, { type: 'array' });
          const worksheet = workbook.Sheets[workbook.SheetNames[0]];
          const rows = XLSX.utils.sheet_to_json(worksheet);

          resolve(rows);
        } catch (error) {
          // Nếu xlsx không có, parse CSV-style manually
          const text = new TextDecoder().decode(data);
          const rows = parseCSVData(text);
          resolve(rows);
        }
      } catch (error) {
        reject(error);
      }
    };

    reader.onerror = () => reject(new Error('Lỗi đọc file'));
    reader.readAsArrayBuffer(file);
  });
};

/**
 * Parse CSV data (fallback nếu không có xlsx)
 * @param {string} csvText - CSV text content
 * @returns {Array} Array of objects
 */
const parseCSVData = (csvText) => {
  const lines = csvText.split('\n').filter(line => line.trim());
  if (lines.length < 2) return [];

  const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
  const rows = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map(v => v.trim());
    if (values.length === headers.length && values.some(v => v)) {
      const row = {};
      headers.forEach((header, idx) => {
        row[header] = values[idx];
      });
      rows.push(row);
    }
  }

  return rows;
};

/**
 * Normalize column names từ Excel
 * @param {Array} rows - Rows from Excel
 * @returns {Array} Normalized rows
 */
export const normalizeExcelData = (rows) => {
  if (!rows || rows.length === 0) return [];

  return rows.map(row => {
    const normalized = {};

    // Map các column name có thể có
    Object.keys(row).forEach(key => {
      const lowerKey = key.toLowerCase().trim();
      const value = row[key];

      if (lowerKey.includes('mã') || lowerKey.includes('ma') || lowerKey === 'id') {
        normalized.maSo = value;
      } else if (lowerKey.includes('loại') || lowerKey.includes('loai') || lowerKey.includes('type')) {
        normalized.loaiThanhVien = value;
      } else if (lowerKey.includes('tên') || lowerKey.includes('ten') || lowerKey.includes('name')) {
        normalized.hoTen = value;
      } else if (lowerKey.includes('email')) {
        normalized.email = value;
      } else if (lowerKey.includes('ghi') || lowerKey.includes('note')) {
        normalized.ghiChu = value;
      } else if (lowerKey.includes('chức') || lowerKey.includes('chuc') || lowerKey.includes('position')) {
        normalized.chucVu = value;
      } else {
        normalized[lowerKey] = value;
      }
    });

    return normalized;
  });
};

/**
 * Validate Excel data
 * @param {Array} rows - Data rows
 * @returns {Object} Validation result {valid: boolean, errors: Array}
 */
export const validateExcelData = (rows) => {
  const errors = [];
  const warnings = [];

  if (!rows || rows.length === 0) {
    errors.push('File Excel không có dữ liệu');
    return { valid: false, errors, warnings };
  }

  if (rows.length > 500) {
    warnings.push(`File có ${rows.length} bản ghi vượt quá 500, sẽ chỉ import 500 bản ghi đầu tiên`);
  }

  const seenIds = new Set();

  rows.forEach((row, index) => {
    const rowNum = index + 2; // +2 vì header ở dòng 1, dữ liệu từ dòng 2

    // Check bắt buộc columns
    if (!row.maSo || !row.maSo.toString().trim()) {
      errors.push(`Dòng ${rowNum}: Mã số không được để trống`);
    } else {
      // Check format mã số
      const maSo = row.maSo.toString().trim();
      if (!/^[A-Z]+\d+$/.test(maSo)) {
        warnings.push(`Dòng ${rowNum}: Mã số "${maSo}" không đúng format (VD: SV001, GV001)`);
      }

      // Check duplicate
      if (seenIds.has(maSo)) {
        errors.push(`Dòng ${rowNum}: Mã số "${maSo}" bị trùng lặp`);
      } else {
        seenIds.add(maSo);
      }
    }

    if (!row.loaiThanhVien || !row.loaiThanhVien.toString().trim()) {
      errors.push(`Dòng ${rowNum}: Loại thành viên không được để trống`);
    } else {
      const loai = row.loaiThanhVien.toString().trim().toUpperCase();
      if (!['SINH_VIEN', 'SINHVIEN', 'SV', 'GIANG_VIEN', 'GIANGVIEN', 'GV', 'CHUYEN_VIEN', 'CHUYENVIEN', 'CV'].includes(loai)) {
        errors.push(`Dòng ${rowNum}: Loại "${row.loaiThanhVien}" không hợp lệ (SINH_VIEN, GIANG_VIEN, CHUYEN_VIEN)`);
      }
    }

    // Check email nếu có
    if (row.email && row.email.toString().trim()) {
      const email = row.email.toString().trim().toLowerCase();
      if (!isValidEmail(email)) {
        warnings.push(`Dòng ${rowNum}: Email "${email}" không hợp lệ`);
      }
    }
  });

  return {
    valid: errors.length === 0,
    errors: errors.slice(0, 20), // Giới hạn lỗi hiển thị
    warnings: warnings.slice(0, 20),
    totalErrors: errors.length,
    totalWarnings: warnings.length
  };
};

/**
 * Validate email format
 * @param {string} email - Email address
 * @returns {boolean} Is valid
 */
export const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Generate Excel template
 * @returns {Blob} Excel template blob
 */
export const generateExcelTemplate = () => {
  // Nếu có xlsx library, tạo proper Excel file
  // Tạm thời return CSV template

  const template = `Mã số,Loại,Họ tên,Email,Ghi chú
SV001,SINH_VIEN,Nguyễn Văn A,nva@vnkgu.edu.vn,
SV002,SINH_VIEN,Trần Thị B,ttb@vnkgu.edu.vn,
GV001,GIANG_VIEN,Lê Văn C,lvc@vnkgu.edu.vn,
CV001,CHUYEN_VIEN,Phạm Văn D,pvd@vnkgu.edu.vn,`;

  const blob = new Blob([template], { type: 'text/csv;charset=utf-8;' });
  return blob;
};

/**
 * Download file (Excel hoặc CSV)
 * @param {Blob} blob - File blob
 * @param {string} fileName - File name
 */
export const downloadFile = (blob, fileName = 'template.csv') => {
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', fileName);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

/**
 * Download template Excel
 */
export const downloadTemplate = () => {
  const blob = generateExcelTemplate();
  downloadFile(blob, 'template-tao-tai-khoan.csv');
};

/**
 * Filter rows by type
 * @param {Array} rows - Data rows
 * @param {string} type - Type to filter (SINH_VIEN, GIANG_VIEN, CHUYEN_VIEN)
 * @returns {Array} Filtered rows
 */
export const filterRowsByType = (rows, type) => {
  if (!type) return rows;

  const normalizedType = type.toUpperCase().replace(/-/g, '_');

  return rows.filter(row => {
    const rowType = row.loaiThanhVien.toString().toUpperCase().replace(/-/g, '_');
    return rowType.startsWith(normalizedType.split('_')[0]);
  });
};

/**
 * Clean Excel data (remove whitespace, normalize)
 * @param {Array} rows - Data rows
 * @returns {Array} Cleaned rows
 */
export const cleanExcelData = (rows) => {
  return rows.map(row => ({
    maSo: row.maSo ? row.maSo.toString().trim().toUpperCase() : '',
    loaiThanhVien: row.loaiThanhVien ? row.loaiThanhVien.toString().trim().toUpperCase() : '',
    hoTen: row.hoTen ? row.hoTen.toString().trim() : '',
    email: row.email ? row.email.toString().trim().toLowerCase() : '',
    ghiChu: row.ghiChu ? row.ghiChu.toString().trim() : '',
    chucVu: row.chucVu ? row.chucVu.toString().trim() : ''
  }));
};
