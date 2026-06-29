# GovTrust AI — Thông tin cần thu thập để DB hỗ trợ ĐA DẠNG giấy tờ

> **Mục tiêu:** Biến CSDL từ "khoá cứng vào một loại giấy tờ (CCCD)" thành **cấu hình động** —
> thêm một loại giấy tờ mới = thêm 1 document, **không sửa code, không sửa schema**.
> **Phiên bản:** 0.1 (nháp khảo sát) — 29/06/2026

---

## 0. Vì sao DB hiện tại chưa "tổng quát"?

Trong `DATABASE_DESIGN.md` v2.0, "loại giấy tờ" chưa phải là một **thực thể (entity)**. Nó đang bị nhúng và hardcode rải rác:

| Chỗ trong design cũ | Dòng | Vấn đề khoá cứng |
|---|---|---|
| `acceptedTypes: ["CCCD","CMND","PASSPORT"]` | 82 | Loại giấy tờ chỉ là **string tự do** — không có nơi định nghĩa "CCCD gồm field gì, hạn dùng ra sao". |
| `aiResult.ocrData."cccd_cha_me".fields: { hoTen, ngaySinh }` | 149–154 | **Schema field OCR bị cố định theo CCCD.** Hộ chiếu, giấy khai sinh, sổ đỏ… có bộ field khác hẳn → không khớp. |
| `crossCheck.mismatches[].field` | 158 | So khớp chéo giả định **biết trước** field nào tồn tại. |
| `scoringRules.penalties` (4 loại cố định) | 95–101 | Mỗi giấy tờ/thủ tục có thể cần loại lỗi khác (sai dấu giáp lai, thiếu công chứng, sai mẫu…). |

> **Giải pháp cốt lõi:** tách ra collection mới **`document_types`** (catalog loại giấy tờ) làm "từ điển" dùng chung. `procedures.checklist` chỉ **tham chiếu** tới mã giấy tờ, không tự định nghĩa lại.

---

## 1. Danh mục loại giấy tờ (Document Type Catalog)

Đây là phần thu thập **quan trọng nhất**. Liệt kê **mọi** giấy tờ xuất hiện trong các thủ tục bạn muốn hỗ trợ. Với **mỗi** loại giấy tờ, thu thập đủ các mục dưới đây.

### 1.1. Thông tin định danh & phân loại

| Thông tin cần thu thập | Mô tả | Ví dụ |
|---|---|---|
| **Mã chuẩn (`code`)** | Khoá định danh duy nhất, viết hoa, không dấu | `CCCD`, `PASSPORT`, `GIAY_KHAI_SINH`, `SO_HO_KHAU`, `GIAY_DKKH` |
| **Tên hiển thị (`name`)** | Tên đầy đủ tiếng Việt | "Căn cước công dân", "Giấy khai sinh" |
| **Nhóm (`category`)** | Phân loại để filter/RAG | `NHAN_THAN`, `HO_TICH`, `DAT_DAI`, `DOANH_NGHIEP` |
| **Cơ quan cấp (`issuingAuthority`)** | Nơi cấp giấy | "Bộ Công an", "UBND cấp xã" |
| **Có ảnh chân dung không** | Phục vụ liveness/eKYC | CCCD/Hộ chiếu = có; Giấy khai sinh = không |
| **Mặt cần chụp** | 1 mặt / 2 mặt / nhiều trang | CCCD = 2 mặt; Hộ chiếu = trang nhân thân |

### 1.2. Bộ trường dữ liệu (Field Schema) — phần cốt lõi để hết hardcode

Đây là thứ thay thế đoạn `fields: { hoTen, ngaySinh }` đang cố định. Với **mỗi field** trên giấy tờ, thu thập:

| Thuộc tính field | Mô tả | Ví dụ (CCCD) |
|---|---|---|
| `key` | Tên máy của field | `soCCCD`, `hoTen`, `ngaySinh`, `gioiTinh`, `queQuan`, `noiThuongTru`, `ngayCap`, `noiCap`, `coGiaTriDen` |
| `label` | Nhãn hiển thị | "Số CCCD", "Họ và tên" |
| `dataType` | Kiểu dữ liệu | `string`, `date`, `enum`, `number`, `id_number` |
| `format / regex` | Định dạng để validate | Số CCCD = `^\d{12}$`; ngày = `dd/mm/yyyy` |
| `required` | Bắt buộc OCR phải đọc được | `soCCCD`=true |
| `isIdentity` | Có phải trường định danh người (PII) không | dùng cho cross-check & ẩn danh hoá |
| `enumValues` | Tập giá trị hợp lệ (nếu enum) | gioiTinh = `["Nam","Nữ"]` |

> **Lợi ích:** OCR result lúc này lưu theo `documentTypeCode + fields{}` **chuẩn hoá theo catalog**, không còn giả định field nào tồn tại. Mọi giấy tờ dùng chung một khuôn `{ key, value, confidence }`.

