// Seed data cho MongoDB — chạy tự động khi container khởi động lần đầu

db = db.getSiblingDB('govtrust_business');

// --- Users mẫu ---
db.users.insertMany([
  {
    username: 'admin',
    passwordHash: '$2b$10$examplehashforadminpassword',
    fullName: 'Admin GovTrust',
    role: 'ADMIN',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    username: 'officer01',
    passwordHash: '$2b$10$examplehashforofficerpassword',
    fullName: 'Trần Văn Tuấn',
    role: 'OFFICER',
    organization: 'UBND Phường Bến Nghé',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
]);

// --- Thủ tục MVP ---
// Được seed tự động bởi MvpProcedureSeeder (core-svc) khi khởi động, dựa trên registry
// apps/core-svc/src/modules/procedures/mvp-procedures.ts. Không seed cứng ở đây nữa.

// --- Catalog loại giấy tờ (document_types — OI-6, dùng chung) ---
db.document_types.insertMany([
  {
    code: 'CCCD',
    name: 'Căn cước công dân',
    category: 'NHAN_THAN',
    issuingAuthority: 'Bộ Công an',
    hasPortrait: true,
    pagesRequired: 2,
    fields: [
      { key: 'soCCCD', label: 'Số CCCD', dataType: 'id_number', regex: '^\\d{12}$', required: true, isIdentity: true },
      { key: 'hoTen', label: 'Họ và tên', dataType: 'string', required: true, isIdentity: true },
      { key: 'ngaySinh', label: 'Ngày sinh', dataType: 'date', format: 'dd/mm/yyyy', required: true, isIdentity: true },
      { key: 'ngayHetHan', label: 'Ngày hết hạn', dataType: 'date', format: 'dd/mm/yyyy', required: false, isIdentity: false },
    ],
    validity: { hasExpiry: true, expiryField: 'ngayHetHan' },
    aliasCodes: ['CMND'],
    isActive: true,
  },
  {
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
  },
  {
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
  },
  {
    code: 'VAN_BAN_UY_QUYEN_HGD',
    name: 'Văn bản ủy quyền của các thành viên hộ gia đình',
    category: 'DOANH_NGHIEP',
    issuingAuthority: 'Các thành viên hộ gia đình (công chứng/chứng thực)',
    hasPortrait: false,
    pagesRequired: 1,
    fields: [
      { key: 'tenNguoiDuocUyQuyen', label: 'Họ tên thành viên được ủy quyền làm chủ hộ', dataType: 'string', required: true, isIdentity: true },
      { key: 'tenHoKinhDoanh', label: 'Tên hộ kinh doanh', dataType: 'string', required: false, isIdentity: true },
      { key: 'ngayUyQuyen', label: 'Ngày lập văn bản ủy quyền', dataType: 'date', format: 'dd/mm/yyyy', required: false, isIdentity: false },
      { key: 'noiCongChung', label: 'Nơi công chứng/chứng thực', dataType: 'string', required: false, isIdentity: false },
    ],
    validity: { hasExpiry: false },
    aliasCodes: [],
    isActive: true,
  },
  {
    code: 'VAN_BAN_UY_QUYEN_THU_TUC',
    name: 'Văn bản ủy quyền thực hiện thủ tục đăng ký hộ kinh doanh',
    category: 'DOANH_NGHIEP',
    issuingAuthority: 'Chủ hộ kinh doanh (không bắt buộc công chứng — Đ.93 NĐ 168/2025)',
    hasPortrait: false,
    pagesRequired: 1,
    fields: [
      { key: 'tenNguoiUyQuyen', label: 'Họ tên người ủy quyền (chủ hộ)', dataType: 'string', required: true, isIdentity: true },
      { key: 'tenNguoiNhanUyQuyen', label: 'Họ tên người được ủy quyền nộp hồ sơ', dataType: 'string', required: true, isIdentity: false },
      { key: 'ngayUyQuyen', label: 'Ngày lập văn bản ủy quyền', dataType: 'date', format: 'dd/mm/yyyy', required: false, isIdentity: false },
    ],
    validity: { hasExpiry: false },
    aliasCodes: [],
    isActive: true,
  },
]);

print('MongoDB seed data loaded successfully.');
