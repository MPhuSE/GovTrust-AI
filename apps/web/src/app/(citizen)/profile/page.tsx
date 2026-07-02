'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { authApi } from '@/lib/api-client';
import { CitizenLayout } from '@/components/layout/CitizenLayout';
import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton';

interface UserProfile {
  id: string;
  username: string;
  fullName: string;
  role: string;
  kycStatus: 'NONE' | 'PENDING' | 'VERIFIED' | 'FAILED';
  kycVerifiedAt: string | null;
  kycFaceMatchProb: number | null;
  // CCCD — masked từ backend (VD: "034******345")
  cccdNumber: string | null;
  cccdFullName: string | null;
  cccdBirthDay: string | null;
  cccdGender: string | null;
  cccdNationality: string | null;
  cccdOriginLocation: string | null;
  cccdRecentLocation: string | null;
  cccdValidDate: string | null;
}

const KYC_BADGE: Record<UserProfile['kycStatus'], { label: string; cls: string; icon: string }> = {
  VERIFIED: {
    label: 'Đã xác minh danh tính',
    cls: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    icon: '✓',
  },
  PENDING: {
    label: 'Đang xác minh',
    cls: 'bg-amber-50 text-amber-700 border-amber-200',
    icon: '⏳',
  },
  FAILED: {
    label: 'Xác minh thất bại',
    cls: 'bg-red-50 text-red-700 border-red-200',
    icon: '✗',
  },
  NONE: {
    label: 'Chưa xác minh',
    cls: 'bg-gray-100 text-gray-500 border-gray-200',
    icon: '○',
  },
};

