'use client';

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
} from 'react';
import { sendOtp, verifyOtp, logout as apiLogout, getProfile, type User } from '../modules/auth.api';
import { getAccessToken, setAccessToken } from '../api';

interface AuthContextValue {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  sendOtp: (phone: string) => Promise<void>;
  verifyOtp: (phone: string, otp: string) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // On mount, check if we have a token and fetch the user profile
  useEffect(() => {
    async function initAuth() {
      // Check localStorage directly for token
      const storedToken = typeof window !== 'undefined' ? localStorage.getItem('pb_access_token') : null;
      const storedRT = typeof window !== 'undefined' ? localStorage.getItem('pb_refresh_token') : null;
      
      console.log('[Auth] Init - Checking localStorage:', {
        hasToken: !!storedToken,
        hasRefreshToken: !!storedRT,
      });
      
      // Ensure tokens are loaded into memory
      if (storedToken) {
        setAccessToken(storedToken, storedRT || undefined);
      }
      
      const token = getAccessToken();
      
      if (token || storedRT) {
        try {
          console.log('[Auth] Attempting to fetch profile...');
          const profile = await getProfile();
          console.log('[Auth] Profile fetched successfully:', profile);
          setUser(profile);
        } catch (error: any) {
          // If getProfile fails with 403/404, try to extract user from token or allow with minimal info
          console.warn('[Auth] getProfile failed:', error?.response?.status, error?.message);
          
          // If we have a token, assume user is authenticated but profile fetch failed
          // This handles cases where /auth/me endpoint might not exist or have permission issues
          if (token) {
            console.log('[Auth] Token exists but getProfile failed, allowing access with token');
            // Create a minimal user object - the actual profile might be fetched later
            setUser({
              id: 'unknown',
              phone: 'unknown',
              role: 'BUYER',
              email: null,
            });
          } else {
            // No token and profile fetch failed, clear everything
            console.log('[Auth] No token and profile fetch failed, clearing auth');
            setAccessToken(null, null);
            setUser(null);
          }
        }
      } else {
        console.log('[Auth] No stored token or refresh token found');
      }
      setIsLoading(false);
    }
    initAuth();
  }, []);

  const handleSendOtp = useCallback(async (phone: string) => {
    await sendOtp(phone);
  }, []);

  const handleVerifyOtp = useCallback(async (phone: string, otp: string) => {
    const response = await verifyOtp(phone, otp);
    setUser(response.user);
  }, []);

  const handleLogout = useCallback(async () => {
    try {
      await apiLogout();
    } catch {
      // Ignore logout API errors
    } finally {
      setAccessToken(null, null);
      setUser(null);
    }
  }, []);

  const handleRefresh = useCallback(async () => {
    try {
      const profile = await getProfile();
      setUser(profile);
    } catch (error) {
      console.error('[Auth] Refresh failed:', error);
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        sendOtp: handleSendOtp,
        verifyOtp: handleVerifyOtp,
        logout: handleLogout,
        refresh: handleRefresh,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
