# GovTrust AI — Business Requirements Specification (BRS)

> **Dự án:** GovTrust AI — Lớp tiền kiểm hồ sơ dịch vụ công
> **Cuộc thi:** Vietnamese Student HackAIthon 2026 — Bảng B (Challenger)
> **Phiên bản:** 1.0
> **Ngày:** 29/06/2026
> **Nguồn tham chiếu:** `Gov_Trust.md`, `nội dung.md`, `docs/Tong_Quan.md`

---

## 1. Mục đích tài liệu

Tài liệu BRS xác định **yêu cầu nghiệp vụ** (góc nhìn doanh nghiệp/người dùng/cơ quan) cho hệ thống GovTrust AI: vấn đề cần giải quyết, các bên liên quan, mục tiêu kinh doanh, phạm vi sản phẩm, yêu cầu nghiệp vụ cấp cao, chiến lược thị trường và tiêu chí thành công. BRS trả lời câu hỏi **"Vì sao xây dựng và cần đạt được điều gì?"**, làm cơ sở cho tài liệu SRS (xem `docs/SRS.md`) trả lời **"Xây dựng như thế nào?"**.

---

## 2. Bối cảnh & Vấn đề nghiệp vụ

### 2.1. Bối cảnh
Việt Nam đang chuyển mạnh sang Chính phủ số, dịch vụ công trực tuyến qua Cổng Dịch vụ công Quốc gia (DVCQG). Hạ tầng hiện tập trung vào khâu **nộp – theo dõi – thanh toán** hồ sơ. Tuy nhiên, việc đưa thủ tục lên môi trường số không đồng nghĩa người dân đã đủ năng lực **chuẩn bị hồ sơ đúng ngay từ đầu**.

### 2.2. Vấn đề cốt lõi
Tồn tại một **khoảng trống ở khâu trước khi nộp**: người dân thiếu công cụ tự kiểm tra mức độ sẵn sàng của hồ sơ, còn cơ quan nhà nước thiếu lớp dữ liệu phản hồi có cấu trúc để nhận diện lỗi lặp lại và điểm nghẽn quy trình.

### 2.3. Pain point chính (BR-PP)

| Mã | Pain point | Đối tượng | Hậu quả |
|---|---|---|---|
| BR-PP-01 | Không biết hồ sơ đã đủ, rõ ảnh, đúng biểu mẫu, khớp thông tin trước khi nộp | Người dân, DN nhỏ | Hồ sơ bị yêu cầu bổ sung, sửa nhiều lần |
| BR-PP-02 | Checklist hành chính khó hiểu, nhiều ngoại lệ | Người dân ít làm thủ tục | Chuẩn bị nhầm giấy tờ, dùng sai biểu mẫu |
| BR-PP-03 | Phải nhập lại nhiều thông tin đã có trên giấy tờ | Người dân, DN nhỏ | Tốn thời gian, sai trường định danh |
| BR-PP-04 | Cán bộ kiểm tra lặp lại các lỗi hình thức giống nhau | Cán bộ một cửa | Tăng tải tiếp nhận, giảm thời gian cho hồ sơ phức tạp |

---

## 3. Định vị sản phẩm

**GovTrust AI là gì:** Lớp **tiền kiểm hồ sơ trước nộp** + lớp **phân tích lỗi sau tiếp nhận**.

**GovTrust AI KHÔNG phải là gì:** Không thay thế Cổng DVCQG, VNeID, nền tảng eKYC, cán bộ tiếp nhận hay quyết định hành chính của cơ quan nhà nước. AI **chỉ cảnh báo tham khảo**, không kết luận pháp lý tuyệt đối; quyết định cuối cùng thuộc người dân/cán bộ/cơ quan có thẩm quyền.

---

## 4. Các bên liên quan (Stakeholders)

