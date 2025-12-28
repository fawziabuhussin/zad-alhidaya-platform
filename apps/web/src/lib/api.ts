import axios from 'axios';

// Determine API URL: prioritize env var, then runtime detection
const getApiUrl = (): string => {
  // 1. Check build-time env var (set in Vercel)
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }
  
  // 2. Runtime detection for browser (client-side)
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    // If frontend is on Vercel, use Vercel API
    if (hostname.includes('vercel.app') || hostname.includes('zad-alhidaya')) {
      return 'https://zad-alhidaya-platform-api.vercel.app';
    }
    // Local development
    return 'http://localhost:3001';
  }
  
  // 3. Server-side rendering (SSR)
  // In production on Vercel, use Vercel API
  if (process.env.VERCEL || process.env.NODE_ENV === 'production') {
    return 'https://zad-alhidaya-platform-api.vercel.app';
  }
  
  // Default to localhost for local development
  return 'http://localhost:3001';
};

const API_URL = getApiUrl();

// Always log API URL for debugging (helps identify issues)
if (typeof window !== 'undefined') {
  console.log('[API] Using API URL:', API_URL);
}

export const api = axios.create({
  baseURL: `${API_URL}/api`,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Handle token refresh on 401
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const response = await axios.post(
          `${API_URL}/api/auth/refresh`,
          {},
          { withCredentials: true }
        );

        const { accessToken } = response.data;
        localStorage.setItem('accessToken', accessToken);

        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        localStorage.removeItem('accessToken');
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;

