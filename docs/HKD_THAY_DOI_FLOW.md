# Flow Thay Đổi Chủ Hộ Kinh Doanh (HKD_THAY_DOI)

## Tổng quan

Thủ tục **Thay đổi chủ hộ kinh doanh do ủy quyền** (Điều 100 khoản 3 NĐ 168/2025) cho phép các thành viên hộ gia đình ủy quyền cho một thành viên khác làm chủ hộ.

## Tờ khai yêu cầu

Theo **PHỤ LỤC III-3** (Thông tư 02/2023/TT-BKHĐT), tờ khai "Thông báo thay đổi chủ hộ kinh doanh" cần thông tin **2 CCCD**:

### 1. Chủ hộ TRƯỚC khi thay đổi (Người tặng/bán/ủy quyền)
- Họ tên
- Số CCCD/CMND
- Ngày sinh, giới tính, dân tộc, quốc tịch
- Ngày cấp, nơi cấp CCCD
- Địa chỉ thường trú
- Điện thoại, email

### 2. Chủ hộ SAU khi thay đổi (Người được tặng/mua/thừa kế)
- Họ tên
- Số CCCD/CMND
- Ngày sinh, giới tính, dân tộc, quốc tịch
- Ngày cấp, nơi cấp CCCD
- Địa chỉ thường trú
- Điện thoại, email

## Giải pháp: Option C

**Lấy thông tin chủ hộ cũ từ Giấy ĐKHKD** thay vì yêu cầu eKYC riêng.

### Lý do chọn Option C:
✅ **Giấy ĐKHKD đã có đầy đủ thông tin chủ hộ cũ** (họ tên, CCCD, địa chỉ, v.v.)  
✅ **Không cần chủ hộ cũ eKYC riêng** — giảm phức tạp cho người dân  
✅ **Giấy ủy quyền công chứng đã xác thực danh tính** — hợp pháp và đáng tin cậy  
✅ **Cross-check tự động** — đảm bảo tính nhất quán giữa ĐKHKD và giấy ủy quyền

## Flow xử lý

