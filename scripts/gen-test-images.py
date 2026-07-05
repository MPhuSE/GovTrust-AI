#!/usr/bin/env python3
"""
Sinh bộ ảnh test NHIỀU CASE để test luồng GovTrust trên frontend.

CHIẾN LƯỢC (đã verify qua OCR thật — xem OCR-ROUTING bên dưới):
- VNPT SmartReader chỉ đọc được LAYOUT GIẤY TỜ THẬT (huấn luyện trên form thật).
  Ảnh tổng hợp label:value bị nó gộp field sai → KHÔNG tự sinh giấy VNPT được.
  → Dùng ẢNH MẪU THẬT làm anchor cố định (copy vào từng case).
- Qwen VL đọc được MỌI ảnh rõ nét (đã verify: chứng sinh 10/10, ủy quyền 5/5 field).
  → Sinh nhiều VARIANT cho giấy Qwen để tạo case MATCH / MISMATCH.

OCR-ROUTING (apps/ai-svc/app/services/ocr.py):
  VNPT SmartReader : GIAY_KHAI_SINH, GIAY_KET_HON, HO_KINH_DOANH
  Qwen VL          : GIAY_CHUNG_SINH, VAN_BAN_UY_QUYEN_HGD, GIAY_CHUNG_NHAN_QSDD, HOP_DONG_CHUYEN_NHUONG

Dữ liệu anchor HKD thật (đọc từ giay-dang-ky-ho-kinh-doanh_sample.jpg qua VNPT):
  chủ hộ = LÊ THÁI HƯNG · mã số 12.A8.018999 · CCCD 09165232001
  ngày sinh 10/09/1998 · thường trú Tổ 15, phường Nam Cường, Tp Lào Cai

Dữ liệu anchor GCN KẾT HÔN thật (đọc từ giay-dang-ky-ket-hon_sample.jpg qua VNPT — 15 field):
  vợ = ĐINH NGỌC ANH · chồng = HOÀNG VĂN THÁI · số 02/1992
  đăng ký tại UBND Xã Thiện Phiến, huyện Tiên Lữ, tỉnh Hưng Yên · ngày 06/09/2002
  → giấy kết hôn là ẢNH THẬT (VNPT đọc layout thật) nên vợ/chồng CỐ ĐỊNH; ta chỉ
    điều khiển giấy chứng sinh (Qwen) + tài khoản eKYC để tạo case MATCH/MISMATCH.

Output: data/test-documents/cases/<CASE>/  (mỗi case tự chứa + README.md)
Chạy:   apps/ai-svc/.venv/bin/python scripts/gen-test-images.py
"""

import os
import shutil
from PIL import Image, ImageDraw, ImageFont

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CASES_DIR = os.path.join(ROOT, "data", "test-documents", "cases")
SAMPLES = os.path.join(ROOT, "data", "test-documents")

FONT_REGULAR = "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"
FONT_BOLD = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"

# Anchor thật (chủ hộ hiện tại trên Giấy ĐKHKD — VNPT đọc được)
HKD_CHU_HO = "LÊ THÁI HƯNG"
HKD_TEN = "LÊ THÁI HƯNG"
# Tên tài khoản eKYC đang đăng nhập (chủ hộ MỚI). Đổi cho khớp tài khoản test của bạn.
ACCOUNT_NAME = "NGUYỄN ĐĂNG PHÚ"


def _font(bold: bool, size: int) -> ImageFont.FreeTypeFont:
    return ImageFont.truetype(FONT_BOLD if bold else FONT_REGULAR, size)


def make_doc(path: str, title: str, subtitle: str, fields: dict[str, str]) -> None:
    """Dựng ảnh giấy tờ dạng form (cho Qwen đọc): tiêu đề + dòng nhãn/giá trị + khung."""
    width = 1000
    height = 250 + len(fields) * 62
    img = Image.new("RGB", (width, height), "white")
    d = ImageDraw.Draw(img)
    d.rectangle([12, 12, width - 12, height - 12], outline=(30, 60, 90), width=3)

    ft_title, ft_sub = _font(True, 34), _font(False, 20)
    ft_label, ft_value = _font(False, 22), _font(True, 24)

    tw = d.textlength(title, font=ft_title)
    d.text(((width - tw) / 2, 38), title, fill=(15, 40, 70), font=ft_title)
    sw = d.textlength(subtitle, font=ft_sub)
    d.text(((width - sw) / 2, 86), subtitle, fill=(90, 90, 90), font=ft_sub)
    d.line([60, 128, width - 60, 128], fill=(180, 180, 180), width=2)

    y = 158
    for label, value in fields.items():
        d.text((70, y), f"{label}:", fill=(70, 70, 70), font=ft_label)
        d.text((70, y + 26), str(value), fill=(0, 0, 0), font=ft_value)
        y += 62

    os.makedirs(os.path.dirname(path), exist_ok=True)
    img.save(path, "JPEG", quality=92)


