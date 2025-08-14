'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import apiService from '@/services/apiservices';

interface User {
  id: string;
  username: string;
  email: string;
  first_name?: string;
  last_name?: string;
  profile_picture?: string;
  is_verified: boolean;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<boolean>;
  refreshUser: () => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const getStoredTokens = () => {
    if (typeof window !== 'undefined') {
      return {
        accessToken: localStorage.getItem('accessToken'),
        refreshToken: localStorage.getItem('refreshToken')
      };
    }
    return { accessToken: null, refreshToken: null };
  };

  const setTokens = (access: string, refresh: string) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('accessToken', access);
      localStorage.setItem('refreshToken', refresh);
    }
  };

  const clearTokens = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
    }
  };

  const refreshToken = async (): Promise<boolean> => {
    try {
      const { refreshToken: storedRefreshToken } = getStoredTokens();
      if (!storedRefreshToken) return false;

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_HOST}/api/auth/token/refresh/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refresh: storedRefreshToken }),
      });

      if (response.ok) {
        const data = await response.json();
        setTokens(data.access, storedRefreshToken);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Token refresh failed:', error);
      return false;
    }
  };

  const fetchUserProfile = async (): Promise<User | null> => {
    try {
      const response = await apiService.get('/api/auth/profile/');
      if (response.success && response.data) {
        return {
          id: response.data.id.toString(), // Convert to string for consistency
          username: response.data.username,
          email: response.data.email,
          first_name: response.data.first_name,
          last_name: response.data.last_name,
          profile_picture: response.data.profile_picture,
          is_verified: response.data.is_verified
        };
      }
      return null;
    } catch (error) {
      console.error('Failed to fetch user profile:', error);
      return null;
    }
  };

  const login = async (username: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const body = JSON.stringify({ username, password });
      const response = await apiService.postWithoutToken('/api/auth/login/', body);

      if (response.success && response.access && response.refresh) {
        setTokens(response.access, response.refresh);
        const userProfile = await fetchUserProfile();
        if (userProfile) {
          setUser(userProfile);
          return { success: true };
        }
      }

      return { success: false, error: response.error || 'Login failed' };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: 'An unexpected error occurred' };
    }
  };

  const logout = async () => {
    try {
      const { refreshToken: storedRefreshToken } = getStoredTokens();
      if (storedRefreshToken) {
        await apiService.postWithoutToken('/api/auth/logout/', JSON.stringify({ 
          refresh_token: storedRefreshToken 
        }));
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      clearTokens();
      setUser(null);
      router.push('/sign-in');
    }
  };

  const checkAuthStatus = async () => {
    const { accessToken } = getStoredTokens();
    
    if (!accessToken) {
      setLoading(false);
      return;
    }

    // Try to fetch user profile with current token
    const userProfile = await fetchUserProfile();
    
    if (userProfile) {
      setUser(userProfile);
    } else {
      // Try to refresh token
      const refreshSuccess = await refreshToken();
      if (refreshSuccess) {
        const refreshedUserProfile = await fetchUserProfile();
        if (refreshedUserProfile) {
          setUser(refreshedUserProfile);
        }
      } else {
        clearTokens();
      }
    }
    
    setLoading(false);
  };

  const refreshUser = async () => {
    try {
      const userProfile = await fetchUserProfile();
      if (userProfile) {
        setUser(userProfile);
      }
    } catch (error) {
      console.error('Failed to refresh user data:', error);
    }
  };

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const value: AuthContextType = {
    user,
    loading,
    login,
    logout,
    refreshToken,
    refreshUser,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
