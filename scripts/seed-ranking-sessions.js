#!/usr/bin/env node
/**
 * Seed các SESSION đã nộp (CONFIRMED) để test RANKING/queue ưu tiên bên OFFICER
 * và dashboard thống kê. Dựa trên user collection thật (CITIZEN) + procedures thật.
 *
 * Ranking (apps/core-svc/.../priority.service.ts) tính hạng A/B/C/D từ:
 *   - score (aiResult.score.score)
 *   - có lỗi CRITICAL trong breakdown không
 *   - daysLeft = createdAt + procedure.slaDays - now
 * Queue CHỈ lấy status = CONFIRMED. Vì vậy tất cả session seed đều CONFIRMED.
 *
 * Để ra đủ hạng, ta phân bổ:
 *   - score thấp (<60) hoặc có CRITICAL → hạng A
 *   - createdAt cũ (gần chạm SLA) → hạng A/B
 *   - score cao + mới tạo → hạng C/D
 *
 * Chạy: node scripts/seed-ranking-sessions.js
 *   (tuỳ chọn) SEED_COUNT=30 node scripts/seed-ranking-sessions.js
 *   Xoá seed cũ:  SEED_RESET=1 node scripts/seed-ranking-sessions.js
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const mongoose = require(path.join(ROOT, 'apps/core-svc/node_modules/mongoose'));

function loadEnv() {
  const txt = fs.readFileSync(path.join(ROOT, '.env'), 'utf8');
  const env = {};
  for (const line of txt.split('\n')) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
  return env;
}

// Đánh dấu để phân biệt session seed với session thật (xoá/định danh dễ dàng).
const SEED_TAG = 'RANKING_SEED';

const DAY = 86400000;

// Kịch bản: mỗi phần tử = 1 hồ sơ đã nộp với đặc tính riêng để ra hạng mong muốn.
// grade/score chỉ để hiển thị; hạng A/B/C/D do priority.service tự tính lại lúc GET /priority.
function buildScenarios(procByCode) {
  // helper crossCheck có N mismatch — shape KHỚP CrossChecker thật:
  // { ruleName, field, leftValue, rightValue, status, severity, message, legalBasis }
  // Backend maskCrossCheck rebuild message từ leftValue/rightValue nên PHẢI có 2 giá trị này.
  const mkCross = (matches, mismatches) => {
    const checks = [];
    for (let i = 0; i < matches; i++) {
      const v = ['NGUYỄN ĐĂNG PHÚ', 'LÊ THÁI HƯNG', '120 m²', 'Số 15 Nam Cường'][i % 4];
      checks.push({
        ruleName: 'Đối chiếu thông tin định danh khớp giấy tờ gốc',
        field: 'hoTen', leftValue: v, rightValue: v,
        status: 'MATCH', severity: 'LOW', message: `Khớp: "${v}"`,
      });
    }
    // [ruleName, field, trái, phải, legalBasis]
    const errRows = [
      ['Họ tên người yêu cầu khớp giấy tờ gốc', 'hoTen', 'NGUYỄN VĂN A', 'NGUYỄN VĂN B', 'Điều 16 Luật Hộ tịch 2014'],
      ['Chủ sở hữu khớp bên chuyển nhượng', 'tenChuSoHuu', 'LÊ VĂN HÙNG', 'TRẦN VĂN MINH', 'Điều 45 Luật Đất đai 2024'],
      ['Diện tích thửa đất khớp hợp đồng', 'dienTich', '120 m²', '150 m²', 'Điều 45 Luật Đất đai 2024'],
      ['Chủ hộ cũ khớp người ủy quyền', 'hoTenChuHo', 'LÊ THÁI HƯNG', 'TRẦN VĂN SỬU', 'Điều 85 NĐ 168/2025/NĐ-CP'],
    ];
    for (let i = 0; i < mismatches; i++) {
      const [ruleName, field, left, right, article] = errRows[i % errRows.length];
      checks.push({
        ruleName, field, leftValue: left, rightValue: right,
        status: 'MISMATCH', severity: i === 0 ? 'HIGH' : 'MEDIUM',
        message: `Không khớp — "${left}" ≠ "${right}"`,
        legalBasis: { article, note: 'Thông tin phải đồng nhất giữa các giấy tờ để xác định đúng nhân thân/tài sản.' },
      });
    }
    return {
      checks,
      missingDocuments: [],
      expiredDocuments: [],
      summary: { totalChecks: matches + mismatches, matches, mismatches, missing: 0, expired: 0 },
    };
  };

  // Shape breakdown KHỚP scoring thật: { ruleId, passed, impact, severity, detail }
  const mkScore = (score, hasCritical) => ({
    score,
    grade: score >= 85 ? 'A' : score >= 70 ? 'B' : score >= 60 ? 'C' : 'D',
    breakdown: hasCritical
      ? [{ ruleId: 'mismatch-info', passed: false, impact: -40, severity: 'CRITICAL', detail: 'Thông tin không khớp giữa giấy tờ và tờ khai — cần kiểm tra thủ công.' }]
      : score < 90
        ? [{ ruleId: 'minor-deduction', passed: false, impact: -(100 - score), severity: 'MEDIUM', detail: 'Một số thông tin cần rà soát bổ sung.' }]
        : [],
    canSubmit: score >= 60,
    recommendation: score >= 60 ? 'Hồ sơ đạt yêu cầu.' : 'Hồ sơ cần bổ sung/kiểm tra kỹ.',
  });

  // [procedureCode, score, hasCritical, ageDays, matches, mismatches]
  const rows = [
    // ── Hạng A: điểm thấp / có CRITICAL / gần chạm SLA ──
    ['CHUYEN_NHUONG_QSDD', 45, true,  4, 1, 3],
    ['HKD_THAY_DOI',       52, false, 5, 2, 2],
    ['DANG_KY_KHAI_SINH',  58, false, 4, 2, 2],
    ['DK_THUONG_TRU',      40, true,  1, 0, 3],
    ['CHUYEN_NHUONG_QSDD', 88, false, 5, 4, 0], // điểm cao nhưng gần SLA → A do daysLeft<=1
    // ── Hạng B: điểm khá + hạn còn ~2-3 ngày ──
    ['HKD_CAP_LAI',        74, false, 3, 3, 1],
    ['DANG_KY_KHAI_SINH',  78, false, 3, 3, 1],
    ['XAC_NHAN_TINH_TRANG_HON_NHAN', 82, false, 3, 4, 0],
    ['HKD_THANH_LAP',      71, false, 2, 3, 1],
    ['CAP_BAN_SAO_TRICH_LUC_KHAI_SINH', 90, false, 3, 4, 0],
    // ── Hạng C: điểm ổn, mới tạo ──
    ['DK_LAI_KHAI_SINH',   68, false, 1, 2, 1],
    ['HKD_CHAM_DUT',       66, false, 0, 2, 1],
    ['CHUYEN_NHUONG_QSDD', 64, false, 1, 3, 1],
    ['DANG_KY_KHAI_SINH',  62, false, 0, 2, 1],
    // ── Hạng D: điểm cao, mới tạo, không lỗi ──
    ['HKD_THAY_DOI',       95, false, 0, 4, 0],
    ['XAC_NHAN_TINH_TRANG_HON_NHAN', 100, false, 0, 3, 0],
    ['DANG_KY_KHAI_SINH',  92, false, 0, 4, 0],
    ['DK_THUONG_TRU',      89, false, 1, 3, 0],
    ['CAP_BAN_SAO_TRICH_LUC_KHAI_SINH', 97, false, 0, 4, 0],
    ['HKD_CAP_LAI',        85, false, 0, 3, 0],
  ];

  return rows
    .filter(([code]) => procByCode[code])
    .map(([code, score, hasCritical, ageDays, matches, mismatches], idx) => ({
      procedureId: procByCode[code],
      procedureCode: code,
      score: mkScore(score, hasCritical),
      crossCheck: mkCross(matches, mismatches),
      ageDays,
      idx,
    }));
}

// Sinh giá trị tờ khai (smartForm.fields) từ formFields của procedure + thông tin citizen.
// Value đoán theo label để tờ khai trông thật khi officer xem. Không cần chính xác pháp lý.
function buildSmartForm(proc, user) {
  if (!proc || !Array.isArray(proc.formFields)) return { procedureName: proc && proc.name, fields: [] };
  const name = user.fullName || 'Nguyễn Văn A';
  const guess = (id, label) => {
    const L = (label || '').toLowerCase();
    const K = (id || '').toLowerCase();
    // Số/mã đứng TRƯỚC các match địa chỉ/tên để không bị nuốt nhầm.
    if (L.includes('số giấy') || L.includes('số gcn') || L.includes('số định danh') || L.includes('số sổ')) return 'CT' + Math.floor(100000 + Math.random() * 899999);
    if (L.includes('cccd') || L.includes('căn cước') || L.includes('cmnd')) return '0' + Math.floor(100000000000 + Math.random() * 899999999999);
    if (L.includes('mã số') || L.includes('đkhkd')) return '12.A8.0' + Math.floor(10000 + Math.random() * 89999);
    // Tên riêng theo vai trò — cha/mẹ/chủ hộ KHÁC tên người yêu cầu để tờ khai thật.
    if (L.includes('họ tên cha') || K.includes('cha')) return 'NGUYỄN VĂN HẢI';
    if (L.includes('họ tên mẹ') || K.includes('me.') || K.endsWith('.me')) return 'TRẦN THỊ LAN';
    if (L.includes('chủ hộ') && (L.includes('họ tên') || L.includes('đồng ý'))) return 'PHẠM VĂN CƯỜNG';
    if (L.includes('bên chuyển') && L.includes('họ tên')) return 'TRẦN VĂN MINH';
    if (L.includes('người được') && L.includes('họ tên')) return 'LÊ THỊ HƯƠNG';
    if (K.endsWith('.hoten') || L.includes('họ tên') || L.includes('họ và tên')) return name.toUpperCase();
    if (L.includes('ngày sinh')) return String(10 + (name.length % 18)).padStart(2, '0') + '/0' + (1 + name.length % 8) + '/19' + (85 + name.length % 14);
    if (L.includes('điện thoại') || L.includes('sđt')) return user.phoneNumber || '09' + Math.floor(10000000 + Math.random() * 89999999);
    if (L.includes('email')) return user.email || 'congdan@example.com';
    if (L.includes('cơ quan')) return 'UBND phường Nam Cường, TP Lào Cai';
    if (L.includes('địa chỉ') || L.includes('nơi cư trú') || L.includes('nơi thường trú') || L.includes('trụ sở') || L.includes('chỗ ở')) return 'Số 15, Tổ 8, phường Nam Cường, TP Lào Cai';
    if (L.includes('quan hệ')) return 'Chủ hộ';
    if (L.includes('tên hộ kinh doanh')) return 'HỘ KINH DOANH ' + name.toUpperCase();
    if (L.includes('ngành') || L.includes('nghề')) return 'Bán lẻ hàng hóa tổng hợp';
    if (L.includes('vốn')) return '50.000.000 đồng';
    if (L.includes('diện tích')) return '120 m²';
    if (L.includes('thửa')) return '42';
    if (L.includes('bản đồ')) return '15';
    if (L.includes('giới tính')) return 'Nam';
    if (L.includes('quốc tịch')) return 'Việt Nam';
    if (L.includes('dân tộc')) return 'Kinh';
    if (L.includes('nơi sinh')) return 'Bệnh viện Đa khoa tỉnh Lào Cai';
    return '';
  };
  const fields = proc.formFields.map((f) => ({
    key: f.id,
    label: f.label,
    value: f.defaultValue != null ? f.defaultValue : guess(f.id, f.label),
    required: Boolean(f.required),
    filled: true,
  }));
  return { procedureName: proc.name, fields };
}

async function main() {
  const env = loadEnv();
  const uri = env.MONGO_URI;
  const dbName = env.MONGO_DB_NAME || 'govtrust_business';
  if (!uri) throw new Error('MONGO_URI thiếu trong .env');

  await mongoose.connect(uri, { dbName });
  const db = mongoose.connection.db;

  // Xoá seed cũ nếu yêu cầu (hoặc luôn dọn để idempotent)
  const delRes = await db.collection('sessions').deleteMany({ seedTag: SEED_TAG });
  console.log(`Đã xoá ${delRes.deletedCount} session seed cũ (seedTag=${SEED_TAG}).`);
  if (process.env.SEED_RESET === '1') {
    await mongoose.disconnect();
    console.log('SEED_RESET=1 → chỉ dọn, không tạo mới. Xong.');
    return;
  }

  const users = await db.collection('users').find({ role: 'CITIZEN' }).project({ fullName: 1, phoneNumber: 1, email: 1 }).toArray();
  if (users.length === 0) throw new Error('Không có user CITIZEN nào để gán session.');

  const procs = await db.collection('procedures').find({}).project({ code: 1, name: 1, formFields: 1 }).toArray();
  const procByCode = {};
  const procById = {};
  for (const p of procs) { procByCode[p.code] = p._id; procById[String(p._id)] = p; }

  const scenarios = buildScenarios(procByCode);
  const now = Date.now();
  const docs = scenarios.map((sc, i) => {
    const user = users[i % users.length]; // xoay vòng qua các citizen
    const createdAt = new Date(now - sc.ageDays * DAY - (i % 5) * 3600_000); // lệch giờ cho tự nhiên
    const proc = procById[String(sc.procedureId)];
    const smartForm = buildSmartForm(proc, user);
    return {
      userId: user._id,
      procedureId: sc.procedureId,
      status: 'CONFIRMED',
      seedTag: SEED_TAG,
      pipeline: { step: 'CONFIRMED', steps: { ocr: 'done', crossCheck: 'done', score: 'done' }, updatedAt: createdAt },
      documents: [],
      aiResult: {
        ocrData: {},
        crossCheck: sc.crossCheck,
        score: sc.score,
        smartForm,
      },
      // TTL: giữ 7 ngày để demo không bị TTL xoá sớm (session thật để 24h)
      expiresAt: new Date(now + 7 * DAY),
      createdAt,
      updatedAt: createdAt,
      __v: 0,
    };
  });

  const res = await db.collection('sessions').insertMany(docs);
  console.log(`Đã tạo ${res.insertedCount} session CONFIRMED (seedTag=${SEED_TAG}).`);

  // Tổng kết phân bổ
  const byProc = {};
  for (const sc of scenarios) byProc[sc.procedureCode] = (byProc[sc.procedureCode] || 0) + 1;
  console.log('Phân bổ theo thủ tục:');
  for (const [code, n] of Object.entries(byProc)) console.log(`  ${code}: ${n}`);
  console.log(`Gán cho ${users.length} công dân: ${users.map(u => u.fullName).join(', ')}`);
  console.log('\nMở queue OFFICER (/priority) để xem ranking A/B/C/D.');

  await mongoose.disconnect();
}

main().catch((e) => { console.error(e); process.exit(1); });
