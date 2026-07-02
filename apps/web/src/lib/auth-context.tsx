'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';

/**
 * User shape returned by POST /auth/login → buildToken():
 *   { access_token, user: { id, username, fullName, role } }
 */
export interface User {
  id: string;
  username: string;
  fullName: string;
  role: 'CITIZEN' | 'OFFICER' | 'ADMIN';
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Rehydrate auth state on mount
    const checkAuth = () => {
      try {
        const token = localStorage.getItem('govtrust_token');
        const userDataStr = localStorage.getItem('govtrust_user');
        
        if (token && userDataStr) {
          const userData = JSON.parse(userDataStr) as User;
          setUser(userData);
        } else {
          setUser(null);
        }
      } catch (e) {
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [pathname]); // Re-check on route changes

  const logout = () => {
    localStorage.removeItem('govtrust_token');
    localStorage.removeItem('govtrust_user');
    setUser(null);
    router.push('/login');
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
