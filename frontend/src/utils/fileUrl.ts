// Helper to convert relative upload paths to full URLs
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
const BASE_URL = API_URL.replace(/\/api\/?$/, '');

export const getFileUrl = (path: string): string => {
  if (!path) return '';
  // Already a full URL
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  // Relative path like /uploads/xxx.png
  return `${BASE_URL}${path}`;
};
