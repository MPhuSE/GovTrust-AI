import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'crypto';

/**
 * Mã hóa PII có thể giải ngược (AES-256-GCM) — thay cho hash SHA-256 một chiều.
 *
 * Lý do: số CCCD / địa chỉ thường trú cần hiển thị lại cho CHÍNH CHỦ (rà soát form,
 * điền tờ khai) và dùng trong cross-check. Hash không giải ngược được nên vô dụng ở
 * các luồng đó. AES-256-GCM giữ dữ liệu-at-rest an toàn nhưng lấy lại được khi cần.
 *
 * Định dạng ciphertext: "enc:v1:" + base64(iv[12] ‖ authTag[16] ‖ ciphertext).
 * Prefix giúp phân biệt với hash SHA-256 cũ (64 hex, không prefix) để migrate dần.
 *
 * Key: env PII_ENCRYPTION_KEY (khuyến nghị 32 byte hex/base64). Nếu ngắn hơn,
 * derive bằng SHA-256 để luôn đủ 32 byte cho AES-256.
 */

const PREFIX = 'enc:v1:';
const IV_LEN = 12; // GCM chuẩn 96-bit
const TAG_LEN = 16;

function resolveKey(): Buffer {
  const raw = process.env.PII_ENCRYPTION_KEY ?? '';
  if (!raw) {
    throw new Error('PII_ENCRYPTION_KEY chưa được cấu hình — không thể mã hóa PII');
  }
  // Derive về đúng 32 byte bất kể độ dài/định dạng key đầu vào.
  return createHash('sha256').update(raw).digest();
}

/** Mã hóa một chuỗi PII. Trả về chuỗi có prefix "enc:v1:". */
export function encryptPii(value: string): string {
  const iv = randomBytes(IV_LEN);
  const cipher = createCipheriv('aes-256-gcm', resolveKey(), iv);
  const ciphertext = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return PREFIX + Buffer.concat([iv, tag, ciphertext]).toString('base64');
}

/** Kiểm tra một giá trị có phải ciphertext do encryptPii tạo ra không. */
export function isEncrypted(value: string | null | undefined): boolean {
  return typeof value === 'string' && value.startsWith(PREFIX);
}

/**
 * Giải mã. Trả về null nếu:
 * - value rỗng
 * - value là hash SHA-256 cũ (không có prefix → không giải ngược được)
 * - giải mã thất bại (sai key / dữ liệu hỏng)
 * Người gọi tự quyết định fallback (hiện placeholder / mask) khi nhận null.
 */
export function decryptPii(value: string | null | undefined): string | null {
  if (!isEncrypted(value)) return null;
  try {
    const buf = Buffer.from((value as string).slice(PREFIX.length), 'base64');
    const iv = buf.subarray(0, IV_LEN);
    const tag = buf.subarray(IV_LEN, IV_LEN + TAG_LEN);
    const ciphertext = buf.subarray(IV_LEN + TAG_LEN);
    const decipher = createDecipheriv('aes-256-gcm', resolveKey(), iv);
    decipher.setAuthTag(tag);
    return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString('utf8');
  } catch {
    return null;
  }
}
