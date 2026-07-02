// Migration: Xóa 3 thủ tục đất đai phức tạp + sửa tên mẫu DK_THE_CHAP
// Chạy: mongosh --port 27019 govtrust_business infra/mongo/cleanup-complex-procedures.js

db = db.getSiblingDB('govtrust_business');

// === 1. Xóa 3 thủ tục phức tạp ===
const removeCodes = ['CAP_GCN_LAN_DAU', 'DK_BIEN_DONG_SANG_TEN', 'CHUYEN_MUC_DICH_SDD'];

removeCodes.forEach(code => {
  const result = db.procedures.deleteOne({ code });
  print(`[DELETE] ${code}: ${result.deletedCount ? 'đã xóa' : 'không tìm thấy'}`);
});

// === 2. Xóa document_types chỉ dùng cho 3 thủ tục đã xóa (orphans) ===
const orphanDocTypes = [
  'DON_DANG_KY_CAP_GCN',
  'GIAY_TO_NGUON_GOC_DAT',
  'SO_DO_NHA_O',
  'TO_KHAI_THUE_DAT',
  'DON_CHUYEN_MUC_DICH',
  'TRICH_DO_BAN_DO',
  'DON_DANG_KY_BIEN_DONG',
  'HOP_DONG_CHUYEN_NHUONG',
  'CHUNG_TU_NGHIA_VU_TAI_CHINH',
];

const dtResult = db.document_types.deleteMany({ code: { $in: orphanDocTypes } });
print(`[DELETE] document_types orphans: ${dtResult.deletedCount}/${orphanDocTypes.length} đã xóa`);

// === 3. Sửa tên mẫu DK_THE_CHAP cho chính xác theo file Mẫu 01a ===
db.procedures.updateOne(
  { code: 'DK_THE_CHAP' },
  { $set: {
    'checklist.$[item].roleInProcedure':
      'Phiếu yêu cầu đăng ký biện pháp bảo đảm bằng QSDĐ (Mẫu số 01a) — Đ.27 NĐ 99/2022',
  }},
  { arrayFilters: [{ 'item.id': 'phieu_yeu_cau' }] }
);
print('[UPDATE] DK_THE_CHAP: sửa roleInProcedure phiếu yêu cầu → Mẫu số 01a');

// === 4. Xác nhận kết quả ===
print('\n=== KẾT QUẢ ===');
const remaining = db.procedures.find({}, { code: 1, name: 1, _id: 0 }).sort({ code: 1 }).toArray();
print('Thủ tục còn lại: ' + remaining.length);
remaining.forEach(p => print(`  ✓ ${p.code} — ${p.name}`));

const dtCount = db.document_types.countDocuments({});
print(`Document types còn lại: ${dtCount}`);
