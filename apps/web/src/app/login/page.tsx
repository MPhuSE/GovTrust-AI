'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { authApi } from '@/lib/api-client';
import { CitizenLayout } from '@/components/layout/CitizenLayout';

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const userStr = localStorage.getItem('govtrust_user');
      if (userStr) {
        try {
          const user = JSON.parse(userStr);
          const redirectUrl = sessionStorage.getItem('govtrust_redirect') || '/';
          sessionStorage.removeItem('govtrust_redirect');

          if (user.role === 'OFFICER' || user.role === 'ADMIN') {
            router.push('/dashboard');
          } else {
            router.push(redirectUrl);
          }
        } catch (e) {
          // invalid json, ignore
        }
      }
    }
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) return;

    setIsLoading(true);
    setError(null);
    try {
      // Trim username (dán từ clipboard hay dính space cuối) — password KHÔNG trim
      // vì khoảng trắng có thể là ký tự hợp lệ trong mật khẩu.
      const result = (await authApi.login(username.trim(), password)) as unknown as {
        access_token: string;
        user: { id: string; username: string; fullName: string; role: string };
      };
      if (typeof window !== 'undefined') {
        localStorage.setItem('govtrust_token', result.access_token);
        localStorage.setItem('govtrust_user', JSON.stringify(result.user));

        // Get redirect URL from sessionStorage
        const redirectUrl = sessionStorage.getItem('govtrust_redirect') || '/';
        sessionStorage.removeItem('govtrust_redirect');

        // Redirect based on role or saved URL
        if (result.user.role === 'OFFICER' || result.user.role === 'ADMIN') {
          router.push('/dashboard');
        } else {
          router.push(redirectUrl);
        }
      }
    } catch (e) {
      setError((e as Error).message || 'Sai tên đăng nhập hoặc mật khẩu');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <CitizenLayout>
      <div className="bg-gray-50 flex items-center justify-center px-4 py-12 relative overflow-hidden">
      {/* Ambient backgrounds */}
      

      <div className="w-full max-w-md relative z-10 animate-scale-in">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 rounded-xl flex items-center justify-center shadow-sm relative overflow-hidden mx-auto mb-4">
            <img src="/logo.png" alt="GovTrust AI" className="w-full h-full object-cover" />
          </div>
          <h1 className="text-3xl font-extrabold text-teal-700 mb-2 tracking-tight">Cổng Dịch Vụ Công <span className="text-teal-700">AI</span></h1>
          <p className="text-gray-500 font-medium">Đăng nhập để quản lý hồ sơ của bạn</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-white/80  rounded-md shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 p-8 sm:p-10">
          
          {/* DEV Quick Login */}
          <div className="mb-6 flex gap-2 justify-center">
            <button
              type="button"
              onClick={() => { setUsername('052206000143'); setPassword('123456'); }}
              className="text-xs bg-emerald-100 text-emerald-700 px-3 py-1.5 rounded border border-emerald-200 font-semibold hover:bg-emerald-200 transition-colors"
            >
              Fill Citizen
            </button>
            <button
              type="button"
              onClick={() => { setUsername('dinhngocanh_test'); setPassword('123456'); }}
              className="text-xs bg-blue-100 text-blue-700 px-3 py-1.5 rounded border border-blue-200 font-semibold hover:bg-blue-200 transition-colors"
            >
              Fill Officer
            </button>
          </div>

          <div className="space-y-6">
            <div>
              <label htmlFor="username" className="block text-sm font-semibold text-gray-700 mb-2">
                Số CCCD hoặc Số điện thoại
              </label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-5 py-3.5 bg-gray-50 border border-gray-200 rounded focus:bg-white focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition-all outline-none text-gray-900 placeholder-gray-400 font-medium"
                placeholder="Nhập tài khoản"
                autoComplete="username"
                required
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label htmlFor="password" className="block text-sm font-semibold text-gray-700">
                  Mật khẩu
                </label>
                <Link href="/forgot" className="text-xs font-semibold text-teal-600 hover:text-teal-700 transition-colors">
                  Quên mật khẩu?
                </Link>
              </div>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-5 py-3.5 bg-gray-50 border border-gray-200 rounded focus:bg-white focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition-all outline-none text-gray-900 placeholder-gray-400 font-medium"
                placeholder="••••••••"
                autoComplete="current-password"
                required
              />
            </div>

            {error && (
              <div className="bg-red-50/80  border border-red-100 rounded p-4 text-red-600 text-sm font-medium flex items-center gap-3">
                <span className="w-5 h-5 rounded-full bg-red-100 flex items-center justify-center shrink-0">❌</span>
                {error}
              </div>
            )}

            <button 
              type="submit" 
              className="w-full bg-teal-700 hover:bg-teal-800 text-white py-4 rounded font-bold transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              disabled={isLoading}
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="w-5 h-5 animate-spin text-teal-500" fill="none" viewBox="0 0 24 24">
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

          <div className="mt-8 text-center">
            <p className="text-sm font-medium text-gray-500">
              Chưa có tài khoản?{' '}
              <Link href="/register" className="text-teal-600 font-bold hover:text-teal-700 hover:underline transition-colors">
                Tạo tài khoản mới
              </Link>
            </p>
          </div>

          <div className="mt-6 pt-6 border-t border-gray-100 text-center">
            <Link href="/" className="text-sm font-medium text-gray-400 hover:text-gray-600 transition-colors inline-flex items-center gap-1">
              <span className="text-lg">←</span> Quay lại trang chủ
            </Link>
          </div>
        </form>

        <p className="text-center text-gray-400 font-medium text-xs mt-8">
          © {new Date().getFullYear()} Hệ thống Phục vụ Công dân AI — Chính phủ Việt Nam
        </p>
      </div>
    </div>
    </CitizenLayout>
  );
}
