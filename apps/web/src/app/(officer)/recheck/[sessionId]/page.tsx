'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { sessionsApi, recheckApi } from '@/lib/api-client';
import { OfficerLayout } from '@/components/layout/OfficerLayout';
import { ScoreCircle } from '@/components/ui/ScoreCircle';
import { LawCitation } from '@/components/ui/LawCitation';
import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton';

interface RecheckSession {
  _id: string;
  procedureName: string;
  score: number;
  grade: string;
  breakdown: Array<{ ruleId: string; detail: string; impact: number; severity: string }>;
  crossCheckResults: Array<{ field: string; status: string; detail?: string }>;
  lawGuardAlerts: Array<{
    type: string;
    message: string;
    confidence: number;
    legalSource?: { title: string; article: string; url?: string };
  }>;
  riskFlags: string[];
}

export default function RecheckPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const router = useRouter();
  const [session, setSession] = useState<RecheckSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [decision, setDecision] = useState('');
  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    sessionsApi
      .get(sessionId)
      .then((data: unknown) => {
        const s = data as {
          procedure?: { name: string };
          aiResult?: {
            score?: { score: number; grade: string; breakdown: unknown[] };
            crossCheck?: { results: unknown[] };
            lawGuardAlerts?: unknown[];
          };
          recheckResult?: { riskFlags?: string[] };
        };

        setSession({
          _id: sessionId,
          procedureName: s.procedure?.name || 'Không rõ thủ tục',
          score: s.aiResult?.score?.score || 0,
          grade: s.aiResult?.score?.grade || 'D',
          breakdown: (s.aiResult?.score?.breakdown || []) as RecheckSession['breakdown'],
          crossCheckResults: (s.aiResult?.crossCheck?.results || []) as RecheckSession['crossCheckResults'],
          lawGuardAlerts: (s.aiResult?.lawGuardAlerts || []) as RecheckSession['lawGuardAlerts'],
          riskFlags: s.recheckResult?.riskFlags || [],
        });
        setIsLoading(false);
      })
      .catch(() => setIsLoading(false));
  }, [sessionId]);

  const handleSubmit = async () => {
    if (!decision) return;
    setIsSubmitting(true);
    try {
      await recheckApi.recheck(sessionId);
      setSubmitted(true);
    } catch (e) {
      alert((e as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <OfficerLayout>
        <div className="p-8">
          <LoadingSkeleton variant="score" />
          <LoadingSkeleton variant="card" className="mt-6" />
        </div>
      </OfficerLayout>
    );
  }

  if (submitted) {
    return (
      <OfficerLayout>
        <div className="p-8 max-w-2xl mx-auto text-center animate-scale-in">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold mb-3">Tái kiểm hoàn tất</h1>
          <p className="text-gray-500 mb-6">Kết quả tái kiểm đã được ghi nhận vào hệ thống.</p>
          <button className="btn-primary" onClick={() => router.push('/queue')}>
            ← Quay lại danh sách
          </button>
        </div>
      </OfficerLayout>
    );
  }

  return (
    <OfficerLayout>
      <div className="p-6 sm:p-8 max-w-4xl animate-fade-in">
        {/* Header */}
        <button onClick={() => router.push('/queue')} className="text-sm text-gray-500 hover:text-gray-700 mb-4 flex items-center gap-1">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Quay lại danh sách
        </button>

        <h1 className="text-2xl font-bold text-gray-900 mb-1">Gov Re-Check</h1>
        <p className="text-gray-500 text-sm mb-6">
          Tái kiểm hồ sơ: {session?.procedureName} — Mã #{sessionId.slice(-6)}
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: AI Results */}
          <div className="lg:col-span-2 space-y-4">
            {/* Score */}
            <div className="card flex items-center gap-6">
              <ScoreCircle
                score={session?.score || 0}
                grade={(session?.grade || 'D') as 'A' | 'B' | 'C' | 'D'}
                size={120}
              />
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 mb-2">Kết quả AI kiểm tra</h3>
                {session?.breakdown.map((b) => (
                  <div key={b.ruleId} className="flex items-center justify-between text-sm py-1 border-b border-gray-100 last:border-0">
                    <span className="text-gray-600">{b.detail}</span>
                    <span className="text-red-600 font-semibold">{b.impact}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* CrossCheck */}
            {session?.crossCheckResults && session.crossCheckResults.length > 0 && (
              <div className="card">
                <h3 className="font-semibold text-gray-900 mb-3">Đối chiếu chéo</h3>
                <div className="space-y-2">
                  {session.crossCheckResults.map((r, i) => (
                    <div
                      key={i}
                      className={`flex items-center gap-2 text-sm p-2 rounded-lg ${
                        r.status === 'MATCH'
                          ? 'bg-green-50 text-green-700'
                          : r.status === 'MISMATCH'
                          ? 'bg-red-50 text-red-700'
                          : 'bg-yellow-50 text-yellow-700'
                      }`}
                    >
                      <span>{r.status === 'MATCH' ? '✅' : r.status === 'MISMATCH' ? '❌' : '⚠️'}</span>
                      <span>{r.detail || r.field}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Risk Flags */}
            {session?.riskFlags && session.riskFlags.length > 0 && (
              <div className="card border-red-200 bg-red-50">
                <h3 className="font-semibold text-red-800 mb-3 flex items-center gap-2">
                  🚩 Cảnh báo rủi ro
                </h3>
                <ul className="space-y-1">
                  {session.riskFlags.map((flag, i) => (
                    <li key={i} className="text-sm text-red-700 flex items-center gap-2">
                      <span>•</span> {flag}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* LawGuard */}
            {session?.lawGuardAlerts.map((alert, i) =>
              alert.legalSource ? (
                <LawCitation key={i} source={alert.legalSource} confidence={alert.confidence} content={alert.message} />
              ) : null,
            )}
          </div>

          {/* Right: Decision */}
          <div className="space-y-4">
            <div className="card">
              <h3 className="font-semibold text-gray-900 mb-4">Quyết định của cán bộ</h3>

              <div className="space-y-3">
                {[
                  { value: 'PASS', label: 'Đủ điều kiện', icon: '✅' },
                  { value: 'NEED_MORE', label: 'Cần bổ sung', icon: '⚠️' },
                  { value: 'NEED_REVIEW', label: 'Cần kiểm kỹ', icon: '🔍' },
                ].map((opt) => (
                  <label
                    key={opt.value}
                    className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                      decision === opt.value
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="decision"
                      value={opt.value}
                      checked={decision === opt.value}
                      onChange={(e) => setDecision(e.target.value)}
                      className="w-4 h-4 text-blue-600"
                    />
                    <span className="text-base">{opt.icon}</span>
                    <span className="font-medium text-sm text-gray-900">{opt.label}</span>
                  </label>
                ))}
              </div>

              <div className="mt-4">
                <label className="input-label">Ghi chú</label>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="input-field resize-none"
                  rows={4}
                  placeholder="Ghi chú cho hồ sơ này..."
                />
              </div>

              <button
                className="btn-primary w-full mt-4"
                disabled={!decision || isSubmitting}
                onClick={handleSubmit}
              >
                {isSubmitting ? 'Đang xử lý...' : 'Xác nhận tái kiểm'}
              </button>
            </div>

            <div className="info-box">
              <p className="text-xs">
                <strong>Lưu ý:</strong> Kết quả AI chỉ mang tính tham khảo. Quyết định cuối cùng thuộc cán bộ có thẩm quyền.
              </p>
            </div>
          </div>
        </div>
      </div>
    </OfficerLayout>
  );
}
