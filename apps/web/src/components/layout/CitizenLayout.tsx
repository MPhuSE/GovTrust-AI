'use client';

import { Header } from './Header';
import { Footer } from './Footer';

interface CitizenLayoutProps {
  children: React.ReactNode;
  showHeader?: boolean;
  showFooter?: boolean;
}

// Tư vấn thủ tục dùng VNPT SmartBot (nhúng ở root layout.tsx); hero mở panel bot qua openVnptSmartBot().
export function CitizenLayout({ children, showHeader = true, showFooter = true }: CitizenLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col bg-[#FBFBFA]">
      {showHeader && <Header variant="citizen" />}
      <main className="flex-1">
        {children}
      </main>
      {showFooter && <Footer />}
    </div>
  );
}
