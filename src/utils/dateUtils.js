/**
 * Date utility functions for NZ date formatting
 * All dates should be displayed in DD/MM/YYYY format (NZ/International standard)
 */

/**
 * Format date to DD/MM/YYYY
 * @param {string|Date} date - Date to format
 * @returns {string} Formatted date string
 */
export const formatDateNZ = (date) => {
  if (!date) return '';
  
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';
  
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  
  return `${day}/${month}/${year}`;
};

/**
 * Format date to DD/MM/YYYY HH:mm
 * @param {string|Date} date - Date to format
 * @returns {string} Formatted date and time string
 */
export const formatDateTimeNZ = (date) => {
  if (!date) return '';
  
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';
  
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  
  return `${day}/${month}/${year} ${hours}:${minutes}`;
};

/**
 * Format time to HH:mm
 * @param {string|Date} date - Date to format
 * @returns {string} Formatted time string
 */
export const formatTimeNZ = (date) => {
  if (!date) return '';
  
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';
  
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  
  return `${hours}:${minutes}`;
};

/**
 * Format date for display with relative time
 * @param {string|Date} date - Date to format
 * @returns {string} Formatted string (e.g., "Today", "Yesterday", or "DD/MM/YYYY")
 */
export const formatRelativeDateNZ = (date) => {
  if (!date) return '';
  
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';
  
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  
  // Reset time to compare dates only
  today.setHours(0, 0, 0, 0);
  yesterday.setHours(0, 0, 0, 0);
  const compareDate = new Date(d);
  compareDate.setHours(0, 0, 0, 0);
  
  if (compareDate.getTime() === today.getTime()) {
    return 'Today';
  } else if (compareDate.getTime() === yesterday.getTime()) {
    return 'Yesterday';
  } else {
    return formatDateNZ(d);
  }
};

/**
 * Get current date in NZ timezone
 * @returns {Date} Current date in NZ timezone
 */
export const getCurrentDateNZ = () => {
  return new Date(new Date().toLocaleString('en-NZ', { timeZone: 'Pacific/Auckland' }));
};

/**
 * Format date to YYYY-MM-DD (for database storage)
 * @param {Date} date - Date to format
 * @returns {string} Formatted date string
 */
export const formatDateForDB = (date) => {
  if (!date) return '';
  
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';
  
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  
  return `${year}-${month}-${day}`;
};

/**
 * Parse DD/MM/YYYY to Date object
 * @param {string} dateString - Date string in DD/MM/YYYY format
 * @returns {Date|null} Date object or null if invalid
 */
export const parseDateNZ = (dateString) => {
  if (!dateString) return null;
  
  const parts = dateString.split('/');
  if (parts.length !== 3) return null;
  
  const day = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1; // Months are 0-indexed
  const year = parseInt(parts[2], 10);
  
  const date = new Date(year, month, day);
  
  // Validate the date
  if (isNaN(date.getTime())) return null;
  if (date.getDate() !== day || date.getMonth() !== month || date.getFullYear() !== year) {
    return null;
  }
  
  return date;
};

/**
 * Format timestamp for display (relative if recent, absolute if old)
 * @param {string|Date} timestamp - Timestamp to format
 * @returns {string} Formatted string
 */
export const formatTimestampNZ = (timestamp) => {
  if (!timestamp) return '';
  
  const date = new Date(timestamp);
  if (isNaN(date.getTime())) return '';
  
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} minute${diffMins === 1 ? '' : 's'} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;
  
  return formatDateNZ(date);
};

/**
 * Get day name
 * @param {string|Date} date - Date to get day name from
 * @returns {string} Day name (e.g., "Monday")
 */
export const getDayName = (date) => {
  if (!date) return '';
  
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';
  
  return d.toLocaleDateString('en-NZ', { weekday: 'long', timeZone: 'Pacific/Auckland' });
};

/**
 * Get month name
 * @param {string|Date} date - Date to get month name from
 * @returns {string} Month name (e.g., "January")
 */
export const getMonthName = (date) => {
  if (!date) return '';
  
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';
  
  return d.toLocaleDateString('en-NZ', { month: 'long', timeZone: 'Pacific/Auckland' });
};

