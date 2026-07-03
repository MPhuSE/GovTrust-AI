#!/usr/bin/env python3
"""
Chunk 6 PDF legal sources (HỘ TỊCH + ĐẤT ĐAI) into JSON files
Uses pdftotext to extract text, then splits by articles
"""

import json
import re
import subprocess
from pathlib import Path
from typing import List, Dict

# Paths
ROOT = Path(__file__).resolve().parents[1]
PDF_DIR = ROOT / "data" / "legal-sources" / "pdf"
OUTPUT_DIR = ROOT / "data" / "legal-sources" / "chunks"

# PDF metadata
PDF_SOURCES = {
    # HỘ TỊCH
    "ho-tich/luat-60-2014-ho-tich.pdf": {
        "slug": "luat-ho-tich-2014",
        "title": "Luật Hộ tịch 2014",
        "version": "60/2014/QH13",
        "category": "HO_TICH",
        "url": "https://thuvienphapluat.vn/van-ban/Quyen-dan-su/Luat-ho-tich-2014-259034.aspx",
        "articles": [16, 17, 18, 19, 20, 21, 22, 23, 24, 25],  # Điều cần chunk
    },
    "ho-tich/nghi-dinh-123-2015-huong-dan-ho-tich.pdf": {
        "slug": "nghi-dinh-123-2015-ho-tich",
        "title": "Nghị định 123/2015/NĐ-CP hướng dẫn Luật Hộ tịch",
        "version": "123/2015/NĐ-CP",
        "category": "HO_TICH",
        "url": "https://thuvienphapluat.vn/van-ban/Quyen-dan-su/Nghi-dinh-123-2015-ND-CP-huong-dan-Luat-Ho-tich-297696.aspx",
        "articles": [8, 9, 10, 11, 12, 13, 14, 15],
    },
    "ho-tich/thong-tu-56-2017-giay-chung-sinh.pdf": {
        "slug": "thong-tu-56-2017-giay-chung-sinh",
        "title": "Thông tư 56/2017/TT-BYT về Giấy chứng sinh",
        "version": "56/2017/TT-BYT",
        "category": "HO_TICH",
        "url": "https://thuvienphapluat.vn/van-ban/The-thao-Y-te/Thong-tu-56-2017-TT-BYT-huong-dan-quan-ly-cong-tac-san-367894.aspx",
        "articles": None,  # Chunk by sections
    },

    # ĐẤT ĐAI
    "dat-dai/luat-31-2024-dat-dai.pdf": {
        "slug": "luat-dat-dai-2024",
        "title": "Luật Đất đai 2024",
        "version": "31/2024/QH15",
        "category": "DAT_DAI",
        "url": "https://thuvienphapluat.vn/van-ban/Bat-dong-san/Luat-Dat-dai-2024-606129.aspx",
        "articles": [188, 189, 190, 191, 192, 193, 194, 195, 196, 197, 198, 199, 200],
    },
    "dat-dai/nghi-dinh-120-2025-dang-ky-dat-dai.pdf": {
        "slug": "nghi-dinh-120-2025-dat-dai",
        "title": "Nghị định 120/2025/NĐ-CP về đăng ký đất đai",
        "version": "120/2025/NĐ-CP",
        "category": "DAT_DAI",
        "url": "https://thuvienphapluat.vn/van-ban/Bat-dong-san/Nghi-dinh-120-2025-ND-CP-dang-ky-bien-dong-dat-dai-nha-o-tai-san-gan-lien-voi-dat-605943.aspx",
        "articles": [10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20],
    },
    "dat-dai/thong-tu-24-2014-mau-don-dat-dai.pdf": {
        "slug": "thong-tu-24-2014-dat-dai",
        "title": "Thông tư 24/2014/TT-BTNMT về đăng ký đất đai",
        "version": "24/2014/TT-BTNMT",
        "category": "DAT_DAI",
        "url": "https://thuvienphapluat.vn/van-ban/Bat-dong-san/Thong-tu-24-2014-TT-BTNMT-huong-dan-dang-ky-bien-dong-dat-dai-tai-san-gan-lien-voi-dat-246860.aspx",
        "articles": None,  # Chunk by sections
    },
}


def extract_text_from_pdf(pdf_path: Path) -> str:
    """Extract text from PDF using pdftotext"""
    try:
        result = subprocess.run(
            ["pdftotext", "-layout", str(pdf_path), "-"],
            capture_output=True,
            text=True,
            check=True
        )
        return result.stdout
    except subprocess.CalledProcessError as e:
        print(f"❌ Error extracting {pdf_path.name}: {e}")
        return ""


