'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { authApi } from '@/lib/api-client';

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ username: '', password: '', confirmPassword: '', fullName: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) {
      setError('Mật khẩu xác nhận không khớp');
      return;
    }
    if (form.password.length < 6) {
      setError('Mật khẩu phải có ít nhất 6 ký tự');
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      await authApi.register({
        username: form.username,
        password: form.password,
        fullName: form.fullName,
      });
      router.push('/login');
    } catch (e) {
      setError((e as Error).message || 'Đăng ký thất bại');
    } finally {
      setIsLoading(false);
    }
  };

  const update = (key: string, value: string) => setForm((prev) => ({ ...prev, [key]: value }));

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-700 via-blue-800 to-blue-900 flex items-center justify-center px-4">
      <div className="w-full max-w-md animate-scale-in">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <span className="text-blue-700 font-bold text-2xl">G</span>
          </div>
          <h1 className="text-2xl font-bold text-white mb-1">Tạo tài khoản mới</h1>
          <p className="text-blue-200 text-sm">Đăng ký để lưu lịch sử kiểm tra hồ sơ</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-2xl p-8">
          <div className="space-y-4">
            <div>
              <label htmlFor="fullName" className="input-label">Họ và tên</label>
              <input
                id="fullName"
                type="text"
                value={form.fullName}
                onChange={(e) => update('fullName', e.target.value)}
                className="input-field"
                placeholder="Nguyễn Văn A"
                required
              />
            </div>
            <div>
              <label htmlFor="username" className="input-label">Tên đăng nhập</label>
              <input
                id="username"
                type="text"
                value={form.username}
                onChange={(e) => update('username', e.target.value)}
                className="input-field"
                placeholder="Số điện thoại hoặc CCCD"
                autoComplete="username"
                required
              />
            </div>
            <div>
              <label htmlFor="password" className="input-label">Mật khẩu</label>
              <input
                id="password"
                type="password"
                value={form.password}
                onChange={(e) => update('password', e.target.value)}
                className="input-field"
                placeholder="Tối thiểu 6 ký tự"
                autoComplete="new-password"
                required
                minLength={6}
              />
            </div>
            <div>
              <label htmlFor="confirmPassword" className="input-label">Xác nhận mật khẩu</label>
              <input
                id="confirmPassword"
                type="password"
                value={form.confirmPassword}
                onChange={(e) => update('confirmPassword', e.target.value)}
                className="input-field"
                placeholder="Nhập lại mật khẩu"
                autoComplete="new-password"
                required
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-700 text-sm flex items-center gap-2">
                <span>❌</span> {error}
              </div>
            )}

            <button type="submit" className="btn-primary w-full" disabled={isLoading}>
              {isLoading ? 'Đang xử lý...' : 'Đăng ký'}
            </button>
          </div>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-500">
              Đã có tài khoản?{' '}
              <Link href="/login" className="text-blue-700 font-medium hover:underline">
                Đăng nhập
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
