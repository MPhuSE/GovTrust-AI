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
    <div className="min-h-screen bg-[#FBFBFA] flex items-center justify-center px-4 relative overflow-hidden">
      {/* Ambient backgrounds */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] right-[-5%] w-[50%] h-[70%] rounded-full bg-emerald-400/5 blur-[120px]"></div>
        <div className="absolute bottom-[-10%] left-[-5%] w-[40%] h-[60%] rounded-full bg-cyan-400/5 blur-[120px]"></div>
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCI+PGNpcmNsZSBjeD0iMiIgY3k9IjIiIHI9IjEiIGZpbGw9InJnYmEoMCwgMCwgMCwgMC4wMykiLz48L3N2Zz4=')] opacity-50"></div>
      </div>

      <div className="w-full max-w-md relative z-10 animate-scale-in">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-white border border-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-sm">
            <span className="text-[#0A192F] font-extrabold text-2xl">G</span>
          </div>
          <h1 className="text-3xl font-extrabold text-[#0A192F] mb-2 tracking-tight">Cổng Dịch Vụ Công <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-cyan-500">AI</span></h1>
          <p className="text-gray-500 font-medium">Đăng nhập để quản lý hồ sơ của bạn</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-white/80 backdrop-blur-xl rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 p-8 sm:p-10">
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
                className="w-full px-5 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all outline-none text-gray-900 placeholder-gray-400 font-medium"
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
                <Link href="/forgot" className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 transition-colors">
                  Quên mật khẩu?
                </Link>
              </div>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-5 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all outline-none text-gray-900 placeholder-gray-400 font-medium"
                placeholder="••••••••"
                autoComplete="current-password"
                required
              />
            </div>

            {error && (
              <div className="bg-red-50/80 backdrop-blur border border-red-100 rounded-xl p-4 text-red-600 text-sm font-medium flex items-center gap-3">
                <span className="w-5 h-5 rounded-full bg-red-100 flex items-center justify-center shrink-0">❌</span>
                {error}
              </div>
            )}

            <button 
              type="submit" 
              className="w-full bg-[#0A192F] hover:bg-[#112240] text-white py-4 rounded-xl font-bold transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              disabled={isLoading}
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="w-5 h-5 animate-spin text-emerald-400" fill="none" viewBox="0 0 24 24">
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
              <Link href="/register" className="text-emerald-600 font-bold hover:text-emerald-700 hover:underline transition-colors">
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
  );
}
