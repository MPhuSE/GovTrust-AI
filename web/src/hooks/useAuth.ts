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
      const result = await authApi.login(username, password) as unknown as { access_token: string; user: AuthState['user'] };
      if (typeof window !== 'undefined') {
        localStorage.setItem('govtrust_token', result.access_token);
        if (result.user) localStorage.setItem('govtrust_user', JSON.stringify(result.user));
      }
      setState({ user: result.user, isLoading: false, error: null });
      return result.user;
    } catch (e) {
      setState(s => ({ ...s, isLoading: false, error: (e as Error).message }));
    }
  };

  const register = async (username: string, password: string, fullName: string) => {
    setState(s => ({ ...s, isLoading: true, error: null }));
    try {
      const result = await authApi.register({ username, password, fullName }) as unknown as { access_token: string; user: AuthState['user'] };
      if (typeof window !== 'undefined') {
        localStorage.setItem('govtrust_token', result.access_token);
        if (result.user) localStorage.setItem('govtrust_user', JSON.stringify(result.user));
      }
      setState({ user: result.user, isLoading: false, error: null });
      return result.user;
    } catch (e) {
      setState(s => ({ ...s, isLoading: false, error: (e as Error).message }));
    }
  };

  const logout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('govtrust_token');
      localStorage.removeItem('govtrust_user');
    }
    setState({ user: null, isLoading: false, error: null });
  };

  return { ...state, login, register, logout };
}