def make_contract_doc(path: str, national_header: str, title: str,
                      blocks: list[tuple[str, list[str]]], footer: list[str]) -> None:
    """Dựng ảnh HỢP ĐỒNG dạng VĂN BẢN DÀY (giống mẫu thật) để stress-test Qwen:
    - Quốc hiệu + tiêu đề canh giữa.
    - Nhiều 'điều/mục' (heading in đậm) + đoạn văn xuôi wrap dòng — field nằm CHÌM
      trong prose ("Diện tích: 120 m² (một trăm hai mươi mét vuông)"), không phải
      form nhãn:giá trị. Đây mới là ca sát production cho HOP_DONG_CHUYEN_NHUONG.
    - footer = lời chứng / chữ ký 2 bên.
    Ảnh khổ dọc A4-ish, chữ nhỏ, mật độ cao như trang hợp đồng thật.
    """
    width = 1240
    margin = 90
    max_text_w = width - 2 * margin

    ft_nation = _font(True, 26)
    ft_nation_sub = _font(False, 22)
    ft_title = _font(True, 30)
    ft_head = _font(True, 23)
    ft_body = _font(False, 22)

    # Đo trước chiều cao để tạo canvas vừa đủ (wrap theo pixel width thực).
    def wrap(text: str, font) -> list[str]:
        words, lines, cur = text.split(), [], ""
        probe = ImageDraw.Draw(Image.new("RGB", (10, 10)))
        for w in words:
            trial = f"{cur} {w}".strip()
            if probe.textlength(trial, font=font) <= max_text_w:
                cur = trial
            else:
                if cur:
                    lines.append(cur)
                cur = w
        if cur:
            lines.append(cur)
        return lines or [""]

    LH_BODY, LH_HEAD, GAP = 34, 40, 16
    y = margin
    y += 34 * 2 + 20            # quốc hiệu (2 dòng)
    y += 48                      # tiêu đề
    for head, paras in blocks:
        if head:
            y += LH_HEAD
        for p in paras:
            y += len(wrap(p, ft_body)) * LH_BODY + GAP
    y += 30
    for line in footer:
        y += len(wrap(line, ft_body)) * LH_BODY + 6
    height = y + margin

    img = Image.new("RGB", (width, height), "white")
    d = ImageDraw.Draw(img)

    def centered(text: str, font, yy: int, fill=(0, 0, 0)) -> int:
        w = d.textlength(text, font=font)
        d.text(((width - w) / 2, yy), text, fill=fill, font=font)
        return yy

    y = margin
    centered("CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM", ft_nation, y); y += 34
    centered("Độc lập - Tự do - Hạnh phúc", ft_nation_sub, y); y += 34
    centered("─────────────", ft_nation_sub, y - 2); y += 20
    centered(title, ft_title, y, fill=(15, 40, 70)); y += 48

    for head, paras in blocks:
        if head:
            d.text((margin, y), head, fill=(15, 40, 70), font=ft_head); y += LH_HEAD
        for p in paras:
            for ln in wrap(p, ft_body):
                d.text((margin, y), ln, fill=(0, 0, 0), font=ft_body); y += LH_BODY
            y += GAP
    y += 30
    for line in footer:
        for ln in wrap(line, ft_body):
            d.text((margin, y), ln, fill=(40, 40, 40), font=ft_body); y += LH_BODY
        y += 6

    os.makedirs(os.path.dirname(path), exist_ok=True)
    img.save(path, "JPEG", quality=94)


def copy_anchor(src_rel: str, dst: str) -> None:
    """Copy ảnh mẫu THẬT (VNPT đọc được) vào folder case."""
    os.makedirs(os.path.dirname(dst), exist_ok=True)
    shutil.copyfile(os.path.join(SAMPLES, src_rel), dst)


def write_readme(case_dir: str, title: str, files: list[str], expects: list[str]) -> None:
    lines = [f"# {title}", "", "## Giấy tờ upload (đúng thứ tự slot)"]
    lines += [f"- `{f}`" for f in files]
    lines += ["", "## Kết quả cross-check / điền form DỰ KIẾN"]
    lines += [f"- {e}" for e in expects]
    lines += ["", "> Ảnh `*_sample.*` = giấy THẬT (VNPT SmartReader đọc). "
              "Ảnh còn lại do Qwen VL đọc.", ""]
    with open(os.path.join(case_dir, "README.md"), "w", encoding="utf-8") as f:
        f.write("\n".join(lines))


