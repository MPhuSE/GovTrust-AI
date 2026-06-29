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
  const maxLen = Math.max(a.length, b.length);
  if (maxLen === 0) return true;
  let diff = 0;
  const shorter = a.length <= b.length ? a : b;
  const longer = a.length <= b.length ? b : a;
  for (let i = 0; i < shorter.length; i++) {
    if (shorter[i] !== longer[i]) diff++;
  }
  diff += longer.length - shorter.length;
  return diff / maxLen <= 1 - tolerance;
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
    for (const doc of documents) {
      const expiryField = doc.fields['ngayHetHan'] ?? doc.fields['coGiaTriDen'];
      if (!expiryField) continue;
      const expiry = new Date(expiryField.value);
      if (!isNaN(expiry.getTime()) && expiry < now) {
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
