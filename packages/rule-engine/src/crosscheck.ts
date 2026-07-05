import {
  ProcedureTemplate,
  ExtractedDocument,
  CrossCheckResult,
  FieldCheck,
  CheckStatus,
  Severity,
} from './types';
import { labelForField, labelForDocument } from './field-labels';

// Tháng viết chữ tiếng Việt → số. "tháng ba" hiếm gặp trên giấy tờ nên chỉ cần số.
const _VN_MONTHS: Record<string, number> = {
  '1': 1, '2': 2, '3': 3, '4': 4, '5': 5, '6': 6,
  '7': 7, '8': 8, '9': 9, '10': 10, '11': 11, '12': 12,
  '01': 1, '02': 2, '03': 3, '04': 4, '05': 5, '06': 6,
  '07': 7, '08': 8, '09': 9,
};

/**
 * Chuẩn hóa ngày tháng (nhiều định dạng phổ biến trên giấy tờ VN) về dạng chuẩn
 * "YYYY-MM-DD" bằng code thuần — KHÔNG dùng AI. Grammar ngày là hữu hạn, tất định,
 * nên LLM ở đây chỉ thêm độ trễ + chi phí + phi tất định mà không lợi ích.
 * Nhận: DD/MM/YYYY, DD-MM-YYYY, "ngày 15 tháng 3 năm 2020", ISO YYYY-MM-DD.
 * Trả null nếu không parse được (để CrossChecker rơi về so sánh chuỗi thô).
 */
export function canonicalizeDate(raw: string): string | null {
  if (!raw) return null;
  const text = raw.trim().toLowerCase();

  // "ngày 15 tháng 3 năm 2020" (chấp nhận thiếu chữ "ngày"/"năm").
  const vn = text.match(
    /(?:ngày\s*)?(\d{1,2})\s*tháng\s*(\d{1,2})\s*(?:năm\s*)?(\d{4})/,
  );
  if (vn) return buildDate(vn[1], vn[2], vn[3]);

  // ISO: 2020-03-15 (year trước).
  const iso = text.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})$/);
  if (iso) return buildDate(iso[3], iso[2], iso[1]);

  // DD/MM/YYYY, DD-MM-YYYY, DD.MM.YYYY (day trước).
  const dmy = text.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})$/);
  if (dmy) return buildDate(dmy[1], dmy[2], dmy[3]);

  return null;
}

function buildDate(dayStr: string, monthStr: string, yearStr: string): string | null {
  const day = parseInt(dayStr, 10);
  const month = _VN_MONTHS[monthStr] ?? parseInt(monthStr, 10);
  const year = parseInt(yearStr, 10);
  if (!day || !month || !year) return null;
  if (day < 1 || day > 31 || month < 1 || month > 12) return null;
  const dd = String(day).padStart(2, '0');
  const mm = String(month).padStart(2, '0');
  return `${year}-${mm}-${dd}`;
}

function normalize(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd')
    .trim();
}

function fuzzyMatch(a: string, b: string, tolerance: number): boolean {
  if (a === b) return true;
  if (a.length === 0 || b.length === 0) return false;
  
  const matrix: number[][] = [];
  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }
  
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        );
      }
    }
  }
  
  const distance = matrix[b.length][a.length];
  const maxLen = Math.max(a.length, b.length);
  return (maxLen - distance) / maxLen >= tolerance;
}

function parseDate(dateStr: string): Date | null {
  if (!dateStr) return null;
  // Handle DD/MM/YYYY
  const parts = dateStr.split('/');
  if (parts.length === 3) {
    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const year = parseInt(parts[2], 10);
    return new Date(year, month, day);
  }
  // Fallback to standard parsing
  const parsed = new Date(dateStr);
  return isNaN(parsed.getTime()) ? null : parsed;
}

function getFieldValue(
  docs: ExtractedDocument[],
  ref: string,
): string | null | undefined {
  const [checklistId, fieldKey] = ref.split('.');
  const doc = docs.find(d => d.checklistId === checklistId);
  return doc?.fields[fieldKey]?.value;
}