# ─────────────────────────────────────────────────────────────────────────────
# HKD_THAY_DOI — cross-check rules (mvp-procedures.ts):
#   R1 cccd_nguoi_yeu_cau.hoTen == van_ban_uy_quyen_hgd.tenNguoiDuocUyQuyen  (HIGH)
#   R2 giay_hkd.hoTenChuHo      == van_ban_uy_quyen_hgd.tenNguoiUyQuyen      (HIGH)
#   R3 van_ban_uy_quyen_hgd.tenHoKinhDoanh == giay_hkd.tenHoKinhDoanh        (MEDIUM)
# giay_hkd = anchor thật (LÊ THÁI HƯNG). cccd_nguoi_yeu_cau = eKYC account.
# → ta điều khiển 3 field của văn bản ủy quyền để tạo MATCH/MISMATCH.
# ─────────────────────────────────────────────────────────────────────────────
def uy_quyen(case_dir: str, nguoi_uy_quyen: str, nguoi_duoc_uy_quyen: str, ten_hkd: str):
    make_doc(
        os.path.join(case_dir, "02_van-ban-uy-quyen-hgd.jpg"),
        "VĂN BẢN ỦY QUYỀN",
        "Của các thành viên hộ gia đình (Đ.100 NĐ 168/2025)",
        {
            "Tên hộ kinh doanh": ten_hkd,
            "Họ tên người ủy quyền": nguoi_uy_quyen,
            "Họ tên người được ủy quyền": nguoi_duoc_uy_quyen,
            "Ngày ủy quyền": "01/07/2026",
            "Nơi công chứng": "UBND phường Nam Cường, Tp Lào Cai",
        },
    )


def gen_hkd_cases():
    print("HKD_THAY_DOI:")
    hkd_anchor = "HKD_THAY_DOI/giay-dang-ky-ho-kinh-doanh_sample.jpg"

    # CASE 1 — happy: mọi rule MATCH
    c = os.path.join(CASES_DIR, "HKD_01_happy")
    copy_anchor(hkd_anchor, os.path.join(c, "01_giay-dang-ky-ho-kinh-doanh_sample.jpg"))
    uy_quyen(c, HKD_CHU_HO, ACCOUNT_NAME, HKD_TEN)
    write_readme(c, "HKD — Happy path (điểm cao, mọi cross-check MATCH)",
                 ["01_giay-dang-ky-ho-kinh-doanh_sample.jpg → slot 'Giấy ĐKHKD'",
                  "02_van-ban-uy-quyen-hgd.jpg → slot 'Văn bản ủy quyền HGĐ'"],
                 ["R1 chủ hộ mới ↔ eKYC account: MATCH (cần eKYC account = "
                  f"{ACCOUNT_NAME})",
                  f"R2 chủ hộ cũ ↔ người ủy quyền: MATCH ({HKD_CHU_HO})",
                  f"R3 tên HKD: MATCH ({HKD_TEN})",
                  "Form điền đủ: tên HKD, mã số, địa chỉ, chủ hộ cũ (từ giấy thật)"])
    print(f"  ✓ {os.path.relpath(c, ROOT)}")

    # CASE 2 — chủ hộ cũ không khớp người ủy quyền (R2 MISMATCH HIGH)
    c = os.path.join(CASES_DIR, "HKD_02_chuho_cu_mismatch")
    copy_anchor(hkd_anchor, os.path.join(c, "01_giay-dang-ky-ho-kinh-doanh_sample.jpg"))
    uy_quyen(c, "TRẦN VĂN SỬU", ACCOUNT_NAME, HKD_TEN)
    write_readme(c, "HKD — Chủ hộ cũ KHÔNG khớp người ủy quyền",
                 ["01_giay-dang-ky-ho-kinh-doanh_sample.jpg → slot 'Giấy ĐKHKD'",
                  "02_van-ban-uy-quyen-hgd.jpg → slot 'Văn bản ủy quyền HGĐ'"],
                 [f"R2 MISMATCH HIGH: giấy ĐKHKD ghi {HKD_CHU_HO} nhưng ủy quyền "
                  "ghi TRẦN VĂN SỬU → điểm bị trừ nặng, cảnh báo đỏ",
                  "R1, R3 vẫn MATCH"])
    print(f"  ✓ {os.path.relpath(c, ROOT)}")

    # CASE 3 — tên HKD không khớp (R3 MISMATCH MEDIUM)
    c = os.path.join(CASES_DIR, "HKD_03_ten_hkd_mismatch")
    copy_anchor(hkd_anchor, os.path.join(c, "01_giay-dang-ky-ho-kinh-doanh_sample.jpg"))
    uy_quyen(c, HKD_CHU_HO, ACCOUNT_NAME, "HỘ KINH DOANH MINH PHÁT")
    write_readme(c, "HKD — Tên hộ kinh doanh KHÔNG khớp",
                 ["01_giay-dang-ky-ho-kinh-doanh_sample.jpg → slot 'Giấy ĐKHKD'",
                  "02_van-ban-uy-quyen-hgd.jpg → slot 'Văn bản ủy quyền HGĐ'"],
                 [f"R3 MISMATCH MEDIUM: giấy ĐKHKD '{HKD_TEN}' ≠ ủy quyền "
                  "'HỘ KINH DOANH MINH PHÁT'",
                  "R1, R2 vẫn MATCH"])
    print(f"  ✓ {os.path.relpath(c, ROOT)}")


