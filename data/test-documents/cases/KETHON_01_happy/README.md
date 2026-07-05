# Khai sinh + Kết hôn — Happy path (mọi cross-check MATCH)

## Giấy tờ upload (đúng thứ tự slot)
- `01_giay-chung-sinh.jpg → slot 'Giấy chứng sinh' (Qwen)`
- `02_giay-dang-ky-ket-hon_sample.jpg → slot 'GCN kết hôn' (VNPT thật)`

## Kết quả cross-check / điền form DỰ KIẾN
- Người yêu cầu (eKYC) = user test ĐINH NGỌC ANH · Nữ → vai trò MẸ (seed: scripts/seed-kethon-user.js, login dinhngocanh_test/Test@1234)
- R1 MATCH: giấy chứng sinh mẹ = ĐINH NGỌC ANH = người yêu cầu
- R3 MATCH: giấy kết hôn vợ = ĐINH NGỌC ANH = người yêu cầu
- Cha = HOÀNG VĂN THÁI (khớp chồng trên giấy kết hôn) → gia đình nhất quán
- Form điền: thông tin trẻ, mẹ (eKYC), cha, số/ngày/nơi đăng ký kết hôn

> Ảnh `*_sample.*` = giấy THẬT (VNPT SmartReader đọc). Ảnh còn lại do Qwen VL đọc.
