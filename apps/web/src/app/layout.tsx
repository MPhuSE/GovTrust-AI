import type { Metadata, Viewport } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import { Providers } from '@/components/layout/Providers';
import '@/styles/globals.css';

const inter = Inter({
  subsets: ['latin', 'vietnamese'],
  display: 'swap',
  variable: '--font-inter',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-mono',
});

export const metadata: Metadata = {
  title: 'GovTrust AI — Kiểm tra hồ sơ dịch vụ công',
  description:
    'Hệ thống hỗ trợ tiền kiểm hồ sơ dịch vụ công — kiểm tra giấy tờ trước khi nộp, phát hiện lỗi ngay tại nhà. Vietnamese Student HackAIthon 2026.',
  keywords: 'dịch vụ công, kiểm tra hồ sơ, AI, GovTrust, tiền kiểm',
  robots: 'noindex, nofollow',
  icons: {
    icon: '/logo.jpg',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi" className={`${inter.variable} ${jetbrainsMono.variable}`} suppressHydrationWarning>
      <head>
        <meta httpEquiv="X-Content-Type-Options" content="nosniff" />

        <meta name="referrer" content="strict-origin-when-cross-origin" />
      </head>
      <body className={`${inter.className} bg-gray-50 min-h-screen antialiased`} suppressHydrationWarning>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