| Mã | Stakeholder | Vai trò | Quan tâm chính |
|---|---|---|---|
| ST-01 | Người dân / DN nhỏ | **Người dùng** | Kiểm tra & sửa hồ sơ trước nộp, dễ dùng, miễn phí |
| ST-02 | Cán bộ một cửa | **Người vận hành** | Giảm lỗi cơ học, tái kiểm nhanh, ưu tiên xử lý |
| ST-03 | Cơ quan quản lý (Trung tâm PVHCC, Văn phòng UBND, Sở CĐS) | **Khách hàng/Buyer** | Dashboard điểm nghẽn, dữ liệu cải cách thủ tục |
| ST-04 | Đối tác GovTech (VNPT, đơn vị CĐS) | **Kênh phân phối/đối tác** | Tích hợp module vào hệ sinh thái sẵn có |
| ST-05 | Ban tổ chức / Mentor cuộc thi | Người đánh giá | Tính hoàn thiện, khả thi, tác động, GTM |

---

## 5. Mục tiêu kinh doanh (Business Objectives)

| Mã | Mục tiêu | Đo lường |
|---|---|---|
| BO-01 | Giảm tỷ lệ hồ sơ bị trả về/yêu cầu bổ sung | % hồ sơ phải bổ sung (before/after pilot) |
| BO-02 | Giúp người dân nộp đúng ngay lần đầu | Tỷ lệ lỗi phát hiện trước nộp; tỷ lệ người dùng sửa lỗi |
| BO-03 | Giảm tải kiểm tra lỗi cơ học cho cán bộ | Thời gian kiểm tra sơ bộ/hồ sơ |
| BO-04 | Cung cấp dữ liệu cải cách thủ tục cho cơ quan | Số hướng dẫn/biểu mẫu được chỉnh sửa từ InsightMap |
| BO-05 | Tạo đường ra thị trường GovTech bền vững | Số pilot/đơn vị tích hợp, doanh thu pilot |

---

## 6. Phạm vi (Scope)

### 6.1. Trong phạm vi (MVP)
- **3 thủ tục mẫu** (mở rộng 5–10 ở pilot), nhóm phổ biến, dễ lỗi hình thức: hộ tịch (khai sinh), cư trú, chứng thực, cấp đổi giấy tờ, hộ kinh doanh.
- Luồng tiền kiểm 2 phía: **người dân** (8 bước) + **cơ quan** (3 bước).
- 9 module nghiệp vụ: HoSoBot, Document AI/OCR, CrossCheck, Score Engine, LawGuard, SmartForm, Gov Re-Check, Priority Ranking, InsightMap.
- Web app độc lập, dữ liệu mẫu/giả lập, văn bản pháp luật công khai.

### 6.2. Ngoài phạm vi (Out of Scope — MVP)
- Kết nối CSDL quốc gia về dân cư.
- Tích hợp API chính thức Cổng DVCQG, nộp hồ sơ thật thay người dân.
- Lưu trữ giấy tờ cá nhân thật, dài hạn.
- Kết luận pháp lý tuyệt đối / quyết định hành chính tự động.

---

## 7. Yêu cầu nghiệp vụ cấp cao (Business Requirements — BR)

| Mã | Yêu cầu nghiệp vụ | Ưu tiên |
|---|---|---|
| BR-01 | Người dân chọn được thủ tục và nhận checklist giấy tờ cần chuẩn bị | Must |
| BR-02 | Người dân upload nhiều giấy tờ trong một bộ hồ sơ | Must |
| BR-03 | Hệ thống tự đọc thông tin giấy tờ (OCR), giảm nhập liệu thủ công | Must |
| BR-04 | Hệ thống đối chiếu chéo thông tin giữa các giấy tờ, phát hiện lệch/thiếu/hết hạn | Must |
| BR-05 | Hệ thống chấm điểm hồ sơ 0–100 kèm giải thích lỗi rõ ràng, có thể audit | Must |
| BR-06 | Hệ thống cảnh báo (kèm căn cứ pháp lý công khai) khi yêu cầu giấy tờ có dấu hiệu chưa rõ căn cứ | Must |
| BR-07 | Hệ thống tự điền biểu mẫu từ dữ liệu đã trích xuất | Should |
| BR-08 | Người dân tự kiểm tra, sửa và quyết định nộp (AI không nộp thay) | Must |
| BR-09 | Cán bộ tái kiểm và được gợi ý thứ tự ưu tiên xử lý | Should |
| BR-10 | Cơ quan xem dashboard điểm nghẽn từ dữ liệu lỗi đã ẩn danh | Should |
| BR-11 | Bảo vệ dữ liệu cá nhân: xử lý theo phiên, không lưu giấy tờ dài hạn | Must |
| BR-12 | Mọi cảnh báo AI có disclaimer, giữ con người ở vị trí quyết định cuối | Must |

