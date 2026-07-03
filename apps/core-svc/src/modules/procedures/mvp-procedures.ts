import { Procedure } from '../../database/schemas/procedure.schema';

type ProcedureSeed = Omit<Procedure, 'isActive'> & { isActive: boolean };

const scoringRules = {
  baseScore: 100,
  penalties: {
    missingRequired: -20,
    infoMismatch: -10,
    expiredDoc: -15,
    lowQualityImage: -5,
    lowOcrConfidence: -5,
  },
};

const priorityConfig = { baseUrgency: 'MEDIUM' as const, slaDays: 5 };

const verifiedIdentity = {
  id: 'cccd_nguoi_yeu_cau',
  documentTypeCode: 'CCCD',
  acceptedCodes: ['CCCD', 'CMND'],
  label: 'CCCD của người yêu cầu',
  roleInProcedure: 'Thông tin định danh người nộp hồ sơ',
  inputMode: 'EKYC' as const,
  allowReuseVerifiedIdentity: true,
  isRequired: true,
  quantity: 1,
  points: 15,
};

const identityFields = [
  { id: 'nguoiYeuCau.hoTen', label: 'Họ và tên người yêu cầu', required: true, sourceMap: ['cccd_nguoi_yeu_cau.hoTen'] },
  { id: 'nguoiYeuCau.soCCCD', label: 'Số CCCD người yêu cầu', required: true, sourceMap: ['cccd_nguoi_yeu_cau.soCCCD'] },
  { id: 'nguoiYeuCau.ngaySinh', label: 'Ngày sinh người yêu cầu', required: false, sourceMap: ['cccd_nguoi_yeu_cau.ngaySinh'] },
  { id: 'nguoiYeuCau.noiCuTru', label: 'Nơi cư trú người yêu cầu', required: false, sourceMap: ['cccd_nguoi_yeu_cau.noiThuongTru'] },
  { id: 'nguoiYeuCau.dienThoai', label: 'Số điện thoại liên hệ', required: true, sourceMap: [], autofillFromUser: 'phoneNumber' },
  { id: 'nguoiYeuCau.email', label: 'Email liên hệ', required: false, sourceMap: [], autofillFromUser: 'email' },
];

