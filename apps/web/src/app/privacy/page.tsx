import { CitizenLayout } from '@/components/layout/CitizenLayout';

export default function PrivacyPage() {
  return (
    <CitizenLayout>
      <div className="bg-ivory min-h-screen py-16 px-4 sm:px-6">
        <div className="max-w-3xl mx-auto bg-white p-8 sm:p-12 rounded-md shadow-sm border border-navy/5">
          <h1 className="text-3xl font-extrabold text-navy mb-8">Chính sách bảo mật & Quyền riêng tư</h1>
          
          <div className="prose prose-navy max-w-none">
            <p className="text-navy/70 font-medium text-lg mb-6">
              Tại GovTrust AI, chúng tôi đặt quyền riêng tư và bảo mật dữ liệu của bạn lên hàng đầu. Chính sách này giải thích cách chúng tôi thu thập, sử dụng và bảo vệ thông tin cá nhân của bạn khi sử dụng hệ thống.
            </p>

            <h2 className="text-xl font-bold text-navy mt-8 mb-4">1. Thu thập thông tin cá nhân (PII)</h2>
            <p className="text-navy/60 mb-4">
              Chúng tôi chỉ thu thập các thông tin cần thiết phục vụ cho việc nộp và tiền kiểm hồ sơ hành chính, bao gồm nhưng không giới hạn: họ tên, số CCCD, ngày sinh, và các giấy tờ đính kèm. Đặc biệt, hình ảnh chân dung (selfie) và ảnh CCCD chỉ được sử dụng cho tính năng eKYC (định danh điện tử) và không được lưu trữ vĩnh viễn trên máy chủ.
            </p>

            <h2 className="text-xl font-bold text-navy mt-8 mb-4">2. Xử lý và Ẩn danh dữ liệu (Data Masking)</h2>
            <p className="text-navy/60 mb-4">
              Khi hồ sơ của bạn được xử lý, toàn bộ thông tin định danh cá nhân (PII) sẽ được tự động làm mờ hoặc ẩn đi đối với các công chức không có thẩm quyền truy cập. Các báo cáo phân tích InsightsMap của hệ thống AI chỉ sử dụng dữ liệu ẩn danh hoàn toàn (anonymized data) để thống kê tỷ lệ lỗi và điểm số, tuyệt đối không chứa dữ liệu thật của bạn.
            </p>

            <h2 className="text-xl font-bold text-navy mt-8 mb-4">3. Tiêu hủy dữ liệu (Data Minimization)</h2>
            <p className="text-navy/60 mb-4">
              Sau khi bạn xác nhận nộp hồ sơ thành công hoặc phiên làm việc quá hạn, toàn bộ file ảnh, giấy tờ bản gốc mà bạn đã tải lên sẽ bị xóa vĩnh viễn khỏi máy chủ lưu trữ tạm thời của chúng tôi theo cơ chế dọn dẹp tự động (FileCleanupService). Chúng tôi chỉ lưu giữ kết quả nhận diện (OCR) dạng văn bản đã được mã hóa.
            </p>

            <h2 className="text-xl font-bold text-navy mt-8 mb-4">4. Quyền của công dân</h2>
            <p className="text-navy/60 mb-4">
              Bạn có quyền yêu cầu trích xuất toàn bộ dữ liệu hồ sơ cá nhân hoặc yêu cầu xóa bỏ tài khoản bất cứ lúc nào thông qua tính năng trong phần Cài đặt tài khoản.
            </p>

            <div className="mt-12 p-6 bg-teal-50 border border-teal-100 rounded-md">
              <h3 className="font-bold text-teal-800 mb-2">Bạn có câu hỏi?</h3>
              <p className="text-teal-700/80 text-sm">Vui lòng liên hệ với bộ phận hỗ trợ của chúng tôi qua email: privacy@govtrust.ai hoặc hotline: 1900 1234.</p>
            </div>
          </div>
        </div>
      </div>
    </CitizenLayout>
  );
}
