#!/usr/bin/env node
/**
 * Seed 1 tài khoản CÁN BỘ (OFFICER) vào Atlas để test Bước 9–11 (Gov Re-Check,
 * Priority, InsightMap).
 *
 * Vì sao cần script này: đăng ký công khai (POST /auth/register) nay LUÔN tạo
 * CITIZEN — client không thể tự nâng quyền lên OFFICER/ADMIN nữa (vá lỗ hổng
 * leo thang đặc quyền). Vì vậy tài khoản cán bộ chỉ được cấp qua seed nội bộ.
 *
 * KHÔNG đụng account thật; chỉ upsert theo username cố định.
 *
 * Chạy: node scripts/seed-officer.js
 *   (tuỳ chọn) OFFICER_USERNAME=canbo1 OFFICER_PASSWORD='CanBo@1234' node scripts/seed-officer.js
 */
const fs = require('fs');
const path = require('path');

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

async function main() {
  const env = loadEnv();
  const uri = env.MONGO_URI;
  const dbName = env.MONGO_DB_NAME || 'govtrust_business';
  if (!uri) throw new Error('MONGO_URI thiếu trong .env');

  const USERNAME = process.env.OFFICER_USERNAME || 'canbo_test';
  const PASSWORD = process.env.OFFICER_PASSWORD || 'CanBo@1234';
  const ROLE = (process.env.OFFICER_ROLE || 'OFFICER').toUpperCase();
  if (ROLE !== 'OFFICER' && ROLE !== 'ADMIN') {
    throw new Error(`OFFICER_ROLE phải là OFFICER hoặc ADMIN (nhận: ${ROLE})`);
  }

  const mongoose = require(path.join(ROOT, 'apps/core-svc/node_modules/mongoose'));
  await mongoose.connect(uri, { dbName });
  const users = mongoose.connection.collection('users');

  const passwordHash = await bcrypt.hash(PASSWORD, 12);

  const doc = {
    username: USERNAME,
    passwordHash,
    fullName: 'Cán bộ Một Cửa',
    role: ROLE,
    kycStatus: 'NONE',
    phoneNumber: '0900000000',
    email: `${USERNAME}@govtrust.local`,
    updatedAt: new Date(),
  };

  const existing = await users.findOne({ username: USERNAME });
  if (existing) {
    await users.updateOne({ username: USERNAME }, { $set: doc });
    console.log(`↻ Cập nhật ${ROLE}: ${USERNAME} (_id=${existing._id})`);
  } else {
    doc.createdAt = new Date();
    const r = await users.insertOne(doc);
    console.log(`＋ Tạo ${ROLE}: ${USERNAME} (_id=${r.insertedId})`);
  }
  console.log(`   Đăng nhập demo: username=${USERNAME}  password=${PASSWORD}`);
  console.log(`   → đăng nhập sẽ redirect /dashboard (Officer queue + InsightMap)`);

  await mongoose.disconnect();
}

main().catch(e => { console.error('LỖI seed:', e.message); process.exit(1); });
