// Migration: Cập nhật checklist thủ tục hành chính đạt 90-100% theo luật
// Chạy: mongosh --port 27019 govtrust_business fix-checklist-accuracy.js

db = db.getSiblingDB('govtrust_business');

// ═══════════════════════════════════════════════════════════════
// 1. Thêm document_types mới (upsert để idempotent)
// ═══════════════════════════════════════════════════════════════

const newDocTypes = [
  {
    code: 'GIAY_TO_NGUON_GOC_DAT',
    name: 'Giấy tờ chứng minh nguồn gốc quyền sử dụng đất',
    category: 'DAT_DAI',
    issuingAuthority: 'Cơ quan có thẩm quyền',
    hasPortrait: false,
    pagesRequired: 1,
    fields: [
      { key: 'loaiGiayTo', label: 'Loại giấy tờ', dataType: 'string', required: true, isIdentity: false },
      { key: 'tenChuSuDung', label: 'Tên chủ sử dụng', dataType: 'string', required: true, isIdentity: true },
      { key: 'diaChiThua', label: 'Địa chỉ thửa đất', dataType: 'string', required: false, isIdentity: false },
    ],
    validity: { hasExpiry: false },
    aliasCodes: [],
    isActive: true,
  },
  {
    code: 'SO_DO_NHA_O',
    name: 'Sơ đồ nhà ở, công trình xây dựng',
    category: 'DAT_DAI',
    issuingAuthority: 'Chủ sở hữu tự lập hoặc đơn vị đo đạc',
    hasPortrait: false,
    pagesRequired: 1,
    fields: [
      { key: 'dienTich', label: 'Diện tích xây dựng', dataType: 'string', required: true, isIdentity: false },
      { key: 'soTang', label: 'Số tầng', dataType: 'string', required: false, isIdentity: false },
    ],
    validity: { hasExpiry: false },
    aliasCodes: [],
    isActive: true,
  },
  {
    code: 'BAN_VE_TACH_THUA',
    name: 'Bản vẽ tách thửa, hợp thửa đất (Mẫu 02/ĐK)',
    category: 'DAT_DAI',
    issuingAuthority: 'VP Đăng ký đất đai hoặc đơn vị đo đạc có giấy phép',
    hasPortrait: false,
    pagesRequired: 1,
    fields: [
      { key: 'soThuaGoc', label: 'Số thửa gốc', dataType: 'string', required: true, isIdentity: false },
      { key: 'soThuaMoi', label: 'Số thửa mới sau tách', dataType: 'string', required: false, isIdentity: false },
      { key: 'dienTichGoc', label: 'Diện tích thửa gốc', dataType: 'string', required: true, isIdentity: false },
    ],
    validity: { hasExpiry: false },
    aliasCodes: [],
    isActive: true,
  },
  {
    code: 'PHIEU_YEU_CAU_DANG_KY_THE_CHAP',
    name: 'Phiếu yêu cầu đăng ký thế chấp quyền sử dụng đất',
    category: 'DAT_DAI',
    issuingAuthority: 'Bên thế chấp tự lập (theo mẫu NĐ 99/2022)',
    hasPortrait: false,
    pagesRequired: 1,
    fields: [
      { key: 'tenBenTheChap', label: 'Tên bên thế chấp', dataType: 'string', required: true, isIdentity: true },
      { key: 'tenBenNhanTheChap', label: 'Tên bên nhận thế chấp', dataType: 'string', required: true, isIdentity: false },
      { key: 'soThua', label: 'Số thửa đất thế chấp', dataType: 'string', required: true, isIdentity: false },
    ],
    validity: { hasExpiry: false },
    aliasCodes: [],
    isActive: true,
  },
  {
    code: 'CHUNG_TU_NGHIA_VU_TAI_CHINH',
    name: 'Chứng từ hoàn thành nghĩa vụ tài chính (thuế TNCN, lệ phí trước bạ)',
    category: 'DAT_DAI',
    issuingAuthority: 'Cơ quan thuế / Kho bạc Nhà nước',
    hasPortrait: false,
    pagesRequired: 1,
    fields: [
      { key: 'soChungTu', label: 'Số chứng từ', dataType: 'string', required: true, isIdentity: false },
      { key: 'soTien', label: 'Số tiền đã nộp', dataType: 'string', required: true, isIdentity: false },
      { key: 'ngayNop', label: 'Ngày nộp', dataType: 'date', format: 'dd/mm/yyyy', required: true, isIdentity: false },
    ],
    validity: { hasExpiry: false },
    aliasCodes: [],
    isActive: true,
  },
  {
    code: 'TRICH_DO_BAN_DO',
    name: 'Trích đo bản đồ địa chính thửa đất',
    category: 'DAT_DAI',
    issuingAuthority: 'VP Đăng ký đất đai hoặc đơn vị đo đạc có giấy phép',
    hasPortrait: false,
    pagesRequired: 1,
    fields: [
      { key: 'soThua', label: 'Số thửa', dataType: 'string', required: true, isIdentity: false },
      { key: 'dienTich', label: 'Diện tích (m²)', dataType: 'string', required: true, isIdentity: false },
      { key: 'toBanDo', label: 'Tờ bản đồ số', dataType: 'string', required: false, isIdentity: false },
    ],
    validity: { hasExpiry: false },
    aliasCodes: [],
    isActive: true,
  },
];

