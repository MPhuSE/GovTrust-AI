import type { Metadata, Viewport } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import Script from 'next/script';
import { Providers } from '@/components/layout/Providers';
import { VnptSmartBot } from '@/components/layout/VnptSmartBot';
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
  title: 'GovTrust AI',
  description:
    'Hệ thống hỗ trợ tiền kiểm hồ sơ dịch vụ công — kiểm tra giấy tờ trước khi nộp, phát hiện lỗi ngay tại nhà. Vietnamese Student HackAIthon 2026.',
  keywords: 'dịch vụ công, kiểm tra hồ sơ, AI, GovTrust, tiền kiểm',
  robots: 'noindex, nofollow',
  icons: {
    icon: '/logo.png',
    shortcut: '/favicon.ico',
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
        <Script
          id="vnpt-smartux"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              var VNPT = VNPT || {};
              VNPT.q = VNPT.q || [];
              VNPT.app_key = 'b361c08e2e2fd1f91db565424a68a7275d60722d';
              VNPT.url = 'https://console-smartux.vnpt.vn';
              VNPT.q.push(['track_sessions']);
              VNPT.q.push(['track_pageview']);
              VNPT.q.push(['track_clicks']);
              VNPT.q.push(['track_scrolls']);
              VNPT.q.push(['track_errors']);
              VNPT.q.push(['track_links']);
              VNPT.q.push(['track_forms']);
              VNPT.q.push(['collect_from_forms']);
              (function () {
                const paths = ['https://console-smartux.vnpt.vn/sdk/web/core-track.js', 'https://console-smartux.vnpt.vn/sdk/web/minify.min.js'];
                for (let i in paths) {
                  var cly = document.createElement('script'); cly.type = 'text/javascript';
                  cly.async = true;
                  cly.src = paths[i];
                  cly.onload = i == 0 ? function () { VNPT.init() } : function() { window.minify = require("html-minifier").minify; };
                  var s = document.getElementsByTagName('script')[0]; 
                  if (s && s.parentNode) {
                    s.parentNode.insertBefore(cly, s);
                  } else {
                    document.head.appendChild(cly);
                  }
                }
              })();
            `,
          }}
        />
      </head>
      <body className={`${inter.className} bg-gray-50 min-h-screen antialiased`} suppressHydrationWarning>
        <Providers>
          {children}
        </Providers>
        <VnptSmartBot />
      </body>
    </html>
  );
}
