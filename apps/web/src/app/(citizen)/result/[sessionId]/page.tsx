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

// Khớp shape thật do CrossChecker phát ra (aiResult.crossCheck.checks[]).
interface CrossCheckItem {
  ruleName?: string;
  field: string;
  left?: string;             // "checklistId.fieldKey"
  right?: string;
  leftValue?: string | null;
  rightValue?: string | null;
  status: 'MATCH' | 'MISMATCH' | 'MISSING' | 'SKIPPED';
  message?: string;
  legalBasis?: { article: string; note?: string };
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
      checks: CrossCheckItem[];
      summary: { matches: number; mismatches: number; missing: number };
    };
  };
  procedure?: { name: string };
  status?: string;
}

export default function ResultPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const router = useRouter();
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    mismatch: true, // mở sẵn lỗi sai lệch để user thấy ngay; missing/match gập lại cho gọn
  });

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    const fetchSession = () => {
      sessionsApi
        .get(sessionId)
        .then((s) => {
          const sessionData = s as unknown as Session & { status?: string };
          setSession(sessionData);
          
          if (sessionData.status === 'AI_PROCESSING' || sessionData.status === 'UPLOADING') {
            // Keep polling if not done
            timeoutId = setTimeout(fetchSession, 3000);
          } else {
            setIsLoading(false);
          }
        })
        .catch(() => {
          setIsLoading(false);
        });
    };

    fetchSession();

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [sessionId]);

  const toggleSection = (key: string) => {
    setExpandedSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  if (isLoading) {
    return (
      <CitizenLayout>
        <div className="max-w-4xl mx-auto px-4 py-8">
          <LoadingSkeleton variant="score" className="rounded-md" />
          <LoadingSkeleton variant="card" className="mt-6 rounded-md" />
        </div>
      </CitizenLayout>
    );
  }

  if (!session?.aiResult?.score) {
    const isProcessing = session?.status === 'AI_PROCESSING' || session?.status === 'UPLOADING';
    return (
      <CitizenLayout>
        <div className="max-w-3xl mx-auto px-4 py-20 text-center">
          {isProcessing ? (
            <>
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <div className="w-10 h-10 border-4 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
              </div>
              <h2 className="text-xl font-bold text-teal-700 mb-2">Hệ thống đang xử lý</h2>
              <p className="text-gray-500 font-medium mb-8">Vui lòng đợi trong giây lát, AI đang phân tích hồ sơ của bạn...</p>
            </>
          ) : (
            <>
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-3xl">📭</span>
              </div>
              <h2 className="text-xl font-bold text-teal-700 mb-2">Chưa có kết quả kiểm tra</h2>
              <p className="text-gray-500 font-medium mb-8">Vui lòng tải lên giấy tờ để AI phân tích hồ sơ của bạn.</p>
              <button 
                className="px-6 py-3 rounded font-bold bg-teal-700 text-white hover:bg-teal-800 transition-all shadow-md" 
                onClick={() => router.back()}
              >
                Quay lại tải giấy tờ
              </button>
            </>
          )}
        </div>
      </CitizenLayout>
    );
  }

  const { score } = session.aiResult;
  const crossCheck = session.aiResult.crossCheck;
  const lawAlerts = session.aiResult.lawGuardAlerts || [];

  // Group crosscheck results (shape thật: crossCheck.checks[])
  const mismatches = crossCheck?.checks?.filter((r) => r.status === 'MISMATCH') || [];
  const missing = crossCheck?.checks?.filter((r) => r.status === 'MISSING') || [];
  const matches = crossCheck?.checks?.filter((r) => r.status === 'MATCH') || [];

  return (
    <CitizenLayout>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 sm:py-6 animate-fade-in">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm font-semibold text-emerald-700 mb-4 bg-gray-50 w-max px-3 py-1.5 rounded-lg border border-teal-600">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <span>{session.procedure?.name || 'Kiểm tra hồ sơ'}</span>
        </div>

        <h1 className="text-xl sm:text-2xl font-extrabold text-teal-700 mb-1 tracking-tight">Kết Quả Phân Tích AI</h1>
        <p className="text-gray-500 text-sm font-medium mb-4 leading-relaxed max-w-3xl">
          AI đã hoàn tất rà soát chéo giấy tờ của bạn. {score.recommendation}
        </p>

        {/* Progress */}
        <div className="mb-5">
          <Progress steps={CITIZEN_STEPS} currentIndex={2} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-start">
          {/* Left: Score + hành động — sticky để luôn thấy khi cuộn phần chi tiết */}
          <div className="lg:col-span-2 lg:sticky lg:top-6 space-y-4">
            <div className="bg-white rounded-md p-6 border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col items-center relative overflow-hidden">
              {/* Decorative background glow */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-emerald-400/10 rounded-full blur-[60px] pointer-events-none"></div>

              <ScoreCircle
                score={score.score}
                grade={score.grade as 'A' | 'B' | 'C' | 'D'}
              />

              {/* Nút hành động ngay dưới điểm — không cần cuộn xuống cuối trang.
                  canSubmit=false (điểm < 60 hoặc có lỗi nghiêm trọng, gồm sai lệch chéo)
                  → CHẶN sang điền form, buộc quay lại sửa/tải lại giấy tờ đúng. */}
              <div className="w-full mt-6 pt-6 border-t border-gray-100 space-y-3">
                {score.canSubmit ? (
                  <>
                    <button
                      className="w-full px-6 py-3.5 rounded font-bold bg-teal-700 text-white hover:bg-teal-800 transition-all text-center shadow-md flex items-center justify-center gap-2"
                      onClick={() => router.push(`/smartform/${sessionId}`)}
                    >
                      Chuyển sang điền Form →
                    </button>
                    <button
                      className="w-full px-6 py-3 rounded font-bold border-2 border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition-all text-center"
                      onClick={() => router.back()}
                    >
                      Quay lại sửa lỗi
                    </button>
                  </>
                ) : (
                  <>
                    <div className="w-full flex items-start gap-2.5 bg-red-50 border border-red-200 rounded p-3.5 text-sm font-medium text-red-700">
                      <svg className="w-5 h-5 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
                      </svg>
                      <span>Hồ sơ có thông tin chưa hợp lệ nên chưa thể sang bước điền form. Vui lòng sửa các lỗi bên phải hoặc tải lại giấy tờ đúng.</span>
                    </div>
                    <button
                      className="w-full px-6 py-3.5 rounded font-bold bg-teal-700 text-white hover:bg-teal-800 transition-all text-center shadow-md"
                      onClick={() => router.push(`/upload/${sessionId}`)}
                    >
                      Quay lại sửa / tải lại giấy tờ
                    </button>
                    <button
                      className="w-full px-6 py-3 rounded font-bold border-2 border-gray-200 text-gray-400 cursor-not-allowed text-center flex items-center justify-center gap-2"
                      disabled
                      title="Cần khắc phục lỗi trước khi điền form"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                      Điền Form (đang khoá)
                    </button>
                  </>
                )}
              </div>
            </div>

            <div className="px-1">
              <TrustSignal />
            </div>
          </div>

          {/* Right: Details */}
          <div className="lg:col-span-3 space-y-4">
            <div className="bg-white rounded-md p-5 sm:p-6 border border-gray-100 shadow-[0_4px_20px_rgb(0,0,0,0.02)]">
              <h2 className="text-lg font-bold text-teal-700 mb-4 pb-3 border-b border-gray-100">Chi tiết đối soát thông tin</h2>

              {/* Mismatches */}
              {mismatches.length > 0 && (
                <div className="mb-6">
                  <button
                    className="flex items-center justify-between w-full text-left group"
                    onClick={() => toggleSection('mismatch')}
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-red-50 rounded flex items-center justify-center border border-red-100 group-hover:bg-red-100 transition-colors shrink-0">
                        <span className="text-red-500 font-bold">!</span>
                      </div>
                      <div>
                        <p className="font-bold text-teal-700">Sai lệch thông tin</p>
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
                        <div key={i} className="bg-red-50/50 border border-red-100/60 rounded p-4 relative overflow-hidden">
                          <div className="absolute top-0 left-0 w-1 h-full bg-red-400"></div>
                          <p className="text-sm font-bold text-gray-900 mb-3">{item.ruleName || item.field}</p>
                          <div className="space-y-2">
                            {[
                              { source: item.left?.split('.')[0], value: item.leftValue },
                              { source: item.right?.split('.')[0], value: item.rightValue },
                            ].map((v, j) => (
                              <div key={j} className="flex flex-col sm:flex-row sm:justify-between text-sm py-2 border-t border-red-100/50 gap-1 sm:gap-4">
                                <span className="text-gray-500 font-medium shrink-0">Trích xuất từ {v.source || 'giấy tờ'}:</span>
                                <span className={`font-semibold ${j > 0 ? 'text-red-600' : 'text-gray-900 sm:text-right'}`}>{v.value || '(trống)'}</span>
                              </div>
                            ))}
                          </div>
                          {item.legalBasis && (
                            <div className="mt-3 pt-3 border-t border-red-100/50 flex items-start gap-2">
                              <span className="text-base leading-none mt-0.5">⚖️</span>
                              <div className="text-xs">
                                <p className="font-bold text-gray-700">Căn cứ: {item.legalBasis.article}</p>
                                {item.legalBasis.note && (
                                  <p className="text-gray-500 mt-0.5 leading-relaxed">{item.legalBasis.note}</p>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Không đối chiếu được — TRUNG TÍNH (không phải lỗi, không trừ điểm).
                  status MISSING = giấy có nhưng OCR không đọc được đúng field để so
                  (thường vì field đó không in trên giấy). Score engine bỏ qua nên
                  KHÔNG hiển thị như cảnh báo đỏ/vàng gây mâu thuẫn với điểm cao. */}
              {missing.length > 0 && (
                <div className="mb-6">
                  <button
                    className="flex items-center justify-between w-full text-left group"
                    onClick={() => toggleSection('missing')}
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-gray-50 rounded flex items-center justify-center border border-gray-200 group-hover:bg-gray-100 transition-colors shrink-0">
                        <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div>
                        <p className="font-bold text-teal-700">Thông tin không đối chiếu được</p>
                        <p className="text-xs font-semibold text-gray-400 mt-0.5">{missing.length} mục — không ảnh hưởng điểm</p>
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
                      <p className="text-xs text-gray-400 leading-relaxed">
                        Các mục dưới đây không có đủ dữ liệu để đối chiếu chéo (thường do giấy tờ không ghi trường này). Đây không phải lỗi và không làm giảm điểm hồ sơ.
                      </p>
                      {missing.map((item, i) => (
                        <div key={i} className="bg-gray-50 border border-gray-100 rounded p-4 text-sm font-medium text-gray-600 relative overflow-hidden">
                          <div className="absolute top-0 left-0 w-1 h-full bg-gray-300"></div>
                          {item.message || `Không đối chiếu được: ${item.field}`}
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
                      <div className="w-10 h-10 bg-gray-50 rounded flex items-center justify-center border border-teal-600 group-hover:bg-emerald-100 transition-colors shrink-0">
                        <svg className="w-5 h-5 text-teal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <div>
                        <p className="font-bold text-teal-700">Thông tin hợp lệ</p>
                        <p className="text-xs font-semibold text-teal-600 mt-0.5">{matches.length} hạng mục đồng nhất</p>
                      </div>
                    </div>
                    <div className={`w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center transition-transform ${expandedSections.match ? 'rotate-180' : ''}`}>
                      <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </button>
                  {expandedSections.match && (
                    <div className="mt-4 ml-14 bg-gray-50/50 rounded border border-gray-100 p-4 animate-slide-up">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {matches.map((item, i) => (
                          <div key={i} className="text-sm font-medium text-gray-700 flex items-center gap-2">
                            <svg className="w-4 h-4 text-teal-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
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
                      <li key={r.ruleId} className="flex items-start gap-3 bg-gray-50/50 p-3 rounded border border-gray-100">
                        <span className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${SEVERITY_COLORS[r.severity as keyof typeof SEVERITY_COLORS]?.replace('text-', 'bg-') || 'bg-gray-400'}`}></span>
                        <span className="flex-1 text-sm font-medium text-gray-700 leading-relaxed">{r.detail}</span>
                        <span className="text-red-500 font-bold bg-red-50 px-2 py-0.5 rounded text-xs shrink-0 border border-red-100">-{Math.abs(r.impact)}đ</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* LawGuard — chỉ hiện khi còn thiếu giấy tờ: căn cứ pháp lý vì sao bắt buộc */}
            {lawAlerts.length > 0 && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Căn cứ pháp lý cho giấy tờ còn thiếu</h3>
                  <p className="text-xs text-gray-400 mt-1">Quy định yêu cầu các giấy tờ bạn cần bổ sung.</p>
                </div>
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
                      className={`rounded-md p-5 border text-sm relative overflow-hidden ${
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

            <div className="pt-1">
              <Disclaimer />
            </div>
          </div>
        </div>
      </div>
    </CitizenLayout>
  );
}
