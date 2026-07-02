'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { User, Menu, X, Star, Home, HelpCircle, FileText, LayoutDashboard, CheckSquare, History } from 'lucide-react';

interface HeaderProps {
  variant?: 'citizen' | 'officer';
  userName?: string;
  userRole?: string;
}

export function Header({ variant = 'citizen', userName, userRole }: HeaderProps) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [localUser, setLocalUser] = useState<{ fullName?: string; kycStatus?: string } | null>(null);
  useEffect(() => {
    try {
      const raw = localStorage.getItem('govtrust_user');
      if (raw) setLocalUser(JSON.parse(raw));
    } catch { /* ignore */ }
  }, []);

  const citizenNav = (userName || localUser) ? [
    { href: '/', label: 'Trang chủ', icon: <Home className="w-4 h-4 mr-2" /> },
    { href: '/services', label: 'Thông tin và dịch vụ', icon: <FileText className="w-4 h-4 mr-2" /> },
    { href: '/history', label: 'Hồ sơ đã nộp', icon: <History className="w-4 h-4 mr-2" /> },
    { href: '/support', label: 'Hỗ trợ', icon: <HelpCircle className="w-4 h-4 mr-2" /> },
  ] : [
    { href: '/', label: 'Trang chủ', icon: <Home className="w-4 h-4 mr-2" /> },
    { href: '/support', label: 'Hỗ trợ', icon: <HelpCircle className="w-4 h-4 mr-2" /> },
  ];

  const officerNav = [
    { href: '/dashboard', label: 'Bảng điều khiển', icon: <LayoutDashboard className="w-4 h-4 mr-2" /> },
    { href: '/queue', label: 'Kiểm duyệt', icon: <CheckSquare className="w-4 h-4 mr-2" /> },
    { href: '/history', label: 'Lịch sử', icon: <History className="w-4 h-4 mr-2" /> },
  ];

  const navItems = variant === 'officer' ? officerNav : citizenNav;

  return (
    <header className="bg-white border-b border-gray-100" role="banner">
      {/* Top Header Section */}
      <div className="w-full px-4 md:px-8 xl:px-12 border-b border-gray-100">
        <div className="flex items-center justify-between h-20 md:h-24">
          
          {/* Logo & Title */}
          <Link
            href={variant === 'officer' ? '/dashboard' : '/'}
            className="flex items-center gap-4 shrink-0 group"
          >
            <div
              aria-label="GovTrust AI Logo"
              className="w-12 h-12 md:w-14 md:h-14 flex items-center justify-center rounded-full bg-emerald-700 text-white font-extrabold text-lg md:text-xl shadow-sm border border-emerald-800 group-hover:scale-105 transition-transform duration-300"
            >
              GT
            </div>
            
            <div className="flex flex-col">
              <span className="text-emerald-700 font-extrabold text-xl md:text-2xl uppercase tracking-wide">
                HỆ THỐNG GOVTRUST AI
              </span>
              <span className="text-gray-500 text-xs md:text-sm font-medium mt-0.5 hidden sm:block">
                Kết nối, cung cấp thông tin và dịch vụ công mọi lúc, mọi nơi (GovTrust AI)
              </span>
            </div>
          </Link>

          {/* Right Actions */}
          <div className="hidden md:flex items-center gap-4">
            {(userName || localUser) ? (
              <div className="flex items-center gap-4">
                <span className="font-bold text-gray-700">Xin chào, {userName || localUser?.fullName}</span>
                <Link
                  href="/profile"
                  className="px-6 py-2 border border-emerald-600 text-emerald-600 rounded-md font-bold hover:bg-emerald-50 transition-colors"
                >
                  Tài khoản
                </Link>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Link
                  href="/register"
                  className="px-6 py-2.5 border border-gray-200 rounded-md text-gray-700 font-bold hover:bg-gray-50 transition-colors bg-white shadow-sm"
                >
                  Đăng ký
                </Link>
                <Link
                  href="/login"
                  className="px-6 py-2.5 bg-emerald-700 rounded-md text-white font-bold hover:bg-emerald-800 transition-colors shadow-sm"
                >
                  Đăng nhập
                </Link>
              </div>
            )}
          </div>

          <button
            className="md:hidden text-gray-600 p-2"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="w-8 h-8" /> : <Menu className="w-8 h-8" />}
          </button>
        </div>
      </div>

      {/* Primary Navigation Bar (White background, pills) */}
      <div className="bg-white hidden md:block py-2">
        <div className="w-full px-4 md:px-8 xl:px-12">
          <nav className="flex items-center gap-2">
            {navItems.map((item) => {
              const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center px-5 py-2.5 rounded-full font-bold transition-all ${
                    isActive
                      ? 'bg-emerald-50 text-emerald-800'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {item.icon}
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <nav className="md:hidden bg-white border-t border-gray-200">
          <div className="px-4 py-2 space-y-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center px-4 py-3 font-bold rounded-lg ${
                  pathname === item.href
                    ? 'text-emerald-700 bg-emerald-50'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
                onClick={() => setMobileMenuOpen(false)}
              >
                {item.icon}
                {item.label}
              </Link>
            ))}
            {!(userName || localUser) && (
              <div className="border-t border-gray-100 pt-3 pb-3 flex flex-col gap-2">
                <Link
                  href="/login"
                  className="block text-center px-4 py-3 rounded-lg font-bold text-white bg-emerald-700 shadow-sm"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Đăng nhập
                </Link>
                <Link
                  href="/register"
                  className="block text-center px-4 py-3 rounded-lg font-bold text-gray-700 border border-gray-200 shadow-sm"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Đăng ký
                </Link>
              </div>
            )}
          </div>
        </nav>
      )}
    </header>
  );
}