# ─────────────────────────────────────────────────────────────────────────────
# DANG_KY_KHAI_SINH — cross-check rules:
#   R1 cccd_nguoi_yeu_cau.hoTen == giay_chung_sinh.hoTenMe   (HIGH, skipIfMissing gcs)
#   R2 cccd_phu_huynh_con_lai.hoTen == giay_chung_sinh.hoTenCha (MEDIUM)
#   R3 giay_chung_nhan_ket_hon.hoTenVo == cccd_nguoi_yeu_cau.hoTen (LOW)
# giay_chung_sinh = Qwen (ta điều khiển). Tên MẸ phải = eKYC account để R1 MATCH.
# MOTHER_NAME đặt = tên tài khoản test; đổi nếu account khác.
# ─────────────────────────────────────────────────────────────────────────────
MOTHER_NAME = "TRẦN THỊ BÌNH"   # = eKYC account (nữ) để R1 MATCH
FATHER_NAME = "NGUYỄN VĂN AN"


def chung_sinh(case_dir: str, ten_con: str, me: str, cha: str):
    make_doc(
        os.path.join(case_dir, "01_giay-chung-sinh.jpg"),
        "GIẤY CHỨNG SINH",
        "Phụ lục 5 - Thông tư 56/2017/TT-BYT",
        {
            "Họ tên con": ten_con,
            "Ngày sinh con": "15/06/2026",
            "Giới tính con": "Nam",
            "Cân nặng": "3.4 kg",
            "Nơi sinh": "Bệnh viện Phụ sản Hà Nội",
            "Họ tên mẹ": me,
            "Năm sinh mẹ": "1996",
            "Họ tên cha": cha,
            "Năm sinh cha": "1994",
            "Số giấy chứng sinh": "088/2026/CS",
        },
    )


def gen_khai_sinh_cases():
    print("DANG_KY_KHAI_SINH:")
    # CASE 1 — happy (con đã đặt tên, mẹ khớp account)
    c = os.path.join(CASES_DIR, "KHAISINH_01_happy")
    chung_sinh(c, "NGUYỄN MINH KHÔI", MOTHER_NAME, FATHER_NAME)
    write_readme(c, "Khai sinh — Happy path (con đã đặt tên)",
                 ["01_giay-chung-sinh.jpg → slot 'Giấy chứng sinh'"],
                 [f"R1 MATCH nếu eKYC account (mẹ) = {MOTHER_NAME}",
                  "Form điền: tên con, ngày sinh, giới tính, nơi sinh, cha/mẹ",
                  "Không upload GCN kết hôn → R3 SKIPPED (không trừ điểm)"])
    print(f"  ✓ {os.path.relpath(c, ROOT)}")

    # CASE 2 — con chưa đặt tên (edge: field required rỗng → hiện default '(Chưa đặt tên)')
    c = os.path.join(CASES_DIR, "KHAISINH_02_chua_dat_ten")
    chung_sinh(c, "", MOTHER_NAME, FATHER_NAME)
    write_readme(c, "Khai sinh — Con CHƯA đặt tên (edge case)",
                 ["01_giay-chung-sinh.jpg → slot 'Giấy chứng sinh'"],
                 ["treEm.hoTen rỗng → form dùng defaultValue '(Chưa đặt tên)'",
                  f"R1 MATCH nếu eKYC account (mẹ) = {MOTHER_NAME}"])
    print(f"  ✓ {os.path.relpath(c, ROOT)}")

    # CASE 3 — tên mẹ không khớp account (R1 MISMATCH HIGH)
    c = os.path.join(CASES_DIR, "KHAISINH_03_me_mismatch")
    chung_sinh(c, "NGUYỄN MINH KHÔI", "LÊ THỊ SAI", FATHER_NAME)
    write_readme(c, "Khai sinh — Tên mẹ KHÔNG khớp người yêu cầu",
                 ["01_giay-chung-sinh.jpg → slot 'Giấy chứng sinh'"],
                 ["R1 MISMATCH HIGH: giấy chứng sinh ghi mẹ 'LÊ THỊ SAI' "
                  "≠ tên eKYC account → cảnh báo đỏ, trừ điểm"])
    print(f"  ✓ {os.path.relpath(c, ROOT)}")


