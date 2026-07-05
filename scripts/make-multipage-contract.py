#!/usr/bin/env python3
"""Dựng 1 PDF HỢP ĐỒNG NHIỀU TRANG để test luồng OCR PDF đa trang (giấy đi Qwen).

Field bị TÁCH sang các trang khác nhau (2 bên ở trang 1, thửa đất ở trang 2,
giá + công chứng + chữ ký ở trang 3) → nếu merge sai/chỉ đọc 1 trang thì thiếu field.

Chạy: apps/ai-svc/.venv/bin/python scripts/make-multipage-contract.py
Output: data/test-documents/cases/CHUYENNHUONG_04_pdf_dathang/02_hop-dong-chuyen-nhuong.pdf
"""
import os
from PIL import Image, ImageDraw, ImageFont

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT_DIR = os.path.join(ROOT, "data", "test-documents", "cases", "CHUYENNHUONG_04_pdf_dathang")
FONT = "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"
FONT_B = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"

W, H, M = 1240, 1754, 90  # A4-ish dọc


def wrap(d, text, font, maxw):
    words, lines, cur = text.split(), [], ""
    for w in words:
        t = f"{cur} {w}".strip()
        if d.textlength(t, font=font) <= maxw:
            cur = t
        else:
            lines.append(cur); cur = w
    if cur:
        lines.append(cur)
    return lines


def page(title, blocks):
    img = Image.new("RGB", (W, H), "white")
    d = ImageDraw.Draw(img)
    ft_t = ImageFont.truetype(FONT_B, 30)
    ft_h = ImageFont.truetype(FONT_B, 23)
    ft_b = ImageFont.truetype(FONT, 22)
    y = M
    tw = d.textlength(title, font=ft_t)
    d.text(((W - tw) / 2, y), title, fill=(15, 40, 70), font=ft_t); y += 60
    for head, paras in blocks:
        if head:
            d.text((M, y), head, fill=(15, 40, 70), font=ft_h); y += 40
        for p in paras:
            for ln in wrap(d, p, ft_b, W - 2 * M):
                d.text((M, y), ln, fill=(0, 0, 0), font=ft_b); y += 34
            y += 16
    return img


p1 = page("HỢP ĐỒNG CHUYỂN NHƯỢNG QUYỀN SỬ DỤNG ĐẤT (Trang 1/3)", [
    ("", ["Căn cứ Luật Đất đai số 31/2024/QH15 ngày 18 tháng 01 năm 2024;",
          "Hôm nay, ngày 01 tháng 7 năm 2026, hai bên gồm:"]),
    ("BÊN CHUYỂN NHƯỢNG (BÊN A):", [
        "Ông/Bà: TRẦN VĂN MINH. Sinh năm 1978. Số CCCD: 038078009112. "
        "Địa chỉ thường trú: Số 5 phố Vọng, phường Đồng Tâm, thành phố Hà Nội."]),
    ("BÊN NHẬN CHUYỂN NHƯỢNG (BÊN B):", [
        "Ông/Bà: NGUYỄN ĐĂNG KIÊN. Sinh năm 1990. Số CCCD: 001090012345. "
        "Địa chỉ thường trú: Số 27 phố Huế, phường Hàng Bài, thành phố Hà Nội."]),
])
p2 = page("(Trang 2/3)", [
    ("ĐIỀU 1. THÔNG TIN VỀ THỬA ĐẤT CHUYỂN NHƯỢNG", [
        "Bên A chuyển nhượng cho Bên B thửa đất tại địa chỉ: Số 12 đường Nguyễn Trãi, "
        "phường Thanh Xuân, thành phố Hà Nội.",
        "Thửa đất số: 42. Tờ bản đồ số: 15. Diện tích: 120 m². "
        "Mục đích sử dụng: Đất ở tại đô thị. Thời hạn sử dụng: Lâu dài. "
        "Nguồn gốc sử dụng: Nhận chuyển nhượng quyền sử dụng đất."]),
])
p3 = page("(Trang 3/3)", [
    ("ĐIỀU 2. GIÁ CHUYỂN NHƯỢNG VÀ THANH TOÁN", [
        "Giá chuyển nhượng là 2.500.000.000 đồng (bằng chữ: hai tỷ năm trăm triệu đồng). "
        "Thanh toán một lần bằng chuyển khoản sau khi công chứng."]),
    ("ĐIỀU 3. ĐIỀU KHOẢN THI HÀNH", [
        "Hợp đồng có hiệu lực kể từ thời điểm được công chứng, lập thành 03 bản."]),
    ("", ["BÊN CHUYỂN NHƯỢNG                    BÊN NHẬN CHUYỂN NHƯỢNG",
          "     TRẦN VĂN MINH                          NGUYỄN ĐĂNG KIÊN",
          "",
          "LỜI CHỨNG CÔNG CHỨNG VIÊN: Ngày 01/7/2026, tại Văn phòng công chứng Thanh Xuân, "
          "thành phố Hà Nội, tôi xác nhận hợp đồng được giao kết tự nguyện."]),
])

os.makedirs(OUT_DIR, exist_ok=True)
out = os.path.join(OUT_DIR, "02_hop-dong-chuyen-nhuong.pdf")
p1.save(out, "PDF", save_all=True, append_images=[p2, p3], resolution=150.0)
print(f"✓ {os.path.relpath(out, ROOT)} (3 trang)")
