// Migration: Thu gọn hệ thống về đúng 2 thủ tục MVP (nhiều giấy tờ xuất trình):
//   - DK_THUONG_TRU  (Đăng ký thường trú — CƯ TRÚ)
//   - HKD_THAY_DOI   (Đăng ký thay đổi chủ hộ kinh doanh — HỘ KINH DOANH)
// Xóa mọi thủ tục ngoài registry, giữ document_types 2 thủ tục này thực sự dùng.
// Chạy: mongosh --port 27019 govtrust_business infra/mongo/cleanup-to-2-procedures.js

db = db.getSiblingDB('govtrust_business');

// === 1. Giữ đúng 2 thủ tục MVP ===
const keepCodes = [
  'DK_THUONG_TRU',
  'HKD_THAY_DOI',
];

const del = db.procedures.deleteMany({ code: { $nin: keepCodes } });
print(`[DELETE] procedures ngoài registry: ${del.deletedCount} đã xóa`);

// === 2. Giữ document_types 2 thủ tục dùng ===
// DK_THUONG_TRU: CCCD, GIAY_CHUNG_NHAN_QSDD, GIAY_KHAI_SINH, VAN_BAN_HANH_CHINH
// HKD_THAY_DOI:  CCCD, HO_KINH_DOANH, VAN_BAN_UY_QUYEN_HGD, VAN_BAN_UY_QUYEN_THU_TUC
const keepDocTypes = [
  'CCCD',
  'GIAY_CHUNG_NHAN_QSDD',
  'GIAY_KHAI_SINH',
  'VAN_BAN_HANH_CHINH',
  'HO_KINH_DOANH',
  'VAN_BAN_UY_QUYEN_HGD',
  'VAN_BAN_UY_QUYEN_THU_TUC',
];
const dtResult = db.document_types.deleteMany({ code: { $nin: keepDocTypes } });
print(`[DELETE] document_types ngoài allowlist: ${dtResult.deletedCount} đã xóa`);

// === 3. Xác nhận kết quả ===
print('\n=== KẾT QUẢ ===');
const remaining = db.procedures.find({}, { code: 1, name: 1, _id: 0 }).sort({ code: 1 }).toArray();
print('Thủ tục còn lại: ' + remaining.length);
remaining.forEach(p => print(`  ✓ ${p.code} — ${p.name}`));

const dtCount = db.document_types.countDocuments({});
print(`Document types còn lại: ${dtCount}`);