# ─────────────────────────────────────────────────────────────────────────────
# DANG_KY_KHAI_SINH + GIẤY KẾT HÔN THẬT — anchor VNPT cố định:
#   giấy kết hôn (ảnh thật) → vợ = ĐINH NGỌC ANH · chồng = HOÀNG VĂN THÁI
# Cross-check liên quan giấy kết hôn:
#   R1 giay_chung_sinh.hoTenMe        == cccd_nguoi_yeu_cau.hoTen  (HIGH, skip nếu thiếu GCS)
#   R3 giay_chung_nhan_ket_hon.hoTenVo == cccd_nguoi_yeu_cau.hoTen (LOW,  skip nếu thiếu GCN)
# Người yêu cầu (eKYC) = user test ĐINH NGỌC ANH (Nữ → vai trò MẸ) đã seed vào Atlas
#   (scripts/seed-kethon-user.js). Vợ trên giấy kết hôn = requester ⇒ R3 LUÔN MATCH.
# Ta chỉ điều khiển giấy chứng sinh (Qwen) → tên MẸ để tạo R1 MATCH/MISMATCH.
# ─────────────────────────────────────────────────────────────────────────────
KETHON_ANCHOR = "giay-dang-ky-ket-hon_sample.jpg"  # ảnh thật (rasterize từ PDF), VNPT đọc 15 field
KETHON_VO = "ĐINH NGỌC ANH"        # = tên eKYC account test (mẹ / người yêu cầu)
KETHON_CHONG = "HOÀNG VĂN THÁI"    # chồng trên giấy kết hôn → cha đứa trẻ


def gen_ket_hon_cases():
    print("DANG_KY_KHAI_SINH + GIẤY KẾT HÔN (anchor VNPT thật):")
    note = ("Người yêu cầu (eKYC) = user test ĐINH NGỌC ANH · Nữ → vai trò MẸ "
            "(seed: scripts/seed-kethon-user.js, login dinhngocanh_test/Test@1234)")

    # CASE 1 — happy: giấy chứng sinh + giấy kết hôn, mọi cross-check MATCH
    c = os.path.join(CASES_DIR, "KETHON_01_happy")
    chung_sinh(c, "HOÀNG MINH ANH", KETHON_VO, KETHON_CHONG)
    copy_anchor(KETHON_ANCHOR, os.path.join(c, "02_giay-dang-ky-ket-hon_sample.jpg"))
    write_readme(c, "Khai sinh + Kết hôn — Happy path (mọi cross-check MATCH)",
                 ["01_giay-chung-sinh.jpg → slot 'Giấy chứng sinh' (Qwen)",
                  "02_giay-dang-ky-ket-hon_sample.jpg → slot 'GCN kết hôn' (VNPT thật)"],
                 [note,
                  f"R1 MATCH: giấy chứng sinh mẹ = {KETHON_VO} = người yêu cầu",
                  f"R3 MATCH: giấy kết hôn vợ = {KETHON_VO} = người yêu cầu",
                  f"Cha = {KETHON_CHONG} (khớp chồng trên giấy kết hôn) → gia đình nhất quán",
                  "Form điền: thông tin trẻ, mẹ (eKYC), cha, số/ngày/nơi đăng ký kết hôn"])
    print(f"  ✓ {os.path.relpath(c, ROOT)}")

    # CASE 2 — mẹ trên giấy chứng sinh ≠ người yêu cầu (R1 MISMATCH HIGH), hôn nhân vẫn hợp lệ
    c = os.path.join(CASES_DIR, "KETHON_02_me_mismatch")
    chung_sinh(c, "HOÀNG MINH ANH", "LÊ THỊ SAI", KETHON_CHONG)
    copy_anchor(KETHON_ANCHOR, os.path.join(c, "02_giay-dang-ky-ket-hon_sample.jpg"))
    write_readme(c, "Khai sinh + Kết hôn — Tên mẹ trên giấy chứng sinh KHÔNG khớp",
                 ["01_giay-chung-sinh.jpg → slot 'Giấy chứng sinh' (Qwen)",
                  "02_giay-dang-ky-ket-hon_sample.jpg → slot 'GCN kết hôn' (VNPT thật)"],
                 [note,
                  "R1 MISMATCH HIGH: giấy chứng sinh mẹ 'LÊ THỊ SAI' ≠ người yêu cầu "
                  f"{KETHON_VO} → cảnh báo đỏ, trừ điểm nặng",
                  f"R3 MATCH: giấy kết hôn vợ = {KETHON_VO} = người yêu cầu (hôn nhân hợp lệ)",
                  "Minh hoạ xung đột giữa giấy chứng sinh và định danh dù kết hôn vẫn khớp"])
    print(f"  ✓ {os.path.relpath(c, ROOT)}")

    # CASE 3 — chỉ nộp giấy kết hôn (không có giấy chứng sinh): R1 SKIP, R3 MATCH
    c = os.path.join(CASES_DIR, "KETHON_03_chi_ket_hon")
    copy_anchor(KETHON_ANCHOR, os.path.join(c, "01_giay-dang-ky-ket-hon_sample.jpg"))
    write_readme(c, "Khai sinh + Kết hôn — CHỈ có giấy kết hôn (thiếu giấy chứng sinh)",
                 ["01_giay-dang-ky-ket-hon_sample.jpg → slot 'GCN kết hôn' (VNPT thật)"],
                 [note,
                  "R1 SKIPPED: không có giấy chứng sinh (skipIfMissing) → không trừ điểm R1",
                  f"R3 MATCH: giấy kết hôn vợ = {KETHON_VO} = người yêu cầu",
                  "treEm.hoTen rỗng → form dùng defaultValue '(Chưa đặt tên)'; "
                  "phuHuynh2.hoTen lấy từ chồng trên giấy kết hôn = " + KETHON_CHONG])
    print(f"  ✓ {os.path.relpath(c, ROOT)}")


