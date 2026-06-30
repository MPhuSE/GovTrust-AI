'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Sparkles, Camera, CheckCircle, FileText, ChevronRight, FileDigit } from 'lucide-react';
import { proceduresApi, sessionsApi } from '@/lib/api-client';
import { CitizenLayout } from '@/components/layout/CitizenLayout';
import { Disclaimer } from '@/components/ui/Disclaimer';
import { TrustSignal } from '@/components/ui/TrustSignal';
import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton';

interface Procedure {
  _id: string;
  code: string;
  name: string;
  description?: string;
}

export default function HomePage() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [procedures, setProcedures] = useState<Procedure[]>([]);
  const [loadingProcedures, setLoadingProcedures] = useState(true);

  // Load available procedures
  useEffect(() => {
    proceduresApi
      .list()
      .then((data) => setProcedures((data as unknown as Procedure[]) || []))
      .catch(() => {
        /* silent fail - demo data will show */
      })
      .finally(() => setLoadingProcedures(false));
  }, []);

  const handleStart = async () => {
    if (!query.trim()) return;
    setIsLoading(true);
    setError(null);
    try {
      const result = (await proceduresApi.identify(query)) as unknown as {
        procedureId?: string;
        procedure?: Procedure;
      };
      if (result.procedureId) {
        const session = (await sessionsApi.create(result.procedureId)) as unknown as {
          _id: string;
        };
        router.push(`/upload/${session._id}`);
      } else {
        setError('Không tìm thấy thủ tục phù hợp. Vui lòng mô tả rõ hơn hoặc chọn từ danh sách bên dưới.');
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectProcedure = async (procedureId: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const session = (await sessionsApi.create(procedureId)) as unknown as { _id: string };
      router.push(`/upload/${session._id}`);
    } catch (e) {
      setError((e as Error).message);
      setIsLoading(false);
    }
  };

  const quickSuggestions = [
    'Đăng ký khai sinh cho con',
    'Cấp đổi CCCD',
    'Đăng ký tạm trú',
    'Chứng thực bản sao',
  ];

  return (
    <CitizenLayout>
      <div className="animate-fade-in pb-12">
        {/* Dynamic Hero Section */}
        <section className="relative overflow-hidden bg-gradient-to-br from-blue-700 via-blue-800 to-blue-900">
          {/* Animated Background Mesh/Gradient */}
          <div className="absolute inset-0 z-0">
            <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[70%] rounded-full bg-blue-400/20 blur-[100px] animate-pulse-slow"></div>
            <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[70%] rounded-full bg-blue-300/10 blur-[120px] animate-pulse-slow" style={{ animationDelay: '1s' }}></div>
            {/* Grid Pattern */}
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCI+CjxwYXRoIGQ9Ik00MCAwaC00MHY0MGg0MHoiIGZpbGw9Im5vbmUiLz4KPHBhdGggZD0iTTAgMGg0MHY0MEgwem0yMCAwaDIwdjIwSDIweiIgZmlsbD0icmdiYSgyNTUsIDI1NSLCAyNTUsIDAuMDMpIi8+Cjwvc3ZnPg==')] opacity-20"></div>
          </div>

          <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 py-16 sm:py-24 text-center">
            {/* AI Status Badge */}
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-full px-4 py-1.5 text-sm font-medium mb-8 text-blue-50 shadow-[0_0_15px_rgba(37,99,235,0.3)]">
              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse shadow-[0_0_8px_rgba(74,222,128,0.8)]" />
              Hệ thống AI sẵn sàng phục vụ
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold mb-6 text-white text-balance tracking-tight leading-tight">
              Tiền kiểm hồ sơ bằng <span className="text-blue-300">Trí Tuệ Nhân Tạo</span>
            </h1>
            <p className="text-blue-100/80 text-lg sm:text-xl mb-10 max-w-2xl mx-auto font-light leading-relaxed">
              Tải lên giấy tờ, AI phát hiện lỗi và tự động điền đơn trong chưa đầy 30 giây. Không còn nỗi lo sai sót hay phải đi lại nhiều lần.
            </p>

            {/* HoSoBot Input (Glassmorphism) */}
            <div className="max-w-2xl mx-auto">
              <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-2 shadow-2xl flex flex-col sm:flex-row gap-2 transition-all duration-300 focus-within:bg-white/15 focus-within:border-blue-400/50">
                <div className="flex-1 relative">
                  <Sparkles className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-blue-300" />
                  <input
                    type="text"
                    className="w-full bg-transparent px-12 py-3.5 text-base sm:text-lg text-white placeholder-blue-200/60 rounded-xl focus:outline-none"
                    placeholder='Nhập thủ tục bạn cần, ví dụ: "Đăng ký khai sinh"'
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleStart()}
                    aria-label="Nhập thủ tục cần kiểm tra"
                  />
                </div>
                <button
                  className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-8 py-3.5 rounded-xl font-semibold transition-all duration-300 disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-blue-500/30 w-full sm:w-auto"
                  onClick={handleStart}
                  disabled={isLoading || !query.trim()}
                >
                  {isLoading ? (
                    <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                  ) : (
                    <>Bắt đầu ngay <ChevronRight className="w-5 h-5" /></>
                  )}
                </button>
              </div>

              {error && (
                <div className="mt-4 bg-red-500/20 backdrop-blur-md border border-red-500/40 rounded-xl p-3 text-red-100 text-sm flex items-center gap-2 animate-slide-up">
                  <span>❌</span> {error}
                </div>
              )}

              {/* Quick suggestions */}
              <div className="flex flex-wrap gap-2 sm:gap-3 mt-6 justify-center">
                <span className="text-blue-200/60 text-sm py-1.5 hidden sm:inline-block">Gợi ý:</span>
                {quickSuggestions.map((s) => (
                  <button
                    key={s}
                    className="bg-white/5 hover:bg-white/15 text-blue-100 text-sm px-4 py-1.5 rounded-full border border-white/10 hover:border-white/30 transition-all duration-300"
                    onClick={() => setQuery(s)}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </div>
          
          {/* Bottom Wave Divider */}
          <div className="absolute bottom-0 left-0 w-full overflow-hidden leading-[0]">
            <svg className="relative block w-full h-[40px] sm:h-[60px]" data-name="Layer 1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 120" preserveAspectRatio="none">
              <path d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V120H0V95.8C59.71,118.08,130.83,119.78,202,112.5,242.49,108.4,282.51,93.6,321.39,56.44Z" fill="#F9FAFB"></path>
            </svg>
          </div>
        </section>

        {/* Features Section */}
        <section className="max-w-5xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">Giải pháp công nghệ vượt trội</h2>
            <p className="text-gray-500 max-w-2xl mx-auto">Trải nghiệm dịch vụ công chưa bao giờ dễ dàng đến thế nhờ sự hỗ trợ đắc lực từ AI.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
            {[
              {
                icon: <Camera className="w-8 h-8 text-blue-600" />,
                title: 'Số hóa tức thì',
                desc: 'AI tự động nhận diện và bóc tách dữ liệu từ ảnh chụp giấy tờ cực kỳ chuẩn xác.',
                color: 'bg-blue-50 border-blue-100',
                iconBg: 'bg-blue-100'
              },
              {
                icon: <CheckCircle className="w-8 h-8 text-emerald-600" />,
                title: 'Kiểm tra chéo thông minh',
                desc: 'Phát hiện ngay lập tức các sai lệch thông tin giữa nhiều loại giấy tờ khác nhau.',
                color: 'bg-emerald-50 border-emerald-100',
                iconBg: 'bg-emerald-100'
              },
              {
                icon: <FileText className="w-8 h-8 text-purple-600" />,
                title: 'Form tự điền 100%',
                desc: 'Hệ thống tự động điền biểu mẫu, bạn chỉ việc kiểm tra lại và nhấn xác nhận.',
                color: 'bg-purple-50 border-purple-100',
                iconBg: 'bg-purple-100'
              },
            ].map((f) => (
              <div key={f.title} className={`rounded-2xl p-6 sm:p-8 border ${f.color} transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl hover:shadow-gray-200/50 group`}>
                <div className={`w-16 h-16 rounded-2xl ${f.iconBg} flex items-center justify-center mb-6 transition-transform duration-300 group-hover:scale-110`}>
                  {f.icon}
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{f.title}</h3>
                <p className="text-gray-600 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>

          {/* Procedure List */}
          <div className="bg-white rounded-3xl p-6 sm:p-10 shadow-sm border border-gray-100">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                <FileDigit className="w-5 h-5 text-gray-700" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Danh mục thủ tục hiện hành</h2>
                <p className="text-sm text-gray-500">Hoặc chọn trực tiếp từ danh sách dưới đây để bắt đầu</p>
              </div>
            </div>

            {loadingProcedures ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[1, 2, 3, 4].map((i) => (
                  <LoadingSkeleton key={i} variant="card" />
                ))}
              </div>
            ) : procedures.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {procedures.map((p) => (
                  <button
                    key={p._id}
                    onClick={() => handleSelectProcedure(p._id)}
                    disabled={isLoading}
                    className="text-left p-5 rounded-xl border border-gray-200 bg-white hover:border-blue-300 hover:bg-blue-50/50 hover:shadow-md transition-all duration-200 flex items-center gap-4 disabled:opacity-50 group"
                  >
                    <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center shrink-0 group-hover:bg-blue-600 group-hover:text-white transition-colors duration-300">
                      <FileText className="w-6 h-6" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-gray-900 truncate group-hover:text-blue-700 transition-colors">{p.name}</p>
                      {p.description ? (
                        <p className="text-sm text-gray-500 truncate mt-0.5">{p.description}</p>
                      ) : (
                        <p className="text-sm text-gray-400 mt-0.5 font-mono-num">Mã số: {p.code}</p>
                      )}
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-blue-600 transition-colors shrink-0" />
                  </button>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 px-4 bg-gray-50 rounded-2xl border border-gray-100 border-dashed">
                <FileDigit className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 font-medium">Chưa có dữ liệu thủ tục.</p>
                <p className="text-sm text-gray-400 mt-1">Sử dụng ô tìm kiếm phía trên để tra cứu.</p>
              </div>
            )}
          </div>

          <div className="mt-12 space-y-4 max-w-3xl mx-auto">
            <Disclaimer />
            <TrustSignal />
          </div>
        </section>
      </div>
    </CitizenLayout>
  );
}
