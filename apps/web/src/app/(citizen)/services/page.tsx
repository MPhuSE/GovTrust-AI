'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { CitizenLayout } from '@/components/layout/CitizenLayout';
import { proceduresApi, sessionsApi } from '@/lib/api-client';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton';
import { FileDigit, FileText, ChevronRight, Search, Building2, Clock, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';

interface Procedure {
  _id: string;
  code: string;
  name: string;
  description?: string;
  department?: string;
  priorityConfig?: { slaDays: number };
}

export default function ServicesPage() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [procedures, setProcedures] = useState<Procedure[]>([]);
  const [filteredProcedures, setFilteredProcedures] = useState<Procedure[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [startingId, setStartingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    proceduresApi.list()
      .then(res => {
        const data = (res as unknown) as Procedure[];
        setProcedures(data);
        setFilteredProcedures(data);
      })
      .catch(() => setError('Không thể tải danh sách thủ tục. Vui lòng thử lại sau.'))
      .finally(() => setIsLoading(false));
  }, []);

  useEffect(() => {
    if (!query) {
      setFilteredProcedures(procedures);
      return;
    }
    const lowerQ = query.toLowerCase();
    const filtered = procedures.filter(p => 
      p.name.toLowerCase().includes(lowerQ) || 
      p.code.toLowerCase().includes(lowerQ) ||
      (p.department && p.department.toLowerCase().includes(lowerQ))
    );
    setFilteredProcedures(filtered);
  }, [query, procedures]);

  const handleStart = async (procedureId: string) => {
    setStartingId(procedureId);
    setError(null);
    try {
      const session = (await sessionsApi.create(procedureId)) as unknown as { _id: string };
      router.push(`/upload/${session._id}`);
    } catch (e) {
      setError((e as Error).message);
      setStartingId(null);
    }
  };

  return (
    <CitizenLayout>
      <div className="bg-ivory min-h-screen py-12 px-4 sm:px-6 relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-teal-500/5 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-navy-500/5 rounded-full blur-[100px] pointer-events-none" />

        <div className="max-w-6xl mx-auto relative z-10">
          <div className="text-center mb-12">
            <Badge variant="outline" className="mb-4 bg-teal-50 text-teal-700 border-teal-200">
              <CheckCircle className="w-3 h-3 mr-1" /> Cổng dịch vụ công trực tuyến
            </Badge>
            <h1 className="text-4xl font-extrabold text-navy mb-4">Danh mục thủ tục hành chính</h1>
            <p className="text-navy/60 max-w-2xl mx-auto font-medium text-lg">
              Tìm kiếm và nộp hồ sơ trực tuyến dễ dàng với sự trợ giúp của AI. Quy trình được tự động hóa, minh bạch và tiết kiệm thời gian.
            </p>
          </div>

          <div className="bg-white rounded-md p-4 sm:p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-navy/5 mb-8 flex flex-col sm:flex-row gap-4 items-center focus-within:ring-2 focus-within:ring-teal-500/20 focus-within:border-teal-300 transition-all">
            <div className="w-10 h-10 rounded-full bg-teal-50 flex items-center justify-center shrink-0">
              <Search className="w-5 h-5 text-teal-600" />
            </div>
            <input
              type="text"
              placeholder="Nhập tên thủ tục, mã số hoặc cơ quan thực hiện..."
              className="flex-1 bg-transparent text-lg font-medium outline-none text-navy placeholder:text-navy/30 w-full"
              value={query}
              onChange={e => setQuery(e.target.value)}
            />
            <div className="hidden sm:block text-sm font-semibold text-navy/40 px-4 border-l border-gray-100">
              {filteredProcedures.length} kết quả
            </div>
          </div>

          {error && (
            <div className="mb-8 bg-red-50 border border-red-100 text-red-600 p-4 rounded text-center font-medium flex items-center justify-center gap-2">
              <AlertCircle className="w-5 h-5" /> {error}
            </div>
          )}

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[1, 2, 3, 4, 5, 6].map(i => <LoadingSkeleton key={i} variant="card" className="h-48 rounded-md" />)}
            </div>
          ) : filteredProcedures.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-md border border-navy/5 shadow-sm">
              <FileDigit className="w-16 h-16 text-navy/20 mx-auto mb-4" />
              <h2 className="text-xl font-bold text-navy mb-2">Không tìm thấy thủ tục</h2>
              <p className="text-navy/60 mb-6">Thử thay đổi từ khóa tìm kiếm của bạn.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredProcedures.map((p, i) => (
                <motion.div
                  key={p._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <Card className="h-full hover:shadow-xl hover:shadow-teal-900/5 transition-all duration-300 border-navy/5 bg-white/90 group flex flex-col">
                    <CardContent className="p-6 flex-1 flex flex-col">
                      <div className="flex justify-between items-start mb-4">
                        <div className="w-12 h-12 rounded bg-gradient-to-br from-teal-50 to-emerald-50 flex items-center justify-center border border-teal-100/50 group-hover:scale-110 transition-transform duration-300 shadow-sm">
                          <FileText className="w-6 h-6 text-teal-600" />
                        </div>
                        <Badge variant="outline" className="font-mono text-xs text-navy/50 bg-ivory">{p.code}</Badge>
                      </div>
                      
                      <h3 className="font-bold text-xl text-navy group-hover:text-teal-700 transition-colors mb-2 leading-snug">
                        {p.name}
                      </h3>
                      
                      <p className="text-navy/60 text-sm mb-6 flex-1 line-clamp-3">
                        {p.description || 'Chưa có mô tả chi tiết cho thủ tục này.'}
                      </p>
                      
                      <div className="flex flex-col gap-3 mt-auto pt-4 border-t border-gray-100">
                        {p.department && (
                          <div className="flex items-center gap-2 text-sm text-navy/70">
                            <Building2 className="w-4 h-4 text-navy/40" />
                            <span className="truncate">{p.department}</span>
                          </div>
                        )}
                        {p.priorityConfig?.slaDays && (
                          <div className="flex items-center gap-2 text-sm text-navy/70">
                            <Clock className="w-4 h-4 text-navy/40" />
                            <span>Thời gian xử lý: {p.priorityConfig.slaDays} ngày</span>
                          </div>
                        )}
                        
                        <button
                          onClick={() => handleStart(p._id)}
                          disabled={startingId === p._id}
                          className="mt-2 w-full py-3 rounded bg-navy hover:bg-navy-800 text-white font-bold text-sm transition-all shadow-md flex items-center justify-center gap-2 group/btn disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                          {startingId === p._id ? (
                            <><RefreshCw className="w-4 h-4 animate-spin" /> Đang khởi tạo...</>
                          ) : (
                            <>Bắt đầu nộp hồ sơ <ChevronRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" /></>
                          )}
                        </button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </CitizenLayout>
  );
}