# ─────────────────────────────────────────────────────────────────────────────
# CHUYEN_NHUONG_QSDD — cả sổ đỏ (GIAY_CHUNG_NHAN_QSDD) VÀ hợp đồng
# (HOP_DONG_CHUYEN_NHUONG) đều route Qwen VL → sinh ảnh tổng hợp thoải mái
# (Qwen đọc chuẩn label:value). File mẫu người dùng đưa KHÔNG dùng được:
#   - so-do-ben-chuyen-nhuong.jpg = symlink HỎNG (target DK_THUONG_TRU/... đã xoá)
#   - contract PDF = MẪU TRỐNG (toàn dấu chấm) cho tổ chức/dự án BĐS, không có dữ liệu
# Cross-check (requester = bên NHẬN/mua = eKYC account):
#   R1 cccd_nguoi_yeu_cau.hoTen == hop_dong.benNhanChuyenNhuong  (HIGH)
#   R2 so_do.tenChuSoHuu        == hop_dong.benChuyenNhuong      (HIGH)
#   R3 so_do.diaChiNha          ~= hop_dong.diaChiThuaDat        (MEDIUM, semantic)
#   R4 so_do.dienTich           == hop_dong.dienTich             (MEDIUM)
# Cả 2 giấy đều Qwen (ta điều khiển) → tạo mọi tổ hợp MATCH/MISMATCH.
# ─────────────────────────────────────────────────────────────────────────────
CN_BEN_NHAN = ACCOUNT_NAME          # bên mua = eKYC account (NGUYỄN ĐĂNG PHÚ) → R1 MATCH
CN_BEN_CHUYEN = "TRẦN VĂN MINH"     # bên bán = chủ sổ đỏ
CN_DIA_CHI = "Số 12 đường Nguyễn Trãi, phường Thanh Xuân, TP Hà Nội"
CN_DIEN_TICH = "120 m²"
CN_THUA = "42"
CN_TO = "15"
CN_SO_GCN = "CT 06821"


def so_do(case_dir: str, chu_so_huu: str, dia_chi: str, dien_tich: str):
    make_doc(
        os.path.join(case_dir, "01_so-do-ben-chuyen-nhuong.jpg"),
        "GIẤY CHỨNG NHẬN QUYỀN SỬ DỤNG ĐẤT",
        "Quyền sở hữu nhà ở và tài sản khác gắn liền với đất",
        {
            "Người sử dụng đất": chu_so_huu,
            "Số CCCD": "038090001234",
            "Địa chỉ thường trú": "Số 5 phố Vọng, phường Đồng Tâm, TP Hà Nội",
            "Địa chỉ thửa đất": dia_chi,
            "Thửa đất số": CN_THUA,
            "Tờ bản đồ số": CN_TO,
            "Diện tích": dien_tich,
            "Số giấy chứng nhận": CN_SO_GCN,
            "Mục đích sử dụng": "Đất ở tại đô thị",
            "Thời hạn sử dụng": "Lâu dài",
        },
    )