```
┌─────────────────────────────────────────────────────────────┐
│ 1. Người dân chọn thủ tục "Thay đổi chủ hộ kinh doanh"      │
└─────────────────────────────────────────────────────────────┘
                             ↓
┌─────────────────────────────────────────────────────────────┐
│ 2. eKYC cho CHỦ HỘ MỚI (người được ủy quyền)               │
│    - Upload CCCD trước + sau                                 │
│    - Chụp selfie                                             │
│    - AI verify: OCR + face matching + liveness              │
│    → Lưu vào User profile                                   │
└─────────────────────────────────────────────────────────────┘
                             ↓
┌─────────────────────────────────────────────────────────────┐
│ 3. Upload giấy tờ                                            │
│    a) Giấy ĐKHKD hiện tại                                   │
│       → OCR trích xuất:                                      │
│         • Tên hộ kinh doanh, mã số                          │
│         • Họ tên CHỦ HỘ CŨ                                 │
│         • Số CCCD CHỦ HỘ CŨ ⭐                              │
│         • Ngày sinh, giới tính, dân tộc, quốc tịch         │
│         • Ngày cấp, nơi cấp CCCD                            │
│         • Địa chỉ thường trú, điện thoại, email            │
│                                                              │
│    b) Văn bản ủy quyền HGĐ (công chứng)                    │
│       → OCR trích xuất:                                      │
│         • Tên người được ủy quyền làm chủ hộ mới           │
│         • Tên người ủy quyền (chủ hộ cũ)                   │
│         • Tên hộ kinh doanh                                 │
│         • Ngày ủy quyền, nơi công chứng                    │
│                                                              │
│    c) Văn bản ủy quyền thủ tục (nếu nhờ người khác nộp)   │
└─────────────────────────────────────────────────────────────┘
                             ↓
┌─────────────────────────────────────────────────────────────┐
│ 4. Cross-check tự động (4 rules)                            │
│    ✓ Chủ hộ mới trên CCCD = người được ủy quyền (HGĐ)     │
│    ✓ Chủ hộ cũ trên ĐKHKD = người ủy quyền (HGĐ) ⭐       │
│    ✓ Tên hộ KD trên ủy quyền = tên trên ĐKHKD             │
│    ✓ Người ủy quyền nộp thủ tục = chủ hộ mới               │
└─────────────────────────────────────────────────────────────┘
                             ↓
┌─────────────────────────────────────────────────────────────┐
│ 5. Auto-fill tờ khai                                         │
│    Phần 1: Thông tin hộ kinh doanh                         │
│      → giay_hkd.tenHoKinhDoanh, maSoHoKinhDoanh            │
│                                                              │
│    Phần 2: Chủ hộ TRƯỚC khi thay đổi (chủ hộ cũ)          │
│      → giay_hkd.hoTenChuHo ⭐                               │
│      → giay_hkd.soCCCDChuHo ⭐                              │
│      → giay_hkd.ngaySinhChuHo, gioiTinhChuHo, ...          │
│                                                              │
│    Phần 3: Chủ hộ SAU khi thay đổi (chủ hộ mới)           │
│      → cccd_nguoi_yeu_cau.hoTen (từ eKYC)                  │
│      → cccd_nguoi_yeu_cau.soCCCD                            │
│      → cccd_nguoi_yeu_cau.ngaySinh, gioiTinh, ...          │
└─────────────────────────────────────────────────────────────┘
                             ↓
┌─────────────────────────────────────────────────────────────┐
│ 6. Người dân xem trước & ký điện tử                         │
│    - Xem tờ khai đã auto-fill                               │
│    - Ký chữ ký tay (tablet/giấy)                            │
│    - Audit trail: IP, device, timestamp, geolocation       │
└─────────────────────────────────────────────────────────────┘
                             ↓
┌─────────────────────────────────────────────────────────────┐
│ 7. Nộp hồ sơ cho cán bộ                                    │
│    Cán bộ xem:                                              │
│    - Tờ khai đã điền + chữ ký                              │
│    - Kết quả eKYC chủ hộ mới (96% khớp khuôn mặt)          │
│    - Kết quả cross-check (4/4 passed)                      │
│    - Audit trail (ai ký, lúc nào, ở đâu)                   │
│    - Các giấy tờ đính kèm (ĐKHKD, ủy quyền)                │
└─────────────────────────────────────────────────────────────┘
```

## Giấy tờ cần thiết

### Bắt buộc (3):
1. **CCCD của chủ hộ mới** — eKYC (xác thực người thật)
2. **Giấy ĐKHKD đã cấp** — OCR lấy thông tin chủ hộ cũ ⭐
3. **Văn bản ủy quyền HGĐ** — công chứng/chứng thực

### Điều kiện (1):
4. **Văn bản ủy quyền thủ tục** — nếu nhờ người khác nộp hồ sơ

## Cấu trúc dữ liệu

### Document Type: `HO_KINH_DOANH`

Đã cập nhật thêm **17 trường** để lưu đầy đủ thông tin chủ hộ:

```javascript
{
  code: 'HO_KINH_DOANH',
  fields: [
    // Thông tin hộ kinh doanh
    { key: 'tenHoKinhDoanh', label: 'Tên hộ kinh doanh', ... },
    { key: 'maSoHoKinhDoanh', label: 'Mã số hộ kinh doanh', ... },
    { key: 'diaChiKinhDoanh', label: 'Địa chỉ kinh doanh', ... },
    { key: 'nganhNghe', label: 'Ngành nghề kinh doanh', ... },
    { key: 'dienThoai', label: 'Điện thoại', ... },
    { key: 'email', label: 'Email', ... },

    // Thông tin chủ hộ (CHỦ HỘ CŨ) ⭐
    { key: 'hoTenChuHo', label: 'Họ tên chủ hộ', required: true, isIdentity: true },
    { key: 'soCCCDChuHo', label: 'Số CCCD/CMND chủ hộ', isIdentity: true },
    { key: 'ngaySinhChuHo', label: 'Ngày sinh chủ hộ', dataType: 'date' },
    { key: 'gioiTinhChuHo', label: 'Giới tính chủ hộ' },
    { key: 'danTocChuHo', label: 'Dân tộc chủ hộ' },
    { key: 'quocTichChuHo', label: 'Quốc tịch chủ hộ' },
    { key: 'ngayCapCCCDChuHo', label: 'Ngày cấp CCCD chủ hộ', dataType: 'date' },
    { key: 'noiCapCCCDChuHo', label: 'Nơi cấp CCCD chủ hộ' },
    { key: 'diaChiThuongTruChuHo', label: 'Địa chỉ thường trú chủ hộ' },
    { key: 'dienThoaiChuHo', label: 'Điện thoại chủ hộ' },
    { key: 'emailChuHo', label: 'Email chủ hộ' },
  ]
}
```

