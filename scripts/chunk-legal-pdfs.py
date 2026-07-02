#!/usr/bin/env python3
"""Convert the curated PDFs in ./pdf into Qdrant-ready legal chunk files."""

from __future__ import annotations

import json
import re
import subprocess
from dataclasses import dataclass
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
PDF_DIR = ROOT / "pdf"
OUTPUT_DIR = ROOT / "data" / "legal-sources" / "chunks" / "pdf"
MAX_WORDS = 420


@dataclass(frozen=True)
class Source:
    slug: str
    title: str
    version: str
    topic: str
    url: str
    effective_date: str | None = None


SOURCES: dict[str, Source] = {
    "2025_1105 + 1106_67-VBHN-VPQH.pdf": Source(
        "vbhn-67-2025-luat-doanh-nghiep",
        "Văn bản hợp nhất 67/VBHN-VPQH - Luật Doanh nghiệp",
        "67/VBHN-VPQH (15/08/2025)",
        "PHAP_LY_DOANH_NGHIEP",
        "https://congbao.chinhphu.vn/van-ban/van-ban-hop-nhat-so-67-vbhn-vpqh-45865/58269.htm",
    ),
    "2025_613 + 614_70-2025-NĐ-CP.pdf": Source(
        "nghi-dinh-70-2025-hoa-don",
        "Nghị định 70/2025/NĐ-CP về hóa đơn, chứng từ",
        "70/2025/NĐ-CP",
        "HOA_DON",
        "https://congbao.chinhphu.vn/van-ban/nghi-dinh-so-70-2025-nd-cp-44623.htm",
        "2025-06-01",
    ),
    "2025_65 + 66_86-2024-TT-BTC.pdf": Source(
        "thong-tu-86-2024-dang-ky-thue",
        "Thông tư 86/2024/TT-BTC về đăng ký thuế",
        "86/2024/TT-BTC",
        "DANG_KY_THUE",
        "https://congbao.chinhphu.vn/van-ban/thong-tu-so-86-2024-tt-btc-43707.htm",
        "2025-02-06",
    ),
    "2025_765 + 766_32-2025-TT-BTC.pdf": Source(
        "thong-tu-32-2025-hoa-don",
        "Thông tư 32/2025/TT-BTC hướng dẫn hóa đơn, chứng từ",
        "32/2025/TT-BTC",
        "HOA_DON",
        "https://congbao.chinhphu.vn/noi-dung-van-ban-so-32-2025-tt-btc-45039",
        "2025-06-01",
    ),
    "2025_885 + 886_168-2025-NĐ-CP.pdf": Source(
        "nghi-dinh-168-2025-dang-ky-kinh-doanh",
        "Nghị định 168/2025/NĐ-CP về đăng ký doanh nghiệp",
        "168/2025/NĐ-CP",
        "DANG_KY_HKD",
        "https://congbao.chinhphu.vn/van-ban/nghi-dinh-so-168-2025-nd-cp-45354.htm",
        "2025-07-01",
    ),
    "2025_985 + 986_68-2025-TT-BTC.pdf": Source(
        "thong-tu-68-2025-bieu-mau-dang-ky",
        "Thông tư 68/2025/TT-BTC về biểu mẫu đăng ký kinh doanh",
        "68/2025/TT-BTC",
        "BIEU_MAU_HKD",
        "https://congbao.chinhphu.vn/van-ban/thong-tu-so-68-2025-tt-btc-45617/57815.htm",
        "2025-07-01",
    ),
    "2026_152_68_2026_NĐ-CP.pdf": Source(
        "nghi-dinh-68-2026-thue-hkd",
        "Nghị định 68/2026/NĐ-CP về chính sách thuế đối với hộ kinh doanh",
        "68/2026/NĐ-CP",
        "THUE_HKD",
        "https://congbao.chinhphu.vn/van-ban/nghi-dinh-so-68-2026-nd-cp-469047.htm",
        "2026-03-05",
    ),
    "2026_272_141_2026_NĐ-CP.pdf": Source(
        "nghi-dinh-141-2026-sua-doi-thue-hkd",
        "Nghị định 141/2026/NĐ-CP sửa đổi chính sách thuế hộ kinh doanh",
        "141/2026/NĐ-CP",
        "THUE_HKD",
        "https://congbao.chinhphu.vn/van-ban/nghi-dinh-so-141-2026-nd-cp-469455/64634.htm",
        "2026-01-01",
    ),
    "2026_302_112_VBHN-VPQH.pdf": Source(
        "vbhn-112-2026-luat-thue-thu-nhap-ca-nhan",
        "Văn bản hợp nhất 112/VBHN-VPQH - Luật Thuế thu nhập cá nhân",
        "112/VBHN-VPQH (20/05/2026)",
        "THUE_HKD",
        "https://congbao.chinhphu.vn/van-ban/van-ban-hop-nhat-so-112-vbhn-vpqh-469595.htm",
    ),
    "2026_305_114_VBHN-VPQH.pdf": Source(
        "vbhn-114-2026-luat-thue-gia-tri-gia-tang",
        "Văn bản hợp nhất 114/VBHN-VPQH - Luật Thuế giá trị gia tăng",
        "114/VBHN-VPQH (20/05/2026)",
        "THUE_HKD",
        "https://congbao.chinhphu.vn/van-ban/van-ban-hop-nhat-so-114-vbhn-vpqh-469597.htm",
    ),
    "2026_38_108_2025_QH15.pdf": Source(
        "luat-108-2025-quan-ly-thue",
        "Luật Quản lý thuế 108/2025/QH15",
        "108/2025/QH15",
        "QUAN_LY_THUE",
        "https://congbao.chinhphu.vn/van-ban/luat-so-108-2025-qh15-468670/61635.htm",
        "2026-07-01",
    ),
    "2026_42_143_2025_QH15.pdf": Source(
        "luat-143-2025-dau-tu",
        "Luật Đầu tư 143/2025/QH15",
        "143/2025/QH15",
        "NGANH_NGHE",
        "https://congbao.chinhphu.vn/van-ban/luat-so-143-2025-qh15-468703/61729.htm",
        "2026-03-01",
    ),
}


