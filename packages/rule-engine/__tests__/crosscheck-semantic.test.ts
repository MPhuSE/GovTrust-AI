import { CrossChecker, canonicalizeDate } from '../src/crosscheck';
import { ProcedureTemplate, ExtractedDocument } from '../src/types';

describe('canonicalizeDate (thuần, không AI)', () => {
  it('DD/MM/YYYY → YYYY-MM-DD', () => {
    expect(canonicalizeDate('15/03/2020')).toBe('2020-03-15');
  });

  it('DD-MM-YYYY và DD.MM.YYYY', () => {
    expect(canonicalizeDate('15-03-2020')).toBe('2020-03-15');
    expect(canonicalizeDate('15.03.2020')).toBe('2020-03-15');
  });

  it('ISO YYYY-MM-DD giữ nguyên chuẩn', () => {
    expect(canonicalizeDate('2020-03-15')).toBe('2020-03-15');
  });

  it('dạng chữ tiếng Việt "ngày 15 tháng 3 năm 2020"', () => {
    expect(canonicalizeDate('ngày 15 tháng 3 năm 2020')).toBe('2020-03-15');
    expect(canonicalizeDate('15 tháng 03 năm 2020')).toBe('2020-03-15');
  });

  it('cùng một ngày ở 2 định dạng khác nhau → canonical bằng nhau', () => {
    expect(canonicalizeDate('05/01/2020')).toBe(canonicalizeDate('ngày 5 tháng 1 năm 2020'));
  });

  it('rác/không parse được → null', () => {
    expect(canonicalizeDate('')).toBeNull();
    expect(canonicalizeDate('không rõ')).toBeNull();
    expect(canonicalizeDate('32/13/2020')).toBeNull();
  });
});

// ---- matchType: 'date' — so ngày qua canonical, không phụ thuộc định dạng ----

const DATE_PROC: ProcedureTemplate = {
  code: 'TEST_DATE',
  name: 'Test date match',
  checklist: [
    { id: 'a', documentTypeCode: 'A', required: true },
    { id: 'b', documentTypeCode: 'B', required: true },
  ],
  crossCheckRules: [
    { name: 'Ngày sinh khớp', left: 'a.ngaySinh', right: 'b.ngaySinh', matchType: 'date', severityIfMismatch: 'HIGH' },
  ],
  scoringRules: {
    baseScore: 100,
    penalties: { missingRequired: -20, infoMismatch: -10, expiredDoc: -15, lowQualityImage: -5, lowOcrConfidence: -5 },
  },
};

function docs(a: string, b: string): ExtractedDocument[] {
  return [
    { checklistId: 'a', documentTypeCode: 'A', fields: { ngaySinh: { value: a, confidence: 0.9 } } },
    { checklistId: 'b', documentTypeCode: 'B', fields: { ngaySinh: { value: b, confidence: 0.9 } } },
  ];
}

describe("matchType 'date'", () => {
  const checker = new CrossChecker();

  it('MATCH — cùng ngày, khác định dạng (15/03/2020 vs ngày 15 tháng 3 năm 2020)', () => {
    const r = checker.run(DATE_PROC, docs('15/03/2020', 'ngày 15 tháng 3 năm 2020'));
    expect(r.checks[0].status).toBe('MATCH');
  });

  it('MISMATCH — ngày khác nhau', () => {
    const r = checker.run(DATE_PROC, docs('15/03/2020', '16/03/2020'));
    expect(r.checks[0].status).toBe('MISMATCH');
  });

  it('không gắn cờ needsSemanticReview (date là thuần, không escalate AI)', () => {
    const r = checker.run(DATE_PROC, docs('15/03/2020', '16/03/2020'));
    expect(r.checks[0].needsSemanticReview).toBeUndefined();
  });
});

// ---- matchType: 'semantic' — pass 1 thuần; escalate khi chưa khớp ----

const SEMANTIC_PROC: ProcedureTemplate = {
  code: 'TEST_SEMANTIC',
  name: 'Test semantic match',
  checklist: [
    { id: 'a', documentTypeCode: 'A', required: true },
    { id: 'b', documentTypeCode: 'B', required: true },
  ],
  crossCheckRules: [
    { name: 'Địa chỉ khớp', left: 'a.diaChi', right: 'b.diaChi', matchType: 'semantic', severityIfMismatch: 'MEDIUM' },
  ],
  scoringRules: {
    baseScore: 100,
    penalties: { missingRequired: -20, infoMismatch: -10, expiredDoc: -15, lowQualityImage: -5, lowOcrConfidence: -5 },
  },
};

function addrDocs(a: string, b: string): ExtractedDocument[] {
  return [
    { checklistId: 'a', documentTypeCode: 'A', fields: { diaChi: { value: a, confidence: 0.9 } } },
    { checklistId: 'b', documentTypeCode: 'B', fields: { diaChi: { value: b, confidence: 0.9 } } },
  ];
}

describe("matchType 'semantic' — pass 1 (thuần, chưa gọi AI)", () => {
  const checker = new CrossChecker();

  it('MATCH ngay ở pass 1 khi chuẩn hóa đã khớp → KHÔNG cần AI', () => {
    const r = checker.run(SEMANTIC_PROC, addrDocs('TP.HCM', 'tp.hcm'));
    expect(r.checks[0].status).toBe('MATCH');
    expect(r.checks[0].needsSemanticReview).toBeUndefined();
  });

  it('chưa khớp theo ký tự → MISMATCH + gắn cờ needsSemanticReview để escalate AI', () => {
    const r = checker.run(SEMANTIC_PROC, addrDocs('TP.HCM', 'Thành phố Hồ Chí Minh'));
    expect(r.checks[0].status).toBe('MISMATCH');
    expect(r.checks[0].needsSemanticReview).toBe(true);
    expect(r.checks[0].matchType).toBe('semantic');
  });
});
