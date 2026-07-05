/** @type {import('next').NextConfig} */

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
// CSP connect-src chỉ chấp nhận origin tuyệt đối (http/https/ws). Khi deploy prod,
// NEXT_PUBLIC_API_URL là đường dẫn tương đối '/gw' (nginx proxy cùng origin) → không phải
// source hợp lệ, browser bỏ qua và log warning. Same-origin đã được 'self' bao phủ nên
// chỉ thêm API_URL vào connect-src khi nó là URL tuyệt đối.
const API_CONNECT_SRC = /^(https?|wss?):\/\//.test(API_URL) ? ` ${API_URL}` : '';

const nextConfig = {
  reactStrictMode: true,
  // Security Headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
          {
            key: 'Permissions-Policy',
            value: 'camera=(self), microphone=(self), geolocation=()',
          },
          {
            key: 'Content-Security-Policy',
            // VNPT SmartBot (widget livechat client-side) nạp script/css từ livechat.vnpt.vn,
            // ảnh từ *.vnpt.vn (ic-storage, storage-smartbot) và mở websocket tới *.vnpt.ai.
            // Thiếu các domain này thì widget bị CSP chặn im lặng → nút chat không hiện.
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' blob: https://livechat.vnpt.vn https://console-smartux.vnpt.vn",
              // VNPT core-track.js spawn web worker từ blob: → cần worker-src blob:.
              "worker-src 'self' blob:",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://livechat.vnpt.vn",
              "font-src 'self' https://fonts.gstatic.com https://livechat.vnpt.vn data:",
              "img-src 'self' data: blob: https://*.vnpt.vn",
              "media-src 'self' https://ic-smartvoice.vnpt.vn",
              `connect-src 'self'${API_CONNECT_SRC} https://livechat.vnpt.vn https://*.vnpt.ai wss://*.vnpt.ai https://console-smartux.vnpt.vn`,
              "frame-src 'self' https://*.vnpt.vn",
              "frame-ancestors 'none'",
            ].join('; '),
          },
        ],
      },
    ];
  },

  // API Proxy
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'}/:path*`,
      },
    ];
  },
};

export default nextConfig;
