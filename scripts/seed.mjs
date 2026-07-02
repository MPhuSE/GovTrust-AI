// Seed dữ liệu tối thiểu để demo pipeline: 1 thủ tục ĐẦY ĐỦ (checklist + crossCheck)
// + 2 loại giấy tờ khớp với OCR mock của ai-svc (CCCD, GIAY_CHUNG_SINH).
// Chạy: node scripts/seed.mjs   (đọc MONGO_URI, MONGO_DB_NAME từ .env)
import mongoose from '/Users/macbook2024/Desktop/Project/GovTrust-AI/apps/core-svc/node_modules/mongoose/index.js';
import { readFileSync } from 'node:fs';

// nạp .env thủ công (không phụ thuộc dotenv)
const env = {};
try {
  for (const line of readFileSync(new URL('../.env', import.meta.url), 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
} catch {}

const MONGO_URI = process.env.MONGO_URI || env.MONGO_URI || 'mongodb://localhost:27017';
const DB = process.env.MONGO_DB_NAME || env.MONGO_DB_NAME || 'govtrust_business';

const documentTypes = [
  {
    code: 'CCCD',
    name: 'Căn cước công dân',
    category: 'NHAN_THAN',
    hasPortrait: true,
    fields: [
      { key: 'hoTen', label: 'Họ tên', dataType: 'string', required: true, isIdentity: true },
      { key: 'soCCCD', label: 'Số CCCD', dataType: 'id_number', required: true, isIdentity: true },
      { key: 'ngaySinh', label: 'Ngày sinh', dataType: 'date', required: true, isIdentity: false },
      { key: 'ngayHetHan', label: 'Ngày hết hạn', dataType: 'date', required: false, isIdentity: false },
    ],
    validity: { hasExpiry: true, expiryField: 'ngayHetHan' },
    aliasCodes: ['CMND'],
    isActive: true,
  },
  {
    code: 'GIAY_CHUNG_SINH',
    name: 'Giấy chứng sinh',
    category: 'HO_TICH',
    fields: [
      { key: 'hoTenMe', label: 'Họ tên mẹ', dataType: 'string', required: true, isIdentity: true },
      { key: 'hoTenCon', label: 'Họ tên con', dataType: 'string', required: true, isIdentity: false },
      { key: 'ngaySinh', label: 'Ngày sinh con', dataType: 'date', required: true, isIdentity: false },
    ],
    validity: { hasExpiry: false },
    isActive: true,
  },
];

const procedures = [
  {
    code: 'DK_KHAI_SINH',
    name: 'Đăng ký khai sinh',
    category: 'HO_TICH',
    description: 'Thủ tục đăng ký khai sinh tại UBND cấp xã/phường',
    department: 'UBND cấp xã/phường',
    legalSourceIds: ['luat-ho-tich-2014-dieu16', 'nghi-dinh-123-2015-dieu15'],
    checklist: [
      { id: 'cccd_cha_me', documentTypeCode: 'CCCD', roleInProcedure: 'CCCD cha/mẹ', isRequired: true, points: 40 },
      { id: 'giay_chung_sinh', documentTypeCode: 'GIAY_CHUNG_SINH', roleInProcedure: 'Giấy chứng sinh', isRequired: true, points: 60 },
    ],
    formFields: [
      { id: 'hoTenCon', label: 'Họ tên con', required: true, sourceMap: ['giay_chung_sinh.hoTenCon'] },
      { id: 'hoTenMe', label: 'Họ tên mẹ', required: true, sourceMap: ['giay_chung_sinh.hoTenMe', 'cccd_cha_me.hoTen'] },
      { id: 'ngaySinhCon', label: 'Ngày sinh con', required: true, sourceMap: ['giay_chung_sinh.ngaySinh'] },
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
    priorityConfig: { baseUrgency: 'MEDIUM', slaDays: 5 },
    isActive: true,
  },
];

async function main() {
  await mongoose.connect(MONGO_URI, { dbName: DB });
  const db = mongoose.connection.db;
  console.log(`Kết nối MongoDB: ${DB}`);

  for (const dt of documentTypes) {
    await db.collection('document_types').updateOne(
      { code: dt.code },
      { $set: { ...dt, updatedAt: new Date() }, $setOnInsert: { createdAt: new Date() } },
      { upsert: true },
    );
  }
  console.log(`✓ document_types: ${documentTypes.length} (upsert)`);

  for (const p of procedures) {
    await db.collection('procedures').updateOne(
      { code: p.code },
      { $set: { ...p, updatedAt: new Date() }, $setOnInsert: { createdAt: new Date() } },
      { upsert: true },
    );
  }
  console.log(`✓ procedures: ${procedures.length} (upsert)`);

  await mongoose.disconnect();
  console.log('Seed hoàn tất.');
}

main().catch((e) => {
  console.error('Seed lỗi:', e.message);
  process.exit(1);
});
