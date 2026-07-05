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

// CCCD của người yêu cầu: Đã xác thực qua eKYC khi đăng ký tài khoản.
// Hệ thống tự tái sử dụng dữ liệu — không hiển thị trong checklist upload, không cần upload lại.
// Giới tính eKYC → xác định vai trò: Nữ → Mẹ/Bên nhận/Chủ hộ mới, Nam → Cha/Bên nhận/Chủ hộ mới.
const verifiedIdentity = {
  id: 'cccd_nguoi_yeu_cau',
  documentTypeCode: 'CCCD',
  acceptedCodes: ['CCCD', 'CMND'],
  label: 'Định danh người yêu cầu (từ eKYC tài khoản)',
  roleInProcedure: 'Đã xác thực khi đăng ký tài khoản — hệ thống tự sử dụng, không cần upload lại',
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
      { ...verifiedIdentity, label: 'Người yêu cầu (eKYC — tái sử dụng từ tài khoản)', roleInProcedure: 'Định danh người nộp hồ sơ — đã xác thực eKYC khi lập tài khoản, giới tính xác định vai trò Mẹ/Cha (Đ.9 NĐ 123/2015)' },
      {
        // Slot này là CCCD của phụ huynh CÒN LẠI (không phải người yêu cầu)
        // Nếu người yêu cầu là Mẹ (Nữ) → đây là CCCD cha (tùy chọn)
        // Nếu người yêu cầu là Cha (Nam) → đây là CCCD mẹ (tùy chọn)
        // Thông tin cha/mẹ đã có trong giấy chứng sinh — slot này chỉ để bổ sung số CCCD
        id: 'cccd_phu_huynh_con_lai', documentTypeCode: 'CCCD',
        acceptedCodes: ['CCCD', 'CMND'],
        label: 'CCCD của phụ huynh còn lại (nếu có)',
        roleInProcedure: 'Bổ sung số CCCD của cha hoặc mẹ không phải người yêu cầu — giấy tờ tùy thân nộp kèm khi đăng ký khai sinh (Đ.9 NĐ 123/2015)',
        inputMode: 'UPLOAD', isRequired: false, conditionalOn: 'muốn bổ sung đầy đủ số CCCD phụ huynh còn lại', quantity: 1, points: 15,
      },
      {
        id: 'giay_chung_sinh', documentTypeCode: 'GIAY_CHUNG_SINH',
        label: 'Giấy chứng sinh',
        roleInProcedure: 'Chứng minh trẻ đã sinh tại cơ sở y tế, là căn cứ nộp kèm tờ khai đăng ký khai sinh (Đ.16 Luật Hộ tịch 2014)',
        inputMode: 'UPLOAD', isRequired: true, quantity: 1, points: 35, // Giấy chứng sinh là căn cứ BẮT BUỘC để đăng ký khai sinh (Đ.16 Luật Hộ tịch 2014)
      },
      {
        id: 'giay_chung_nhan_ket_hon', documentTypeCode: 'GIAY_KET_HON',
        label: 'Giấy chứng nhận kết hôn của cha mẹ',
        roleInProcedure: 'Chứng minh quan hệ hôn nhân hợp pháp của cha mẹ (nếu có)',
        inputMode: 'UPLOAD', isRequired: false, conditionalOn: 'cha mẹ có đăng ký kết hôn', quantity: 1, points: 10,
      },
    ],
    formFields: [
      { id: 'coQuanTiepNhan', label: 'Cơ quan tiếp nhận', required: true, sourceMap: [], defaultValue: 'UBND cấp xã' },

      // Thông tin người yêu cầu (mẹ)
      { id: 'nguoiYeuCau.hoTen', label: 'Họ tên người yêu cầu', required: true, sourceMap: ['cccd_nguoi_yeu_cau.hoTen'] },
      { id: 'nguoiYeuCau.ngaySinh', label: 'Ngày sinh người yêu cầu', required: false, sourceMap: ['cccd_nguoi_yeu_cau.ngaySinh'] },
      { id: 'nguoiYeuCau.soCCCD', label: 'Số CCCD người yêu cầu', required: true, sourceMap: ['cccd_nguoi_yeu_cau.soCCCD'] },
      { id: 'nguoiYeuCau.noiCuTru', label: 'Nơi cư trú người yêu cầu', required: false, sourceMap: ['cccd_nguoi_yeu_cau.noiThuongTru'] },
      { id: 'nguoiYeuCau.danToc', label: 'Dân tộc người yêu cầu', required: false, sourceMap: [], defaultValue: 'Kinh' },
      { id: 'nguoiYeuCau.quocTich', label: 'Quốc tịch người yêu cầu', required: false, sourceMap: ['cccd_nguoi_yeu_cau.quocTich'], defaultValue: 'Việt Nam' },
      { id: 'nguoiYeuCau.quanHe', label: 'Quan hệ với trẻ', required: true, sourceMap: ['cccd_nguoi_yeu_cau.gioiTinh'], defaultValue: 'Mẹ' }, // tự xác định từ giới tính eKYC: Nữ → Mẹ, Nam → Cha
      { id: 'nguoiYeuCau.dienThoai', label: 'Số điện thoại', required: true, sourceMap: [], autofillFromUser: 'phoneNumber' },
      { id: 'nguoiYeuCau.email', label: 'Email', required: false, sourceMap: [], autofillFromUser: 'email' },

      // Thông tin trẻ em (từ Giấy chứng sinh - Qwen OCR)
      { id: 'treEm.hoTen', label: 'Họ tên trẻ', required: true, sourceMap: ['giay_chung_sinh.hoTenCon'], defaultValue: '(Chưa đặt tên)' },
      { id: 'treEm.gioiTinh', label: 'Giới tính', required: true, sourceMap: ['giay_chung_sinh.gioiTinhCon'], defaultValue: 'Nam' },
      { id: 'treEm.ngaySinh', label: 'Ngày sinh', required: true, sourceMap: ['giay_chung_sinh.ngaySinhCon'], defaultValue: '01/01/2026' },
      { id: 'treEm.noiSinh', label: 'Nơi sinh', required: true, sourceMap: ['giay_chung_sinh.noiSinh'], defaultValue: 'Bệnh viện' },
      { id: 'treEm.canNang', label: 'Cân nặng (kg)', required: false, sourceMap: ['giay_chung_sinh.canNang'] },
      { id: 'treEm.soGiayChungSinh', label: 'Số giấy chứng sinh', required: false, sourceMap: ['giay_chung_sinh.so'] },
      { id: 'treEm.danToc', label: 'Dân tộc', required: false, sourceMap: [], defaultValue: 'Kinh' },
      { id: 'treEm.quocTich', label: 'Quốc tịch', required: false, sourceMap: [], defaultValue: 'Việt Nam' },
      { id: 'treEm.queQuan', label: 'Quê quán', required: true, sourceMap: [], defaultValue: 'Hà Nội' },

      // Thông tin phụ huynh còn lại (không phải người yêu cầu)
      // sourceMap ưu tiên: giấy chứng sinh > GCN kết hôn > CCCD phụ huynh còn lại
      { id: 'phuHuynh2.hoTen', label: 'Họ tên phụ huynh còn lại', required: true, sourceMap: ['giay_chung_sinh.hoTenCha', 'giay_chung_sinh.hoTenMe', 'giay_chung_nhan_ket_hon.hoTenChong', 'giay_chung_nhan_ket_hon.hoTenVo', 'cccd_phu_huynh_con_lai.hoTen'] },
      { id: 'phuHuynh2.soCCCD', label: 'Số CCCD phụ huynh còn lại', required: false, sourceMap: ['cccd_phu_huynh_con_lai.soCCCD', 'giay_chung_nhan_ket_hon.soCCCDChong'] },
      { id: 'phuHuynh2.ngaySinh', label: 'Ngày sinh phụ huynh còn lại', required: false, sourceMap: ['giay_chung_sinh.namSinhCha', 'giay_chung_sinh.namSinhMe', 'cccd_phu_huynh_con_lai.ngaySinh'] },
      { id: 'phuHuynh2.danToc', label: 'Dân tộc phụ huynh còn lại', required: false, sourceMap: ['cccd_phu_huynh_con_lai.danToc'] },
      { id: 'phuHuynh2.quocTich', label: 'Quốc tịch phụ huynh còn lại', required: false, sourceMap: ['cccd_phu_huynh_con_lai.quocTich'], defaultValue: 'Việt Nam' },
      { id: 'phuHuynh2.noiThuongTru', label: 'Nơi thường trú phụ huynh còn lại', required: false, sourceMap: ['cccd_phu_huynh_con_lai.noiThuongTru'] },

      // Thông tin kết hôn (từ GCN kết hôn - VNPT OCR)
      { id: 'ketHon.so', label: 'Số GCN kết hôn', required: false, sourceMap: ['giay_chung_nhan_ket_hon.soGiayTo'] },
      { id: 'ketHon.quyenSo', label: 'Quyển số GCN kết hôn', required: false, sourceMap: ['giay_chung_nhan_ket_hon.quyenSo'] },
      { id: 'ketHon.ngayDangKy', label: 'Ngày đăng ký kết hôn', required: false, sourceMap: ['giay_chung_nhan_ket_hon.ngayDangKy'] },
      { id: 'ketHon.noiDangKy', label: 'Nơi đăng ký kết hôn', required: false, sourceMap: ['giay_chung_nhan_ket_hon.noiDangKy'] },
    ],
    crossCheckRules: [
      { name: 'Họ tên người yêu cầu khớp với Giấy chứng sinh', left: 'cccd_nguoi_yeu_cau.hoTen', right: 'giay_chung_sinh.hoTenMe', matchType: 'normalized', severityIfMismatch: 'HIGH', skipIfMissing: 'giay_chung_sinh',
        legalBasis: { article: 'Điều 16 Luật Hộ tịch 2014', note: 'Thông tin cha mẹ trong tờ khai đăng ký khai sinh phải khớp với giấy chứng sinh để xác định đúng quan hệ và nhân thân.' } },
      { name: 'Họ tên phụ huynh còn lại trên CCCD khớp với Giấy chứng sinh', left: 'cccd_phu_huynh_con_lai.hoTen', right: 'giay_chung_sinh.hoTenCha', matchType: 'normalized', severityIfMismatch: 'MEDIUM', skipIfMissing: 'cccd_phu_huynh_con_lai',
        legalBasis: { article: 'Điều 16 Luật Hộ tịch 2014', note: 'Họ tên cha/mẹ trên CCCD phải trùng với giấy chứng sinh để chứng minh quan hệ cha mẹ – con.' } },
      { name: 'Họ tên vợ/chồng trên GCN kết hôn khớp với người yêu cầu', left: 'giay_chung_nhan_ket_hon.hoTenVo', right: 'cccd_nguoi_yeu_cau.hoTen', matchType: 'normalized', severityIfMismatch: 'LOW', skipIfMissing: 'giay_chung_nhan_ket_hon',
        legalBasis: { article: 'Điều 15 Nghị định 123/2015/NĐ-CP', note: 'Giấy chứng nhận kết hôn dùng để xác định quan hệ hôn nhân của cha mẹ khi đăng ký khai sinh.' } },
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
      originalFile: 'template/renderable/HKD_THAY_DOI.docx',
      version: '68/2025/TT-BTC', outputFormats: ['docx', 'pdf'],
    },
    checklist: [
      { ...verifiedIdentity, label: 'Người yêu cầu (eKYC — tái sử dụng từ tài khoản)', roleInProcedure: 'Định danh chủ hộ mới — đã xác thực eKYC khi lập tài khoản, không cần upload lại' },
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
      { id: 'coQuanTiepNhan', label: 'Cơ quan đăng ký kinh doanh', required: true, sourceMap: ['giay_hkd.donViCap'], defaultValue: 'Cơ quan đăng ký kinh doanh cấp xã' },
      { id: 'hoKinhDoanh.tenHoKinhDoanh', label: 'Tên hộ kinh doanh', required: true, sourceMap: ['giay_hkd.tenHoKinhDoanh', 'van_ban_uy_quyen_hgd.tenHoKinhDoanh'] },
      { id: 'hoKinhDoanh.maSo', label: 'Mã số/Số ĐKHKD', required: true, sourceMap: ['giay_hkd.maSoHoKinhDoanh'] },
      { id: 'hoKinhDoanh.dienThoai', label: 'Điện thoại hộ kinh doanh', required: false, sourceMap: ['giay_hkd.dienThoai'] },
      { id: 'hoKinhDoanh.email', label: 'Email hộ kinh doanh', required: false, sourceMap: ['giay_hkd.email'] },
      { id: 'hoKinhDoanh.diaChiKinhDoanh', label: 'Địa chỉ kinh doanh hiện tại', required: false, sourceMap: ['giay_hkd.diaChiKinhDoanh'] },

      // Chủ hộ cũ (TRƯỚC khi thay đổi) - lấy từ Giấy ĐKHKD
      { id: 'chuHoCu.hoTen', label: 'Họ tên chủ hộ trước khi thay đổi', required: true, sourceMap: ['giay_hkd.hoTenChuHo', 'van_ban_uy_quyen_hgd.tenNguoiUyQuyen'] },
      { id: 'chuHoCu.soCCCD', label: 'Số CCCD chủ hộ cũ', required: true, sourceMap: ['giay_hkd.soGiayTo'] },
      { id: 'chuHoCu.ngaySinh', label: 'Ngày sinh chủ hộ cũ', required: false, sourceMap: ['giay_hkd.ngaySinhChuHo'] },
      { id: 'chuHoCu.gioiTinh', label: 'Giới tính chủ hộ cũ', required: false, sourceMap: ['giay_hkd.gioiTinhChuHo'] },
      { id: 'chuHoCu.danToc', label: 'Dân tộc chủ hộ cũ', required: false, sourceMap: ['giay_hkd.danTocChuHo'] },
      { id: 'chuHoCu.quocTich', label: 'Quốc tịch chủ hộ cũ', required: false, sourceMap: ['giay_hkd.quocTichChuHo'], defaultValue: 'Việt Nam' },
      { id: 'chuHoCu.ngayCap', label: 'Ngày cấp CCCD chủ hộ cũ', required: false, sourceMap: ['giay_hkd.ngayCapCCCDChuHo'] },
      { id: 'chuHoCu.noiCap', label: 'Nơi cấp CCCD chủ hộ cũ', required: false, sourceMap: ['giay_hkd.noiCapCCCDChuHo'] },
      { id: 'chuHoCu.hanSuDung', label: 'CCCD chủ hộ cũ có giá trị đến', required: false, sourceMap: [] },
      { id: 'chuHoCu.diaChiThuongTru', label: 'Địa chỉ thường trú chủ hộ cũ', required: false, sourceMap: ['giay_hkd.noiThuongTruChuHo'] },
      { id: 'chuHoCu.dienThoai', label: 'Điện thoại chủ hộ cũ', required: false, sourceMap: ['giay_hkd.dienThoaiChuHo'] },
      { id: 'chuHoCu.email', label: 'Email chủ hộ cũ', required: false, sourceMap: ['giay_hkd.emailChuHo'] },

      // Chủ hộ mới (SAU khi thay đổi) - lấy từ eKYC
      { id: 'chuHoMoi.hoTen', label: 'Họ tên chủ hộ sau khi thay đổi', required: true, sourceMap: ['cccd_nguoi_yeu_cau.hoTen', 'van_ban_uy_quyen_hgd.tenNguoiDuocUyQuyen'] },
      { id: 'chuHoMoi.soCCCD', label: 'Số CCCD chủ hộ mới', required: true, sourceMap: ['cccd_nguoi_yeu_cau.soCCCD'] },
      { id: 'chuHoMoi.ngaySinh', label: 'Ngày sinh chủ hộ mới', required: false, sourceMap: ['cccd_nguoi_yeu_cau.ngaySinh'] },
      { id: 'chuHoMoi.gioiTinh', label: 'Giới tính chủ hộ mới', required: false, sourceMap: ['cccd_nguoi_yeu_cau.gioiTinh'] },
      { id: 'chuHoMoi.danToc', label: 'Dân tộc chủ hộ mới', required: false, sourceMap: ['cccd_nguoi_yeu_cau.danToc'], defaultValue: 'Kinh' },
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
      { name: 'Chủ hộ mới trên CCCD khớp người được ủy quyền trong văn bản ủy quyền HGĐ', left: 'cccd_nguoi_yeu_cau.hoTen', right: 'van_ban_uy_quyen_hgd.tenNguoiDuocUyQuyen', matchType: 'normalized', severityIfMismatch: 'HIGH', skipIfMissing: 'van_ban_uy_quyen_hgd',
        legalBasis: { article: 'Điều 100 khoản 3 NĐ 168/2025/NĐ-CP', note: 'Chủ hộ mới phải đúng là người được các thành viên hộ gia đình ủy quyền — tên trên CCCD phải khớp văn bản ủy quyền.' } },

      // Cross-check chủ hộ cũ (từ Giấy ĐKHKD)
      { name: 'Chủ hộ cũ trên Giấy ĐKHKD khớp người ủy quyền trong văn bản ủy quyền HGĐ', left: 'giay_hkd.hoTenChuHo', right: 'van_ban_uy_quyen_hgd.tenNguoiUyQuyen', matchType: 'normalized', severityIfMismatch: 'HIGH', skipIfMissing: 'van_ban_uy_quyen_hgd',
        legalBasis: { article: 'Điều 85 NĐ 168/2025/NĐ-CP', note: 'Chủ hộ hiện tại trên Giấy chứng nhận ĐKHKD phải là người ký ủy quyền thì việc thay đổi mới hợp lệ.' } },

      // Cross-check tên hộ kinh doanh
      { name: 'Tên hộ kinh doanh trên văn bản ủy quyền khớp Giấy chứng nhận ĐKHKD', left: 'van_ban_uy_quyen_hgd.tenHoKinhDoanh', right: 'giay_hkd.tenHoKinhDoanh', matchType: 'normalized', severityIfMismatch: 'MEDIUM', skipIfMissing: 'van_ban_uy_quyen_hgd',
        legalBasis: { article: 'Điều 85 NĐ 168/2025/NĐ-CP', note: 'Tên hộ kinh doanh phải đồng nhất giữa văn bản ủy quyền và giấy chứng nhận để xác định đúng hộ kinh doanh cần thay đổi.' } },

      // Cross-check văn bản ủy quyền thủ tục (nếu có)
      { name: 'Người ủy quyền nộp thủ tục khớp chủ hộ mới trên CCCD', left: 'van_ban_uy_quyen_thu_tuc.tenNguoiUyQuyen', right: 'cccd_nguoi_yeu_cau.hoTen', matchType: 'normalized', severityIfMismatch: 'LOW', skipIfMissing: 'van_ban_uy_quyen_thu_tuc',
        legalBasis: { article: 'Điều 93 khoản 1 NĐ 168/2025/NĐ-CP', note: 'Khi nhờ người khác nộp hồ sơ thay, người ủy quyền phải đúng là chủ hộ mới đứng tên trên CCCD.' } },
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
      { ...verifiedIdentity, label: 'Người yêu cầu (eKYC — tái sử dụng từ tài khoản)', roleInProcedure: 'Định danh bên nhận chuyển nhượng — đã xác thực eKYC khi lập tài khoản, không cần upload lại' },
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
      { id: 'thuaDat.nguonGoc', label: 'Nguồn gốc sử dụng đất', required: true, sourceMap: ['hop_dong_chuyen_nhuong.nguonGocSuDung'], defaultValue: 'Nhận chuyển nhượng quyền sử dụng đất' },
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
      { name: 'Bên nhận chuyển nhượng trên CCCD khớp với hợp đồng', left: 'cccd_nguoi_yeu_cau.hoTen', right: 'hop_dong_chuyen_nhuong.benNhanChuyenNhuong', matchType: 'normalized', severityIfMismatch: 'HIGH', skipIfMissing: 'hop_dong_chuyen_nhuong',
        legalBasis: { article: 'Điều 188 khoản 1 Luật Đất đai 2024', note: 'Người nhận chuyển nhượng đứng tên trên CCCD phải trùng bên nhận trong hợp đồng để xác định đúng chủ thể giao dịch.' } },
      { name: 'Bên chuyển nhượng trên sổ đỏ khớp với hợp đồng', left: 'so_do_ben_chuyen_nhuong.tenChuSoHuu', right: 'hop_dong_chuyen_nhuong.benChuyenNhuong', matchType: 'normalized', severityIfMismatch: 'HIGH', skipIfMissing: 'hop_dong_chuyen_nhuong',
        legalBasis: { article: 'Điều 188 khoản 1 điểm a Luật Đất đai 2024', note: 'Người chuyển nhượng phải là chủ sở hữu ghi trên sổ đỏ thì mới có quyền chuyển nhượng.' } },
      // 'semantic': địa chỉ hay khác cách ghi ("123 Lê Lợi, P.1, Q.1" vs "Số 123 đường Lê Lợi, Phường 1, Quận 1")
      // mà fuzzy ký tự bắt sai. Pass 1 chuẩn hóa; không khớp → AI (ai-svc) phán "cùng thửa đất hay không".
      { name: 'Địa chỉ thửa đất trên sổ đỏ khớp với hợp đồng', left: 'so_do_ben_chuyen_nhuong.diaChiNha', right: 'hop_dong_chuyen_nhuong.diaChiThuaDat', matchType: 'semantic', severityIfMismatch: 'MEDIUM', skipIfMissing: 'hop_dong_chuyen_nhuong',
        legalBasis: { article: 'Điều 188 Luật Đất đai 2024', note: 'Thửa đất trong hợp đồng phải đúng là thửa đất ghi trên sổ đỏ để bảo đảm chuyển nhượng đúng đối tượng.' } },
      { name: 'Diện tích trên sổ đỏ khớp với hợp đồng', left: 'so_do_ben_chuyen_nhuong.dienTich', right: 'hop_dong_chuyen_nhuong.dienTich', matchType: 'normalized', severityIfMismatch: 'MEDIUM', skipIfMissing: 'hop_dong_chuyen_nhuong',
        legalBasis: { article: 'Điều 188 Luật Đất đai 2024', note: 'Diện tích chuyển nhượng phải khớp với diện tích ghi trên sổ đỏ để tránh sai lệch về đối tượng giao dịch.' } },
    ],
    scoringRules,
    priorityConfig,
    isActive: true,
  },
];
