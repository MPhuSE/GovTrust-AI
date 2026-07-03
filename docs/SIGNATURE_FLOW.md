# Flow Ký Số + Audit Trail

## Tổng quan

Hệ thống ký số kết hợp **chữ ký tay + eKYC xác thực** cho phép người dân ký điện tử hồ sơ hành chính với đầy đủ audit trail (ai ký, lúc nào, ở đâu) để cán bộ nhà nước xác minh.

## Kiến trúc

### Schema mới
- **`signatures`** collection: lưu chữ ký + audit trail
  - Thông tin người ký: họ tên, CCCD, vai trò (chủ hộ mới/cũ, người ủy quyền, v.v.)
  - eKYC: đã verify hay chưa, điểm khớp khuôn mặt, thời điểm verify
  - Chữ ký: ảnh chữ ký, hash SHA-256 (chống chối bỏ)
  - Audit trail: IP, user-agent, device info, geolocation, timestamp
  - OTP confirmation: xác nhận qua SMS/Email (optional)

### API Endpoints
1. **POST /signatures/sign** — Ký điện tử hồ sơ
2. **GET /signatures/session/:sessionId** — Xem chữ ký của hồ sơ
3. **POST /signatures/verify/:signatureId** — Xác thực chữ ký bằng hash
4. **GET /signatures/audit/user/:userId** — Lịch sử ký của người dùng
5. **POST /signatures/audit/date-range** — Audit trail theo khoảng thời gian

## Quy trình ký số

### Bước 1: Người dân điền hồ sơ
```
1. Chọn thủ tục (ví dụ: Thay đổi chủ hộ kinh doanh)
2. Upload giấy tờ → OCR tự động điền form
3. eKYC xác thực danh tính (CCCD + selfie)
4. Xem trước tờ khai đã render
```

### Bước 2: Ký điện tử
**Option 2A: Ký trên màn hình cảm ứng**
```
User → Vẽ chữ ký trên canvas (tablet/phone)
     → Lưu thành ảnh PNG
     → POST /signatures/sign
        {
          sessionId: "xxx",
          signerFullName: "Nguyễn Văn A",
          signerCccdNumber: "001234567890",
          signerRole: "PRIMARY_SIGNER",
          signatureMethod: "HANDWRITTEN_TABLET",
          ekycVerified: true,
          ekycFaceMatchProb: 0.96
        }
        + file: signatureImage.png
```

**Option 2B: Ký giấy → chụp lại**
```
User → In tờ khai ra giấy
     → Ký tay
     → Chụp ảnh trang có chữ ký
     → POST /signatures/sign
        {
          signatureMethod: "HANDWRITTEN_PAPER",
          ...
        }
        + file: signed_page.jpg
```

### Bước 3: Hệ thống xử lý
```
Backend:
1. Thu thập audit trail:
   - IP address: req.ip
   - User-agent: req.headers['user-agent']
   - Device info: parse từ user-agent (iPhone 15 Pro, iOS 17.5)
   - Geolocation: từ GPS (nếu user cho phép)
   - Timestamp: Date.now()

2. Tính hash SHA-256 của ảnh chữ ký:
   signatureImageHash = sha256(signatureImage.buffer)

3. Lưu vào MongoDB:
   {
     sessionId,
     signerFullName,
     signerCccdNumber,
     signerRole,
     signatureMethod,
     signatureImageHash,
     signedAt: new Date(),
     ekycVerified: true,
     ekycFaceMatchProb: 0.96,
     ipAddress: "117.x.x.x",
     userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X)...",
     deviceInfo: "iPhone 15 Pro, iOS 17.5",
     geolocation: { latitude: 10.762622, longitude: 106.660172 }
   }

4. Upload ảnh chữ ký lên S3/storage (TODO)
5. Trả về signatureId cho user
```

