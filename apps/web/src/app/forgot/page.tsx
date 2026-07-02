'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ShieldCheck, Mail, KeyRound, ChevronRight, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { CitizenLayout } from '@/components/layout/CitizenLayout';

type Step = 'email' | 'otp' | 'reset' | 'done';

export default function ForgotPasswordPage() {
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSendOtp = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!email.includes('@')) {
      setError('Email không hợp lệ');
      return;
    }
    setIsLoading(true);
    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
      setStep('otp');
    }, 1000);
  };

  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const code = otp.join('');
    if (code.length < 6) {
      setError('Vui lòng nhập đủ 6 số OTP');
      return;
    }
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setStep('reset');
    }, 1000);
  };

  const handleResetPassword = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password.length < 6) {
      setError('Mật khẩu tối thiểu 6 ký tự');
      return;
    }
    if (password !== confirmPassword) {
      setError('Mật khẩu xác nhận không khớp');
      return;
    }
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setStep('done');
    }, 1500);
  };

  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    // Auto-focus next input
    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-${index + 1}`);
      nextInput?.focus();
    }
  };

  return (
    <CitizenLayout>
      <div className="bg-gray-50 flex items-center justify-center px-4 py-12 relative overflow-hidden">
        <div className="w-full max-w-md relative z-10 animate-scale-in">
        <div className="text-center mb-6">
          <div className="w-14 h-14 bg-teal-600 border border-gold-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm relative overflow-hidden">
            <span className="text-gold-500 font-extrabold text-2xl">★</span>
          </div>
          <h1 className="text-2xl font-extrabold text-teal-700 tracking-tight">
            Khôi phục mật khẩu
          </h1>
        </div>

        <div className="bg-white rounded-md shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 p-8">
          {step === 'email' && (
            <motion.form initial={{ opacity: 0 }} animate={{ opacity: 1 }} onSubmit={handleSendOtp} className="space-y-5">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Mail className="w-8 h-8 text-blue-600" />
                </div>
                <p className="text-sm text-gray-500 font-medium">Nhập email đăng ký của bạn. Chúng tôi sẽ gửi mã OTP để đặt lại mật khẩu.</p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="nguyenvana@example.com"
                  className="w-full px-5 py-3.5 bg-gray-50 border border-gray-200 rounded focus:bg-white focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition-all outline-none text-gray-900 placeholder-gray-400 font-medium"
                  required
                />
              </div>

              {error && <p className="text-red-500 text-sm font-medium text-center">{error}</p>}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-4 rounded bg-teal-700 hover:bg-teal-800 text-white font-bold transition-all shadow-md flex justify-center items-center gap-2"
              >
                {isLoading ? <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Gửi mã xác nhận'}
              </button>
            </motion.form>
          )}

          {step === 'otp' && (
            <motion.form initial={{ opacity: 0 }} animate={{ opacity: 1 }} onSubmit={handleVerifyOtp} className="space-y-6">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <ShieldCheck className="w-8 h-8 text-teal-600" />
                </div>
                <p className="text-sm text-gray-500 font-medium">Nhập mã 6 chữ số vừa được gửi đến <br/><span className="font-bold text-teal-700">{email}</span></p>
              </div>

              <div className="flex gap-2 justify-center">
                {otp.map((digit, idx) => (
                  <input
                    key={idx}
                    id={`otp-${idx}`}
                    type="text"
                    maxLength={1}
                    value={digit}
                    onChange={e => handleOtpChange(idx, e.target.value)}
                    className="w-12 h-14 text-center text-xl font-extrabold bg-gray-50 border border-gray-200 rounded focus:bg-white focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition-all outline-none text-gray-900"
                  />
                ))}
              </div>

              {error && <p className="text-red-500 text-sm font-medium text-center">{error}</p>}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-4 rounded bg-teal-700 hover:bg-teal-800 text-white font-bold transition-all shadow-md flex justify-center items-center gap-2"
              >
                {isLoading ? <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Xác thực mã'}
              </button>

              <p className="text-center text-sm font-medium text-gray-500">
                Chưa nhận được mã? <button type="button" className="text-teal-600 font-bold hover:underline" onClick={() => setStep('email')}>Gửi lại</button>
              </p>
            </motion.form>
          )}

          {step === 'reset' && (
            <motion.form initial={{ opacity: 0 }} animate={{ opacity: 1 }} onSubmit={handleResetPassword} className="space-y-5">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <KeyRound className="w-8 h-8 text-amber-600" />
                </div>
                <p className="text-sm text-gray-500 font-medium">Thiết lập mật khẩu mới cho tài khoản của bạn.</p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Mật khẩu mới</label>
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-5 py-3.5 bg-gray-50 border border-gray-200 rounded focus:bg-white focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition-all outline-none text-gray-900 placeholder-gray-400 font-medium"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Xác nhận mật khẩu</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-5 py-3.5 bg-gray-50 border border-gray-200 rounded focus:bg-white focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition-all outline-none text-gray-900 placeholder-gray-400 font-medium"
                  required
                />
              </div>

              {error && <p className="text-red-500 text-sm font-medium text-center">{error}</p>}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-4 rounded bg-teal-600 hover:bg-teal-700 text-white font-bold transition-all shadow-md flex justify-center items-center gap-2"
              >
                {isLoading ? <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Đổi mật khẩu'}
              </button>
            </motion.form>
          )}

          {step === 'done' && (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-6">
              <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 className="w-10 h-10 text-teal-600" />
              </div>
              <h2 className="text-2xl font-extrabold text-teal-700 mb-3">Đổi mật khẩu thành công!</h2>
              <p className="text-sm text-gray-500 font-medium mb-8">Bạn có thể sử dụng mật khẩu mới để đăng nhập vào hệ thống GovTrust AI ngay bây giờ.</p>
              <Link href="/login" className="flex justify-center items-center w-full py-4 rounded bg-teal-700 hover:bg-teal-800 text-white font-bold transition-all shadow-md gap-2">
                Đăng nhập ngay <ChevronRight className="w-4 h-4" />
              </Link>
            </motion.div>
          )}

          {step === 'email' && (
            <div className="mt-8 text-center border-t border-gray-100 pt-6">
              <Link href="/login" className="text-sm font-medium text-gray-500 hover:text-teal-700 transition-colors">
                ← Quay lại trang đăng nhập
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
    </CitizenLayout>
  );
}
