'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { authApi } from '@/lib/api-client';

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) return;

    setIsLoading(true);
    setError(null);
    try {
      const result = (await authApi.login(username, password)) as unknown as {
        access_token: string;
        user: { role: string };
      };
      if (typeof window !== 'undefined') {
        localStorage.setItem('govtrust_token', result.access_token);
        localStorage.setItem('govtrust_user', JSON.stringify(result.user));
      }
      // Redirect based on role
      if (result.user.role === 'OFFICER' || result.user.role === 'ADMIN') {
        router.push('/dashboard');
      } else {
        router.push('/');
      }
    } catch (e) {
      setError((e as Error).message || 'Sai tên đăng nhập hoặc mật khẩu');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-700 via-blue-800 to-blue-900 flex items-center justify-center px-4">
      <div className="w-full max-w-md animate-scale-in">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <span className="text-blue-700 font-bold text-2xl">G</span>
          </div>
          <h1 className="text-2xl font-bold text-white mb-1">Cổng Dịch Vụ Công AI</h1>
          <p className="text-blue-200 text-sm">Đăng nhập để tiếp tục</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-2xl p-8">
          <div className="space-y-5">
            <div>
              <label htmlFor="username" className="input-label">
                Tên đăng nhập
              </label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="input-field"
                placeholder="Số điện thoại hoặc CCCD"
                autoComplete="username"
                required
              />
            </div>

            <div>
              <label htmlFor="password" className="input-label">
                Mật khẩu
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-field"
                placeholder="Nhập mật khẩu"
                autoComplete="current-password"
                required
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-700 text-sm flex items-center gap-2">
                <span>❌</span>
                {error}
              </div>
            )}

            <button type="submit" className="btn-primary w-full" disabled={isLoading}>
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Đang đăng nhập...
                </span>
              ) : (
                'Đăng nhập'
              )}
            </button>
          </div>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-500">
              Chưa có tài khoản?{' '}
              <Link href="/register" className="text-blue-700 font-medium hover:underline">
                Đăng ký
              </Link>
            </p>
          </div>

          <div className="mt-4 pt-4 border-t border-gray-100 text-center">
            <Link href="/" className="text-sm text-gray-400 hover:text-gray-600 transition-colors">
              ← Tiếp tục mà không đăng nhập
            </Link>
          </div>
        </form>

        <p className="text-center text-blue-200/60 text-xs mt-6">
          © {new Date().getFullYear()} Hệ thống Phục vụ Công dân AI — Chính phủ Việt Nam
        </p>
      </div>
    </div>
  );
}
