'use client';

import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { authMe, authLogout, getDashboard, getCompanies, getTransactions, getBudgets, getNoteCategories } from '@/lib/api';

interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  profile_photo: string | null;
}

// In-memory prefetch cache — populated as soon as a token exists,
// so each page's data is ready (or nearly ready) by the time it renders.
export const prefetchCache: {
  dashboard?: Promise<unknown>;
  companies?: Promise<unknown>;
  transactions?: Promise<unknown>;
  budgets?: Promise<unknown>;
  noteCategories?: Promise<unknown>;
  clear: () => void;
} = {
  clear() {
    delete this.dashboard;
    delete this.companies;
    delete this.transactions;
    delete this.budgets;
    delete this.noteCategories;
  },
};

interface AuthContextType {
  user: User | null;
  loading: boolean;
  checkAuth: () => Promise<void>;
  loginAndSetUser: (accessToken: string, refreshToken: string) => Promise<void>;
  logout: () => Promise<void>;
  setUser: (user: User | null) => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  checkAuth: async () => {},
  loginAndSetUser: async () => {},
  logout: async () => {},
  setUser: () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const checkAuth = useCallback(async () => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }
    // Start prefetching all page data in parallel with auth check,
    // so data is ready (or nearly ready) by the time each page renders.
    if (!prefetchCache.dashboard) {
      prefetchCache.dashboard = getDashboard().catch(() => null);
      prefetchCache.companies = getCompanies().catch(() => null);
      prefetchCache.transactions = getTransactions({}).catch(() => null);
      prefetchCache.budgets = getBudgets({}).catch(() => null);
      prefetchCache.noteCategories = getNoteCategories().catch(() => null);
    }
    try {
      const res = await authMe();
      setUser(res.data);
    } catch {
      setUser(null);
      prefetchCache.clear();
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
    } finally {
      setLoading(false);
    }
  }, []);

  // Login: store tokens and fetch user in one step (avoids Safari localStorage timing issues)
  const loginAndSetUser = useCallback(async (accessToken: string, refreshToken: string) => {
    localStorage.setItem('access_token', accessToken);
    localStorage.setItem('refresh_token', refreshToken);
    try {
      const res = await authMe();
      setUser(res.data);
      setLoading(false);
    } catch {
      setUser(null);
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      setLoading(false);
      throw new Error('Failed to fetch user after login');
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await authLogout();
    } catch {
      // ignore
    }
    prefetchCache.clear();
    setUser(null);
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  return (
    <AuthContext.Provider value={{ user, loading, checkAuth, loginAndSetUser, logout, setUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
