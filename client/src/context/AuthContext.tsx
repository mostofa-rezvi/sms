import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import {
  ApiService,
  getStoredApiKey,
  setStoredApiKey,
  clearStoredAuth,
  getStoredServerUrl,
  setStoredServerUrl,
} from '../api/client';

interface AuthContextType {
  user: User | null;
  apiKey: string;
  serverUrl: string;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (key: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  updateServerUrl: (url: string) => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [apiKey, setApiKey] = useState<string>(getStoredApiKey());
  const [serverUrl, setServerUrl] = useState<string>(getStoredServerUrl());
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchProfile = async () => {
    const key = getStoredApiKey();
    if (!key) {
      setUser(null);
      setIsLoading(false);
      return;
    }

    try {
      const res = await ApiService.getMe();
      if (res.data) {
        setUser(res.data);
      }
    } catch (err) {
      console.warn('Failed to load user with stored API key:', err);
      // Keep apiKey if user was previously offline or backend temporarily unreachable
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const login = async (key: string) => {
    setIsLoading(true);
    try {
      setStoredApiKey(key);
      setApiKey(key);
      const res = await ApiService.login(key);
      if (res.data) {
        setUser(res.data);
        return { success: true };
      }
      return { success: false, error: 'User data not returned' };
    } catch (err: any) {
      clearStoredAuth();
      setApiKey('');
      setUser(null);
      const errorMsg =
        err.response?.data?.message ||
        err.message ||
        'Failed to connect to CTP SMS Server. Please check your API Key and Server URL.';
      return { success: false, error: errorMsg };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    clearStoredAuth();
    setApiKey('');
    setUser(null);
  };

  const updateServerUrl = (url: string) => {
    setStoredServerUrl(url);
    setServerUrl(url);
  };

  const refreshUser = async () => {
    await fetchProfile();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        apiKey,
        serverUrl,
        isAuthenticated: Boolean(apiKey),
        isLoading,
        login,
        logout,
        updateServerUrl,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

