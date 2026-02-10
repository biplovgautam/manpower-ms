export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000';

export const FILE_BASE_URL =
  process.env.NEXT_PUBLIC_FILE_BASE_URL || API_BASE_URL;

export const apiUrl = (path = '') => {
  if (!path) return API_BASE_URL;
  return `${API_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`;
};

export const fileUrl = (path = '') => {
  if (!path) return FILE_BASE_URL;
  return `${FILE_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`;
};
