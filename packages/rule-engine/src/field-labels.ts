/**
 * Nhãn tiếng Việt cho các field OCR — dùng khi hiển thị cho người dân
 * (vd trong breakdown "Thông tin không khớp — <nhãn>: ...").
 * Key là leaf key của field (phần sau dấu chấm trong "slot.fieldKey").
 *
 * LƯU Ý PII: lớp mask (apps/core-svc pii-mask.util) suy ra kiểu mask (tên/địa chỉ/
 * số định danh) từ chính nhãn này — nên nhãn PHẢI chứa từ khóa nhận diện được
 * (tên/họ, địa chỉ, số...). Thêm field mới thì thêm nhãn tương ứng ở đây.
 */
export const FIELD_LABELS: Record<string, string> = {
  // Họ tên người
  hoTen: 'Họ tên',
  hoTenCha: 'Họ tên cha',
  hoTenMe: 'Họ tên mẹ',
  hoTenVo: 'Họ tên vợ',
  hoTenChong: 'Họ tên chồng',
  hoTenChuHo: 'Họ tên chủ hộ',
  hoTenCon: 'Họ tên con',
  tenChuSoHuu: 'Tên chủ sở hữu',
  tenNguoiUyQuyen: 'Tên người ủy quyền',
  tenNguoiDuocUyQuyen: 'Tên người được ủy quyền',
  benChuyenNhuong: 'Tên bên chuyển nhượng',
  benNhanChuyenNhuong: 'Tên bên nhận chuyển nhượng',

  // Tổ chức / hộ kinh doanh
  tenHoKinhDoanh: 'Tên hộ kinh doanh',

  // Địa chỉ
  diaChiNha: 'Địa chỉ nhà',
  diaChiThuaDat: 'Địa chỉ thửa đất',

  // Khác
  dienTich: 'Diện tích',
  ngaySinh: 'Ngày sinh',
  soCCCD: 'Số CCCD',
  soCMND: 'Số CMND',
};

/**
 * Trả nhãn tiếng Việt cho 1 field key. Nếu chưa có trong map, tách camelCase
 * thành cụm từ có khoảng trắng (fallback đọc được thay vì key thô).
 * "tenNguoiDuocUyQuyen" → "ten Nguoi Duoc Uy Quyen" (chấp nhận được khi thiếu map).
 */
export function labelForField(fieldKey: string): string {
  if (!fieldKey) return fieldKey;
  // Field có thể ở dạng "slot.fieldKey" — chỉ lấy phần leaf.
  const leaf = fieldKey.includes('.') ? fieldKey.split('.').pop()! : fieldKey;
  if (FIELD_LABELS[leaf]) return FIELD_LABELS[leaf];
  // Fallback: chèn khoảng trắng trước mỗi chữ hoa.
  return leaf.replace(/([A-Z])/g, ' $1').replace(/\s+/g, ' ').trim();
}

/**
 * Nhãn tiếng Việt cho các slot giấy tờ (checklistId) — dùng khi báo người dùng
 * "chưa đọc được dữ liệu từ giấy tờ nào" để họ biết tải lại đúng ảnh.
 * Key là checklistId trong 3 thủ tục MVP.
 */
export const DOC_LABELS: Record<string, string> = {
  cccd_nguoi_yeu_cau: 'CCCD người yêu cầu',
  cccd_phu_huynh_con_lai: 'CCCD phụ huynh còn lại',
  giay_chung_sinh: 'Giấy chứng sinh',
  giay_chung_nhan_ket_hon: 'Giấy chứng nhận kết hôn',
  giay_hkd: 'Giấy chứng nhận ĐKHKD',
  van_ban_uy_quyen_hgd: 'Văn bản ủy quyền hộ gia đình',
  van_ban_uy_quyen_thu_tuc: 'Văn bản ủy quyền thủ tục',
  so_do_ben_chuyen_nhuong: 'Sổ đỏ (GCN QSDĐ)',
  hop_dong_chuyen_nhuong: 'Hợp đồng chuyển nhượng',
  van_ban_uy_quyen_ben_chuyen_nhuong: 'Văn bản ủy quyền bên chuyển nhượng',
  van_ban_uy_quyen_ben_nhan: 'Văn bản ủy quyền bên nhận',
};

/**
 * Trả tên giấy tờ đọc được từ 1 ref "checklistId.fieldKey" (hoặc chỉ checklistId).
 * Fallback: thay '_' bằng khoảng trắng để không lòi id thô cho người dân.
 */
export function labelForDocument(ref: string): string {
  if (!ref) return 'giấy tờ';
  const slot = ref.includes('.') ? ref.split('.')[0] : ref;
  return DOC_LABELS[slot] ?? slot.replace(/_/g, ' ');
}
