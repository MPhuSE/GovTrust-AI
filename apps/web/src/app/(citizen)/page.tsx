'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { sessionsApi } from '@/lib/api-client';
import { CitizenLayout } from '@/components/layout/CitizenLayout';

// 3 thủ tục MVP — bấm là vào thẳng bước tải giấy tờ (tạo session ngay).
const PROCEDURES = [
  { title: 'Đăng ký khai sinh', subtitle: 'Thủ tục hành chính về hộ tịch', code: 'DANG_KY_KHAI_SINH' },
  { title: 'Chuyển nhượng quyền sử dụng đất', subtitle: 'Thủ tục hành chính về đất đai', code: 'CHUYEN_NHUONG_QSDD' },
  { title: 'Đăng ký thay đổi chủ hộ kinh doanh', subtitle: 'Thủ tục hành chính về đăng ký kinh doanh', code: 'HKD_THAY_DOI' },
];

// 4 bước xử lý hồ sơ — mô tả đúng pipeline thật (OCR → đối soát → chấm điểm → tự điền form).
const STEPS = [
  { title: 'Tải giấy tờ', desc: 'Chụp hoặc tải ảnh CCCD, giấy tờ liên quan.' },
  { title: 'AI đọc & bóc tách', desc: 'Trích xuất thông tin tự động từ mỗi giấy tờ.' },
  { title: 'Kiểm tra & chấm điểm', desc: 'Đối soát chéo, phát hiện sai lệch kèm căn cứ pháp lý.' },
  { title: 'Nhận tờ khai', desc: 'Biểu mẫu tự điền sẵn, tải về nộp ngay.' },
];

// Tính năng nổi bật — bám sát năng lực thực tế của hệ thống.
const FEATURES = [
  { title: 'Bóc tách tự động', desc: 'OCR đọc CCCD và giấy tờ, không cần gõ tay từng ô.' },
  { title: 'Đối soát chéo', desc: 'So khớp thông tin giữa các giấy tờ, cảnh báo lệch ngay.' },
  { title: 'Căn cứ pháp lý', desc: 'Mỗi cảnh báo kèm trích dẫn điều luật liên quan.' },
  { title: 'Bảo mật dữ liệu', desc: 'Thông tin cá nhân tự động xóa sau 30 phút.' },
];