newDocTypes.forEach((dt) => {
  db.document_types.updateOne(
    { code: dt.code },
    { $set: dt, $setOnInsert: { createdAt: new Date() } },
    { upsert: true },
  );
});
print('✓ Document types mới đã thêm/cập nhật: ' + newDocTypes.length);

// ═══════════════════════════════════════════════════════════════
// 2. Cập nhật checklist từng thủ tục
// ═══════════════════════════════════════════════════════════════

// --- 2.1 DK_KHAI_SINH — Đ.16 Luật Hộ tịch 2014 + Đ.9 NĐ 123/2015 ---
db.procedures.updateOne(
  { code: 'DK_KHAI_SINH' },
  {
    $set: {
      description: 'Tiền kiểm hồ sơ đăng ký khai sinh cho trẻ em theo Điều 16 Luật Hộ tịch 2014.',
      checklist: [
        {
          id: 'to_khai',
          documentTypeCode: 'TO_KHAI_KHAI_SINH',
          roleInProcedure: 'Tờ khai đăng ký khai sinh theo mẫu',
          isRequired: true,
          quantity: 1,
          points: 20,
        },
        {
          id: 'chung_sinh',
          documentTypeCode: 'GIAY_CHUNG_SINH',
          roleInProcedure: 'Giấy chứng sinh do cơ sở y tế cấp (bản chính)',
          isRequired: true,
          quantity: 1,
          points: 30,
        },
        {
          id: 'cccd_cha_me',
          documentTypeCode: 'CCCD',
          acceptedCodes: ['CCCD', 'CMND'],
          roleInProcedure: 'Giấy tờ tùy thân của cha hoặc mẹ (người đi đăng ký) — xuất trình theo Đ.2 NĐ 123/2015',
          isRequired: true,
          quantity: 2,
          points: 30,
        },
        {
          id: 'dkkh',
          documentTypeCode: 'GIAY_DKKH',
          roleInProcedure: 'Giấy chứng nhận kết hôn của cha mẹ — xuất trình nếu đã ĐKKH (Đ.9 k.2 NĐ 123/2015)',
          isRequired: false,
          conditionalOn: 'cha mẹ đã đăng ký kết hôn',
          quantity: 1,
          points: 20,
        },
      ],
      crossCheckRules: [
        {
          name: 'Tên mẹ khớp giữa tờ khai và giấy chứng sinh',
          left: 'to_khai.hoTenMe',
          right: 'chung_sinh.hoTenMe',
          matchType: 'normalized',
          severityIfMismatch: 'HIGH',
        },
        {
          name: 'Ngày sinh con khớp giữa tờ khai và giấy chứng sinh',
          left: 'to_khai.ngaySinhCon',
          right: 'chung_sinh.ngaySinhCon',
          matchType: 'exact',
          severityIfMismatch: 'HIGH',
        },
        {
          name: 'Giới tính con khớp giữa tờ khai và giấy chứng sinh',
          left: 'to_khai.gioiTinhCon',
          right: 'chung_sinh.gioiTinhCon',
          matchType: 'exact',
          severityIfMismatch: 'MEDIUM',
        },
        {
          name: 'Tên mẹ trên tờ khai khớp tên trên CCCD cha/mẹ',
          left: 'to_khai.hoTenMe',
          right: 'cccd_cha_me.hoTen',
          matchType: 'normalized',
          severityIfMismatch: 'MEDIUM',
          skipIfMissing: 'cccd_cha_me',
        },
        {
          name: 'Cha/mẹ là vợ chồng (tờ khai khớp giấy ĐKKH)',
          left: 'to_khai.hoTenCha',
          right: 'dkkh.hoTenChong',
          matchType: 'normalized',
          severityIfMismatch: 'MEDIUM',
          skipIfMissing: 'dkkh',
        },
      ],
      formFields: [
        { id: 'hoTenNguoiDuocKhaiSinh', label: 'Họ tên người được khai sinh', required: true, sourceMap: ['to_khai.hoTenCon'] },
        { id: 'ngaySinh', label: 'Ngày sinh', required: true, sourceMap: ['chung_sinh.ngaySinhCon', 'to_khai.ngaySinhCon'] },
        { id: 'gioiTinh', label: 'Giới tính', required: true, sourceMap: ['chung_sinh.gioiTinhCon', 'to_khai.gioiTinhCon'] },
        { id: 'hoTenMe', label: 'Họ tên mẹ', required: true, sourceMap: ['chung_sinh.hoTenMe', 'to_khai.hoTenMe'] },
        { id: 'hoTenCha', label: 'Họ tên cha', required: false, sourceMap: ['to_khai.hoTenCha'] },
        { id: 'queQuan', label: 'Quê quán', required: false, sourceMap: ['to_khai.queQuanCon'] },
      ],
      legalSourceIds: ['luat-ho-tich-2014-dieu16-chunk1'],
      legalCategory: 'HO_TICH',
    },
  },
);
print('✓ DK_KHAI_SINH — cập nhật checklist + crossCheck + formFields');

