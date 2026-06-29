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

// --- Thủ tục: Đăng ký khai sinh ---
db.procedures.insertOne({
  code: 'DK_KHAI_SINH',
  name: 'Đăng ký khai sinh',
  description: 'Thủ tục đăng ký khai sinh cho trẻ em mới sinh',
  department: 'UBND cấp xã/phường',
  checklist: [
    {
      id: 'cccd_cha_me',
      documentTypeCode: 'CCCD',
      acceptedCodes: ['CCCD', 'CMND', 'PASSPORT'],
      roleInProcedure: 'CCCD của cha hoặc mẹ',
      quantity: 1,
      isRequired: true,
      points: 30,
    },
    {
      id: 'giay_chung_sinh',
      documentTypeCode: 'GIAY_CHUNG_SINH',
      acceptedCodes: ['GIAY_CHUNG_SINH'],
      roleInProcedure: 'Giấy chứng sinh của con',
      quantity: 1,
      isRequired: true,
      points: 40,
    },
    {
      id: 'giay_dang_ky_ket_hon',
      documentTypeCode: 'GIAY_DANG_KY_KET_HON',
      acceptedCodes: ['GIAY_DANG_KY_KET_HON'],
      roleInProcedure: 'Giấy đăng ký kết hôn (nếu có)',
      quantity: 1,
      isRequired: false,
      conditionalOn: 'parents_married',
      points: 10,
    },
  ],
  crossCheckRules: [
    {
      name: 'Họ tên cha/mẹ khớp giữa CCCD và giấy chứng sinh',
      left: 'cccd_cha_me.hoTen',
      right: 'giay_chung_sinh.hoTenMe',
      matchType: 'normalized',
      severityIfMismatch: 'HIGH',
      skipIfMissing: 'giay_chung_sinh',
    },
  ],
  formFields: [
    { id: 'hoTenCon', label: 'Họ và tên con', required: true, sourceMap: [] },
    { id: 'ngaySinhCon', label: 'Ngày sinh của con', required: true, sourceMap: ['giay_chung_sinh.ngaySinh'] },
    { id: 'gioiTinhCon', label: 'Giới tính', required: true, sourceMap: ['giay_chung_sinh.gioiTinhCon'] },
    { id: 'hoTenCha', label: 'Họ tên cha', required: true, sourceMap: ['cccd_cha_me.hoTen'] },
    { id: 'hoTenMe', label: 'Họ tên mẹ', required: true, sourceMap: ['giay_chung_sinh.hoTenMe'] },
    { id: 'noiDangKy', label: 'Nơi đăng ký khai sinh', required: true, sourceMap: [] },
  ],
  scoringRules: {
    baseScore: 100,
    penalties: { missingRequired: -20, infoMismatch: -10, expiredDoc: -15, lowQualityImage: -5, lowOcrConfidence: -5 },
  },
  priorityConfig: { baseUrgency: 'MEDIUM', slaDays: 5 },
  isActive: true,
});

print('MongoDB seed data loaded successfully.');
