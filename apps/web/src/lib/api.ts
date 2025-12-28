import axios from 'axios';

// Determine API URL: use env var if set, otherwise detect environment
const getApiUrl = (): string => {
  // Explicitly set env var takes priority
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }
  
  // Runtime detection for browser
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    // If frontend is on Vercel, use Vercel API
    if (hostname.includes('vercel.app') || hostname.includes('zad-alhidaya-web')) {
      return 'https://zad-alhidaya-platform-api.vercel.app';
    }
  }
  
  // Server-side: check if we're in production
  if (process.env.NODE_ENV === 'production') {
    return 'https://zad-alhidaya-platform-api.vercel.app';
  }
  
  // Default to localhost for local development
  return 'http://localhost:3001';
};

const API_URL = getApiUrl();

// Log API URL in development for debugging
if (process.env.NODE_ENV === 'development' || typeof window !== 'undefined') {
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

