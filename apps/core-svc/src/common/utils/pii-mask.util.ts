import { createHash } from 'crypto';

/**
 * Mask PII khi trả dữ liệu ra ngoài (GET /sessions/:id không có auth guard).
 * Dữ liệu gốc vẫn giữ nguyên trong MongoDB cho pipeline nội bộ
 * (cross-check, scoring, smartform) — chỉ mask ở lớp serialize response.
 * Theo docs/Gov_Trust.md: tối thiểu hoá dữ liệu, chỉ lộ metadata ẩn danh.
 */

/** Số định danh (CCCD/CMND/mã số HKD): giữ 2 đầu + 2 cuối. "031089001234" → "03********34" */
export function maskIdNumber(value: string): string {
  if (value.length <= 4) return '*'.repeat(value.length);
  return value.slice(0, 2) + '*'.repeat(value.length - 4) + value.slice(-2);
}

/** Họ tên: giữ họ + chữ cái đầu các từ sau. "Nguyễn Văn An" → "Nguyễn V. A." */
export function maskName(value: string): string {
  const words = value.trim().split(/\s+/);
  if (words.length <= 1) return value.charAt(0) + '***';
  return [words[0], ...words.slice(1).map(w => `${w.charAt(0)}.`)].join(' ');
}

// Ngày sinh: che ngày/tháng, giữ năm — "15/03/1990" thành dạng che + "/1990".
export function maskDate(value: string): string {
  const match = value.match(/(\d{4})\s*$/);
  return match ? `**/**/${match[1]}` : '**/**/****';
}

/** Địa chỉ: giữ đơn vị hành chính cuối (tỉnh/thành), che phần còn lại. */
export function maskAddress(value: string): string {
  const parts = value.split(',').map(p => p.trim());
  if (parts.length <= 1) return '***';
  return `***, ${parts[parts.length - 1]}`;
}

const ID_PATTERN = /so(CCCD|CMND|GiayTo|DinhDanh)|cccd|cmnd|maSo/i;
const NAME_PATTERN = /hoTen|tenNguoi|nguoiDaiDien|chuHo$/i;
const DATE_PATTERN = /ngaySinh/i;
const ADDRESS_PATTERN = /noiThuongTru|queQuan|diaChi|hoKhau|noiSinh|choO|diaDiem|noiCuTru/i;

/** Mask một giá trị theo ngữ nghĩa của tên field OCR. */
export function maskFieldValue(fieldKey: string, value: unknown): unknown {
  if (typeof value !== 'string' || !value) return value;
  if (ID_PATTERN.test(fieldKey)) return maskIdNumber(value);
  if (DATE_PATTERN.test(fieldKey)) return maskDate(value);
  if (NAME_PATTERN.test(fieldKey)) return maskName(value);
  if (ADDRESS_PATTERN.test(fieldKey)) return maskAddress(value);
  return value;
}

interface OcrSlot {
  fields?: Record<string, { value?: unknown } & Record<string, unknown>>;
  [key: string]: unknown;
}

/** Mask toàn bộ giá trị field trong aiResult.ocrData, giữ nguyên cấu trúc/metadata. */
export function maskOcrData(
  ocrData: Record<string, unknown> | undefined,
): Record<string, unknown> | undefined {
  if (!ocrData) return ocrData;
  const masked: Record<string, unknown> = {};
  for (const [slotId, slot] of Object.entries(ocrData)) {
    const slotObj = slot as OcrSlot;
    if (!slotObj || typeof slotObj !== 'object' || !slotObj.fields) {
      masked[slotId] = slot;
      continue;
    }
    const fields: Record<string, unknown> = {};
    for (const [key, field] of Object.entries(slotObj.fields)) {
      fields[key] = field && typeof field === 'object'
        ? { ...field, value: maskFieldValue(key, field.value) }
        : maskFieldValue(key, field);
    }
    masked[slotId] = { ...slotObj, fields };
  }
  return masked;
}

interface CrossCheckLike {
  checks?: Array<{
    field?: string;
    leftValue?: string;
    rightValue?: string;
    status?: string;
    message?: string;
    [key: string]: unknown;
  }>;
  [key: string]: unknown;
}

/** Mask leftValue/rightValue + message trong kết quả cross-check. */
export function maskCrossCheck(crossCheck: unknown): unknown {
  const cc = crossCheck as CrossCheckLike | undefined;
  if (!cc || typeof cc !== 'object' || !Array.isArray(cc.checks)) return crossCheck;
  const checks = cc.checks.map(check => {
    const field = check.field ?? '';
    const leftValue = typeof check.leftValue === 'string'
      ? (maskFieldValue(field, check.leftValue) as string)
      : check.leftValue;
    const rightValue = typeof check.rightValue === 'string'
      ? (maskFieldValue(field, check.rightValue) as string)
      : check.rightValue;
    const message = check.status === 'MATCH'
      ? `Khớp: "${leftValue}"`
      : check.status === 'MISMATCH'
        ? `Không khớp — "${leftValue}" ≠ "${rightValue}"`
        : check.message;
    return { ...check, leftValue, rightValue, message };
  });
  return { ...cc, checks };
}

// MismatchInfoRule nhúng giá trị gốc vào detail/recommendation theo dạng
// `<field>: "<trái>" ≠ "<phải>"` — mask cả hai vế theo ngữ nghĩa của field.
const MISMATCH_DETAIL_PATTERN = /([\w]+): "([^"]+)" ≠ "([^"]+)"/g;

function maskMismatchText(text: string): string {
  return text.replace(MISMATCH_DETAIL_PATTERN, (_m, field: string, left: string, right: string) =>
    `${field}: "${maskFieldValue(field, left)}" ≠ "${maskFieldValue(field, right)}"`);
}

interface ScoreLike {
  breakdown?: Array<{ detail?: string; [key: string]: unknown }>;
  recommendation?: string;
  [key: string]: unknown;
}

/** Mask giá trị gốc lọt vào breakdown.detail / recommendation của kết quả chấm điểm. */
export function maskScoreResult(score: unknown): unknown {
  const s = score as ScoreLike | undefined;
  if (!s || typeof s !== 'object') return score;
  return {
    ...s,
    ...(Array.isArray(s.breakdown) && {
      breakdown: s.breakdown.map(item =>
        typeof item.detail === 'string' ? { ...item, detail: maskMismatchText(item.detail) } : item),
    }),
    ...(typeof s.recommendation === 'string' && {
      recommendation: maskMismatchText(s.recommendation),
    }),
  };
}

/** Mask aiResult.formData (lưu lại sau khi render smartform) — key dạng "chuHo.hoTen". */
export function maskFormData(
  formData: Record<string, unknown> | undefined,
): Record<string, unknown> | undefined {
  if (!formData) return formData;
  const masked: Record<string, unknown> = {};
  for (const [key, entry] of Object.entries(formData)) {
    const leafKey = key.split('.').pop() ?? key;
    if (entry && typeof entry === 'object' && 'value' in entry) {
      const field = entry as { value?: unknown };
      masked[key] = { ...field, value: maskFieldValue(leafKey, field.value) };
    } else {
      masked[key] = maskFieldValue(leafKey, entry);
    }
  }
  return masked;
}

/** Ẩn danh sessionId cho InsightLog — hash một chiều, không truy ngược được. */
export function anonymizeId(id: string): string {
  return createHash('sha256').update(id).digest('hex').slice(0, 16);
}
