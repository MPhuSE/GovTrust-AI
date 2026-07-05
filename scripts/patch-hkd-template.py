#!/usr/bin/env python3
"""Sửa HKD_THAY_DOI.docx: đổi placeholder MỤC 2 (chủ hộ MỚI) sang tên riêng.

Lý do: template dùng lại {{chuHoCu.soCCCD}} / {{chuHoCu.hanSuDung}} / {{diaChiThuongTru.*}}
cho CẢ mục 1 (chủ hộ cũ) LẪN mục 2 (chủ hộ mới). docxtemplater bind 1 tên = 1 giá trị
toàn tài liệu → mục 2 lặp dữ liệu chủ hộ cũ. Đổi placeholder mục 2 thành tên riêng.

CÁCH LÀM (đáng tin, không đếm occurrence dễ sai):
Chia document.xml tại ranh giới "sau khi thay đổi" (tiêu đề Mục 2). Mọi placeholder
Mục 1 nằm TRƯỚC ranh giới, Mục 2 nằm SAU. Chỉ thay trong phần SAU → Mục 1 an toàn.
Placeholder liền mạch trong XML (không tách run) nên string-replace an toàn.

Chạy: apps/ai-svc/.venv/bin/python scripts/patch-hkd-template.py
"""

import re
import shutil
import zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DOCX = ROOT / "template" / "renderable" / "HKD_THAY_DOI.docx"
BACKUP = DOCX.with_suffix(".docx.bak")

# Tiêu đề Mục 2 — ranh giới. Mọi placeholder chủ-hộ-mới nằm sau chuỗi này.
BOUNDARY = "sau khi thay đổi"

# Placeholder Mục 2 cần đổi (chỉ những cái Mục 2 THỰC SỰ có; ngayCap/noiCap Mục 2 là ô trống).
REPLACEMENTS = [
    ("{{chuHoCu.soCCCD}}", "{{chuHoMoi.soCCCD}}"),
    ("{{chuHoCu.hanSuDung}}", "{{chuHoMoi.hanSuDung}}"),
    ("{{diaChiThuongTru.soNha}}", "{{diaChiThuongTruMoi.soNha}}"),
    ("{{diaChiThuongTru.xaPhuong}}", "{{diaChiThuongTruMoi.xaPhuong}}"),
    ("{{diaChiThuongTru.quanHuyen}}", "{{diaChiThuongTruMoi.quanHuyen}}"),
    ("{{diaChiThuongTru.tinhThanh}}", "{{diaChiThuongTruMoi.tinhThanh}}"),
]

# Các dòng nhân thân (họ tên/giới tính/sinh ngày/dân tộc/quốc tịch) trong template
# CHỈ là dấu chấm literal, KHÔNG có placeholder → data có mà không có chỗ điền.
# Chèn placeholder vào đúng run. Mỗi chuỗi dưới đây DUY NHẤT trong tài liệu (mục 1
# và mục 2 khác số dấu chấm) → replace an toàn, không cần đếm occurrence.
NB = " "  # non-breaking space giữ nguyên như trong docx
PERSON_BLOCKS = [
    # Mục 1 — chủ hộ CŨ (chuHoCu)
    (f"): ............................................... {NB}Giới tính: ....................",
     f"): {{{{chuHoCu.hoTen}}}} {NB}Giới tính: {{{{chuHoCu.gioiTinh}}}}"),
    (f"Sinh ngày: ........./....../........ Dân tộc: ...... {NB}Quốc tịch: ....................",
     f"Sinh ngày: {{{{chuHoCu.ngaySinh}}}} Dân tộc: {{{{chuHoCu.danToc}}}} {NB}Quốc tịch: {{{{chuHoCu.quocTich}}}}"),
    # Mục 2 — chủ hộ MỚI (chuHoMoi)
    (f"): ..................................................... {NB}Giới tính: ……….",
     f"): {{{{chuHoMoi.hoTen}}}} {NB}Giới tính: {{{{chuHoMoi.gioiTinh}}}}"),
    (f"Sinh ngày: ................ /............... /........... Dân tộc: ........................ {NB}Quốc tịch: ............",
     f"Sinh ngày: {{{{chuHoMoi.ngaySinh}}}} Dân tộc: {{{{chuHoMoi.danToc}}}} {NB}Quốc tịch: {{{{chuHoMoi.quocTich}}}}"),
]


def raw_index_at_plain(xml: str, target_plain: int) -> int:
    """Trả raw-index trong xml ứng với vị trí thứ `target_plain` của text đã bỏ tag."""
    plain_len, i, n = 0, 0, len(xml)
    while i < n:
        if xml[i] == "<":
            j = xml.find(">", i)
            if j == -1:
                break
            i = j + 1
        else:
            plain_len += 1
            if plain_len >= target_plain:
                return i + 1
            i += 1
    return n


def main() -> int:
    if not DOCX.exists():
        print(f"✗ Không thấy {DOCX}")
        return 1

    # Luôn patch từ bản gốc: nếu có backup thì khôi phục trước (idempotent).
    if BACKUP.exists():
        shutil.copyfile(BACKUP, DOCX)
        print(f"• Khôi phục bản gốc từ {BACKUP.name} trước khi patch")
    else:
        shutil.copyfile(DOCX, BACKUP)
        print(f"✓ Backup: {BACKUP.relative_to(ROOT)}")

    with zipfile.ZipFile(DOCX) as z:
        names = z.namelist()
        blobs = {n: z.read(n) for n in names}

    xml = blobs["word/document.xml"].decode("utf-8")

    plain = re.sub(r"<[^>]+>", "", xml)
    b_plain = plain.lower().find(BOUNDARY.lower())
    if b_plain == -1:
        print(f"✗ Không tìm thấy ranh giới '{BOUNDARY}' — hủy để tránh sửa nhầm")
        return 1
    split = raw_index_at_plain(xml, b_plain)
    head, tail = xml[:split], xml[split:]
    print(f"• Ranh giới Mục 2 tại plain-pos {b_plain} (raw {split})")

    for old, new in REPLACEMENTS:
        n_head = head.count(old)   # phải giữ nguyên ở Mục 1
        n_tail = tail.count(old)
        tail = tail.replace(old, new)
        print(f"  {old} → {new}: Mục 2 đổi {n_tail} | Mục 1 giữ {n_head}")

    # Chèn placeholder vào các dòng nhân thân (áp trên toàn XML, mỗi chuỗi duy nhất).
    xml_full = head + tail
    print("• Chèn placeholder dòng nhân thân:")
    for old, new in PERSON_BLOCKS:
        n = xml_full.count(old)
        xml_full = xml_full.replace(old, new)
        label = new.split("}}")[0].split("{{")[-1] if "{{" in new else new[:20]
        print(f"    {label}...: {n} chỗ" + ("" if n == 1 else "  ⚠️ KỲ VỌNG 1"))

    blobs["word/document.xml"] = xml_full.encode("utf-8")

    with zipfile.ZipFile(DOCX, "w", zipfile.ZIP_DEFLATED) as z:
        for n in names:
            z.writestr(n, blobs[n])

    print(f"✓ Đã ghi {DOCX.relative_to(ROOT)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
