'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';

interface HeaderProps {
  variant?: 'citizen' | 'officer';
  userName?: string;
  userRole?: string;
}

export function Header({ variant = 'citizen', userName, userRole }: HeaderProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [localUser, setLocalUser] = useState<{ fullName?: string; kycStatus?: string } | null>(null);
  useEffect(() => {
    try {
      const raw = localStorage.getItem('govtrust_user');
      if (raw) setLocalUser(JSON.parse(raw));
    } catch { /* ignore */ }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('govtrust_token');
    localStorage.removeItem('govtrust_user');
    setLocalUser(null);
    router.push('/');
    setMobileMenuOpen(false);
  };

  const citizenNav = (userName || localUser) ? [
    { href: '/', label: 'Trang chủ' },
    { href: '/services', label: 'Thông tin và dịch vụ' },
    { href: '/history', label: 'Hồ sơ đã nộp' },
    { href: '/support', label: 'Hỗ trợ' },
  ] : [
    { href: '/', label: 'Trang chủ' },
    { href: '/support', label: 'Hỗ trợ' },
  ];

  const officerNav = [
    { href: '/dashboard', label: 'Bảng điều khiển' },
    { href: '/queue', label: 'Kiểm duyệt' },
    { href: '/history', label: 'Lịch sử' },
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
              className="w-16 h-16 md:w-20 md:h-20 flex items-center justify-center rounded-xl shadow-sm group-hover:scale-105 transition-transform duration-300 overflow-hidden"
            >
              <img src="/logo.png" alt="GovTrust AI" className="w-full h-full object-cover" />
            </div>
            
            <div className="flex flex-col">
              <span className="text-emerald-700 font-extrabold text-xl md:text-2xl uppercase tracking-wide">
               GOVTRUST AI
              </span>
              <span className="text-gray-500 text-xs md:text-sm font-medium mt-0.5 hidden sm:block">
                Kết nối cung cấp thông tin và dịch vụ công mọi lúc mọi nơi 
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
                <button
                  onClick={handleLogout}
                  className="px-6 py-2 border border-red-600 text-red-600 rounded-md font-bold hover:bg-red-50 transition-colors"
                >
                  Đăng xuất
                </button>
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
            {mobileMenuOpen ? '✕' : '☰'}
          </button>
        </div>
      </div>

      {/* Primary Navigation Bar (White background, pills) */}
      <div className={`bg-white hidden ${variant === 'officer' ? 'md:block lg:hidden' : 'md:block'} py-2`}>
        <div className="w-full px-4 md:px-8 xl:px-12">
          <nav className="flex items-center gap-2">
            {navItems.map((item) => {
              const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`px-5 py-2.5 rounded-full font-bold transition-all ${
                    isActive
                      ? 'bg-emerald-50 text-emerald-800'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
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
                className={`block px-4 py-3 font-bold rounded-lg ${
                  pathname === item.href
                    ? 'text-emerald-700 bg-emerald-50'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
                onClick={() => setMobileMenuOpen(false)}
              >
                {item.label}
              </Link>
            ))}
            <div className="border-t border-gray-100 pt-3 pb-3 flex flex-col gap-2">
              {(userName || localUser) ? (
                <>
                  <div className="px-4 py-2 text-sm font-bold text-gray-700">
                    Xin chào, {userName || localUser?.fullName}
                  </div>
                  <Link
                    href="/profile"
                    className="block text-center px-4 py-3 rounded-lg font-bold text-emerald-700 border border-emerald-600 bg-emerald-50"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Tài khoản
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="w-full text-center px-4 py-3 rounded-lg font-bold text-red-600 border border-red-600 hover:bg-red-50"
                  >
                    Đăng xuất
                  </button>
                </>
              ) : (
                <>
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
                </>
              )}
            </div>
          </div>
        </nav>
      )}
    </header>
  );
}