### Bước 4: Kiểm tra đủ chữ ký
```
GET /signatures/session/:sessionId

Response:
{
  signatures: [
    { signerRole: "PRIMARY_SIGNER", signedAt: "2026-07-03T14:32:15Z", ... },
    { signerRole: "SECONDARY_SIGNER", signedAt: "2026-07-03T15:10:22Z", ... }
  ],
  completeness: {
    isComplete: true,
    required: ["PRIMARY_SIGNER", "SECONDARY_SIGNER"],
    collected: ["PRIMARY_SIGNER", "SECONDARY_SIGNER"],
    missing: []
  }
}
```

### Bước 5: Nộp hồ sơ
```
User → Nhấn "Nộp hồ sơ"
     → PUT /sessions/:sessionId/confirm
     → Session status: CONFIRMED
     → Cán bộ nhà nước nhận được hồ sơ
```

## Cán bộ xem hồ sơ

### Dashboard cán bộ
```
GET /sessions/:sessionId

Response:
{
  procedure: "Thay đổi chủ hộ kinh doanh",
  status: "CONFIRMED",
  documents: [...],
  signatures: [
    {
      signerFullName: "Nguyễn Văn A",
      signerRole: "PRIMARY_SIGNER (chủ hộ mới)",
      signedAt: "2026-07-03T14:32:15+07:00",
      ekycVerified: true,
      ekycFaceMatchProb: 0.96,
      signatureImageUrl: "https://s3.../signature_1.png",
      auditTrail: {
        ipAddress: "117.x.x.x",
        deviceInfo: "iPhone 15 Pro, iOS 17.5",
        geolocation: "10.7626°N, 106.6602°E (TP.HCM)"
      }
    },
    {
      signerFullName: "Trần Thị B",
      signerRole: "SECONDARY_SIGNER (chủ hộ cũ)",
      signedAt: "2026-07-03T15:10:22+07:00",
      ...
    }
  ],
  aiResult: { ... },
  crossCheck: { ... }
}
```

### UI hiển thị
```
┌─────────────────────────────────────────────────────────┐
│ 📄 Hồ sơ: Thay đổi chủ hộ kinh doanh                    │
│ Trạng thái: ✅ Đã nộp                                   │
│                                                          │
│ 🔐 Chữ ký điện tử (2/2)                                 │
│                                                          │
│ 1️⃣ Chủ hộ mới: Nguyễn Văn A                            │
│    ✅ eKYC verified (96% khớp khuôn mặt)                │
│    📅 Ký lúc: 03/07/2026 14:32:15                       │
│    📍 IP: 117.x.x.x (TP.HCM)                            │
│    📱 Thiết bị: iPhone 15 Pro, iOS 17.5                 │
│    [Xem ảnh chữ ký] [Xem CCCD]                          │
│                                                          │
│ 2️⃣ Chủ hộ cũ: Trần Thị B                               │
│    ✅ eKYC verified (94% khớp khuôn mặt)                │
│    📅 Ký lúc: 03/07/2026 15:10:22                       │
│    📍 IP: 14.y.y.y (Hà Nội)                             │
│    📱 Thiết bị: Samsung Galaxy S24, Android 14          │
│    [Xem ảnh chữ ký] [Xem CCCD]                          │
│                                                          │
│ [Duyệt hồ sơ] [Yêu cầu bổ sung] [Từ chối]              │
└─────────────────────────────────────────────────────────┘
```

## Xác thực chữ ký (verify hash)

```
POST /signatures/verify/:signatureId
Body: file = signatureImage

Backend:
1. Lấy signature từ DB
2. Tính hash của file upload: sha256(file.buffer)
3. So sánh với signature.signatureImageHash
4. Trả về: { isValid: true/false }

→ Chống chối bỏ: nếu hash khớp = chữ ký không bị sửa đổi
```

## Audit Trail

### Lịch sử ký của người dùng
```
GET /signatures/audit/user/:userId

Response:
{
  userId: "xxx",
  totalSignatures: 15,
  signatures: [
    { sessionId, procedureCode, signedAt, ipAddress, deviceInfo, ... },
    ...
  ]
}
```

### Audit trail theo thời gian
```
POST /signatures/audit/date-range
Body: { startDate: "2026-07-01", endDate: "2026-07-03" }

Response:
{
  totalSignatures: 247,
  signatures: [
    { signerFullName, procedureCode, signedAt, ipAddress, ... },
    ...
  ]
}
```

