import { toast } from 'react-toastify';

// Default toast configuration
const defaultOptions = {
  position: 'top-right' as const,
  autoClose: 3000,
  hideProgressBar: false,
  closeOnClick: true,
  pauseOnHover: true,
  draggable: true,
};

// Rate limiting to prevent toast spam
let lastToastTime = 0;
const TOAST_DELAY = 500; // milliseconds

function shouldShowToast(): boolean {
  const now = Date.now();
  if (now - lastToastTime > TOAST_DELAY) {
    lastToastTime = now;
    return true;
  }
  return false;
}

/**
 * Display a success toast notification
 * @param message - The message to display
 * @param options - Optional toast configuration
 */
export const showSuccess = (message: string, options?: object) => {
  if (shouldShowToast()) {
    toast.success(message, { ...defaultOptions, ...options });
  }
};

/**
 * Display an error toast notification
 * @param message - The message to display
 * @param options - Optional toast configuration
 */
export const showError = (message: string, options?: object) => {
  if (shouldShowToast()) {
    toast.error(message, {
      ...defaultOptions,
      autoClose: 5000, // Errors stay longer
      ...options
    });
  }
};

/**
 * Display an info toast notification
 * @param message - The message to display
 * @param options - Optional toast configuration
 */
export const showInfo = (message: string, options?: object) => {
  if (shouldShowToast()) {
    toast.info(message, { ...defaultOptions, ...options });
  }
};

/**
 * Display a warning toast notification
 * @param message - The message to display
 * @param options - Optional toast configuration
 */
export const showWarning = (message: string, options?: object) => {
  if (shouldShowToast()) {
    toast.warning(message, {
      ...defaultOptions,
      autoClose: 4000, // Warnings stay a bit longer
      ...options
    });
  }
};

/**
 * Dismiss all active toasts
 */
export const dismissAll = () => {
  toast.dismiss();
};
