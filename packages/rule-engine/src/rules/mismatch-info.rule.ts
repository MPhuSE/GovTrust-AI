import { ScoringContext, RuleResult, Severity } from '../types';

export class MismatchInfoRule {
  readonly id = 'mismatch-info';
  readonly name = 'Kiểm tra thông tin không khớp giữa các giấy tờ';

  evaluate(ctx: ScoringContext): RuleResult {
    const mismatches = ctx.crosscheckResult.checks.filter(c => c.status === 'MISMATCH');

    if (mismatches.length === 0) {
      return { ruleId: this.id, passed: true, impact: 0, severity: 'LOW', detail: 'Thông tin khớp nhất quán' };
    }

    const highMismatches = mismatches.filter(m => m.severity === 'HIGH' || m.severity === 'CRITICAL');
    const impact = ctx.procedure.scoringRules.penalties.infoMismatch * mismatches.length;
    // Mismatch nghiêm trọng (vd chủ hộ trên CCCD ≠ trên giấy) → CRITICAL để chặn nộp.
    const severity: Severity = highMismatches.length > 0 ? 'CRITICAL' : 'MEDIUM';

    const details = mismatches
      .map(m => `${m.field}: "${m.leftValue}" ≠ "${m.rightValue}"`)
      .join('; ');

    return {
      ruleId: this.id,
      passed: false,
      impact,
      severity,
      detail: `Thông tin không khớp — ${details}`,
    };
  }
}