---

## 8. Quy tắc nghiệp vụ (Business Rules — BRule)

| Mã | Quy tắc |
|---|---|
| BRule-01 | Điểm hồ sơ tính theo công thức rule-based có trọng số, không do LLM phán quyết |
| BRule-02 | Hồ sơ chỉ ở trạng thái "có thể nộp" khi điểm ≥ ngưỡng (vd 60–80) và không có lỗi nghiêm trọng (CRITICAL) |
| BRule-03 | LawGuard chỉ hiển thị cảnh báo khi độ tin cậy đủ; nếu căn cứ yếu → trạng thái "cần kiểm tra thêm" |
| BRule-04 | Mọi cảnh báo pháp lý phải kèm nguồn (văn bản, điều/khoản) + mức tin cậy |
| BRule-05 | Ảnh giấy tờ gốc tự xóa sau phiên; chỉ giữ metadata lỗi đã ẩn danh |
| BRule-06 | InsightMap không chứa PII (tên, số CCCD, ảnh, địa chỉ) |
| BRule-07 | Phân quyền: người dân chỉ xem hồ sơ của mình; cán bộ xem hồ sơ CONFIRMED + insight |

---

## 9. Chiến lược Go-to-Market (GTM)

### 9.1. Phân khúc & vai trò mua
| Vai trò | Đối tượng |
|---|---|
| Người dùng | Người dân, DN nhỏ |
| Người vận hành | Cán bộ một cửa |
| Người trả tiền/quyết định | Trung tâm PVHCC, Văn phòng UBND, Sở CĐS, đối tác GovTech/VNPT |

### 9.2. Mô hình doanh thu
| Mô hình | Ai trả | Đơn vị tính phí |
|---|---|---|
| Freemium công dân | Không thu phí | Miễn phí chấm điểm, giải thích lỗi, cảnh báo |
| Pilot/POC B2G | Trung tâm PVHCC / Văn phòng UBND / tài trợ | Gói 3 tháng, 5–10 thủ tục |
| SaaS B2G | Cơ quan cấp tỉnh | Thuê bao năm theo số thủ tục, lưu lượng, SLA |
| White-label B2B2G | VNPT/đối tác | License / phí tích hợp / revenue share |
| Phí theo hồ sơ/API | Đối tác/cơ quan lớn | Theo bậc thang, có trần chi phí |

### 9.3. Định giá tham chiếu
- Ngân sách pilot tham chiếu: **60–100 triệu đồng / 3 tháng** (mô hình chi phí, không phải giá niêm yết).
- Doanh thu năm đầu: thận trọng 0–60tr · cơ sở ~80tr · tích cực ~200tr.

### 9.4. Quy mô thị trường (tham chiếu, từ Gov_Trust.md)
- **TAM hồ sơ:** 36,8 triệu hồ sơ trực tuyến/năm (2023); dải kiểm tra 36,8–40,8 triệu.
- **SAM:** 5–15% TAM (5–10 thủ tục tần suất cao) → 1,84–5,52 triệu hồ sơ/năm.
- **SOM năm đầu:** 600 / 3.600 / 10.800 hồ sơ (3 kịch bản pilot).
- **TAM B2G:** 51 đầu mối mua/điều phối (17 TW + 34 tỉnh); SAM 34 Trung tâm PVHCC.

