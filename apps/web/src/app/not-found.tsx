'use client';

import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4">
      <div className="max-w-md w-full text-center animate-scale-in">
        {/* Icon */}
        <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-12 h-12 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>

        {/* Text */}
        <h1 className="text-4xl font-bold text-gray-900 mb-2">404</h1>
        <h2 className="text-xl font-semibold text-gray-800 mb-3">Chức năng đang được phát triển</h2>
        <p className="text-gray-500 mb-8 leading-relaxed">
          Trang bạn đang tìm kiếm hiện chưa hoàn thiện hoặc không tồn tại. Đội ngũ phát triển đang nỗ lực hoàn thiện hệ thống trong thời gian sớm nhất.
        </p>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link href="/" className="btn-primary w-full sm:w-auto px-8">
            Về Trang Chủ
          </Link>
          <button 
            className="btn-secondary w-full sm:w-auto px-8"
            onClick={() => window.history.back()}
          >
            Quay lại
          </button>
        </div>

        {/* Footer info */}
        <div className="mt-12 text-sm text-gray-400">
          <p>Hệ thống Phục vụ Công dân AI — Cổng Dịch Vụ Công</p>
        </div>
      </div>
    </div>
  );
}
