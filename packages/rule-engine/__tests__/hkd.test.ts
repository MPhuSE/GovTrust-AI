import { ScoreEngine } from '../src/engine';
import { CrossChecker } from '../src/crosscheck';
import { ScoringContext, ProcedureTemplate, ExtractedDocument } from '../src/types';

// Thủ tục HKD_THAY_DOI (thay đổi nội dung ĐKHKD): cross-check chủ hộ trên CCCD
// khớp chủ hộ trên Giấy chứng nhận ĐKHKD. Cả 2 vế đều OCR thật qua VNPT.
const PROCEDURE: ProcedureTemplate = {
  code: 'HKD_THAY_DOI',
  name: 'Đăng ký thay đổi nội dung đăng ký hộ kinh doanh',
  checklist: [
    { id: 'cccd_nguoi_yeu_cau', documentTypeCode: 'CCCD', required: true },
    { id: 'giay_hkd', documentTypeCode: 'HO_KINH_DOANH', required: true },
  ],
  crossCheckRules: [
    {
      name: 'Chủ hộ trên CCCD khớp chủ hộ trên Giấy chứng nhận ĐKHKD',
      left: 'cccd_nguoi_yeu_cau.hoTen',
      right: 'giay_hkd.hoTenChuHo',
      matchType: 'normalized',
      severityIfMismatch: 'HIGH',
      skipIfMissing: 'giay_hkd',
    },
  ],
  scoringRules: {
    baseScore: 100,
    penalties: { missingRequired: -20, infoMismatch: -10, expiredDoc: -15, lowQualityImage: -5, lowOcrConfidence: -5 },
  },
};

function cccd(hoTen: string): ExtractedDocument {
  return {
    checklistId: 'cccd_nguoi_yeu_cau',
    documentTypeCode: 'CCCD',
    fields: {
      hoTen: { value: hoTen, confidence: 0.98 },
      soCCCD: { value: '012345678901', confidence: 0.99 },
    },
    imageQuality: { isBlurry: false, brightness: 0.8, ocrConfidence: 0.97 },
  };
}

function giayHkd(hoTenChuHo: string | null): ExtractedDocument {
  const fields: ExtractedDocument['fields'] = {
    tenHoKinhDoanh: { value: 'Hộ kinh doanh Lê Thái Hưng', confidence: 0.95 },
    maSoHoKinhDoanh: { value: '12A8018999', confidence: 0.94 },
  };
  if (hoTenChuHo !== null) {
    fields.hoTenChuHo = { value: hoTenChuHo, confidence: 0.95 };
  }
  return {
    checklistId: 'giay_hkd',
    documentTypeCode: 'HO_KINH_DOANH',
    fields,
    imageQuality: { isBlurry: false, brightness: 0.78, ocrConfidence: 0.95 },
  };
}

describe('HKD_THAY_DOI cross-check', () => {
  const checker = new CrossChecker();

  it('MATCH — chủ hộ khớp (bỏ dấu vẫn khớp)', () => {
    const docs = [cccd('Lê Thái Hưng'), giayHkd('LÊ THÁI HƯNG')];
    const result = checker.run(PROCEDURE, docs);
    expect(result.checks[0].status).toBe('MATCH');
    expect(result.summary.mismatches).toBe(0);
  });

  it('MISMATCH — chủ hộ khác nhau → severity HIGH', () => {
    const docs = [cccd('Nguyễn Văn An'), giayHkd('Lê Thái Hưng')];
    const result = checker.run(PROCEDURE, docs);
    expect(result.checks[0].status).toBe('MISMATCH');
    expect(result.checks[0].severity).toBe('HIGH');
  });

  it('MISSING — đọc được giấy nhưng thiếu field hoTenChuHo', () => {
    const docs = [cccd('Lê Thái Hưng'), giayHkd(null)];
    const result = checker.run(PROCEDURE, docs);
    expect(result.checks[0].status).toBe('MISSING');
  });

  it('SKIPPED — thiếu hẳn giấy HKD (skipIfMissing)', () => {
    const docs = [cccd('Lê Thái Hưng')];
    const result = checker.run(PROCEDURE, docs);
    expect(result.checks[0].status).toBe('SKIPPED');
    expect(result.missingDocuments).toContain('giay_hkd');
  });
});

describe('HKD_THAY_DOI scoring', () => {
  const checker = new CrossChecker();

  it('khớp đầy đủ → score cao, canSubmit=true', () => {
    const docs = [cccd('Lê Thái Hưng'), giayHkd('Lê Thái Hưng')];
    const crosscheckResult = checker.run(PROCEDURE, docs);
    const context: ScoringContext = { procedure: PROCEDURE, documents: docs, crosscheckResult };
    const result = new ScoreEngine().evaluate(context);
    expect(result.score).toBeGreaterThanOrEqual(85);
    expect(result.canSubmit).toBe(true);
  });

  it('thiếu giấy HKD bắt buộc → canSubmit=false + breakdown missing-document', () => {
    const docs = [cccd('Lê Thái Hưng')];
    const crosscheckResult = checker.run(PROCEDURE, docs);
    const context: ScoringContext = { procedure: PROCEDURE, documents: docs, crosscheckResult };
    const result = new ScoreEngine().evaluate(context);
    expect(result.breakdown.some(r => r.ruleId === 'missing-document')).toBe(true);
  });

  it('chủ hộ không khớp → breakdown mismatch-info + chặn nộp (CRITICAL)', () => {
    const docs = [cccd('Nguyễn Văn An'), giayHkd('Lê Thái Hưng')];
    const crosscheckResult = checker.run(PROCEDURE, docs);
    const context: ScoringContext = { procedure: PROCEDURE, documents: docs, crosscheckResult };
    const result = new ScoreEngine().evaluate(context);
    const mismatch = result.breakdown.find(r => r.ruleId === 'mismatch-info');
    expect(mismatch).toBeDefined();
    expect(mismatch!.severity).toBe('CRITICAL');
    expect(result.canSubmit).toBe(false);
  });
});
