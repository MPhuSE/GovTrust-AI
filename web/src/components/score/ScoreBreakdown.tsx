import { SEVERITY_COLORS } from '@/lib/constants';

interface RuleResult {
  ruleId: string;
  detail: string;
  impact: number;
  severity: string;
}

export function ScoreBreakdown({ breakdown }: { breakdown: RuleResult[] }) {
  if (breakdown.length === 0) {
    return <div className="card text-green-700">✓ Không phát hiện lỗi nào</div>;
  }

  return (
    <div className="card">
      <h3 className="mb-3">Chi tiết điểm trừ</h3>
      <ul className="space-y-3">
        {breakdown.map(r => (
          <li key={r.ruleId} className="flex items-start gap-3">
            <span className={`text-xl shrink-0 ${SEVERITY_COLORS[r.severity as keyof typeof SEVERITY_COLORS]}`}>
              ●
            </span>
            <div className="flex-1">
              <p className="text-sm text-gray-800">{r.detail}</p>
            </div>
            <span className="text-red-600 font-semibold shrink-0">{r.impact}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
