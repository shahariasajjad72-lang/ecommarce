// Allowed image MIME types
export const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
] as const;

// File extensions mapping
export const MIME_TO_EXT: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/gif': '.gif',
  'image/webp': '.webp',
};

// Upload limits
export const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
export const MAX_FILES_COUNT = 10; // Max files per request

// Image processing
export const IMAGE_QUALITY = 80; // WebP quality (1-100)
export const MAX_IMAGE_WIDTH = 1920; // Max width in pixels
export const THUMBNAIL_SIZE = 300; // Thumbnail dimensions

// Valid folders for organization
export const VALID_FOLDERS = [
  'product',
  'profile',
  'category',
  'brand',
  'tag',
  'general',
] as const;

export type ImageFolder = (typeof VALID_FOLDERS)[number];
