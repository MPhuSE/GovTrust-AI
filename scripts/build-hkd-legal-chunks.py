#!/usr/bin/env python3
"""Build curated household-business legal chunks from the official decree text."""

from __future__ import annotations

import json
import gzip
import re
from html.parser import HTMLParser
from pathlib import Path
from urllib.request import Request, urlopen


ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "data" / "legal-sources" / "chunks"
SOURCE_URL = (
    "https://xaydungchinhsach.chinhphu.vn/"
    "toan-van-nghi-dinh-168-2025-nd-cp-ve-dang-ky-doanh-nghiep-"
    "119250702175708554.htm"
)
ARTICLES = (82, 83, 84, 85, 86, 87, 91, 93, 99, 100, 101, 103, 104, 110, 113, 116)
MAX_CHUNK_CHARS = 2_800


class BlockTextParser(HTMLParser):
    BLOCK_TAGS = {"h1", "h2", "h3", "h4", "p"}

    def __init__(self) -> None:
        super().__init__()
        self.current_tag: str | None = None
        self.current: list[str] = []
        self.blocks: list[str] = []

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        if tag in self.BLOCK_TAGS and self.current_tag is None:
            self.current_tag = tag
            self.current = []

    def handle_data(self, data: str) -> None:
        if self.current_tag is not None:
            self.current.append(data)

    def handle_endtag(self, tag: str) -> None:
        if tag != self.current_tag:
            return
        text = re.sub(r"\s+", " ", " ".join(self.current)).strip()
        if text:
            self.blocks.append(text)
        self.current_tag = None
        self.current = []


def fetch_official_text() -> str:
    request = Request(SOURCE_URL, headers={"User-Agent": "GovTrust-AI legal indexer"})
    with urlopen(request, timeout=30) as response:
        body = response.read()
    if body.startswith(b"\x1f\x8b"):
        body = gzip.decompress(body)
    html = body.decode("utf-8")
    parser = BlockTextParser()
    parser.feed(html)
    return "\n".join(parser.blocks)


def extract_article(full_text: str, article: int) -> str:
    start_token = f"Điều {article}."
    start = full_text.find(start_token)
    if start < 0:
        raise ValueError(f"Không tìm thấy {start_token}")
    next_match = re.search(r"\nĐiều \d+\.", full_text[start + len(start_token) :])
    end = len(full_text) if next_match is None else start + len(start_token) + next_match.start()
    return full_text[start:end].strip()


def split_article(text: str) -> list[str]:
    paragraphs = [part.strip() for part in text.splitlines() if part.strip()]
    chunks: list[str] = []
    current: list[str] = []
    current_size = 0
    for paragraph in paragraphs:
        extra = len(paragraph) + (1 if current else 0)
        if current and current_size + extra > MAX_CHUNK_CHARS:
            chunks.append("\n".join(current))
            current = []
            current_size = 0
        current.append(paragraph)
        current_size += extra
    if current:
        chunks.append("\n".join(current))
    return chunks


def main() -> None:
    full_text = fetch_official_text()
    OUTPUT.mkdir(parents=True, exist_ok=True)
    for stale in OUTPUT.glob("nghi-dinh-168-2025-dieu*-chunk*.json"):
        stale.unlink()

    count = 0
    for article in ARTICLES:
        for chunk_number, text in enumerate(split_article(extract_article(full_text, article)), 1):
            chunk_id = f"nghi-dinh-168-2025-dieu{article}-chunk{chunk_number}"
            payload = {
                "chunkId": chunk_id,
                "category": "HO_KINH_DOANH",
                "title": "Nghị định 168/2025/NĐ-CP về đăng ký doanh nghiệp",
                "article": f"Điều {article}",
                "url": SOURCE_URL,
                "sourceVersion": "168/2025/NĐ-CP (hiệu lực 01/07/2025)",
                "text": text,
            }
            destination = OUTPUT / f"{chunk_id}.json"
            destination.write_text(
                json.dumps(payload, ensure_ascii=False, indent=2) + "\n",
                encoding="utf-8",
            )
            count += 1
    print(f"Generated {count} HO_KINH_DOANH legal chunks in {OUTPUT}")


if __name__ == "__main__":
    main()
