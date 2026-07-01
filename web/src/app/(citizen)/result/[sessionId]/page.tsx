'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { sessionsApi } from '@/lib/api-client';
import { ScoreCard } from '@/components/score/ScoreCard';
import { ScoreBreakdown } from '@/components/score/ScoreBreakdown';
import { WarningList } from '@/components/score/WarningList';
import { Disclaimer } from '@/components/ui/Disclaimer';
import { Progress } from '@/components/ui/Progress';
import { PIPELINE_STEPS } from '@/lib/constants';

interface Session {
  aiResult?: {
    score?: { score: number; grade: string; breakdown: unknown[]; canSubmit: boolean; recommendation: string };
    lawGuardAlerts?: unknown[];
    crossCheck?: { summary: { mismatches: number; missing: number } };
  };
}

export default function ResultPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const router = useRouter();
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    sessionsApi.get(sessionId).then(s => {
      setSession(s as Session);
      setIsLoading(false);
    });
  }, [sessionId]);

  if (isLoading) return <div className="text-center py-20">Đang tải kết quả...</div>;
  if (!session?.aiResult?.score) return <div className="text-center py-20">Chưa có kết quả</div>;

  const { score } = session.aiResult;

  return (
    <main className="max-w-2xl mx-auto px-4 py-8">
      <Progress steps={PIPELINE_STEPS.map(s => s.label)} currentIndex={6} />

      <div className="mt-6 space-y-4">
        <ScoreCard score={score.score} grade={score.grade as 'A' | 'B' | 'C' | 'D'} canSubmit={score.canSubmit} />
        <ScoreBreakdown breakdown={score.breakdown as Array<{ ruleId: string; detail: string; impact: number; severity: string }>} />
        {session.aiResult.lawGuardAlerts && (
          <WarningList alerts={session.aiResult.lawGuardAlerts as Array<{ type: string; message: string; confidence: number; legalSource?: { title: string; article: string }; needsVerification?: boolean }>} />
        )}
        <Disclaimer />
      </div>

      <div className="mt-6 flex gap-3">
        <button className="btn-secondary flex-1" onClick={() => router.back()}>
          Quay lại
        </button>
        <button
          className="btn-primary flex-1 py-3"
          onClick={() => router.push(`/smartform/${sessionId}`)}
        >
          Xem form tự điền
        </button>
      </div>
    </main>
  );
}
