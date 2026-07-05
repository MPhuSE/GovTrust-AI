'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface SidebarProps {
  variant: 'citizen' | 'officer';
  userName?: string;
  userLevel?: string;
}

interface MenuItem {
  href: string;
  label: string;
  icon?: string;
  primary?: boolean;
}

const citizenMenu: MenuItem[] = [
  { href: '/', label: 'Nộp hồ sơ mới', icon: 'plus', primary: true },
  { href: '/history', label: 'Hồ sơ đã nộp', icon: 'folder' },
  { href: '/services', label: 'Dịch vụ của tôi', icon: 'grid' },
  { href: '/notifications', label: 'Thông báo', icon: 'bell' },
  { href: '/settings', label: 'Cài đặt', icon: 'settings' },
  { href: '/support', label: 'Hỗ trợ', icon: 'help' },
];

const officerMenu: MenuItem[] = [
  { href: '/dashboard', label: 'Bảng điều khiển', icon: 'chart' },
  { href: '/queue', label: 'Kiểm duyệt', icon: 'check' },
  { href: '/history', label: 'Lịch sử duyệt', icon: 'folder' },
  { href: '/notifications', label: 'Thông báo', icon: 'bell' },
  { href: '/settings', label: 'Cài đặt', icon: 'settings' },
];


export function Sidebar({ variant, userName, userLevel }: SidebarProps) {
  const pathname = usePathname();
  const menuItems = variant === 'officer' ? officerMenu : citizenMenu;

  return (
    <aside className="w-64 bg-white/95 backdrop-blur-xl border-r border-gray-100 flex flex-col h-full" role="navigation" aria-label="Menu bên">
      {/* User Profile */}
      <div className="p-5 border-b border-gray-50 bg-gray-50/50">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-emerald-50 border border-emerald-100 rounded-full flex items-center justify-center shadow-sm">
            {variant === 'officer' ? (
              <div className="w-8 h-8 bg-[#0A192F] rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xs">G</span>
              </div>
            ) : (
              <span className="text-emerald-700 font-bold text-lg">
                {userName ? userName.charAt(0).toUpperCase() : '?'}
              </span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-[#0A192F] text-sm truncate">
              {userName ? `Chào ${userName}!` : 'Chào bạn!'}
            </p>
            <p className="text-xs text-emerald-600 font-medium truncate">
              {userLevel || (variant === 'officer' ? 'Cán bộ chuyên trách' : 'Xác thực cấp độ 2')}
            </p>
          </div>
        </div>
      </div>

      {/* Menu Items */}
      <nav className="flex-1 p-3 space-y-1.5 overflow-y-auto custom-scrollbar">
        {menuItems.map((item) => {
          const isActive = pathname === item.href ||
            (item.href !== '/' && pathname.startsWith(item.href));

          if (item.primary) {
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold bg-[#0A192F] text-white hover:bg-[#112240] transition-all shadow-md mb-3"
              >
                {item.label}
              </Link>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 ${
                isActive
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-100/50 shadow-sm'
                  : 'text-gray-500 hover:bg-gray-50 hover:text-[#0A192F] border border-transparent'
              }`}
              aria-current={isActive ? 'page' : undefined}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="p-3 border-t border-gray-100 bg-gray-50/50">
        <Link
          href="/login"
          className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-gray-500 hover:bg-red-50 hover:text-red-600 hover:border-red-100 border border-transparent transition-all"
        >
          Đăng xuất
        </Link>
      </div>
    </aside>
  );
}