// --- 2.2 DK_KET_HON — Đ.18 Luật HT 2014 + Đ.10 NĐ 123/2015 ---
db.procedures.updateOne(
  { code: 'DK_KET_HON' },
  {
    $set: {
      description: 'Tiền kiểm hồ sơ đăng ký kết hôn theo Điều 18 Luật Hộ tịch 2014 và Điều 10 NĐ 123/2015.',
      checklist: [
        {
          id: 'to_khai',
          documentTypeCode: 'TO_KHAI_KET_HON',
          roleInProcedure: 'Tờ khai đăng ký kết hôn theo mẫu (hai bên cùng ký) — Đ.18 k.1 Luật HT 2014',
          isRequired: true,
          quantity: 1,
          points: 25,
        },
        {
          id: 'cccd_chong',
          documentTypeCode: 'CCCD',
          acceptedCodes: ['CCCD', 'CMND'],
          roleInProcedure: 'Giấy tờ tùy thân của chồng — xuất trình theo Đ.2 NĐ 123/2015',
          isRequired: true,
          quantity: 1,
          points: 20,
        },
        {
          id: 'cccd_vo',
          documentTypeCode: 'CCCD',
          acceptedCodes: ['CCCD', 'CMND'],
          roleInProcedure: 'Giấy tờ tùy thân của vợ — xuất trình theo Đ.2 NĐ 123/2015',
          isRequired: true,
          quantity: 1,
          points: 20,
        },
        {
          id: 'xn_chong',
          documentTypeCode: 'GIAY_XN_TINH_TRANG_HON_NHAN',
          roleInProcedure: 'Giấy xác nhận tình trạng hôn nhân của chồng — bắt buộc nếu không thường trú tại xã ĐKKH (Đ.10 k.1 NĐ 123/2015)',
          isRequired: false,
          conditionalOn: 'chồng không thường trú tại xã nơi đăng ký kết hôn',
          quantity: 1,
          points: 17,
        },
        {
          id: 'xn_vo',
          documentTypeCode: 'GIAY_XN_TINH_TRANG_HON_NHAN',
          roleInProcedure: 'Giấy xác nhận tình trạng hôn nhân của vợ — bắt buộc nếu không thường trú tại xã ĐKKH (Đ.10 k.1 NĐ 123/2015)',
          isRequired: false,
          conditionalOn: 'vợ không thường trú tại xã nơi đăng ký kết hôn',
          quantity: 1,
          points: 18,
        },
      ],
      crossCheckRules: [
        {
          name: 'Tên chồng khớp giữa tờ khai và CCCD chồng',
          left: 'to_khai.hoTenChong',
          right: 'cccd_chong.hoTen',
          matchType: 'normalized',
          severityIfMismatch: 'HIGH',
        },
        {
          name: 'Ngày sinh chồng khớp giữa tờ khai và CCCD chồng',
          left: 'to_khai.ngaySinhChong',
          right: 'cccd_chong.ngaySinh',
          matchType: 'exact',
          severityIfMismatch: 'HIGH',
        },
        {
          name: 'Tên vợ khớp giữa tờ khai và CCCD vợ',
          left: 'to_khai.hoTenVo',
          right: 'cccd_vo.hoTen',
          matchType: 'normalized',
          severityIfMismatch: 'HIGH',
        },
        {
          name: 'Ngày sinh vợ khớp giữa tờ khai và CCCD vợ',
          left: 'to_khai.ngaySinhVo',
          right: 'cccd_vo.ngaySinh',
          matchType: 'exact',
          severityIfMismatch: 'HIGH',
        },
        {
          name: 'Tên chồng khớp giữa tờ khai và giấy XN tình trạng hôn nhân',
          left: 'to_khai.hoTenChong',
          right: 'xn_chong.hoTen',
          matchType: 'normalized',
          severityIfMismatch: 'MEDIUM',
          skipIfMissing: 'xn_chong',
        },
        {
          name: 'Tên vợ khớp giữa tờ khai và giấy XN tình trạng hôn nhân',
          left: 'to_khai.hoTenVo',
          right: 'xn_vo.hoTen',
          matchType: 'normalized',
          severityIfMismatch: 'MEDIUM',
          skipIfMissing: 'xn_vo',
        },
      ],
      legalSourceIds: ['luat-ho-tich-2014-dieu18-chunk1', 'luat-hon-nhan-gia-dinh-2014-dieu8-chunk1'],
      legalCategory: 'HO_TICH',
    },
  },
);
print('✓ DK_KET_HON — sửa Giấy XN TTHN thành conditional theo Đ.10 NĐ 123/2015');

