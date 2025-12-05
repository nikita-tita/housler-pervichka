'use client';

import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { api, getStoredToken, setStoredToken, removeStoredToken } from '@/services/api';
import type { User, AuthState } from '@/types';

interface AuthContextType extends AuthState {
  login: (email: string, code: string) => Promise<void>;
  logout: () => void;
  requestCode: (email: string) => Promise<void>;
  setUser: (user: User) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    token: null,
    isAuthenticated: false,
    isLoading: true,
  });

  // Check stored token on mount
  useEffect(() => {
    const checkAuth = async () => {
      const token = getStoredToken();
      if (!token) {
        setState(prev => ({ ...prev, isLoading: false }));
        return;
      }

      const response = await api.getMe();
      if (response.success && response.data) {
        const user = response.data;
        setState({
          user,
          token,
          isAuthenticated: true,
          isLoading: false,
        });
      } else {
        // Токен невалидный (401) или другая ошибка — удаляем токен
        removeStoredToken();
        setState({ user: null, token: null, isAuthenticated: false, isLoading: false });
      }
    };

    checkAuth();
  }, []);

  const requestCode = useCallback(async (email: string) => {
    const response = await api.requestCode(email);
    if (!response.success) {
      throw new Error(response.error || 'Failed to send code');
    }
  }, []);

  const login = useCallback(async (email: string, code: string) => {
    const response = await api.verifyCode(email, code);
    if (!response.success || !response.data?.user || !response.data?.token) {
      throw new Error(response.error || 'Invalid code');
    }

    const { user, token } = response.data;
    setStoredToken(token);
    setState({
      user,
      token,
      isAuthenticated: true,
      isLoading: false,
    });
  }, []);

  const logout = useCallback(() => {
    removeStoredToken();
    setState({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
    });
  }, []);

  const setUser = useCallback((user: User) => {
    const token = getStoredToken();
    setState({
      user,
      token,
      isAuthenticated: true,
      isLoading: false,
    });
  }, []);

  return (
    <AuthContext.Provider value={{ ...state, login, logout, requestCode, setUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
