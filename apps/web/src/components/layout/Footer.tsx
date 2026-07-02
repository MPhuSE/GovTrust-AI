import Link from 'next/link';

export function Footer() {
  return (
    <footer className="bg-white border-t-[4px] border-teal-600 py-12">
      <div className="w-full px-4 md:px-8 xl:px-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          
          <div className="lg:col-span-2">
            <h3 className="text-xl font-bold text-teal-700 uppercase mb-4">HỆ THỐNG GOVTRUST AI</h3>
            <p className="text-gray-700 font-medium mb-2">
              Cơ quan chủ quản: Văn phòng Chính phủ
            </p>
            <p className="text-gray-700 font-medium mb-2">
              Bản quyền thuộc về: Bộ Thông tin và Truyền thông
            </p>
            <p className="text-gray-700 font-medium">
              Phát triển bởi đội ngũ GovTrust AI
            </p>
          </div>

          <div>
            <h4 className="text-lg font-bold text-gray-900 mb-4 border-b border-gray-200 pb-2">Liên hệ</h4>
            <div className="space-y-3">
              <p className="text-gray-700 font-medium flex items-center gap-2">
                <span className="font-bold">Tổng đài:</span> <span className="text-teal-600 font-bold text-lg">1800 1096</span>
              </p>
              <p className="text-gray-700 font-medium flex items-center gap-2">
                <span className="font-bold">Email:</span> <a href="mailto:support@govtrust.ai" className="text-teal-600 hover:underline">support@govtrust.ai</a>
              </p>
            </div>
          </div>

          <div>
            <h4 className="text-lg font-bold text-gray-900 mb-4 border-b border-gray-200 pb-2">Chính sách & Quy định</h4>
            <ul className="space-y-3">
              <li>
                <Link href="/privacy" className="text-gray-700 font-medium hover:text-teal-600 hover:underline">
                  Chính sách bảo mật
                </Link>
              </li>
              <li>
                <Link href="/terms" className="text-gray-700 font-medium hover:text-teal-600 hover:underline">
                  Điều khoản sử dụng
                </Link>
              </li>
              <li>
                <Link href="/guide" className="text-gray-700 font-medium hover:text-teal-600 hover:underline">
                  Hướng dẫn sử dụng
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-6 border-t border-gray-200 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-gray-500 font-medium text-sm">
            © {new Date().getFullYear()} GovTrust AI. All rights reserved.
          </p>
          <div className="flex gap-4">
            <span className="text-gray-500 text-sm font-medium">Hệ thống đang hoạt động ổn định</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
