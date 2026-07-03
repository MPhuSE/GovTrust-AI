// MongoDB cleanup script: giữ 3 thủ tục MVP + giấy tờ liên quan
//
// Chạy:
//   mongosh "mongodb+srv://..." < cleanup-to-3-procedures.js
//
// Hoặc từ mongosh interactive:
//   load('infra/mongo/cleanup-to-3-procedures.js')

const DB_NAME = 'govtrust_ai';

const MVP_PROCEDURE_CODES = [
  'DK_THUONG_TRU',          // Đăng ký thường trú (3 giấy tờ)
  'HKD_THAY_DOI',           // Thay đổi chủ hộ kinh doanh (3 giấy tờ)
  'CHUYEN_NHUONG_QSDD',     // Chuyển nhượng QSDĐ (5 giấy tờ)
];

const ALLOWED_DOCUMENT_TYPES = [
  'CCCD',
  'CMND',
  'GIAY_CHUNG_NHAN_QSDD',   // Sổ đỏ - Qwen OCR
  'HOP_DONG_CHUYEN_NHUONG', // Hợp đồng chuyển nhượng - Qwen OCR
  'GIAY_KHAI_SINH',         // VNPT OCR
  'VAN_BAN_HANH_CHINH',     // Qwen OCR (văn bản hành chính)
  'HO_KINH_DOANH',          // VNPT OCR
  'VAN_BAN_UY_QUYEN_HGD',   // Qwen OCR (ủy quyền hộ gia đình)
  'VAN_BAN_UY_QUYEN_THU_TUC', // Qwen OCR (ủy quyền thủ tục)
];

print('🔥 MongoDB cleanup: giữ 3 thủ tục MVP + 9 loại giấy tờ (VNPT + Qwen OCR)...\n');

const db = db.getSiblingDB(DB_NAME);

// 1. Xóa procedures không nằm trong MVP_PROCEDURE_CODES
const deletedProcedures = db.procedures.deleteMany({ code: { $nin: MVP_PROCEDURE_CODES } });
print(`✅ procedures: xóa ${deletedProcedures.deletedCount} (giữ ${MVP_PROCEDURE_CODES.length})`);

// 2. Xóa document_types không nằm trong ALLOWED_DOCUMENT_TYPES
const deletedDocTypes = db.document_types.deleteMany({ code: { $nin: ALLOWED_DOCUMENT_TYPES } });
print(`✅ document_types: xóa ${deletedDocTypes.deletedCount} (giữ ${ALLOWED_DOCUMENT_TYPES.length})`);

// 3. Xóa sessions của thủ tục không còn tồn tại
const deletedSessions = db.sessions.deleteMany({ procedureCode: { $nin: MVP_PROCEDURE_CODES } });
print(`✅ sessions: xóa ${deletedSessions.deletedCount}`);

// 4. Xóa documents thuộc session đã xóa hoặc documentType không hợp lệ
const deletedDocuments = db.documents.deleteMany({
  $or: [
    { documentType: { $nin: ALLOWED_DOCUMENT_TYPES } },
    // Nếu muốn xóa documents của session đã xóa, cần query sessions trước
  ]
});
print(`✅ documents: xóa ${deletedDocuments.deletedCount}`);

print('\n✅ Cleanup hoàn tất!\n');
print('📋 Thủ tục còn lại:');
db.procedures.find({}, { code: 1, name: 1, _id: 0 }).forEach(p => print(`  - ${p.code}: ${p.name}`));
print('\n📄 Loại giấy tờ còn lại:');
db.document_types.find({}, { code: 1, name: 1, _id: 0 }).forEach(d => print(`  - ${d.code}: ${d.name}`));
