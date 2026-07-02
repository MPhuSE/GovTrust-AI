# GovTrust AI — Báo cáo Vòng 2
### Vietnamese Student HackAIthon 2026 | Bảng B — Challenger

> Tài liệu này tổng hợp và hợp nhất 3 nguồn: (1) yêu cầu/tiêu chí chính thức Vòng 2, (2) phân tích Go-to-market & vai trò đối tác ngân hàng, (3) danh mục nội dung cần có trong báo cáo. Mục tiêu là tạo ra một bản báo cáo khung hoàn chỉnh, bám sát thể lệ và sẵn sàng để nhóm điền chi tiết/minh chứng (demo, ảnh, log...).

---

## Mục lục

0. [Thông tin Vòng 2 và tiêu chí chấm điểm](#0-thông-tin-vòng-2-và-tiêu-chí-chấm-điểm)
1. [Tóm tắt sản phẩm](#1-tóm-tắt-sản-phẩm)
2. [Code / MVP đã build](#2-code--mvp-đã-build)
3. [Kiến trúc & Pipeline kỹ thuật](#3-kiến-trúc--pipeline-kỹ-thuật)
4. [Bảo mật & Pháp lý](#4-bảo-mật--pháp-lý)
5. [UX & Test người dùng](#5-ux--test-người-dùng)
6. [Triển khai & Mở rộng kỹ thuật](#6-triển-khai--mở-rộng-kỹ-thuật)
7. [Go-to-market](#7-go-to-market)
8. [Đối tác ngân hàng / bên thứ ba trong GTM](#8-đối-tác-ngân-hàng--bên-thứ-ba-trong-gtm)
9. [Kết luận & Tính nâng cấp](#9-kết-luận--tính-nâng-cấp)
10. [Phân công nhóm](#10-phân-công-nhóm)
11. [Checklist cuối trước khi nộp báo cáo](#11-checklist-cuối-trước-khi-nộp-báo-cáo)
12. [Tài liệu tham chiếu](#12-tài-liệu-tham-chiếu)

---

## 0. Thông tin Vòng 2 và tiêu chí chấm điểm

**Thời gian:** 26/6 – 03/7/2026.

**Nội dung vòng thi:** Các đội tiếp tục phát triển ý tưởng đã chọn thành sản phẩm MVP có thể trình diễn và kiểm thử. Ban Tổ chức sắp xếp Mentor tư vấn trực tiếp, hỗ trợ đội và cung cấp tài nguyên API để tích hợp module AI. Mentor đánh giá dựa trên hiệu quả làm việc, tính khả thi và hiệu quả sản phẩm để chọn tối đa **06 đội** vào Chung kết.

### Danh sách API được Ban Tổ chức cung cấp

| STT | API cung cấp | Mô tả |
| --- | --- | --- |
| 1 | **VNPT eKYC** | Nền tảng định danh và xác thực điện tử |
| 1.1 | OCR | OCR bóc tách thông tin giấy tờ tùy thân |
| 1.2 | Liveness card / Liveness face / Mask face | Kiểm tra giấy tờ thật giả; kiểm tra khuôn mặt thật giả; kiểm tra khuôn mặt che |
| 1.3 | Compare face | So sánh 2 khuôn mặt |
| 2 | **vnFace** | Nền tảng điểm danh nhận diện khuôn mặt |
| 2.1 | Dịch vụ vnface | Xây dựng/quản lý face, lấy lịch sử check-in, gửi thông báo qua các kênh OTT |
| 3 | **VNPT SmartVoice** | Nền tảng giọng nói thông minh |
| 3.1 | Text to Speech | Chuyển văn bản thành giọng nói |
| 3.2 | Speech to Text | Chuyển giọng nói thành văn bản |
| 3.3 | Tóm tắt cuộc gọi | Tóm tắt nội dung từ các cuộc hội thoại |
| 4 | **VNPT SmartBot** | Nền tảng khởi tạo chatbot AI |
| 4.1 | Dịch vụ SmartBot | Nhận diện ý định và trả lời theo kịch bản |
| 4.2 | Dịch vụ SmartBot nâng cao | Hỏi đáp dùng LLM |
| 5 | **VNPT SmartReader** | Nền tảng xử lý văn bản thông minh |
| 5.1 | OCR | Nhận dạng ký tự quang học |
| 5.2 | Bóc tách thông tin | Bóc tách thông tin từ văn bản/giấy tờ |
| 6 | **vnSocial** | Nền tảng lắng nghe mạng xã hội |
| 6.1 | Tài khoản | Lấy thông tin trending trên MXH |
| 6.2 | Phân tích cảm xúc | Phân tích cảm xúc trong bình luận, bài đăng |
| 7 | **VNPT SmartUX** | Nền tảng tăng trải nghiệm người dùng UI/UX |
| 7.1 | Dịch vụ SmartUX | Thu thập và trực quan hóa tương tác người dùng trên web/app tích hợp |
| 8 | **VNPT SmartVision** | Nền tảng nhận diện và xử lý hình ảnh |
| 8.1 | Phát hiện người | Phát hiện người trong khung hình/video |
| 8.2 | Phát hiện biển số, phương tiện | Phát hiện biển số xe và phương tiện giao thông |
| 8.3 | Nhận diện khuôn mặt | Nhận diện/phát hiện khuôn mặt trong khung hình, video |

### Tiêu chí đánh giá Vòng 2 (thang 100 điểm)

| Nhóm tiêu chí | Mô tả | Điểm |
| --- | --- | --- |
| 1. Hoàn thiện sản phẩm | Demo MVP; repo + hướng dẫn cài đặt 1-lệnh; script test tự động/pass; ổn định (chạy ≥ 3 lần không lỗi); đảm bảo an toàn thông tin và bảo mật dữ liệu | 20 |
| 2. Trải nghiệm người dùng | Xác định đúng đối tượng mục tiêu; đáp ứng nhu cầu chính; hoạt động trên thiết bị ưu tiên; tối ưu thao tác và UI/accessibility; nhất quán; thiết kế dựa trên dữ liệu/nguyên tắc thiết kế; có UX metrics và lộ trình tối ưu liên tục | 20 |
| 3. Khả năng triển khai và mở rộng | Tối ưu trên hạ tầng; phương án tăng cường khi mở rộng quy mô | 20 |
| 4. Chiến lược Go-to-market | Phân khúc khách hàng và mô hình doanh thu; chiến lược định giá/doanh thu/chi phí trên mỗi đơn vị; kênh phân phối/đối tác/alliances; chiến thuật truyền thông; lộ trình mở rộng 12 tháng | 25 |
| 5. Tính nâng cấp | Cải tiến so với bản mô tả Vòng 1; phản hồi mentor được áp dụng; bổ sung tính năng phụ hữu ích | 10 |

> *Nguồn: Thể lệ Cuộc thi Vietnamese Student HackAIthon 2026.*

---

## 1. Tóm tắt sản phẩm

**Phạm vi áp dụng:** GovTrust AI — hệ thống hỗ trợ tiền kiểm hồ sơ dịch vụ công, gồm các module **HoSoBot, Document AI/OCR, CrossCheck, Score Engine, LawGuard, SmartForm, Gov Re-Check, Priority Ranking và InsightMap**.

**Định vị:** GovTrust AI là **lớp tiền kiểm hồ sơ trước khi nộp** và **lớp phân tích lỗi sau tiếp nhận**, bổ sung — không thay thế — Cổng Dịch vụ công Quốc gia, VNeID, nền tảng eKYC hay quyết định hành chính của cán bộ.

- AI chỉ đưa ra điểm hồ sơ, cảnh báo, căn cứ tham khảo và gợi ý sửa lỗi để người dân/cán bộ tự xác nhận — **không tự ra quyết định hành chính**.
- Vấn đề cốt lõi không phải là thiếu cổng nộp hồ sơ trực tuyến, mà là khoảng trống giữa hướng dẫn thủ tục và năng lực chuẩn bị hồ sơ đúng ngay từ đầu.

**Bằng chứng cần đưa vào báo cáo:** 1 sơ đồ hành trình trước–sau khi có GovTrust AI; 3 pain-point chính của người dân khi chuẩn bị hồ sơ.

---

## 2. Code / MVP đã build

**Mục tiêu:** chứng minh có sản phẩm chạy được.

### 2.1. Checklist nội dung Code/MVP cần viết trong báo cáo

| Nhóm nội dung | Cần viết cụ thể | Mức tối thiểu để đạt | Mức nên có để nổi bật | Tiêu chí liên quan |
| --- | --- | --- | --- | --- |
| Demo MVP | Luồng: chọn thủ tục → upload giấy tờ → OCR → CrossCheck → Score → LawGuard → SmartForm → xác nhận hồ sơ | Web demo chạy được với dữ liệu mẫu | 10 thủ tục mẫu, nhiều test case đủ/thiếu/sai, có progress bar và giải thích kết quả rõ | Hoàn thiện sản phẩm, UX |
| Repo code | Cấu trúc repo, các app/service, cách chạy local, biến môi trường, file seed data | Có README hướng dẫn cài đặt | Script 1 lệnh (`docker compose up` hoặc `pnpm install + pnpm dev`); tích hợp và gọi thành công API VNPT thật | Hoàn thiện sản phẩm |
| Backend/API | Các endpoint: procedures, upload, ocr, crosscheck, score, lawguard, smartform, gov-recheck, priority, insights | Endpoint chính hoạt động với dữ liệu mẫu | Có OpenAPI/Swagger hoặc bảng contract input–output rõ ràng | Hoàn thiện sản phẩm, triển khai |
| AI modules | SmartReader/OCR, CrossCheck, Score Engine, LawGuard RAG, InsightMap | Có mô tả input–output từng module | Nêu rõ việc tích hợp và sử dụng trực tiếp API VNPT thật vào luồng xử lý | Hoàn thiện sản phẩm, khả năng triển khai |
| Rule/Score Engine | Công thức chấm 0–100: thiếu giấy tờ, ảnh mờ, mismatch, hết hạn, độ tin cậy OCR | Có điểm số và lý do lỗi | Có trọng số có thể audit và tùy chỉnh theo thủ tục | Hoàn thiện sản phẩm |
| LawGuard/RAG | Cách chunk văn bản, embedding, truy xuất căn cứ, hiển thị nguồn và confidence | Có cảnh báo tham khảo, không kết luận pháp lý tuyệt đối | Có benchmark Context Precision/Recall/Faithfulness và human review | Bảo mật/pháp lý, triển khai |
| InsightMap | Tổng hợp log lỗi ẩn danh theo thủ tục, loại lỗi, giấy tờ, thời điểm | Có dashboard top lỗi và tỷ lệ score | Có heatmap điểm nghẽn, xu hướng theo tuần/tháng, đề xuất cải tiến thủ tục | GTM, tác động xã hội |
| Test tự động | Unit test rule engine, integration test API, demo cases cho 20 hồ sơ mẫu | Có test pass cho luồng chính | Checklist chạy demo ≥ 3 lần ổn định và test case lỗi biên | Hoàn thiện sản phẩm |

### 2.2. Cấu trúc repository đề xuất

> Báo cáo không cần dán toàn bộ code — chỉ trình bày cấu trúc repo, logic module và minh chứng sản phẩm chạy được. Code chi tiết để trong GitHub.

| Thành phần repo | Vai trò | File/thư mục nên có | Nội dung cần giải thích trong báo cáo |
| --- | --- | --- | --- |
| `web` | Citizen App + dashboard InsightMap | src/app, components, upload, result, smartform, dashboard | Giao diện người dân và cơ quan; luồng UX; trạng thái loading/progress |
| `apps/api-gateway` | NestJS — Edge công khai | auth-verify (verify JWT), proxy (route → core-svc), health | Tầng biên: verify JWT, RBAC, rate-limit, CORS, định tuyến request |
| `apps/core-svc` | NestJS — Business + Orchestrator | auth, procedures, document-types, documents, sessions, scoring, smartform, recheck, priority, insights | Sở hữu MongoDB; cấp JWT; điều phối pipeline; gọi ai-svc qua gRPC + BullMQ |
| `apps/ai-svc` | FastAPI/Python — AI service | services: ocr, hosobot, rag, hybrid_search, embedding, llm; grpc_server | Sở hữu Qdrant; OCR (VNPT eKYC + mock fallback), HoSoBot, LawGuard/hybrid RAG, embedding |
| `packages/rule-engine` | CrossCheck + Score Engine (TS thuần) | rules, weights, validators, __tests__ | Vì sao dùng rule-based để audit được, tránh LLM phán quyết khó kiểm soát |
| `packages/proto` | Shared gRPC contract | ai_service.proto (package govtrust.ai) | Hợp đồng gRPC dùng chung giữa core-svc và ai-svc, tránh lệch version |
| `data/procedures` | Template thủ tục | procedure.json, checklist, formFields, legalSourceIds | Cách mở rộng thêm thủ tục mới bằng template thay vì sửa code lõi |
| `data/legal-sources` | Nguồn luật công khai | chunks, metadata, embeddings | Nguồn, ngày truy cập, versioning, căn cứ cho LawGuard |
| `tests` | Bộ kiểm thử | unit, integration, contract, rag-evaluation, demo-cases | Bảng test case: hồ sơ đủ, thiếu, sai thông tin, hết hạn, ảnh mờ, yêu cầu chưa rõ căn cứ |
| `infra` | Triển khai | docker-compose, redis, qdrant, env.example | Cách chạy local/public demo, queue, cache, database per service |

---

## 3. Kiến trúc & Pipeline kỹ thuật

**Mục tiêu:** chứng minh giải pháp có nền tảng kỹ thuật rõ ràng — kiến trúc 4 service (web, api-gateway, core-svc, ai-svc), gRPC + Redis Queue/BullMQ, MongoDB, Qdrant, tích hợp trực tiếp API VNPT.

### 3.1. Pipeline kỹ thuật chi tiết (11 bước)

| Bước | Input | Xử lý | Output | Bằng chứng demo |
| --- | --- | --- | --- | --- |
| 1. Chọn thủ tục | Nhu cầu người dân | HoSoBot nhận diện thủ tục phù hợp | ProcedureTemplate | Màn chọn thủ tục + template |
| 2. Upload giấy tờ | Ảnh/PDF mẫu | Kiểm tra định dạng, chất lượng ảnh | Document Session | Upload thành công/thất bại |
| 3. OCR | Document Session | API VNPT SmartReader/eKYC OCR trích xuất field | ExtractedFields + confidence | Bảng field trích xuất |
| 4. CrossCheck | Nhiều ExtractedFields | So khớp họ tên, ngày sinh, địa chỉ, số giấy tờ, hạn giấy tờ | Mismatch/missing/expired flags | Cảnh báo vị trí lỗi |
| 5. Score | CrossCheck + template | Rule-based scoring theo trọng số | Score 0–100 + lý do | Kết quả điểm hồ sơ |
| 6. LawGuard | Checklist + legal KB | RAG truy xuất văn bản công khai và so sánh yêu cầu | Cảnh báo có dấu hiệu chưa rõ căn cứ | Căn cứ + confidence + disclaimer |
| 7. SmartForm | ExtractedFields + formFields | Map dữ liệu vào form mẫu | Form đã tự điền | Form preview, trường thiếu |
| 8. Người dân xác nhận | Form + cảnh báo | Người dân kiểm tra/sửa và quyết định nộp hồ sơ | Hồ sơ đã xác nhận | Nút xác nhận và trạng thái |
| 9. Gov Re-Check | Hồ sơ đã xác nhận | AI tái kiểm góc nhìn cơ quan: phát hiện **rủi ro/dấu hiệu bất thường** (khác Score b5 cho dân) | completenessLevel + **riskFlags** (nghi sửa ảnh, lệch tên đa giấy) | Màn cơ quan |
| 10. Priority Ranking | Re-check + **hạn xử lý (SLA)** + mức độ cấp bách | Xếp **hồ sơ nào xử trước** trong hàng đợi (có yếu tố thời gian — khác Score) | Priority A/B/C/D + slaDeadline + lý do | Dashboard cán bộ |
| 11. InsightMap | Log lỗi ẩn danh | Aggregate theo thủ tục, loại lỗi, giấy tờ, thời điểm | Dashboard điểm nghẽn | Chart top lỗi, heatmap |

### 3.2. Kiến trúc hệ thống (tham chiếu)

- **Citizen App (web):** Next.js — giao diện người dân + dashboard cán bộ (chọn thủ tục, upload, xem score, xem form tự điền).
- **api-gateway:** NestJS — tầng biên công khai: verify JWT, RBAC, rate-limit, CORS, định tuyến request → core-svc.
- **core-svc:** NestJS — business + orchestrator pipeline; sở hữu MongoDB; cấp JWT. Giao tiếp với ai-svc qua **gRPC** (đồng bộ, tác vụ nhanh) và **Redis Queue/BullMQ** (bất đồng bộ, tác vụ AI nặng).
- **ai-svc:** FastAPI/Python — sở hữu Qdrant; OCR (VNPT eKYC/SmartReader + mock fallback), HoSoBot, LawGuard/hybrid RAG, embedding; chạy đồng thời REST + gRPC server.
- **Document AI:** ai-svc tích hợp VNPT SmartReader/eKYC OCR; CrossCheck nằm ở core-svc (module scoring, dùng `packages/rule-engine`).
- **Decision Layer:** Score Engine + Rule Engine trong core-svc (audit được, tránh LLM phán quyết khó kiểm soát).
- **Legal AI:** LawGuard + hybrid RAG (Qdrant dense + BM25) trên collection `legal_chunks`.
- **Form Engine:** SmartForm (module core-svc).
- **Analytics:** InsightMap — module trong core-svc, dùng collection `insight_logs`.
- **Data Layer:** MongoDB (nghiệp vụ, core-svc sở hữu) + Qdrant (AI, ai-svc sở hữu) — theo nguyên tắc **Database per Service**, không truy cập chéo trực tiếp.

---

## 4. Bảo mật & Pháp lý

**Mục tiêu:** giảm rủi ro dữ liệu hành chính — không lưu giấy tờ dài hạn, xử lý theo phiên, metadata ẩn danh, AI chỉ cảnh báo tham khảo.

| Rủi ro | Cách xử lý trong MVP | Câu nên viết trong báo cáo | Bằng chứng |
| --- | --- | --- | --- |
| Dữ liệu cá nhân nhạy cảm | Chỉ xử lý theo phiên, không lưu ảnh giấy tờ gốc dài hạn, xóa file sau khi kiểm tra | MVP không sử dụng CSDL dân cư, không yêu cầu hồ sơ thật từ cơ quan nhà nước | Sơ đồ data flow, TTL, policy xóa file |
| AI trả lời sai luật | LawGuard chỉ cảnh báo tham khảo, luôn hiển thị nguồn, confidence và trạng thái cần kiểm tra thêm nếu nguồn yếu | AI không phán quyết hồ sơ hợp pháp/không hợp pháp; quyết định cuối cùng thuộc người dân/cán bộ/cơ quan | Benchmark RAG, human review, disclaimer |
| Lộ API key | Dùng biến môi trường, không commit key, có `.env.example` | API key được quản lý riêng, repo không chứa secret | Secret scan, screenshot `.env.example` |
| Truy cập dashboard trái phép | Role-based access demo, tài khoản admin riêng, không công khai dữ liệu nhạy cảm | Dashboard chỉ dùng metadata ẩn danh, phục vụ phân tích điểm nghẽn | Demo RBAC, dữ liệu mẫu |
| Prompt injection / RAG injection | Sanitize input, tách nguồn luật và dữ liệu người dùng, không cho người dùng ghi vào legal KB | Nguồn luật được quản lý phiên bản, không bị ghi đè bởi prompt người dùng | Test case tấn công cơ bản |

### Test case và tiêu chí hoàn thành MVP

| Test case | Đầu vào | Kết quả đạt yêu cầu | Metric nên báo cáo |
| --- | --- | --- | --- |
| Hồ sơ đủ | Đủ giấy tờ mẫu, ảnh rõ | Score > 80, trạng thái có thể nộp, form điền đủ trường chính | Accuracy rule, time-to-result |
| Thiếu giấy tờ | Thiếu một thành phần bắt buộc | Score giảm, báo thiếu giấy và gợi ý bổ sung | Recall phát hiện thiếu |
| Sai thông tin | Tên/địa chỉ không khớp giữa hai giấy tờ | CrossCheck cảnh báo mismatch và vị trí lỗi | Mismatch detection |
| Giấy tờ hết hạn | Ngày hết hạn trong quá khứ | Hệ thống báo hết hạn/cần cập nhật | Expired detection |
| Ảnh mờ | Ảnh chất lượng thấp | OCR confidence thấp, yêu cầu upload lại | OCR confidence threshold |
| Yêu cầu chưa rõ căn cứ | Checklist có giấy tờ bổ sung chưa rõ nguồn | LawGuard cảnh báo có dấu hiệu chưa rõ căn cứ, kèm nguồn | Citation accuracy, faithfulness |
| InsightMap | 20–30 hồ sơ demo | Dashboard hiển thị top lỗi, tỷ lệ score, thủ tục hay lỗi | Top error, heatmap, trend |
| Độ trễ pipeline | Luồng đủ 8–11 bước | Frontend có progress bar, không timeout, tích hợp API VNPT mượt mà | Latency trung bình, success rate |

---

## 5. UX & Test người dùng

**Mục tiêu:** chứng minh sản phẩm dễ dùng và đúng đối tượng — persona, user journey, thiết bị ưu tiên, accessibility, UX metric.

**Bằng chứng cần đưa vào:** wireframe, feedback mentor/người dùng, funnel, CSAT/NPS mẫu.

- Bám sát persona: **người dân ít rành công nghệ** và **cán bộ một cửa**.
- Có bộ chỉ số đo lường trải nghiệm (UX Metrics) và lộ trình tối ưu liên tục khi sản phẩm ra thị trường (theo tiêu chí Vòng 2, mục 2).

---

## 6. Triển khai & Mở rộng kỹ thuật

**Mục tiêu:** chứng minh có thể triển khai sau cuộc thi — cloud cost, queue, cache, scale module, roadmap kỹ thuật.

| Giai đoạn | Mục tiêu kỹ thuật | Việc cần làm | Kết quả cần có | Rủi ro cần kiểm soát |
| --- | --- | --- | --- | --- |
| MVP | Demo web app độc lập | 3 thủ tục mẫu, tích hợp API VNPT OCR/SmartReader, Score, SmartForm, LawGuard, InsightMap | Public demo + repo + video + test pass | API chậm, lỗi demo, thiếu test case |
| Giai đoạn 1 | Pilot nhỏ có kiểm soát | Mở rộng 5–10 thủ tục, tăng test case, hoàn thiện bảo mật/xóa dữ liệu | Báo cáo before–after, UX feedback | Dữ liệu không đủ, người dùng bỏ dở |
| Giai đoạn 2 | B2G/B2B2G readiness | Dashboard nâng cấp, phân quyền, API tích hợp, audit log, SLA cơ bản | Bản demo cho đối tác/cơ quan | Chu kỳ mua sắm dài, yêu cầu pháp lý |
| Giai đoạn 3 | Scale SaaS/white-label | Multi-tenant, monitoring, cost control, procedure template marketplace | Gói triển khai theo địa phương/đối tác | Chi phí API tăng, khó chuẩn hóa thủ tục |

---

## 7. Go-to-market

**Mục tiêu:** chứng minh có đường ra thị trường — phân khúc khách hàng, buyer, mô hình doanh thu, định giá, kênh, đối tác, truyền thông.

| Hạng mục GTM | Cần trình bày trong báo cáo | Cách viết phù hợp với GovTrust AI | Bằng chứng/KPI |
| --- | --- | --- | --- |
| Định vị | GovTrust AI là gì và không phải là gì | Không thay thế Cổng DVC/VNeID/eKYC/cán bộ; là lớp tiền kiểm hồ sơ, giải thích lỗi và tạo dashboard điểm nghẽn | One-liner positioning, sơ đồ before/after |
| Người dùng | Ai dùng sản phẩm | Người dân/doanh nghiệp nhỏ dùng để kiểm tra hồ sơ; cán bộ một cửa dùng để tái kiểm; cơ quan quản lý dùng InsightMap | Persona, pain point, user journey |
| Buyer | Ai trả tiền/ra quyết định | Trung tâm Phục vụ hành chính công, Văn phòng UBND, Sở/đơn vị chuyển đổi số, đối tác GovTech/VNPT | Bảng buyer/influencer/user |
| Phân khúc đầu tiên | Chọn thị trường hẹp để pilot | 5–10 thủ tục phổ biến, nhiều lỗi hình thức, checklist rõ: hộ tịch, cư trú, chứng thực, cấp đổi giấy tờ, hộ kinh doanh | Tiêu chí chọn thủ tục, baseline lỗi |
| Mô hình doanh thu | Cách kiếm tiền | Freemium công dân; pilot B2G 3 tháng; SaaS B2G theo năm; white-label B2B2G; phí theo hồ sơ/API | Bảng gói giá và giá trị nhận được |
| Định giá | Cách tính giá và unit economics | Pilot 60–100 triệu/3 tháng (tham chiếu); SaaS theo số thủ tục, lưu lượng, SLA; phí/API theo bậc thang | Cost-to-serve, cloud/API cost, kịch bản doanh thu |
| Kênh phân phối | Đưa sản phẩm đến người dùng như thế nào | Kênh partner qua VNPT/đơn vị chuyển đổi số; kênh pilot qua trường/khu dân cư/phường giả lập; kênh tích hợp kiosk/cổng | Partner map, plan tiếp cận |
| Truyền thông | Thông điệp cho từng nhóm | Người dân: "kiểm tra hồ sơ trước khi nộp"; Cán bộ: "giảm lỗi lặp lại"; Cơ quan: "có dữ liệu cải cách"; Đối tác: "module GovTech tích hợp được" | Landing page, video demo, one-page pitch |
| Roadmap 12 tháng | Từ MVP đến scale | MVP → pilot → B2G/B2B2G → scale white-label/SaaS | Mốc thời gian, KPI, điều kiện chuyển giai đoạn |

### Câu mẫu có thể đưa trực tiếp vào báo cáo

> *GovTrust AI được triển khai như một web app độc lập trong giai đoạn MVP, sử dụng dữ liệu mẫu, form mẫu, checklist thủ tục và văn bản pháp luật công khai để mô phỏng luồng tiền kiểm hồ sơ trước khi nộp. Hệ thống không thay thế Cổng Dịch vụ công, VNeID, nền tảng eKYC hoặc quyết định hành chính của cán bộ; AI chỉ đưa ra điểm hồ sơ, cảnh báo, căn cứ tham khảo và gợi ý sửa lỗi để người dân/cán bộ xác nhận. Chiến lược Go-to-market của GovTrust AI bắt đầu bằng pilot nhỏ 5–10 thủ tục có tần suất cao, đo before–after về tỷ lệ lỗi phát hiện trước nộp, thời gian kiểm tra sơ bộ, tỷ lệ người dùng sửa lỗi và mức độ hài lòng. Mô hình doanh thu không thu phí chức năng cơ bản từ công dân, mà tập trung vào gói pilot B2G, SaaS B2G theo năm, white-label qua đối tác GovTech và phí API/hồ sơ khi sản phẩm đạt độ ổn định.*

---

## 8. Đối tác ngân hàng / bên thứ ba trong GTM

> *Câu hỏi đặt ra: Có nên đưa ngân hàng/bên thứ ba vào chiến lược Go-to-market của GovTrust AI?*

**Kết luận nhanh:** Nên đưa ngân hàng/bên thứ ba vào đề án GTM, nhưng chỉ ở vai trò **đối tác mở rộng sau MVP** hoặc **đồng hành pilot** — không phải khách hàng cốt lõi giai đoạn đầu. Trục GTM chính vẫn là **B2G/B2B2G** thông qua cơ quan hành chính công, đơn vị chuyển đổi số và đối tác công nghệ GovTech như VNPT.

### 8.1. Vì sao nên đưa ngân hàng vào GTM

- Hành trình người dân chuẩn bị hồ sơ đi qua nhiều điểm chạm: xác thực danh tính, chuẩn bị giấy tờ, thanh toán phí/lệ phí, đăng ký kinh doanh, mở tài khoản, vay vốn, chứng minh thông tin — ngân hàng có thể là đối tác bổ trợ trong hệ sinh thái.
- Ngân hàng có sẵn tệp khách hàng cá nhân, hộ kinh doanh, SME — nhóm có nhu cầu thủ tục hành chính cao.
- Ngân hàng có kinh nghiệm eKYC, xác thực giấy tờ, thanh toán điện tử, quản trị rủi ro dữ liệu — phù hợp với một số năng lực thành phần của GovTrust AI.
- Ngân hàng có thể tài trợ pilot, đồng hành truyền thông chuyển đổi số, hoặc tích hợp GovTrust AI vào chương trình hỗ trợ hộ kinh doanh/SME.
- Giúp đề án GTM có chiều sâu hơn theo mô hình B2B2G/partnership để mở rộng quy mô.

### 8.2. Vì sao không nên chọn ngân hàng làm hướng chính ngay từ đầu

| Rủi ro nếu đặt ngân hàng làm hướng chính | Vì sao nguy hiểm | Cách viết đúng trong báo cáo |
| --- | --- | --- |
| Lệch đề bài HackAIthon | Đề bài Bảng B tập trung giải pháp AI cho lĩnh vực trọng điểm (GovTrust AI chọn bối cảnh cơ quan nhà nước/dịch vụ công) | Ngân hàng chỉ là đối tác mở rộng/đồng tài trợ pilot, không phải người ra quyết định hành chính |
| Rủi ro dữ liệu cá nhân | Hồ sơ hành chính có thể chứa CCCD, địa chỉ, giấy tờ cư trú/hộ tịch, dữ liệu doanh nghiệp | Không chia sẻ giấy tờ gốc cho ngân hàng; chỉ dùng dữ liệu theo consent, tối thiểu hóa và ẩn danh |
| Niềm tin công chúng | Người dân có thể lo ngại hồ sơ công bị dùng cho mục đích thương mại/chấm điểm tín dụng | Cam kết không bán dữ liệu, không dùng dữ liệu hành chính cho credit scoring nếu không có cơ sở pháp lý/đồng ý rõ ràng |
| Khó mua sắm và tích hợp | Ngân hàng có hệ thống riêng, quy định bảo mật riêng, chu kỳ phê duyệt dài | Đưa vào giai đoạn 6–12 tháng sau khi MVP/pilot B2G đã có bằng chứng |
| Lẫn lộn vai trò với VNeID/Cổng DVC | Ngân hàng không thể thay thế định danh nhà nước hoặc quyết định hành chính | Ghi rõ GovTrust AI không thay thế Cổng DVC, VNeID hay cán bộ; ngân hàng chỉ là điểm chạm hỗ trợ |

### 8.3. Sơ đồ vai trò các bên trong Go-to-market

| Nhóm liên quan | Vai trò trong GovTrust AI | Mức độ ưu tiên GTM | Cách đưa vào báo cáo |
| --- | --- | --- | --- |
| Người dân/doanh nghiệp nhỏ/hộ kinh doanh | Dùng công cụ kiểm tra hồ sơ, xem điểm, sửa lỗi, nhận gợi ý trước khi nộp | Rất cao | Nhóm người dùng cuối; không nhất thiết là người trả tiền |
| Cán bộ một cửa/bộ phận tiếp nhận | Hưởng lợi từ giảm lỗi lặp lại; xem Gov Re-Check và phân loại hồ sơ | Rất cao | Nhóm vận hành/người dùng nội bộ trong pilot |
| Trung tâm PVHCC/Văn phòng UBND/đơn vị chuyển đổi số | Người mua, điều phối, phê duyệt triển khai pilot/SaaS | Cốt lõi | Khách hàng chính trong mô hình B2G |
| VNPT/đối tác GovTech | Đối tác hạ tầng/API/kênh phân phối white-label, tích hợp OCR, eKYC, chatbot, kiosk hoặc hệ thống một cửa | Cốt lõi | Kênh B2B2G/white-label quan trọng nhất |
| Ngân hàng/ví điện tử | Đối tác thanh toán, eKYC bổ trợ, kênh tiếp cận SME/hộ kinh doanh hoặc đồng tài trợ pilot | Mở rộng | Đưa vào giai đoạn sau MVP, không phải trục chính |

### 8.4. Các mô hình hợp tác với ngân hàng nên đề xuất

| Mô hình hợp tác | Mô tả | Giá trị cho GovTrust AI | Điều kiện an toàn |
| --- | --- | --- | --- |
| 1. Thanh toán phí/lệ phí | Ngân hàng/ví điện tử hỗ trợ thanh toán phí dịch vụ công nếu GovTrust AI được nhúng vào luồng dịch vụ công | Tăng tính hoàn chỉnh hành trình: kiểm tra hồ sơ → tự điền form → thanh toán → nộp chính thức | Chỉ xử lý giao dịch thanh toán; không nhận giấy tờ gốc/nội dung hồ sơ |
| 2. eKYC/định danh bổ trợ | Tận dụng kinh nghiệm xác thực giấy tờ, liveness, OCR của ngân hàng cho một số use case cần xác minh danh tính | Bổ sung độ tin cậy kỹ thuật, đặc biệt với hộ kinh doanh/SME | Không thay thế VNeID/CSDL dân cư; chỉ dùng khi có consent và phạm vi rõ |
| 3. Kênh tiếp cận hộ kinh doanh/SME | Ngân hàng giới thiệu GovTrust AI cho khách hàng đang mở tài khoản kinh doanh, vay vốn, đăng ký hộ kinh doanh | Tăng adoption ở nhóm thủ tục giá trị cao, dễ đo tác động | Tránh dùng dữ liệu hành chính cho credit scoring nếu không có cơ sở pháp lý |
| 4. Đồng tài trợ pilot/CSR | Ngân hàng tài trợ chương trình hỗ trợ người dân/SME chuẩn bị hồ sơ số tại trường/khu dân cư/phường/trung tâm hành chính | Giảm chi phí pilot, tăng uy tín và kênh truyền thông | Tách thương hiệu tài trợ khỏi quyền truy cập dữ liệu cá nhân |
| 5. API/white-label cho dịch vụ phụ trợ | Cung cấp module kiểm tra tài liệu/SmartForm cho luồng hành chính-tài chính liên quan SME (sau khi ổn định) | Tạo nguồn doanh thu B2B2G/B2B sau giai đoạn B2G | Có hợp đồng xử lý dữ liệu, audit log, DPA, phân quyền, giới hạn retention |

### 8.5. Lộ trình đưa ngân hàng vào theo từng giai đoạn

| Giai đoạn | Mục tiêu chính | Vai trò ngân hàng/bên thứ ba | Đưa vào slide/báo cáo? |
| --- | --- | --- | --- |
| Vòng 2 — MVP | Demo web app 3 thủ tục, pipeline kỹ thuật, bảo mật, test case | Chưa cần tích hợp; chỉ nêu như hướng partnership tương lai | Có, nhưng chỉ 1 dòng trong roadmap/đối tác mở rộng |
| Pilot 1–3 tháng | Mở rộng 5–10 thủ tục, test với người dùng thật/giả lập | Có thể tài trợ pilot, hỗ trợ khảo sát, truyền thông chuyển đổi số | Nên đưa vào phần GTM/partnership |
| B2G/B2B2G 3–6 tháng | Kết nối đối tác công nghệ, dashboard, phân quyền, audit log | Có thể tích hợp thanh toán/eKYC bổ trợ ở use case phù hợp | Nên đưa thành mô hình hợp tác có điều kiện |
| Scale 6–12 tháng | Mở rộng procedure template, SaaS/white-label, API, multi-tenant | Trở thành đối tác phân phối cho SME/hộ kinh doanh hoặc đồng phát triển dịch vụ phụ trợ | Nên đưa vào roadmap mở rộng thị trường |

### 8.6. Nguyên tắc dữ liệu khi hợp tác với ngân hàng

| Nguyên tắc | Giải thích cụ thể | Câu nên viết trong báo cáo |
| --- | --- | --- |
| Không chia sẻ giấy tờ gốc | Ảnh/PDF giấy tờ chỉ xử lý theo phiên trong GovTrust AI hoặc hạ tầng được cấp phép | Ngân hàng không được truy cập hồ sơ gốc trừ khi có căn cứ pháp lý và đồng ý rõ ràng |
| Tối thiểu hóa dữ liệu | Chỉ chuyển trường thật sự cần (ví dụ mã/trạng thái thanh toán), không chuyển toàn bộ hồ sơ | Dữ liệu chia sẻ theo nguyên tắc "cần đến đâu dùng đến đó" |
| Consent rõ ràng | Người dùng biết dữ liệu nào được xử lý, mục đích gì, bên nào xử lý, thời hạn bao lâu | Mỗi tích hợp bên thứ ba cần màn hình consent riêng, có thể từ chối |
| Ẩn danh/metadata cho dashboard | InsightMap chỉ dùng loại lỗi, thủ tục, thời điểm, mức độ — không cần tên/CCCD/địa chỉ | Dashboard phục vụ cải tiến quy trình, không phục vụ quảng cáo/bán dữ liệu |
| Không dùng cho credit scoring | Dữ liệu hành chính không nên dùng để đánh giá tín dụng nếu người dân không biết/không đồng ý | GovTrust AI không thương mại hóa dữ liệu hồ sơ công dân cho tín dụng/quảng cáo |
| Human-in-the-loop | AI và ngân hàng không ra quyết định hành chính; cán bộ/cơ quan vẫn là người quyết định | Mọi cảnh báo chỉ có tính tham khảo, có nguồn và mức tin cậy |

### 8.7. Mô hình doanh thu nếu có ngân hàng/bên thứ ba

| Nguồn doanh thu | Ai trả tiền? | Cách tính | Vai trò ngân hàng |
| --- | --- | --- | --- |
| Pilot B2G | Trung tâm PVHCC/Văn phòng UBND/đối tác tài trợ | Gói 3 tháng theo số thủ tục và dashboard | Có thể đồng tài trợ chương trình chuyển đổi số cộng đồng |
| SaaS B2G | Cơ quan cấp tỉnh/đơn vị vận hành | Thuê bao năm theo số thủ tục, lưu lượng, SLA | Không phải trọng tâm, trừ khi là đối tác triển khai/phân phối |
| White-label B2B2G | VNPT/đối tác GovTech/ngân hàng liên kết | License, phí tích hợp, revenue share | Có thể cung cấp kênh SME hoặc gói dịch vụ hành chính-tài chính |
| Phí API/hồ sơ | Đối tác tích hợp hoặc cơ quan quy mô lớn | Theo số lượt kiểm tra/API call, có trần chi phí | Chỉ áp dụng nếu đo được cost-to-serve và chất lượng ổn định |
| Tài trợ/CSR/innovation | Ngân hàng hoặc doanh nghiệp đồng hành | Tài trợ chi phí pilot, truyền thông, khảo sát | Phù hợp nhất giai đoạn đầu vì không đòi hỏi chia sẻ dữ liệu nhạy cảm |

### 8.8. Rủi ro khi đưa ngân hàng vào và biện pháp giảm thiểu

| Rủi ro | Mức độ | Tác động | Biện pháp giảm thiểu |
| --- | --- | --- | --- |
| BGK cho rằng sản phẩm bị lệch sang fintech | Cao | Mất điểm bám sát đề bài cơ quan nhà nước | Khẳng định ngân hàng là đối tác mở rộng; khách hàng lõi là B2G/B2B2G GovTech |
| Lo ngại bán dữ liệu cá nhân | Rất cao | Giảm niềm tin, rủi ro pháp lý | Cam kết không bán dữ liệu, không chia sẻ hồ sơ gốc, chỉ dùng consent và metadata ẩn danh |
| Ngân hàng yêu cầu tích hợp sâu quá sớm | Trung bình | Làm MVP phức tạp, trễ demo | Chỉ nêu roadmap; không đưa vào scope Vòng 2 |
| Trùng lặp với eKYC/VNeID | Trung bình | Bị hỏi "có gì khác?" | Giải thích GovTrust AI kiểm tra hồ sơ theo thủ tục, không chỉ xác thực danh tính |
| Khó thống nhất pháp lý/hợp đồng | Trung bình | Chậm pilot hoặc không triển khai được | Bắt đầu bằng CSR/tài trợ hoặc thanh toán, tránh dữ liệu nhạy cảm giai đoạn đầu |
| Người dân không muốn dùng nếu thấy ngân hàng liên quan | Trung bình | Giảm adoption | Cho phép dùng chế độ không liên kết ngân hàng; ngân hàng chỉ là tùy chọn |

### 8.9. Đoạn mẫu có thể đưa trực tiếp vào báo cáo

> *Trong giai đoạn đầu, GovTrust AI ưu tiên chiến lược Go-to-market theo mô hình B2G/B2B2G thông qua Trung tâm Phục vụ hành chính công, đơn vị chuyển đổi số địa phương và đối tác công nghệ GovTech. Sau khi MVP được kiểm chứng, sản phẩm có thể mở rộng hợp tác với bên thứ ba như ngân hàng, ví điện tử hoặc tổ chức hỗ trợ SME. Vai trò của ngân hàng không phải là xử lý hay sở hữu dữ liệu hành chính, mà là hỗ trợ thanh toán, tài trợ pilot, cung cấp kênh tiếp cận nhóm hộ kinh doanh/doanh nghiệp nhỏ và đồng phát triển các use case hành chính-tài chính có liên quan. Mọi hợp tác bên thứ ba phải tuân thủ nguyên tắc đồng ý rõ ràng, tối thiểu hóa dữ liệu, không chia sẻ hồ sơ gốc nếu không có căn cứ pháp lý, không bán dữ liệu cá nhân và không để AI hoặc ngân hàng thay thế quyết định hành chính của cơ quan có thẩm quyền.*

### 8.10. Cách trình bày trên slide Go-to-market

| Slide | Tiêu đề nên dùng | Nội dung chính |
| --- | --- | --- |
| Slide 1 | GTM Strategy: Start B2G, Scale B2B2G | Trục chính: cơ quan hành chính công + đối tác GovTech. Ngân hàng là partner mở rộng sau MVP |
| Slide 2 | Stakeholder Map | Người dùng: người dân/SME. Buyer: cơ quan/đơn vị chuyển đổi số. Partner: VNPT/GovTech. Third-party: ngân hàng/ví điện tử |
| Slide 3 | Partnership Expansion | 5 vai trò ngân hàng: payment, eKYC bổ trợ, SME channel, CSR pilot, API/white-label |
| Slide 4 | Data Boundary & Trust | Không chia sẻ hồ sơ gốc, consent rõ, metadata ẩn danh, không credit scoring, human-in-the-loop |
| Slide 5 | Roadmap 12 Months | MVP → pilot → B2G/B2B2G → scale. Ngân hàng xuất hiện từ pilot tài trợ hoặc scale SME, không bắt buộc ở MVP |

### 8.11. Q&A dự phòng khi Ban Giám khảo hỏi

| Câu hỏi có thể bị hỏi | Câu trả lời gợi ý |
| --- | --- |
| Vì sao lại có ngân hàng trong sản phẩm dịch vụ công? | Ngân hàng không phải đơn vị ra quyết định hành chính. Ngân hàng chỉ là đối tác mở rộng ở các điểm chạm phù hợp như thanh toán, tài trợ pilot hoặc kênh tiếp cận hộ kinh doanh/SME. Trục chính của GovTrust AI vẫn là B2G/B2B2G với cơ quan hành chính công và đối tác GovTech |
| Ngân hàng có được xem hồ sơ công dân không? | Không mặc định. Thiết kế đề xuất không chia sẻ hồ sơ gốc cho ngân hàng. Nếu có tích hợp, dữ liệu chỉ được chia sẻ theo consent rõ ràng, tối thiểu hóa và đúng mục đích. Dashboard chỉ dùng metadata ẩn danh |
| Có bị trùng với eKYC của ngân hàng không? | Không. eKYC xác thực danh tính/giấy tờ, còn GovTrust AI kiểm tra bộ hồ sơ theo checklist thủ tục, đối chiếu chéo nhiều giấy tờ, chấm điểm trước nộp, cảnh báo căn cứ pháp lý và tạo dashboard điểm nghẽn |
| Vậy ai là khách hàng trả tiền chính? | Giai đoạn đầu là cơ quan hành chính công/đơn vị chuyển đổi số hoặc đối tác GovTech theo mô hình B2G/B2B2G. Ngân hàng là đối tác mở rộng, có thể đồng tài trợ pilot hoặc tham gia white-label ở giai đoạn sau |
| Có rủi ro thương mại hóa dữ liệu công dân không? | Có rủi ro nếu thiết kế sai, nên đề án đặt nguyên tắc không bán dữ liệu, không dùng dữ liệu hành chính cho credit scoring, không chia sẻ hồ sơ gốc và có human-in-the-loop trong mọi quyết định |

### 8.12. Khuyến nghị chốt

> Nên đưa ngân hàng/bên thứ ba vào phần Go-to-market, nhưng đặt ở mục **"đối tác mở rộng sau MVP"** hoặc **"partnership expansion"**. Không nên biến ngân hàng thành khách hàng cốt lõi hay kênh xử lý dữ liệu chính. Cách viết an toàn nhất là: GovTrust AI đi từ B2G/B2B2G với cơ quan hành chính công và đối tác GovTech; sau khi pilot chứng minh hiệu quả, mở rộng với ngân hàng/ví điện tử ở các vai trò không nhạy cảm trước (tài trợ pilot, thanh toán, truyền thông SME); các tích hợp sâu về eKYC/API chỉ thực hiện khi có consent, hợp đồng dữ liệu và cơ chế audit rõ ràng.

---

## 9. Kết luận & Tính nâng cấp

**Mục tiêu:** kết nối Vòng 1 → Vòng 2 — cải tiến so với proposal, feedback mentor đã áp dụng, tính năng phụ hữu ích.

**Bằng chứng cần đưa vào:** bảng before/after, backlog tính năng, next milestones.

---

## 10. Phân công nhóm

### 10.1. Phân công viết báo cáo từ Code đến GTM

| Vai trò | Phần phụ trách | Đầu ra cần nộp | Deadline gợi ý | Lưu ý khi viết |
| --- | --- | --- | --- | --- |
| Lead tổng hợp | Cấu trúc báo cáo, kết nối code → tác động → GTM | Bản báo cáo cuối + checklist đủ tiêu chí | Ngày 5 | Kiểm tra các phần không mâu thuẫn: MVP không kết nối hệ thống thật nhưng có khả năng mở rộng |
| Tech lead | Kiến trúc, repo, API, deploy | Sơ đồ kiến trúc + bảng endpoint + README tóm tắt | Ngày 2 | Chỉ đưa code/pseudocode quan trọng, không dán quá dài |
| AI lead | OCR, CrossCheck, Score, LawGuard/RAG | Bảng pipeline AI + test case + metric | Ngày 2 | Nhấn mạnh rule có thể audit, RAG có nguồn, không phán quyết pháp lý |
| Frontend/UX | User journey, UI, accessibility | Wireframe/screenshot + UX metrics | Ngày 3 | Bám persona người dân ít rành công nghệ và cán bộ một cửa |
| Security/Legal | Bảo mật dữ liệu, rủi ro pháp lý | Bảng rủi ro + biện pháp kiểm soát | Ngày 3 | Nói rõ không dùng CSDL dân cư, không lưu giấy tờ dài hạn |
| GTM lead | Phân khúc, buyer, kênh, đối tác, định giá | Bảng GTM + pricing + partner map | Ngày 4 | Tách người dùng, người vận hành và người trả tiền |
| Pilot/KPI lead | Kế hoạch đo lường sau cuộc thi | Pilot 12 tuần + KPI before-after | Ngày 4 | Không tuyên bố kết quả chưa đo; ghi là mục tiêu pilot |

### 10.2. Phân công chi tiết phần Go-to-market

| Thành viên | Vai trò phụ trách | Công việc cụ thể | Đầu ra cần nộp | Gợi ý nội dung cần làm |
| --- | --- | --- | --- | --- |
| Thành viên 1 | Trưởng nhóm GTM / Tổng hợp chiến lược | Điều phối toàn bộ phần GTM, thống nhất logic, kiểm tra khớp với MVP và tiêu chí chấm điểm | 1 bản tổng hợp GTM hoàn chỉnh + slide/section cuối | Câu chuyện chính: "GovTrust AI không thay thế Cổng DVC, mà là lớp tiền kiểm giúp người dân nộp hồ sơ đúng ngay từ đầu và giúp cơ quan nhìn thấy điểm nghẽn." |
| Thành viên 2 | Phân khúc khách hàng & người dùng mục tiêu | Xác định ai dùng, ai trả tiền, ai ra quyết định triển khai | Bảng phân khúc khách hàng + chân dung người dùng | Người dân/doanh nghiệp nhỏ = người dùng; cán bộ một cửa = người vận hành; Trung tâm PVHCC/Văn phòng UBND/đối tác GovTech = khách hàng trả tiền/triển khai |
| Thành viên 3 | Mô hình doanh thu & định giá | Xây dựng cách kiếm tiền, cách tính phí, chi phí trên mỗi hồ sơ/API/gói pilot | Bảng mô hình doanh thu + 3 kịch bản giá | Miễn phí cho người dân; pilot B2G 3 tháng; SaaS B2G theo năm; white-label qua VNPT/đối tác; phí theo hồ sơ/API call |
| Thành viên 4 | Kênh phân phối & đối tác | Tìm kênh đưa sản phẩm ra thị trường và đối tác hợp tác | Bảng kênh phân phối/đối tác + cách tiếp cận | Đối tác chính: VNPT/đơn vị chuyển đổi số, Trung tâm PVHCC, trường đại học/khu dân cư/phường giả lập để pilot, Đoàn/Hội sinh viên để test người dùng |
| Thành viên 5 | Truyền thông & thông điệp thị trường | Xây dựng cách giới thiệu sản phẩm cho người dân, cán bộ và cơ quan | Key message + kế hoạch truyền thông + demo script | Người dân: "Kiểm tra hồ sơ trước khi nộp." Cơ quan: "Giảm lỗi lặp lại, có dashboard điểm nghẽn." Đối tác: "Module GovTech có thể tích hợp vào hệ sinh thái sẵn có." |
| Thành viên 6 | Pilot, KPI & lộ trình 12 tháng | Thiết kế kế hoạch thử nghiệm sau cuộc thi và roadmap mở rộng | Bảng pilot 12 tuần + roadmap 12 tháng + KPI | KPI: tỷ lệ lỗi phát hiện trước nộp, tỷ lệ người dùng sửa lỗi, thời gian kiểm tra hồ sơ, CSAT/NPS, số lỗi lặp lại trên InsightMap, số thủ tục mở rộng |
| Thành viên 7 *(nếu có)* | Rủi ro pháp lý, bảo mật & niềm tin | Chỉ ra rủi ro khi triển khai GovTech/AI và cách kiểm soát | Bảng rủi ro + giải pháp giảm thiểu | Nhấn mạnh: không lưu giấy tờ dài hạn, không tự ra quyết định hành chính, AI chỉ cảnh báo tham khảo, có nguồn pháp lý, có human review |

---

## 11. Checklist cuối trước khi nộp báo cáo Vòng 2

| Mục kiểm tra | Đã có? | Yêu cầu đạt | Ghi chú |
| --- | --- | --- | --- |
| Demo MVP | ☐ | Chạy được ít nhất 3 lần với 3 test case khác nhau | Có video dự phòng nếu live demo lỗi |
| Repo + README | ☐ | Có hướng dẫn cài 1 lệnh hoặc các bước rõ ràng | Có `.env.example`, seed data, mock fallback |
| Script test | ☐ | Unit/integration/demo test pass | Chụp màn hình hoặc log test |
| Pipeline kỹ thuật | ☐ | Input – xử lý – output từng bước | Không viết chung chung |
| Bảo mật dữ liệu | ☐ | Có data minimization, xóa file, ẩn danh log, RBAC | Có disclaimer cho LawGuard |
| UX | ☐ | Có persona, user journey, wireframe/screenshot, accessibility | Có metric đề xuất |
| Triển khai/mở rộng | ☐ | Có cloud cost, queue/cache, scale plan | Nêu rõ giới hạn MVP |
| GTM | ☐ | Có phân khúc, buyer, doanh thu, định giá, kênh, đối tác | Có roadmap 12 tháng |
| Tính nâng cấp | ☐ | Nêu cải tiến so với Vòng 1 và feedback mentor | Có bảng before-after |
| Ngôn ngữ báo cáo | ☐ | Không thổi phồng, không tuyên bố kết quả chưa đo | Dùng: mục tiêu pilot, giả định, cần kiểm chứng |
| Phần đối tác ngân hàng | ☐ | Ngân hàng là đối tác mở rộng, không phải buyer chính; có nguyên tắc dữ liệu rõ ràng | Có Q&A phòng thủ về quyền riêng tư, trùng lặp eKYC, lệch đề bài |

---

## 12. Tài liệu tham chiếu

1. **GovTrust AI.pdf / GovTrust_fix.docx** — phần định vị sản phẩm, pipeline kỹ thuật, nguyên tắc bảo mật dữ liệu, mô hình doanh thu và roadmap GTM sau cuộc thi.
2. **Thể lệ Cuộc thi Vietnamese Student HackAIthon 2026** — tiêu chí Vòng 2 Bảng B Challenger: hoàn thiện sản phẩm, trải nghiệm người dùng, khả năng triển khai/mở rộng, chiến lược Go-to-market, tính nâng cấp.
3. **Tài liệu Go-to-market & Đối tác ngân hàng** — phân tích vai trò ngân hàng/bên thứ ba trong chiến lược GTM của GovTrust AI.
4. **Danh mục nội dung cần có trong báo cáo** — checklist từ Code/MVP đến GTM, phân công nhóm.

---

*GovTrust AI — Báo cáo tổng hợp Vòng 2, Vietnamese Student HackAIthon 2026.*