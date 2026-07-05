/**
 * Migration: re-encrypt CCCD cho user còn dữ liệu HASH SHA-256 cũ.
 *
 * Bối cảnh: trước đây auth hash CCCD/địa chỉ (SHA-256, một chiều) → không giải ngược
 * được → form tự điền thiếu soCCCD/queQuan/noiThuongTru. Giờ đã chuyển sang AES
 * (encryptPii, giải ngược được). User đăng ký TRƯỚC khi đổi vẫn còn hash.
 *
 * KHÔI PHỤC ĐƯỢC: username = số CCCD (auth.service: username = dto.username || cccdNumber)
 *   → cccdNumber = encryptPii(username) nếu username là 9-12 chữ số.
 * KHÔNG khôi phục được: cccdOriginLocation / cccdRecentLocation (hash, không có nguồn gốc)
 *   → xoá field hash (đặt về rỗng) để không hiện chuỗi hex; user re-eKYC để có lại.
 *
 * Chạy:
 *   cd apps/core-svc
 *   PII_ENCRYPTION_KEY=$(grep ^PII_ENCRYPTION_KEY= ../../.env | cut -d= -f2-) \
 *     npx ts-node --transpile-only ../../scripts/migrate-cccd-encrypt.ts [--commit]
 *
 * Mặc định DRY-RUN (chỉ in). Thêm --commit để ghi thật.
 */
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { encryptPii, isEncrypted } from '../apps/core-svc/src/common/utils/pii-crypto.util';

// require thay vì import * — khớp cách mongoose expose .connection ở runtime commonjs.
const mongoose = require('mongoose');

function envVal(key: string): string | null {
  const raw = readFileSync(resolve(__dirname, '../.env'), 'utf8');
  const line = raw.split('\n').find(l => l.startsWith(key + '='));
  return line ? line.slice(line.indexOf('=') + 1).trim().replace(/^"|"$/g, '') : null;
}

const HASH_RE = /^[a-f0-9]{64}$/i; // SHA-256 hex = 64 ký tự

async function main() {
  const commit = process.argv.includes('--commit');
  if (!process.env.PII_ENCRYPTION_KEY) {
    process.env.PII_ENCRYPTION_KEY = envVal('PII_ENCRYPTION_KEY') ?? '';
  }
  if (!process.env.PII_ENCRYPTION_KEY) throw new Error('Thiếu PII_ENCRYPTION_KEY');

  const uri = envVal('MONGO_URI');
  const dbName = envVal('MONGO_DB_NAME') ?? undefined;
  if (!uri) throw new Error('Thiếu MONGO_URI');

  await mongoose.connect(uri, { dbName });
  const users = mongoose.connection.collection('users');

  const cursor = users.find({ cccdNumber: { $exists: true, $ne: '' } });
  let scanned = 0, fixed = 0, cleared = 0, skipped = 0;

  for await (const u of cursor) {
    scanned++;
    const set: Record<string, string> = {};

    // cccdNumber: hash → encrypt từ username nếu username là số CCCD hợp lệ.
    if (typeof u.cccdNumber === 'string' && HASH_RE.test(u.cccdNumber)) {
      const uname = String(u.username ?? '');
      if (/^\d{9,12}$/.test(uname)) {
        set.cccdNumber = encryptPii(uname);
        fixed++;
      } else {
        set.cccdNumber = ''; // không suy được số CCCD → xoá hash
        cleared++;
      }
    }
    // địa chỉ: hash không khôi phục được → xoá để không hiện hex.
    for (const f of ['cccdOriginLocation', 'cccdRecentLocation'] as const) {
      const v = u[f];
      if (typeof v === 'string' && v && !isEncrypted(v) && HASH_RE.test(v)) {
        set[f] = '';
      }
    }

    if (Object.keys(set).length === 0) { skipped++; continue; }
    const summary = Object.entries(set)
      .map(([k, val]) => `${k}=${val ? (isEncrypted(val) ? 'AES' : 'set') : 'CLEARED'}`)
      .join(', ');
    console.log(`  ${u.username}: ${summary}`);
    if (commit) await users.updateOne({ _id: u._id }, { $set: set });
  }

  console.log(`\n${commit ? '✓ ĐÃ GHI' : '(DRY-RUN)'} scanned=${scanned} cccd-fixed=${fixed} cccd-cleared=${cleared} skipped=${skipped}`);
  if (!commit) console.log('Thêm --commit để ghi thật.');
  await mongoose.disconnect();
}

main().catch(e => { console.error('ERR', e.message); process.exit(1); });
