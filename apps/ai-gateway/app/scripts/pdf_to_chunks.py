"""
Parse PDF văn bản luật → chunk JSON khớp format ingest.

Bạn tải PDF từ thuvienphapluat.vn (hoặc vbpl.vn) về, script này:
  1. Đọc text từ PDF (pypdf)
  2. Tách theo "Điều N." (regex)
  3. Chunk mỗi điều ~300-500 từ (nếu quá dài thì tách -chunk1/-chunk2)
  4. Gắn metadata (category, title, sourceVersion, chapter, section)
  5. Xuất JSON array khớp LegalChunk schema

Chạy:
    python -m app.scripts.pdf_to_chunks \
        data/legal-sources/pdf/luat-ho-tich-2014.pdf \
        --category HO_TICH \
        --title "Luật Hộ tịch 2014" \
        --version 2014 \
        --out data/legal-sources/chunks/luat-ho-tich-2014.json
"""

from __future__ import annotations

import argparse
import json
import re
from pathlib import Path

from pypdf import PdfReader


# Rác header/footer khi lưu PDF từ trình duyệt (Ctrl+P → Save as PDF):
#   "6/29/26, 2:21 PM about:blank", "about:blank", "1/8" (số trang)...
_NOISE_PATTERNS = [
    re.compile(r"\d{1,2}/\d{1,2}/\d{2,4},?\s*\d{1,2}:\d{2}\s*(AM|PM)", re.IGNORECASE),
    re.compile(r"about:blank", re.IGNORECASE),
    re.compile(r"https?://\S*thuvienphapluat\S*", re.IGNORECASE),
    re.compile(r"(?m)^\s*\d{1,3}/\d{1,3}\s*$"),  # số trang kiểu "3/8" đứng riêng
]


def clean_text(text: str) -> str:
    """Bỏ rác header/footer in từ trình duyệt + chuẩn hoá khoảng trắng."""
    for pat in _NOISE_PATTERNS:
        text = pat.sub(" ", text)
    # gộp nhiều khoảng trắng/xuống dòng thừa nhưng GIỮ xuống dòng đơn để tách điều
    text = re.sub(r"[ \t]+", " ", text)
    text = re.sub(r"\n{2,}", "\n", text)
    return text.strip()


def extract_text_from_pdf(pdf_path: Path) -> str:
    """Đọc toàn bộ text từ PDF (ghép tất cả trang), đã làm sạch."""
    reader = PdfReader(pdf_path)
    parts = [page.extract_text() for page in reader.pages]
    return clean_text("\n".join(p for p in parts if p))


# Heading Chương/Mục (để gắn context cho từng điều).
# Chương: số La Mã viết hoa ("Chương II") — tránh khớp "Chương này" trong tham chiếu.
# Mục: số + dấu chấm + tiêu đề VIẾT HOA ("Mục 1. ĐĂNG KÝ KHAI SINH") — tránh
#      khớp "tại Mục 1 Điều này".
_CHUONG_RE = re.compile(r"Chương\s+([IVXLCDM]+)\b", re.IGNORECASE)
_MUC_RE = re.compile(r"Mục\s+(\d+)\s*\.\s*([A-ZĐÀÁẢÃẠÂẦẤẨẪẬĂẰẮẲẴẶÈÉẺẼẸÊỀẾỂỄỆÌÍỈĨỊÒÓỎÕỌÔỒỐỔỖỘƠỜỚỞỠỢÙÚỦŨỤƯỪỨỬỮỰỲÝỶỸỴ ]{4,})")
_DIEU_RE = re.compile(r"Điều\s+(\d+)\s*\.")


def split_by_articles(text: str) -> list[tuple[str, str, str | None, str | None]]:
    """
    Tách text theo "Điều N." kèm context Chương/Mục.

    → [(article_name, content, chapter, section), ...]
    Duyệt tất cả heading (Chương/Mục/Điều) theo vị trí; mỗi Điều mang Chương &
    Mục gần nhất đứng trước nó.
    """
    # Gom mọi marker theo vị trí: (pos, loại, nhãn)
    markers: list[tuple[int, str, str]] = []
    for m in _CHUONG_RE.finditer(text):
        markers.append((m.start(), "chuong", f"Chương {m.group(1).upper()}"))
    for m in _MUC_RE.finditer(text):
        label = f"Mục {m.group(1)}. {m.group(2).strip()}"
        markers.append((m.start(), "muc", re.sub(r"\s+", " ", label)))
    dieu_markers = list(_DIEU_RE.finditer(text))
    for m in dieu_markers:
        markers.append((m.start(), "dieu", m.group(1)))

    if not any(t == "dieu" for _, t, _ in markers):
        return []

    markers.sort(key=lambda x: x[0])

    # Map vị trí Điều → (start_content, end_content) để cắt nội dung.
    dieu_pos = [(m.start(), m.end()) for m in dieu_markers]
    dieu_end = {start: dieu_pos[i + 1][0] if i + 1 < len(dieu_pos) else len(text)
                for i, (start, _) in enumerate(dieu_pos)}

    articles: list[tuple[str, str, str | None, str | None]] = []
    cur_chuong: str | None = None
    cur_muc: str | None = None
    for pos, kind, label in markers:
        if kind == "chuong":
            cur_chuong = label
            cur_muc = None  # Chương mới → reset Mục
        elif kind == "muc":
            cur_muc = label
        else:  # dieu
            end = dieu_end[pos]
            content_start = next(e for s, e in dieu_pos if s == pos)
            content = text[content_start:end].strip()
            articles.append((f"Điều {label}", content, cur_chuong, cur_muc))
    return articles