### 1.3. Quy tắc hết hạn (Validity / Expiry Rule)

Để thay cho `expiredDoc` cố định — mỗi giấy tờ có cách tính hạn khác nhau:

| Thông tin | Mô tả | Ví dụ |
|---|---|---|
| `hasExpiry` | Giấy tờ có hạn dùng không | CCCD có; Giấy khai sinh **không bao giờ hết hạn** |
| `expiryField` | Field nào chứa ngày hết hạn | CCCD = `coGiaTriDen` |
| `validityRule` | Cách suy ra hạn nếu không in sẵn | CCCD hết hạn theo **mốc tuổi 25/40/60**; Hộ chiếu = 10 năm từ ngày cấp |
| `gracePeriodDays` | Số ngày ân hạn (nếu có) | |

### 1.4. Quy tắc nhận dạng & chất lượng ảnh

| Thông tin | Mô tả |
|---|---|
| `aliasNames` | Các tên gọi khác / giấy tờ thay thế được | "CMND 9 số" có thể thay "CCCD" trong vài thủ tục |
| `minResolution` / `qualityRule` | Ngưỡng chất lượng ảnh chấp nhận |
| `securityFeatures` | Dấu hiệu thật/giả cần kiểm (giáp lai, hologram, QR) — nếu có AI anti-fraud |
| `ocrProviderHint` | Provider OCR phù hợp (VNPT eKYC, FPT.AI, mock…) |

---

## 2. Thủ tục tham chiếu giấy tờ (Procedure ↔ Document Type)

Sửa lại `procedures.checklist`: **không tự định nghĩa giấy tờ**, chỉ **trỏ** tới catalog và bổ sung ràng buộc *riêng cho thủ tục đó*.

Cần thu thập, với mỗi mục trong checklist của một thủ tục:

| Thông tin | Mô tả | Ví dụ |
|---|---|---|
| `documentTypeCode` | Trỏ tới `document_types.code` | `CCCD` |
| `roleInProcedure` | Vai trò của giấy trong hồ sơ này | "CCCD của **cha hoặc mẹ**" |
| `acceptedCodes` | Danh sách mã thay thế chấp nhận | `["CCCD","CMND","PASSPORT"]` |
| `quantity` | Số bản / số người cần nộp | 2 (cha và mẹ) |
| `isRequired` | Bắt buộc trong thủ tục này | |
| `points` | Điểm đóng góp khi chấm | |
| `conditionalOn` | Chỉ cần khi điều kiện nào đó | "chỉ cần nếu sinh tại nhà" |

> Nhờ tách như vậy: **một loại giấy tờ định nghĩa 1 lần**, dùng lại trong **nhiều thủ tục** với vai trò khác nhau.

---

## 3. Quy tắc đối chiếu chéo (Cross-Check Rules)

Hiện `crossCheck` giả định biết field. Để tổng quát, cần thu thập **danh sách quy tắc khớp giữa các giấy tờ**:

| Thông tin | Mô tả | Ví dụ |
|---|---|---|
| `matchFields` | Cặp field phải trùng giữa 2+ giấy tờ | `CCCD.hoTen` == `GIAY_KHAI_SINH.hoTenCha` |
| `matchType` | Mức so khớp | `exact`, `normalized` (bỏ dấu, hoa/thường), `fuzzy` |
| `tolerance` | Ngưỡng sai khác cho fuzzy | |
| `severityIfMismatch` | Lỗi nặng/nhẹ nếu lệch | HIGH / MEDIUM / LOW |
| `normalizationRule` | Chuẩn hoá trước khi so (vd: chuẩn hoá tên có dấu) | |

---

## 4. Quy tắc chấm điểm động (Scoring Rules)

Thay cho 4 penalty cố định, thu thập **danh mục loại lỗi mở rộng** + trọng số có thể cấu hình theo thủ tục **hoặc** theo loại giấy tờ:

| Thông tin | Mô tả |
|---|---|
| `errorCatalog` | Danh sách mọi loại lỗi hệ thống có thể phát hiện (mở rộng được) |
| `penaltyByError` | Điểm trừ cho mỗi loại lỗi (override theo procedure) |
| `gradeThresholds` | Mốc điểm → hạng A/B/C/D |
| `blockingErrors` | Lỗi nào làm hồ sơ **không thể nộp** dù điểm cao |

Gợi ý `errorCatalog` cần khảo sát đủ rộng:
`MISSING_DOC`, `INFO_MISMATCH`, `EXPIRED_DOC`, `LOW_QUALITY_IMG`, `LIVENESS_FAIL`,
`WRONG_DOC_TYPE`, `MISSING_NOTARIZATION` (thiếu công chứng), `WRONG_FORM_TEMPLATE` (sai mẫu),
`MISSING_SIGNATURE`, `ILLEGIBLE` (mờ/không đọc được), `FRAUD_SUSPECTED`.

