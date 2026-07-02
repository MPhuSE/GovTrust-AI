'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Sparkles, Camera, CheckCircle, FileText, ChevronRight, FileDigit, ShieldCheck } from 'lucide-react';
import { proceduresApi, sessionsApi } from '@/lib/api-client';
import { CitizenLayout } from '@/components/layout/CitizenLayout';
import { Disclaimer } from '@/components/ui/Disclaimer';
import { TrustSignal } from '@/components/ui/TrustSignal';
import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';

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
      .catch(() => {})
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
    'Đăng ký khai sinh',
    'Cấp đổi CCCD',
    'Đăng ký tạm trú',
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.4 } }
  };

  return (
    <CitizenLayout>
      <div className="bg-ivory min-h-screen pb-12 relative overflow-hidden">
        {/* Subtle Background Gradients */}
        <div className="absolute inset-0 z-0 pointer-events-none opacity-20">
          <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-teal-500 blur-[150px]"></div>
          <div className="absolute top-80 -left-40 w-80 h-80 rounded-full bg-navy-500 blur-[150px]"></div>
        </div>

        <motion.section 
          initial="hidden" animate="show" variants={containerVariants}
          className="relative z-10 pt-24 pb-16 sm:pt-32 sm:pb-24 max-w-5xl mx-auto px-4 text-center"
        >
          {/* Status Badge */}
          <motion.div variants={itemVariants} className="mb-8 flex justify-center">
            <Badge variant="outline" className="px-4 py-1.5 text-navy bg-white/50 backdrop-blur-md shadow-sm border-navy/10 flex items-center gap-2 text-sm font-medium">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-teal-500"></span>
              </span>
              Hệ thống AI đang hoạt động ổn định
            </Badge>
          </motion.div>

          <motion.h1 variants={itemVariants} className="text-4xl sm:text-6xl lg:text-7xl font-extrabold mb-6 text-navy tracking-tight leading-[1.1]">
            Niềm tin từ sự <br className="hidden sm:block" />
            <span className="text-teal-600">Minh bạch.</span>
          </motion.h1>
          
          <motion.p variants={itemVariants} className="text-navy/70 text-lg sm:text-xl mb-12 max-w-2xl mx-auto font-medium leading-relaxed">
            Trợ lý AI tự động trích xuất giấy tờ, phát hiện lỗi và hoàn thiện hồ sơ của bạn với độ chính xác tuyệt đối. 
            Chuẩn bị hồ sơ hoàn hảo trước khi đến cửa công.
          </motion.p>

          <motion.div variants={itemVariants} className="max-w-3xl mx-auto">
            <div className="bg-white/70 backdrop-blur-xl border border-navy/10 rounded-2xl p-2.5 shadow-[0_8px_30px_rgba(8,36,65,0.06)] flex flex-col sm:flex-row gap-2 transition-all duration-300 focus-within:bg-white focus-within:shadow-[0_8px_40px_rgba(13,122,145,0.1)] focus-within:border-teal-200">
              <div className="flex-1 relative flex items-center">
                <div className="absolute left-4 w-8 h-8 rounded-full bg-teal-50 flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-teal-600" />
                </div>
                <input
                  type="text"
                  className="w-full bg-transparent pl-14 pr-6 py-4 text-lg text-navy placeholder-navy/40 rounded-xl focus:outline-none"
                  placeholder="Bạn cần làm thủ tục gì hôm nay?"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleStart()}
                />
              </div>
              <Button 
                onClick={handleStart} 
                disabled={isLoading || !query.trim()}
                className="h-auto py-4 px-8 rounded-xl text-base font-semibold w-full sm:w-auto"
              >
                {isLoading ? (
                  <svg className="w-5 h-5 animate-spin text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                ) : (
                  <>Bắt đầu <ChevronRight className="w-5 h-5 ml-1 opacity-70" /></>
                )}
              </Button>
            </div>

            {error && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-4 bg-red-50 border border-red-100 rounded-xl p-3 text-red-600 text-sm flex items-center justify-center gap-2">
                <span className="w-5 h-5 rounded-full bg-red-100 flex items-center justify-center">❌</span> 
                {error}
              </motion.div>
            )}

            <div className="flex flex-wrap gap-2 mt-6 justify-center items-center">
              <span className="text-navy/50 text-sm font-medium mr-2">Gợi ý nổi bật:</span>
              {quickSuggestions.map((s) => (
                <button
                  key={s}
                  className="bg-white/50 backdrop-blur-sm hover:bg-white text-navy/70 text-sm font-medium px-4 py-1.5 rounded-full border border-navy/10 hover:border-teal-200 hover:text-teal-700 shadow-sm transition-all duration-200"
                  onClick={() => setQuery(s)}
                >
                  {s}
                </button>
              ))}
            </div>
          </motion.div>
        </motion.section>

        <section className="max-w-6xl mx-auto px-4 sm:px-6 py-12 relative z-10">
          <motion.div 
            initial="hidden" whileInView="show" viewport={{ once: true }} variants={containerVariants}
            className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16"
          >
            {[
              {
                icon: <Camera className="w-6 h-6 text-navy" />,
                title: 'Số hóa tức thì',
                desc: 'AI tự động nhận diện và bóc tách dữ liệu từ ảnh chụp giấy tờ.',
              },
              {
                icon: <ShieldCheck className="w-6 h-6 text-teal-600" />,
                title: 'Kiểm tra chéo',
                desc: 'Phát hiện ngay lập tức các sai lệch thông tin giữa các giấy tờ.',
              },
              {
                icon: <FileText className="w-6 h-6 text-gold" />,
                title: 'Tự động biểu mẫu',
                desc: 'Hệ thống tự điền biểu mẫu, bạn chỉ việc kiểm tra lại.',
              },
            ].map((f, i) => (
              <Card key={i} className="hover:shadow-lg transition-shadow bg-white/60">
                <CardContent className="p-8">
                  <div className="w-14 h-14 rounded-2xl bg-white border border-navy/5 flex items-center justify-center mb-6 shadow-sm">
                    {f.icon}
                  </div>
                  <h3 className="text-xl font-bold text-navy mb-3">{f.title}</h3>
                  <p className="text-navy/60 leading-relaxed text-sm">{f.desc}</p>
                </CardContent>
              </Card>
            ))}
          </motion.div>

          <Card className="p-8 sm:p-10 border-navy/10 bg-white/80">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
              <div>
                <h2 className="text-2xl font-bold text-navy">Danh mục thủ tục hỗ trợ AI</h2>
                <p className="text-navy/60 mt-2">Chọn trực tiếp thủ tục để tiến hành tải giấy tờ và tiền kiểm</p>
              </div>
              <div className="w-12 h-12 bg-teal-50 rounded-2xl flex items-center justify-center border border-teal-100">
                <FileDigit className="w-6 h-6 text-teal-600" />
              </div>
            </div>

            {loadingProcedures ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {[1, 2, 3, 4].map((i) => (
                  <LoadingSkeleton key={i} variant="card" className="rounded-2xl" />
                ))}
              </div>
            ) : procedures.length > 0 ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {procedures.map((p) => (
                  <button
                    key={p._id}
                    onClick={() => handleSelectProcedure(p._id)}
                    disabled={isLoading}
                    className="text-left p-6 rounded-2xl border border-navy/5 bg-ivory/30 hover:bg-white hover:border-teal-200 hover:shadow-md transition-all duration-300 flex items-center gap-5 group"
                  >
                    <div className="w-12 h-12 bg-white border border-navy/5 rounded-xl flex items-center justify-center shrink-0 group-hover:border-teal-100 group-hover:bg-teal-50 transition-colors">
                      <FileText className="w-5 h-5 text-navy/40 group-hover:text-teal-600 transition-colors" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-navy text-lg truncate group-hover:text-teal-700 transition-colors">{p.name}</p>
                      {p.description ? (
                        <p className="text-sm text-navy/50 truncate mt-1">{p.description}</p>
                      ) : (
                        <Badge variant="secondary" className="mt-2 text-xs font-mono">{p.code}</Badge>
                      )}
                    </div>
                    <ChevronRight className="w-5 h-5 text-navy/20 group-hover:text-teal-500 transition-colors shrink-0 -translate-x-2 group-hover:translate-x-0" />
                  </button>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 px-4 bg-navy/5 rounded-2xl border border-navy/10">
                <FileDigit className="w-10 h-10 text-navy/20 mx-auto mb-4" />
                <p className="text-navy text-lg font-bold">Chưa có dữ liệu thủ tục</p>
                <p className="text-navy/50 mt-1">Sử dụng ô tìm kiếm phía trên để tra cứu.</p>
              </div>
            )}
          </Card>

          <div className="mt-16 max-w-4xl mx-auto space-y-6">
            <TrustSignal />
            <Disclaimer />
          </div>
        </section>
      </div>
    </CitizenLayout>
  );
}
