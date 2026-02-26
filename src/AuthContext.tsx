import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User, AuthResponse } from './types';

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (data: AuthResponse) => void;
  logout: () => Promise<void>;
  refreshToken: () => Promise<string | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const login = useCallback((data: AuthResponse) => {
    setUser(data.user);
    setToken(data.accessToken);
  }, []);

  const logout = useCallback(async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } finally {
      setUser(null);
      setToken(null);
    }
  }, []);

  const refreshToken = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/refresh', { method: 'POST' });
      if (res.ok) {
        const data: AuthResponse = await res.json();
        setUser(data.user);
        setToken(data.accessToken);
        return data.accessToken;
      }
      throw new Error('Refresh failed');
    } catch (e) {
      setUser(null);
      setToken(null);
      return null;
    }
  }, []);

  useEffect(() => {
    refreshToken().finally(() => setLoading(false));
  }, [refreshToken]);

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout, refreshToken }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