### Form Fields (mvp-procedures.ts)

**34 trường** để điền đầy đủ tờ khai:

```typescript
formFields: [
  // Cơ quan tiếp nhận
  { id: 'coQuanTiepNhan', ... },

  // Thông tin hộ kinh doanh
  { id: 'hoKinhDoanh.tenHoKinhDoanh', sourceMap: ['giay_hkd.tenHoKinhDoanh'] },
  { id: 'hoKinhDoanh.maSo', sourceMap: ['giay_hkd.maSoHoKinhDoanh'] },
  { id: 'hoKinhDoanh.dienThoai', sourceMap: ['giay_hkd.dienThoai'] },
  { id: 'hoKinhDoanh.email', sourceMap: ['giay_hkd.email'] },

  // Chủ hộ CŨ (từ Giấy ĐKHKD) ⭐
  { id: 'chuHoCu.hoTen', sourceMap: ['giay_hkd.hoTenChuHo'] },
  { id: 'chuHoCu.soCCCD', sourceMap: ['giay_hkd.soCCCDChuHo'] },
  { id: 'chuHoCu.ngaySinh', sourceMap: ['giay_hkd.ngaySinhChuHo'] },
  { id: 'chuHoCu.gioiTinh', sourceMap: ['giay_hkd.gioiTinhChuHo'] },
  { id: 'chuHoCu.diaChiThuongTru', sourceMap: ['giay_hkd.diaChiThuongTruChuHo'] },
  // ... 8 trường khác

  // Chủ hộ MỚI (từ eKYC) ⭐
  { id: 'chuHoMoi.hoTen', sourceMap: ['cccd_nguoi_yeu_cau.hoTen'] },
  { id: 'chuHoMoi.soCCCD', sourceMap: ['cccd_nguoi_yeu_cau.soCCCD'] },
  { id: 'chuHoMoi.ngaySinh', sourceMap: ['cccd_nguoi_yeu_cau.ngaySinh'] },
  { id: 'chuHoMoi.diaChiThuongTru', sourceMap: ['cccd_nguoi_yeu_cau.noiThuongTru'] },
  // ... 8 trường khác
]
```

## Cross-check Rules

**4 rules** để đảm bảo tính nhất quán:

1. **HIGH severity**: Chủ hộ mới trên CCCD = người được ủy quyền (văn bản HGĐ)
2. **HIGH severity**: Chủ hộ cũ trên ĐKHKD = người ủy quyền (văn bản HGĐ) ⭐
3. **MEDIUM severity**: Tên hộ KD trên văn bản ủy quyền = tên trên ĐKHKD
4. **LOW severity**: Người ủy quyền nộp thủ tục = chủ hộ mới trên CCCD

## Test Documents

Thư mục: `/data/test-documents/HKD_THAY_DOI/`

### Hiện có:
- ✅ `giay-dang-ky-ho-kinh-doanh_sample.jpg` — Giấy ĐKHKD ⭐
- ✅ `giay-uy-quyen-lam-chu-ho-kinh-doanh (1).pdf` — Văn bản ủy quyền HGĐ
- ✅ `giay-uy-quyen-lam-chu-ho-kinh-doanh (1)-1.jpg` — Trang 1
- ✅ `giay-uy-quyen-lam-chu-ho-kinh-doanh (1)-2.jpg` — Trang 2

### Không cần thêm:
- ❌ CCCD chủ hộ cũ — lấy từ Giấy ĐKHKD ⭐
- ⚠️ CCCD chủ hộ mới — xử lý qua eKYC (3 ảnh: trước, sau, selfie)

## Files đã cập nhật

