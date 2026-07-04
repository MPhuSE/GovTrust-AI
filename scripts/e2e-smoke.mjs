// E2E smoke test — chạy đủ pipeline 11 bước qua REST API của core-svc.
const BASE = process.env.BASE || 'http://localhost:4000';
const log = (s, o) => console.log(`\n### ${s}`, o !== undefined ? JSON.stringify(o).slice(0, 400) : '');
const j = async (r) => { const t = await r.text(); try { return JSON.parse(t); } catch { return t; } };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function main() {
  // -- Auth: 1 công dân + 1 cán bộ
  const rnd = Math.floor(Math.random() * 1e6);
  const citizen = await j(await fetch(`${BASE}/auth/register`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ username: `dan${rnd}`, password: 'matkhau123', fullName: 'Nguyễn Văn Dân' }) }));
  log('register CITIZEN', { role: citizen.user?.role, hasToken: !!citizen.access_token });
  const officer = await j(await fetch(`${BASE}/auth/register`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ username: `cb${rnd}`, password: 'matkhau123', fullName: 'Cán bộ Một Cửa', role: 'OFFICER' }) }));
  log('register OFFICER', { role: officer.user?.role });
  const AUTHC = { authorization: `Bearer ${citizen.access_token}` };
  const AUTHO = { authorization: `Bearer ${officer.access_token}` };

  // -- Bước 1: HoSoBot identify
  const ident = await j(await fetch(`${BASE}/procedures/identify`, { method: 'POST', headers: { 'content-type': 'application/json', ...AUTHC }, body: JSON.stringify({ userQuery: 'Tôi muốn đăng ký khai sinh cho con' }) }));
  log('B1 identify', ident);

  // -- Lấy procedureId
  const procs = await j(await fetch(`${BASE}/procedures`, { headers: AUTHC }));
  const proc = procs.find((p) => p.code === 'DK_KHAI_SINH') || procs[0];
  const procedureId = proc._id;
  log('procedure', { code: proc.code, procedureId, checklist: proc.checklist?.length });

  // -- Tạo session
  const sess = await j(await fetch(`${BASE}/sessions`, { method: 'POST', headers: { 'content-type': 'application/json', ...AUTHC }, body: JSON.stringify({ procedureId }) }));
  const sid = sess._id;
  log('create session', { sid, status: sess.status });

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
  if (!ocrDone) throw new Error('OCR không hoàn tất sau 20s');

  // -- Bước 4: CrossCheck
  const cc = await j(await fetch(`${BASE}/sessions/${sid}/crosscheck`, { method: 'POST', headers: AUTHC }));
  log('B4 crosscheck', { summary: cc.summary, missing: cc.missingDocuments, checks: cc.checks?.map((x) => `${x.field}:${x.status}`) });

  // -- Bước 5: Score
  const sc = await j(await fetch(`${BASE}/sessions/${sid}/score`, { method: 'POST', headers: AUTHC }));
  log('B5 score', { score: sc.score, grade: sc.grade, canSubmit: sc.canSubmit, breakdown: sc.breakdown?.map((b) => b.ruleId) });

  // -- Bước 6: LawGuard
  const lg = await j(await fetch(`${BASE}/sessions/${sid}/lawguard`, { method: 'POST', headers: AUTHC }));
  log('B6 lawguard', { alerts: (lg.alerts || []).length, disclaimer: !!lg.disclaimer });

  // -- Bước 7: SmartForm
  const sf = await j(await fetch(`${BASE}/sessions/${sid}/smartform`, { method: 'POST', headers: AUTHC }));
  log('B7 smartform', sf);

  // -- Bước 8: Confirm
  const cf = await j(await fetch(`${BASE}/sessions/${sid}/confirm`, { method: 'POST', headers: AUTHC }));
  log('B8 confirm', { status: cf.status || cf });

  // -- Bước 9: Gov Re-Check (officer)
  const rc = await j(await fetch(`${BASE}/sessions/${sid}/recheck`, { method: 'POST', headers: AUTHO }));
  log('B9 recheck', { completeness: rc.govReCheck?.completenessLevel, riskFlags: rc.govReCheck?.riskFlags?.map((f) => f.type) });

  // -- Bước 10: Priority (officer)
  const pr = await j(await fetch(`${BASE}/priority`, { headers: AUTHO }));
  log('B10 priority', { queue: pr.length, top: pr[0] });

  // -- Bước 11: Insights (officer)
  const ins = await j(await fetch(`${BASE}/insights/dashboard?days=30`, { headers: AUTHO }));
  log('B11 insights', { avgScore: ins.avgScore, topErrors: ins.topErrors });

  console.log('\n========== E2E PIPELINE 11 BƯỚC: HOÀN TẤT ==========');
}
main().catch((e) => { console.error('\nE2E FAIL:', e.message); process.exit(1); });