> Các con số là **tham chiếu/giả định kế hoạch**, không phải kết quả đã đo.

---

## 10. Tiêu chí thành công & KPI

| Mã | KPI (mục tiêu pilot) | Nhóm hưởng lợi |
|---|---|---|
| KPI-01 | Tỷ lệ lỗi được phát hiện trước nộp | Người dân |
| KPI-02 | Tỷ lệ người dùng sửa lỗi sau cảnh báo (mục tiêu ≥50%) | Người dân |
| KPI-03 | Tỷ lệ hoàn tất kiểm tra sau khi upload (mục tiêu ≥60%) | Người dân |
| KPI-04 | Thời gian kiểm tra sơ bộ/hồ sơ giảm | Cán bộ |
| KPI-05 | Tỷ lệ hồ sơ phải bổ sung vòng đầu giảm so với baseline | Cơ quan |
| KPI-06 | Số hướng dẫn/biểu mẫu được cải tiến từ InsightMap | Cơ quan |
| KPI-07 | CSAT/NPS người dùng | Người dân |
| KPI-08 | Số đơn vị tích hợp / hồ sơ qua API | Đối tác |

---

## 11. Lộ trình triển khai (12 tháng)

| Giai đoạn | Thời gian | Mục tiêu kinh doanh |
|---|---|---|
| Vòng 1 | Trước proposal | Chứng minh pain-point & khác biệt LawGuard + InsightMap |
| Vòng 2 — MVP | 2–4 tuần | Web demo 3 thủ tục, thu feedback mentor |
| Pilot nhỏ | 1–3 tháng sau thi | Mở rộng 5–10 thủ tục, đo before/after |
| B2G/B2B2G | 3–6 tháng | Dashboard nâng cấp, hợp tác qua VNPT/đơn vị CĐS |
| Scale | 6–12 tháng | SaaS/white-label, multi-tenant, marketplace template |

---

## 12. Giả định, Phụ thuộc & Rủi ro

### 12.1. Giả định
- Có giấy tờ mẫu/giả lập và văn bản pháp luật công khai để mô phỏng.
- API VNPT (OCR/eKYC/SmartBot) được cấp quota hoặc dùng phương án thay thế.

### 12.2. Phụ thuộc
- Quota/quyền truy cập API VNPT trong cuộc thi.
- Hạ tầng cloud chi phí thấp cho demo public.

### 12.3. Rủi ro nghiệp vụ
| Mã | Rủi ro | Giảm thiểu |
|---|---|---|
| RR-01 | RAG pháp lý trả căn cứ sai → rủi ro niềm tin | Dẫn nguồn, version văn bản, human review, disclaimer |
| RR-02 | Dữ liệu cá nhân nhạy cảm → rủi ro tuân thủ | Tối thiểu hóa dữ liệu, xóa file, ẩn danh log, RBAC |
| RR-03 | Chu kỳ mua sắm B2G dài | Bắt đầu bằng pilot, xác định buyer & ngân sách sớm |
| RR-04 | Chi phí API tăng khi scale | Cache, mô hình phân tầng, giới hạn API |
| RR-05 | Người dùng bỏ dở giữa luồng | Đơn giản hóa bước, progress bar, mock fallback |

---

## 13. Ràng buộc pháp lý
Tuân thủ định hướng các văn bản công khai: Nghị định 13/2023/NĐ-CP (bảo vệ dữ liệu cá nhân), Luật Giao dịch điện tử 2023, Nghị định 45/2020/NĐ-CP, Nghị định 118/2025/NĐ-CP, Luật An toàn thông tin mạng 2015, Luật An ninh mạng 2018, Nghị định 53/2022/NĐ-CP.

---

## 14. Truy vết sang SRS
Các yêu cầu nghiệp vụ (BR-01…BR-12) được hiện thực hóa bởi các yêu cầu chức năng (FR) trong `docs/SRS.md` — xem **bảng truy vết (traceability matrix)** ở mục cuối SRS.
