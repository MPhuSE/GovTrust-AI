# Khai sinh + Kết hôn — CHỈ có giấy kết hôn (thiếu giấy chứng sinh)

## Giấy tờ upload (đúng thứ tự slot)
- `01_giay-dang-ky-ket-hon_sample.jpg → slot 'GCN kết hôn' (VNPT thật)`

## Kết quả cross-check / điền form DỰ KIẾN
- Người yêu cầu (eKYC) = user test ĐINH NGỌC ANH · Nữ → vai trò MẸ (seed: scripts/seed-kethon-user.js, login dinhngocanh_test/Test@1234)
- R1 SKIPPED: không có giấy chứng sinh (skipIfMissing) → không trừ điểm R1
- R3 MATCH: giấy kết hôn vợ = ĐINH NGỌC ANH = người yêu cầu
- treEm.hoTen rỗng → form dùng defaultValue '(Chưa đặt tên)'; phuHuynh2.hoTen lấy từ chồng trên giấy kết hôn = HOÀNG VĂN THÁI

> Ảnh `*_sample.*` = giấy THẬT (VNPT SmartReader đọc). Ảnh còn lại do Qwen VL đọc.