export class CrossChecker {
  run(
    procedure: ProcedureTemplate,
    documents: ExtractedDocument[],
  ): CrossCheckResult {
    const uploadedIds = new Set(documents.map(d => d.checklistId));
    const checks: FieldCheck[] = [];

    // 1. Kiểm tra thiếu giấy tờ bắt buộc
    const missingDocuments: string[] = [];
    for (const item of procedure.checklist) {
      if (!item.required) continue;
      const hasMissing = !uploadedIds.has(item.id);
      const hasAlias = item.acceptedCodes?.some(code =>
        documents.some(d => d.documentTypeCode === code),
      );
      if (hasMissing && !hasAlias) {
        missingDocuments.push(item.id);
      }
    }

    // 2. Kiểm tra giấy tờ hết hạn
    const expiredDocuments: string[] = [];
    const now = new Date();
    // Reset time for today to compare accurately
    now.setHours(0, 0, 0, 0);
    
    for (const doc of documents) {
      const expiryField = doc.fields['ngayHetHan'] ?? doc.fields['coGiaTriDen'];
      if (!expiryField) continue;
      const expiry = parseDate(expiryField.value);
      if (expiry && expiry < now) {
        expiredDocuments.push(doc.checklistId);
      }
    }

    // 3. Chạy cross-check rules
    for (const rule of procedure.crossCheckRules) {
      if (rule.skipIfMissing && missingDocuments.includes(rule.skipIfMissing)) {
        checks.push({
          ruleName: rule.name,
          field: rule.right.split('.')[1] ?? rule.right,
          left: rule.left,
          right: rule.right,
          status: 'SKIPPED',
          severity: 'LOW',
          message: `Bỏ qua — thiếu giấy tờ: ${rule.skipIfMissing}`,
        });
        continue;
      }

      const leftValue = getFieldValue(documents, rule.left);
      const rightValue = getFieldValue(documents, rule.right);

      // == null bắt cả null (field OCR đọc được nhưng rỗng) lẫn undefined (thiếu field).
      // Nếu chỉ chặn undefined, giá trị null lọt xuống normalize()/trim() → crash toLowerCase.
      if (leftValue == null || rightValue == null) {
        // Nêu ĐÚNG field + giấy tờ nào chưa đọc được (thay vì "Không đọc được dữ liệu"
        // mù mờ) + hướng khắc phục. Xác định vế nào thiếu để chỉ đúng giấy cần tải lại.
        const missingRefs: string[] = [];
        if (leftValue == null) missingRefs.push(rule.left);
        if (rightValue == null) missingRefs.push(rule.right);
        const fieldName = labelForField(rule.right);
        const docList = [...new Set(missingRefs.map(labelForDocument))].join(' và ');
        const missingFieldNames = [...new Set(missingRefs.map(labelForField))].join(', ');

        checks.push({
          ruleName: rule.name,
          field: rule.right.split('.')[1] ?? rule.right,
          left: rule.left,
          right: rule.right,
          leftValue,
          rightValue,
          status: 'MISSING',
          severity: rule.severityIfMismatch,
          message:
            `Chưa đọc được "${missingFieldNames}" từ ${docList} để đối chiếu ${fieldName}. ` +
            `Hãy tải lại ảnh ${docList} rõ nét (đủ sáng, không mờ, không che), ` +
            `hoặc bổ sung thông tin này ở bước điền form.`,
        });
        continue;
      }

      let matched = false;
      switch (rule.matchType) {
        case 'exact':
          matched = leftValue.trim() === rightValue.trim();
          break;
        case 'normalized':
          matched = normalize(leftValue) === normalize(rightValue);
          break;
        case 'fuzzy':
          matched = fuzzyMatch(
            normalize(leftValue),
            normalize(rightValue),
            rule.tolerance ?? 0.8,
          );
          break;
        case 'date': {
          // Canonicalize bằng code thuần rồi so timestamp. Nếu 1 bên không parse
          // được, rơi về so chuỗi chuẩn hóa (không im lặng coi là khớp).
          const l = canonicalizeDate(leftValue);
          const r = canonicalizeDate(rightValue);
          matched = l && r ? l === r : normalize(leftValue) === normalize(rightValue);
          break;
        }
        case 'semantic':
          // Pass 1 (code thuần): nếu chuẩn hóa đã khớp thì KHỎI hỏi AI (rẻ + tất định).
          // Nếu không, để MISMATCH nhưng gắn cờ chờ AI phán lại ở pass 2.
          matched = normalize(leftValue) === normalize(rightValue);
          break;
      }

      const status: CheckStatus = matched ? 'MATCH' : 'MISMATCH';
      const severity: Severity = matched ? 'LOW' : rule.severityIfMismatch;
      // Chỉ escalate lên AI khi rule là 'semantic' VÀ code thuần chưa khẳng định được khớp.
      const needsSemanticReview = rule.matchType === 'semantic' && !matched;

      checks.push({
        ruleName: rule.name,
        field: rule.right.split('.')[1] ?? rule.right,
        left: rule.left,
        right: rule.right,
        leftValue,
        rightValue,
        matchType: rule.matchType,
        status,
        severity,
        ...(needsSemanticReview ? { needsSemanticReview: true } : {}),
        // Căn cứ pháp lý (curate sẵn ở rule) — copy vào check để UI hiện khi MISMATCH.
        ...(rule.legalBasis ? { legalBasis: rule.legalBasis } : {}),
        message: matched
          ? `Khớp: "${leftValue}"`
          : needsSemanticReview
            ? `Chưa khớp theo ký tự — chờ đối chiếu ngữ nghĩa: "${leftValue}" ≠ "${rightValue}"`
            : `Không khớp — "${leftValue}" ≠ "${rightValue}"`,
      });
    }

    const mismatches = checks.filter(c => c.status === 'MISMATCH').length;
    const matches = checks.filter(c => c.status === 'MATCH').length;

    return {
      checks,
      missingDocuments,
      expiredDocuments,
      summary: {
        totalChecks: checks.length,
        matches,
        mismatches,
        missing: missingDocuments.length,
        expired: expiredDocuments.length,
      },
    };
  }
}