// --- 2.3 CAP_GCN_LAN_DAU — Đ.28 NĐ 101/2024 ---
db.procedures.updateOne(
  { code: 'CAP_GCN_LAN_DAU' },
  {
    $set: {
      description: 'Tiền kiểm hồ sơ đăng ký, cấp GCN quyền sử dụng đất lần đầu theo Điều 28 NĐ 101/2024.',
      checklist: [
        {
          id: 'don_cap_gcn',
          documentTypeCode: 'DON_DANG_KY_CAP_GCN',
          roleInProcedure: 'Đơn đăng ký, cấp GCN lần đầu (Mẫu 04/ĐK) — Đ.28 k.1(a) NĐ 101/2024',
          isRequired: true,
          quantity: 1,
          points: 25,
        },
        {
          id: 'cccd',
          documentTypeCode: 'CCCD',
          acceptedCodes: ['CCCD', 'CMND'],
          roleInProcedure: 'CCCD người đăng ký — xuất trình',
          isRequired: true,
          quantity: 1,
          points: 15,
        },
        {
          id: 'giay_to_dat',
          documentTypeCode: 'GIAY_TO_NGUON_GOC_DAT',
          acceptedCodes: ['GIAY_TO_NGUON_GOC_DAT', 'HOP_DONG_CHUYEN_NHUONG'],
          roleInProcedure: 'Giấy tờ về nguồn gốc quyền sử dụng đất theo Đ.137 Luật ĐĐ 2024 — Đ.28 k.1(b) NĐ 101/2024',
          isRequired: false,
          conditionalOn: 'có giấy tờ chứng minh nguồn gốc đất',
          quantity: 1,
          points: 25,
        },
        {
          id: 'so_do_nha_o',
          documentTypeCode: 'SO_DO_NHA_O',
          roleInProcedure: 'Sơ đồ nhà ở, công trình xây dựng (nếu có) — Đ.28 k.1(b) NĐ 101/2024',
          isRequired: false,
          conditionalOn: 'có nhà ở hoặc công trình trên đất',
          quantity: 1,
          points: 10,
        },
        {
          id: 'to_khai_thue',
          documentTypeCode: 'TO_KHAI_THUE_DAT',
          roleInProcedure: 'Chứng từ nghĩa vụ tài chính (lệ phí trước bạ) — Đ.28 k.1(m) NĐ 101/2024',
          isRequired: false,
          quantity: 1,
          points: 25,
        },
      ],
      crossCheckRules: [
        {
          name: 'Tên người đăng ký khớp CCCD',
          left: 'don_cap_gcn.tenNguoiDangKy',
          right: 'cccd.hoTen',
          matchType: 'normalized',
          severityIfMismatch: 'HIGH',
        },
        {
          name: 'Số giấy tờ tùy thân trên đơn khớp số CCCD',
          left: 'don_cap_gcn.soGiayToTuyThan',
          right: 'cccd.soCCCD',
          matchType: 'exact',
          severityIfMismatch: 'MEDIUM',
        },
      ],
      legalSourceIds: ['luat-dat-dai-2024-dieu137-chunk2', 'nghi-dinh-101-2024-dieu28-chunk1'],
      legalCategory: 'DAT_DAI',
    },
  },
);
print('✓ CAP_GCN_LAN_DAU — thêm sơ đồ nhà ở, fix documentTypeCode nguồn gốc đất');

