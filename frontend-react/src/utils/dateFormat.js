// Date utility functions for Vietnamese format

/**
 * Format date to Vietnamese format DD/MM/YYYY
 * @param {Date | string} date - Date object or ISO string
 * @returns {string} Formatted date string (DD/MM/YYYY)
 */
export const formatDate = (date) => {
  if (!date) return '';

  try {
    let d;
    if (typeof date === 'string') {
      // Nếu là chuỗi YYYY-MM-DD, tạo Date mà không bị ảnh hưởng bởi múi giờ (UTC)
      if (date.includes('-') && !date.includes('T') && !date.includes(':')) {
        const [y, m, d_part] = date.split('-');
        d = new Date(y, m - 1, d_part);
      } else {
        d = new Date(date);
      }
    } else {
      d = new Date(date);
    }

    if (isNaN(d.getTime())) return '';

    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  } catch (error) {
    console.error('Date formatting error:', error);
    return '';
  }
};

/**
 * Format date with time to Vietnamese format DD/MM/YYYY HH:mm
 * @param {Date | string} date - Date object or ISO string
 * @returns {string} Formatted date string with time
 */
export const formatDateTime = (date) => {
  if (!date) return '';

  try {
    const d = new Date(date);
    if (isNaN(d.getTime())) return '';

    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return `${day}/${month}/${year} ${hours}:${minutes}`;
  } catch (error) {
    console.error('DateTime formatting error:', error);
    return '';
  }
};

/**
 * Format time to Vietnamese format HH:mm
 * @param {Date | string} time - Date object or time string
 * @returns {string} Formatted time string
 */
export const formatTime = (time) => {
  if (!time) return '';

  try {
    if (typeof time === 'string' && time.includes(':')) {
      // Already a time string like "07:00" or "07:00:00"
      return time.substring(0, 5);
    }
    const d = new Date(time);
    if (isNaN(d.getTime())) return '';

    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  } catch (error) {
    console.error('Time formatting error:', error);
    return '';
  }
};

/**
 * Format date range to Vietnamese format
 * @param {Date | string} startDate - Start date
 * @param {Date | string} endDate - End date
 * @returns {string} Formatted date range
 */
export const formatDateRange = (startDate, endDate) => {
  if (!startDate || !endDate) return '';
  return `${formatDate(startDate)} - ${formatDate(endDate)}`;
};

/**
 * Get date for input type="date" (YYYY-MM-DD format)
 * This is required for HTML5 date inputs, regardless of display format
 * @param {Date | string} date - Date object or ISO string
 * @returns {string} Date in YYYY-MM-DD format
 */
export const getDateInputValue = (date) => {
  if (!date) return '';

  try {
    const d = new Date(date);
    if (isNaN(d.getTime())) return '';

    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  } catch (error) {
    console.error('Date input value error:', error);
    return '';
  }
};

/**
 * Parse DD/MM/YYYY string to Date object
 * @param {string} dateString - Date string in DD/MM/YYYY format
 * @returns {Date | null} Date object or null if invalid
 */
export const parseDate = (dateString) => {
  if (!dateString) return null;

  try {
    const parts = dateString.split(/[\/\-]/);
    if (parts.length !== 3) return null;
    
    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1; // Month is 0-indexed
    const year = parseInt(parts[2], 10);
    
    const date = new Date(year, month, day);
    if (isNaN(date.getTime())) return null;
    
    return date;
  } catch (error) {
    console.error('Date parsing error:', error);
    return null;
  }
};

/**
 * Cộng/Trừ phút vào một chuỗi thời gian HH:mm hoặc HH:mm:ss
 * @param {string} timeStr - Chuỗi thời gian gốc
 * @param {number} minutes - Số phút cần cộng (dùng số âm để trừ)
 * @returns {string} Chuỗi thời gian mới HH:mm:ss
 */
export const addMinutesToTime = (timeStr, minutes) => {
  if (!timeStr) return '';
  try {
    const [h, m, s = 0] = timeStr.split(':').map(Number);
    const date = new Date();
    date.setHours(h, m, s, 0);
    date.setMinutes(date.getMinutes() + minutes);
    
    const nh = String(date.getHours()).padStart(2, '0');
    const nm = String(date.getMinutes()).padStart(2, '0');
    const ns = String(date.getSeconds()).padStart(2, '0');
    return `${nh}:${nm}:${ns}`;
  } catch (e) {
    return timeStr;
  }
};
