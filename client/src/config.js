/**
 * Application configuration
 * Defaults to live Render production backend URL if environment variables are not set.
 */
export const API_BASE_URL =
  (typeof import.meta !== 'undefined' && import.meta.env && (import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL)) ||
  (typeof process !== 'undefined' && process.env && (process.env.VITE_API_URL || process.env.REACT_APP_API_URL)) ||
  'https://carservice-capstone-1.onrender.com';

// Ensure the endpoint includes /api without duplicated slashes
const cleanURL = API_BASE_URL.replace(/\/+$/, '');
export const API_URL = cleanURL.endsWith('/api') ? cleanURL : `${cleanURL}/api`;

export default {
  API_BASE_URL,
  API_URL,
};
