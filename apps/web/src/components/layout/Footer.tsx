import Link from 'next/link';

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-white mt-auto relative" role="contentinfo">
      {/* Subtle top gradient border */}
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-gray-200 to-transparent"></div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Copyright & Branding */}
          <div className="flex flex-col items-center md:items-start gap-2">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 bg-gradient-to-br from-[#0A192F] to-emerald-700 rounded flex items-center justify-center shadow-sm border border-emerald-800/20">
                <span className="text-white text-[10px] font-bold">G</span>
              </span>
              <span className="font-bold text-[#0A192F] text-sm tracking-tight">GovTrust AI</span>
            </div>
            <p className="text-sm text-gray-500 text-center md:text-left max-w-sm leading-relaxed font-medium">
              © {currentYear} Hệ thống Phục vụ Công dân ứng dụng Trí tuệ Nhân tạo — Chính phủ Việt Nam
            </p>
          </div>

          {/* Links */}
          <nav className="flex flex-wrap items-center justify-center md:justify-end gap-x-6 gap-y-3" aria-label="Liên kết phụ">
            <Link href="/privacy" className="text-sm font-semibold text-gray-500 hover:text-emerald-600 transition-colors">
              Chính sách bảo mật
            </Link>
            <Link href="/terms" className="text-sm font-semibold text-gray-500 hover:text-emerald-600 transition-colors">
              Điều khoản sử dụng
            </Link>
            <Link href="/support" className="text-sm font-semibold text-gray-500 hover:text-emerald-600 transition-colors">
              Liên hệ hỗ trợ
            </Link>
            <Link href="/guide" className="text-sm font-semibold text-gray-500 hover:text-emerald-600 transition-colors">
              Hướng dẫn sử dụng
            </Link>
          </nav>
        </div>
      </div>
    </footer>
  );
}
