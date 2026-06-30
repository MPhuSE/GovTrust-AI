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
        <div className="max-w-3xl mx-auto px-4 py-8">
          <LoadingSkeleton variant="score" />
          <LoadingSkeleton variant="card" className="mt-6" />
        </div>
      </CitizenLayout>
    );
  }

  if (!session?.aiResult?.score) {
    return (
      <CitizenLayout>
        <div className="max-w-3xl mx-auto px-4 py-20 text-center">
          <p className="text-gray-500">Chưa có kết quả kiểm tra. Vui lòng quay lại và tải lên giấy tờ.</p>
          <button className="btn-primary mt-4" onClick={() => router.back()}>
            Quay lại
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
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-8 animate-fade-in">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <span>{session.procedure?.name || 'Kiểm tra hồ sơ'}</span>
        </div>

        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Kết Quả Kiểm Tra</h1>
        <p className="text-gray-500 text-sm mb-6">
          Hệ thống AI đã phân tích hồ sơ của bạn. {score.recommendation}
        </p>

        {/* Progress */}
        <div className="mb-8">
          <Progress steps={CITIZEN_STEPS} currentIndex={2} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Left: Score */}
          <div className="lg:col-span-2 space-y-4">
            <div className="card flex flex-col items-center py-8">
              <ScoreCircle
                score={score.score}
                grade={score.grade as 'A' | 'B' | 'C' | 'D'}
              />
            </div>

            {/* Continue section */}
            <div className="card">
              <h3 className="font-semibold text-gray-900 mb-2">Tiếp tục xử lý</h3>
              <p className="text-sm text-gray-500 mb-4">
                Hệ thống đã chuẩn bị sẵn biểu mẫu điền tự động dựa trên thông tin đúng.
              </p>
              <button
                className="btn-primary w-full"
                onClick={() => router.push(`/smartform/${sessionId}`)}
              >
                XEM FORM TỰ ĐIỀN →
              </button>
              <div className="mt-3">
                <TrustSignal />
              </div>
            </div>
          </div>

          {/* Right: Details */}
          <div className="lg:col-span-3 space-y-4">
            <div className="card">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Chi tiết đánh giá</h2>

              {/* Mismatches */}
              {mismatches.length > 0 && (
                <div className="mb-4">
                  <button
                    className="flex items-center justify-between w-full text-left"
                    onClick={() => toggleSection('mismatch')}
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                        <span className="text-red-600 text-sm">❌</span>
                      </span>
                      <div>
                        <p className="font-medium text-gray-900 text-sm">Sai lệch thông tin</p>
                        <p className="text-xs text-gray-500">{mismatches.length} lỗi nghiêm trọng</p>
                      </div>
                    </div>
                    <svg className={`w-5 h-5 text-gray-400 transition-transform ${expandedSections.mismatch ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  {expandedSections.mismatch && (
                    <div className="mt-3 ml-10 space-y-3 animate-slide-up">
                      {mismatches.map((item, i) => (
                        <div key={i} className="bg-red-50 border border-red-100 rounded-lg p-3">
                          <p className="text-sm text-gray-700 mb-2">{item.detail || item.field}</p>
                          {item.values?.map((v, j) => (
                            <div key={j} className="flex justify-between text-sm py-1 border-t border-red-100">
                              <span className="text-gray-500">Trên {v.source}:</span>
                              <span className={j > 0 ? 'text-red-600 font-semibold' : 'text-gray-800'}>{v.value}</span>
                            </div>
                          ))}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Missing */}
              {missing.length > 0 && (
                <div className="mb-4">
                  <button
                    className="flex items-center justify-between w-full text-left"
                    onClick={() => toggleSection('missing')}
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                        <span className="text-yellow-600 text-sm">⚠️</span>
                      </span>
                      <div>
                        <p className="font-medium text-gray-900 text-sm">Thiếu giấy tờ</p>
                        <p className="text-xs text-gray-500">{missing.length} cảnh báo</p>
                      </div>
                    </div>
                    <svg className={`w-5 h-5 text-gray-400 transition-transform ${expandedSections.missing ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  {expandedSections.missing && (
                    <div className="mt-3 ml-10 space-y-2 animate-slide-up">
                      {missing.map((item, i) => (
                        <div key={i} className="bg-yellow-50 border border-yellow-100 rounded-lg p-3 text-sm text-yellow-800">
                          {item.detail || `Thiếu: ${item.field}`}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Matches */}
              {matches.length > 0 && (
                <div className="mb-4">
                  <button
                    className="flex items-center justify-between w-full text-left"
                    onClick={() => toggleSection('match')}
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                        <span className="text-green-600 text-sm">✅</span>
                      </span>
                      <div>
                        <p className="font-medium text-gray-900 text-sm">Thông tin hợp lệ</p>
                        <p className="text-xs text-gray-500">{matches.length} hạng mục đạt</p>
                      </div>
                    </div>
                    <svg className={`w-5 h-5 text-gray-400 transition-transform ${expandedSections.match ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  {expandedSections.match && (
                    <div className="mt-3 ml-10 space-y-2 animate-slide-up">
                      {matches.map((item, i) => (
                        <div key={i} className="text-sm text-green-700 flex items-center gap-2">
                          <span>✓</span> {item.field}: khớp
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Score breakdown */}
              {score.breakdown && score.breakdown.length > 0 && (
                <div className="border-t border-gray-100 pt-4 mt-4">
                  <h3 className="text-sm font-semibold text-gray-700 mb-3">Chi tiết điểm trừ</h3>
                  <ul className="space-y-2">
                    {score.breakdown.map((r) => (
                      <li key={r.ruleId} className="flex items-start gap-3 text-sm">
                        <span className={`text-lg shrink-0 ${SEVERITY_COLORS[r.severity as keyof typeof SEVERITY_COLORS] || 'text-gray-500'}`}>
                          ●
                        </span>
                        <span className="flex-1 text-gray-700">{r.detail}</span>
                        <span className="text-red-600 font-semibold shrink-0">{r.impact}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* LawGuard */}
            {lawAlerts.length > 0 && (
              <div>
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
                      className={`card text-sm ${alert.type === 'WARNING' ? 'bg-yellow-50 border-yellow-200' : 'bg-blue-50 border-blue-200'}`}
                    >
                      <p className="font-medium mb-1">{alert.message}</p>
                      <p className="text-xs text-gray-400">Độ tin cậy: {Math.round(alert.confidence * 100)}%</p>
                    </div>
                  ),
                )}
              </div>
            )}

            <Disclaimer />
          </div>
        </div>

        {/* Bottom actions */}
        <div className="mt-8 flex gap-3">
          <button className="btn-secondary flex-1" onClick={() => router.back()}>
            Quay lại
          </button>
          <button
            className="btn-primary flex-1"
            onClick={() => router.push(`/smartform/${sessionId}`)}
          >
            Xem form tự điền →
          </button>
        </div>
      </div>
    </CitizenLayout>
  );
}
