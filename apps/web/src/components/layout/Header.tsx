'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Bell, HelpCircle, User, Menu, X } from 'lucide-react';

interface HeaderProps {
  variant?: 'citizen' | 'officer';
  userName?: string;
  userRole?: string;
}

export function Header({ variant = 'citizen', userName, userRole }: HeaderProps) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Đọc user từ localStorage để hiện avatar
  const [localUser, setLocalUser] = useState<{ fullName?: string; kycStatus?: string } | null>(null);
  useEffect(() => {
    try {
      const raw = localStorage.getItem('govtrust_user');
      if (raw) setLocalUser(JSON.parse(raw));
    } catch { /* ignore */ }
  }, []);

  const citizenNav = [
    { href: '/', label: 'Trang chủ' },
    { href: '/services', label: 'Dịch vụ của tôi' },
    { href: '/history', label: 'Hồ sơ đã nộp' },
  ];

  const officerNav = [
    { href: '/dashboard', label: 'Bảng điều khiển' },
    { href: '/queue', label: 'Kiểm duyệt' },
    { href: '/history', label: 'Lịch sử' },
  ];

  const navItems = variant === 'officer' ? officerNav : citizenNav;

  return (
    <header 
      className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-gray-100 transition-all duration-300"
      role="banner"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16 sm:h-20">
          {/* Logo */}
          <Link
            href={variant === 'officer' ? '/dashboard' : '/'}
            className="flex items-center gap-3 shrink-0 group"
            aria-label="Trang chủ GovTrust AI"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#0A192F] to-emerald-700 flex items-center justify-center shadow-lg shadow-emerald-500/10 group-hover:shadow-emerald-500/30 transition-all duration-300 group-hover:scale-105 border border-emerald-800/20">
              <span className="text-white font-extrabold text-lg tracking-wider">G</span>
            </div>
            <span className="text-[#0A192F] font-extrabold text-lg sm:text-xl hidden sm:inline tracking-tight">
              GovTrust <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-cyan-500">AI</span>
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1 sm:gap-2" aria-label="Menu chính">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`px-4 py-2.5 rounded-full text-sm font-semibold transition-all duration-300 ${
                    isActive
                      ? 'text-emerald-700 bg-emerald-50 border border-emerald-100/50 shadow-sm'
                      : 'text-gray-500 hover:text-[#0A192F] hover:bg-gray-50 border border-transparent'
                  }`}
                  aria-current={isActive ? 'page' : undefined}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* Right side */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Notifications */}
            <button
              className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors text-gray-500 hover:text-[#0A192F]"
              aria-label="Thông báo"
            >
              <Bell className="w-5 h-5" />
            </button>

            {/* Help */}
            <button
              className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors text-gray-500 hover:text-[#0A192F] hidden sm:flex"
              aria-label="Hướng dẫn sử dụng"
            >
              <HelpCircle className="w-5 h-5" />
            </button>

            {/* User Avatar — link đến /profile nếu đã đăng nhập */}
            {(userName || localUser) ? (
              <Link
                href="/profile"
                className="relative w-10 h-10 flex items-center justify-center rounded-full bg-gradient-to-br from-emerald-50 to-emerald-100 border border-emerald-200 text-emerald-700 font-bold text-sm hover:shadow-md transition-all duration-300 ml-1"
                aria-label="Hồ sơ cá nhân"
                title="Hồ sơ cá nhân"
              >
                {(userName || localUser?.fullName || '?').charAt(0).toUpperCase()}
                {/* Dot xanh nếu đã KYC */}
                {(localUser?.kycStatus === 'VERIFIED') && (
                  <span className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white" title="Đã xác minh danh tính" />
                )}
              </Link>
            ) : (
              <Link
                href="/login"
                className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-50 hover:bg-emerald-50 border border-gray-200 hover:border-emerald-200 transition-all text-gray-600 hover:text-emerald-700 ml-1 shadow-sm"
                aria-label="Đăng nhập"
              >
                <User className="w-5 h-5" />
              </Link>
            )}

            {/* Mobile menu toggle */}
            <button
              className="md:hidden w-10 h-10 flex items-center justify-center rounded-xl hover:bg-gray-100 transition-colors text-gray-600"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-expanded={mobileMenuOpen}
              aria-label="Menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      {mobileMenuOpen && (
        <nav className="md:hidden border-t border-gray-100 bg-white/95 backdrop-blur-xl animate-slide-up shadow-xl absolute w-full" aria-label="Menu di động">
          <div className="px-4 py-3 space-y-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`block px-4 py-3 rounded-xl text-base font-semibold transition-colors ${
                    isActive
                      ? 'text-emerald-700 bg-emerald-50 border border-emerald-100'
                      : 'text-gray-500 hover:text-[#0A192F] hover:bg-gray-50 border border-transparent'
                  }`}
                  onClick={() => setMobileMenuOpen(false)}
                  aria-current={isActive ? 'page' : undefined}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>
        </nav>
      )}
    </header>
  );
}
