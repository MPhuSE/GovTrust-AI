'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { sessionsApi } from '@/lib/api-client';
import { ScoreCircle } from '@/components/ui/ScoreCircle';
import { LawCitation } from '@/components/ui/LawCitation';
import { Disclaimer } from '@/components/ui/Disclaimer';
import { TrustSignal } from '@/components/ui/TrustSignal';
import { Progress } from '@/components/ui/Progress';
import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton';
import { CitizenLayout } from '@/components/layout/CitizenLayout';
import { SEVERITY_COLORS } from '@/lib/constants';

const CITIZEN_STEPS = ['Chọn thủ tục', 'Tải giấy tờ', 'Kết quả', 'Xác nhận TT', 'Hoàn tất'];

interface CrossCheckItem {
  field: string;
  status: 'MATCH' | 'MISMATCH' | 'MISSING';
  values?: { source: string; value: string }[];
  detail?: string;
}

interface ScoreBreakdownItem {
  ruleId: string;
  detail: string;
  impact: number;
  severity: string;
}

interface LawGuardAlert {
  type: string;
  message: string;
  confidence: number;
  legalSource?: { title: string; article: string; url?: string };
  needsVerification?: boolean;
}

interface Session {
  aiResult?: {
    score?: {
      score: number;
      grade: string;
      breakdown: ScoreBreakdownItem[];
      canSubmit: boolean;
      recommendation: string;
    };
    lawGuardAlerts?: LawGuardAlert[];
    crossCheck?: {
      results: CrossCheckItem[];
      summary: { matches: number; mismatches: number; missing: number };
    };
  };
  procedure?: { name: string };
}

