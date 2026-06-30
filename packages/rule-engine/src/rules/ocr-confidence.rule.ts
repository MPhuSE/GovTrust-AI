import { ScoringContext, RuleResult } from '../types';

const OCR_CONFIDENCE_THRESHOLD = 0.75;

export class OCRConfidenceRule {
  readonly id = 'ocr-confidence';
  readonly name = 'Kiểm tra độ tin cậy của kết quả OCR';

  evaluate(ctx: ScoringContext): RuleResult {
    const lowConfidenceDocs = ctx.documents.filter(doc => {
      const fields = Object.values(doc.fields);
      if (fields.length === 0) return false;
      const avg = fields.reduce((sum, f) => sum + f.confidence, 0) / fields.length;
      return avg < OCR_CONFIDENCE_THRESHOLD;
    });

    if (lowConfidenceDocs.length === 0) {
      return { ruleId: this.id, passed: true, impact: 0, severity: 'LOW', detail: 'Kết quả OCR tin cậy' };
    }

    const names = lowConfidenceDocs
      .map(d => ctx.procedure.checklist.find(c => c.id === d.checklistId)?.roleInProcedure ?? d.checklistId)
      .join(', ');

    const impact = ctx.procedure.scoringRules.penalties.lowOcrConfidence * lowConfidenceDocs.length;

    return {
      ruleId: this.id,
      passed: false,
      impact,
      severity: 'MEDIUM',
      detail: `Kết quả OCR không đủ tin cậy — vui lòng chụp lại ảnh rõ hơn: ${names}`,
    };
  }
}
