import { ScoringContext, ScoreResult, Grade, RuleResult } from './types';
import { MissingDocumentRule } from './rules/missing-document.rule';
import { ExpiredDocumentRule } from './rules/expired-document.rule';
import { MismatchInfoRule } from './rules/mismatch-info.rule';
import { ImageQualityRule } from './rules/image-quality.rule';
import { OCRConfidenceRule } from './rules/ocr-confidence.rule';

const CAN_SUBMIT_THRESHOLD = 60;

function toGrade(score: number): Grade {
  if (score >= 85) return 'A';
  if (score >= 70) return 'B';
  if (score >= 55) return 'C';
  return 'D';
}

function buildRecommendation(violations: RuleResult[]): string {
  if (violations.length === 0) return 'Hồ sơ đạt yêu cầu, có thể nộp.';
  const msgs = violations.map(v => v.detail);
  return `Cần khắc phục: ${msgs.join('; ')}.`;
}

export class ScoreEngine {
  private rules = [
    new MissingDocumentRule(),
    new ExpiredDocumentRule(),
    new MismatchInfoRule(),
    new ImageQualityRule(),
    new OCRConfidenceRule(),
  ];

  evaluate(context: ScoringContext): ScoreResult {
    const base = context.procedure.scoringRules.baseScore;
    const results = this.rules.map(r => r.evaluate(context));
    const violations = results.filter(r => !r.passed);
    const totalImpact = violations.reduce((sum, r) => sum + r.impact, 0);
    const score = Math.max(0, Math.min(100, base + totalImpact));
    const hasCritical = violations.some(r => r.severity === 'CRITICAL');

    return {
      score,
      grade: toGrade(score),
      breakdown: violations,
      canSubmit: score >= CAN_SUBMIT_THRESHOLD && !hasCritical,
      recommendation: buildRecommendation(violations),
    };
  }
}
