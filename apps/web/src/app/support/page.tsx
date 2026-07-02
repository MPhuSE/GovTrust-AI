import { CitizenLayout } from '@/components/layout/CitizenLayout';
import { Mail, Phone, MessageSquare, FileQuestion } from 'lucide-react';

export default function SupportPage() {
  return (
    <CitizenLayout>
      <div className="bg-ivory min-h-screen py-16 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-extrabold text-navy mb-4">Trung tâm hỗ trợ</h1>
            <p className="text-navy/60 text-lg">Chúng tôi luôn sẵn sàng hỗ trợ bạn hoàn thành các thủ tục một cách nhanh chóng nhất.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
            <div className="bg-white p-8 rounded-md border border-navy/5 shadow-sm text-center">
              <div className="w-16 h-16 bg-teal-50 rounded-md flex items-center justify-center mx-auto mb-6">
                <Phone className="w-8 h-8 text-teal-600" />
              </div>
              <h3 className="text-xl font-bold text-navy mb-2">Tổng đài hỗ trợ</h3>
              <p className="text-navy/60 mb-4">Phục vụ 24/7 đối với các vấn đề kỹ thuật và tra cứu hồ sơ.</p>
              <a href="tel:19001234" className="text-2xl font-bold text-teal-600 hover:text-teal-700">1900 1234</a>
            </div>

            <div className="bg-white p-8 rounded-md border border-navy/5 shadow-sm text-center">
              <div className="w-16 h-16 bg-blue-50 rounded-md flex items-center justify-center mx-auto mb-6">
                <Mail className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold text-navy mb-2">Gửi Email</h3>
              <p className="text-navy/60 mb-4">Chúng tôi sẽ phản hồi email của bạn trong vòng 24 giờ làm việc.</p>
              <a href="mailto:support@govtrust.ai" className="text-xl font-bold text-blue-600 hover:text-blue-700">support@govtrust.ai</a>
            </div>
          </div>

          <div className="bg-white p-8 sm:p-10 rounded-md border border-navy/5 shadow-sm">
            <h2 className="text-2xl font-bold text-navy mb-6 flex items-center gap-2">
              <FileQuestion className="w-6 h-6 text-teal-600" /> Câu hỏi thường gặp
            </h2>
            
            <div className="space-y-6">
              <div className="pb-6 border-b border-gray-100">
                <h4 className="font-bold text-navy text-lg mb-2">Tôi cần làm gì khi AI báo lỗi &quot;Không khớp thông tin&quot;?</h4>
                <p className="text-navy/60">Bạn cần kiểm tra lại các giấy tờ vừa tải lên. Có thể thông tin giữa CMND/CCCD và Hộ khẩu của bạn không đồng nhất. Vui lòng cập nhật lại giấy tờ mới nhất hoặc liên hệ cơ quan cấp phát để được đính chính.</p>
              </div>
              <div className="pb-6 border-b border-gray-100">
                <h4 className="font-bold text-navy text-lg mb-2">Tại sao ảnh chụp CCCD của tôi bị từ chối?</h4>
                <p className="text-navy/60">Hệ thống eKYC yêu cầu ảnh CCCD phải rõ nét, không bị chói sáng, không bị mất góc và phải là bản gốc. Vui lòng chụp lại ảnh ở nơi có ánh sáng tốt và tránh dùng đèn flash chiếu trực tiếp.</p>
              </div>
              <div>
                <h4 className="font-bold text-navy text-lg mb-2">Dữ liệu của tôi có được bảo mật không?</h4>
                <p className="text-navy/60">Hoàn toàn bảo mật. Hệ thống áp dụng cơ chế Data Masking (ẩn danh dữ liệu) và File Cleanup (xóa giấy tờ ngay sau khi xử lý xong) để đảm bảo quyền riêng tư tuyệt đối cho công dân.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </CitizenLayout>
  );
}
