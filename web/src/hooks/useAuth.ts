'use client';

import { useState } from 'react';
import { authApi } from '@/lib/api-client';

interface AuthState {
  user: { id: string; username: string; fullName: string; role: string } | null;
  isLoading: boolean;
  error: string | null;
}

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    user: null,
    isLoading: false,
    error: null,
  });

  const login = async (username: string, password: string) => {
    setState(s => ({ ...s, isLoading: true, error: null }));
    try {
      const result = await authApi.login(username, password) as { access_token: string; user: AuthState['user'] };
      if (typeof window !== 'undefined') {
        localStorage.setItem('govtrust_token', result.access_token);
      }
      setState({ user: result.user, isLoading: false, error: null });
      return result.user;
    } catch (e) {
      setState(s => ({ ...s, isLoading: false, error: (e as Error).message }));
    }
  };

  const logout = () => {
    if (typeof window !== 'undefined') localStorage.removeItem('govtrust_token');
    setState({ user: null, isLoading: false, error: null });
  };

  return { ...state, login, logout };
}