## Bảo mật

1. **eKYC bắt buộc** — xác thực danh tính qua CCCD + selfie + liveness detection
2. **Hash SHA-256** — chống chối bỏ, đảm bảo chữ ký không bị sửa đổi
3. **Audit trail đầy đủ** — IP, device, geolocation, timestamp
4. **JWT authentication** — chỉ user đã đăng nhập mới ký được
5. **File tự động xóa sau 30 phút** — bảo mật dữ liệu cá nhân
6. **Lưu thông tin đã trích xuất** — không lưu ảnh gốc lâu dài

## OTP Confirmation (Optional)

Tăng cường bảo mật bằng OTP:

```
Flow:
1. User ký điện tử
2. Hệ thống gửi OTP qua SMS/Email
3. User nhập OTP
4. POST /signatures/:signatureId/confirm-otp
   Body: { otp: "123456" }
5. Backend verify OTP → cập nhật signature:
   {
     otpConfirmed: true,
     otpConfirmedAt: new Date()
   }
```

## Tương lai (Phase 2)

1. **Chữ ký số USB Token/SIM PKI** — SignatureMethod.DIGITAL_SIGNATURE
2. **Blockchain audit trail** — lưu hash lên blockchain (chống chối bỏ tuyệt đối)
3. **Biometric signature** — chữ ký sinh trắc học (vân tay, khuôn mặt)
4. **Multi-party signature** — nhiều người ký tuần tự (workflow)
5. **Smart contract** — tự động duyệt hồ sơ khi đủ chữ ký

## Testing

```bash
# 1. Chạy backend
cd apps/core-svc
npm run start:dev

# 2. Test API
# 2.1. Đăng nhập
POST http://localhost:3000/auth/login
Body: { username: "nguyenvana", password: "123456" }
→ Lấy JWT token

# 2.2. eKYC
POST http://localhost:3000/auth/ekyc/verify
Headers: Authorization: Bearer <token>
Body (multipart):
  - front: cccd_front.jpg
  - back: cccd_back.jpg
  - selfie: selfie.jpg

# 2.3. Tạo session
POST http://localhost:3000/sessions
Body: { procedureCode: "HKD_THAY_DOI" }
→ Lấy sessionId

# 2.4. Upload giấy tờ
POST http://localhost:3000/documents/upload
Body (multipart):
  - sessionId: xxx
  - checklistId: giay_hkd
  - file: giay_hkd.jpg

# 2.5. Ký điện tử
POST http://localhost:3000/signatures/sign
Body (multipart):
  - sessionId: xxx
  - signerFullName: Nguyễn Văn A
  - signerCccdNumber: 001234567890
  - signerRole: PRIMARY_SIGNER
  - signatureMethod: HANDWRITTEN_TABLET
  - ekycVerified: true
  - ekycFaceMatchProb: 0.96
  - signatureImage: signature.png
→ Lấy signatureId

# 2.6. Kiểm tra chữ ký
GET http://localhost:3000/signatures/session/:sessionId

# 2.7. Nộp hồ sơ
PUT http://localhost:3000/sessions/:sessionId/confirm
```

## Files đã tạo

```
apps/core-svc/src/
├── database/schemas/
│   └── signature.schema.ts                    ✅ Schema MongoDB
├── modules/signatures/
│   ├── dto/
│   │   └── create-signature.dto.ts            ✅ DTO validation
│   ├── signatures.controller.ts               ✅ REST API
│   ├── signatures.service.ts                  ✅ Business logic
│   └── signatures.module.ts                   ✅ NestJS module
└── app.module.ts                              ✅ Đã import SignaturesModule
```

## Next Steps

1. ✅ Schema + Service + Controller + Module
2. ⏳ Upload ảnh chữ ký lên S3/storage
3. ⏳ UI cho người dân ký (canvas vẽ chữ ký)
4. ⏳ UI cho cán bộ xem audit trail
5. ⏳ OTP confirmation qua SMS/Email
6. ⏳ Export audit trail ra PDF/Excel
7. ⏳ Integration test E2E