def hop_dong(case_dir: str, ben_chuyen: str, ben_nhan: str, dia_chi: str, dien_tich: str):
    """Hợp đồng dạng VĂN BẢN DÀY (giống mẫu thật): field CHÌM trong văn xuôi,
    bố cục Điều 1-5 + lời chứng công chứng → sát ca production của Qwen VL."""
    make_contract_doc(
        os.path.join(case_dir, "02_hop-dong-chuyen-nhuong.jpg"),
        "CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM",
        "HỢP ĐỒNG CHUYỂN NHƯỢNG QUYỀN SỬ DỤNG ĐẤT",
        [
            ("", [
                "Căn cứ Bộ luật Dân sự số 91/2015/QH13 ngày 24 tháng 11 năm 2015;",
                "Căn cứ Luật Đất đai số 31/2024/QH15 ngày 18 tháng 01 năm 2024;",
                "Hôm nay, ngày 01 tháng 7 năm 2026, tại Văn phòng công chứng Thanh Xuân, "
                "thành phố Hà Nội, chúng tôi gồm hai bên dưới đây thỏa thuận ký kết hợp đồng "
                "chuyển nhượng quyền sử dụng đất với các điều khoản sau:",
            ]),
            ("BÊN CHUYỂN NHƯỢNG (BÊN A):", [
                f"Ông/Bà: {ben_chuyen}. Sinh năm: 1978. Số CCCD: 038078009112 do Cục Cảnh sát "
                "QLHC về TTXH cấp ngày 12/3/2021. Địa chỉ thường trú: Số 5 phố Vọng, phường "
                "Đồng Tâm, thành phố Hà Nội. Là người sử dụng đất hợp pháp theo Giấy chứng nhận "
                f"quyền sử dụng đất số {CN_SO_GCN} do Sở Tài nguyên và Môi trường thành phố Hà Nội cấp.",
            ]),
            ("BÊN NHẬN CHUYỂN NHƯỢNG (BÊN B):", [
                f"Ông/Bà: {ben_nhan}. Sinh năm: 1990. Số CCCD: 001090012345. Địa chỉ thường trú: "
                "Số 27 phố Huế, phường Hàng Bài, thành phố Hà Nội.",
            ]),
            ("ĐIỀU 1. THÔNG TIN VỀ THỬA ĐẤT CHUYỂN NHƯỢNG", [
                f"Bên A đồng ý chuyển nhượng cho Bên B toàn bộ quyền sử dụng thửa đất tại địa chỉ: "
                f"{dia_chi}. Thửa đất số: {CN_THUA}. Tờ bản đồ số: {CN_TO}. "
                f"Diện tích: {dien_tich}. "
                "Mục đích sử dụng: Đất ở tại đô thị. Thời hạn sử dụng: Lâu dài. "
                "Nguồn gốc sử dụng: Nhận chuyển nhượng quyền sử dụng đất. "
                "Những hạn chế về quyền sử dụng đất: Không có.",
            ]),
            ("ĐIỀU 2. GIÁ CHUYỂN NHƯỢNG VÀ PHƯƠNG THỨC THANH TOÁN", [
                "Giá chuyển nhượng quyền sử dụng đất nêu tại Điều 1 là 2.500.000.000 đồng "
                "(bằng chữ: hai tỷ năm trăm triệu đồng). Bên B thanh toán cho Bên A một lần bằng "
                "chuyển khoản ngay sau khi hợp đồng được công chứng.",
            ]),
            ("ĐIỀU 3. QUYỀN VÀ NGHĨA VỤ CỦA CÁC BÊN", [
                "Bên A có nghĩa vụ giao giấy tờ và bàn giao thửa đất đúng hiện trạng cho Bên B. "
                "Bên B có nghĩa vụ thanh toán đủ và đúng hạn, thực hiện thủ tục đăng ký biến động "
                "đất đai theo quy định của pháp luật.",
            ]),
            ("ĐIỀU 4. ĐIỀU KHOẢN THI HÀNH", [
                "Hợp đồng có hiệu lực kể từ thời điểm được công chứng. Hai bên đã đọc lại, hiểu rõ "
                "và cùng ký tên dưới đây. Hợp đồng được lập thành 03 bản có giá trị pháp lý như nhau.",
            ]),
        ],
        [
            "BÊN CHUYỂN NHƯỢNG (Bên A)                    BÊN NHẬN CHUYỂN NHƯỢNG (Bên B)",
            f"     (Ký, ghi rõ họ tên)                            (Ký, ghi rõ họ tên)",
            f"      {ben_chuyen}                                   {ben_nhan}",
            "",
            "LỜI CHỨNG CỦA CÔNG CHỨNG VIÊN: Ngày 01/7/2026, tại Văn phòng công chứng Thanh Xuân, "
            "thành phố Hà Nội, tôi công chứng viên xác nhận hợp đồng này được giao kết tự nguyện, "
            "hai bên có đủ năng lực hành vi dân sự.",
        ],
    )


