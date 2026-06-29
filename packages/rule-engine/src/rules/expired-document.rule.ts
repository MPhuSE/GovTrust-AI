import { ScoringContext, RuleResult } from '../types';

export class ExpiredDocumentRule {
  readonly id = 'expired-document';
  readonly name = 'Kiểm tra giấy tờ hết hạn';

  evaluate(ctx: ScoringContext): RuleResult {
    const expired = ctx.crosscheckResult.expiredDocuments;

    if (expired.length === 0) {
      return { ruleId: this.id, passed: true, impact: 0, severity: 'LOW', detail: 'Giấy tờ còn hiệu lực' };
    }

    const expiredNames = expired
      .map(id => ctx.procedure.checklist.find(c => c.id === id)?.roleInProcedure ?? id)
      .join(', ');

    const impact = ctx.procedure.scoringRules.penalties.expiredDoc * expired.length;

    return {
      ruleId: this.id,
      passed: false,
      impact,
      severity: 'HIGH',
      detail: `Giấy tờ hết hạn cần cập nhật: ${expiredNames}`,
    };
  }
}
