import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import type { User } from '../types/auth';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  const isAuthenticated = user !== null;

  /**
   * Login function - stores token and user data
   */
  const login = (token: string, userData: User) => {
    // Store token in localStorage for persistence
    localStorage.setItem('token', token);

    // Update user state
    setUser(userData);
  };

  /**
   * Logout function - clears token and user data
   */
  const logout = () => {
    // Clear token from storage
    localStorage.removeItem('token');

    // Clear user state
    setUser(null);

    // Redirect to login page
    navigate('/login');
  };

  /**
   * Check for existing token on app load
   * Validates token with backend and restores session if valid
   */
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token');

      if (!token) {
        setIsLoading(false);
        return;
      }

      try {
        // Validate token with backend
        const response = await api.get('/auth/me');

        if (response.data.success && response.data.data.user) {
          // Token is valid, restore session
          setUser(response.data.data.user);
        } else {
          // Token invalid, clear it
          localStorage.removeItem('token');
        }
      } catch (error) {
        // Token validation failed (expired or invalid)
        console.error('Token validation failed:', error);
        localStorage.removeItem('token');
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  /**
   * Setup axios response interceptor to handle 401 errors
   */
  useEffect(() => {
    const interceptor = api.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          // Token expired or invalid
          console.log('Session expired. Logging out...');
          logout();
        }
        return Promise.reject(error);
      }
    );

    // Cleanup interceptor on unmount
    return () => {
      api.interceptors.response.eject(interceptor);
    };
  }, []);

  const value: AuthContextType = {
    user,
    isAuthenticated,
    isLoading,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * Custom hook to use AuthContext
 * Throws error if used outside AuthProvider
 */
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);

  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
}
