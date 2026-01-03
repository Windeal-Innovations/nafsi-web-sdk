/**
 * Helper utility functions
 */

/**
 * Convert base64 data URL to blob
 * @param {string} dataURL - Base64 data URL
 * @returns {Blob}
 */
export function dataURLToBlob(dataURL) {
  const parts = dataURL.split(',');
  const mime = parts[0].match(/:(.*?);/)[1];
  const bstr = atob(parts[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);

  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }

  return new Blob([u8arr], { type: mime });
}

/**
 * Calculate file size from base64 string
 * @param {string} base64String - Base64 encoded string
 * @returns {number} - Size in bytes
 */
export function getBase64Size(base64String) {
  const padding = (base64String.match(/=/g) || []).length;
  const base64Length = base64String.length;
  return (base64Length * 0.75) - padding;
}

/**
 * Format bytes to human readable size
 * @param {number} bytes - Size in bytes
 * @returns {string} - Formatted size string
 */
export function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}
