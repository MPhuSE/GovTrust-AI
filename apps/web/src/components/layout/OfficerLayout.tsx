'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { Header } from './Header';
import { Sidebar } from './Sidebar';

interface OfficerLayoutProps {
  children: React.ReactNode;
}

export function OfficerLayout({ children }: OfficerLayoutProps) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        router.push('/login');
      } else if (user.role === 'CITIZEN') {
        router.push('/');
      }
    }
  }, [user, isLoading, router]);

  // Premium loading state while checking auth
  if (isLoading || !user || user.role === 'CITIZEN') {
    return (
      <div className="min-h-screen flex flex-col bg-[#FBFBFA]">
        <Header variant="officer" />
        <div className="flex flex-1">
          <div className="hidden lg:block">
            <div className="sticky top-16 h-[calc(100vh-4rem)]">
              <Sidebar variant="officer" />
            </div>
          </div>
          <main className="flex-1 overflow-auto p-8 flex items-center justify-center">
            <div className="flex flex-col items-center gap-4 animate-pulse">
              <div className="w-12 h-12 rounded-full border-4 border-emerald-100 border-t-emerald-600 animate-spin" />
              <p className="text-gray-500 font-medium">Đang xác thực quyền truy cập...</p>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#FBFBFA]">
      <Header variant="officer" />
      <div className="flex flex-1">
        <div className="hidden lg:block">
          <div className="sticky top-16 h-[calc(100vh-4rem)]">
            <Sidebar variant="officer" />
          </div>
        </div>
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