def gen_chuyen_nhuong_cases():
    print("CHUYEN_NHUONG_QSDD (sổ đỏ + hợp đồng — cả 2 Qwen VL):")
    note = (f"Người yêu cầu (eKYC) = bên nhận/mua = {CN_BEN_NHAN} "
            "(account demo NGUYỄN ĐĂNG PHÚ đã eKYC VERIFIED)")

    # CASE 1 — happy: mọi cross-check MATCH
    c = os.path.join(CASES_DIR, "CHUYENNHUONG_01_happy")
    so_do(c, CN_BEN_CHUYEN, CN_DIA_CHI, CN_DIEN_TICH)
    hop_dong(c, CN_BEN_CHUYEN, CN_BEN_NHAN, CN_DIA_CHI, CN_DIEN_TICH)
    write_readme(c, "Chuyển nhượng QSDĐ — Happy path (mọi cross-check MATCH)",
                 ["01_so-do-ben-chuyen-nhuong.jpg → slot 'Sổ đỏ bên chuyển nhượng' (Qwen)",
                  "02_hop-dong-chuyen-nhuong.jpg → slot 'Hợp đồng chuyển nhượng' (Qwen)"],
                 [note,
                  f"R1 MATCH: bên nhận trên hợp đồng = {CN_BEN_NHAN} = người yêu cầu",
                  f"R2 MATCH: chủ sổ đỏ = bên chuyển nhượng trên hợp đồng = {CN_BEN_CHUYEN}",
                  f"R3 MATCH: địa chỉ thửa đất khớp ({CN_DIA_CHI})",
                  f"R4 MATCH: diện tích khớp ({CN_DIEN_TICH})",
                  "Form điền: bên nhận (eKYC), thửa đất, bên chuyển nhượng, giá, ngày ký"])
    print(f"  ✓ {os.path.relpath(c, ROOT)}")

    # CASE 2 — chủ sổ đỏ ≠ bên bán trên hợp đồng (R2 MISMATCH HIGH: bán đất không phải của mình)
    c = os.path.join(CASES_DIR, "CHUYENNHUONG_02_ben_ban_mismatch")
    so_do(c, "LÊ VĂN HÙNG", CN_DIA_CHI, CN_DIEN_TICH)
    hop_dong(c, CN_BEN_CHUYEN, CN_BEN_NHAN, CN_DIA_CHI, CN_DIEN_TICH)
    write_readme(c, "Chuyển nhượng QSDĐ — Chủ sổ đỏ KHÔNG khớp bên bán trên hợp đồng",
                 ["01_so-do-ben-chuyen-nhuong.jpg → slot 'Sổ đỏ bên chuyển nhượng' (Qwen)",
                  "02_hop-dong-chuyen-nhuong.jpg → slot 'Hợp đồng chuyển nhượng' (Qwen)"],
                 [note,
                  "R2 MISMATCH HIGH: sổ đỏ đứng tên 'LÊ VĂN HÙNG' nhưng hợp đồng ghi "
                  f"bên chuyển nhượng '{CN_BEN_CHUYEN}' → dấu hiệu bán đất không thuộc "
                  "quyền sở hữu, cảnh báo đỏ, trừ điểm nặng",
                  "R1, R3, R4 vẫn MATCH"])
    print(f"  ✓ {os.path.relpath(c, ROOT)}")

    # CASE 3 — diện tích sổ đỏ ≠ hợp đồng (R4 MISMATCH MEDIUM)
    c = os.path.join(CASES_DIR, "CHUYENNHUONG_03_dientich_mismatch")
    so_do(c, CN_BEN_CHUYEN, CN_DIA_CHI, "120 m²")
    hop_dong(c, CN_BEN_CHUYEN, CN_BEN_NHAN, CN_DIA_CHI, "150 m²")
    write_readme(c, "Chuyển nhượng QSDĐ — Diện tích sổ đỏ KHÔNG khớp hợp đồng",
                 ["01_so-do-ben-chuyen-nhuong.jpg → slot 'Sổ đỏ bên chuyển nhượng' (Qwen)",
                  "02_hop-dong-chuyen-nhuong.jpg → slot 'Hợp đồng chuyển nhượng' (Qwen)"],
                 [note,
                  "R4 MISMATCH MEDIUM: sổ đỏ ghi 120 m² nhưng hợp đồng ghi 150 m² → "
                  "sai lệch thông tin thửa đất, trừ điểm",
                  "R1, R2, R3 vẫn MATCH"])
    print(f"  ✓ {os.path.relpath(c, ROOT)}")


if __name__ == "__main__":
    for f in (FONT_REGULAR, FONT_BOLD):
        if not os.path.exists(f):
            raise SystemExit(f"Thiếu font: {f} — cài: sudo apt install fonts-dejavu")
    anchor = os.path.join(SAMPLES, KETHON_ANCHOR)
    if not os.path.exists(anchor):
        raise SystemExit(
            f"Thiếu anchor giấy kết hôn: {anchor}\n"
            "  → rasterize từ PDF: pdftoppm -jpeg -r 200 -singlefile "
            "'giay-dang-ky-ket-hon_sample (1).pdf' giay-dang-ky-ket-hon_sample")
    if os.path.isdir(CASES_DIR):
        shutil.rmtree(CASES_DIR)
    print(f"Xuất case vào: {os.path.relpath(CASES_DIR, ROOT)}\n")
    gen_hkd_cases()
    gen_khai_sinh_cases()
    gen_ket_hon_cases()
    gen_chuyen_nhuong_cases()
    print("\nXong. Mỗi folder case có README.md ghi kết quả cross-check dự kiến.")
