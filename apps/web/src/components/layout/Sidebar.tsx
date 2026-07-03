'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface SidebarProps {
  variant: 'citizen' | 'officer';
  userName?: string;
  userLevel?: string;
}

const citizenMenu = [
  { href: '/', label: 'Nộp hồ sơ mới', icon: 'plus', primary: true },
  { href: '/history', label: 'Hồ sơ đã nộp', icon: 'folder' },
  { href: '/services', label: 'Dịch vụ của tôi', icon: 'grid' },
  { href: '/notifications', label: 'Thông báo', icon: 'bell' },
  { href: '/settings', label: 'Cài đặt', icon: 'settings' },
  { href: '/support', label: 'Hỗ trợ', icon: 'help' },
];

const officerMenu = [
  { href: '/dashboard', label: 'Bảng điều khiển', icon: 'chart' },
  { href: '/queue', label: 'Kiểm duyệt', icon: 'check' },
  { href: '/history', label: 'Lịch sử duyệt', icon: 'folder' },
  { href: '/notifications', label: 'Thông báo', icon: 'bell' },
  { href: '/settings', label: 'Cài đặt', icon: 'settings' },
];

function MenuIcon({ name, className }: { name: string; className?: string }) {
  const cls = className || 'w-5 h-5';
  switch (name) {
    case 'plus':
      return <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>;
    case 'folder':
      return <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" /></svg>;
    case 'grid':
      return <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>;
    case 'bell':
      return <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>;
    case 'settings':
      return <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>;
    case 'help':
      return <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
    case 'chart':
      return <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>;
    case 'check':
      return <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>;
    case 'logout':
      return <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>;
    default:
      return null;
  }
}

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
                <MenuIcon name={item.icon} className="w-5 h-5 opacity-80" />
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
              <MenuIcon name={item.icon} className="w-5 h-5" />
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
          <MenuIcon name="logout" className="w-5 h-5" />
          Đăng xuất
        </Link>
      </div>
    </aside>
  );
}