// --- 2.4 CHUYEN_MUC_DICH_SDD — Đ.121, Đ.227 Luật ĐĐ 2024 ---
db.procedures.updateOne(
  { code: 'CHUYEN_MUC_DICH_SDD' },
  {
    $set: {
      description: 'Tiền kiểm hồ sơ chuyển mục đích sử dụng đất theo Điều 121, 227 Luật Đất đai 2024.',
      checklist: [
        {
          id: 'don_chuyen',
          documentTypeCode: 'DON_CHUYEN_MUC_DICH',
          roleInProcedure: 'Đơn xin chuyển mục đích sử dụng đất — Đ.227 k.1 Luật ĐĐ 2024',
          isRequired: true,
          quantity: 1,
          points: 30,
        },
        {
          id: 'so_do',
          documentTypeCode: 'SO_DO',
          roleInProcedure: 'Giấy chứng nhận QSDĐ của thửa xin chuyển (bản gốc)',
          isRequired: true,
          quantity: 1,
          points: 30,
        },
        {
          id: 'cccd',
          documentTypeCode: 'CCCD',
          acceptedCodes: ['CCCD', 'CMND'],
          roleInProcedure: 'CCCD người sử dụng đất — xuất trình',
          isRequired: true,
          quantity: 1,
          points: 15,
        },
        {
          id: 'trich_do',
          documentTypeCode: 'TRICH_DO_BAN_DO',
          roleInProcedure: 'Trích đo bản đồ địa chính thửa đất (tùy yêu cầu địa phương)',
          isRequired: false,
          conditionalOn: 'địa phương yêu cầu trích đo',
          quantity: 1,
          points: 25,
        },
      ],
      crossCheckRules: [
        {
          name: 'Số thửa trên đơn khớp số thửa trên sổ đỏ',
          left: 'don_chuyen.soThua',
          right: 'so_do.soThua',
          matchType: 'exact',
          severityIfMismatch: 'HIGH',
        },
        {
          name: 'Tên người sử dụng đất khớp giữa đơn và sổ đỏ',
          left: 'don_chuyen.tenNguoiSuDung',
          right: 'so_do.tenChuSuDung',
          matchType: 'normalized',
          severityIfMismatch: 'HIGH',
        },
        {
          name: 'Tên người sử dụng đất khớp CCCD',
          left: 'don_chuyen.tenNguoiSuDung',
          right: 'cccd.hoTen',
          matchType: 'normalized',
          severityIfMismatch: 'MEDIUM',
        },
        {
          name: 'Mục đích cũ trên đơn khớp mục đích trên sổ đỏ',
          left: 'don_chuyen.mucDichCu',
          right: 'so_do.mucDichSuDung',
          matchType: 'normalized',
          severityIfMismatch: 'MEDIUM',
        },
      ],
      legalSourceIds: ['luat-dat-dai-2024-dieu121-chunk1', 'luat-dat-dai-2024-dieu227-chunk1', 'nghi-dinh-103-2024-dieu8-chunk1'],
      legalCategory: 'DAT_DAI',
    },
  },
);
print('✓ CHUYEN_MUC_DICH_SDD — thêm trích đo bản đồ (conditional)');

