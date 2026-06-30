'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { Bell, HelpCircle, User, Menu, X } from 'lucide-react';

interface HeaderProps {
  variant?: 'citizen' | 'officer';
  userName?: string;
  userRole?: string;
}

export function Header({ variant = 'citizen', userName, userRole }: HeaderProps) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const citizenNav = [
    { href: '/', label: 'Trang chủ' },
    { href: '/services', label: 'Dịch vụ của tôi' },
    { href: '/history', label: 'Hồ sơ đã nộp' },
  ];

  const officerNav = [
    { href: '/dashboard', label: 'Bảng điều khiển' },
    { href: '/queue', label: 'Kiểm tra lại' },
    { href: '/history', label: 'Hồ sơ đã nộp' },
  ];

  const navItems = variant === 'officer' ? officerNav : citizenNav;

  return (
    <header 
      className="sticky top-0 z-50 bg-white/80 backdrop-blur-lg border-b border-gray-200/50 transition-all duration-300"
      role="banner"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16 sm:h-20">
          {/* Logo */}
          <Link
            href={variant === 'officer' ? '/dashboard' : '/'}
            className="flex items-center gap-3 shrink-0 group"
            aria-label="Trang chủ Cổng Dịch Vụ Công AI"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center shadow-lg shadow-blue-500/20 group-hover:shadow-blue-500/40 transition-all duration-300 group-hover:scale-105">
              <span className="text-white font-bold text-lg tracking-wider">G</span>
            </div>
            <span className="text-gray-900 font-bold text-lg sm:text-xl hidden sm:inline tracking-tight">
              Cổng Dịch Vụ Công <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-500">AI</span>
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
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? 'text-blue-700 bg-blue-50 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                  aria-current={isActive ? 'page' : undefined}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* Right side */}
          <div className="flex items-center gap-1 sm:gap-3">
            {/* Notifications */}
            <button
              className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors text-gray-500 hover:text-gray-900"
              aria-label="Thông báo"
            >
              <Bell className="w-5 h-5" />
            </button>

            {/* Help */}
            <button
              className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors text-gray-500 hover:text-gray-900 hidden sm:flex"
              aria-label="Hướng dẫn sử dụng"
            >
              <HelpCircle className="w-5 h-5" />
            </button>

            {/* User Avatar */}
            {userName ? (
              <Link
                href="/settings"
                className="w-10 h-10 flex items-center justify-center rounded-full bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 text-blue-700 font-semibold text-sm hover:shadow-md transition-all duration-200 ml-1"
                aria-label={`Tài khoản: ${userName}`}
              >
                {userName.charAt(0).toUpperCase()}
              </Link>
            ) : (
              <Link
                href="/login"
                className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-50 hover:bg-gray-100 border border-gray-200 transition-colors text-gray-600 hover:text-gray-900 ml-1"
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
                  className={`block px-4 py-3 rounded-xl text-base font-medium transition-colors ${
                    isActive
                      ? 'text-blue-700 bg-blue-50'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
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
