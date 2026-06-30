import { ScoreEngine } from '../src/engine';
import { CrossChecker } from '../src/crosscheck';
import { ScoringContext, ProcedureTemplate, ExtractedDocument } from '../src/types';

const PROCEDURE: ProcedureTemplate = {
  code: 'DK_KHAI_SINH',
  name: 'Đăng ký khai sinh',
  checklist: [
    { id: 'cccd_cha_me', documentTypeCode: 'CCCD', required: true },
    { id: 'giay_chung_sinh', documentTypeCode: 'GIAY_CHUNG_SINH', required: true },
  ],
  crossCheckRules: [
    {
      name: 'Tên mẹ khớp giữa CCCD và giấy chứng sinh',
      left: 'cccd_cha_me.hoTen',
      right: 'giay_chung_sinh.hoTenMe',
      matchType: 'normalized',
      severityIfMismatch: 'HIGH',
      skipIfMissing: 'giay_chung_sinh',
    },
  ],
  scoringRules: {
    baseScore: 100,
    penalties: { missingRequired: -20, infoMismatch: -10, expiredDoc: -15, lowQualityImage: -5, lowOcrConfidence: -5 },
  },
};

const fullDocs: ExtractedDocument[] = [
  {
    checklistId: 'cccd_cha_me',
    documentTypeCode: 'CCCD',
    fields: {
      hoTen: { value: 'Trần Thị Bình', confidence: 0.98 },
      ngayHetHan: { value: '2035-01-01', confidence: 0.96 },
    },
    imageQuality: { isBlurry: false, brightness: 0.8, ocrConfidence: 0.97 },
  },
  {
    checklistId: 'giay_chung_sinh',
    documentTypeCode: 'GIAY_CHUNG_SINH',
    fields: {
      hoTenMe: { value: 'Trần Thị Bình', confidence: 0.95 },
    },
    imageQuality: { isBlurry: false, brightness: 0.75, ocrConfidence: 0.95 },
  },
];

describe('ScoreEngine', () => {
  it('hồ sơ đầy đủ thông tin khớp → score >= 80', () => {
    const checker = new CrossChecker();
    const crosscheckResult = checker.run(PROCEDURE, fullDocs);
    const context: ScoringContext = { procedure: PROCEDURE, documents: fullDocs, crosscheckResult };
    const result = new ScoreEngine().evaluate(context);
    expect(result.score).toBeGreaterThanOrEqual(80);
    expect(result.grade).toBe('A');
    expect(result.canSubmit).toBe(true);
  });

  it('thiếu giấy tờ bắt buộc → score giảm, canSubmit = false', () => {
    const docsWithMissing = fullDocs.slice(0, 1);
    const checker = new CrossChecker();
    const crosscheckResult = checker.run(PROCEDURE, docsWithMissing);
    const context: ScoringContext = { procedure: PROCEDURE, documents: docsWithMissing, crosscheckResult };
    const result = new ScoreEngine().evaluate(context);
    expect(result.score).toBeLessThan(90);
    expect(result.canSubmit).toBe(false);
    expect(result.breakdown.some(r => r.ruleId === 'missing-document')).toBe(true);
  });

  it('thông tin không khớp → có breakdown mismatch-info', () => {
    const mismatchDocs: ExtractedDocument[] = [
      { ...fullDocs[0] },
      {
        checklistId: 'giay_chung_sinh',
        documentTypeCode: 'GIAY_CHUNG_SINH',
        fields: { hoTenMe: { value: 'Trần Thị Bình An', confidence: 0.92 } },
        imageQuality: { isBlurry: false, brightness: 0.75, ocrConfidence: 0.92 },
      },
    ];
    const checker = new CrossChecker();
    const crosscheckResult = checker.run(PROCEDURE, mismatchDocs);
    const context: ScoringContext = { procedure: PROCEDURE, documents: mismatchDocs, crosscheckResult };
    const result = new ScoreEngine().evaluate(context);
    expect(result.breakdown.some(r => r.ruleId === 'mismatch-info')).toBe(true);
  });

  it('ảnh mờ → có breakdown image-quality', () => {
    const blurryDocs: ExtractedDocument[] = [
      {
        ...fullDocs[0],
        fields: { hoTen: { value: 'Ng??', confidence: 0.42 } },
        imageQuality: { isBlurry: true, brightness: 0.3, ocrConfidence: 0.42 },
      },
      fullDocs[1],
    ];
    const checker = new CrossChecker();
    const crosscheckResult = checker.run(PROCEDURE, blurryDocs);
    const context: ScoringContext = { procedure: PROCEDURE, documents: blurryDocs, crosscheckResult };
    const result = new ScoreEngine().evaluate(context);
    expect(result.breakdown.some(r => r.ruleId === 'image-quality')).toBe(true);
  });
});
