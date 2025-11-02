import * as XLSX from 'xlsx';

/**
 * Excel Import/Export Service
 * Xử lý nhập/xuất dữ liệu Excel
 */
const excelService = {
  /**
   * Tạo template Excel cho sinh viên
   */
  generateStudentTemplate: () => {
    const headers = [
      'maSv',
      'hoTen',
      'gioiTinh',
      'ngaySinh',
      'email',
      'sdt',
      'maLop',
      'isActive',
    ];

    const exampleData = [
      [
        'SV001',
        'Nguyễn Văn A',
        'NAM',
        '2000-01-15',
        'sv001@student.edu.vn',
        '0912345678',
        'CNTT01',
        'true',
      ],
      [
        'SV002',
        'Trần Thị B',
        'NU',
        '2001-03-20',
        'sv002@student.edu.vn',
        '0987654321',
        'CNTT01',
        'true',
      ],
    ];

    const ws = XLSX.utils.aoa_to_sheet([headers, ...exampleData]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Sinh viên');

    // Auto width
    ws['!cols'] = [
      { wch: 12 },
      { wch: 20 },
      { wch: 10 },
      { wch: 15 },
      { wch: 20 },
      { wch: 12 },
      { wch: 10 },
      { wch: 10 },
    ];

    XLSX.writeFile(wb, 'Template_SinhVien.xlsx');
  },

  /**
   * Đọc file Excel
   */
  readExcelFile: async (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (e) => {
        try {
          const data = e.target.result;
          const workbook = XLSX.read(data, { type: 'array' });
          const worksheet = workbook.Sheets[workbook.SheetNames[0]];
          const jsonData = XLSX.utils.sheet_to_json(worksheet);

          resolve(jsonData);
        } catch (error) {
          reject(error);
        }
      };

      reader.onerror = (error) => {
        reject(error);
      };

      reader.readAsArrayBuffer(file);
    });
  },

  /**
   * Xuất dữ liệu ra Excel
   */
  exportToExcel: (data, filename = 'export.xlsx', sheetName = 'Sheet1') => {
    try {
      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, sheetName);

      // Auto width
      const maxLen = {};
      data.forEach((row) => {
        Object.keys(row).forEach((key) => {
          const len = String(row[key]).length;
          maxLen[key] = Math.max(maxLen[key] || 0, len);
        });
      });

      ws['!cols'] = Object.keys(data[0] || {}).map((key) => ({
        wch: Math.min(maxLen[key] + 2, 50),
      }));

      XLSX.writeFile(wb, filename);
      return true;
    } catch (error) {
      console.error('Export error:', error);
      return false;
    }
  },

  /**
   * Validate dữ liệu sinh viên
   */
  validateStudentData: (data) => {
    const errors = [];
    const warnings = [];

    data.forEach((row, index) => {
      const rowNum = index + 2; // +2 vì header là row 1

      // Required fields
      if (!row.maSv) {
        errors.push(`Dòng ${rowNum}: Mã sinh viên không được để trống`);
      }
      if (!row.hoTen) {
        errors.push(`Dòng ${rowNum}: Họ tên không được để trống`);
      }
      if (!row.email) {
        errors.push(`Dòng ${rowNum}: Email không được để trống`);
      }
      if (!row.sdt) {
        errors.push(`Dòng ${rowNum}: Số điện thoại không được để trống`);
      }

      // Format validation
      if (row.email && !isValidEmail(row.email)) {
        errors.push(`Dòng ${rowNum}: Email không hợp lệ`);
      }

      if (row.sdt && !/^[0-9]{10}$/.test(String(row.sdt))) {
        warnings.push(`Dòng ${rowNum}: Số điện thoại không hợp lệ (cần 10 chữ số)`);
      }

      if (row.ngaySinh && !isValidDate(row.ngaySinh)) {
        warnings.push(`Dòng ${rowNum}: Ngày sinh không hợp lệ`);
      }

      // Valid enum values
      if (row.gioiTinh && !['NAM', 'NU', 'KHAC'].includes(row.gioiTinh)) {
        warnings.push(`Dòng ${rowNum}: Giới tính không hợp lệ (NAM, NU, hoặc KHAC)`);
      }

      if (row.isActive && !['true', 'false', '1', '0'].includes(String(row.isActive).toLowerCase())) {
        warnings.push(`Dòng ${rowNum}: Trạng thái không hợp lệ (true hoặc false)`);
      }
    });

    return { errors, warnings, isValid: errors.length === 0 };
  },

  /**
   * Format dữ liệu Excel thành DTO
   */
  formatStudentData: (excelData) => {
    return excelData.map((row) => ({
      maSv: row.maSv?.toString().trim(),
      hoTen: row.hoTen?.toString().trim(),
      gioiTinh: row.gioiTinh?.toString().trim() || 'NAM',
      ngaySinh: formatDate(row.ngaySinh),
      email: row.email?.toString().trim(),
      sdt: row.sdt?.toString().trim(),
      maLop: row.maLop?.toString().trim() || null,
      isActive: String(row.isActive).toLowerCase() === 'true' || row.isActive === 1,
    }));
  },
};

// Helper functions
function isValidEmail(email) {
  return /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(email);
}

function isValidDate(date) {
  const d = new Date(date);
  return d instanceof Date && !isNaN(d);
}

function formatDate(date) {
  if (!date) return null;
  const d = new Date(date);
  if (isNaN(d)) return null;
  return d.toISOString().split('T')[0]; // YYYY-MM-DD
}

export default excelService;