```
✅ apps/core-svc/src/modules/procedures/mvp-procedures.ts
   - Thêm 22 formFields mới cho chủ hộ cũ/mới
   - Cập nhật crossCheckRules (4 rules)

✅ infra/mongo/init-mongo.js
   - Cập nhật HO_KINH_DOANH: thêm 11 trường CCCD chủ hộ

✅ infra/mongo/hkd-thay-doi-3-4-giay-to.js
   - Thêm migration script cập nhật document_types.HO_KINH_DOANH

✅ docs/HKD_THAY_DOI_FLOW.md
   - Documentation đầy đủ về flow mới
```

## Chạy migration

```bash
# 1. Cập nhật document_types trong MongoDB
mongosh --port 27017 govtrust_business infra/mongo/hkd-thay-doi-3-4-giay-to.js

# 2. Khởi động lại core-svc (auto-seed procedures từ mvp-procedures.ts)
cd apps/core-svc
npm run start:dev

# 3. Verify
mongosh --port 27017
> use govtrust_business
> db.document_types.findOne({ code: 'HO_KINH_DOANH' }).fields.length
17  // ✅ Đã có 17 trường (6 hộ KD + 11 chủ hộ)

> db.procedures.findOne({ code: 'HKD_THAY_DOI' }).formFields.length
34  // ✅ Đã có 34 formFields
```

## Testing

```bash
# 1. Đăng nhập
POST /auth/login
Body: { username: "nguyenvana", password: "123456" }
→ JWT token

# 2. eKYC cho chủ hộ mới
POST /auth/ekyc/verify
Headers: Authorization: Bearer <token>
Body (multipart):
  - front: cccd_front.jpg
  - back: cccd_back.jpg
  - selfie: selfie.jpg
→ kycStatus: VERIFIED

# 3. Tạo session
POST /sessions
Body: { procedureCode: "HKD_THAY_DOI" }
→ sessionId

# 4. Upload Giấy ĐKHKD
POST /documents/upload
Body (multipart):
  - sessionId: xxx
  - checklistId: giay_hkd
  - file: giay-dang-ky-ho-kinh-doanh_sample.jpg
→ OCR trích xuất thông tin chủ hộ cũ ⭐

# 5. Upload văn bản ủy quyền HGĐ
POST /documents/upload
Body (multipart):
  - sessionId: xxx
  - checklistId: van_ban_uy_quyen_hgd
  - file: giay-uy-quyen-lam-chu-ho-kinh-doanh.pdf

# 6. Xem form đã auto-fill
GET /sessions/:sessionId
→ aiResult.formData chứa 34 trường đã điền

# 7. Cross-check
→ aiResult.crossCheck: 4/4 rules passed ✅

# 8. Ký điện tử
POST /signatures/sign
Body (multipart):
  - sessionId: xxx
  - signerFullName: Nguyễn Văn A
  - signerRole: PRIMARY_SIGNER
  - signatureMethod: HANDWRITTEN_TABLET
  - signatureImage: signature.png

# 9. Nộp hồ sơ
PUT /sessions/:sessionId/confirm
```

## Lợi ích

✅ **Đơn giản cho người dân** — chỉ cần eKYC 1 lần (chủ hộ mới)  
✅ **Giảm công sức** — không cần chủ hộ cũ chụp CCCD + selfie riêng  
✅ **Tăng độ chính xác** — OCR từ Giấy ĐKHKD (giấy tờ chính thức)  
✅ **Cross-check tự động** — đảm bảo tính nhất quán giữa ĐKHKD, ủy quyền, eKYC  
✅ **Tuân thủ pháp luật** — văn bản ủy quyền công chứng đã xác thực danh tính  
✅ **Audit trail đầy đủ** — ai ký, lúc nào, ở đâu, thiết bị gì

## Next Steps

1. ⏳ Cập nhật AI service (OCR) để trích xuất đầy đủ 17 trường từ Giấy ĐKHKD
2. ⏳ Test E2E với giấy tờ mẫu thật
3. ⏳ UI hiển thị form 2 phần: chủ hộ cũ + chủ hộ mới
4. ⏳ Render template tờ khai với đầy đủ thông tin CCCD của 2 bên
