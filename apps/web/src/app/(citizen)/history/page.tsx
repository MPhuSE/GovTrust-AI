'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CitizenLayout } from '@/components/layout/CitizenLayout';
import { OfficerLayout } from '@/components/layout/OfficerLayout';
import { sessionsApi } from '@/lib/api-client';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton';
import { Clock, FileText, ChevronRight, CheckCircle, AlertCircle, RefreshCw, Trash2 } from 'lucide-react';
import { motion } from 'framer-motion';

interface SessionHistory {
  _id: string;
  procedureId: { code: string; name: string; department: string };
  status: string;
  createdAt: string;
}

// Hồ sơ đã nộp thì không được xóa (phải giữ cho cán bộ xử lý). Còn lại là nháp.
const SUBMITTED_STATUSES = new Set(['CONFIRMED', 'RECHECKED', 'REJECTED']);

const STATUS_MAP: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  INIT: { label: 'Đang soạn thảo', color: 'bg-gray-100 text-gray-700 border-gray-200', icon: <Clock className="w-4 h-4" /> },
  UPLOADING: { label: 'Đang tải lên', color: 'bg-blue-100 text-blue-700 border-blue-200', icon: <RefreshCw className="w-4 h-4" /> },
  AI_PROCESSING: { label: 'AI đang phân tích', color: 'bg-purple-100 text-purple-700 border-purple-200', icon: <RefreshCw className="w-4 h-4 animate-spin" /> },
  SCORED: { label: 'Chờ xác nhận', color: 'bg-amber-100 text-amber-700 border-amber-200', icon: <AlertCircle className="w-4 h-4" /> },
  CONFIRMED: { label: 'Đã nộp thành công', color: 'bg-emerald-100 text-emerald-700 border-emerald-200', icon: <CheckCircle className="w-4 h-4" /> },
  RECHECKED: { label: 'Cán bộ đã tiếp nhận xử lý', color: 'bg-teal-100 text-teal-700 border-teal-200', icon: <CheckCircle className="w-4 h-4" /> },
  REJECTED: { label: 'Bị từ chối', color: 'bg-red-100 text-red-700 border-red-200', icon: <AlertCircle className="w-4 h-4" /> },
};

export default function HistoryPage() {
  const router = useRouter();
  const [sessions, setSessions] = useState<SessionHistory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isOfficer, setIsOfficer] = useState(false);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const userStr = localStorage.getItem('govtrust_user');
      if (userStr) {
        try {
          const user = JSON.parse(userStr);
          if (user.role === 'OFFICER' || user.role === 'ADMIN') {
            setIsOfficer(true);
          }
        } catch (e) {
          // ignore
        }
      }
    }

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

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      await sessionsApi.remove(id);
      setSessions(prev => prev.filter(s => s._id !== id));
    } catch (err) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg || 'Không thể xóa hồ sơ. Vui lòng thử lại.');
    } finally {
      setDeletingId(null);
      setConfirmId(null);
    }
  };

  const Layout = isOfficer ? OfficerLayout : CitizenLayout;

  return (
    <Layout>
      <div className="bg-gray-50 min-h-screen py-8 sm:py-12 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto">
          <div className="mb-8">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900">
              {isOfficer ? 'Lịch sử kiểm duyệt hồ sơ' : 'Lịch sử nộp hồ sơ'}
            </h1>
            <p className="text-gray-500 mt-2 font-medium">
              {isOfficer 
                ? 'Danh sách các hồ sơ thủ tục hành chính mà bạn đã tham gia kiểm duyệt.' 
                : 'Theo dõi trạng thái các thủ tục hành chính bạn đã thực hiện qua hệ thống AI.'}
            </p>
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
            <div className="text-center py-20 bg-white rounded-xl border border-gray-100 shadow-sm">
              <FileText className="w-16 h-16 text-emerald-100 mx-auto mb-4" />
              <h2 className="text-xl font-bold text-gray-900 mb-2">Chưa có hồ sơ nào</h2>
              <p className="text-gray-500 mb-6">
                {isOfficer 
                  ? 'Hiện tại chưa có dữ liệu lịch sử phê duyệt hồ sơ của bạn.' 
                  : 'Bạn chưa nộp hồ sơ hoặc thực hiện thủ tục nào qua hệ thống.'}
              </p>
              {!isOfficer && (
                <button 
                  onClick={() => router.push('/')}
                  className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold py-3 px-8 rounded-full transition-colors shadow-md"
                >
                  Bắt đầu thủ tục mới
                </button>
              )}
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
                      className="hover:shadow-lg transition-all duration-300 cursor-pointer border-gray-100 bg-white rounded-xl overflow-hidden group"
                      onClick={() => router.push(isOfficer ? `/recheck/${session._id}` : `/track/${session._id}`)}
                    >
                      <CardContent className="p-6 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                        <div className="flex items-start gap-4 flex-1">
                          <div className="w-12 h-12 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center shrink-0 group-hover:bg-emerald-100 transition-colors">
                            <FileText className="w-6 h-6 text-emerald-600" />
                          </div>
                          <div>
                            <h3 className="font-bold text-lg text-gray-900 group-hover:text-emerald-700 transition-colors">
                              {session.procedureId?.name || 'Thủ tục không xác định'}
                            </h3>
                            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-1 text-sm text-gray-500">
                              <span className="font-semibold text-gray-700">Mã HS: {session._id.substring(0, 8).toUpperCase()}</span>
                              <span className="hidden sm:inline text-gray-300">•</span>
                              <span>{new Date(session.createdAt).toLocaleDateString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</span>
                              <span className="hidden sm:inline text-gray-300">•</span>
                              <span>{session.procedureId?.department}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end border-t sm:border-t-0 pt-4 sm:pt-0 border-gray-100 mt-2 sm:mt-0">
                          <Badge className={`px-3 py-1.5 flex items-center gap-1.5 rounded-full border ${statusMeta.color}`}>
                            {statusMeta.icon}
                            {statusMeta.label}
                          </Badge>
                          {/* Hồ sơ nháp (chưa nộp) → cho xóa hẳn. Đã nộp thì giữ cho cán bộ xử lý. */}
                          {!isOfficer && !SUBMITTED_STATUSES.has(session.status) && (
                            <button
                              onClick={(e) => { e.stopPropagation(); setConfirmId(session._id); }}
                              disabled={deletingId === session._id}
                              className="p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
                              title="Xóa hồ sơ nháp"
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>
                          )}
                          <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-emerald-600 transition-colors" />
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

      {/* Modal xác nhận xóa hồ sơ nháp */}
      {confirmId && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
          onClick={() => deletingId ? null : setConfirmId(null)}
        >
          <div className="bg-white rounded-xl p-6 max-w-sm w-full shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="w-14 h-14 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-7 h-7 text-red-600" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 text-center mb-2">Xóa hồ sơ nháp?</h3>
            <p className="text-sm text-gray-500 text-center mb-6">
              Hồ sơ chưa nộp này sẽ bị xóa vĩnh viễn cùng toàn bộ giấy tờ đã tải lên. Hành động không thể hoàn tác.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmId(null)}
                disabled={Boolean(deletingId)}
                className="flex-1 px-4 py-2.5 rounded-lg font-bold border-2 border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Hủy
              </button>
              <button
                onClick={() => handleDelete(confirmId)}
                disabled={Boolean(deletingId)}
                className="flex-1 px-4 py-2.5 rounded-lg font-bold bg-red-600 text-white hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {deletingId ? 'Đang xóa...' : 'Xóa hẳn'}
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