def split_by_article(text: str, article_numbers: List[int] = None) -> Dict[str, str]:
    """Split text by article numbers"""
    chunks = {}

    # Regex pattern: "Điều 16." or "Điều 16:" or "Điều 16 -"
    pattern = r'Điều\s+(\d+)[\.:\-\s]'

    matches = list(re.finditer(pattern, text, re.MULTILINE))

    for i, match in enumerate(matches):
        article_num = int(match.group(1))

        # Skip if not in target articles
        if article_numbers and article_num not in article_numbers:
            continue

        start = match.start()
        end = matches[i + 1].start() if i + 1 < len(matches) else len(text)

        article_text = text[start:end].strip()

        # Clean up text
        article_text = re.sub(r'\n\s*\n\s*\n+', '\n\n', article_text)  # Remove multiple blank lines
        article_text = re.sub(r'\s+', ' ', article_text)  # Normalize whitespace

        # Skip if too short
        if len(article_text) < 50:
            continue

        chunks[f"dieu_{article_num}"] = article_text

    return chunks


def split_by_sections(text: str) -> Dict[str, str]:
    """Split text by sections (for Thông tư without clear articles)"""
    chunks = {}

    # Split by "Chương", "Mục", "Phụ lục"
    patterns = [
        r'(Chương\s+[IVX]+|CHƯƠNG\s+[IVX]+)',
        r'(Mục\s+\d+|MỤC\s+\d+)',
        r'(Phụ lục\s+\d+|PHỤ LỤC\s+\d+)',
    ]

    for pattern in patterns:
        matches = list(re.finditer(pattern, text, re.MULTILINE))

        for i, match in enumerate(matches):
            section_name = match.group(1).strip()
            start = match.start()
            end = matches[i + 1].start() if i + 1 < len(matches) else len(text)

            section_text = text[start:end].strip()

            # Clean up
            section_text = re.sub(r'\n\s*\n\s*\n+', '\n\n', section_text)
            section_text = re.sub(r'\s+', ' ', section_text)

            if len(section_text) < 100:
                continue

            section_slug = re.sub(r'[^\w\s-]', '', section_name.lower())
            section_slug = re.sub(r'[-\s]+', '-', section_slug)

            chunks[section_slug] = section_text

    return chunks


def create_chunks(pdf_path: Path, metadata: Dict) -> List[Dict]:
    """Create JSON chunks for a PDF"""
    print(f"\n📄 Processing: {pdf_path.name}")

    # Extract text
    text = extract_text_from_pdf(pdf_path)
    if not text:
        print(f"  ⚠️  No text extracted")
        return []

    print(f"  📝 Extracted {len(text)} characters")

    # Split by articles or sections
    if metadata.get("articles"):
        chunks_dict = split_by_article(text, metadata["articles"])
        print(f"  ✂️  Split into {len(chunks_dict)} articles")
    else:
        chunks_dict = split_by_sections(text)
        print(f"  ✂️  Split into {len(chunks_dict)} sections")

    # Create JSON chunks
    result = []
    for chunk_key, chunk_text in chunks_dict.items():
        # Generate chunk ID
        chunk_id = f"{metadata['slug']}-{chunk_key}"

        # Extract article number if available
        article_match = re.search(r'Điều\s+(\d+)', chunk_text)
        article = f"Điều {article_match.group(1)}" if article_match else chunk_key

        chunk = {
            "chunkId": chunk_id,
            "category": metadata["category"],
            "title": metadata["title"],
            "article": article,
            "url": metadata["url"],
            "sourceVersion": metadata["version"],
            "text": chunk_text[:5000],  # Limit to 5000 chars
        }

        result.append(chunk)

    return result


def main():
    print("🔧 Chunking legal PDFs into JSON files\n")

    # Create output directory
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    total_chunks = 0

    # Process each PDF
    for pdf_rel_path, metadata in PDF_SOURCES.items():
        pdf_path = PDF_DIR / pdf_rel_path

        if not pdf_path.exists():
            print(f"❌ File not found: {pdf_path}")
            continue

        # Create chunks
        chunks = create_chunks(pdf_path, metadata)

        if not chunks:
            continue

        # Save to JSON file
        output_file = OUTPUT_DIR / f"{metadata['slug']}.json"
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(chunks, f, ensure_ascii=False, indent=2)

        print(f"  💾 Saved {len(chunks)} chunks to {output_file.name}")
        total_chunks += len(chunks)

    print(f"\n✅ Done! Total chunks: {total_chunks}")
    print(f"📁 Output directory: {OUTPUT_DIR}")


if __name__ == "__main__":
    main()
