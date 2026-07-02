'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CitizenLayout } from '@/components/layout/CitizenLayout';
import { sessionsApi } from '@/lib/api-client';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton';
import { Clock, FileText, ChevronRight, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';

interface SessionHistory {
  _id: string;
  procedureId: { code: string; name: string; department: string };
  status: string;
  createdAt: string;
}

const STATUS_MAP: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  INIT: { label: 'Đang soạn thảo', color: 'bg-gray-100 text-gray-700 border-gray-200', icon: <Clock className="w-4 h-4" /> },
  UPLOADING: { label: 'Đang tải lên', color: 'bg-blue-100 text-blue-700 border-blue-200', icon: <RefreshCw className="w-4 h-4" /> },
  ANALYZING: { label: 'AI đang phân tích', color: 'bg-purple-100 text-purple-700 border-purple-200', icon: <RefreshCw className="w-4 h-4 animate-spin" /> },
  WAITING_CONFIRM: { label: 'Chờ xác nhận', color: 'bg-amber-100 text-amber-700 border-amber-200', icon: <AlertCircle className="w-4 h-4" /> },
  CONFIRMED: { label: 'Đã nộp thành công', color: 'bg-emerald-100 text-emerald-700 border-teal-600', icon: <CheckCircle className="w-4 h-4" /> },
  REJECTED: { label: 'Bị từ chối', color: 'bg-red-100 text-red-700 border-red-200', icon: <AlertCircle className="w-4 h-4" /> },
};

export default function HistoryPage() {
  const router = useRouter();
  const [sessions, setSessions] = useState<SessionHistory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    sessionsApi.history()
      .then(res => setSessions((res as unknown) as SessionHistory[]))
      .catch(err => {
        if (err.response?.status === 401) {
          router.push('/login');
        } else {
          setError('Không thể tải lịch sử hồ sơ. Vui lòng thử lại sau.');
        }
      })
      .finally(() => setIsLoading(false));
  }, [router]);

  return (
    <CitizenLayout>
      <div className="bg-ivory min-h-screen py-12 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-extrabold text-navy">Lịch sử nộp hồ sơ</h1>
            <p className="text-navy/60 mt-2 font-medium">Theo dõi trạng thái các thủ tục hành chính bạn đã thực hiện qua hệ thống AI.</p>
          </div>

          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => <LoadingSkeleton key={i} variant="card" className="h-32 rounded-md" />)}
            </div>
          ) : error ? (
            <div className="bg-red-50 border border-red-100 text-red-600 p-4 rounded text-center font-medium">
              {error}
            </div>
          ) : sessions.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-md border border-navy/5 shadow-sm">
              <FileText className="w-16 h-16 text-navy/20 mx-auto mb-4" />
              <h2 className="text-xl font-bold text-navy mb-2">Chưa có hồ sơ nào</h2>
              <p className="text-navy/60 mb-6">Bạn chưa nộp hồ sơ hoặc thực hiện thủ tục nào qua hệ thống.</p>
              <button 
                onClick={() => router.push('/')}
                className="bg-navy hover:bg-navy-700 text-white font-bold py-3 px-8 rounded transition-colors shadow-md"
              >
                Bắt đầu thủ tục mới
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {sessions.map((session, i) => {
                const statusMeta = STATUS_MAP[session.status] || STATUS_MAP.INIT;
                return (
                  <motion.div
                    key={session._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                  >
                    <Card 
                      className="hover:shadow-md transition-all duration-300 cursor-pointer border-navy/5 bg-white/80 -sm group"
                      onClick={() => router.push(`/result/${session._id}`)}
                    >
                      <CardContent className="p-6 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                        <div className="flex items-start gap-4 flex-1">
                          <div className="w-12 h-12 rounded bg-teal-50 border border-teal-100 flex items-center justify-center shrink-0">
                            <FileText className="w-6 h-6 text-teal-600" />
                          </div>
                          <div>
                            <h3 className="font-bold text-lg text-navy group-hover:text-teal-700 transition-colors">
                              {session.procedureId?.name || 'Thủ tục không xác định'}
                            </h3>
                            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-1 text-sm text-navy/60">
                              <span className="font-medium">Mã hồ sơ: {session._id.substring(0, 8).toUpperCase()}</span>
                              <span className="hidden sm:inline">•</span>
                              <span>{new Date(session.createdAt).toLocaleDateString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</span>
                              <span className="hidden sm:inline">•</span>
                              <span>{session.procedureId?.department}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end border-t sm:border-t-0 pt-4 sm:pt-0 border-gray-100 mt-2 sm:mt-0">
                          <Badge className={`px-3 py-1.5 flex items-center gap-1.5 rounded-lg border ${statusMeta.color}`}>
                            {statusMeta.icon}
                            {statusMeta.label}
                          </Badge>
                          <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-teal-600 transition-colors" />
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </CitizenLayout>
  );
}
