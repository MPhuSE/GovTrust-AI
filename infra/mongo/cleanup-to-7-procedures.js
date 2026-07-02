// Migration: Thu gọn hệ thống về đúng 7 thủ tục (2 domain: khai sinh + hộ kinh doanh).
// Xóa mọi thủ tục ngoài registry mới, dọn document_types đất đai/chứng sinh không còn dùng.
// Chạy: mongosh --port 27019 govtrust_business infra/mongo/cleanup-to-7-procedures.js

db = db.getSiblingDB('govtrust_business');

// === 1. Giữ đúng 7 thủ tục trong registry MVP mới ===
const keepCodes = [
  'CAP_BAN_SAO_TRICH_LUC_KHAI_SINH',
  'DK_LAI_KHAI_SINH',
  'XAC_NHAN_TINH_TRANG_HON_NHAN',
  'HKD_THANH_LAP',
  'HKD_THAY_DOI',
  'HKD_CAP_LAI',
  'HKD_CHAM_DUT',
];

const del = db.procedures.deleteMany({ code: { $nin: keepCodes } });
print(`[DELETE] procedures ngoài registry: ${del.deletedCount} đã xóa`);

// === 2. Chuẩn hóa document_types về đúng 3 loại 7 thủ tục dùng ===
// CCCD (+alias CMND), GIAY_KHAI_SINH, HO_KINH_DOANH. Upsert 2 loại còn thiếu.
db.document_types.updateOne(
  { code: 'GIAY_KHAI_SINH' },
  { $set: {
    code: 'GIAY_KHAI_SINH',
    name: 'Giấy khai sinh',
    category: 'HO_TICH',
    issuingAuthority: 'UBND cấp xã',
    hasPortrait: false,
    pagesRequired: 1,
    fields: [
      { key: 'hoTenCon', label: 'Họ tên người được khai sinh', dataType: 'string', required: true, isIdentity: true },
      { key: 'ngaySinhCon', label: 'Ngày sinh', dataType: 'date', format: 'dd/mm/yyyy', required: true, isIdentity: false },
      { key: 'gioiTinhCon', label: 'Giới tính', dataType: 'string', required: false, isIdentity: false },
      { key: 'hoTenMe', label: 'Họ tên mẹ', dataType: 'string', required: false, isIdentity: false },
      { key: 'hoTenCha', label: 'Họ tên cha', dataType: 'string', required: false, isIdentity: false },
      { key: 'noiDangKy', label: 'Nơi đăng ký khai sinh', dataType: 'string', required: false, isIdentity: false },
    ],
    validity: { hasExpiry: false },
    aliasCodes: [],
    isActive: true,
  } },
  { upsert: true },
);
db.document_types.updateOne(
  { code: 'HO_KINH_DOANH' },
  { $set: {
    code: 'HO_KINH_DOANH',
    name: 'Giấy chứng nhận đăng ký hộ kinh doanh',
    category: 'DOANH_NGHIEP',
    issuingAuthority: 'Cơ quan đăng ký kinh doanh cấp xã',
    hasPortrait: false,
    pagesRequired: 1,
    fields: [
      { key: 'tenHoKinhDoanh', label: 'Tên hộ kinh doanh', dataType: 'string', required: true, isIdentity: true },
      { key: 'maSoHoKinhDoanh', label: 'Mã số hộ kinh doanh', dataType: 'string', required: false, isIdentity: true },
      { key: 'hoTenChuHo', label: 'Họ tên chủ hộ', dataType: 'string', required: true, isIdentity: true },
      { key: 'diaChiKinhDoanh', label: 'Địa chỉ kinh doanh', dataType: 'string', required: false, isIdentity: false },
      { key: 'nganhNghe', label: 'Ngành nghề kinh doanh', dataType: 'string', required: false, isIdentity: false },
    ],
    validity: { hasExpiry: false },
    aliasCodes: [],
    isActive: true,
  } },
  { upsert: true },
);

// Xóa mọi document_type không thuộc allowlist các loại được dùng.
const keepDocTypes = ['CCCD', 'GIAY_KHAI_SINH', 'HO_KINH_DOANH', 'VAN_BAN_UY_QUYEN_HGD', 'VAN_BAN_UY_QUYEN_THU_TUC'];
const dtResult = db.document_types.deleteMany({ code: { $nin: keepDocTypes } });
print(`[DELETE] document_types ngoài allowlist: ${dtResult.deletedCount} đã xóa`);

// === 3. Xác nhận kết quả ===
print('\n=== KẾT QUẢ ===');
const remaining = db.procedures.find({}, { code: 1, name: 1, _id: 0 }).sort({ code: 1 }).toArray();
print('Thủ tục còn lại: ' + remaining.length);
remaining.forEach(p => print(`  ✓ ${p.code} — ${p.name}`));

const dtCount = db.document_types.countDocuments({});
print(`Document types còn lại: ${dtCount}`);
