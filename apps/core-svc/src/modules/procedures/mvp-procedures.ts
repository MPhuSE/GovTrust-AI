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
];

// 2 domain có OCR VNPT thật: HỘ TỊCH (giấy khai sinh) + HỘ KINH DOANH (giấy ĐKHKD).
// Không dùng loại giấy chỉ có mock (Sổ đỏ, Giấy chứng sinh) — đã loại khỏi hệ thống.
export const MVP_PROCEDURES: ProcedureSeed[] = [
  // ————————————————————————— HỘ TỊCH —————————————————————————
  {
    code: 'CAP_BAN_SAO_TRICH_LUC_KHAI_SINH',
    name: 'Cấp bản sao trích lục khai sinh',
    category: 'HỘ TỊCH',
    description: 'Đọc thông tin trên Giấy khai sinh cũ và tự điền yêu cầu cấp bản sao.',
    department: 'Cơ quan quản lý Cơ sở dữ liệu hộ tịch',
    outputTemplate: {
      key: 'HT_TRICH_LUC_KHAI_SINH',
      displayName: 'Tờ khai cấp bản sao trích lục hộ tịch',
      originalFile: 'template/mau-to-khai-cap-ban-sao-trich-luc-ho-tich.doc',
      version: 'MVP-2026', outputFormats: ['docx', 'pdf'],
    },
    checklist: [
      verifiedIdentity,
      {
        id: 'giay_khai_sinh', documentTypeCode: 'GIAY_KHAI_SINH',
        label: 'Giấy khai sinh đã cấp', roleInProcedure: 'Bản gốc hoặc bản chụp để lấy thông tin đăng ký',
        inputMode: 'UPLOAD', isRequired: true, quantity: 1, points: 60,
      },
    ],
    formFields: [
      { id: 'coQuanTiepNhan', label: 'Cơ quan cấp bản sao trích lục', required: true, sourceMap: [], defaultValue: 'Cơ quan quản lý Cơ sở dữ liệu hộ tịch' },
      ...identityFields,
      { id: 'nguoiYeuCau.quanHe', label: 'Quan hệ với người được cấp bản sao', required: true, sourceMap: [] },
      { id: 'hoTich.hoTen', label: 'Họ tên người được khai sinh', required: true, sourceMap: ['giay_khai_sinh.hoTenCon'] },
      { id: 'hoTich.ngaySinh', label: 'Ngày sinh', required: true, sourceMap: ['giay_khai_sinh.ngaySinhCon'] },
      { id: 'hoTich.gioiTinh', label: 'Giới tính', required: false, sourceMap: ['giay_khai_sinh.gioiTinhCon'] },
      { id: 'hoTich.noiDangKy', label: 'Cơ quan đã đăng ký khai sinh', required: true, sourceMap: ['giay_khai_sinh.noiDangKy'] },
      { id: 'hoTich.ngayDangKy', label: 'Ngày đăng ký', required: false, sourceMap: ['giay_khai_sinh.ngayDangKy'] },
      { id: 'hoTich.so', label: 'Số đăng ký', required: false, sourceMap: ['giay_khai_sinh.soGiayTo'] },
      { id: 'yeuCau.soLuong', label: 'Số lượng bản sao', required: true, sourceMap: [] },
    ],
    crossCheckRules: [], scoringRules, priorityConfig, isActive: true,
  },
  {
    code: 'DK_LAI_KHAI_SINH',
    name: 'Đăng ký lại khai sinh',
    category: 'HỘ TỊCH',
    description: 'Đọc bản sao Giấy khai sinh cũ (nếu còn) và tự điền Tờ khai đăng ký lại khai sinh.',
    department: 'Ủy ban nhân dân cấp xã',
    outputTemplate: {
      key: 'HT_DK_LAI_KHAI_SINH',
      displayName: 'Tờ khai đăng ký lại khai sinh',
      originalFile: 'template/1._To_khai_dang_ky_khai_sinh_1605163058.doc',
      version: 'MVP-2026', outputFormats: ['docx', 'pdf'],
    },
    checklist: [
      verifiedIdentity,
      {
        id: 'giay_khai_sinh', documentTypeCode: 'GIAY_KHAI_SINH',
        label: 'Bản sao Giấy khai sinh cũ', roleInProcedure: 'Giấy tờ chứng minh nội dung khai sinh đã đăng ký trước đây',
        inputMode: 'UPLOAD', isRequired: false, conditionalOn: 'còn giữ bản sao giấy khai sinh cũ', quantity: 1, points: 40,
      },
    ],
    formFields: [
      { id: 'coQuanTiepNhan', label: 'Cơ quan đăng ký lại khai sinh', required: true, sourceMap: [], defaultValue: 'Ủy ban nhân dân cấp xã' },
      ...identityFields,
      { id: 'nguoiYeuCau.quanHe', label: 'Quan hệ với người được khai sinh', required: true, sourceMap: [] },
      { id: 'hoTich.hoTen', label: 'Họ tên người được khai sinh', required: true, sourceMap: ['giay_khai_sinh.hoTenCon'] },
      { id: 'hoTich.ngaySinh', label: 'Ngày sinh', required: true, sourceMap: ['giay_khai_sinh.ngaySinhCon'] },
      { id: 'hoTich.gioiTinh', label: 'Giới tính', required: false, sourceMap: ['giay_khai_sinh.gioiTinhCon'] },
      { id: 'hoTich.noiDangKyCu', label: 'Nơi đã đăng ký khai sinh trước đây', required: true, sourceMap: ['giay_khai_sinh.noiDangKy'] },
      { id: 'me.hoTen', label: 'Họ tên mẹ', required: true, sourceMap: ['giay_khai_sinh.hoTenMe'] },
      { id: 'cha.hoTen', label: 'Họ tên cha', required: false, sourceMap: ['giay_khai_sinh.hoTenCha'] },
      { id: 'lyDo.dangKyLai', label: 'Lý do đăng ký lại', required: true, sourceMap: [] },
    ],
    crossCheckRules: [
      { name: 'Tên người yêu cầu khớp thông tin trên giấy khai sinh cũ', left: 'cccd_nguoi_yeu_cau.hoTen', right: 'giay_khai_sinh.hoTenCon', matchType: 'normalized', severityIfMismatch: 'MEDIUM', skipIfMissing: 'giay_khai_sinh' },
    ],
    scoringRules, priorityConfig, isActive: true,
  },
  {
    code: 'XAC_NHAN_TINH_TRANG_HON_NHAN',
    name: 'Cấp Giấy xác nhận tình trạng hôn nhân',
    category: 'HỘ TỊCH',
    description: 'Tái sử dụng CCCD eKYC và tự điền tờ khai xác nhận tình trạng hôn nhân.',
    department: 'Ủy ban nhân dân cấp xã',
    outputTemplate: {
      key: 'HT_XNTTHN', displayName: 'Tờ khai cấp Giấy xác nhận tình trạng hôn nhân',
      originalFile: 'template/mau-to-khai-cap-giay-xac-nhan-tinh-trang-hon-nhan.docx',
      version: 'MVP-2026', outputFormats: ['docx', 'pdf'],
    },
    checklist: [
      verifiedIdentity,
    ],
    formFields: [
      { id: 'coQuanTiepNhan', label: 'Cơ quan cấp giấy xác nhận', required: true, sourceMap: [], defaultValue: 'Ủy ban nhân dân cấp xã' },
      ...identityFields,
      { id: 'nguoiYeuCau.quanHe', label: 'Quan hệ với người được xác nhận', required: true, sourceMap: [], defaultValue: 'Bản thân' },
      { id: 'nguoiDuocXacNhan.hoTen', label: 'Họ tên người được xác nhận', required: true, sourceMap: ['cccd_nguoi_yeu_cau.hoTen'] },
      { id: 'nguoiDuocXacNhan.ngaySinh', label: 'Ngày sinh', required: true, sourceMap: ['cccd_nguoi_yeu_cau.ngaySinh'] },
      { id: 'nguoiDuocXacNhan.gioiTinh', label: 'Giới tính', required: false, sourceMap: ['cccd_nguoi_yeu_cau.gioiTinh'] },
      { id: 'nguoiDuocXacNhan.noiCuTru', label: 'Nơi cư trú', required: true, sourceMap: ['cccd_nguoi_yeu_cau.noiThuongTru'] },
      { id: 'honNhan.tinhTrang', label: 'Tình trạng hôn nhân', required: true, sourceMap: [] },
      { id: 'honNhan.mucDich', label: 'Mục đích sử dụng giấy xác nhận', required: true, sourceMap: [] },
    ],
    crossCheckRules: [], scoringRules, priorityConfig, isActive: true,
  },

  // ————————————————————————— HỘ KINH DOANH —————————————————————————
  // OCR thật: doc type HO_KINH_DOANH (endpoint /rpa-service/aidigdoc/v1/ocr/dang-ky-ho-kinh-doanh).
  // Cross-check mạnh nhất: cccd_nguoi_yeu_cau.hoTen ↔ giay_hkd.hoTenChuHo (cả 2 vế OCR thật).
  {
    code: 'HKD_THANH_LAP',
    name: 'Đăng ký thành lập hộ kinh doanh',
    category: 'HỘ KINH DOANH',
    description: 'Tái sử dụng CCCD eKYC của chủ hộ và tự điền Giấy đề nghị đăng ký hộ kinh doanh.',
    department: 'Cơ quan đăng ký kinh doanh cấp xã',
    outputTemplate: {
      key: 'HKD_THANH_LAP', displayName: 'Giấy đề nghị đăng ký hộ kinh doanh',
      originalFile: 'template/hkd-01-giay-de-nghi-dang-ky-ho-kinh-doanh.docx',
      version: '68/2025/TT-BTC', outputFormats: ['docx', 'pdf'],
    },
    checklist: [
      { ...verifiedIdentity, label: 'CCCD của chủ hộ kinh doanh', roleInProcedure: 'Định danh chủ hộ kinh doanh' },
    ],
    formFields: [
      { id: 'coQuanTiepNhan', label: 'Cơ quan đăng ký kinh doanh', required: true, sourceMap: [], defaultValue: 'Cơ quan đăng ký kinh doanh cấp xã' },
      { id: 'hoKinhDoanh.tenHoKinhDoanh', label: 'Tên hộ kinh doanh', required: true, sourceMap: [] },
      { id: 'hoKinhDoanh.diaChiKinhDoanh', label: 'Địa chỉ trụ sở kinh doanh', required: true, sourceMap: [] },
      { id: 'hoKinhDoanh.nganhNghe', label: 'Ngành, nghề kinh doanh', required: true, sourceMap: [] },
      { id: 'hoKinhDoanh.vonKinhDoanh', label: 'Vốn kinh doanh', required: true, sourceMap: [] },
      { id: 'chuHo.hoTen', label: 'Họ tên chủ hộ kinh doanh', required: true, sourceMap: ['cccd_nguoi_yeu_cau.hoTen'] },
      { id: 'chuHo.soCCCD', label: 'Số CCCD chủ hộ', required: true, sourceMap: ['cccd_nguoi_yeu_cau.soCCCD'] },
      { id: 'chuHo.ngaySinh', label: 'Ngày sinh chủ hộ', required: false, sourceMap: ['cccd_nguoi_yeu_cau.ngaySinh'] },
      { id: 'chuHo.diaChiThuongTru', label: 'Nơi thường trú chủ hộ', required: false, sourceMap: ['cccd_nguoi_yeu_cau.noiThuongTru'] },
    ],
    crossCheckRules: [], scoringRules, priorityConfig, isActive: true,
  },
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
    scoringRules, priorityConfig, isActive: true,
  },
  {
    code: 'HKD_CAP_LAI',
    name: 'Cấp lại Giấy chứng nhận đăng ký hộ kinh doanh',
    category: 'HỘ KINH DOANH',
    description: 'Cấp lại khi Giấy chứng nhận ĐKHKD bị mất, hư hỏng; đọc bản chụp cũ nếu còn.',
    department: 'Cơ quan đăng ký kinh doanh cấp xã',
    outputTemplate: {
      key: 'HKD_CAP_LAI', displayName: 'Giấy đề nghị cấp lại Giấy chứng nhận đăng ký hộ kinh doanh',
      originalFile: 'template/hkd-03-de-nghi-cap-lai-ho-kinh-doanh.docx',
      version: '68/2025/TT-BTC', outputFormats: ['docx', 'pdf'],
    },
    checklist: [
      { ...verifiedIdentity, label: 'CCCD của chủ hộ kinh doanh', roleInProcedure: 'Định danh chủ hộ kinh doanh' },
      {
        id: 'giay_hkd', documentTypeCode: 'HO_KINH_DOANH',
        label: 'Bản chụp Giấy chứng nhận ĐKHKD cũ', roleInProcedure: 'Bản chụp còn giữ để lấy thông tin đăng ký',
        inputMode: 'UPLOAD', isRequired: false, conditionalOn: 'còn giữ bản chụp giấy chứng nhận cũ', quantity: 1, points: 40,
      },
    ],
    formFields: [
      { id: 'coQuanTiepNhan', label: 'Cơ quan đăng ký kinh doanh', required: true, sourceMap: [], defaultValue: 'Cơ quan đăng ký kinh doanh cấp xã' },
      { id: 'hoKinhDoanh.tenHoKinhDoanh', label: 'Tên hộ kinh doanh', required: true, sourceMap: ['giay_hkd.tenHoKinhDoanh'] },
      { id: 'hoKinhDoanh.maSo', label: 'Mã số/Số ĐKHKD', required: false, sourceMap: ['giay_hkd.maSoHoKinhDoanh'] },
      { id: 'hoKinhDoanh.diaChiKinhDoanh', label: 'Địa chỉ kinh doanh', required: false, sourceMap: ['giay_hkd.diaChiKinhDoanh'] },
      { id: 'chuHo.hoTen', label: 'Họ tên chủ hộ kinh doanh', required: true, sourceMap: ['cccd_nguoi_yeu_cau.hoTen'] },
      { id: 'chuHo.soCCCD', label: 'Số CCCD chủ hộ', required: true, sourceMap: ['cccd_nguoi_yeu_cau.soCCCD'] },
      { id: 'capLai.lyDo', label: 'Lý do cấp lại (mất/hư hỏng)', required: true, sourceMap: [] },
    ],
    crossCheckRules: [
      { name: 'Chủ hộ trên CCCD khớp chủ hộ trên Giấy chứng nhận ĐKHKD', left: 'cccd_nguoi_yeu_cau.hoTen', right: 'giay_hkd.hoTenChuHo', matchType: 'normalized', severityIfMismatch: 'MEDIUM', skipIfMissing: 'giay_hkd' },
    ],
    scoringRules, priorityConfig, isActive: true,
  },
  {
    code: 'HKD_CHAM_DUT',
    name: 'Chấm dứt hoạt động hộ kinh doanh',
    category: 'HỘ KINH DOANH',
    description: 'Đọc Giấy chứng nhận ĐKHKD, đối chiếu chủ hộ với CCCD và tự điền thông báo chấm dứt.',
    department: 'Cơ quan đăng ký kinh doanh cấp xã',
    outputTemplate: {
      key: 'HKD_CHAM_DUT', displayName: 'Thông báo về việc chấm dứt hoạt động hộ kinh doanh',
      originalFile: 'template/hkd-04-thong-bao-cham-dut-ho-kinh-doanh.docx',
      version: '68/2025/TT-BTC', outputFormats: ['docx', 'pdf'],
    },
    checklist: [
      { ...verifiedIdentity, label: 'CCCD của chủ hộ kinh doanh', roleInProcedure: 'Định danh chủ hộ kinh doanh' },
      {
        id: 'giay_hkd', documentTypeCode: 'HO_KINH_DOANH',
        label: 'Giấy chứng nhận đăng ký hộ kinh doanh đã cấp', roleInProcedure: 'Bản gốc để xác định hộ kinh doanh chấm dứt',
        inputMode: 'UPLOAD', isRequired: true, quantity: 1, points: 50,
      },
    ],
    formFields: [
      { id: 'coQuanTiepNhan', label: 'Cơ quan đăng ký kinh doanh', required: true, sourceMap: [], defaultValue: 'Cơ quan đăng ký kinh doanh cấp xã' },
      { id: 'hoKinhDoanh.tenHoKinhDoanh', label: 'Tên hộ kinh doanh', required: true, sourceMap: ['giay_hkd.tenHoKinhDoanh'] },
      { id: 'hoKinhDoanh.maSo', label: 'Mã số/Số ĐKHKD', required: true, sourceMap: ['giay_hkd.maSoHoKinhDoanh'] },
      { id: 'hoKinhDoanh.diaChiKinhDoanh', label: 'Địa chỉ kinh doanh', required: false, sourceMap: ['giay_hkd.diaChiKinhDoanh'] },
      { id: 'chuHo.hoTen', label: 'Họ tên chủ hộ kinh doanh', required: true, sourceMap: ['cccd_nguoi_yeu_cau.hoTen'] },
      { id: 'chuHo.soCCCD', label: 'Số CCCD chủ hộ', required: true, sourceMap: ['cccd_nguoi_yeu_cau.soCCCD'] },
      { id: 'chamDut.lyDo', label: 'Lý do chấm dứt hoạt động', required: true, sourceMap: [] },
      { id: 'chamDut.thoiDiem', label: 'Thời điểm chấm dứt', required: true, sourceMap: [] },
    ],
    crossCheckRules: [
      { name: 'Chủ hộ trên CCCD khớp chủ hộ trên Giấy chứng nhận ĐKHKD', left: 'cccd_nguoi_yeu_cau.hoTen', right: 'giay_hkd.hoTenChuHo', matchType: 'normalized', severityIfMismatch: 'HIGH', skipIfMissing: 'giay_hkd' },
    ],
    scoringRules, priorityConfig, isActive: true,
  },
];
