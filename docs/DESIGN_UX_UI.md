# GovTrust AI — Tài Liệu Thiết Kế UX/UI
### Vietnamese Student HackAIthon 2026 | Bảng B — Challenger

> **Tài liệu này bám sát 8 tiêu chí con** trong nhóm "Trải nghiệm người dùng" (20 điểm) của Vòng 2.
> Mỗi mục tương ứng 1 tiêu chí chấm điểm — team cần hoàn thiện đủ cả 8 mục để ăn trọn điểm.

---

## Mục lục

1. [Đối tượng mục tiêu (User Personas)](#1-đối-tượng-mục-tiêu-user-personas)
2. [Nhu cầu chính & Pain Points](#2-nhu-cầu-chính--pain-points)
3. [Thiết bị ưu tiên & Responsive Strategy](#3-thiết-bị-ưu-tiên--responsive-strategy)
4. [Tối ưu công sức & thao tác sử dụng](#4-tối-ưu-công-sức--thao-tác-sử-dụng)
5. [Giao diện người dùng (UI) & Accessibility](#5-giao-diện-người-dùng-ui--accessibility)
6. [Tính nhất quán (Consistency)](#6-tính-nhất-quán-consistency)
7. [Thiết kế dựa trên dữ liệu & nguyên tắc thiết kế](#7-thiết-kế-dựa-trên-dữ-liệu--nguyên-tắc-thiết-kế)
8. [UX Metrics & Lộ trình tối ưu liên tục](#8-ux-metrics--lộ-trình-tối-ưu-liên-tục)
9. [User Flow chi tiết](#9-user-flow-chi-tiết)
10. [Wireframe Specifications](#10-wireframe-specifications)
11. [Design System & Component Library](#11-design-system--component-library)

---

## 1. Đối tượng mục tiêu (User Personas)

> **Tiêu chí:** *Xác định và hiểu rõ đối tượng mục tiêu.*

### Persona 1: Người dân — "Chị Hạnh"

| Thuộc tính | Chi tiết |
| --- | --- |
| **Tên đại diện** | Nguyễn Thị Hạnh |
| **Tuổi** | 42 tuổi |
| **Nghề nghiệp** | Bán hàng tạp hóa nhỏ, hộ kinh doanh cá thể |
| **Học vấn** | Tốt nghiệp lớp 12 |
| **Kỹ năng công nghệ** | Thấp — biết dùng Zalo, Facebook, chụp ảnh bằng điện thoại. Không quen dùng web form phức tạp |
| **Thiết bị** | Điện thoại Android tầm trung (Xiaomi Redmi, Samsung Galaxy A), màn hình 6.5 inch, mạng 4G |
| **Bối cảnh sử dụng** | Cần đăng ký khai sinh cho con, cấp đổi CCCD, đăng ký hộ kinh doanh |
| **Hành vi hiện tại** | Tự photo giấy tờ → đi xe buýt đến bộ phận một cửa → xếp hàng → nộp → bị trả lại vì thiếu/sai → về photo lại → quay lại xếp hàng |
| **Nỗi đau lớn nhất** | *"Tôi không biết mình thiếu giấy gì cho đến khi bị trả hồ sơ. Mỗi lần đi lại mất nửa ngày công."* |
| **Kỳ vọng** | Biết trước mình cần gì, giấy tờ đã đúng/đủ chưa, không phải đi lại nhiều lần |
| **Rào cản** | Ngại dùng app mới, sợ lộ thông tin cá nhân, không hiểu thuật ngữ hành chính |

### Persona 2: Cán bộ một cửa — "Anh Tuấn"

| Thuộc tính | Chi tiết |
| --- | --- |
| **Tên đại diện** | Trần Văn Tuấn |
| **Tuổi** | 35 tuổi |
| **Nghề nghiệp** | Cán bộ tiếp nhận hồ sơ, Bộ phận Một cửa cấp xã/phường |
| **Kỹ năng công nghệ** | Trung bình — quen dùng máy tính bàn, Microsoft Office, hệ thống nội bộ |
| **Thiết bị** | Máy tính bàn (Windows, màn hình 21-24 inch, mạng LAN) |
| **Khối lượng công việc** | Tiếp nhận 30–50 hồ sơ/ngày, xử lý 8–10 loại thủ tục khác nhau |
| **Nỗi đau lớn nhất** | *"Cùng một lỗi thiếu giấy chứng sinh nhưng tôi phải giải thích đi giải thích lại cho từng người dân mỗi ngày."* |
| **Kỳ vọng** | Giảm số hồ sơ bị trả, có công cụ tái kiểm nhanh, biết được thủ tục nào hay bị lỗi để đề xuất cải tiến |
| **Rào cản** | Ngại thay đổi quy trình, lo ngại AI can thiệp vào quyết định hành chính |

### Persona 3: Quản lý cơ quan — "Chị Linh" (Secondary user)

| Thuộc tính | Chi tiết |
| --- | --- |
| **Tên đại diện** | Phạm Thị Linh |
| **Tuổi** | 48 tuổi |
| **Nghề nghiệp** | Phó Giám đốc Trung tâm Phục vụ Hành chính công cấp tỉnh |
| **Kỹ năng công nghệ** | Trung bình — dùng email, xem báo cáo, không code |
| **Thiết bị** | Laptop Windows, iPad (xem báo cáo di động) |
| **Nỗi đau lớn nhất** | *"Tôi không có dữ liệu nào cho biết thủ tục nào đang tắc nghẽn và vì sao."* |
| **Kỳ vọng** | Dashboard trực quan, nhìn là hiểu ngay điểm nghẽn, có dữ liệu để đề xuất cải cách |

---

## 2. Nhu cầu chính & Pain Points

> **Tiêu chí:** *Đáp ứng các nhu cầu chính của đối tượng mục tiêu.*

### Ma trận Nhu cầu → Giải pháp

| # | Nhu cầu (Job-to-be-done) | Đối tượng | Pain Point hiện tại | Module giải quyết | Cách giải quyết cụ thể |
| --- | --- | --- | --- | --- | --- |
| 1 | Biết cần chuẩn bị giấy tờ gì | Người dân | Hướng dẫn trên cổng DVC dài, khó hiểu, thuật ngữ hành chính | **HoSoBot** | Chatbot hỏi bằng ngôn ngữ tự nhiên: *"Tôi muốn đăng ký khai sinh"* → trả checklist rõ ràng |
| 2 | Biết giấy tờ đã đúng/đủ chưa trước khi đi nộp | Người dân | Không có cách nào kiểm tra → chỉ biết khi bị trả | **OCR + CrossCheck + Score** | Chụp ảnh giấy tờ → AI bóc tách + so khớp → chấm điểm 0-100 → nói rõ thiếu gì, sai gì |
| 3 | Điền form không sai sót | Người dân | Form giấy viết tay, hay điền sai tên/ngày/địa chỉ | **SmartForm** | Dữ liệu OCR tự điền vào form → người dân chỉ kiểm tra và xác nhận |
| 4 | Không phải đi lại nhiều lần | Người dân | Trung bình phải đi 2-3 lần mới nộp thành công | **Toàn pipeline** | Kiểm tra đủ tại nhà → 1 lần đi nộp là xong |
| 5 | Yên tâm về căn cứ pháp lý | Người dân | Không biết yêu cầu giấy tờ có đúng luật không | **LawGuard** | Trích dẫn nguồn luật cụ thể (điều, khoản, nghị định) |
| 6 | Giảm hồ sơ bị trả lại | Cán bộ | 30-40% hồ sơ bị trả do lỗi hình thức | **Score + CrossCheck** | Người dân đã tự sửa trước → hồ sơ đến tay cán bộ đã sạch hơn |
| 7 | Tái kiểm hồ sơ nhanh | Cán bộ | Kiểm từng trang giấy tờ bằng mắt, mất 10-15 phút/hồ sơ | **Gov Re-Check** | AI kiểm trước → cán bộ chỉ xác nhận → 2-3 phút/hồ sơ |
| 8 | Biết thủ tục nào đang nghẽn | Quản lý | Không có dữ liệu, chỉ nghe phản ánh miệng | **InsightMap** | Dashboard real-time: top lỗi, thủ tục nghẽn, xu hướng theo tuần |

### Hành trình người dân: Trước vs. Sau GovTrust AI

```
TRƯỚC (Không có GovTrust AI):
┌─────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐
│ Tìm hiểu│ →  │ Photo    │ →  │ Xếp hàng │ →  │ BỊ TRẢ   │ →  │ Về photo │
│ thủ tục  │    │ giấy tờ  │    │ nộp hồ sơ│    │ HỒ SƠ   │    │ lại      │
│ (1-2h)   │    │ (30 phút)│    │ (1-2h)   │    │ (thiếu!) │    │ (quay lại│
│          │    │          │    │          │    │          │    │ từ đầu)  │
└─────────┘    └──────────┘    └──────────┘    └──────────┘    └──────────┘
                                                    ↕
                                            Lặp lại 2-3 lần
                                            Tổng: 2-3 ngày

SAU (Có GovTrust AI):
┌─────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐
│ Chat    │ →  │ Chụp ảnh │ →  │ Xem kết  │ →  │ Sửa lỗi │ →  │ Đi nộp  │
│ HoSoBot │    │ giấy tờ  │    │ quả AI   │    │ tại nhà  │    │ 1 LẦN   │
│ (2 phút)│    │ (5 phút) │    │ (30 giây)│    │ (10 phút)│    │ DUY NHẤT│
│          │    │          │    │Score: 72 │    │Score: 95 │    │ ✅ XONG  │
└─────────┘    └──────────┘    └──────────┘    └──────────┘    └──────────┘
                                                                Tổng: 20 phút
```

---

## 3. Thiết bị ưu tiên & Responsive Strategy

> **Tiêu chí:** *Hoạt động trên thiết bị ưu tiên của đối tượng mục tiêu.*

### Ma trận Thiết bị theo Persona

| Persona | Thiết bị chính | Màn hình | Mạng | OS | Trình duyệt |
| --- | --- | --- | --- | --- | --- |
| Người dân (Chị Hạnh) | **Điện thoại Android tầm trung** | 5.5–6.7 inch | 4G/WiFi | Android 10+ | Chrome Mobile |
| Cán bộ (Anh Tuấn) | **Máy tính bàn** | 21–24 inch | LAN | Windows 10/11 | Chrome / Edge |
| Quản lý (Chị Linh) | Laptop + iPad | 13–15 inch / 10 inch | WiFi | Windows / iPadOS | Chrome / Safari |

### Chiến lược Responsive

```
Breakpoints:
  - Mobile:   < 640px   (sm)  ← THIẾT KẾ ƯU TIÊN CHO NGƯỜI DÂN
  - Tablet:   640–1024px (md)
  - Desktop:  > 1024px  (lg)  ← THIẾT KẾ ƯU TIÊN CHO CÁN BỘ/QUẢN LÝ
```

| Nguyên tắc | Lý do | Cách triển khai |
| --- | --- | --- |
| **Mobile-First** cho luồng người dân | 80%+ người dân dùng điện thoại | CSS viết mobile trước, thêm `@media (min-width)` cho desktop |
| **Desktop-First** cho Dashboard cán bộ | Cán bộ dùng máy tính bàn, cần xem biểu đồ/bảng rộng | Layout 2-3 cột, bảng dữ liệu đầy đủ |
| **Touch-friendly** | Ngón tay to hơn con trỏ chuột | Nút bấm tối thiểu 48×48px, khoảng cách giữa các nút ≥ 8px |
| **Offline-tolerant** | Mạng 4G không ổn định ở nông thôn | Loading skeleton, retry button khi mất mạng, cache kết quả OCR |

### Kiểm tra tương thích cần làm

| Thiết bị | Trình duyệt | Phiên bản | Ưu tiên |
| --- | --- | --- | --- |
| Android Phone (Xiaomi/Samsung) | Chrome Mobile | 90+ | ⭐ Bắt buộc |
| iPhone | Safari Mobile | 15+ | Nên có |
| Windows Desktop | Chrome | 100+ | ⭐ Bắt buộc (cho cán bộ) |
| Windows Desktop | Edge | 100+ | Nên có |
| iPad | Safari | 15+ | Tùy chọn |

---

## 4. Tối ưu công sức & thao tác sử dụng

> **Tiêu chí:** *Tối ưu công sức, thao tác sử dụng.*

### Nguyên tắc: Giảm tối đa số bước và sức lực nhận thức

| # | Nguyên tắc tối ưu | Cách áp dụng trong GovTrust AI | Metric đo |
| --- | --- | --- | --- |
| 1 | **Giảm số bước hoàn thành** | Từ 5+ lần đi lại → 1 luồng online 5 bước (Chọn → Upload → Xem → Sửa → Xác nhận) | Số bước hoàn thành: ≤ 5 |
| 2 | **Giảm lượng text đọc** | Kết quả Score hiển thị bằng số lớn + màu sắc + biểu tượng (✅ ❌ ⚠️), không phải đoạn văn dài | Thời gian hiểu kết quả: < 5 giây |
| 3 | **Giảm nhập liệu** | SmartForm tự điền từ OCR → người dân chỉ kiểm tra và bấm xác nhận, không phải gõ lại | Số trường phải gõ tay: 0-2 |
| 4 | **Hướng dẫn ngay trong context** | Bên cạnh nút "Upload CCCD" có dòng nhỏ: *"Chụp mặt trước, đặt nằm ngang, đủ ánh sáng"* | Tỷ lệ ảnh lỗi chất lượng: < 10% |
| 5 | **Progressive disclosure** | Không hiện hết thông tin cùng lúc. Chỉ hiện Score → bấm "Xem chi tiết" mới mở breakdown | Tỷ lệ overwhelm/bỏ dở: < 15% |
| 6 | **Smart defaults** | Mặc định chọn thủ tục phổ biến nhất. Mặc định camera sau khi bấm upload trên mobile | Thời gian bắt đầu: < 10 giây |
| 7 | **Undo/Edit dễ dàng** | Sau khi upload sai ảnh → bấm "Đổi ảnh" ngay tại chỗ, không cần quay lại từ đầu | Tỷ lệ phải restart: < 5% |
| 8 | **Feedback tức thì** | Upload ảnh → ngay lập tức hiện preview + kiểm tra chất lượng (mờ/tối) trước khi bấm tiếp | Thời gian phản hồi: < 1 giây |

### Đếm số thao tác (Tap Count) trên Mobile — Luồng người dân

```
Bước 1: Vào app                    → 0 tap (mở link)
Bước 2: Chọn "Kiểm tra hồ sơ"     → 1 tap
Bước 3: Chat hoặc chọn thủ tục     → 1–2 tap
Bước 4: Upload ảnh CCCD            → 2 tap (bấm + chụp/chọn)
Bước 5: Upload ảnh khác            → 2 tap × n giấy tờ
Bước 6: Bấm "Kiểm tra"            → 1 tap
Bước 7: Xem kết quả Score          → 0 tap (tự hiện)
Bước 8: Xem chi tiết lỗi           → 1 tap (mở dropdown)
Bước 9: Xem SmartForm              → 1 tap (swipe hoặc tab)
Bước 10: Xác nhận                  → 1 tap

TỔNG: ~10-12 tap cho 1 hồ sơ 3 giấy tờ
(So sánh: đi UBND = 3 chuyến xe, 6 giờ, 20+ bước thủ công)
```

---

## 5. Giao diện người dùng (UI) & Accessibility

> **Tiêu chí:** *Tối ưu giao diện người dùng (user interface) và khả năng tiếp cận (accessibility).*

### 5.1. Design Tokens — Bảng màu & Typography

#### Bảng màu

```
Primary (Xanh dương — Tin cậy, Chính phủ):
  - primary-50:   #EFF6FF
  - primary-100:  #DBEAFE
  - primary-500:  #3B82F6   ← Nút chính, link
  - primary-600:  #2563EB   ← Hover state
  - primary-700:  #1D4ED8   ← Header, navbar
  - primary-900:  #1E3A5F   ← Text đậm

Success (Xanh lá — Đạt/Pass):
  - success-50:   #F0FDF4
  - success-500:  #22C55E   ← Score cao, ✅ Match
  - success-700:  #15803D

Warning (Vàng cam — Cần chú ý):
  - warning-50:   #FFFBEB
  - warning-500:  #F59E0B   ← Score trung bình, ⚠️ Cần kiểm tra
  - warning-700:  #B45309

Danger (Đỏ — Lỗi/Thiếu):
  - danger-50:    #FEF2F2
  - danger-500:   #EF4444   ← Score thấp, ❌ Mismatch, thiếu
  - danger-700:   #B91C1C

Neutral (Xám — Nền, border, text phụ):
  - neutral-50:   #F9FAFB   ← Background chính
  - neutral-100:  #F3F4F6   ← Card background
  - neutral-300:  #D1D5DB   ← Border
  - neutral-500:  #6B7280   ← Text phụ
  - neutral-700:  #374151   ← Text chính
  - neutral-900:  #111827   ← Heading
```

**Lý do chọn xanh dương (Blue):** Trong thiết kế UX cho GovTech (Chính phủ điện tử), xanh dương là màu phổ quát nhất tượng trưng cho sự **tin cậy, chính thống, an toàn**. Các cổng dịch vụ công VNeID, Cổng DVC Quốc gia, GOV.UK, Singapore GovTech đều sử dụng palette xanh dương làm chủ đạo.

#### Typography

```
Font chính:    Inter (Google Fonts) — hỗ trợ tốt tiếng Việt, dễ đọc trên mobile
Font phụ:      System fonts fallback (Segoe UI, Roboto, Arial)
Font mono:     JetBrains Mono — cho mã số, số CCCD

Kích thước (Mobile-first):
  - Heading 1 (H1):  24px / 32px line-height / Bold 700
  - Heading 2 (H2):  20px / 28px / SemiBold 600
  - Heading 3 (H3):  18px / 24px / SemiBold 600
  - Body:            16px / 24px / Regular 400     ← CỠ TỐI THIỂU cho mobile
  - Body small:      14px / 20px / Regular 400
  - Caption:         12px / 16px / Regular 400
  - Score number:    48px / 56px / Bold 700        ← Số điểm to, dễ đọc

Kích thước (Desktop — cán bộ):
  - H1: 32px, H2: 24px, H3: 20px, Body: 16px
```

### 5.2. Accessibility (Khả năng tiếp cận)

| # | Tiêu chuẩn WCAG 2.1 | Cách áp dụng | Lý do |
| --- | --- | --- | --- |
| 1 | **Contrast ratio ≥ 4.5:1** (AA) | Text chính (#374151) trên nền trắng (#FFFFFF) = ratio 10.2:1 ✅ | Người lớn tuổi, người dân dùng điện thoại ngoài nắng |
| 2 | **Font size ≥ 16px** trên mobile | Body text = 16px, Score = 48px | Tránh người dùng phải zoom, đặc biệt người trung niên |
| 3 | **Nút bấm ≥ 48×48px** | Tất cả nút, checkbox, radio, upload area | Ngón tay ≥ 44px theo Apple HIG, ≥ 48px theo Google Material |
| 4 | **Không dùng chỉ màu sắc** để truyền thông tin | Score xanh/vàng/đỏ **luôn kèm icon** (✅ ⚠️ ❌) và text label | Người mù màu vẫn hiểu kết quả |
| 5 | **Label rõ ràng** cho mọi input | Mỗi ô upload có label: *"Ảnh mặt trước CCCD"*, không chỉ icon | Người dân ít rành công nghệ cần hướng dẫn tường minh |
| 6 | **Focus visible** | Khi dùng Tab trên desktop, viền xanh rõ ràng quanh phần tử focus | Cán bộ dùng bàn phím nhanh hơn chuột |
| 7 | **Error message cụ thể** | Thay *"Lỗi upload"* bằng *"Ảnh quá mờ, vui lòng chụp lại ở nơi đủ ánh sáng"* | Giảm lo lắng, hướng dẫn hành động tiếp theo |
| 8 | **Aria labels** | Nút upload: `aria-label="Tải lên ảnh mặt trước CCCD"` | Screen reader cho người khiếm thị |
| 9 | **Ngôn ngữ đơn giản** | *"Giấy tờ của bạn đã hết hạn"* thay vì *"Document expired per validation rule"* | Người dân không hiểu tiếng Anh/thuật ngữ kỹ thuật |
| 10 | **Hỗ trợ giọng nói** (VNPT SmartVoice) | TTS đọc kết quả Score, STT cho người không tiện gõ | Tăng tiếp cận cho nhóm ít quen giao diện |

### 5.3. Trạng thái giao diện (UI States)

Mọi component phải có **đủ 5 trạng thái**:

```
1. Empty State     → "Chưa có giấy tờ nào. Bấm để bắt đầu chụp ảnh."
2. Loading State   → Skeleton shimmer + text "Đang bóc tách thông tin..."
3. Success State   → ✅ + màu xanh lá + kết quả cụ thể
4. Warning State   → ⚠️ + màu vàng + "Cần kiểm tra thêm: [chi tiết]"
5. Error State     → ❌ + màu đỏ + lý do lỗi + nút "Thử lại"
```

---

## 6. Tính nhất quán (Consistency)

> **Tiêu chí:** *Đảm bảo tính nhất quán.*

### 6.1. Nhất quán về layout

| Thành phần | Quy tắc | Áp dụng cho |
| --- | --- | --- |
| **Header** | Logo trái + Tên bước hiện tại giữa + Menu phải. Cao 56px mobile, 64px desktop | Tất cả trang |
| **Progress Bar** | Thanh 5 bước nằm ngang dưới header. Bước hiện tại có chấm tròn to + màu primary | Luồng người dân (5 bước) |
| **Content area** | Padding 16px mobile, 24px desktop. Max-width 640px cho form, 1280px cho dashboard | Tất cả trang |
| **Nút chính (CTA)** | Full-width trên mobile, fixed bottom (sticky). 240px max trên desktop | Mỗi trang có đúng 1 CTA |
| **Disclaimer** | Banner nhỏ phía dưới kết quả: *"Thông tin chỉ mang tính tham khảo"* | Mọi trang kết quả AI |
| **Footer** | Thông tin liên hệ, phiên bản, link chính sách | Tất cả trang |

### 6.2. Nhất quán về tương tác

| Hành động | Pattern thống nhất | Ví dụ |
| --- | --- | --- |
| **Chuyển bước** | Nút CTA ở dưới cùng, màu primary, full-width | "Tiếp tục" → "Kiểm tra ngay" → "Xác nhận hồ sơ" |
| **Quay lại** | Mũi tên ← ở góc trên trái header | Mọi trang đều có |
| **Mở chi tiết** | Accordion/Expandable card | Bấm vào Score card → mở breakdown |
| **Xóa/Đổi** | Icon thùng rác hoặc nút text "Đổi ảnh" | Upload zone |
| **Xác nhận quan trọng** | Modal confirm: *"Bạn chắc chắn muốn xác nhận hồ sơ?"* | Bước cuối cùng |
| **Feedback hệ thống** | Toast notification: góc trên phải, tự ẩn sau 3 giây | Upload thành công, lỗi mạng |

### 6.3. Nhất quán về ngôn ngữ (Tone of Voice)

| Nguyên tắc | ❌ Không dùng | ✅ Dùng |
| --- | --- | --- |
| **Dùng ngôi thứ 2** | *"Hệ thống phát hiện lỗi"* | *"Hồ sơ của bạn thiếu Giấy chứng sinh"* |
| **Hướng dẫn hành động** | *"Lỗi: missing document"* | *"Vui lòng bổ sung Giấy chứng sinh để tăng điểm hồ sơ"* |
| **Tích cực, không đe dọa** | *"Hồ sơ không hợp lệ"* | *"Hồ sơ đạt 72/100 điểm — cần bổ sung 1 giấy tờ nữa"* |
| **Không thuật ngữ IT** | *"OCR confidence thấp"* | *"Ảnh chưa rõ nét, vui lòng chụp lại"* |
| **Không thuật ngữ luật** | *"Vi phạm Điều 16 khoản 2"* | *"Theo Luật Hộ tịch, cần có Giấy chứng sinh — xem chi tiết"* |

---

## 7. Thiết kế dựa trên dữ liệu & nguyên tắc thiết kế

> **Tiêu chí:** *Thiết kế trải nghiệm dựa trên cơ sở dữ liệu (data), các tiêu chuẩn thiết kế (principles).*

### 7.1. Dữ liệu nền tảng cho thiết kế (Data-Driven Design)

| # | Dữ liệu đầu vào | Nguồn | Ảnh hưởng đến thiết kế |
| --- | --- | --- | --- |
| 1 | **30-40% hồ sơ bị trả** do lỗi hình thức | Báo cáo cải cách hành chính | → Thiết kế Score Engine hiển thị rõ ràng, chỉ đúng vị trí lỗi |
| 2 | **85% người dân dùng smartphone** để truy cập DVC | Thống kê Cổng DVC Quốc gia | → Mobile-first design |
| 3 | **Top 5 lỗi phổ biến**: thiếu giấy tờ, sai tên, hết hạn, ảnh mờ, thiếu chữ ký | Khảo sát bộ phận một cửa | → CrossCheck cảnh báo chính xác 5 loại lỗi này |
| 4 | **Thời gian trung bình kiểm tra 1 hồ sơ**: 10-15 phút (thủ công) | Quan sát thực tế | → Target AI kiểm tra < 30 giây |
| 5 | **42% người dùng trên 40 tuổi** | Phân bố tuổi người dùng DVC | → Font ≥ 16px, nút ≥ 48px, ngôn ngữ đơn giản |
| 6 | **Tỷ lệ bỏ dở form online: 27%** | Nghiên cứu UX form chính phủ (GDS UK) | → Giảm số trường nhập tay tối đa, SmartForm auto-fill |

### 7.2. Nguyên tắc thiết kế (Design Principles)

Team GovTrust AI tuân theo **6 nguyên tắc thiết kế** cốt lõi:

#### Nguyên tắc 1: "Rõ ràng hơn thông minh" (Clarity over Cleverness)

Không dùng icon trừu tượng hay hiệu ứng lạ mắt mà người dân không hiểu. Mọi thứ phải đọc là hiểu ngay.

```
❌ Icon biểu đồ trừu tượng → ✅ Số "72/100" to rõ + text "Khá — cần bổ sung"
❌ Animation phức tạp       → ✅ Progress bar đơn giản 5 bước
❌ "Submit"                 → ✅ "Xác nhận hồ sơ"
```

#### Nguyên tắc 2: "Hướng dẫn, không phán xét" (Guide, don't Judge)

AI không nói *"Hồ sơ của bạn sai"*. AI nói *"Hồ sơ đạt 72 điểm — bổ sung Giấy chứng sinh sẽ tăng lên 87 điểm"*.

```
Mọi cảnh báo luôn có 3 phần:
  1. VẤN ĐỀ:   "Ngày sinh trên CCCD khác với Giấy khai sinh"
  2. GIẢI PHÁP: "Vui lòng kiểm tra lại và chụp ảnh rõ hơn"
  3. NGUỒN:     "Theo quy định tại Điều 16, Luật Hộ tịch 2014"
```

#### Nguyên tắc 3: "Ít hơn là nhiều hơn" (Less is More)

Mỗi màn hình chỉ yêu cầu người dùng **1 hành động chính duy nhất**.

```
Trang Upload: Hành động chính = "Chụp / chọn ảnh giấy tờ"
Trang Result: Hành động chính = "Xem điểm hồ sơ"
Trang Form:   Hành động chính = "Kiểm tra form đã điền"
Trang Confirm: Hành động chính = "Xác nhận hồ sơ"
```

#### Nguyên tắc 4: "Minh bạch AI" (AI Transparency)

Người dùng luôn biết **AI đang làm gì, dựa trên cơ sở nào, và giới hạn ở đâu**.

```
- Progress bar real-time: "Đang bóc tách thông tin từ CCCD..."
- Score breakdown: hiển thị từng rule và impact cụ thể
- LawGuard: kèm nguồn + confidence + disclaimer
- KHÔNG BAO GIỜ: nói "AI xác nhận hồ sơ hợp lệ" (chỉ có cơ quan mới được xác nhận)
```

#### Nguyên tắc 5: "An toàn cảm xúc" (Emotional Safety)

Nộp hồ sơ hành chính là trải nghiệm **căng thẳng** với nhiều người dân. Giao diện phải tạo cảm giác an toàn.

```
- Luôn có nút "Quay lại" — không bao giờ kẹt ở 1 bước
- Không dùng countdown/timer gây áp lực
- Dữ liệu xử lý tạm, tự xóa — hiển thị icon khóa + text "Dữ liệu của bạn được bảo vệ"
- Tone nhẹ nhàng, không phán xét, không dùng từ tiêu cực mạnh (sai, lỗi, vi phạm)
```

#### Nguyên tắc 6: "Thiết kế cho trường hợp xấu nhất" (Design for Edge Cases)

```
- Mất mạng giữa chừng   → Lưu cache local, cho retry
- Upload ảnh mờ          → Cảnh báo ngay, gợi ý chụp lại TRƯỚC KHI gọi API
- API VNPT timeout       → Hiển thị "Đang xử lý lâu hơn bình thường, xin đợi..."
- Score = 0              → Không nói "Hồ sơ tệ" mà nói "Cần chuẩn bị thêm, xem hướng dẫn"
- Người dùng không hiểu  → Mỗi bước có icon "?" mở tooltip hướng dẫn
```

### 7.3. Tiêu chuẩn thiết kế tham chiếu

| Tiêu chuẩn | Nguồn | Áp dụng vào GovTrust AI |
| --- | --- | --- |
| **GOV.UK Design System** | Chính phủ Anh | Layout đơn giản, 1 CTA/trang, ngôn ngữ đơn giản |
| **Google Material Design 3** | Google | Component library, color system, elevation |
| **Apple Human Interface Guidelines** | Apple | Touch target ≥ 44px, safe area, typography scale |
| **WCAG 2.1 Level AA** | W3C | Contrast, focus visible, aria labels |
| **Nielsen's 10 Usability Heuristics** | NNGroup | Visibility, feedback, error prevention, consistency |

---

## 8. UX Metrics & Lộ trình tối ưu liên tục

> **Tiêu chí:** *Xây dựng bộ chỉ số đo lường trải nghiệm (UX Metrics) và lộ trình liên tục tối ưu (Plan) khi sản phẩm được đưa ra thị trường.*

### 8.1. Bộ chỉ số UX Metrics

#### Nhóm 1: Hiệu suất hoàn thành (Effectiveness)

| Metric | Mô tả | Cách đo | Mục tiêu MVP | Mục tiêu Pilot |
| --- | --- | --- | --- | --- |
| **Task Completion Rate** | % người dùng hoàn thành luồng kiểm tra hồ sơ đến bước cuối | Số session "CONFIRMED" / Tổng session tạo | ≥ 70% | ≥ 85% |
| **Error Discovery Rate** | % lỗi hồ sơ được AI phát hiện trước khi nộp | Số lỗi phát hiện / Tổng lỗi thực tế (benchmark) | ≥ 80% | ≥ 95% |
| **First-Time Pass Rate** | % người dùng hồ sơ đạt Score ≥ 60 ngay lần đầu | Số session Score≥60 lần đầu / Tổng session | Baseline | Tăng 20% so với baseline |
| **Correction Rate** | % người dùng sửa lỗi thành công sau cảnh báo AI | Số lần score tăng sau sửa / Tổng cảnh báo | ≥ 60% | ≥ 80% |

#### Nhóm 2: Hiệu quả (Efficiency)

| Metric | Mô tả | Cách đo | Mục tiêu MVP | Mục tiêu Pilot |
| --- | --- | --- | --- | --- |
| **Time-to-Result** | Thời gian từ khi upload đến khi xem Score | Timestamp kết quả - timestamp upload | < 10 giây | < 5 giây |
| **Total Task Time** | Thời gian hoàn thành toàn bộ luồng (chọn → xác nhận) | Session duration | < 5 phút | < 3 phút |
| **Tap/Click Count** | Số lần tap/click để hoàn thành luồng | Event tracking (VNPT SmartUX) | ≤ 12 | ≤ 10 |
| **Retry Rate** | % upload phải chụp lại do ảnh mờ | Số retry / Tổng upload | < 20% | < 10% |

#### Nhóm 3: Hài lòng (Satisfaction)

| Metric | Mô tả | Cách đo | Mục tiêu MVP | Mục tiêu Pilot |
| --- | --- | --- | --- | --- |
| **CSAT (Customer Satisfaction)** | Điểm hài lòng 1-5 sao | Pop-up survey cuối luồng: *"Trải nghiệm này hữu ích không?"* | ≥ 3.5/5 | ≥ 4.0/5 |
| **NPS (Net Promoter Score)** | Khả năng giới thiệu (0-10) | Survey: *"Bạn có giới thiệu cho người quen?"* | ≥ 20 | ≥ 40 |
| **SUS (System Usability Scale)** | Điểm usability chuẩn (0-100) | Bộ 10 câu hỏi SUS | ≥ 68 (trên trung bình) | ≥ 75 (tốt) |
| **Abandon Rate** | % người dùng bỏ dở giữa chừng | Session không đến CONFIRMED / Tổng | < 30% | < 15% |

#### Nhóm 4: Kỹ thuật (Technical Performance)

| Metric | Mô tả | Mục tiêu |
| --- | --- | --- |
| **FCP (First Contentful Paint)** | Thời gian hiển thị nội dung đầu tiên | < 1.5 giây |
| **LCP (Largest Contentful Paint)** | Thời gian hiển thị phần tử lớn nhất | < 2.5 giây |
| **CLS (Cumulative Layout Shift)** | Độ giật layout khi tải | < 0.1 |
| **TTI (Time to Interactive)** | Thời gian đến khi tương tác được | < 3 giây |

### 8.2. Công cụ đo lường & Thu thập

| Công cụ | Vai trò | Cách tích hợp |
| --- | --- | --- |
| **VNPT SmartUX** (BTC cung cấp) | Thu thập tương tác người dùng: click, scroll, thời gian ở mỗi trang | Nhúng SDK vào Next.js, ghi nhận session recording và heatmap |
| **Custom Analytics** (InsightMap) | Đo task completion, error rate, score distribution | Log sự kiện ẩn danh vào MongoDB → aggregate cho dashboard |
| **Web Vitals API** (built-in) | Đo FCP, LCP, CLS, TTI | Next.js tích hợp sẵn `next/web-vitals` |
| **CSAT/NPS Survey** | Thu thập feedback chủ quan | Modal popup khi hoàn thành luồng |

### 8.3. Lộ trình tối ưu UX liên tục (Continuous Improvement Plan)

```
                    MVP                    PILOT                   SCALE
                  (Vòng 2)              (1-3 tháng)            (6-12 tháng)
                     │                      │                       │
  ┌──────────────────┼──────────────────────┼───────────────────────┼──────┐
  │                  │                      │                       │      │
  │  MEASURE         │  Thu thập baseline   │  A/B test, heatmap   │ Auto │
  │  (Đo lường)      │  metrics từ demo    │  SmartUX recording   │ ML   │
  │                  │  cases              │  CSAT survey          │ opt  │
  │                  │                      │                       │      │
  │  ANALYZE         │  Xác định top 3     │  Phân tích funnel    │ Pre- │
  │  (Phân tích)     │  pain points        │  drop-off points     │ dict │
  │                  │  từ InsightMap      │  Sentiment analysis  │ ive  │
  │                  │                      │                       │      │
  │  IMPROVE         │  Sửa UI/copy cho    │  Redesign screens    │ Per- │
  │  (Cải tiến)      │  3 pain points      │  có drop-off cao     │ son- │
  │                  │                      │  Thêm guided tour    │ ali- │
  │                  │                      │                       │ ze   │
  │  VALIDATE        │  Chạy demo ≥ 3      │  Usability test      │ Con- │
  │  (Xác nhận)      │  lần ổn định       │  với 5-10 người      │ tin- │
  │                  │                      │  dùng thật           │ uous │
  └──────────────────┼──────────────────────┼───────────────────────┼──────┘
```

| Giai đoạn | Mục tiêu UX | Hoạt động cụ thể | KPI chính |
| --- | --- | --- | --- |
| **MVP (Vòng 2)** | Chứng minh luồng hoạt động, thu thập baseline | Setup SmartUX tracking, chạy 20 demo cases, đo Task Completion Rate và Time-to-Result | TCR ≥ 70%, TTR < 10s |
| **Pilot (1-3 tháng)** | Tối ưu cho nhóm người dùng thật | A/B test giao diện Score (số vs chart), usability test 5-10 người, phân tích heatmap SmartUX | CSAT ≥ 4.0, Abandon < 15% |
| **Scale (3-6 tháng)** | Cá nhân hóa trải nghiệm | UI tự điều chỉnh theo persona (font to hơn cho người lớn tuổi), guided tour cho người mới, notification qua Zalo/OTT | NPS ≥ 40, SUS ≥ 75 |
| **Mature (6-12 tháng)** | Tối ưu tự động bằng dữ liệu | ML dự đoán lỗi phổ biến theo thủ tục → hiển thị proactive warning, personalized checklist | Error Discovery ≥ 95% |

---

## 9. User Flow chi tiết

### 9.1. Luồng Người dân (Citizen Flow) — 5 bước

```
                    ┌─────────────────────┐
                    │   BƯỚC 1: CHỌN      │
                    │   THỦ TỤC           │
                    │                     │
                    │  ┌───────────────┐  │
                    │  │  HoSoBot chat │  │
                    │  │  hoặc danh    │  │
                    │  │  sách thủ tục │  │
                    │  └───────────────┘  │
                    │                     │
                    │  Output: checklist  │
                    │  giấy tờ cần có     │
                    └──────────┬──────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │   BƯỚC 2: UPLOAD    │
                    │   GIẤY TỜ           │
                    │                     │
                    │  Checklist hiện rõ:  │
                    │  ☐ CCCD (bắt buộc)  │
                    │  ☐ Giấy khai sinh   │
                    │  ☐ Sổ hộ khẩu       │
                    │                     │
                    │  [📷 Chụp / Chọn]   │
                    │  Preview + quality  │
                    │  check ngay         │
                    └──────────┬──────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │   BƯỚC 3: KẾT QUẢ  │
                    │   KIỂM TRA          │
                    │                     │
                    │  ┌─────────────┐    │
                    │  │  Score: 72  │    │
                    │  │  Grade: C   │    │
                    │  │  ⚠️ Cần bổ  │    │
                    │  │  sung       │    │
                    │  └─────────────┘    │
                    │                     │
                    │  ┌─ CrossCheck ──┐  │
                    │  │ ✅ Tên: khớp  │  │
                    │  │ ❌ NS: lệch   │  │
                    │  │ ⚠️ Thiếu: GKS │  │
                    │  └───────────────┘  │
                    │                     │
                    │  ┌─ LawGuard ────┐  │
                    │  │ 📋 Điều 16    │  │
                    │  │ Luật Hộ tịch  │  │
                    │  │ Confidence:87%│  │
                    │  └───────────────┘  │
                    └──────────┬──────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │   BƯỚC 4: SMARTFORM │
                    │   (Form tự điền)    │
                    │                     │
                    │  Họ tên: [Nguyễn..] │ ← auto-fill từ OCR
                    │  Ngày sinh: [15/5.] │ ← auto-fill
                    │  Địa chỉ: [123...] │ ← auto-fill
                    │  Tên con: [______] │ ← người dân tự điền
                    │                     │
                    │  Trường thiếu: đánh │
                    │  dấu vàng + gợi ý   │
                    └──────────┬──────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │   BƯỚC 5: XÁC NHẬN │
                    │                     │
                    │  Tóm tắt toàn bộ:   │
                    │  • Score: 72         │
                    │  • Cảnh báo: 2       │
                    │  • Form: 8/10 trường │
                    │                     │
                    │  ☐ Tôi đã kiểm tra  │
                    │                     │
                    │  [  XÁC NHẬN  ]     │
                    │                     │
                    │  📝 Disclaimer:     │
                    │  "Thông tin tham    │
                    │   khảo, quyết định  │
                    │   thuộc cơ quan"    │
                    └─────────────────────┘
```

### 9.2. Luồng Cán bộ (Officer Flow) — 3 màn hình

```
┌──────────────────┐    ┌──────────────────┐    ┌──────────────────┐
│  MÀN HÌNH 1:     │    │  MÀN HÌNH 2:     │    │  MÀN HÌNH 3:     │
│  DANH SÁCH HỒ SƠ │    │  TÁI KIỂM        │    │  INSIGHTMAP      │
│                  │    │  (Gov Re-Check)  │    │  DASHBOARD       │
│  Bảng:           │    │                  │    │                  │
│  ID | Thủ tục |  │    │  Thông tin AI    │    │  ┌────────────┐  │
│     Score | Ưu   │    │  đã kiểm:        │    │  │ Top 5 lỗi  │  │
│     tiên | Trạng │    │  • Score: 72     │    │  │ [bar chart]│  │
│     thái         │    │  • Lỗi: 2       │    │  └────────────┘  │
│                  │    │  • Nguồn luật    │    │                  │
│  Lọc: Ưu tiên A │    │                  │    │  ┌────────────┐  │
│  Sắp xếp: Mới   │    │  Quyết định:     │    │  │ Heatmap    │  │
│  nhất            │    │  ○ Đủ điều kiện  │    │  │ thủ tục×lỗi│  │
│                  │    │  ○ Cần bổ sung   │    │  └────────────┘  │
│  [Xem chi tiết]  │    │  ○ Cần kiểm kỹ  │    │                  │
│                  │    │                  │    │  ┌────────────┐  │
│                  │    │  Ghi chú: [___]  │    │  │ Trend      │  │
│                  │    │  [Xác nhận]      │    │  │ theo tuần  │  │
│                  │    │                  │    │  └────────────┘  │
└──────────────────┘    └──────────────────┘    └──────────────────┘
```

---

## 10. Wireframe Specifications

### 10.1. Trang Kết quả Score (Mobile) — Màn hình quan trọng nhất

```
┌─────────────────────────────────┐
│ ← Quay lại    Kiểm tra hồ sơ   │  ← Header 56px
├─────────────────────────────────┤
│  ● ● ● ◉ ○                     │  ← Progress bar (bước 3/5)
│  Chọn  Upload  KẾT QUẢ  Form  OK│
├─────────────────────────────────┤
│                                 │
│         ┌───────────┐           │
│         │           │           │
│         │    72     │           │  ← Score circle, 48px font
│         │   /100    │           │
│         │           │           │
│         └───────────┘           │
│        ⚠️ KHÁ — CẦN BỔ SUNG    │  ← Grade badge + text
│                                 │
│  ─────────────────────────────  │
│                                 │
│  📋 Chi tiết kiểm tra      ▼   │  ← Expandable section
│  ┌─────────────────────────┐    │
│  │ ✅ Họ tên: khớp giữa    │    │
│  │    CCCD và Hộ khẩu      │    │
│  ├─────────────────────────┤    │
│  │ ❌ Ngày sinh: không khớp│    │  ← Đỏ, icon ❌
│  │    CCCD: 15/05/1990      │    │
│  │    G.Khai sinh: 16/05/90│    │
│  │    → Kiểm tra lại       │    │
│  ├─────────────────────────┤    │
│  │ ⚠️ Thiếu: Giấy chứng   │    │  ← Vàng, icon ⚠️
│  │    sinh (bắt buộc)       │    │
│  │    → Bổ sung để tăng    │    │
│  │      lên ~87 điểm       │    │
│  └─────────────────────────┘    │
│                                 │
│  📜 Căn cứ pháp lý         ▼   │  ← LawGuard section
│  ┌─────────────────────────┐    │
│  │ Điều 16, Luật Hộ tịch   │    │
│  │ 2014: "Người đi đăng ký │    │
│  │ khai sinh cần..."        │    │
│  │ Tin cậy: ████████░░ 87% │    │
│  │ 🔗 Xem nguồn             │    │
│  └─────────────────────────┘    │
│                                 │
│  ℹ️ Thông tin chỉ mang tính   │  ← Disclaimer
│     tham khảo.                  │
│                                 │
│  ┌─────────────────────────┐    │
│  │                         │    │
│  │   XEM FORM TỰ ĐIỀN →   │    │  ← CTA button, primary, full-width
│  │                         │    │
│  └─────────────────────────┘    │
│                                 │
│  🔒 Dữ liệu tự xóa sau 30 phút│  ← Trust signal
└─────────────────────────────────┘
```

### 10.2. Trang Upload (Mobile)

```
┌─────────────────────────────────┐
│ ← Quay lại    Kiểm tra hồ sơ   │
├─────────────────────────────────┤
│  ● ◉ ○ ○ ○                     │
│  Chọn  UPLOAD  Kết quả  Form OK│
├─────────────────────────────────┤
│                                 │
│  Thủ tục: Đăng ký khai sinh    │
│                                 │
│  Cần chuẩn bị:                 │
│                                 │
│  ┌─────────────────────────┐    │
│  │ 📄 CCCD cha/mẹ          │    │
│  │    (bắt buộc)           │    │
│  │                         │    │  ← Upload zone
│  │   ┌─────────────────┐   │    │
│  │   │  📷 Chụp ảnh    │   │    │  ← 48px nút
│  │   │  hoặc chọn file │   │    │
│  │   └─────────────────┘   │    │
│  │                         │    │
│  │  💡 Mặt trước, nằm     │    │  ← Hướng dẫn inline
│  │     ngang, đủ ánh sáng  │    │
│  └─────────────────────────┘    │
│                                 │
│  ┌─────────────────────────┐    │
│  │ 📄 Giấy chứng sinh     │    │
│  │    (bắt buộc)           │    │
│  │                         │    │
│  │   [  ✅ Đã tải lên  ]   │    │  ← Trạng thái uploaded
│  │   cccd_truoc.jpg         │    │
│  │   [Xem] [Đổi ảnh]       │    │
│  └─────────────────────────┘    │
│                                 │
│  ┌─────────────────────────┐    │
│  │ 📄 Giấy ĐK kết hôn    │    │
│  │    (không bắt buộc)     │    │
│  │                         │    │
│  │   [📷 Chụp / Chọn]     │    │
│  └─────────────────────────┘    │
│                                 │
│  ┌─────────────────────────┐    │
│  │                         │    │
│  │    KIỂM TRA NGAY →     │    │
│  │                         │    │
│  └─────────────────────────┘    │
└─────────────────────────────────┘
```

### 10.3. InsightMap Dashboard (Desktop — Cán bộ)

```
┌──────────────────────────────────────────────────────────────────────────┐
│  🏛️ GovTrust AI        │ Dashboard │ Tái kiểm │ Hồ sơ │  👤 Anh Tuấn  │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────┐          │
│  │ Tổng hồ sơ │ │ Điểm TB    │ │ Tỷ lệ đạt  │ │ Lỗi phổ    │          │
│  │    142     │ │   68/100   │ │   62%      │ │ biến nhất  │          │
│  │  ↑12% tuần│ │  ↑5 điểm  │ │  ↑8%       │ │ Thiếu GKS  │          │
│  └────────────┘ └────────────┘ └────────────┘ └────────────┘          │
│                                                                         │
│  ┌──────────────────────────────┐ ┌──────────────────────────────────┐ │
│  │  TOP 5 LỖI PHỔ BIẾN          │ │  PHÂN BỐ SCORE                    │ │
│  │                              │ │                                  │ │
│  │  Thiếu giấy tờ    ████ 32%  │ │  A (90+)  ██░░░░░░░░ 15%        │ │
│  │  Sai thông tin     ███░ 20% │ │  B (75-89) ████░░░░░░ 25%       │ │
│  │  Hết hạn           ██░░ 15% │ │  C (60-74) ██████░░░░ 35%       │ │
│  │  Ảnh mờ            █░░░ 10% │ │  D (<60)   █████░░░░░ 25%       │ │
│  │  Thiếu chữ ký      █░░░  8% │ │                                  │ │
│  └──────────────────────────────┘ └──────────────────────────────────┘ │
│                                                                         │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │  HEATMAP: THỦ TỤC × LOẠI LỖI                                     │  │
│  │                                                                  │  │
│  │              Thiếu GT  Sai TT   Hết hạn   Ảnh mờ   Thiếu CK    │  │
│  │  Khai sinh   ████🔴    ██🟡     █░🟢      ██🟡     █░🟢        │  │
│  │  Cư trú      ██🟡      ████🔴   ███🔴     █░🟢     █░🟢        │  │
│  │  Chứng thực  █░🟢      ██🟡     █░🟢      ███🔴    ██🟡        │  │
│  │  Cấp đổi     ███🔴     █░🟢     ██🟡      ██🟡     █░🟢        │  │
│  │  HKD          ██🟡      ██🟡     █░🟢      █░🟢     ████🔴      │  │
│  │                                                                  │  │
│  │  🔴 > 25%    🟡 10-25%    🟢 < 10%                               │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                         │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │  XU HƯỚNG THEO TUẦN (4 tuần gần nhất)                            │  │
│  │                                                                  │  │
│  │  Score TB  ──── ──── ──── ────                                   │  │
│  │  Tỷ lệ đạt ---- ---- ---- ----                                  │  │
│  │  Số hồ sơ  ···· ···· ···· ····                                   │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                         │
│  📊 Lọc: [Tất cả thủ tục ▼]  [30 ngày gần nhất ▼]  [Xuất báo cáo]   │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## 11. Design System & Component Library

### Danh sách Components cần phát triển

| Component | Mô tả | Props chính | Dùng ở đâu |
| --- | --- | --- | --- |
| `<ProgressBar />` | Thanh tiến trình 5 bước, highlight bước hiện tại | `currentStep`, `totalSteps`, `labels` | Mọi trang luồng người dân |
| `<ScoreCircle />` | Vòng tròn hiển thị điểm 0-100 với animation + gradient màu | `score`, `grade`, `size` | Trang kết quả |
| `<ScoreBreakdown />` | Danh sách accordion các rule + impact | `breakdown[]` | Trang kết quả |
| `<UploadZone />` | Vùng upload drag&drop / chụp ảnh, có preview + quality check | `label`, `required`, `accept`, `onUpload` | Trang upload |
| `<QualityBadge />` | Badge hiển thị chất lượng ảnh (Tốt/Mờ/Tối) | `quality`, `reason` | Trang upload |
| `<CrossCheckRow />` | 1 hàng kết quả đối chiếu: field + giá trị + status icon | `field`, `values[]`, `status` | Trang kết quả |
| `<LawCitation />` | Card hiển thị căn cứ pháp lý + confidence bar + link nguồn | `source`, `confidence`, `content` | Trang kết quả |
| `<ConfidenceBar />` | Thanh ngang hiển thị % tin cậy (xanh→vàng→đỏ) | `value` (0-100) | LawGuard section |
| `<Disclaimer />` | Banner cố định: "Thông tin chỉ mang tính tham khảo" | `text` | Mọi trang kết quả AI |
| `<SmartFormField />` | 1 trường form với source badge (auto-fill vs manual) | `label`, `value`, `source`, `editable` | Trang SmartForm |
| `<TrustSignal />` | Badge nhỏ: 🔒 icon + "Dữ liệu tự xóa sau 30 phút" | `message` | Footer mọi trang |
| `<HoSoBotWidget />` | Chat bubble floating ở góc phải dưới | `isOpen`, `onSend` | Trang chọn thủ tục |
| `<PriorityBadge />` | Badge ưu tiên A/B/C/D với màu tương ứng | `level` | Dashboard cán bộ |
| `<HeatMapChart />` | Bảng heatmap thủ tục × loại lỗi | `data[][]`, `xLabels`, `yLabels` | InsightMap |
| `<TopErrorsChart />` | Bar chart ngang top lỗi phổ biến | `errors[]` | InsightMap |
| `<TrendLineChart />` | Biểu đồ đường xu hướng theo tuần | `series[]`, `timeRange` | InsightMap |
| `<FilterBar />` | Thanh lọc: thủ tục, thời gian, xuất báo cáo | `filters[]`, `onFilter` | InsightMap |

### Spacing & Grid

```
Spacing scale (4px base):
  xs:   4px
  sm:   8px
  md:   16px
  lg:   24px
  xl:   32px
  2xl:  48px

Mobile grid:     1 cột, padding 16px
Tablet grid:     2 cột, gap 16px, padding 24px
Desktop grid:    12 cột, gap 24px, max-width 1280px
Dashboard grid:  2-3 cột cho cards, full-width cho charts
```

### Shadow & Border Radius

```
Elevation:
  card:     0 1px 3px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.06)
  dropdown: 0 4px 6px rgba(0,0,0,0.1)
  modal:    0 20px 25px rgba(0,0,0,0.15)

Border radius:
  button:   8px
  card:     12px
  input:    8px
  badge:    9999px (pill)
  modal:    16px
```

---

> **Tài liệu này là cơ sở để team Frontend phát triển giao diện bám sát 8 tiêu chí UX (20 điểm).**
> Mỗi tiêu chí đã có giải pháp cụ thể, metric đo lường và bằng chứng cần đưa vào báo cáo.

*GovTrust AI — Tài liệu thiết kế UX/UI v1.0, Vietnamese Student HackAIthon 2026.*