---

## 5. Căn cứ pháp lý theo giấy tờ (Legal Mapping cho LawGuard/Qdrant)

Để LawGuard trả đúng điều luật cho từng giấy tờ, thu thập:

| Thông tin | Mô tả | Ví dụ |
|---|---|---|
| `legalCategory` | Map giấy tờ/thủ tục → `category` trong Qdrant | `HO_TICH` |
| `governingLaws` | Văn bản luật điều chỉnh giấy tờ này | "Luật Căn cước 2023", "Luật Hộ tịch 2014" |
| `keyArticles` | Điều khoản hay tra cứu | "Điều 16 Luật Hộ tịch" |
| `sourceVersion` | Phiên bản/năm hiệu lực | "2023" |

---

## 6. Checklist thu thập (tóm tắt — để đi khảo sát)

Cho **mỗi loại giấy tờ** muốn hỗ trợ, đảm bảo có đủ:

- [ ] Mã chuẩn + tên + nhóm + cơ quan cấp
- [ ] **Bộ field đầy đủ** (key, label, dataType, regex, required, isIdentity)
- [ ] Quy tắc hết hạn (có/không, field nào, cách tính)
- [ ] Tên thay thế / giấy tờ thay thế được
- [ ] Ngưỡng chất lượng ảnh, số mặt cần chụp
- [ ] Quy tắc khớp chéo với các giấy tờ khác
- [ ] Căn cứ pháp lý (luật, điều, năm)

Cho **mỗi thủ tục**:

- [ ] Danh sách giấy tờ (trỏ `documentTypeCode`, không định nghĩa lại)
- [ ] Vai trò, số lượng, bắt buộc/điều kiện, điểm
- [ ] Override penalty / blockingErrors riêng (nếu khác mặc định)

---

## 7. Hình dung schema mới (gợi ý — chưa chốt)

```typescript
// COLLECTION MỚI: document_types  (catalog dùng chung)
{
  _id: ObjectId,
  code: "CCCD",                       // unique
  name: "Căn cước công dân",
  category: "NHAN_THAN",
  issuingAuthority: "Bộ Công an",
  hasPortrait: true,
  pagesRequired: 2,

  fields: [
    { key: "soCCCD",  label: "Số CCCD", dataType: "id_number",
      regex: "^\\d{12}$", required: true, isIdentity: true },
    { key: "hoTen",   label: "Họ và tên", dataType: "string",
      required: true, isIdentity: true },
    { key: "ngaySinh",label: "Ngày sinh", dataType: "date",
      format: "dd/mm/yyyy", required: true, isIdentity: true },
    { key: "coGiaTriDen", label: "Có giá trị đến", dataType: "date" }
    // ...
  ],

  validity: {
    hasExpiry: true,
    expiryField: "coGiaTriDen",
    validityRule: "AGE_MILESTONE_25_40_60"
  },

  aliasCodes: ["CMND"],
  qualityRule: { minResolution: 1024 },
  legal: { category: "NHAN_THAN", governingLaws: ["Luật Căn cước 2023"] },

  isActive: true
}
```

```typescript
// procedures.checklist  — CHỈ THAM CHIẾU, không định nghĩa lại giấy tờ
checklist: [
  {
    id: "cccd_cha_me",
    documentTypeCode: "CCCD",          // → trỏ document_types
    acceptedCodes: ["CCCD", "CMND", "PASSPORT"],
    roleInProcedure: "CCCD của cha hoặc mẹ",
    quantity: 2,
    isRequired: true,
    points: 20
  }
]
```

```typescript
// sessions.aiResult.ocrData  — chuẩn hoá theo catalog, hết hardcode field
ocrData: {
  "cccd_cha_me": {
    documentTypeCode: "CCCD",
    provider: "VNPT_EKYC",
    confidence: 0.95,
    fields: {                          // key khớp document_types.fields[].key
      soCCCD:   { value: "0010xxxxxxx", confidence: 0.97 },
      hoTen:    { value: "NGUYỄN VĂN A", confidence: 0.95 },
      ngaySinh: { value: "01/01/1990",  confidence: 0.96 }
    },
    liveness: true
  }
}
```

---

## 8. Câu hỏi cần chốt trước khi viết schema chính thức

1. Phạm vi MVP hỗ trợ **bao nhiêu loại giấy tờ** và **bao nhiêu thủ tục**?
2. Cross-check rule đặt ở đâu: trong `procedures` (theo thủ tục) hay tách collection `crosscheck_rules`?
3. `errorCatalog` cố định trong code hay cấu hình trong DB (cho phép thêm loại lỗi mới)?
4. Validity rule phức tạp (mốc tuổi CCCD) tính bằng **code rule có tên** hay biểu thức cấu hình?
