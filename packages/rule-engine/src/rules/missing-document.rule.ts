import { ScoringContext, RuleResult, Severity } from '../types';

export class MissingDocumentRule {
  readonly id = 'missing-document';
  readonly name = 'Kiểm tra giấy tờ bắt buộc còn thiếu';

  evaluate(ctx: ScoringContext): RuleResult {
    const missing = ctx.crosscheckResult.missingDocuments;

    if (missing.length === 0) {
      return { ruleId: this.id, passed: true, impact: 0, severity: 'LOW', detail: 'Đủ giấy tờ bắt buộc' };
    }

    const missingNames = missing
      .map(id => ctx.procedure.checklist.find(c => c.id === id)?.roleInProcedure ?? id)
      .join(', ');

    const impactPerDoc = ctx.procedure.scoringRules.penalties.missingRequired;
    const impact = impactPerDoc * missing.length;
    // Thiếu bất kỳ giấy tờ BẮT BUỘC nào → hồ sơ không đầy đủ → không thể nộp.
    // CRITICAL để ScoreEngine đặt canSubmit=false, bất kể điểm số còn lại.
    const severity: Severity = 'CRITICAL';

    return {
      ruleId: this.id,
      passed: false,
      impact,
      severity,
      detail: `Thiếu giấy tờ bắt buộc: ${missingNames}`,
    };
  }
}
