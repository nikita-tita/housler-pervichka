'use client';

import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { api, getStoredToken, setStoredToken, removeStoredToken } from '@/services/api';
import type { User, AuthState } from '@/types';

interface AuthContextType extends AuthState {
  login: (email: string, code: string) => Promise<void>;
  logout: () => void;
  requestCode: (email: string) => Promise<void>;
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

      try {
        const response = await api.getMe();
        if (response.success && response.data) {
          setState({
            user: response.data,
            token,
            isAuthenticated: true,
            isLoading: false,
          });
        } else {
          removeStoredToken();
          setState({ user: null, token: null, isAuthenticated: false, isLoading: false });
        }
      } catch {
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
    if (!response.success || !response.data) {
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

  return (
    <AuthContext.Provider value={{ ...state, login, logout, requestCode }}>
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