def chunk_long_article(article_name: str, content: str, max_words: int = 500) -> list[str]:
    """
    Nếu nội dung điều quá dài (> max_words), tách thành nhiều chunk.
    Mỗi chunk ~max_words, cắt theo câu để không cắt giữa câu.
    """
    words = content.split()
    if len(words) <= max_words:
        return [content]

    chunks: list[str] = []
    sentences = re.split(r"(?<=[.;])\s+", content)
    current: list[str] = []
    current_len = 0

    for sent in sentences:
        sent_words = len(sent.split())
        if current_len + sent_words > max_words and current:
            chunks.append(" ".join(current))
            current = [sent]
            current_len = sent_words
        else:
            current.append(sent)
            current_len += sent_words

    if current:
        chunks.append(" ".join(current))
    return chunks


def pdf_to_chunks(
    pdf_path: Path,
    category: str,
    title: str,
    source_version: str,
    status: str = "ACTIVE",
    effective_date: str | None = None,
) -> list[dict]:
    """
    Chuyển PDF → list[dict] chunk khớp LegalChunk.

    chunkId format: slug-dieu{N}-chunk{i}
    """
    text = extract_text_from_pdf(pdf_path)
    articles = split_by_articles(text)

    slug = re.sub(r"[^\w]+", "-", pdf_path.stem.lower()).strip("-")

    # Đếm số lần mỗi số điều xuất hiện — 1 số điều có thể lặp lại (vd phụ lục
    # biểu mẫu nhắc "Điều 29"). Lần thứ 2+ thêm hậu tố "-vN" để chunkId DUY NHẤT,
    # tránh trùng point_id khi upsert vào Qdrant (sẽ đè mất nhau).
    article_occurrence: dict[str, int] = {}

    chunks: list[dict] = []
    for article_name, content, chapter, section in articles:
        article_num = re.search(r"\d+", article_name).group() if re.search(r"\d+", article_name) else "0"
        article_occurrence[article_num] = article_occurrence.get(article_num, 0) + 1
        occ = article_occurrence[article_num]

        base_id = f"{slug}-dieu{article_num}"
        if occ > 1:
            base_id += f"-v{occ}"

        sub_chunks = chunk_long_article(article_name, content)

        for idx, chunk_text in enumerate(sub_chunks, start=1):
            chunk_id = f"{base_id}-chunk{idx}"

            chunks.append({
                "chunkId": chunk_id,
                "category": category,
                "title": title,
                "article": article_name,
                "chapter": chapter,
                "section": section,
                "sourceVersion": source_version,
                "text": chunk_text,
                "status": status,
                "effectiveDate": effective_date,
            })

    # Bảo hiểm: chunkId phải duy nhất (nếu không, upsert sẽ đè mất point).
    ids = [c["chunkId"] for c in chunks]
    if len(ids) != len(set(ids)):
        from collections import Counter
        dup = [k for k, v in Counter(ids).items() if v > 1]
        raise ValueError(f"chunkId bị trùng: {dup}")

    return chunks


def main() -> None:
    parser = argparse.ArgumentParser(description="Parse PDF văn bản luật → chunk JSON")
    parser.add_argument("pdf", type=Path, help="File PDF")
    parser.add_argument("--category", required=True, help="HO_TICH | CU_TRU | DAT_DAI | ...")
    parser.add_argument("--title", required=True, help="Tên văn bản")
    parser.add_argument("--version", required=True, help="Năm/phiên bản")
    parser.add_argument("--status", default="ACTIVE", help="ACTIVE | SUPERSEDED | REPEALED")
    parser.add_argument("--effective", help="Ngày có hiệu lực YYYY-MM-DD")
    parser.add_argument("--out", type=Path, help="File JSON đầu ra")
    args = parser.parse_args()

    if not args.pdf.is_file():
        raise FileNotFoundError(f"Không tìm thấy PDF: {args.pdf}")

    chunks = pdf_to_chunks(
        pdf_path=args.pdf,
        category=args.category,
        title=args.title,
        source_version=args.version,
        status=args.status,
        effective_date=args.effective,
    )

    out_path = args.out or args.pdf.with_suffix(".json")
    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text(json.dumps(chunks, ensure_ascii=False, indent=2), encoding="utf-8")

    print(f"Đã tạo {len(chunks)} chunk từ {len(set(c['article'] for c in chunks))} điều")
    print(f"→ {out_path}")


if __name__ == "__main__":
    main()
