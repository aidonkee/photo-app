export const MAX_UPLOAD_SIZE = 50 * 1024 * 1024; // 50MB in bytes

export const ACCEPTED_IMAGE_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
] as const;

export const DEFAULT_CURRENCY = 'KZT';

export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
  PHOTOS_PER_PAGE: 24,
  ORDERS_PER_PAGE: 10,
} as const;

export const PHOTO_CONSTRAINTS = {
  MIN_WIDTH: 800,
  MIN_HEIGHT: 600,
  MAX_WIDTH: 8000,
  MAX_HEIGHT: 8000,
  THUMBNAIL_SIZE: 300,
  PREVIEW_SIZE: 1500,
} as const;

export const ORDER_STATUS = {
  PENDING: 'PENDING',
  APPROVED_BY_TEACHER: 'APPROVED_BY_TEACHER',
  LOCKED:  'LOCKED',
  COMPLETED: 'COMPLETED',
} as const;

export const EDIT_REQUEST_STATUS = {
  PENDING: 'PENDING',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
} as const;

export const ROLES = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  ADMIN: 'ADMIN',
  TEACHER: 'TEACHER',
} as const;