import {
  ProcedureTemplate,
  ExtractedDocument,
  CrossCheckResult,
  FieldCheck,
  CheckStatus,
  Severity,
} from './types';

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
): string | undefined {
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

      if (leftValue === undefined || rightValue === undefined) {
        checks.push({
          ruleName: rule.name,
          field: rule.right.split('.')[1] ?? rule.right,
          left: rule.left,
          right: rule.right,
          leftValue,
          rightValue,
          status: 'MISSING',
          severity: rule.severityIfMismatch,
          message: `Không đọc được dữ liệu để so sánh`,
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
      }

      const status: CheckStatus = matched ? 'MATCH' : 'MISMATCH';
      const severity: Severity = matched ? 'LOW' : rule.severityIfMismatch;

      checks.push({
        ruleName: rule.name,
        field: rule.right.split('.')[1] ?? rule.right,
        left: rule.left,
        right: rule.right,
        leftValue,
        rightValue,
        status,
        severity,
        message: matched
          ? `Khớp: "${leftValue}"`
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
