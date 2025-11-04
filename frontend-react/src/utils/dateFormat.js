// Date utility functions for Vietnamese format

/**
 * Format date to Vietnamese format DD/MM/YYYY
 * @param {Date | string} date - Date object or ISO string
 * @returns {string} Formatted date string (DD/MM/YYYY)
 */
export const formatDate = (date) => {
  if (!date) return '';

  try {
    const d = new Date(date);
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
    let d;
    if (typeof time === 'string' && time.includes(':')) {
      // Already a time string like "07:00"
      return time.substring(0, 5);
    }
    d = new Date(time);
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
 * @param {Date | string} date - Date object or ISO string
 * @returns {string} Date in YYYY-MM-DD format
 */
export const getDateInputValue = (date) => {
  if (!date) return '';

  try {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  } catch (error) {
    console.error('Date input value error:', error);
    return '';
  }
};
