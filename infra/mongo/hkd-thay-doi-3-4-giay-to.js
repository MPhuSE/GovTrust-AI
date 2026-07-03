// Migration: HKD_THAY_DOI — đổi chủ hộ do ủy quyền, hồ sơ 3-4 giấy tờ theo NĐ 168/2025.
// Căn cứ đã xác minh với văn bản gốc (OCR toàn văn NĐ 168/2025):
//   - Đ.100 k.3: hồ sơ đổi chủ hộ do HGĐ ủy quyền = giấy đề nghị + bản sao văn bản ủy quyền (công chứng)
//   - Đ.93 k.1: văn bản ủy quyền thực hiện thủ tục (không bắt buộc công chứng)
//   - Đ.85: Giấy chứng nhận ĐKHKD (xuất trình đối chiếu)
// Không dùng trường hợp chủ hộ chết (Đ.100 k.4, k.5).
// Chạy: mongosh --port 27019 govtrust_business infra/mongo/hkd-thay-doi-3-4-giay-to.js

db = db.getSiblingDB('govtrust_business');

// ── 1. Thêm 2 document_types mới (upsert idempotent) ──
const newDocTypes = [
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
];

db.document_types.updateOne(
  { code: 'HO_KINH_DOANH' },
  {
    $set: {
      fields: [
        // Thông tin hộ kinh doanh
        { key: 'tenHoKinhDoanh', label: 'Tên hộ kinh doanh', dataType: 'string', required: true, isIdentity: true },
        { key: 'maSoHoKinhDoanh', label: 'Mã số hộ kinh doanh', dataType: 'string', required: false, isIdentity: true },
        { key: 'diaChiKinhDoanh', label: 'Địa chỉ kinh doanh', dataType: 'string', required: false, isIdentity: false },
        { key: 'nganhNghe', label: 'Ngành nghề kinh doanh', dataType: 'string', required: false, isIdentity: false },
        { key: 'dienThoai', label: 'Điện thoại', dataType: 'string', required: false, isIdentity: false },
        { key: 'email', label: 'Email', dataType: 'string', required: false, isIdentity: false },

        // Thông tin chủ hộ (để điền vào phần "Chủ hộ cũ" trong tờ khai thay đổi)
        { key: 'hoTenChuHo', label: 'Họ tên chủ hộ', dataType: 'string', required: true, isIdentity: true },
        { key: 'soCCCDChuHo', label: 'Số CCCD/CMND chủ hộ', dataType: 'string', required: false, isIdentity: true },
        { key: 'ngaySinhChuHo', label: 'Ngày sinh chủ hộ', dataType: 'date', format: 'dd/mm/yyyy', required: false, isIdentity: false },
        { key: 'gioiTinhChuHo', label: 'Giới tính chủ hộ', dataType: 'string', required: false, isIdentity: false },
        { key: 'danTocChuHo', label: 'Dân tộc chủ hộ', dataType: 'string', required: false, isIdentity: false },
        { key: 'quocTichChuHo', label: 'Quốc tịch chủ hộ', dataType: 'string', required: false, isIdentity: false },
        { key: 'ngayCapCCCDChuHo', label: 'Ngày cấp CCCD chủ hộ', dataType: 'date', format: 'dd/mm/yyyy', required: false, isIdentity: false },
        { key: 'noiCapCCCDChuHo', label: 'Nơi cấp CCCD chủ hộ', dataType: 'string', required: false, isIdentity: false },
        { key: 'diaChiThuongTruChuHo', label: 'Địa chỉ thường trú chủ hộ', dataType: 'string', required: false, isIdentity: false },
        { key: 'dienThoaiChuHo', label: 'Điện thoại chủ hộ', dataType: 'string', required: false, isIdentity: false },
        { key: 'emailChuHo', label: 'Email chủ hộ', dataType: 'string', required: false, isIdentity: false },
      ],
    },
  },
  { upsert: false },
);
print('[OK] document_types.HO_KINH_DOANH — thêm các trường CCCD chủ hộ');


