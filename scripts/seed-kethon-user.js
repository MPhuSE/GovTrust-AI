#!/usr/bin/env node
/**
 * Seed 1 user test NỮ (ĐINH NGỌC ANH) đã eKYC VERIFIED vào Atlas.
 *
 * Vì sao: giấy kết hôn mẫu THẬT (VNPT đọc layout thật) cố định vợ = ĐINH NGỌC ANH.
 * Cross-check thủ tục khai sinh hướng về MẸ/VỢ (R1 mẹ, R3 vợ ↔ người yêu cầu).
 * → người yêu cầu (eKYC) phải là NỮ tên ĐINH NGỌC ANH thì happy-path mới MATCH.
 * KHÔNG đụng account thật; chỉ upsert theo username test cố định.
 *
 * Mã hóa PII trùng khớp encryptPii (pii-crypto.util.ts): AES-256-GCM,
 * key = sha256(PII_ENCRYPTION_KEY), ciphertext = "enc:v1:" + base64(iv12‖tag16‖ct).
 *
 * Chạy: node scripts/seed-kethon-user.js
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ROOT = path.resolve(__dirname, '..');
const bcrypt = require(path.join(ROOT, 'apps/core-svc/node_modules/bcrypt'));

// ── đọc .env thủ công (core-svc không có dotenv trong node_modules) ──
function loadEnv() {
  const txt = fs.readFileSync(path.join(ROOT, '.env'), 'utf8');
  const env = {};
  for (const line of txt.split('\n')) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
  return env;
}

const PREFIX = 'enc:v1:';
function encryptPii(value, key32) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key32, iv);
  const ct = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return PREFIX + Buffer.concat([iv, tag, ct]).toString('base64');
}

async function main() {
  const env = loadEnv();
  const uri = env.MONGO_URI;
  const dbName = env.MONGO_DB_NAME || 'govtrust_business';
  const piiKey = env.PII_ENCRYPTION_KEY;
  if (!uri) throw new Error('MONGO_URI thiếu trong .env');
  if (!piiKey) throw new Error('PII_ENCRYPTION_KEY thiếu trong .env — không mã hóa được PII');
  const key32 = crypto.createHash('sha256').update(piiKey).digest();

  // mongoose có sẵn trong core-svc node_modules
  const mongoose = require(path.join(ROOT, 'apps/core-svc/node_modules/mongoose'));
  await mongoose.connect(uri, { dbName });
  const users = mongoose.connection.collection('users');

  const USERNAME = 'dinhngocanh_test';
  const PASSWORD = 'Test@1234';
  const passwordHash = await bcrypt.hash(PASSWORD, 12);

  const doc = {
    username: USERNAME,
    passwordHash,
    fullName: 'Đinh Ngọc Anh',
    role: 'CITIZEN',
    kycStatus: 'VERIFIED',
    // Trùng vợ trên giấy kết hôn THẬT (VNPT đọc: "ĐINH NGỌC ANH") → R1/R3 MATCH.
    cccdFullName: 'ĐINH NGỌC ANH',
    cccdBirthDay: '25/06/1993',      // giấy kết hôn OCR ra 1893 (lỗi mộc mờ) — dùng năm hợp lý
    cccdGender: 'Nữ',                // Nữ → hệ thống gán vai trò MẸ
    cccdNationality: 'Việt Nam',
    cccdNumber: encryptPii('034093001456', key32),
    cccdOriginLocation: encryptPii('Xã Hưng Hà, huyện Hưng Nhân, tỉnh Thái Bình', key32),
    cccdRecentLocation: encryptPii('Xã Hưng Hà, huyện Hưng Nhân, tỉnh Thái Bình', key32),
    cccdValidDate: '25/06/2043',
    cccdIssueDate: '11/12/2003',
    cccdIssuePlace: 'Cục Cảnh sát QLHC về TTXH',
    kycFaceMatchProb: 0.99,
    kycVerifiedAt: new Date('2026-07-01T00:00:00Z'),
    phoneNumber: '0987654321',
    email: 'dinhngocanh.test@govtrust.local',
    updatedAt: new Date('2026-07-04T00:00:00Z'),
  };

  const existing = await users.findOne({ username: USERNAME });
  if (existing) {
    await users.updateOne({ username: USERNAME }, { $set: doc });
    console.log(`↻ Cập nhật user test: ${USERNAME} (_id=${existing._id})`);
  } else {
    doc.createdAt = new Date('2026-07-04T00:00:00Z');
    const r = await users.insertOne(doc);
    console.log(`＋ Tạo user test: ${USERNAME} (_id=${r.insertedId})`);
  }
  console.log(`   Đăng nhập demo: username=${USERNAME}  password=${PASSWORD}`);
  console.log(`   eKYC: ĐINH NGỌC ANH · Nữ (→ vai trò MẸ) · khớp vợ trên giấy kết hôn thật`);

  await mongoose.disconnect();
}

main().catch(e => { console.error('LỖI seed:', e.message); process.exit(1); });
