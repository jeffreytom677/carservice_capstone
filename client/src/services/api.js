/**
 * api.js — single Axios instance for all HTTP calls.
 *
 * Rules:
 *  - All API calls MUST go through this module; no bare fetch() elsewhere.
 *  - The base URL is read from the environment variable; never hard-coded.
 *  - The JWT token is attached automatically via a request interceptor.
 *  - 401 responses trigger a global logout (token expired / invalid).
 */

import axios from 'axios';
import { API_URL } from '../config.js';

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
});

// ── Request interceptor: attach JWT ──────────────────────────────────────────
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('sb_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ── Response interceptor: handle 401 globally ────────────────────────────────
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid — clear storage and redirect to login
      localStorage.removeItem('sb_token');
      localStorage.removeItem('sb_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