// --- 2.5 DK_BIEN_DONG_SANG_TEN — Đ.29, 30 NĐ 101/2024 ---
db.procedures.updateOne(
  { code: 'DK_BIEN_DONG_SANG_TEN' },
  {
    $set: {
      description: 'Tiền kiểm hồ sơ đăng ký biến động (sang tên do chuyển nhượng) theo Điều 29, 30 NĐ 101/2024.',
      checklist: [
        {
          id: 'don_bien_dong',
          documentTypeCode: 'DON_DANG_KY_BIEN_DONG',
          roleInProcedure: 'Đơn đăng ký biến động (Mẫu 11/ĐK) — Đ.29 k.1 NĐ 101/2024',
          isRequired: true,
          quantity: 1,
          points: 15,
        },
        {
          id: 'so_do',
          documentTypeCode: 'SO_DO',
          roleInProcedure: 'Giấy chứng nhận QSDĐ bản gốc (của bên chuyển nhượng) — Đ.29 k.2 NĐ 101/2024',
          isRequired: true,
          quantity: 1,
          points: 20,
        },
        {
          id: 'hop_dong',
          documentTypeCode: 'HOP_DONG_CHUYEN_NHUONG',
          roleInProcedure: 'Hợp đồng chuyển nhượng QSDĐ đã công chứng — Đ.30 k.1 NĐ 101/2024',
          isRequired: true,
          quantity: 1,
          points: 25,
        },
        {
          id: 'cccd_ben_ban',
          documentTypeCode: 'CCCD',
          acceptedCodes: ['CCCD', 'CMND'],
          roleInProcedure: 'CCCD bên chuyển nhượng — xuất trình',
          isRequired: true,
          quantity: 1,
          points: 10,
        },
        {
          id: 'cccd_ben_mua',
          documentTypeCode: 'CCCD',
          acceptedCodes: ['CCCD', 'CMND'],
          roleInProcedure: 'CCCD bên nhận chuyển nhượng — xuất trình',
          isRequired: true,
          quantity: 1,
          points: 10,
        },
        {
          id: 'chung_tu_tai_chinh',
          documentTypeCode: 'CHUNG_TU_NGHIA_VU_TAI_CHINH',
          roleInProcedure: 'Chứng từ hoàn thành nghĩa vụ tài chính (thuế TNCN, lệ phí trước bạ) — Đ.29 NĐ 101/2024',
          isRequired: false,
          conditionalOn: 'đã hoàn thành nghĩa vụ tài chính',
          quantity: 1,
          points: 20,
        },
      ],
      crossCheckRules: [
        {
          name: 'Số thửa khớp giữa sổ đỏ và hợp đồng chuyển nhượng',
          left: 'so_do.soThua',
          right: 'hop_dong.soThua',
          matchType: 'exact',
          severityIfMismatch: 'HIGH',
        },
        {
          name: 'Số thửa khớp giữa sổ đỏ và đơn biến động',
          left: 'so_do.soThua',
          right: 'don_bien_dong.soThua',
          matchType: 'exact',
          severityIfMismatch: 'HIGH',
        },
        {
          name: 'Tên bên bán khớp giữa sổ đỏ và hợp đồng',
          left: 'so_do.tenChuSuDung',
          right: 'hop_dong.tenBenBan',
          matchType: 'normalized',
          severityIfMismatch: 'HIGH',
        },
        {
          name: 'Tên bên bán trên hợp đồng khớp CCCD bên bán',
          left: 'hop_dong.tenBenBan',
          right: 'cccd_ben_ban.hoTen',
          matchType: 'normalized',
          severityIfMismatch: 'HIGH',
        },
        {
          name: 'Tên bên mua trên hợp đồng khớp CCCD bên mua',
          left: 'hop_dong.tenBenMua',
          right: 'cccd_ben_mua.hoTen',
          matchType: 'normalized',
          severityIfMismatch: 'HIGH',
        },
        {
          name: 'Tên chủ quyền mới trên đơn khớp bên mua trên hợp đồng',
          left: 'don_bien_dong.tenChuMoi',
          right: 'hop_dong.tenBenMua',
          matchType: 'normalized',
          severityIfMismatch: 'MEDIUM',
        },
      ],
      legalSourceIds: ['luat-dat-dai-2024-dieu133-chunk1', 'nghi-dinh-101-2024-dieu29-chunk1', 'nghi-dinh-101-2024-dieu30-chunk3'],
      legalCategory: 'DAT_DAI',
    },
  },
);
print('✓ DK_BIEN_DONG_SANG_TEN — thêm chứng từ nghĩa vụ tài chính');

