import { CitizenLayout } from '@/components/layout/CitizenLayout';

export default function GuidePage() {
  return (
    <CitizenLayout>
      <div className="bg-ivory min-h-screen py-16 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto bg-white p-8 sm:p-12 rounded-md shadow-sm border border-navy/5">
          <h1 className="text-3xl font-extrabold text-navy mb-8">Hướng dẫn sử dụng</h1>
          
          <div className="space-y-12">
            {/* Step 1 */}
            <div className="flex gap-6">
              <div className="shrink-0 w-12 h-12 bg-teal-600 rounded-full flex items-center justify-center text-white font-bold text-xl">1</div>
              <div>
                <h3 className="text-xl font-bold text-navy mb-2">Đăng ký và xác thực eKYC</h3>
                <p className="text-navy/60 mb-4">
                  Bắt đầu bằng việc tạo tài khoản và xác thực danh tính điện tử. Hệ thống sẽ yêu cầu bạn chụp mặt trước, mặt sau CCCD và ảnh chân dung. 
                  Lưu ý chụp ở nơi có ánh sáng tốt, không đeo kính râm hay khẩu trang.
                </p>
                <div className="bg-gray-50 rounded p-4 border border-gray-100 flex items-center gap-4">
                  <div className="w-10 h-10 bg-teal-50 rounded-lg flex items-center justify-center shrink-0">📸</div>
                  <p className="text-sm text-navy/70"><span className="font-bold">Mẹo:</span> Giữ điện thoại song song với giấy tờ, không để ánh sáng đèn phản chiếu lên mặt thẻ.</p>
                </div>
              </div>
            </div>

            {/* Step 2 */}
            <div className="flex gap-6">
              <div className="shrink-0 w-12 h-12 bg-teal-600 rounded-full flex items-center justify-center text-white font-bold text-xl">2</div>
              <div>
                <h3 className="text-xl font-bold text-navy mb-2">Chọn thủ tục cần nộp</h3>
                <p className="text-navy/60">
                  Tại trang chủ, bạn có thể gõ tên thủ tục vào thanh tìm kiếm hoặc truy cập mục <strong>Danh mục thủ tục</strong> để chọn.
                  Hệ thống AI sẽ liệt kê sẵn các loại giấy tờ bạn cần phải chuẩn bị (Checklist).
                </p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="flex gap-6">
              <div className="shrink-0 w-12 h-12 bg-teal-600 rounded-full flex items-center justify-center text-white font-bold text-xl">3</div>
              <div>
                <h3 className="text-xl font-bold text-navy mb-2">Tải giấy tờ lên & Chờ AI phân tích</h3>
                <p className="text-navy/60 mb-4">
                  Tải lên bản chụp hoặc file PDF của các giấy tờ theo danh sách yêu cầu. AI sẽ tự động đọc (OCR) và đối chiếu chéo (Cross-check) thông tin giữa các giấy tờ để tìm ra các điểm bất thường.
                </p>
                <div className="bg-red-50 rounded p-4 border border-red-100 flex items-center gap-4">
                  <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center shrink-0">⚠️</div>
                  <p className="text-sm text-red-800"><span className="font-bold">Lưu ý:</span> Nếu AI báo lỗi <em>Info Mismatch</em>, bạn cần đọc kỹ chi tiết xem thông tin nào bị sai lệch (ví dụ: Sai địa chỉ giữa Hộ khẩu và CCCD) để bổ sung kịp thời.</p>
                </div>
              </div>
            </div>

            {/* Step 4 */}
            <div className="flex gap-6">
              <div className="shrink-0 w-12 h-12 bg-teal-600 rounded-full flex items-center justify-center text-white font-bold text-xl">4</div>
              <div>
                <h3 className="text-xl font-bold text-navy mb-2">Xác nhận và Điền biểu mẫu thông minh</h3>
                <p className="text-navy/60">
                  Sau khi hồ sơ đạt chuẩn, hệ thống SmartForm sẽ tự động điền các thông tin đã trích xuất vào tờ khai điện tử. 
                  Bạn chỉ việc đọc lướt qua để kiểm tra lại và nhấn <strong>Nộp hồ sơ</strong>.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </CitizenLayout>
  );
}