// ── 2. Cập nhật thủ tục HKD_THAY_DOI ──
db.procedures.updateOne(
  { code: 'HKD_THAY_DOI' },
  {
    $set: {
      name: 'Đăng ký thay đổi chủ hộ kinh doanh (do ủy quyền)',
      description: 'Thay đổi chủ hộ kinh doanh do các thành viên hộ gia đình ủy quyền cho một thành viên khác làm chủ hộ (Điều 100 khoản 3 NĐ 168/2025). Đọc GCN ĐKHKD hiện tại, đối chiếu chủ hộ mới với văn bản ủy quyền và CCCD.',
      checklist: [
        {
          id: 'cccd_nguoi_yeu_cau',
          documentTypeCode: 'CCCD',
          acceptedCodes: ['CCCD', 'CMND'],
          label: 'CCCD của chủ hộ kinh doanh mới',
          roleInProcedure: 'Định danh thành viên được ủy quyền làm chủ hộ mới',
          inputMode: 'EKYC',
          allowReuseVerifiedIdentity: true,
          isRequired: true,
          quantity: 1,
          points: 15,
        },
        {
          id: 'giay_hkd',
          documentTypeCode: 'HO_KINH_DOANH',
          label: 'Giấy chứng nhận đăng ký hộ kinh doanh đã cấp',
          roleInProcedure: 'Xuất trình để lấy thông tin đăng ký hiện tại (Đ.85 NĐ 168/2025)',
          inputMode: 'UPLOAD',
          isRequired: true,
          quantity: 1,
          points: 35,
        },
        {
          id: 'van_ban_uy_quyen_hgd',
          documentTypeCode: 'VAN_BAN_UY_QUYEN_HGD',
          label: 'Bản sao văn bản ủy quyền của các thành viên hộ gia đình',
          roleInProcedure: 'Ủy quyền một thành viên làm chủ hộ — công chứng/chứng thực (Đ.100 k.3 điểm b NĐ 168/2025)',
          inputMode: 'UPLOAD',
          isRequired: true,
          quantity: 1,
          points: 35,
        },
        {
          id: 'van_ban_uy_quyen_thu_tuc',
          documentTypeCode: 'VAN_BAN_UY_QUYEN_THU_TUC',
          label: 'Văn bản ủy quyền thực hiện thủ tục',
          roleInProcedure: 'Bắt buộc nếu nhờ người khác nộp hồ sơ thay — không cần công chứng (Đ.93 k.1 NĐ 168/2025)',
          inputMode: 'UPLOAD',
          isRequired: false,
          conditionalOn: 'nhờ người khác nộp hồ sơ thay chủ hộ',
          quantity: 1,
          points: 10,
        },
      ],
      formFields: [
        { id: 'coQuanTiepNhan', label: 'Cơ quan đăng ký kinh doanh', required: true, sourceMap: [], defaultValue: 'Cơ quan đăng ký kinh doanh cấp xã' },
        { id: 'hoKinhDoanh.tenHoKinhDoanh', label: 'Tên hộ kinh doanh', required: true, sourceMap: ['giay_hkd.tenHoKinhDoanh', 'van_ban_uy_quyen_hgd.tenHoKinhDoanh'] },
        { id: 'hoKinhDoanh.maSo', label: 'Mã số/Số ĐKHKD', required: true, sourceMap: ['giay_hkd.maSoHoKinhDoanh'] },
        { id: 'hoKinhDoanh.diaChiHienTai', label: 'Địa chỉ kinh doanh hiện tại', required: false, sourceMap: ['giay_hkd.diaChiKinhDoanh'] },
        { id: 'chuHoCu.hoTen', label: 'Họ tên chủ hộ hiện tại', required: false, sourceMap: ['giay_hkd.hoTenChuHo'] },
        { id: 'chuHoMoi.hoTen', label: 'Họ tên chủ hộ kinh doanh mới', required: true, sourceMap: ['cccd_nguoi_yeu_cau.hoTen', 'van_ban_uy_quyen_hgd.tenNguoiDuocUyQuyen'] },
        { id: 'chuHoMoi.soCCCD', label: 'Số CCCD chủ hộ mới', required: true, sourceMap: ['cccd_nguoi_yeu_cau.soCCCD'] },
        { id: 'chuHoMoi.diaChiThuongTru', label: 'Nơi thường trú chủ hộ mới', required: false, sourceMap: ['cccd_nguoi_yeu_cau.noiThuongTru'] },
        { id: 'thayDoi.noiDung', label: 'Nội dung thay đổi', required: true, sourceMap: [], defaultValue: 'Thay đổi chủ hộ kinh doanh' },
      ],
      crossCheckRules: [
        { name: 'Chủ hộ mới trên CCCD khớp người được ủy quyền trong văn bản ủy quyền HGĐ', left: 'cccd_nguoi_yeu_cau.hoTen', right: 'van_ban_uy_quyen_hgd.tenNguoiDuocUyQuyen', matchType: 'normalized', severityIfMismatch: 'HIGH', skipIfMissing: 'van_ban_uy_quyen_hgd' },
        { name: 'Tên hộ kinh doanh trên văn bản ủy quyền khớp Giấy chứng nhận ĐKHKD', left: 'van_ban_uy_quyen_hgd.tenHoKinhDoanh', right: 'giay_hkd.tenHoKinhDoanh', matchType: 'normalized', severityIfMismatch: 'MEDIUM', skipIfMissing: 'van_ban_uy_quyen_hgd' },
        { name: 'Người được ủy quyền nộp thủ tục khớp chủ hộ mới trên CCCD', left: 'van_ban_uy_quyen_thu_tuc.tenNguoiUyQuyen', right: 'cccd_nguoi_yeu_cau.hoTen', matchType: 'normalized', severityIfMismatch: 'LOW', skipIfMissing: 'van_ban_uy_quyen_thu_tuc' },
      ],
    },
  },
);
print('[OK] HKD_THAY_DOI — checklist 3 bắt buộc + 1 conditional theo Đ.100 k.3, Đ.93, Đ.85 NĐ 168/2025');

// ── 3. Xác nhận ──
const p = db.procedures.findOne({ code: 'HKD_THAY_DOI' }, { checklist: 1, _id: 0 });
print('\n=== HKD_THAY_DOI checklist (' + p.checklist.length + ' giấy tờ) ===');
p.checklist.forEach((c) => print('  ' + (c.isRequired ? '[BẮT BUỘC]  ' : '[ĐIỀU KIỆN] ') + c.documentTypeCode + ' — ' + c.label));
print('\nDocument types tổng: ' + db.document_types.countDocuments({}));
