const trimTrailingSlash = (value) => (value ? value.replace(/\/+$/, '') : '');
const normalizePath = (path = '') => (path.startsWith('/') ? path : `/${path}`);

const DEFAULT_API_BASE_URL =
  process.env.NODE_ENV === 'production'
    ? 'https://api.manpower.biplovgautam.com.np'
    : 'http://localhost:5000';

export const API_BASE_URL = trimTrailingSlash(
  process.env.NEXT_PUBLIC_API_BASE_URL || DEFAULT_API_BASE_URL
);

export const FILE_BASE_URL = trimTrailingSlash(
  process.env.NEXT_PUBLIC_FILE_BASE_URL || API_BASE_URL
);

export const apiUrl = (path = '') => `${API_BASE_URL}${normalizePath(path)}`;
export const fileUrl = (path = '') => `${FILE_BASE_URL}${normalizePath(path)}`;