// --- 2.6 DK_THE_CHAP — NĐ 99/2022 về đăng ký biện pháp bảo đảm ---
db.procedures.updateOne(
  { code: 'DK_THE_CHAP' },
  {
    $set: {
      description: 'Tiền kiểm hồ sơ đăng ký thế chấp QSDĐ theo NĐ 99/2022 về đăng ký biện pháp bảo đảm.',
      checklist: [
        {
          id: 'phieu_yeu_cau',
          documentTypeCode: 'PHIEU_YEU_CAU_DANG_KY_THE_CHAP',
          roleInProcedure: 'Phiếu yêu cầu đăng ký thế chấp (theo mẫu NĐ 99/2022) — BẮT BUỘC',
          isRequired: true,
          quantity: 1,
          points: 25,
        },
        {
          id: 'hop_dong_tc',
          documentTypeCode: 'HOP_DONG_THE_CHAP',
          roleInProcedure: 'Hợp đồng thế chấp QSDĐ đã công chứng — NĐ 99/2022',
          isRequired: true,
          quantity: 1,
          points: 30,
        },
        {
          id: 'so_do',
          documentTypeCode: 'SO_DO',
          roleInProcedure: 'Giấy chứng nhận QSDĐ bản gốc (tài sản thế chấp)',
          isRequired: true,
          quantity: 1,
          points: 25,
        },
        {
          id: 'cccd',
          documentTypeCode: 'CCCD',
          acceptedCodes: ['CCCD', 'CMND'],
          roleInProcedure: 'CCCD bên thế chấp — xuất trình',
          isRequired: true,
          quantity: 1,
          points: 20,
        },
      ],
      crossCheckRules: [
        {
          name: 'Số thửa khớp giữa sổ đỏ và hợp đồng thế chấp',
          left: 'so_do.soThua',
          right: 'hop_dong_tc.soThua',
          matchType: 'exact',
          severityIfMismatch: 'HIGH',
        },
        {
          name: 'Tên bên thế chấp khớp tên chủ trên sổ đỏ',
          left: 'hop_dong_tc.tenBenTheChap',
          right: 'so_do.tenChuSuDung',
          matchType: 'normalized',
          severityIfMismatch: 'HIGH',
        },
        {
          name: 'Tên bên thế chấp khớp CCCD',
          left: 'hop_dong_tc.tenBenTheChap',
          right: 'cccd.hoTen',
          matchType: 'normalized',
          severityIfMismatch: 'HIGH',
        },
        {
          name: 'Tên bên thế chấp trên phiếu yêu cầu khớp hợp đồng',
          left: 'phieu_yeu_cau.tenBenTheChap',
          right: 'hop_dong_tc.tenBenTheChap',
          matchType: 'normalized',
          severityIfMismatch: 'MEDIUM',
        },
      ],
      legalSourceIds: ['luat-dat-dai-2024-dieu27-chunk1', 'luat-dat-dai-2024-dieu133-chunk1', 'nghi-dinh-101-2024-dieu1-chunk1'],
      legalCategory: 'DAT_DAI',
    },
  },
);
print('✓ DK_THE_CHAP — thêm Phiếu yêu cầu đăng ký thế chấp (NĐ 99/2022)');

