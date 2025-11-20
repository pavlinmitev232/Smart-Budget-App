import axios from 'axios';
import { showError } from '../utils/toast';

/**
 * Axios instance configured for Smart Budget API
 * Base URL points to backend server
 * 
 * In production, this will use the same domain with /api path
 * In development, this points to localhost:5000
 */
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Add request interceptor to attach auth token if available
 */
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

/**
 * Add response interceptor to handle global errors
 */
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Log error details in development
    if (import.meta.env.DEV) {
      console.error('API Error:', error);
      console.error('Error Response:', error.response);
      console.error('Error Request:', error.request);
    }

    // Handle errors with server response (4xx, 5xx)
    if (error.response) {
      const { status } = error.response;
      const path = window.location.pathname;

      switch (status) {
        case 400:
          // Bad request - let component handle specific validation errors
          // Only show generic toast if no custom message provided
          if (!error.response.data?.error?.message?.includes('validation')) {
            showError('Invalid data. Please check your inputs.');
          }
          break;

        case 401:
          // Unauthorized - session expired
          // Only show toast if not already on login/register pages
          if (path !== '/login' && path !== '/register') {
            showError('Session expired. Please log in again.');
            // Clear local storage and redirect to login
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/login';
          }
          break;

        case 403:
          // Forbidden - insufficient permissions
          showError("You don't have permission to do that.");
          break;

        case 404:
          // Not found
          showError('Requested data not found.');
          break;

        case 500:
        case 502:
        case 503:
          // Server errors
          showError('Server error. Please try again later.');
          break;

        default:
          // Generic error for other status codes
          showError('An error occurred. Please try again.');
      }
    } else if (error.request) {
      // Request was made but no response received (network error)
      showError('No internet connection. Please check your network.');
      console.error('Network Error: No response received');
    } else {
      // Something else happened while setting up the request
      showError('An unexpected error occurred.');
      console.error('Error:', error.message);
    }

    return Promise.reject(error);
  }
);

export default api;
