// ============================================================
// GovTrust AI — Rule Engine Types
// Dùng chung cho CrossCheck và Score Engine
// ============================================================

export type Severity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type Grade = 'A' | 'B' | 'C' | 'D';
export type MatchType = 'exact' | 'normalized' | 'fuzzy';

export interface FieldValue {
  value: string;
  confidence: number; // 0.0 – 1.0
}

export interface ExtractedDocument {
  checklistId: string;       // khớp với checklist.id trong procedure
  documentTypeCode: string;  // "CCCD", "GIAY_KHAI_SINH", ...
  fields: Record<string, FieldValue>;
  liveness?: boolean;
  imageQuality?: ImageQuality;
}

export interface ImageQuality {
  isBlurry: boolean;
  brightness: number;      // 0.0 – 1.0
  resolution?: string;
  ocrConfidence: number;   // confidence tổng thể từ VNPT
}

export interface ChecklistItem {
  id: string;
  documentTypeCode: string;
  acceptedCodes?: string[];
  roleInProcedure?: string;
  quantity?: number;
  required: boolean;
  conditionalOn?: string;
  points?: number;
}

export interface CrossCheckRule {
  name: string;
  left: string;             // "cccd_cha_me.hoTen"
  right: string;            // "to_khai.hoTenCha"
  matchType: MatchType;
  tolerance?: number;       // ngưỡng fuzzy (0.0 – 1.0)
  severityIfMismatch: Severity;
  skipIfMissing?: string;
}

export interface ScoreWeight {
  ruleId: string;
  weight: number;
}

export interface ScoringRules {
  baseScore: number;
  penalties: {
    missingRequired: number;
    infoMismatch: number;
    expiredDoc: number;
    lowQualityImage: number;
    lowOcrConfidence: number;
  };
}

export interface ProcedureTemplate {
  code: string;
  name: string;
  checklist: ChecklistItem[];
  crossCheckRules: CrossCheckRule[];
  scoringRules: ScoringRules;
}

// --- CrossCheck Output ---

export type CheckStatus = 'MATCH' | 'MISMATCH' | 'MISSING' | 'SKIPPED';

export interface FieldCheck {
  ruleName: string;
  field: string;
  left: string;             // checklistId.fieldKey
  right: string;
  leftValue?: string;
  rightValue?: string;
  status: CheckStatus;
  severity: Severity;
  message: string;
}

export interface CrossCheckResult {
  checks: FieldCheck[];
  missingDocuments: string[];    // checklistId của tài liệu bắt buộc còn thiếu
  expiredDocuments: string[];    // checklistId của tài liệu đã hết hạn
  summary: {
    totalChecks: number;
    matches: number;
    mismatches: number;
    missing: number;
    expired: number;
  };
}

// --- Score Engine Output ---

export interface RuleResult {
  ruleId: string;
  passed: boolean;
  impact: number;            // điểm thêm/trừ (thường âm khi vi phạm)
  severity: Severity;
  detail: string;            // tiếng Việt, hiển thị cho người dân
}

export interface ScoreResult {
  score: number;             // 0 – 100
  grade: Grade;
  breakdown: RuleResult[];   // chỉ các rule vi phạm
  canSubmit: boolean;        // score >= 60 và không có CRITICAL
  recommendation: string;    // gợi ý sửa lỗi tổng hợp
}

// --- Input context cho engine ---

export interface ScoringContext {
  procedure: ProcedureTemplate;
  documents: ExtractedDocument[];
  crosscheckResult: CrossCheckResult;
}
