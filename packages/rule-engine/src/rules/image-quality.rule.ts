import { ScoringContext, RuleResult } from '../types';

const BLUR_THRESHOLD = 0.4;      // brightness dưới mức này coi là ảnh tối/mờ
const CONFIDENCE_THRESHOLD = 0.7; // OCR confidence dưới mức này coi là ảnh kém

export class ImageQualityRule {
  readonly id = 'image-quality';
  readonly name = 'Kiểm tra chất lượng ảnh giấy tờ';

  evaluate(ctx: ScoringContext): RuleResult {
    const badImages = ctx.documents.filter(doc => {
      const q = doc.imageQuality;
      if (!q) return false;
      return q.isBlurry || q.brightness < BLUR_THRESHOLD || q.ocrConfidence < CONFIDENCE_THRESHOLD;
    });

    if (badImages.length === 0) {
      return { ruleId: this.id, passed: true, impact: 0, severity: 'LOW', detail: 'Chất lượng ảnh đạt yêu cầu' };
    }

    const names = badImages
      .map(d => ctx.procedure.checklist.find(c => c.id === d.checklistId)?.roleInProcedure ?? d.checklistId)
      .join(', ');

    const impact = ctx.procedure.scoringRules.penalties.lowQualityImage * badImages.length;

    return {
      ruleId: this.id,
      passed: false,
      impact,
      severity: 'MEDIUM',
      detail: `Ảnh mờ hoặc kém chất lượng — cần chụp lại: ${names}`,
    };
  }
}
