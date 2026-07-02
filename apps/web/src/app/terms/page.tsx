import { CitizenLayout } from '@/components/layout/CitizenLayout';

export default function TermsPage() {
  return (
    <CitizenLayout>
      <div className="bg-ivory min-h-screen py-16 px-4 sm:px-6">
        <div className="max-w-3xl mx-auto bg-white p-8 sm:p-12 rounded-md shadow-sm border border-navy/5">
          <h1 className="text-3xl font-extrabold text-navy mb-8">Điều khoản sử dụng</h1>
          
          <div className="prose prose-navy max-w-none">
            <p className="text-navy/70 font-medium text-lg mb-6">
              Bằng việc truy cập và sử dụng nền tảng GovTrust AI, bạn đồng ý tuân thủ các điều khoản và điều kiện dưới đây. Vui lòng đọc kỹ trước khi bắt đầu thủ tục.
            </p>

            <h2 className="text-xl font-bold text-navy mt-8 mb-4">1. Mục đích của hệ thống</h2>
            <p className="text-navy/60 mb-4">
              GovTrust AI là hệ thống hỗ trợ tiền kiểm hồ sơ hành chính bằng công nghệ Trí tuệ Nhân tạo (AI). Hệ thống giúp phát hiện các lỗi sai sót, thông tin không khớp và tự động điền biểu mẫu. Tuy nhiên, kết quả từ AI chỉ mang tính chất tham khảo và hỗ trợ, quyết định cuối cùng vẫn thuộc về cán bộ công chức trực tiếp xử lý hồ sơ.
            </p>

            <h2 className="text-xl font-bold text-navy mt-8 mb-4">2. Trách nhiệm của người sử dụng</h2>
            <ul className="list-disc pl-5 text-navy/60 space-y-2 mb-4">
              <li>Cung cấp thông tin và giấy tờ trung thực, chính xác, không giả mạo.</li>
              <li>Chịu trách nhiệm trước pháp luật về tính hợp pháp của các giấy tờ tải lên hệ thống.</li>
              <li>Bảo mật thông tin tài khoản đăng nhập và không chia sẻ OTP với bất kỳ ai.</li>
            </ul>

            <h2 className="text-xl font-bold text-navy mt-8 mb-4">3. Tích hợp định danh điện tử (eKYC)</h2>
            <p className="text-navy/60 mb-4">
              Tài khoản công dân có thể được xác thực thông qua đối tác VNPT eKYC. Hệ thống sẽ tiến hành đối chiếu khuôn mặt với thẻ CCCD để đảm bảo tính chính chủ. Bạn đồng ý cho phép hệ thống sử dụng camera thiết bị để thực hiện quy trình này.
            </p>

            <h2 className="text-xl font-bold text-navy mt-8 mb-4">4. Từ chối bảo đảm</h2>
            <p className="text-navy/60 mb-4">
              Mặc dù hệ thống áp dụng công nghệ OCR và Cross-check tiên tiến, chúng tôi không đảm bảo độ chính xác tuyệt đối 100% trong mọi trường hợp do chất lượng ảnh chụp hoặc các yếu tố khách quan khác.
            </p>
          </div>
        </div>
      </div>
    </CitizenLayout>
  );
}