// 2 domain có OCR: HỘ TỊCH (Giấy chứng sinh - Qwen VL) + HỘ KINH DOANH (Giấy ĐKHKD - VNPT).
// Tỷ lệ API: 70% VNPT (CCCD mẹ, CCCD cha, GCN kết hôn) + 30% Qwen (Giấy chứng sinh).
export const MVP_PROCEDURES: ProcedureSeed[] = [
  // ————————————————————————— HỘ TỊCH —————————————————————————
  // Thủ tục đăng ký khai sinh cho trẻ em — kết hợp VNPT OCR (CCCD) + Qwen VL (Giấy chứng sinh):
  //   CCCD mẹ (eKYC VNPT), CCCD cha (VNPT OCR), Giấy chứng sinh (Qwen VL), GCN kết hôn (VNPT OCR).
  // Diện demo: Đăng ký khai sinh cho trẻ vừa sinh (Luật Hộ tịch 2014) → output Giấy khai sinh.
  // LawGuard: category 'HỘ TỊCH' khớp chunk Điều 16-20 Luật Hộ tịch 2014 (data/legal-sources).
  {
    code: 'DANG_KY_KHAI_SINH',
    name: 'Đăng ký khai sinh',
    category: 'HỘ TỊCH',
    description:
      'Đăng ký khai sinh cho trẻ em. ' +
      'Đọc CCCD của mẹ (eKYC), CCCD của cha, Giấy chứng sinh từ bệnh viện (Qwen OCR), Giấy chứng nhận kết hôn (nếu có), ' +
      'đối chiếu chéo thông tin cha mẹ rồi tự điền Tờ khai đăng ký khai sinh.',
    department: 'UBND cấp xã',
    outputTemplate: {
      key: 'KHAI_SINH',
      displayName: 'Tờ khai đăng ký khai sinh',
      originalFile: 'template/renderable/KHAI_SINH.docx',
      version: 'Luật Hộ tịch 2014', outputFormats: ['docx', 'pdf'],
    },
    checklist: [
      { ...verifiedIdentity, label: 'CCCD của mẹ (người yêu cầu)', roleInProcedure: 'Định danh mẹ - người đại diện đăng ký khai sinh cho trẻ' },
      {
        id: 'cccd_cha', documentTypeCode: 'CCCD',
        acceptedCodes: ['CCCD', 'CMND'],
        label: 'CCCD của cha',
        roleInProcedure: 'Chứng minh thông tin cha của trẻ (Điều 16 Luật Hộ tịch 2014)',
        inputMode: 'UPLOAD', isRequired: true, quantity: 1, points: 25,
      },
      {
        id: 'giay_chung_sinh', documentTypeCode: 'GIAY_CHUNG_SINH',
        label: 'Giấy chứng sinh',
        roleInProcedure: 'Chứng minh trẻ đã sinh tại cơ sở y tế (Phụ lục 5 - Thông tư 56/2017/TT-BYT)',
        inputMode: 'UPLOAD', isRequired: true, quantity: 1, points: 35,
      },
      {
        id: 'giay_chung_nhan_ket_hon', documentTypeCode: 'GIAY_CHUNG_NHAN_KET_HON',
        label: 'Giấy chứng nhận kết hôn của cha mẹ',
        roleInProcedure: 'Chứng minh quan hệ hôn nhân hợp pháp của cha mẹ (nếu có)',
        inputMode: 'UPLOAD', isRequired: false, conditionalOn: 'cha mẹ có đăng ký kết hôn', quantity: 1, points: 10,
      },
    ],
    formFields: [
      { id: 'coQuanTiepNhan', label: 'Cơ quan tiếp nhận', required: true, sourceMap: [], defaultValue: 'UBND cấp xã' },

      // Thông tin người yêu cầu (mẹ)
      { id: 'nguoiYeuCau.hoTen', label: 'Họ tên người yêu cầu', required: true, sourceMap: ['cccd_nguoi_yeu_cau.hoTen'] },
      { id: 'nguoiYeuCau.soCCCD', label: 'Số CCCD người yêu cầu', required: true, sourceMap: ['cccd_nguoi_yeu_cau.soCCCD'] },
      { id: 'nguoiYeuCau.noiCuTru', label: 'Nơi cư trú người yêu cầu', required: false, sourceMap: ['cccd_nguoi_yeu_cau.noiThuongTru'] },
      { id: 'nguoiYeuCau.quanHe', label: 'Quan hệ với trẻ', required: true, sourceMap: [], defaultValue: 'Mẹ' },
      { id: 'nguoiYeuCau.dienThoai', label: 'Số điện thoại', required: true, sourceMap: [], autofillFromUser: 'phoneNumber' },
      { id: 'nguoiYeuCau.email', label: 'Email', required: false, sourceMap: [], autofillFromUser: 'email' },

      // Thông tin trẻ em (từ Giấy chứng sinh - Qwen OCR)
      { id: 'treEm.hoTen', label: 'Họ tên trẻ', required: true, sourceMap: ['giay_chung_sinh.tenDuDinh'] },
      { id: 'treEm.gioiTinh', label: 'Giới tính', required: true, sourceMap: ['giay_chung_sinh.gioiTinhCon'] },
      { id: 'treEm.ngaySinh', label: 'Ngày sinh', required: true, sourceMap: ['giay_chung_sinh.thoiGianSinh'] },
      { id: 'treEm.noiSinh', label: 'Nơi sinh', required: true, sourceMap: ['giay_chung_sinh.noiSinh'] },
      { id: 'treEm.canNang', label: 'Cân nặng (kg)', required: false, sourceMap: ['giay_chung_sinh.canNang'] },
      { id: 'treEm.soGiayChungSinh', label: 'Số giấy chứng sinh', required: false, sourceMap: ['giay_chung_sinh.so'] },
      { id: 'treEm.danToc', label: 'Dân tộc', required: false, sourceMap: [], defaultValue: 'Kinh' },
      { id: 'treEm.quocTich', label: 'Quốc tịch', required: false, sourceMap: [], defaultValue: 'Việt Nam' },

      // Thông tin mẹ (từ CCCD mẹ - VNPT eKYC)
      { id: 'me.hoTen', label: 'Họ tên mẹ', required: true, sourceMap: ['cccd_nguoi_yeu_cau.hoTen', 'giay_chung_sinh.hoTenMe'] },
      { id: 'me.soCCCD', label: 'Số CCCD mẹ', required: true, sourceMap: ['cccd_nguoi_yeu_cau.soCCCD'] },
      { id: 'me.ngaySinh', label: 'Ngày sinh mẹ', required: false, sourceMap: ['cccd_nguoi_yeu_cau.ngaySinh', 'giay_chung_sinh.namSinhMe'] },
      { id: 'me.danToc', label: 'Dân tộc mẹ', required: false, sourceMap: ['cccd_nguoi_yeu_cau.danToc', 'giay_chung_sinh.danTocMe'] },
      { id: 'me.quocTich', label: 'Quốc tịch mẹ', required: false, sourceMap: ['cccd_nguoi_yeu_cau.quocTich'], defaultValue: 'Việt Nam' },
      { id: 'me.noiThuongTru', label: 'Nơi thường trú mẹ', required: false, sourceMap: ['cccd_nguoi_yeu_cau.noiThuongTru', 'giay_chung_sinh.noiThuongTruMe'] },

      // Thông tin cha (từ CCCD cha - VNPT OCR)
      { id: 'cha.hoTen', label: 'Họ tên cha', required: true, sourceMap: ['cccd_cha.hoTen', 'giay_chung_sinh.hoTenCha'] },
      { id: 'cha.soCCCD', label: 'Số CCCD cha', required: false, sourceMap: ['cccd_cha.soCCCD'] },
      { id: 'cha.ngaySinh', label: 'Ngày sinh cha', required: false, sourceMap: ['cccd_cha.ngaySinh'] },
      { id: 'cha.danToc', label: 'Dân tộc cha', required: false, sourceMap: ['cccd_cha.danToc'] },
      { id: 'cha.quocTich', label: 'Quốc tịch cha', required: false, sourceMap: ['cccd_cha.quocTich'], defaultValue: 'Việt Nam' },
      { id: 'cha.noiThuongTru', label: 'Nơi thường trú cha', required: false, sourceMap: ['cccd_cha.noiThuongTru'] },

      // Thông tin kết hôn (từ GCN kết hôn - VNPT OCR)
      { id: 'ketHon.so', label: 'Số GCN kết hôn', required: false, sourceMap: ['giay_chung_nhan_ket_hon.so'] },
      { id: 'ketHon.ngayDangKy', label: 'Ngày đăng ký kết hôn', required: false, sourceMap: ['giay_chung_nhan_ket_hon.ngayDangKy'] },
      { id: 'ketHon.noiDangKy', label: 'Nơi đăng ký kết hôn', required: false, sourceMap: ['giay_chung_nhan_ket_hon.noiDangKy'] },
    ],
    crossCheckRules: [
      { name: 'Họ tên mẹ trên CCCD khớp với Giấy chứng sinh', left: 'cccd_nguoi_yeu_cau.hoTen', right: 'giay_chung_sinh.hoTenMe', matchType: 'normalized', severityIfMismatch: 'HIGH', skipIfMissing: 'giay_chung_sinh' },
      { name: 'Họ tên cha trên CCCD khớp với Giấy chứng sinh', left: 'cccd_cha.hoTen', right: 'giay_chung_sinh.hoTenCha', matchType: 'normalized', severityIfMismatch: 'MEDIUM', skipIfMissing: 'cccd_cha' },
      { name: 'Họ tên vợ/chồng trên GCN kết hôn khớp với CCCD cha mẹ', left: 'giay_chung_nhan_ket_hon.hoTenVo', right: 'cccd_nguoi_yeu_cau.hoTen', matchType: 'normalized', severityIfMismatch: 'LOW', skipIfMissing: 'giay_chung_nhan_ket_hon' },
    ],
    scoringRules, priorityConfig, isActive: true,
  },

  // ————————————————————————— HỘ KINH DOANH —————————————————————————
  // OCR thật: doc type HO_KINH_DOANH (endpoint /rpa-service/aidigdoc/v1/ocr/dang-ky-ho-kinh-doanh).
  // Cross-check mạnh nhất: cccd_nguoi_yeu_cau.hoTen ↔ giay_hkd.hoTenChuHo (cả 2 vế OCR thật).
  {
    code: 'HKD_THAY_DOI',
    name: 'Đăng ký thay đổi chủ hộ kinh doanh (do ủy quyền)',
    category: 'HỘ KINH DOANH',
    description: 'Thay đổi chủ hộ kinh doanh do các thành viên hộ gia đình ủy quyền cho một thành viên khác làm chủ hộ (Điều 100 khoản 3 NĐ 168/2025). Đọc GCN ĐKHKD hiện tại, đối chiếu chủ hộ mới với văn bản ủy quyền và CCCD.',
    department: 'Cơ quan đăng ký kinh doanh cấp xã',
    outputTemplate: {
      key: 'HKD_THAY_DOI', displayName: 'Giấy đề nghị đăng ký thay đổi nội dung đăng ký hộ kinh doanh',
      originalFile: 'template/hkd-02-thong-bao-thay-doi-ho-kinh-doanh.docx',
      version: '68/2025/TT-BTC', outputFormats: ['docx', 'pdf'],
    },
    checklist: [
      { ...verifiedIdentity, label: 'CCCD của chủ hộ kinh doanh mới', roleInProcedure: 'Định danh thành viên được ủy quyền làm chủ hộ mới' },
      {
        id: 'giay_hkd', documentTypeCode: 'HO_KINH_DOANH',
        label: 'Giấy chứng nhận đăng ký hộ kinh doanh đã cấp', roleInProcedure: 'Xuất trình để lấy thông tin đăng ký hiện tại (Đ.85 NĐ 168/2025)',
        inputMode: 'UPLOAD', isRequired: true, quantity: 1, points: 35,
      },
      {
        id: 'van_ban_uy_quyen_hgd', documentTypeCode: 'VAN_BAN_UY_QUYEN_HGD',
        label: 'Bản sao văn bản ủy quyền của các thành viên hộ gia đình', roleInProcedure: 'Ủy quyền một thành viên làm chủ hộ — công chứng/chứng thực (Đ.100 k.3 điểm b NĐ 168/2025)',
        inputMode: 'UPLOAD', isRequired: true, quantity: 1, points: 35,
      },
      {
        id: 'van_ban_uy_quyen_thu_tuc', documentTypeCode: 'VAN_BAN_UY_QUYEN_THU_TUC',
        label: 'Văn bản ủy quyền thực hiện thủ tục', roleInProcedure: 'Bắt buộc nếu nhờ người khác nộp hồ sơ thay — không cần công chứng (Đ.93 k.1 NĐ 168/2025)',
        inputMode: 'UPLOAD', isRequired: false, conditionalOn: 'nhờ người khác nộp hồ sơ thay chủ hộ', quantity: 1, points: 10,
      },
    ],
    formFields: [
      { id: 'coQuanTiepNhan', label: 'Cơ quan đăng ký kinh doanh', required: true, sourceMap: [], defaultValue: 'Cơ quan đăng ký kinh doanh cấp xã' },
      { id: 'hoKinhDoanh.tenHoKinhDoanh', label: 'Tên hộ kinh doanh', required: true, sourceMap: ['giay_hkd.tenHoKinhDoanh', 'van_ban_uy_quyen_hgd.tenHoKinhDoanh'] },
      { id: 'hoKinhDoanh.maSo', label: 'Mã số/Số ĐKHKD', required: true, sourceMap: ['giay_hkd.maSoHoKinhDoanh'] },
      { id: 'hoKinhDoanh.dienThoai', label: 'Điện thoại hộ kinh doanh', required: false, sourceMap: ['giay_hkd.dienThoai'] },
      { id: 'hoKinhDoanh.email', label: 'Email hộ kinh doanh', required: false, sourceMap: ['giay_hkd.email'] },
      { id: 'hoKinhDoanh.diaChiKinhDoanh', label: 'Địa chỉ kinh doanh hiện tại', required: false, sourceMap: ['giay_hkd.diaChiKinhDoanh'] },

      // Chủ hộ cũ (TRƯỚC khi thay đổi) - lấy từ Giấy ĐKHKD
      { id: 'chuHoCu.hoTen', label: 'Họ tên chủ hộ trước khi thay đổi', required: true, sourceMap: ['giay_hkd.hoTenChuHo', 'van_ban_uy_quyen_hgd.tenNguoiUyQuyen'] },
      { id: 'chuHoCu.soCCCD', label: 'Số CCCD chủ hộ cũ', required: true, sourceMap: ['giay_hkd.soCCCDChuHo'] },
      { id: 'chuHoCu.ngaySinh', label: 'Ngày sinh chủ hộ cũ', required: false, sourceMap: ['giay_hkd.ngaySinhChuHo'] },
      { id: 'chuHoCu.gioiTinh', label: 'Giới tính chủ hộ cũ', required: false, sourceMap: ['giay_hkd.gioiTinhChuHo'] },
      { id: 'chuHoCu.danToc', label: 'Dân tộc chủ hộ cũ', required: false, sourceMap: ['giay_hkd.danTocChuHo'] },
      { id: 'chuHoCu.quocTich', label: 'Quốc tịch chủ hộ cũ', required: false, sourceMap: ['giay_hkd.quocTichChuHo'], defaultValue: 'Việt Nam' },
      { id: 'chuHoCu.ngayCap', label: 'Ngày cấp CCCD chủ hộ cũ', required: false, sourceMap: ['giay_hkd.ngayCapCCCDChuHo'] },
      { id: 'chuHoCu.noiCap', label: 'Nơi cấp CCCD chủ hộ cũ', required: false, sourceMap: ['giay_hkd.noiCapCCCDChuHo'] },
      { id: 'chuHoCu.diaChiThuongTru', label: 'Địa chỉ thường trú chủ hộ cũ', required: false, sourceMap: ['giay_hkd.diaChiThuongTruChuHo'] },
      { id: 'chuHoCu.dienThoai', label: 'Điện thoại chủ hộ cũ', required: false, sourceMap: ['giay_hkd.dienThoaiChuHo'] },
      { id: 'chuHoCu.email', label: 'Email chủ hộ cũ', required: false, sourceMap: ['giay_hkd.emailChuHo'] },

      // Chủ hộ mới (SAU khi thay đổi) - lấy từ eKYC
      { id: 'chuHoMoi.hoTen', label: 'Họ tên chủ hộ sau khi thay đổi', required: true, sourceMap: ['cccd_nguoi_yeu_cau.hoTen', 'van_ban_uy_quyen_hgd.tenNguoiDuocUyQuyen'] },
      { id: 'chuHoMoi.soCCCD', label: 'Số CCCD chủ hộ mới', required: true, sourceMap: ['cccd_nguoi_yeu_cau.soCCCD'] },
      { id: 'chuHoMoi.ngaySinh', label: 'Ngày sinh chủ hộ mới', required: false, sourceMap: ['cccd_nguoi_yeu_cau.ngaySinh'] },
      { id: 'chuHoMoi.gioiTinh', label: 'Giới tính chủ hộ mới', required: false, sourceMap: ['cccd_nguoi_yeu_cau.gioiTinh'] },
      { id: 'chuHoMoi.danToc', label: 'Dân tộc chủ hộ mới', required: false, sourceMap: ['cccd_nguoi_yeu_cau.danToc'] },
      { id: 'chuHoMoi.quocTich', label: 'Quốc tịch chủ hộ mới', required: false, sourceMap: ['cccd_nguoi_yeu_cau.quocTich'], defaultValue: 'Việt Nam' },
      { id: 'chuHoMoi.ngayCap', label: 'Ngày cấp CCCD chủ hộ mới', required: false, sourceMap: ['cccd_nguoi_yeu_cau.ngayCap'] },
      { id: 'chuHoMoi.noiCap', label: 'Nơi cấp CCCD chủ hộ mới', required: false, sourceMap: ['cccd_nguoi_yeu_cau.noiCap'] },
      { id: 'chuHoMoi.diaChiThuongTru', label: 'Địa chỉ thường trú chủ hộ mới', required: false, sourceMap: ['cccd_nguoi_yeu_cau.noiThuongTru'] },
      { id: 'chuHoMoi.dienThoai', label: 'Điện thoại chủ hộ mới', required: false, sourceMap: [], autofillFromUser: 'phoneNumber' },
      { id: 'chuHoMoi.email', label: 'Email chủ hộ mới', required: false, sourceMap: [], autofillFromUser: 'email' },

      { id: 'thayDoi.lyDo', label: 'Lý do thay đổi chủ hộ', required: true, sourceMap: [], defaultValue: 'Thành viên hộ gia đình ủy quyền' },
      { id: 'thayDoi.noiDung', label: 'Nội dung thay đổi', required: true, sourceMap: [], defaultValue: 'Thay đổi chủ hộ kinh doanh' },
    ],
    crossCheckRules: [
      // Cross-check chủ hộ mới
      { name: 'Chủ hộ mới trên CCCD khớp người được ủy quyền trong văn bản ủy quyền HGĐ', left: 'cccd_nguoi_yeu_cau.hoTen', right: 'van_ban_uy_quyen_hgd.tenNguoiDuocUyQuyen', matchType: 'normalized', severityIfMismatch: 'HIGH', skipIfMissing: 'van_ban_uy_quyen_hgd' },

      // Cross-check chủ hộ cũ (từ Giấy ĐKHKD)
      { name: 'Chủ hộ cũ trên Giấy ĐKHKD khớp người ủy quyền trong văn bản ủy quyền HGĐ', left: 'giay_hkd.hoTenChuHo', right: 'van_ban_uy_quyen_hgd.tenNguoiUyQuyen', matchType: 'normalized', severityIfMismatch: 'HIGH', skipIfMissing: 'van_ban_uy_quyen_hgd' },

      // Cross-check tên hộ kinh doanh
      { name: 'Tên hộ kinh doanh trên văn bản ủy quyền khớp Giấy chứng nhận ĐKHKD', left: 'van_ban_uy_quyen_hgd.tenHoKinhDoanh', right: 'giay_hkd.tenHoKinhDoanh', matchType: 'normalized', severityIfMismatch: 'MEDIUM', skipIfMissing: 'van_ban_uy_quyen_hgd' },

      // Cross-check văn bản ủy quyền thủ tục (nếu có)
      { name: 'Người ủy quyền nộp thủ tục khớp chủ hộ mới trên CCCD', left: 'van_ban_uy_quyen_thu_tuc.tenNguoiUyQuyen', right: 'cccd_nguoi_yeu_cau.hoTen', matchType: 'normalized', severityIfMismatch: 'LOW', skipIfMissing: 'van_ban_uy_quyen_thu_tuc' },
    ],
    scoringRules, priorityConfig, isActive: true,
  },

  // ————————————————————————— ĐẤT ĐAI —————————————————————————
  // Thủ tục chuyển nhượng QSDĐ — 5 giấy tờ, kết hợp VNPT + Qwen OCR.
  // Qwen VL xử lý: Sổ đỏ, Hợp đồng chuyển nhượng, các văn bản ủy quyền.
  // VNPT xử lý: CCCD/CMND (eKYC thật).
  {
    code: 'CHUYEN_NHUONG_QSDD',
    name: 'Chuyển nhượng quyền sử dụng đất',
    category: 'ĐẤT ĐAI',
    description:
      'Chuyển nhượng quyền sử dụng đất có sổ đỏ (Điều 188 Luật Đất đai 2024). ' +
      'Đọc CCCD, Sổ đỏ/GCN QSDĐ, Hợp đồng chuyển nhượng, các văn bản ủy quyền, ' +
      'đối chiếu thông tin chủ sở hữu và bên chuyển nhượng, tự điền Đơn đề nghị cấp GCN QSDĐ.',
    department: 'Văn phòng đăng ký đất đai',
    outputTemplate: {
      key: 'DKDD_CHUYEN_NHUONG',
      displayName: 'Đơn đăng ký đất đai, tài sản gắn liền với đất (Mẫu số 15)',
      originalFile: 'template/renderable/DKDD_CHUYEN_NHUONG.docx',
      version: 'Luật Đất đai 2024',
      outputFormats: ['docx', 'pdf'],
    },
    checklist: [
      { ...verifiedIdentity, label: 'CCCD của bên nhận chuyển nhượng', roleInProcedure: 'Định danh bên nhận chuyển nhượng QSDĐ' },
      {
        id: 'so_do_ben_chuyen_nhuong',
        documentTypeCode: 'GIAY_CHUNG_NHAN_QSDD',
        label: 'Giấy chứng nhận QSDĐ (sổ đỏ) của bên chuyển nhượng',
        roleInProcedure: 'Chứng minh quyền sở hữu của bên chuyển nhượng (Đ.188 k.1 điểm a Luật Đất đai 2024)',
        inputMode: 'UPLOAD',
        isRequired: true,
        quantity: 1,
        points: 40,
      },
      {
        id: 'hop_dong_chuyen_nhuong',
        documentTypeCode: 'HOP_DONG_CHUYEN_NHUONG',
        label: 'Hợp đồng chuyển nhượng QSDĐ (đã công chứng)',
        roleInProcedure: 'Hợp đồng chuyển nhượng được công chứng hoặc chứng thực (Đ.188 k.1 điểm b Luật Đất đai 2024)',
        inputMode: 'UPLOAD',
        isRequired: true,
        quantity: 1,
        points: 40,
      },
      {
        id: 'van_ban_uy_quyen_ben_chuyen_nhuong',
        documentTypeCode: 'VAN_BAN_UY_QUYEN_THU_TUC',
        label: 'Văn bản ủy quyền của bên chuyển nhượng (nếu có)',
        roleInProcedure: 'Ủy quyền cho người khác thực hiện thủ tục thay bên chuyển nhượng',
        inputMode: 'UPLOAD',
        isRequired: false,
        conditionalOn: 'bên chuyển nhượng ủy quyền cho người khác nộp hồ sơ',
        quantity: 1,
        points: 10,
      },
      {
        id: 'van_ban_uy_quyen_ben_nhan',
        documentTypeCode: 'VAN_BAN_UY_QUYEN_THU_TUC',
        label: 'Văn bản ủy quyền của bên nhận chuyển nhượng (nếu có)',
        roleInProcedure: 'Ủy quyền cho người khác thực hiện thủ tục thay bên nhận chuyển nhượng',
        inputMode: 'UPLOAD',
        isRequired: false,
        conditionalOn: 'bên nhận chuyển nhượng ủy quyền cho người khác nộp hồ sơ',
        quantity: 1,
        points: 10,
      },
    ],
    formFields: [
      // Cơ quan tiếp nhận
      { id: 'coQuanTiepNhan', label: 'Cơ quan tiếp nhận', required: true, sourceMap: [], defaultValue: 'Văn phòng đăng ký đất đai' },

      // Phần 1 - Người sử dụng đất (bên nhận chuyển nhượng)
      { id: 'benNhan.hoTen', label: 'Họ tên bên nhận chuyển nhượng', required: true, sourceMap: ['cccd_nguoi_yeu_cau.hoTen', 'hop_dong_chuyen_nhuong.benNhanChuyenNhuong'] },
      { id: 'benNhan.soCCCD', label: 'Số CCCD bên nhận', required: true, sourceMap: ['cccd_nguoi_yeu_cau.soCCCD'] },
      { id: 'benNhan.diaChiThuongTru', label: 'Địa chỉ thường trú bên nhận', required: true, sourceMap: ['cccd_nguoi_yeu_cau.noiThuongTru'] },
      { id: 'benNhan.dienThoai', label: 'Số điện thoại liên hệ', required: true, sourceMap: [], autofillFromUser: 'phoneNumber' },
      { id: 'benNhan.email', label: 'Email liên hệ', required: false, sourceMap: [], autofillFromUser: 'email' },

      // Phần 2 - Thông tin thửa đất (từ hợp đồng Điều 1)
      { id: 'thuaDat.soThua', label: 'Số thửa', required: true, sourceMap: ['hop_dong_chuyen_nhuong.thuaDatSo', 'so_do_ben_chuyen_nhuong.soThua'] },
      { id: 'thuaDat.soTo', label: 'Số tờ bản đồ', required: true, sourceMap: ['hop_dong_chuyen_nhuong.toBanDoSo', 'so_do_ben_chuyen_nhuong.soTo'] },
      { id: 'thuaDat.diaChi', label: 'Địa chỉ thửa đất', required: true, sourceMap: ['hop_dong_chuyen_nhuong.diaChiThuaDat', 'so_do_ben_chuyen_nhuong.diaChiNha'] },
      { id: 'thuaDat.dienTich', label: 'Diện tích (m²)', required: true, sourceMap: ['hop_dong_chuyen_nhuong.dienTich', 'so_do_ben_chuyen_nhuong.dienTich'] },
      { id: 'thuaDat.suDungRieng', label: 'Diện tích sử dụng riêng (m²)', required: false, sourceMap: ['hop_dong_chuyen_nhuong.suDungRieng'] },
      { id: 'thuaDat.suDungChung', label: 'Diện tích sử dụng chung (m²)', required: false, sourceMap: ['hop_dong_chuyen_nhuong.suDungChung'], defaultValue: '0' },
      { id: 'thuaDat.mucDichSuDung', label: 'Mục đích sử dụng', required: true, sourceMap: ['hop_dong_chuyen_nhuong.mucDichSuDung'], defaultValue: 'Đất ở' },
      { id: 'thuaDat.thoiHan', label: 'Thời hạn sử dụng', required: true, sourceMap: ['hop_dong_chuyen_nhuong.thoiHanSuDung'], defaultValue: 'Lâu dài' },
      { id: 'thuaDat.nguonGoc', label: 'Nguồn gốc sử dụng đất', required: true, sourceMap: ['hop_dong_chuyen_nhuong.nguonGocSuDung'] },
      { id: 'thuaDat.hanCheQuyen', label: 'Hạn chế quyền sử dụng', required: false, sourceMap: ['hop_dong_chuyen_nhuong.hanCheQuyen'], defaultValue: 'Không có' },
      { id: 'thuaDat.soGiayChungNhan', label: 'Số GCN QSDĐ hiện tại', required: false, sourceMap: ['so_do_ben_chuyen_nhuong.soGiayChungNhan'] },

      // Thông tin bên chuyển nhượng (từ sổ đỏ)
      { id: 'benChuyen.hoTen', label: 'Họ tên bên chuyển nhượng', required: true, sourceMap: ['so_do_ben_chuyen_nhuong.tenChuSoHuu', 'hop_dong_chuyen_nhuong.benChuyenNhuong'] },
      { id: 'benChuyen.soCCCD', label: 'Số CCCD bên chuyển nhượng', required: false, sourceMap: ['so_do_ben_chuyen_nhuong.soCCCD'] },

      // Thông tin giao dịch (từ hợp đồng Điều 2)
      { id: 'hopDong.giaChuyenNhuong', label: 'Giá chuyển nhượng', required: true, sourceMap: ['hop_dong_chuyen_nhuong.giaChuyenNhuong'] },
      { id: 'hopDong.ngayKy', label: 'Ngày ký hợp đồng', required: true, sourceMap: ['hop_dong_chuyen_nhuong.ngayKy'] },
      { id: 'hopDong.noiCongChung', label: 'Nơi công chứng', required: false, sourceMap: ['hop_dong_chuyen_nhuong.noiCongChung'] },

      // Phần 3 - Nhà ở, công trình xây dựng (từ hợp đồng Điều 1.2 - OPTIONAL)
      { id: 'congTrinh.dangKy', label: 'Đăng ký công trình xây dựng', required: false, sourceMap: [], defaultValue: 'false' },
      { id: 'congTrinh.loai', label: 'Loại công trình', required: false, sourceMap: ['hop_dong_chuyen_nhuong.loaiCongTrinh'] },
      { id: 'congTrinh.soTang', label: 'Số tầng cao của công trình', required: false, sourceMap: ['hop_dong_chuyen_nhuong.soTangCao'] },
      { id: 'congTrinh.chieuCao', label: 'Chiều cao tối đa', required: false, sourceMap: ['hop_dong_chuyen_nhuong.chieuCaoToiDa'] },
      { id: 'congTrinh.matDoXayDung', label: 'Mật độ xây dựng', required: false, sourceMap: ['hop_dong_chuyen_nhuong.matDoXayDung'] },
      { id: 'congTrinh.chiTieuKhac', label: 'Các chỉ tiêu khác theo quy hoạch', required: false, sourceMap: ['hop_dong_chuyen_nhuong.chiTieuKhac'] },

      // Phần 4 - Đề nghị khác
      { id: 'deNghiKhac', label: 'Đề nghị khác (nếu có)', required: false, sourceMap: [], defaultValue: '' },
    ],
    crossCheckRules: [
      { name: 'Bên nhận chuyển nhượng trên CCCD khớp với hợp đồng', left: 'cccd_nguoi_yeu_cau.hoTen', right: 'hop_dong_chuyen_nhuong.benNhanChuyenNhuong', matchType: 'normalized', severityIfMismatch: 'HIGH', skipIfMissing: 'hop_dong_chuyen_nhuong' },
      { name: 'Bên chuyển nhượng trên sổ đỏ khớp với hợp đồng', left: 'so_do_ben_chuyen_nhuong.tenChuSoHuu', right: 'hop_dong_chuyen_nhuong.benChuyenNhuong', matchType: 'normalized', severityIfMismatch: 'HIGH', skipIfMissing: 'hop_dong_chuyen_nhuong' },
      { name: 'Địa chỉ thửa đất trên sổ đỏ khớp với hợp đồng', left: 'so_do_ben_chuyen_nhuong.diaChiNha', right: 'hop_dong_chuyen_nhuong.diaChiThuaDat', matchType: 'fuzzy', tolerance: 0.6, severityIfMismatch: 'MEDIUM', skipIfMissing: 'hop_dong_chuyen_nhuong' },
      { name: 'Diện tích trên sổ đỏ khớp với hợp đồng', left: 'so_do_ben_chuyen_nhuong.dienTich', right: 'hop_dong_chuyen_nhuong.dienTich', matchType: 'normalized', severityIfMismatch: 'MEDIUM', skipIfMissing: 'hop_dong_chuyen_nhuong' },
    ],
    scoringRules,
    priorityConfig,
    isActive: true,
  },
];