export default function ResultPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const router = useRouter();
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    crosscheck: true,
  });

  useEffect(() => {
    sessionsApi
      .get(sessionId)
      .then((s) => {
        setSession(s as Session);
        setIsLoading(false);
      })
      .catch(() => setIsLoading(false));
  }, [sessionId]);

  const toggleSection = (key: string) => {
    setExpandedSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  if (isLoading) {
    return (
      <CitizenLayout>
        <div className="max-w-4xl mx-auto px-4 py-8">
          <LoadingSkeleton variant="score" className="rounded-2xl" />
          <LoadingSkeleton variant="card" className="mt-6 rounded-2xl" />
        </div>
      </CitizenLayout>
    );
  }

  if (!session?.aiResult?.score) {
    return (
      <CitizenLayout>
        <div className="max-w-3xl mx-auto px-4 py-20 text-center">
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-3xl">📭</span>
          </div>
          <h2 className="text-xl font-bold text-[#0A192F] mb-2">Chưa có kết quả kiểm tra</h2>
          <p className="text-gray-500 font-medium mb-8">Vui lòng tải lên giấy tờ để AI phân tích hồ sơ của bạn.</p>
          <button 
            className="px-6 py-3 rounded-xl font-bold bg-[#0A192F] text-white hover:bg-[#112240] transition-all shadow-md" 
            onClick={() => router.back()}
          >
            Quay lại tải giấy tờ
          </button>
        </div>
      </CitizenLayout>
    );
  }

  const { score } = session.aiResult;
  const crossCheck = session.aiResult.crossCheck;
  const lawAlerts = session.aiResult.lawGuardAlerts || [];

  // Group crosscheck results
  const mismatches = crossCheck?.results?.filter((r) => r.status === 'MISMATCH') || [];
  const missing = crossCheck?.results?.filter((r) => r.status === 'MISSING') || [];
  const matches = crossCheck?.results?.filter((r) => r.status === 'MATCH') || [];

  return (
    <CitizenLayout>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-10 animate-fade-in">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm font-semibold text-emerald-700 mb-6 bg-emerald-50 w-max px-3 py-1.5 rounded-lg border border-emerald-100">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <span>{session.procedure?.name || 'Kiểm tra hồ sơ'}</span>
        </div>

        <h1 className="text-3xl sm:text-4xl font-extrabold text-[#0A192F] mb-3 tracking-tight">Kết Quả Phân Tích AI</h1>
        <p className="text-gray-500 text-base font-medium mb-8 leading-relaxed max-w-3xl">
          Hệ thống trí tuệ nhân tạo đã hoàn tất việc rà soát chéo các loại giấy tờ của bạn. {score.recommendation}
        </p>

        {/* Progress */}
        <div className="mb-10">
          <Progress steps={CITIZEN_STEPS} currentIndex={2} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* Left: Score */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-[2rem] p-8 border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col items-center relative overflow-hidden">
              {/* Decorative background glow */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-emerald-400/10 rounded-full blur-[60px] pointer-events-none"></div>
              
              <ScoreCircle
                score={score.score}
                grade={score.grade as 'A' | 'B' | 'C' | 'D'}
              />
            </div>

            {/* Continue section */}
            <div className="bg-white rounded-2xl p-6 sm:p-8 border border-gray-100 shadow-[0_4px_20px_rgb(0,0,0,0.02)] relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500"></div>
              <h3 className="font-bold text-[#0A192F] text-lg mb-3">Chuyển sang bước tiếp theo</h3>
              <p className="text-sm font-medium text-gray-500 mb-6 leading-relaxed">
                Hệ thống đã chuẩn bị sẵn biểu mẫu điện tử và tự động điền các thông tin hợp lệ từ giấy tờ của bạn.
              </p>
              <button
                className="w-full px-6 py-4 rounded-xl font-bold bg-[#0A192F] text-white hover:bg-[#112240] transition-all shadow-md flex items-center justify-center gap-2"
                onClick={() => router.push(`/smartform/${sessionId}`)}
              >
                Tiếp tục xem Form tự điền →
              </button>
              <div className="mt-6 pt-6 border-t border-gray-50">
                <TrustSignal />
              </div>
            </div>
          </div>

          {/* Right: Details */}
          <div className="lg:col-span-3 space-y-6">
            <div className="bg-white rounded-2xl p-6 sm:p-8 border border-gray-100 shadow-[0_4px_20px_rgb(0,0,0,0.02)]">
              <h2 className="text-xl font-bold text-[#0A192F] mb-6 pb-4 border-b border-gray-100">Chi tiết đối soát thông tin</h2>

              {/* Mismatches */}
              {mismatches.length > 0 && (
                <div className="mb-6">
                  <button
                    className="flex items-center justify-between w-full text-left group"
                    onClick={() => toggleSection('mismatch')}
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center border border-red-100 group-hover:bg-red-100 transition-colors shrink-0">
                        <span className="text-red-500 font-bold">!</span>
                      </div>
                      <div>
                        <p className="font-bold text-[#0A192F]">Sai lệch thông tin</p>
                        <p className="text-xs font-semibold text-red-600 mt-0.5">{mismatches.length} lỗi cần khắc phục</p>
                      </div>
                    </div>
                    <div className={`w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center transition-transform ${expandedSections.mismatch ? 'rotate-180' : ''}`}>
                      <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </button>
                  {expandedSections.mismatch && (
                    <div className="mt-4 ml-14 space-y-3 animate-slide-up">
                      {mismatches.map((item, i) => (
                        <div key={i} className="bg-red-50/50 border border-red-100/60 rounded-xl p-4 relative overflow-hidden">
                          <div className="absolute top-0 left-0 w-1 h-full bg-red-400"></div>
                          <p className="text-sm font-bold text-gray-900 mb-3">{item.detail || item.field}</p>
                          <div className="space-y-2">
                            {item.values?.map((v, j) => (
                              <div key={j} className="flex flex-col sm:flex-row sm:justify-between text-sm py-2 border-t border-red-100/50 gap-1 sm:gap-4">
                                <span className="text-gray-500 font-medium shrink-0">Trích xuất từ {v.source}:</span>
                                <span className={`font-semibold ${j > 0 ? 'text-red-600' : 'text-gray-900 sm:text-right'}`}>{v.value}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Missing */}
              {missing.length > 0 && (
                <div className="mb-6">
                  <button
                    className="flex items-center justify-between w-full text-left group"
                    onClick={() => toggleSection('missing')}
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center border border-amber-100 group-hover:bg-amber-100 transition-colors shrink-0">
                        <span className="text-amber-500 text-lg">⚠️</span>
                      </div>
                      <div>
                        <p className="font-bold text-[#0A192F]">Thiếu thông tin hoặc giấy tờ</p>
                        <p className="text-xs font-semibold text-amber-600 mt-0.5">{missing.length} cảnh báo</p>
                      </div>
                    </div>
                    <div className={`w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center transition-transform ${expandedSections.missing ? 'rotate-180' : ''}`}>
                      <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </button>
                  {expandedSections.missing && (
                    <div className="mt-4 ml-14 space-y-3 animate-slide-up">
                      {missing.map((item, i) => (
                        <div key={i} className="bg-amber-50/50 border border-amber-100/60 rounded-xl p-4 text-sm font-medium text-amber-800 relative overflow-hidden">
                          <div className="absolute top-0 left-0 w-1 h-full bg-amber-400"></div>
                          {item.detail || `Cần bổ sung: ${item.field}`}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Matches */}
              {matches.length > 0 && (
                <div className="mb-2">
                  <button
                    className="flex items-center justify-between w-full text-left group"
                    onClick={() => toggleSection('match')}
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center border border-emerald-100 group-hover:bg-emerald-100 transition-colors shrink-0">
                        <svg className="w-5 h-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <div>
                        <p className="font-bold text-[#0A192F]">Thông tin hợp lệ</p>
                        <p className="text-xs font-semibold text-emerald-600 mt-0.5">{matches.length} hạng mục đồng nhất</p>
                      </div>
                    </div>
                    <div className={`w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center transition-transform ${expandedSections.match ? 'rotate-180' : ''}`}>
                      <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </button>
                  {expandedSections.match && (
                    <div className="mt-4 ml-14 bg-gray-50/50 rounded-xl border border-gray-100 p-4 animate-slide-up">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {matches.map((item, i) => (
                          <div key={i} className="text-sm font-medium text-gray-700 flex items-center gap-2">
                            <svg className="w-4 h-4 text-emerald-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                            <span className="truncate">{item.field}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Score breakdown */}
              {score.breakdown && score.breakdown.length > 0 && (
                <div className="border-t border-gray-100 pt-6 mt-6">
                  <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">Chi tiết điểm trừ</h3>
                  <ul className="space-y-3">
                    {score.breakdown.map((r) => (
                      <li key={r.ruleId} className="flex items-start gap-3 bg-gray-50/50 p-3 rounded-xl border border-gray-100">
                        <span className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${SEVERITY_COLORS[r.severity as keyof typeof SEVERITY_COLORS]?.replace('text-', 'bg-') || 'bg-gray-400'}`}></span>
                        <span className="flex-1 text-sm font-medium text-gray-700 leading-relaxed">{r.detail}</span>
                        <span className="text-red-500 font-bold bg-red-50 px-2 py-0.5 rounded text-xs shrink-0 border border-red-100">-{r.impact}đ</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* LawGuard */}
            {lawAlerts.length > 0 && (
              <div className="space-y-4">
                {lawAlerts.map((alert, i) =>
                  alert.legalSource ? (
                    <LawCitation
                      key={i}
                      source={alert.legalSource}
                      confidence={alert.confidence}
                      content={alert.message}
                    />
                  ) : (
                    <div
                      key={i}
                      className={`rounded-2xl p-5 border text-sm relative overflow-hidden ${
                        alert.type === 'WARNING' 
                          ? 'bg-amber-50/50 border-amber-200/60 text-amber-900' 
                          : 'bg-cyan-50/50 border-cyan-200/60 text-cyan-900'
                      }`}
                    >
                      <div className={`absolute top-0 left-0 w-1 h-full ${alert.type === 'WARNING' ? 'bg-amber-400' : 'bg-cyan-400'}`}></div>
                      <p className="font-bold mb-2 leading-relaxed">{alert.message}</p>
                      <div className="flex items-center gap-2 mt-3">
                        <div className="h-1.5 w-16 bg-white/50 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full ${alert.type === 'WARNING' ? 'bg-amber-500' : 'bg-cyan-500'}`} style={{ width: `${alert.confidence * 100}%` }}></div>
                        </div>
                        <p className="text-xs font-semibold opacity-60">Độ tin cậy AI: {Math.round(alert.confidence * 100)}%</p>
                      </div>
                    </div>
                  ),
                )}
              </div>
            )}

            <div className="pt-4">
              <Disclaimer />
            </div>
          </div>
        </div>

        {/* Bottom actions */}
        <div className="mt-10 flex flex-col sm:flex-row gap-4 border-t border-gray-100 pt-8">
          <button 
            className="px-6 py-4 rounded-xl font-bold border-2 border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition-all flex-1 text-center" 
            onClick={() => router.back()}
          >
            Quay lại sửa lỗi
          </button>
          <button
            className="px-6 py-4 rounded-xl font-bold bg-[#0A192F] text-white hover:bg-[#112240] transition-all flex-[2] text-center shadow-md flex items-center justify-center gap-2"
            onClick={() => router.push(`/smartform/${sessionId}`)}
          >
            Chuyển sang điền Form →
          </button>
        </div>
      </div>
    </CitizenLayout>
  );
}
