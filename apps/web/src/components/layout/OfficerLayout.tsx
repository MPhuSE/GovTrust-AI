'use client';

import { Header } from './Header';
import { Sidebar } from './Sidebar';

interface OfficerLayoutProps {
  children: React.ReactNode;
}

export function OfficerLayout({ children }: OfficerLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
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
