import Link from 'next/link';

export function Footer() {
  return (
    <footer className="bg-white border-t-[4px] border-teal-600 py-12">
      <div className="w-full px-4 md:px-8 xl:px-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          
          <div className="lg:col-span-2 flex flex-col items-center md:items-start gap-5 text-center md:text-left">
            <div>
              <p className="text-gray-900 font-extrabold text-lg mb-1.5">
                Bản quyền thuộc về: Team MVP
              </p>
              <p className="text-gray-600 font-medium">
                Phát triển bởi đội ngũ GovTrust AI
              </p>
            </div>
            <div className="w-36 h-36 rounded-2xl overflow-hidden shadow-lg border border-gray-100 bg-white flex items-center justify-center p-1.5">
              <img src="/MVP.jpg" alt="Team MVP UTH Logo" className="w-full h-full object-contain rounded-xl" />
            </div>
          </div>

          <div>
            <h4 className="text-lg font-bold text-gray-900 mb-4 border-b border-gray-200 pb-2">Liên hệ</h4>
            <div className="space-y-3">
              <p className="text-gray-700 font-medium flex items-center gap-2">
                <span className="font-bold">Email:</span> <a href="mailto:support@govtrust.site" className="text-teal-600 hover:underline">support@govtrust.ai</a>
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
          <p className="text-gray-500 font-medium text-sm">
            Phát triển bởi đội ngũ GovTrust AI
          </p>
        </div>
      </div>
    </footer>
  );
}
