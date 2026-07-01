'use client';

import { GRADE_COLORS } from '@/lib/constants';

interface ScoreCardProps {
  score: number;
  grade: 'A' | 'B' | 'C' | 'D';
  canSubmit: boolean;
}

export function ScoreCard({ score, grade, canSubmit }: ScoreCardProps) {
  const colors = GRADE_COLORS[grade];

  return (
    <div className={`card text-center ${colors.bg} border ${colors.border}`}>
      <div className={`text-6xl font-bold ${colors.text} mb-1`}>{score}</div>
      <div className="text-gray-500 text-sm mb-3">/ 100 điểm</div>
      <div className={`inline-block px-4 py-1 rounded-full font-semibold text-lg ${colors.bg} ${colors.text} border ${colors.border} mb-3`}>
        Hạng {grade}
      </div>
      <div className={`text-sm font-medium mt-2 ${canSubmit ? 'text-green-700' : 'text-red-600'}`}>
        {canSubmit ? '✓ Hồ sơ có thể nộp' : '✗ Cần bổ sung trước khi nộp'}
      </div>
    </div>
  );
}
