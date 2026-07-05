// E2E test — chạy đủ pipeline 11 bước qua REST API của core-svc, có ASSERTION thật.
// Yêu cầu: full stack đang chạy (core-svc :4000, Mongo, Redis, ai-svc) +
//          đã seed officer: `node scripts/seed-officer.js`.
const BASE = process.env.BASE || 'http://localhost:4000';
const log = (s, o) => console.log(`\n### ${s}`, o !== undefined ? JSON.stringify(o).slice(0, 400) : '');
const j = async (r) => { const t = await r.text(); try { return JSON.parse(t); } catch { return t; } };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

let passed = 0;
function assert(cond, msg) {
  if (!cond) throw new Error(`ASSERT FAIL: ${msg}`);
  passed++;
  console.log(`   ✓ ${msg}`);
}

async function main() {
  // -- Auth: 1 công dân + 1 cán bộ
  const rnd = Math.floor(Math.random() * 1e6);
  const citizen = await j(await fetch(`${BASE}/auth/register`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ username: `dan${rnd}`, password: 'MatKhau@123', fullName: 'Nguyễn Văn Dân' }) }));
  log('register CITIZEN', { role: citizen.user?.role, hasToken: !!citizen.access_token });
  assert(citizen.access_token, 'công dân đăng ký nhận được token');
  assert(citizen.user?.role === 'CITIZEN', 'công dân có role CITIZEN');

  // -- BẢO MẬT: register KHÔNG cho tự tạo OFFICER (dù client cố gửi role)
  const escalate = await j(await fetch(`${BASE}/auth/register`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ username: `hack${rnd}`, password: 'MatKhau@123', fullName: 'Kẻ Gian', role: 'OFFICER' }) }));
  assert(escalate.user?.role === 'CITIZEN', 'register bỏ qua role client gửi → luôn CITIZEN (chống leo thang đặc quyền)');

  // OFFICER chỉ tạo qua seed script nội bộ.
  const OFFICER_USERNAME = process.env.OFFICER_USERNAME || 'canbo_test';
  const OFFICER_PASSWORD = process.env.OFFICER_PASSWORD || 'CanBo@1234';
  const officer = await j(await fetch(`${BASE}/auth/login`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ username: OFFICER_USERNAME, password: OFFICER_PASSWORD }) }));
  if (!officer.access_token) throw new Error(`Không đăng nhập được OFFICER '${OFFICER_USERNAME}'. Chạy: node scripts/seed-officer.js`);
  log('login OFFICER', { role: officer.user?.role });
  assert(officer.user?.role === 'OFFICER', 'tài khoản seed có role OFFICER');
  const AUTHC = { authorization: `Bearer ${citizen.access_token}` };
  const AUTHO = { authorization: `Bearer ${officer.access_token}` };

  // -- Bước 1: HoSoBot identify
  const ident = await j(await fetch(`${BASE}/procedures/identify`, { method: 'POST', headers: { 'content-type': 'application/json', ...AUTHC }, body: JSON.stringify({ userQuery: 'Tôi muốn đăng ký khai sinh cho con' }) }));
  log('B1 identify', ident);

  // -- Lấy procedureId
  const procs = await j(await fetch(`${BASE}/procedures`, { headers: AUTHC }));
  assert(Array.isArray(procs) && procs.length > 0, 'lấy được danh sách thủ tục');
  const proc = procs.find((p) => p.code === 'DK_KHAI_SINH') || procs[0];
  const procedureId = proc._id;
  log('procedure', { code: proc.code, procedureId, checklist: proc.checklist?.length });

  // -- Tạo session
  const sess = await j(await fetch(`${BASE}/sessions`, { method: 'POST', headers: { 'content-type': 'application/json', ...AUTHC }, body: JSON.stringify({ procedureId }) }));
  const sid = sess._id;
  log('create session', { sid, status: sess.status });
  assert(sid, 'tạo session thành công');
  assert(sess.status === 'INIT', 'session mới ở trạng thái INIT');

  // -- Bước 2+3: upload + OCR cho 2 giấy
  const docs = [
    { code: 'CCCD', checklistId: 'cccd_cha_me' },
    { code: 'GIAY_CHUNG_SINH', checklistId: 'giay_chung_sinh' },
  ];
  for (const d of docs) {
    const fd = new FormData();
    fd.append('sessionId', sid);
    fd.append('documentTypeCode', d.code);
    fd.append('checklistId', d.checklistId);
    fd.append('file', new Blob([new Uint8Array([1, 2, 3, 4])], { type: 'image/jpeg' }), `${d.code}.jpg`);
    const up = await j(await fetch(`${BASE}/documents/upload`, { method: 'POST', headers: AUTHC, body: fd }));
    log(`B2 upload ${d.code}`, up);
    const ocr = await j(await fetch(`${BASE}/documents/${sid}/ocr/${d.code}`, { method: 'POST', headers: { 'content-type': 'application/json', ...AUTHC }, body: JSON.stringify({ checklistId: d.checklistId }) }));
    log(`B3 trigger OCR ${d.code}`, ocr);
  }

  // -- Poll tới khi OCR xong (BullMQ consumer ghi ocrData)
  let ocrDone = false;
  for (let i = 0; i < 20; i++) {
    await sleep(1000);
    const s = await j(await fetch(`${BASE}/sessions/${sid}`, { headers: AUTHC }));
    const keys = Object.keys(s.aiResult?.ocrData || {});
    if (keys.length >= 2) { ocrDone = true; log('OCR done', { ocrKeys: keys, step: s.pipeline?.steps?.ocr }); break; }
  }
  assert(ocrDone, 'OCR hoàn tất (ocrData có ≥2 giấy) trong 20s');

  // -- Bước 4: CrossCheck
  const cc = await j(await fetch(`${BASE}/sessions/${sid}/crosscheck`, { method: 'POST', headers: AUTHC }));
  log('B4 crosscheck', { summary: cc.summary, missing: cc.missingDocuments, checks: cc.checks?.map((x) => `${x.field}:${x.status}`) });
  assert(cc.summary || Array.isArray(cc.checks), 'CrossCheck trả về summary/checks');

  // -- Bước 5: Score
  const sc = await j(await fetch(`${BASE}/sessions/${sid}/score`, { method: 'POST', headers: AUTHC }));
  log('B5 score', { score: sc.score, grade: sc.grade, canSubmit: sc.canSubmit, breakdown: sc.breakdown?.map((b) => b.ruleId) });
  assert(typeof sc.score === 'number', 'Score trả về điểm số');
  assert(['A', 'B', 'C', 'D'].includes(sc.grade), 'Score có grade A/B/C/D');

  // -- Bước 6: LawGuard
  const lg = await j(await fetch(`${BASE}/sessions/${sid}/lawguard`, { method: 'POST', headers: AUTHC }));
  log('B6 lawguard', { alerts: (lg.alerts || []).length, disclaimer: !!lg.disclaimer });

  // -- Bước 7: SmartForm — luôn sinh được, KHÔNG bị chặn theo điểm
  const sf = await j(await fetch(`${BASE}/sessions/${sid}/smartform`, { method: 'POST', headers: AUTHC }));
  log('B7 smartform', { hasFields: Array.isArray(sf.fields), n: sf.fields?.length });
  // Poll vì smartform có thể chạy async qua queue.
  let formOk = false;
  for (let i = 0; i < 10; i++) {
    const s = await j(await fetch(`${BASE}/sessions/${sid}`, { headers: AUTHC }));
    if (Array.isArray(s.aiResult?.smartForm?.fields) && s.aiResult.smartForm.fields.length > 0) { formOk = true; break; }
    await sleep(1000);
  }
  assert(formOk, 'SmartForm sinh được form (kể cả điểm thấp — đã bỏ gate canSubmit)');

  // -- Bước 8: Confirm
  const cf = await j(await fetch(`${BASE}/sessions/${sid}/confirm`, { method: 'POST', headers: AUTHC }));
  log('B8 confirm', { status: cf.status || cf });
  const afterConfirm = await j(await fetch(`${BASE}/sessions/${sid}`, { headers: AUTHC }));
  assert(afterConfirm.status === 'CONFIRMED', 'sau confirm → status CONFIRMED');

  // -- Bước 9: Gov Re-Check (officer) — có quyết định + ghi chú
  const rc = await j(await fetch(`${BASE}/sessions/${sid}/recheck`, { method: 'POST', headers: { 'content-type': 'application/json', ...AUTHO }, body: JSON.stringify({ decision: 'NEED_MORE', note: 'Bổ sung giấy xác nhận cư trú' }) }));
  log('B9 recheck', { completeness: rc.govReCheck?.completenessLevel, riskFlags: rc.govReCheck?.riskFlags?.map((f) => f.type) });
  assert(['DAY_DU', 'CAN_BO_SUNG', 'CAN_KIEM_TRA_KY'].includes(rc.govReCheck?.completenessLevel), 'Recheck phân loại completenessLevel hợp lệ');

  // -- Kết quả cán bộ PHẢI phản hồi về công dân (trang track đọc govReCheck + officerNotes + decision)
  const afterRecheck = await j(await fetch(`${BASE}/sessions/${sid}`, { headers: AUTHC }));
  assert(afterRecheck.status === 'RECHECKED', 'sau recheck → status RECHECKED');
  assert(afterRecheck.govReCheck?.completenessLevel, 'công dân xem được đánh giá hệ thống (govReCheck)');
  assert(afterRecheck.officerNotes === 'Bổ sung giấy xác nhận cư trú', 'công dân xem được ghi chú của cán bộ');
  assert(afterRecheck.priority?.finalDecisionByOfficer === 'NEED_MORE', 'công dân xem được quyết định của cán bộ');

  // -- Bước 10: Priority (officer)
  const pr = await j(await fetch(`${BASE}/priority`, { headers: AUTHO }));
  log('B10 priority', { queue: pr.length, top: pr[0]?.priority });
  assert(Array.isArray(pr), 'Priority queue trả về mảng (không 500 dù có session mồ côi)');

  // -- Bước 11: Insights (officer)
  const ins = await j(await fetch(`${BASE}/insights/dashboard?days=30`, { headers: AUTHO }));
  log('B11 insights', { avgScore: ins.avgScore, topErrors: ins.topErrors });
  assert(ins && typeof ins === 'object', 'Insights dashboard trả về dữ liệu');

  console.log(`\n========== E2E PIPELINE 11 BƯỚC: HOÀN TẤT — ${passed} assertion PASS ==========`);
}
main().catch((e) => { console.error('\nE2E FAIL:', e.message); process.exit(1); });