// --- 2.7 TACH_THUA — Đ.7 NĐ 101/2024 ---
db.procedures.updateOne(
  { code: 'TACH_THUA' },
  {
    $set: {
      description: 'Tiền kiểm hồ sơ tách thửa / hợp thửa đất theo Điều 7 NĐ 101/2024.',
      checklist: [
        {
          id: 'don_tach',
          documentTypeCode: 'DON_TACH_THUA',
          roleInProcedure: 'Đơn đề nghị tách thửa/hợp thửa (Mẫu 01/ĐK) — Đ.7 k.1(a) NĐ 101/2024',
          isRequired: true,
          quantity: 1,
          points: 20,
        },
        {
          id: 'ban_ve_tach_thua',
          documentTypeCode: 'BAN_VE_TACH_THUA',
          roleInProcedure: 'Bản vẽ tách thửa/hợp thửa (Mẫu 02/ĐK) do VP ĐKĐĐ hoặc đơn vị đo đạc lập — Đ.7 k.1(b) NĐ 101/2024',
          isRequired: true,
          quantity: 1,
          points: 30,
        },
        {
          id: 'so_do',
          documentTypeCode: 'SO_DO',
          roleInProcedure: 'Giấy chứng nhận QSDĐ của thửa gốc (bản gốc hoặc bản sao công chứng) — Đ.7 k.1(c) NĐ 101/2024',
          isRequired: true,
          quantity: 1,
          points: 30,
        },
        {
          id: 'cccd',
          documentTypeCode: 'CCCD',
          acceptedCodes: ['CCCD', 'CMND'],
          roleInProcedure: 'CCCD người sử dụng đất — xuất trình',
          isRequired: true,
          quantity: 1,
          points: 20,
        },
      ],
      crossCheckRules: [
        {
          name: 'Số thửa gốc trên đơn khớp số thửa trên sổ đỏ',
          left: 'don_tach.soThuaGoc',
          right: 'so_do.soThua',
          matchType: 'exact',
          severityIfMismatch: 'HIGH',
        },
        {
          name: 'Tên người sử dụng đất khớp giữa đơn và sổ đỏ',
          left: 'don_tach.tenNguoiSuDung',
          right: 'so_do.tenChuSuDung',
          matchType: 'normalized',
          severityIfMismatch: 'HIGH',
        },
        {
          name: 'Tên người sử dụng đất khớp CCCD',
          left: 'don_tach.tenNguoiSuDung',
          right: 'cccd.hoTen',
          matchType: 'normalized',
          severityIfMismatch: 'MEDIUM',
        },
        {
          name: 'Số vào sổ GCN khớp giữa đơn và sổ đỏ',
          left: 'don_tach.soVaoSoGCN',
          right: 'so_do.soVaoSo',
          matchType: 'exact',
          severityIfMismatch: 'MEDIUM',
        },
        {
          name: 'Diện tích thửa gốc trên bản vẽ khớp sổ đỏ',
          left: 'ban_ve_tach_thua.dienTichGoc',
          right: 'so_do.dienTich',
          matchType: 'exact',
          severityIfMismatch: 'HIGH',
        },
      ],
      legalSourceIds: ['luat-dat-dai-2024-dieu220-chunk1', 'nghi-dinh-101-2024-dieu7-chunk1'],
      legalCategory: 'DAT_DAI',
    },
  },
);
print('✓ TACH_THUA — thêm Bản vẽ tách thửa Mẫu 02/ĐK (Đ.7 k.1(b) NĐ 101/2024)');

// ═══════════════════════════════════════════════════════════════
// 3. Tổng kết
// ═══════════════════════════════════════════════════════════════
print('');
print('═══════════════════════════════════════════════════');
print('Migration hoàn tất! Tóm tắt:');
print('  - 6 document_types mới đã thêm');
print('  - 7 procedures đã cập nhật checklist theo luật');
print('  - DK_KET_HON: sửa Giấy XN TTHN → conditional');
print('  - CAP_GCN_LAN_DAU: thêm sơ đồ nhà ở, fix documentTypeCode');
print('  - DK_THE_CHAP: thêm Phiếu yêu cầu đăng ký (NĐ 99/2022)');
print('  - TACH_THUA: thêm Bản vẽ tách thửa Mẫu 02/ĐK');
print('═══════════════════════════════════════════════════');