export default function HomePage() {
  const router = useRouter();
  const [startingCode, setStartingCode] = useState<string | null>(null);

  const handleSelectProcedure = async (procedureId: string) => {
    setStartingCode(procedureId);
    try {
      const session = (await sessionsApi.create(procedureId)) as unknown as { _id: string };
      router.push(`/upload/${session._id}`);
    } catch (e) {
      router.push('/services');
    }
  };

  return (
    <CitizenLayout>
      <div className="bg-white min-h-screen pb-24 selection:bg-emerald-200 font-sans">

        {/* HERO SECTION - LIGHT THEME */}
        <section className="relative w-full pt-28 pb-16 px-4 flex flex-col items-center justify-center overflow-hidden bg-gradient-to-b from-emerald-50 via-white to-white">
          {/* Decorative background elements */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[70%] rounded-full bg-emerald-100/50 blur-[100px]"></div>
            <div className="absolute top-[20%] -right-[10%] w-[50%] h-[70%] rounded-full bg-blue-100/40 blur-[100px]"></div>
          </div>

          <div className="relative z-10 w-full max-w-3xl mx-auto text-center animate-fade-in">
            <h1 className="font-extrabold tracking-tight text-5xl md:text-6xl lg:text-7xl mb-6">
              <span className="text-emerald-900 drop-shadow-sm">GOVTRUST</span> <span className="text-emerald-500 drop-shadow-sm">AI</span>
            </h1>

            <p className="text-lg md:text-xl text-gray-600 font-medium max-w-2xl mx-auto leading-relaxed">
              Cổng thông tin thủ tục hành chính trực tuyến thế hệ mới.<br className="hidden md:block"/> Đơn giản, Minh bạch và Thông minh.
            </p>
          </div>
        </section>

        {/* DANH SÁCH THỦ TỤC — panel nổi bật, kéo lên chồng hero */}
        <section className="px-4 md:px-8 xl:px-12 w-full mx-auto relative z-20 -mt-10">
          <div className="max-w-[1100px] mx-auto bg-white rounded-3xl border border-gray-100 shadow-[0_20px_60px_rgb(0,0,0,0.08)] p-6 md:p-10">
            <div className="text-center mb-8">
              <span className="inline-flex items-center gap-2 mb-3 px-4 py-1.5 rounded-full bg-emerald-600 text-white text-sm font-bold shadow-sm">
                Bắt đầu ngay
              </span>
              <h2 className="text-2xl md:text-4xl font-extrabold text-slate-800 tracking-tight">Chọn thủ tục để bắt đầu</h2>
              <p className="text-gray-500 font-medium mt-2">Chọn một thủ tục, AI sẽ hướng dẫn bạn hoàn tất hồ sơ trong vài phút.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-5">
              {PROCEDURES.map((p) => (
                <ServiceCard
                  key={p.code}
                  title={p.title}
                  subtitle={p.subtitle}
                  loading={startingCode === p.code}
                  disabled={!!startingCode}
                  onClick={() => handleSelectProcedure(p.code)}
                />
              ))}
            </div>
          </div>
        </section>

        {/* CÁCH HOẠT ĐỘNG — 4 bước pipeline */}
        <section className="px-4 md:px-8 xl:px-12 w-full mx-auto relative z-20 mt-20">
          <div className="max-w-[1100px] mx-auto">
            <div className="text-center mb-10">
              <p className="text-emerald-600 font-bold text-sm uppercase tracking-wider mb-2">Quy trình 4 bước</p>
              <h2 className="text-2xl md:text-3xl font-extrabold text-slate-800 tracking-tight">Nộp hồ sơ đúng ngay từ đầu</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {STEPS.map((s, i) => (
                <div key={s.title} className="relative bg-white border border-gray-100 rounded-2xl p-6 shadow-[0_2px_10px_rgb(0,0,0,0.03)] flex flex-col justify-between">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 font-extrabold text-base flex items-center justify-center mb-4">
                    0{i + 1}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800 text-[15px] mb-1.5">{s.title}</h3>
                    <p className="text-sm text-gray-500 font-medium leading-relaxed">{s.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* TÍNH NĂNG NỔI BẬT */}
        <section className="px-4 md:px-8 xl:px-12 w-full mx-auto relative z-20 mt-20">
          <div className="max-w-[1100px] mx-auto">
            <div className="text-center mb-10">
              <p className="text-emerald-600 font-bold text-sm uppercase tracking-wider mb-2">Vì sao chọn GovTrust AI</p>
              <h2 className="text-2xl md:text-3xl font-extrabold text-slate-800 tracking-tight">Trí tuệ nhân tạo hỗ trợ tiền kiểm</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {FEATURES.map((f) => (
                <div key={f.title} className="bg-gradient-to-b from-emerald-50/40 to-white border border-gray-100 rounded-2xl p-6 hover:border-emerald-200 hover:shadow-[0_8px_20px_rgb(0,0,0,0.05)] transition-all">
                  <h3 className="font-bold text-emerald-800 text-base mb-2 border-b border-emerald-100/60 pb-2">{f.title}</h3>
                  <p className="text-sm text-gray-600 font-medium leading-relaxed">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

      </div>
    </CitizenLayout>
  );
}

function ServiceCard({
  title,
  subtitle,
  loading,
  disabled,
  onClick,
}: {
  title: string;
  subtitle?: string;
  loading?: boolean;
  disabled?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="relative bg-white border border-gray-100 rounded-2xl p-6 text-left transition-all cursor-pointer group flex flex-col justify-between gap-4 shadow-[0_2px_10px_rgb(0,0,0,0.03)] hover:shadow-[0_12px_30px_rgb(5,150,105,0.12)] hover:border-emerald-300 hover:-translate-y-1 disabled:opacity-60 disabled:pointer-events-none overflow-hidden min-h-[140px]"
    >
      {/* Ánh sáng nền khi hover */}
      <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full bg-emerald-100/0 group-hover:bg-emerald-100/50 blur-2xl transition-all duration-500 pointer-events-none" />

      <div className="relative flex-1">
        <h3 className="font-bold text-slate-800 group-hover:text-emerald-700 transition-colors text-lg leading-snug">{title}</h3>
        {subtitle && <p className="text-sm text-gray-400 mt-2 font-medium">{subtitle}</p>}
      </div>

      <div className="relative flex items-center gap-2 text-sm font-bold text-emerald-600 opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all duration-300">
        {loading ? (
          <>
            <span className="block w-4 h-4 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
            Đang mở...
          </>
        ) : (
          <>
            Bắt đầu
            <span className="font-bold">→</span>
          </>
        )}
      </div>
    </button>
  );
}
