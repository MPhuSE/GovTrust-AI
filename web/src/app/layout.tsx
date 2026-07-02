import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import '@/styles/globals.css';
import { Navbar } from '@/components/ui/Navbar';
import { VnptSmartBotWidget } from '@/components/smartbot/VnptSmartBotWidget';

const inter = Inter({ subsets: ['latin', 'vietnamese'] });

export const metadata: Metadata = {
  title: 'GovTrust AI — Kiểm tra hồ sơ dịch vụ công',
  description: 'Hệ thống hỗ trợ tiền kiểm hồ sơ dịch vụ công — kiểm tra giấy tờ trước khi nộp',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi">
      <body className={`${inter.className} bg-gray-50 min-h-screen`}>
        <Navbar />
        {children}
        <VnptSmartBotWidget />
      </body>
    </html>
  );
}