export default function ProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    authApi
      .me()
      .then(data => setProfile(data as unknown as UserProfile))
      .catch(e => setError((e as Error).message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <CitizenLayout>
        <div className="max-w-2xl mx-auto px-4 py-10 space-y-4">
          <LoadingSkeleton variant="card" className="rounded-2xl h-32" />
          <LoadingSkeleton variant="card" className="rounded-2xl h-64" />
        </div>
      </CitizenLayout>
    );
  }

  if (error || !profile) {
    return (
      <CitizenLayout>
        <div className="max-w-2xl mx-auto px-4 py-10 text-center">
          <p className="text-red-500 font-bold">{error || 'Không tải được thông tin'}</p>
          <button onClick={() => router.push('/')} className="mt-4 text-sm text-emerald-600 font-bold hover:underline">
            Về trang chủ
          </button>
        </div>
      </CitizenLayout>
    );
  }

  const badge = KYC_BADGE[profile.kycStatus];
  const isVerified = profile.kycStatus === 'VERIFIED';

  const cccdFields: [string, string | null][] = [
    ['Số CCCD',          profile.cccdNumber],
    ['Họ và tên',        profile.cccdFullName],
    ['Ngày sinh',        profile.cccdBirthDay],
    ['Giới tính',        profile.cccdGender],
    ['Quốc tịch',        profile.cccdNationality],
    ['Quê quán',         profile.cccdOriginLocation],
    ['Nơi ĐKTT',         profile.cccdRecentLocation],
    ['Có giá trị đến',   profile.cccdValidDate],
  ];

  return (
    <CitizenLayout>
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 sm:py-12 animate-fade-in">
        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-3xl font-extrabold text-[#0A192F] tracking-tight">Hồ sơ cá nhân</h1>
            <p className="text-gray-500 text-sm font-medium mt-1">Thông tin tài khoản & danh tính đã xác minh</p>
          </div>
          <button
            onClick={() => router.back()}
            className="text-sm text-gray-500 hover:text-[#0A192F] font-bold flex items-center gap-1 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            Quay lại
          </button>
        </div>

        {/* Avatar + KYC status */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_4px_20px_rgb(0,0,0,0.02)] p-6 mb-5 flex items-center gap-5">
          {/* Avatar */}
          <div className="w-16 h-16 rounded-2xl bg-[#0A192F] flex items-center justify-center shrink-0 shadow-md">
            <span className="text-white text-2xl font-extrabold">
              {profile.fullName.charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xl font-extrabold text-[#0A192F] truncate">{profile.fullName}</p>
            <p className="text-sm text-gray-500 font-medium mt-0.5 truncate">@{profile.username}</p>
            {/* KYC badge */}
            <div className={`mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-bold ${badge.cls}`}>
              <span>{badge.icon}</span>
              {badge.label}
              {isVerified && profile.kycFaceMatchProb !== null && (
                <span className="opacity-70 ml-1">
                  ({Math.round(profile.kycFaceMatchProb * 100)}% match)
                </span>
              )}
            </div>
          </div>
        </div>

        {/* CCCD Info */}
        {isVerified ? (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_4px_20px_rgb(0,0,0,0.02)] p-6 mb-5">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-extrabold text-[#0A192F] flex items-center gap-2">
                <span className="w-7 h-7 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-700 text-sm">🪪</span>
                Thông tin CCCD đã xác minh
              </h2>
              {profile.kycVerifiedAt && (
                <span className="text-xs text-gray-400 font-medium">
                  {new Date(profile.kycVerifiedAt).toLocaleDateString('vi-VN')}
                </span>
              )}
            </div>

            {/* Security notice */}
            <div className="flex items-start gap-2 bg-amber-50 border border-amber-100 rounded-xl p-3 mb-5 text-xs text-amber-700 font-medium">
              <svg className="w-4 h-4 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              Số CCCD được che một phần để bảo vệ dữ liệu cá nhân. Hệ thống sử dụng thông tin đầy đủ để điền tự động khi bạn làm thủ tục.
            </div>

            <div className="space-y-3">
              {cccdFields.map(([label, value]) => {
                if (!value) return null;
                const isCccdNum = label === 'Số CCCD';
                return (
                  <div key={label} className="flex items-center justify-between py-2.5 border-b border-gray-50 last:border-0">
                    <span className="text-sm text-gray-500 font-medium">{label}</span>
                    <span className={`text-sm font-bold text-[#0A192F] ${isCccdNum ? 'font-mono tracking-widest' : ''}`}>
                      {value}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Auto-fill notice */}
            <div className="mt-5 flex items-start gap-2 bg-emerald-50 border border-emerald-100 rounded-xl p-3 text-xs text-emerald-800 font-medium">
              <svg className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Khi bạn bắt đầu thủ tục mới, AI sẽ tự động điền thông tin CCCD vào hồ sơ — không cần upload lại.
            </div>
          </div>
        ) : (
          // Chưa xác minh — hướng dẫn
          <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-8 mb-5 text-center">
            <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
              </svg>
            </div>
            <p className="font-bold text-[#0A192F] text-base mb-1">Chưa có thông tin CCCD</p>
            <p className="text-sm text-gray-500 font-medium mb-4">
              Xác minh danh tính để hệ thống tự động điền hồ sơ khi làm thủ tục
            </p>
            <button
              onClick={() => router.push('/register')}
              className="px-6 py-2.5 bg-[#0A192F] text-white text-sm font-bold rounded-xl hover:bg-[#112240] transition-colors"
            >
              Xác minh ngay →
            </button>
          </div>
        )}

        {/* Account info */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_4px_20px_rgb(0,0,0,0.02)] p-6">
          <h2 className="text-base font-extrabold text-[#0A192F] mb-4">Thông tin tài khoản</h2>
          <div className="space-y-3">
            {([
              ['Tên đăng nhập', `@${profile.username}`],
              ['Vai trò', profile.role === 'CITIZEN' ? 'Công dân' : profile.role === 'OFFICER' ? 'Cán bộ' : 'Quản trị'],
            ] as [string, string][]).map(([label, value]) => (
              <div key={label} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                <span className="text-sm text-gray-500 font-medium">{label}</span>
                <span className="text-sm font-bold text-[#0A192F]">{value}</span>
              </div>
            ))}
          </div>

          <button
            onClick={() => {
              localStorage.removeItem('govtrust_token');
              localStorage.removeItem('govtrust_user');
              router.push('/login');
            }}
            className="mt-5 w-full py-3 rounded-xl border-2 border-red-100 text-red-600 font-bold text-sm hover:bg-red-50 transition-colors"
          >
            Đăng xuất
          </button>
        </div>
      </div>
    </CitizenLayout>
  );
}