ARTICLE_RE = re.compile(r"(?m)^\s*Điều\s+(\d+[A-Za-z]?)\s*\.")
NOISE_RE = [
    re.compile(r"(?m)^\s*\d+\s+CÔNG BÁO/Số[^\n]*$"),
    re.compile(r"(?m)^\s*CÔNG BÁO/Số[^\n]*$"),
    re.compile(r"(?m)^\s*\d+\s*$"),
    re.compile(r"(?m)^\s*Người ký: CỔNG THÔNG TIN ĐIỆN TỬ CHÍNH PHỦ\s*$"),
]


def extract_text(path: Path) -> str:
    result = subprocess.run(
        ["pdftotext", "-nopgbrk", str(path), "-"],
        check=True,
        capture_output=True,
        text=True,
    )
    text = result.stdout.replace("\f", "\n")
    for pattern in NOISE_RE:
        text = pattern.sub("", text)
    text = re.sub(r"[ \t]+", " ", text)
    text = re.sub(r"\n{3,}", "\n\n", text)
    return text.strip()


def split_sections(text: str) -> list[tuple[str, str, int]]:
    matches = list(ARTICLE_RE.finditer(text))
    sections: list[tuple[str, str, int]] = []
    if not matches:
        return [("Toàn văn", text, 1)]
    prefix = text[: matches[0].start()].strip()
    if len(prefix.split()) >= 40:
        sections.append(("Phần đầu văn bản", prefix, 1))
    occurrences: dict[str, int] = {}
    for index, match in enumerate(matches):
        number = match.group(1)
        occurrences[number] = occurrences.get(number, 0) + 1
        end = matches[index + 1].start() if index + 1 < len(matches) else len(text)
        sections.append((f"Điều {number}", text[match.start() : end].strip(), occurrences[number]))
    return sections


def chunk_text(text: str) -> list[str]:
    words = text.split()
    if len(words) <= MAX_WORDS:
        return [text]
    sentences = re.split(r"(?<=[.;:])\s+|\n+", text)
    chunks: list[str] = []
    current: list[str] = []
    size = 0
    for sentence in sentences:
        sentence = sentence.strip()
        if not sentence:
            continue
        sentence_size = len(sentence.split())
        if current and size + sentence_size > MAX_WORDS:
            chunks.append(" ".join(current))
            current = []
            size = 0
        current.append(sentence)
        size += sentence_size
    if current:
        chunks.append(" ".join(current))
    balanced: list[str] = []
    for chunk in chunks:
        # Avoid tiny trailing fragments created by a long final clause.
        if balanced and len(chunk.split()) < 80:
            balanced[-1] = f"{balanced[-1]} {chunk}"
        else:
            balanced.append(chunk)
    return balanced


def build_chunks(path: Path, source: Source) -> list[dict]:
    chunks: list[dict] = []
    for article, content, occurrence in split_sections(extract_text(path)):
        article_number = re.search(r"\d+[A-Za-z]?", article)
        article_key = (
            f"dieu{article_number.group()}"
            if article_number
            else re.sub(r"[^0-9A-Za-z]+", "-", article.lower()).strip("-")
        )
        occurrence_suffix = f"-v{occurrence}" if occurrence > 1 else ""
        for number, chunk in enumerate(chunk_text(content), 1):
            chunks.append(
                {
                    "chunkId": f"pdf-{source.slug}-{article_key}{occurrence_suffix}-chunk{number}",
                    "category": "HO_KINH_DOANH",
                    "topic": source.topic,
                    "title": source.title,
                    "article": article,
                    "url": source.url,
                    "sourceVersion": source.version,
                    "sourceFile": path.name,
                    "status": "ACTIVE",
                    "effectiveDate": source.effective_date,
                    "text": chunk,
                }
            )
    ids = [chunk["chunkId"] for chunk in chunks]
    if len(ids) != len(set(ids)):
        raise RuntimeError(f"Trùng chunkId trong {path.name}")
    return chunks


def main() -> None:
    actual_files = {path.name for path in PDF_DIR.glob("*.pdf")}
    missing_metadata = sorted(actual_files - SOURCES.keys())
    missing_files = sorted(SOURCES.keys() - actual_files)
    if missing_metadata or missing_files:
        raise RuntimeError(
            f"PDF chưa có metadata={missing_metadata}; metadata thiếu PDF={missing_files}"
        )

    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    for stale in OUTPUT_DIR.glob("*.json"):
        stale.unlink()

    total = 0
    for filename, source in SOURCES.items():
        chunks = build_chunks(PDF_DIR / filename, source)
        destination = OUTPUT_DIR / f"{source.slug}.json"
        destination.write_text(
            json.dumps(chunks, ensure_ascii=False, indent=2) + "\n",
            encoding="utf-8",
        )
        total += len(chunks)
        print(f"{filename}: {len(chunks)} chunks")
    print(f"Generated {total} PDF legal chunks in {OUTPUT_DIR}")


if __name__ == "__main__":
    main()
