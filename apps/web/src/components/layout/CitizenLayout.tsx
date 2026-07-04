'use client';

import { Header } from './Header';
import { Footer } from './Footer';
import { ChatWidget } from '../chat/ChatWidget';

interface CitizenLayoutProps {
  children: React.ReactNode;
  showHeader?: boolean;
  showFooter?: boolean;
}

export function CitizenLayout({ children, showHeader = true, showFooter = true }: CitizenLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col bg-[#FBFBFA]">
      {showHeader && <Header variant="citizen" />}
      <main className="flex-1">
        {children}
      </main>
      {showFooter && <Footer />}
      <ChatWidget />
    </div>
  );
}
