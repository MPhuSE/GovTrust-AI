'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Search, Baby, GraduationCap, Briefcase, FileSignature, 
  Home, Building2, Coins, Bolt, Sparkles, ArrowRight, ShieldCheck, 
  HeartPulse, Car, FileText, Factory, UserCheck, Calculator, Landmark, HandCoins, Stethoscope
} from 'lucide-react';
import { proceduresApi, sessionsApi } from '@/lib/api-client';
import { CitizenLayout } from '@/components/layout/CitizenLayout';

export default function HomePage() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleStart = async (searchQuery?: string) => {
    const q = (searchQuery ?? query).trim();
    if (!q) return;
    setIsLoading(true);
    setError(null);
    try {
      const result = (await proceduresApi.identify(q)) as unknown as { procedureCode?: string };
      if (result.procedureCode) {
        const session = (await sessionsApi.create(result.procedureCode)) as unknown as { _id: string };
        router.push(`/upload/${session._id}`);
      } else {
        setError('Không tìm thấy thủ tục phù hợp. Vui lòng thử lại.');
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectProcedure = async (procedureId: string) => {
    setIsLoading(true);
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
        <section className="relative w-full pt-28 pb-24 px-4 flex flex-col items-center justify-center overflow-hidden bg-gradient-to-b from-emerald-50 via-white to-white">
          {/* Decorative background elements */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[70%] rounded-full bg-emerald-100/50 blur-[100px]"></div>
            <div className="absolute top-[20%] -right-[10%] w-[50%] h-[70%] rounded-full bg-blue-100/40 blur-[100px]"></div>
          </div>
          
          <div className="relative z-10 w-full max-w-4xl mx-auto text-center animate-fade-in">
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold mb-6 tracking-tight">
              <span className="text-emerald-900 drop-shadow-sm">GOVTRUST</span> <span className="text-emerald-500 drop-shadow-sm">AI</span>
            </h1>
            <p className="text-lg md:text-xl text-gray-600 mb-10 font-medium max-w-2xl mx-auto leading-relaxed">
              Cổng thông tin thủ tục hành chính trực tuyến thế hệ mới.<br className="hidden md:block"/> Đơn giản, Minh bạch và Thông minh.
            </p>

            <div className="bg-white rounded-full shadow-[0_8px_30px_rgb(0,0,0,0.08)] p-2 flex border border-gray-200 focus-within:ring-4 focus-within:ring-emerald-50 transition-all max-w-3xl mx-auto hover:shadow-[0_8px_30px_rgb(0,0,0,0.12)]">
              <div className="pl-6 flex items-center">
                <Search className="w-5 h-5 text-gray-400" />
              </div>
              <input
                type="text"
                className="flex-1 px-4 py-3 md:py-4 text-lg text-gray-800 focus:outline-none placeholder-gray-400 font-medium bg-transparent"
                placeholder="Nhập từ khóa thủ tục hành chính..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleStart()}
              />
              <button 
                onClick={() => handleStart()}
                disabled={isLoading}
                className="bg-emerald-700 hover:bg-emerald-600 text-white px-8 md:px-10 py-3 md:py-4 rounded-full font-bold transition-all flex items-center justify-center min-w-[140px] shadow-md"
              >
                {isLoading ? <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <>Tìm kiếm <ArrowRight className="w-4 h-4 ml-2" /></>}
              </button>
            </div>
            {error && (
              <div className="mt-4 text-red-500 font-medium text-sm">
                {error}
              </div>
            )}
          </div>
        </section>

        {/* AI BANNER - LIGHT */}
        <section className="px-4 md:px-8 xl:px-12 w-full mx-auto relative z-20 mb-16">
          <div className="max-w-[1200px] mx-auto bg-gradient-to-r from-emerald-50 to-emerald-100 rounded-[2rem] shadow-sm overflow-hidden flex flex-col md:flex-row group border border-emerald-200/60 transition-all h-auto md:h-64">
            <div className="p-8 md:p-12 flex-1 flex flex-col justify-center relative z-10">
              <div className="flex items-center gap-3 mb-4">
                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-200/50 text-emerald-800 font-bold text-xs tracking-wide uppercase">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-700" /> Công nghệ AI
                </div>
                <h2 className="text-2xl md:text-3xl font-extrabold text-slate-800 tracking-tight">
                  Tiền kiểm hồ sơ tự động
                </h2>
              </div>
              <p className="text-slate-600 text-base md:text-lg mb-8 leading-relaxed max-w-xl font-medium">
                Hệ thống AI tự động đối chiếu và phát hiện lỗi trên giấy tờ trước khi nộp, đảm bảo tỷ lệ duyệt hồ sơ tuyệt đối 100%.
              </p>
              <button 
                onClick={() => handleSelectProcedure('CT_01')}
                className="bg-white hover:bg-gray-50 text-slate-800 border border-gray-200 w-fit px-6 py-3 rounded-full font-bold transition-all flex items-center gap-2 shadow-sm group/btn text-sm"
              >
                Trải nghiệm ngay <ArrowRight className="w-4 h-4 transition-transform group-hover/btn:translate-x-1" />
              </button>
            </div>
            {/* Illustration space */}
            <div className="relative h-48 md:h-full w-full md:w-2/5 mt-auto overflow-hidden flex items-end justify-end">
               <img src="/ai-illustration.png" alt="GovTrust AI" className="h-[120%] md:h-[140%] object-contain object-right-bottom mix-blend-multiply group-hover:scale-105 transition-transform duration-700 origin-bottom-right opacity-90" />
            </div>
          </div>
        </section>

        {/* 2-COLUMN LAYOUT */}
        <section className="px-4 md:px-8 xl:px-12 w-full mx-auto relative z-20">
          <div className="max-w-[1200px] mx-auto grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-14">
            
            {/* COLUMN 1: CÔNG DÂN */}
            <div>
              <div className="flex items-center gap-3 mb-6 border-b border-gray-100 pb-4">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-700">
                  <UserCheck className="w-5 h-5" />
                </div>
                <h3 className="text-xl font-extrabold text-slate-800 uppercase tracking-tight">Công Dân</h3>
              </div>
              <div className="flex flex-col gap-4">
                <ServiceListBar icon={<Baby />} title="Cấp bản sao trích lục khai sinh" subtitle="Thủ tục hành chính về hộ tịch" onClick={() => handleSelectProcedure('CAP_BAN_SAO_TRICH_LUC_KHAI_SINH')} />
                <ServiceListBar icon={<Baby />} title="Đăng ký lại khai sinh" subtitle="Thủ tục hành chính về hộ tịch" onClick={() => handleSelectProcedure('DK_LAI_KHAI_SINH')} />
                <ServiceListBar icon={<HeartPulse />} title="Cấp Giấy xác nhận tình trạng hôn nhân" subtitle="Thủ tục hành chính về hộ tịch" onClick={() => handleSelectProcedure('XAC_NHAN_TINH_TRANG_HON_NHAN')} />
              </div>
            </div>

            {/* COLUMN 2: DOANH NGHIỆP */}
            <div>
              <div className="flex items-center gap-3 mb-6 border-b border-gray-100 pb-4">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-700">
                  <Building2 className="w-5 h-5" />
                </div>
                <h3 className="text-xl font-extrabold text-slate-800 uppercase tracking-tight">Doanh Nghiệp (Hộ kinh doanh)</h3>
              </div>
              <div className="flex flex-col gap-4">
                <ServiceListBar icon={<Factory />} title="Đăng ký thành lập hộ kinh doanh" subtitle="Thủ tục hành chính về đăng ký kinh doanh" onClick={() => handleSelectProcedure('HKD_THANH_LAP')} />
                <ServiceListBar icon={<Briefcase />} title="Đăng ký thay đổi chủ hộ kinh doanh" subtitle="Thủ tục hành chính về đăng ký kinh doanh" onClick={() => handleSelectProcedure('HKD_THAY_DOI')} />
                <ServiceListBar icon={<FileText />} title="Cấp lại Giấy chứng nhận đăng ký hộ kinh doanh" subtitle="Thủ tục hành chính về đăng ký kinh doanh" onClick={() => handleSelectProcedure('HKD_CAP_LAI')} />
                <ServiceListBar icon={<Bolt />} title="Chấm dứt hoạt động hộ kinh doanh" subtitle="Thủ tục hành chính về đăng ký kinh doanh" onClick={() => handleSelectProcedure('HKD_CHAM_DUT')} />
              </div>
            </div>

          </div>
        </section>

      </div>
    </CitizenLayout>
  );
}

function ServiceListBar({ icon, title, subtitle, onClick }: { icon: React.ReactNode, title: string, subtitle?: string, onClick?: () => void }) {
  const router = useRouter();
  return (
    <div 
      onClick={onClick || (() => router.push('/services'))} 
      className="bg-white border border-gray-100 rounded-2xl p-4 transition-all cursor-pointer group flex flex-row items-center gap-4 shadow-[0_2px_10px_rgb(0,0,0,0.03)] hover:shadow-[0_8px_20px_rgb(0,0,0,0.06)] hover:border-emerald-200 hover:-translate-y-0.5"
    >
      <div className={`w-12 h-12 bg-emerald-50/70 text-emerald-600 rounded-full flex items-center justify-center transition-transform group-hover:scale-110 [&>svg]:w-5 [&>svg]:h-5 shrink-0`}>
        {icon}
      </div>
      <div className="flex-1">
        <h3 className="font-bold text-slate-800 transition-colors group-hover:text-emerald-700 text-[15px]">{title}</h3>
        {subtitle && <p className="text-xs text-gray-400 mt-0.5 font-medium">{subtitle}</p>}
      </div>
      <div className="w-8 h-8 rounded-full bg-transparent flex items-center justify-center text-gray-300 group-hover:text-emerald-500 transition-colors shrink-0">
        <ArrowRight className="w-4 h-4" />
      </div>
    </div>
  );
}