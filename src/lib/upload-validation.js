// /lib/upload-validation.js
// Shared file-upload validation. Previously, uploads were checked for
// size in one route (50MB) and not at all in another, and NEITHER route
// restricted file type — any extension could be uploaded, including
// executables or SVGs (which can carry embedded scripts). This is a
// security control, not just a UX nicety.

export const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024; // 50MB

// Deliberately excludes SVG (can embed <script>) and any executable/
// archive type. Add more as genuinely needed, not by default.
export const ALLOWED_MIME_TYPES = new Set([
  // Documents
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'text/plain',
  'text/csv',
  // Images (raster only — no image/svg+xml)
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
]);

/**
 * @param {File} file
 * @returns {{ valid: boolean, error?: string }}
 */
export function validateUploadedFile(file) {
  if (!file || file.size === 0) {
    return { valid: false, error: 'No file provided' };
  }
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return { valid: false, error: `File exceeds the ${MAX_FILE_SIZE_BYTES / (1024 * 1024)}MB limit` };
  }
  if (!ALLOWED_MIME_TYPES.has(file.type)) {
    return { valid: false, error: `File type "${file.type || 'unknown'}" is not allowed` };
  }
  return { valid: true };
}
